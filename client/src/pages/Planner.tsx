import { useState } from 'react'
import { Link } from 'react-router'
import Section from '../components/Section'
import Week from '../components/Week'
import './Planner.css'

const days = [
    { id: 'monday', title: 'Lunedì' },
    { id: 'tuesday', title: 'Martedì' },
    { id: 'wednesday', title: 'Mercoledì' },
    { id: 'thursday', title: 'Giovedì' },
    { id: 'friday', title: 'Venerdì' },
    { id: 'saturday', title: 'Sabato' },
    { id: 'sunday', title: 'Domenica' },
]

type TimeRange = { start: string; end: string }
type DayPlan = { Lavoro: TimeRange; Impegno: TimeRange; meals: Record<string, string> }
type Plan = Record<string, DayPlan>
const storageKey = 'chromameal-planner-v1'
const mealNames = ['Colazione', 'Snack mattutino', 'Pranzo', 'Snack pomeridiano', 'Cena']
const eventNames = ['Lavoro', 'Impegno'] as const
function emptyPlan(): Plan {
    return Object.fromEntries(days.map(({ id }) => [id, {
        Lavoro: { start: '', end: '' }, Impegno: { start: '', end: '' }, meals: {},
    }]))
}
function decimalHour(time: string) {
    const [hour, minute] = time.split(':').map(Number)
    return hour + minute / 60
}
function rangeError(range: TimeRange) {
    if (!range.start && !range.end) return ''
    if (!range.start || !range.end) return 'Inserisci entrambi gli orari.'
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(range.start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(range.end)) return 'Orario non valido.'
    return decimalHour(range.end) <= decimalHour(range.start) ? 'La fine deve seguire l’inizio nello stesso giorno.' : ''
}
function readPlan(): Plan {
    const plan = emptyPlan()
    try {
        const stored = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
        for (const { id } of days) {
            for (const label of eventNames) {
                const range = stored?.[id]?.[label]
                if (range && typeof range.start === 'string' && typeof range.end === 'string' && !rangeError(range)) {
                    plan[id][label] = { start: range.start, end: range.end }
                }
            }
            for (const meal of mealNames) {
                if (typeof stored?.[id]?.meals?.[meal] === 'string') plan[id].meals[meal] = stored[id].meals[meal]
            }
        }
    } catch { /* Start with an empty plan if local storage is unavailable or invalid. */ }
    return plan
}
const hours = Array.from({ length: 24 }, (_, index) => index)
const hourHeight = 56

export default function Planner() {
    const [mode, setMode] = useState<'schedule' | 'meals'>('schedule')
    const [plan, setPlan] = useState<Plan>(readPlan)
    const [message, setMessage] = useState('')
    const [dirty, setDirty] = useState(false)

    // Shared scale: hours occupied in any day stay tall; empty hours are compact.
    const ranges = days.flatMap(({ id }) => eventNames.map((label) => plan[id][label]))
        .filter((range) => range.start && range.end && !rangeError(range))
    const hourHeights = hours.map((hour) => ranges.some((range) =>
        decimalHour(range.start) < hour + 1 && decimalHour(range.end) > hour
    ) ? hourHeight : 18)
    function timePosition(time: string) {
        const value = decimalHour(time)
        const hour = Math.floor(value)
        return hourHeights.slice(0, hour).reduce((sum, height) => sum + height, 0)
            + (value - hour) * hourHeights[hour]
    }
    const timelineHeight = hourHeights.reduce((sum, height) => sum + height, 0)

    function changeTime(day: string, label: typeof eventNames[number], field: keyof TimeRange, value: string) {
        setPlan((previous) => ({ ...previous, [day]: { ...previous[day], [label]: { ...previous[day][label], [field]: value } } }))
        setDirty(true)
        setMessage('')
    }
    function changeMeal(day: string, meal: string, value: string) {
        setPlan((previous) => ({ ...previous, [day]: { ...previous[day], meals: { ...previous[day].meals, [meal]: value } } }))
        setDirty(true)
        setMessage('')
    }
    function savePlan() {
        for (const { id, title } of days) {
            for (const label of eventNames) {
                const error = rangeError(plan[id][label])
                if (error) { setMessage(`${title}, ${label}: ${error}`); return }
            }
        }
        try {
            localStorage.setItem(storageKey, JSON.stringify(plan))
            setDirty(false)
            setMessage('Settimana salvata in questo browser.')
        } catch { setMessage('Salvataggio non riuscito: i dati rimangono solo nella pagina aperta.') }
    }

    return (
        <main className="planner-page">
            <Link to="/">Torna alla home</Link>
            <Section title="Planner settimanale" fullWidth>
                <p className="planner-intro">
                    Organizza i tuoi pasti e imposta turni e impegni. Il calendario si aggiorna
                    mentre scrivi. Premi Salva settimana per ritrovare il tuo piano alla prossima
                    apertura in questo browser.
                </p>

                <div className="planner-tabs" aria-label="Modalità del planner">
                    <button type="button" aria-pressed={mode === 'schedule'} onClick={() => setMode('schedule')}>
                        Imposta turni e impegni
                    </button>
                    <button type="button" aria-pressed={mode === 'meals'} onClick={() => setMode('meals')}>
                        Programma i pasti
                    </button>
                </div>

                <div className="planner-scroll">
                    <div className="planner-calendar">
                        {mode === 'schedule' && (
                            <div className="planner-hours" aria-label="Ore del giorno">
                                {hours.map((hour) => <span key={hour} style={{ height: hourHeights[hour] }}>{hour}</span>)}
                            </div>
                        )}
                        <Week renderDay={(dayId) => {
                            return mode === 'schedule' ? (
                                <div className="planner-timeline" style={{ height: timelineHeight }}>
                                    {eventNames.map((label) => {
                                        const range = plan[dayId][label]
                                        if (!range.start || !range.end || rangeError(range)) return null
                                        const other = plan[dayId][label === 'Lavoro' ? 'Impegno' : 'Lavoro']
                                        const overlap = other.start && other.end && !rangeError(other)
                                            && decimalHour(range.start) < decimalHour(other.end) && decimalHour(other.start) < decimalHour(range.end)
                                        return <div key={label} className={`planner-shift shadow${label === 'Impegno' ? ' planner-shift--commitment' : ''}`} style={{
                                            top: timePosition(range.start),
                                            height: timePosition(range.end) - timePosition(range.start),
                                            width: overlap ? '50%' : '100%',
                                            left: overlap && label === 'Impegno' ? '50%' : 0,
                                        }} title={`${label}: ${range.start} – ${range.end}`}>
                                            <strong className="planner-event-label">{label}</strong>
                                            <span className="planner-event-time">{range.start} – {range.end}</span>
                                        </div>
                                    })}
                                </div>
                            ) : (
                                <div className="planner-meals">
                                    {mealNames.map((meal) => (
                                        <label key={meal}><strong>{meal}</strong>
                                            <textarea aria-label={`${dayId}: ${meal}`} placeholder="Scrivi il pasto…"
                                                value={plan[dayId].meals[meal] ?? ''}
                                                onChange={(event) => changeMeal(dayId, meal, event.target.value)} />
                                        </label>
                                    ))}
                                </div>
                            )
                        }} />
                    </div>

                    {mode === 'schedule' && (
                        <>
                            <p className="planner-note">Inserisci gli orari: il calendario si aggiorna subito. Sono supportati intervalli nello stesso giorno, da 00:00 a 23:59.</p>
                            <div className="planner-inputs">
                                {days.map((day) => (
                                    <div className="planner-day-inputs" key={day.id}>
                                        {eventNames.map((label) => (
                                            <fieldset key={label}>
                                                <legend>{label}</legend>
                                                <label>Dalle <input type="time" value={plan[day.id][label].start} aria-label={`${day.title}: inizio ${label.toLowerCase()}`}
                                                    onChange={(event) => changeTime(day.id, label, 'start', event.target.value)} /></label>
                                                <label>Alle <input type="time" value={plan[day.id][label].end} aria-label={`${day.title}: fine ${label.toLowerCase()}`}
                                                    onChange={(event) => changeTime(day.id, label, 'end', event.target.value)} /></label>
                                                {rangeError(plan[day.id][label]) && <p className="planner-error">{rangeError(plan[day.id][label])}</p>}
                                                <button type="button" onClick={() => {
                                                    setPlan((previous) => ({ ...previous, [day.id]: { ...previous[day.id], [label]: { start: '', end: '' } } }))
                                                    setDirty(true); setMessage('Voce rimossa. Salva per conservare la modifica.')
                                                }}>Elimina {label.toLowerCase()}</button>
                                            </fieldset>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
                <div className="planner-actions">
                    <button type="button" onClick={savePlan}>Salva settimana</button>
                    <button type="button" onClick={() => { setPlan(readPlan()); setDirty(false); setMessage('Ripristinata la settimana salvata.') }}>Annulla modifiche</button>
                    <button type="button" onClick={() => { setPlan(emptyPlan()); setDirty(true); setMessage('Settimana svuotata. Puoi annullare prima di salvare.') }}>Svuota settimana</button>
                    <p role="status">{message || (dirty ? 'Modifiche non salvate' : '')}</p>
                </div>
            </Section>
        </main>
    )
}
