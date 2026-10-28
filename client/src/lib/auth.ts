import { apiRequest, initializeCsrf } from './api'

export type Theme = 'winter' | 'spring' | 'summer' | 'fall'
export type User = { id: number; name: string; email: string; theme: Theme }

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

export async function saveTheme(theme: Theme) {
  await initializeCsrf()
  return apiRequest<User>('user/theme', {
    method: 'PATCH',
    body: JSON.stringify({ theme }),
  })
}

export async function signIn(email: string, password: string) {
  await initializeCsrf()
  await apiRequest('auth/login', {
    method: 'POST', body: JSON.stringify({ email, password }),
  })
  return apiRequest<User>('user')
}

export async function signUp(name: string, email: string, password: string, confirmation: string) {
  await initializeCsrf()
  await apiRequest('auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, password_confirmation: confirmation }),
  })
  return apiRequest<User>('user')
}

export async function signOut() {
  await apiRequest('auth/logout', { method: 'POST' })
  applyTheme('winter')
}
