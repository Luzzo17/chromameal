/** Requests go through Vite's proxy in development; use /api on the production host too. */
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  const csrf = document.cookie.split('; ').find((cookie) => cookie.startsWith('XSRF-TOKEN='))
  if (csrf) headers.set('X-XSRF-TOKEN', decodeURIComponent(csrf.slice('XSRF-TOKEN='.length)))

  const response = await fetch(`/api/${path.replace(/^\/+/, '')}`, {
    ...options, headers, credentials: 'include',
  })
  if (!response.ok) throw new Error(`Richiesta API fallita (${response.status})`)
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export async function initializeCsrf(): Promise<void> {
  const response = await fetch('/sanctum/csrf-cookie', {
    credentials: 'include', headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new Error('Impossibile inizializzare la sessione')
}
