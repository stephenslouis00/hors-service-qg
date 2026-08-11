import { useState } from 'react'
import { BOOKING_EVENT_TYPES, SHOW_STATUSES, type BookingEventType, type ShowStatus } from '../../types/booking'
import { bookingEventTypeLabel, showStatusLabel } from '../../lib/statusTone'
import { parseDateInputValue } from '../../lib/dates'
import { isHttpUrl } from '../../lib/url'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

export function CreateShowModal({
  initialDate,
  onClose,
  onSubmit,
}: {
  initialDate?: string
  onClose: () => void
  onSubmit: (input: {
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
  }) => Promise<unknown>
}) {
  const [type, setType] = useState<BookingEventType>('salle')
  const [venueName, setVenueName] = useState('')
  const [city, setCity] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [signupUrl, setSignupUrl] = useState('')
  const [date, setDate] = useState(initialDate ?? '')
  const [status, setStatus] = useState<ShowStatus>('target')
  const [submitting, setSubmitting] = useState(false)
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
        venueId: null,
        venueName: venueName.trim(),
        city: city.trim(),
        email: email.trim(),
        phone: phone.trim(),
        signupUrl: type === 'tremplin' && trimmedUrl ? trimmedUrl : undefined,
        date: parseDateInputValue(date)!,
        status,
        notes: '',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Nouvel événement" onClose={onClose}>
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
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting || !venueName.trim() || !date}>
            Créer
          </Button>
        </div>
      </div>
    </Modal>
  )
}
