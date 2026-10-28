import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router'
import { ApiError, apiRequest } from '../lib/api'
import type { User } from '../lib/auth'
import { applyTheme } from '../lib/auth'

function ProtectedRoute() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true

    async function checkSession() {
      try {
        const response = await apiRequest<User>('user')

        if (active) {
          applyTheme(response.theme)
          setUser(response)
        }
      } catch (reason) {
        if (!active) return

        if (reason instanceof ApiError && reason.status === 401) {
          applyTheme('winter')
          setUser(null)
        } else {
          setError('Impossibile verificare la sessione. Riprova.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    checkSession()

    return () => {
      active = false
    }
  }, [attempt])

  function retry() {
    setError('')
    setLoading(true)
    setAttempt((previous) => previous + 1)
  }

  if (loading) {
    return <p role="status">Verifica della sessione…</p>
  }

  if (error) {
    return (
      <div>
        <p className="form-error" role="alert">
          {error}
        </p>

        <button
          type="button"
          className="action-button"
          onClick={retry}
        >
          Riprova
        </button>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/account" replace />
  }

  return <Outlet context={user} />
}

export default ProtectedRoute
