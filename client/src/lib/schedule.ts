import { apiRequest, initializeCsrf } from './api'

export type ScheduleEventInput = {
  type: 'work' | 'commitment'
  title: string | null
  starts_at: string
  ends_at: string
}

export type ScheduleEvent = ScheduleEventInput & { id: number }

export function getScheduleEvents(from: string, to: string) {
  const params = new URLSearchParams({ from, to })
  return apiRequest<{ data: ScheduleEvent[] }>(`schedule-events?${params.toString()}`)
}

export async function createScheduleEvent(event: ScheduleEventInput) {
  await initializeCsrf()
  return apiRequest<{ data: ScheduleEvent }>('schedule-events', {
    method: 'POST', body: JSON.stringify(event),
  })
}

export async function updateScheduleEvent(id: number, event: ScheduleEventInput) {
  await initializeCsrf()
  return apiRequest<{ data: ScheduleEvent }>(`schedule-events/${id}`, {
    method: 'PUT', body: JSON.stringify(event),
  })
}

export async function deleteScheduleEvent(id: number) {
  await initializeCsrf()
  return apiRequest<void>(`schedule-events/${id}`, { method: 'DELETE' })
}
