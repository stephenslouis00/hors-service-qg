import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { auth } from './config'

export function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  return signInWithPopup(auth, provider).then((result) => result.user)
}

export function signOutUser(): Promise<void> {
  return signOut(auth)
}

export const GOOGLE_SCOPES = {
  // Full calendar scope (not just calendar.events) — syncing into a dedicated
  // "HS" calendar requires creating that calendar and setting its color,
  // which calendar.events alone doesn't allow.
  calendar: 'https://www.googleapis.com/auth/calendar',
  drivePicker: 'https://www.googleapis.com/auth/drive.file',
} as const
