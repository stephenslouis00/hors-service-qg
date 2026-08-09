import { useState } from 'react'
import { FirebaseError } from 'firebase/app'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'

export function LoginPage({ onContinue }: { onContinue: () => void }) {
  const { user, signIn, wasRejected } = useAuth()
  const [error, setError] = useState<string | null>(null)

  async function handleSignIn() {
    setError(null)
    try {
      await signIn()
      onContinue()
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : undefined
      // The user closing the popup themselves isn't an error worth surfacing.
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return
      console.error('Google sign-in failed:', err)
      setError(
        code === 'auth/unauthorized-domain'
          ? "Ce domaine n'est pas autorisé pour la connexion Google (configuration Firebase à corriger)."
          : 'La connexion à Google a échoué. Réessaie.',
      )
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden px-4">
      <img
        src={`${import.meta.env.BASE_URL}hero.jpg`}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative text-center">
        <h1 className="font-mono text-3xl font-semibold text-white">Hors Service</h1>
        <p className="mt-1 text-sm text-zinc-200">Espace privé du groupe</p>
      </div>

      {wasRejected && (
        <div className="relative max-w-sm rounded-md border border-red-400 bg-red-950/80 px-4 py-3 text-sm text-red-200">
          Ce compte Google n'est pas autorisé à accéder à cet espace. Demande à un membre du groupe de t'ajouter.
        </div>
      )}

      {error && (
        <div className="relative max-w-sm rounded-md border border-red-400 bg-red-950/80 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {user ? (
        <div className="relative flex flex-col items-center gap-3">
          <p className="text-sm text-zinc-200">Connecté en tant que {user.email}</p>
          <Button variant="primary" onClick={onContinue}>
            Entrer
          </Button>
        </div>
      ) : (
        <Button variant="primary" className="relative" onClick={handleSignIn}>
          Se connecter avec Google
        </Button>
      )}
    </div>
  )
}
