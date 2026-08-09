import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LoginPage } from '../../pages/LoginPage'

export function AuthGuard() {
  const { user, loading } = useAuth()
  // Starts false on every fresh page load — even an already-signed-in user
  // sees the "Hors Service" landing screen first and has to click through.
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    if (entered && !user && !loading) setEntered(false)
  }, [entered, user, loading])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#0d1117]">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">Chargement…</span>
      </div>
    )
  }

  // Also gate on `user`: right after a rejected sign-in, `entered` can still be
  // true for one render while `user` is null (before the effect above resets
  // it) — without this, the protected app shell would flash briefly.
  if (!entered || !user) {
    return <LoginPage onContinue={() => setEntered(true)} />
  }

  return <Outlet />
}
