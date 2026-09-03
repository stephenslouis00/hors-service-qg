import { useState } from 'react'
import { BOOKING_EVENT_TYPES, SHOW_STATUSES, type BookingEventType, type BookingShow, type ShowStatus } from '../../types/booking'
import { bookingEventTypeLabel, showStatusLabel } from '../../lib/statusTone'
import { dateInputValue, parseDateInputValue } from '../../lib/dates'
import { isHttpUrl } from '../../lib/url'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

export interface BookingEventInput {
  type: BookingEventType
  venueId: string | null
  venueName: string
  city: string
  email: string
  phone: string
  signupUrl?: string
  date: number
  status: ShowStatus
  notes: string
  releaseId: string | null
}

export function BookingEventModal({
  show,
  initialDate,
  releases = [],
  onClose,
  onSubmit,
  onDelete,
}: {
  /** When provided, edits this event instead of creating a new one. */
  show?: BookingShow
  initialDate?: string
  /** Releases this event can be linked to — the link surfaces the show on that release's checklist. */
  releases?: { id: string; title: string }[]
  onClose: () => void
  onSubmit: (input: BookingEventInput) => Promise<unknown>
  onDelete?: () => Promise<unknown>
}) {
  const [type, setType] = useState<BookingEventType>(show?.type ?? 'salle')
  const [venueName, setVenueName] = useState(show?.venueName ?? '')
  const [city, setCity] = useState(show?.city ?? '')
  const [email, setEmail] = useState(show?.email ?? '')
  const [phone, setPhone] = useState(show?.phone ?? '')
  const [signupUrl, setSignupUrl] = useState(show?.signupUrl ?? '')
  const [date, setDate] = useState(show ? dateInputValue(show.date) : (initialDate ?? ''))
  const [status, setStatus] = useState<ShowStatus>(show?.status ?? 'target')
  const [releaseId, setReleaseId] = useState(show?.releaseId ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!venueName.trim() || !date) return
    const trimmedUrl = signupUrl.trim()
    if (type === 'tremplin' && trimmedUrl && !isHttpUrl(trimmedUrl)) {
      setError('Le lien doit commencer par http:// ou https://')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit({
        type,
        venueId: show?.venueId ?? null,
        venueName: venueName.trim(),
        city: city.trim(),
        email: email.trim(),
        phone: phone.trim(),
        signupUrl: type === 'tremplin' && trimmedUrl ? trimmedUrl : undefined,
        date: parseDateInputValue(date)!,
        status,
        notes: show?.notes ?? '',
        releaseId: releaseId || null,
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!onDelete) return
    if (!confirm(`Supprimer « ${venueName} » ?`)) return
    setDeleting(true)
    try {
      await onDelete()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal title={show ? 'Modifier l’événement' : 'Nouvel événement'} onClose={onClose}>
      <div className="space-y-3">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as BookingEventType)}
          className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
        >
          {BOOKING_EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {bookingEventTypeLabel[t]}
            </option>
          ))}
        </select>
        <input
          autoFocus
          value={venueName}
          onChange={(e) => setVenueName(e.target.value)}
          placeholder="Nom"
          className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
        />
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Ville"
          className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email (optionnel)"
          className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Téléphone (optionnel)"
          className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
        />
        {type === 'tremplin' && (
          <div>
            <input
              value={signupUrl}
              onChange={(e) => setSignupUrl(e.target.value)}
              placeholder="Lien d'inscription (optionnel)"
              className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
            />
            {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
          </div>
        )}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ShowStatus)}
          className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
        >
          {SHOW_STATUSES.map((s) => (
            <option key={s} value={s}>
              {showStatusLabel[s]}
            </option>
          ))}
        </select>
        {releases.length > 0 && (
          <select
            value={releaseId}
            onChange={(e) => setReleaseId(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
          >
            <option value="">Aucune sortie liée</option>
            {releases.map((r) => (
              <option key={r.id} value={r.id}>
                🎵 {r.title}
              </option>
            ))}
          </select>
        )}
        <div className="flex items-center justify-between gap-2">
          {show && onDelete ? (
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Suppression…' : 'Supprimer'}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex justify-end gap-2">
            <Button onClick={onClose}>Annuler</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={submitting || !venueName.trim() || !date}>
              {show ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
