import { apiRequest, initializeCsrf } from './api'

export type User = { id: number; name: string; email: string }

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
}
