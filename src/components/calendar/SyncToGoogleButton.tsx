import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useGoogleToken } from '../../hooks/useGoogleToken'
import { GOOGLE_SCOPES } from '../../firebase/auth'
import { createGoogleCalendarEvent, updateGoogleCalendarEvent, getOrCreateHsCalendar } from '../../lib/googleCalendar'
import { Button } from '../ui/Button'

export function SyncToGoogleButton({
  title,
  description,
  startAt,
  endAt,
  allDay,
  googleEventId,
  onSynced,
}: {
  title: string
  description?: string
  startAt: number
  endAt: number
  allDay?: boolean
  googleEventId?: string
  onSynced: (googleEventId: string) => void
}) {
  const { user } = useAuth()
  const { getToken, invalidate, connecting } = useGoogleToken([GOOGLE_SCOPES.calendar])
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSync(forceReconnect = false) {
    setSyncing(true)
    setError(null)
    try {
      const accessToken = await getToken(forceReconnect)
      const calendarId = await getOrCreateHsCalendar(accessToken)
      const event = { title, description, startAt, endAt, allDay }
      if (googleEventId) {
        await updateGoogleCalendarEvent(accessToken, calendarId, googleEventId, event)
        onSynced(googleEventId)
      } else {
        const id = await createGoogleCalendarEvent(accessToken, calendarId, event)
        onSynced(id)
      }
    } catch (err) {
      const status = (err as Error & { status?: number }).status
      if (status === 401 && !forceReconnect) {
        invalidate()
        return handleSync(true)
      }
      setError('Échec de la synchronisation Google Calendar.')
    } finally {
      setSyncing(false)
    }
  }

  if (!user) return null

  return (
    <div className="flex items-center gap-2">
      <Button onClick={() => handleSync(false)} disabled={syncing || connecting}>
        {syncing || connecting ? 'Synchronisation…' : googleEventId ? '↻ Mis à jour sur mon agenda HS' : '+ Ajouter à mon agenda HS'}
      </Button>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </div>
  )
}
