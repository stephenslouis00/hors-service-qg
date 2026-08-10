import { useState } from 'react'
import { useGoogleToken } from '../../hooks/useGoogleToken'
import { GOOGLE_SCOPES } from '../../firebase/auth'
import { openDrivePicker, shareFileWithEmails, type DrivePickedFile } from '../../lib/googleDrive'
import { Button } from '../ui/Button'

export function DriveAttachButton({
  onPicked,
  shareWithEmails = [],
  label = '📎 Choisir depuis Drive',
  compact = false,
}: {
  onPicked: (file: DrivePickedFile) => void
  /** Emails to auto-share the picked file with (typically the allowlist), so nobody hits "access denied". */
  shareWithEmails?: string[]
  label?: string
  /** Renders as a small icon-only button instead of a labeled one, for dense rows. */
  compact?: boolean
}) {
  const { getToken, connecting } = useGoogleToken([GOOGLE_SCOPES.drivePicker])
  const [opening, setOpening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setOpening(true)
    setError(null)
    try {
      const accessToken = await getToken()
      await openDrivePicker({
        accessToken,
        onPicked: async (file) => {
          const others = shareWithEmails.filter((email) => email)
          if (others.length > 0) {
            await shareFileWithEmails(accessToken, file.id, others)
          }
          onPicked(file)
        },
      })
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err)
      console.error('Drive attach failed:', err)
      setError(`Impossible d’ouvrir Google Drive : ${detail}`)
    } finally {
      setOpening(false)
    }
  }

  if (compact) {
    return (
      <button
        onClick={handleClick}
        disabled={opening || connecting}
        title={error ?? 'Attacher depuis Drive'}
        aria-label="Attacher depuis Drive"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-300 text-zinc-500 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        {opening || connecting ? '…' : '📎'}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button onClick={handleClick} disabled={opening || connecting}>
        {opening || connecting ? 'Ouverture…' : label}
      </Button>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </div>
  )
}
