import { useState } from 'react'
import type { FormEvent } from 'react'
import type { ScheduleEvent, ScheduleEventInput } from '../lib/schedule'
import { italianDateTime, italianTimeToUtc } from '../lib/scheduleDates'

type Props = {
  event: ScheduleEvent | null
  date: string
  busy: boolean
  onSave: (input: ScheduleEventInput) => Promise<void>
  onCancel: () => void
}

export default function ScheduleEventForm({ event, date, busy, onSave, onCancel }: Props) {
  const [error, setError] = useState('')

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (busy) return
    const form = new FormData(e.currentTarget)
    try {
      const starts_at = italianTimeToUtc(String(form.get('starts_at')))
      const ends_at = italianTimeToUtc(String(form.get('ends_at')))
      if (Date.parse(ends_at) <= Date.parse(starts_at)) throw new Error('La fine deve seguire l’inizio. Per i turni notturni seleziona il giorno successivo.')
      setError('')
      void onSave({
        type: form.get('type') as ScheduleEventInput['type'],
        title: String(form.get('title')).trim() || null,
        starts_at, ends_at,
      })
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Controlla data e ora.') }
  }

  return (
    <form className="schedule-event-form bg-secondary-soft" onSubmit={submit}>
      <h2>{event ? 'Modifica evento' : 'Aggiungi turno o impegno'}</h2>
      <p>Gli orari sono riferiti all’Italia. Per un turno notturno imposta la fine nel giorno successivo.</p>
      <fieldset disabled={busy}>
        <label>Tipo
          <select className="bg-white" name="type" defaultValue={event?.type ?? 'work'}>
            <option value="work">Lavoro</option>
            <option value="commitment">Impegno</option>
          </select>
        </label>
        <label>Titolo (facoltativo)
          <input className="bg-white" name="title" maxLength={255} defaultValue={event?.title ?? ''} />
        </label>
        <label>Inizio
          <input className="bg-white" name="starts_at" type="datetime-local" min="1900-01-01T00:00" max="9998-12-31T23:59" required defaultValue={event ? italianDateTime(event.starts_at) : `${date}T09:00`} />
        </label>
        <label>Fine
          <input className="bg-white" name="ends_at" type="datetime-local" min="1900-01-01T00:00" max="9998-12-31T23:59" required defaultValue={event ? italianDateTime(event.ends_at) : `${date}T17:00`} />
        </label>
        <div className="schedule-form-actions">
          <button className="action-button bg-secondary" type="submit">{busy ? 'Salvataggio…' : 'Salva evento'}</button>
          <button className="action-button bg-secondary" type="button" onClick={onCancel}>Annulla</button>
        </div>
      </fieldset>
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
  )
}
