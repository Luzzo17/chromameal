import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import Week from './Week'
import ScheduleEventForm from './ScheduleEventForm'
import { ApiError } from '../lib/api'
import { createScheduleEvent, deleteScheduleEvent, getScheduleEvents, updateScheduleEvent } from '../lib/schedule'
import type { ScheduleEvent, ScheduleEventInput } from '../lib/schedule'
import { currentMonday, italianDateTime, italianTimeToUtc, shiftDate } from '../lib/scheduleDates'

const names = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica']
const hours = Array.from({ length: 24 }, (_, index) => index)
const eventLabel = (event: ScheduleEvent) => event.type === 'work' ? 'Lavoro' : 'Impegno'
const shortDate = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('it-IT', { timeZone: 'UTC', day: 'numeric', month: 'short' })

function segmentsForDay(events: ScheduleEvent[], date: string) {
  const from = Date.parse(italianTimeToUtc(`${date}T00:00`))
  const until = Date.parse(italianTimeToUtc(`${shiftDate(date, 1)}T00:00`))
  return events.filter(event => Date.parse(event.starts_at) < until && Date.parse(event.ends_at) > from)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .map(event => {
      const startTime = italianDateTime(event.starts_at).slice(11)
      const endTime = italianDateTime(event.ends_at).slice(11)
      const hour = (time: string) => Number(time.slice(0, 2)) + Number(time.slice(3)) / 60
      const start = Date.parse(event.starts_at) <= from ? 0 : hour(startTime)
      const end = Date.parse(event.ends_at) >= until ? 24 : hour(endTime)
      return { event, start, end: Math.max(end, start + 0.25) }
    })
}

export default function SchedulePlanner() {
  const [weekStart, setWeekStart] = useState(currentMonday)
  return <ScheduleWeek key={weekStart} weekStart={weekStart} onWeekChange={setWeekStart} />
}

function ScheduleWeek({ weekStart, onWeekChange }: { weekStart: string; onWeekChange: (date: string) => void }) {
  const [events, setEvents] = useState<ScheduleEvent[] | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [needsLogin, setNeedsLogin] = useState(false)
  const [busy, setBusy] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [editor, setEditor] = useState<{ event: ScheduleEvent | null; date: string } | null>(null)
  const editorPanel = useRef<HTMLDivElement>(null)
  const weekEnd = shiftDate(weekStart, 6)
  const days = names.map((title, index) => {
    const date = shiftDate(weekStart, index)
    return { id: date, title, dateLabel: shortDate(date) }
  })

  useEffect(() => {
    let active = true
    getScheduleEvents(weekStart, weekEnd)
      .then(response => {
        if (active) { setEvents(response.data); setError(''); setNeedsLogin(false) }
      })
      .catch(reason => {
        if (!active) return
        const unauthorized = reason instanceof ApiError && reason.status === 401
        setNeedsLogin(unauthorized)
        if (unauthorized) setEvents(null)
        setError(unauthorized ? 'Accedi per organizzare turni e impegni.' : 'Impossibile caricare gli eventi. Controlla la connessione e riprova.')
      })
    return () => { active = false }
  }, [weekStart, weekEnd, attempt])

  function showError(reason: unknown) {
    setMessage('')
    if (reason instanceof ApiError && (reason.status === 401 || reason.status === 419)) {
      setEvents(null)
      setEditor(null)
      setNeedsLogin(true)
      setError('La sessione è scaduta. Accedi di nuovo.')
    } else if (reason instanceof ApiError && reason.status === 422) {
      setError(Object.values(reason.errors).flat().join(' ') || reason.message)
    } else {
      setError('Operazione non riuscita. Ricarica gli eventi per verificarne lo stato prima di riprovare.')
    }
  }

  async function save(input: ScheduleEventInput) {
    if (busy || !editor) return
    setBusy(true)
    setError('')
    try {
      const response = editor.event
        ? await updateScheduleEvent(editor.event.id, input)
        : await createScheduleEvent(input)
      setEvents(previous => [...(previous ?? []).filter(event => event.id !== response.data.id), response.data])
      setEditor(null)
      setMessage('Evento salvato nel tuo account.')
    } catch (reason) { showError(reason) }
    finally { setBusy(false) }
  }

  async function remove(event: ScheduleEvent) {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await deleteScheduleEvent(event.id)
      setEvents(previous => previous?.filter(value => value.id !== event.id) ?? [])
      if (editor?.event?.id === event.id) setEditor(null)
      setMessage('Evento eliminato.')
    } catch (reason) { showError(reason) }
    finally { setBusy(false) }
  }

  function edit(event: ScheduleEvent | null, date: string) {
    setEditor({ event, date })
    setMessage('')
    editorPanel.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const segments = days.map(day => segmentsForDay(events ?? [], day.id))
  const heights = hours.map(hour => segments.some(day => day.some(segment => segment.start < hour + 1 && segment.end > hour)) ? 56 : 18)
  const position = (hour: number) => {
    const whole = Math.min(24, Math.floor(hour))
    return heights.slice(0, whole).reduce((sum, height) => sum + height, 0) + (whole < 24 ? (hour - whole) * heights[whole] : 0)
  }
  const timelineHeight = heights.reduce((sum, height) => sum + height, 0)

  return (
    <div className="schedule-planner" aria-busy={busy}>
      <nav className="schedule-week-nav" aria-label="Settimana dei turni">
        <button className="action-button bg-secondary" type="button" disabled={busy || !!editor} onClick={() => onWeekChange(shiftDate(weekStart, -7))}>← Settimana precedente</button>
        <strong aria-live="polite">{shortDate(weekStart)} – {shortDate(weekEnd)} {weekEnd.slice(0, 4)}</strong>
        <button className="action-button bg-secondary" type="button" disabled={busy || !!editor} onClick={() => onWeekChange(shiftDate(weekStart, 7))}>Settimana successiva →</button>
        <button className="action-button bg-secondary" type="button" disabled={busy || !!editor} onClick={() => onWeekChange(currentMonday())}>Questa settimana</button>
      </nav>
      {error && <div className="schedule-feedback"><p className="form-error" role="alert">{error}</p>
        {needsLogin ? <Link to="/account">Vai al tuo account</Link> : <button className="action-button bg-secondary" type="button" disabled={busy} onClick={() => setAttempt(value => value + 1)}>Ricarica gli eventi</button>}
      </div>}
      {message && <p className="schedule-feedback" role="status">{message}</p>}
      <div ref={editorPanel}>
        {editor && <ScheduleEventForm key={`${editor.event?.id ?? 'new'}-${editor.date}`} event={editor.event} date={editor.date} busy={busy} onSave={save} onCancel={() => setEditor(null)} />}
      </div>
      {events === null && !error && <p className="schedule-feedback" role="status">Caricamento eventi…</p>}
      {events !== null && !needsLogin && (
        <div className="planner-scroll">
          <div className="planner-calendar">
            <div className="planner-hours" aria-label="Ore del giorno">
              {hours.map(hour => <span key={hour} style={{ height: heights[hour] }}>{hour}</span>)}
            </div>
            <Week days={days} renderDay={date => {
              const daySegments = segments[days.findIndex(day => day.id === date)]
              const laneEnds: number[] = []
              const placed = daySegments.map(segment => {
                let lane = laneEnds.findIndex(end => end <= segment.start)
                if (lane < 0) lane = laneEnds.length
                laneEnds[lane] = segment.end
                return { ...segment, lane }
              })
              return (
                <div className="planner-timeline" style={{ height: timelineHeight }}>
                  {placed.map(({ event, start, end, lane }) => (
                    <button type="button" key={event.id} disabled={busy} className={`planner-shift shadow ${event.type === 'work' ? 'bg-secondary' : 'bg-accent'}`}
                      style={{ top: position(start), height: Math.max(18, position(end) - position(start)), width: `${100 / laneEnds.length}%`, left: `${lane * 100 / laneEnds.length}%` }}
                      title={`${eventLabel(event)}${event.title ? ': '+event.title : ''} · ${italianDateTime(event.starts_at).replace('T', ' ')} – ${italianDateTime(event.ends_at).replace('T', ' ')}`}
                      aria-label={`Modifica ${event.title || eventLabel(event)} del ${shortDate(date)}`} onClick={() => edit(event, date)}>
                      <strong className="planner-event-label">{eventLabel(event)}</strong>
                      <span className="planner-event-time">{start === 0 ? '00:00' : italianDateTime(event.starts_at).slice(11)} – {end >= 24 ? '24:00' : italianDateTime(event.ends_at).slice(11)}</span>
                    </button>
                  ))}
                </div>
              )
            }} />
          </div>
          <p className="planner-note">Orari italiani. Ogni evento viene salvato subito nell’account. I turni notturni sono visibili anche nel giorno successivo.</p>
          <div className="planner-inputs">
            {days.map((day, index) => (
              <div key={day.id} className={`planner-day-inputs${index % 2 === 1 ? ' bg-secondary-soft' : ''}`}>
                <button className="action-button bg-secondary" type="button" disabled={busy} onClick={() => edit(null, day.id)} aria-label={`Aggiungi evento ${day.title} ${day.dateLabel}`}>Aggiungi evento</button>
                {segments[index].length === 0 && <p className="schedule-empty">Nessun evento.</p>}
                {segments[index].map(({ event }) => (
                  <div key={event.id} className="schedule-event-card">
                    <strong>{event.title || eventLabel(event)}</strong>
                    <p>{italianDateTime(event.starts_at).replace('T', ' ')}<br />{italianDateTime(event.ends_at).replace('T', ' ')}</p>
                    <button className="action-button bg-secondary" disabled={busy} type="button" onClick={() => edit(event, day.id)}>Modifica</button>
                    <button className="action-button bg-secondary" disabled={busy} type="button" onClick={() => void remove(event)}>Elimina</button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
