import { useEffect, useState } from 'react'
import { watchCollection, orderByField, createDoc, updateDocFields, removeDoc } from '../firebase/firestore'
import type { PromoContact, PromoContactRole } from '../types/promo'
import { useAuth } from '../contexts/AuthContext'

export function usePromoContacts() {
  const [contacts, setContacts] = useState<PromoContact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = watchCollection<Omit<PromoContact, 'id'>>(
      'promoContacts',
      (data) => {
        setContacts(data as PromoContact[])
        setLoading(false)
      },
      [orderByField('name', 'asc')],
    )
    return unsubscribe
  }, [])

  return { contacts, loading }
}

export function useCreatePromoContact() {
  const { user } = useAuth()
  return (input: { name: string; org: string; role: PromoContactRole; email: string }) => {
    const now = Date.now()
    return createDoc('promoContacts', {
      ...input,
      notes: '',
      tags: [],
      createdBy: user?.email ?? 'unknown',
      createdAt: now,
      updatedAt: now,
    })
  }
}

export function useUpdatePromoContact() {
  return (id: string, data: Partial<Omit<PromoContact, 'id'>>) =>
    updateDocFields('promoContacts', id, { ...data, updatedAt: Date.now() })
}

export function useDeletePromoContact() {
  return (id: string) => removeDoc('promoContacts', id)
}
