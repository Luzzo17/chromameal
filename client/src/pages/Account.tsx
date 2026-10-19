import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import { ApiError, apiRequest } from '../lib/api'
import { signIn, signOut, signUp } from '../lib/auth'
import type { User } from '../lib/auth'
import './Account.css'

export default function Account() {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)
  const [register, setRegister] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState<Record<string, string[]>>({})
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    apiRequest<User>('user')
      .then(value => { if (active) setUser(value) })
      .catch(reason => {
        if (active && !(reason instanceof ApiError && reason.status === 401)) {
          setError('Impossibile verificare la sessione. Controlla la connessione e riprova.')
        }
      })
      .finally(() => { if (active) setChecking(false) })
    return () => { active = false }
  }, [reload])

  function showError(reason: unknown) {
    if (reason instanceof ApiError && reason.status === 422) {
      setFields(reason.errors)
      setError('Controlla i dati inseriti.')
    } else if (reason instanceof ApiError && reason.status === 419) {
      setError('La sessione è scaduta. Riprova.')
    } else if (reason instanceof ApiError && reason.status === 429) {
      setError('Troppi tentativi. Attendi un minuto e riprova.')
    } else {
      setError('Operazione non riuscita. Controlla la connessione e riprova.')
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setBusy(true)
    setError('')
    setFields({})
    try {
      const email = String(data.get('email'))
      const password = String(data.get('password'))
      const value = register
        ? await signUp(String(data.get('name')), email, password, String(data.get('password_confirmation')))
        : await signIn(email, password)
      form.reset()
      setUser(value)
    } catch (reason) { showError(reason) }
    finally { setBusy(false) }
  }

  async function logout() {
    setBusy(true)
    setError('')
    setFields({})
    try { await signOut(); setUser(null) }
    catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) setUser(null)
      else if (reason instanceof ApiError && reason.status === 419) {
        setChecking(true)
        setReload(value => value + 1)
      } else showError(reason)
    }
    finally { setBusy(false) }
  }

  return (
    <main className="account-page">
      <Link to="/">← Torna a ChromaMeal</Link>
      <section className="account-card" aria-busy={checking || busy}>
        <h1>{checking ? 'Verifica della sessione…' : user ? `Ciao, ${user.name}` : register ? 'Crea il tuo account' : 'Accedi a ChromaMeal'}</h1>
        {error && <p role="alert">{error}</p>}
        {Object.entries(fields).map(([field, messages]) => <p role="alert" key={field} id={`error-${field}`}>{messages.join(' ')}</p>)}
        {!checking && (user ? <>
          <p>{user.email}</p>
          <button disabled={busy} onClick={logout}>{busy ? 'Uscita in corso…' : 'Esci'}</button>
        </> : <>
          <form onSubmit={submit}>
            <fieldset disabled={busy}>
              {register && <label>Nome<input name="name" autoComplete="name" required maxLength={255} aria-describedby={fields.name ? 'error-name' : undefined} /></label>}
              <label>Email<input name="email" type="email" autoComplete="username" required maxLength={255} aria-describedby={fields.email ? 'error-email' : undefined} /></label>
              <label>Password<input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 8 : undefined} aria-describedby={fields.password ? 'error-password' : undefined} /></label>
              {register && <label>Conferma password<input name="password_confirmation" type="password" autoComplete="new-password" required /></label>}
              <button type="submit">{busy ? 'Attendi…' : register ? 'Registrati' : 'Accedi'}</button>
            </fieldset>
          </form>
          <button disabled={busy} onClick={() => { setRegister(!register); setError(''); setFields({}) }}>
            {register ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
          </button>
        </>)}
      </section>
    </main>
  )
}
