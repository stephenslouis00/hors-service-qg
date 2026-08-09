import { useEffect, useState } from 'react'
import { watchCollection, orderByField, createDoc, updateDocFields, removeDoc } from '../firebase/firestore'
import type { Venue } from '../types/booking'
import { useAuth } from '../contexts/AuthContext'

export function useVenues() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = watchCollection<Omit<Venue, 'id'>>(
      'venues',
      (data) => {
        setVenues(data as Venue[])
        setLoading(false)
      },
      [orderByField('name', 'asc')],
    )
    return unsubscribe
  }, [])

  return { venues, loading }
}

export function useCreateVenue() {
  const { user } = useAuth()
  return (input: { name: string; city: string; contactPerson: string; email: string; phone: string }) => {
    const now = Date.now()
    return createDoc('venues', {
      ...input,
      notes: '',
      tags: [],
      createdBy: user?.email ?? 'unknown',
      createdAt: now,
      updatedAt: now,
    })
  }
}

export function useUpdateVenue() {
  return (id: string, data: Partial<Omit<Venue, 'id'>>) =>
    updateDocFields('venues', id, { ...data, updatedAt: Date.now() })
}

export function useDeleteVenue() {
  return (id: string) => removeDoc('venues', id)
}
