const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})

export function italianDateTime(value: string | Date) {
  const parts = Object.fromEntries(formatter.formatToParts(new Date(value)).map(part => [part.type, part.value]))
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

export function shiftDate(date: string, count: number) {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() + count)
  return value.toISOString().slice(0, 10)
}

export function currentMonday() {
  const today = italianDateTime(new Date()).slice(0, 10)
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay()
  return shiftDate(today, -((weekday + 6) % 7))
}

// Convert an Italian wall-clock time to an instant, independently of the browser's timezone.
export function italianTimeToUtc(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Inserisci data e ora complete.')
  const wallTime = Date.parse(`${value}:00Z`)
  if (!Number.isFinite(wallTime) || new Date(wallTime).toISOString().slice(0, 16) !== value) throw new Error('Data o ora non valida.')
  let instant = wallTime
  for (let attempt = 0; attempt < 4; attempt++) {
    const shown = italianDateTime(new Date(instant))
    const difference = wallTime - Date.parse(`${shown}:00Z`)
    if (difference === 0) {
      // During the autumn clock change, use the first occurrence of a repeated time.
      const earlier = instant - 3600000
      return new Date(italianDateTime(new Date(earlier)) === value ? earlier : instant).toISOString()
    }
    instant += difference
  }
  throw new Error('Questo orario non esiste nel giorno scelto per il cambio dell’ora. Scegli un altro orario.')
}
