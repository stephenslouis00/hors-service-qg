import { useEffect, useState } from 'react'
import { watchCollection, orderByField, createDoc, updateDocFields, removeDoc } from '../firebase/firestore'
import type { BookingEventType, BookingShow, ShowStatus } from '../types/booking'
import { useAuth } from '../contexts/AuthContext'

export function useShows() {
  const [shows, setShows] = useState<BookingShow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = watchCollection<Omit<BookingShow, 'id'>>(
      'bookingShows',
      (data) => {
        // Shows created before type/email/phone existed just lack those fields — default them.
        setShows(
          data.map((show) => ({ ...show, type: show.type ?? 'salle', email: show.email ?? '', phone: show.phone ?? '' })) as BookingShow[],
        )
        setLoading(false)
      },
      [orderByField('date', 'asc')],
    )
    return unsubscribe
  }, [])

  return { shows, loading }
}

export function useCreateShow() {
  const { user } = useAuth()
  return (input: {
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
    releaseId?: string | null
  }) => {
    const now = Date.now()
    return createDoc('bookingShows', { ...input, createdBy: user?.email ?? 'unknown', createdAt: now, updatedAt: now })
  }
}

export function useUpdateShow() {
  return (id: string, data: Partial<Omit<BookingShow, 'id'>>) =>
    updateDocFields('bookingShows', id, { ...data, updatedAt: Date.now() })
}

export function useDeleteShow() {
  return (id: string) => removeDoc('bookingShows', id)
}
