import { useEffect, useState } from 'react'
import { watchCollection, orderByField, createDoc, updateDocFields, removeDoc } from '../firebase/firestore'
import type { PromoCalendarEvent } from '../types/promo'
import { useAuth } from '../contexts/AuthContext'

export function usePromoCalendarEvents() {
  const [events, setEvents] = useState<PromoCalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = watchCollection<Omit<PromoCalendarEvent, 'id'>>(
      'promoCalendarEvents',
      (data) => {
        setEvents(data as PromoCalendarEvent[])
        setLoading(false)
      },
      [orderByField('startAt', 'asc')],
    )
    return unsubscribe
  }, [])

  return { events, loading }
}

export function useCreatePromoCalendarEvent() {
  const { user } = useAuth()
  return (input: Omit<PromoCalendarEvent, 'id' | 'createdBy' | 'googleEventId'>) =>
    createDoc('promoCalendarEvents', { ...input, createdBy: user?.email ?? 'unknown' })
}

export function useUpdatePromoCalendarEvent() {
  return (id: string, data: Partial<Omit<PromoCalendarEvent, 'id'>>) =>
    updateDocFields('promoCalendarEvents', id, data)
}

export function useDeletePromoCalendarEvent() {
  return (id: string) => removeDoc('promoCalendarEvents', id)
}
