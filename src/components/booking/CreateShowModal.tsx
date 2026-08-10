import { useState } from 'react'
import { SHOW_STATUSES, type ShowStatus } from '../../types/booking'
import type { Venue } from '../../types/booking'
import { showStatusLabel } from '../../lib/statusTone'
import { parseDateInputValue } from '../../lib/dates'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

export function CreateShowModal({
  venues,
  initialDate,
  onClose,
  onSubmit,
}: {
  venues: Venue[]
  initialDate?: string
  onClose: () => void
  onSubmit: (input: {
    venueId: string | null
    venueName: string
    city: string
    date: number
    status: ShowStatus
    notes: string
  }) => Promise<unknown>
}) {
  const [venueId, setVenueId] = useState('')
  const [venueName, setVenueName] = useState('')
  const [city, setCity] = useState('')
  const [date, setDate] = useState(initialDate ?? '')
  const [status, setStatus] = useState<ShowStatus>('target')
  const [submitting, setSubmitting] = useState(false)

  function handleVenueSelect(id: string) {
    setVenueId(id)
    const venue = venues.find((v) => v.id === id)
    if (venue) {
      setVenueName(venue.name)
      setCity(venue.city)
    }
  }

  async function handleSubmit() {
    if (!venueName.trim() || !date) return
    setSubmitting(true)
    try {
      await onSubmit({
        venueId: venueId || null,
        venueName: venueName.trim(),
        city: city.trim(),
        date: parseDateInputValue(date)!,
        status,
        notes: '',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Nouvelle date de concert" onClose={onClose}>
      <div className="space-y-3">
        <select
          value={venueId}
          onChange={(e) => handleVenueSelect(e.target.value)}
          className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
        >
          <option value="">Salle non répertoriée…</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <input
          value={venueName}
          onChange={(e) => setVenueName(e.target.value)}
          placeholder="Nom de la salle"
          className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
        />
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Ville"
          className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
        />
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
