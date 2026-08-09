import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { signInWithGoogle, signOutUser } from '../firebase/auth'
import type { AllowlistEntry } from '../types/user'

interface AuthContextValue {
  user: User | null
  allowlistEntry: AllowlistEntry | null
  loading: boolean
  wasRejected: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [allowlistEntry, setAllowlistEntry] = useState<AllowlistEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [wasRejected, setWasRejected] = useState(false)

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true)
      if (!firebaseUser?.email) {
        setUser(null)
        setAllowlistEntry(null)
        setLoading(false)
        return
      }

      const email = firebaseUser.email.toLowerCase()
      const snapshot = await getDoc(doc(db, 'allowlist', email))

      if (!snapshot.exists()) {
        setWasRejected(true)
        await signOutUser()
        setUser(null)
        setAllowlistEntry(null)
        setLoading(false)
        return
      }

      setWasRejected(false)
      setUser(firebaseUser)
      setAllowlistEntry(snapshot.data() as AllowlistEntry)
      setLoading(false)
    })
  }, [])

  async function signIn() {
    setWasRejected(false)
    await signInWithGoogle()
  }

  async function signOut() {
    await signOutUser()
  }

  return (
    <AuthContext.Provider value={{ user, allowlistEntry, loading, wasRejected, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
