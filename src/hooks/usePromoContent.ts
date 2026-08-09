import { useEffect, useState } from 'react'
import { watchCollection, orderByField, createDoc, updateDocFields, removeDoc } from '../firebase/firestore'
import type { PromoContentItem, PromoContentStatus, PromoContentType } from '../types/promo'
import { useAuth } from '../contexts/AuthContext'

export function usePromoContent() {
  const [items, setItems] = useState<PromoContentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = watchCollection<Omit<PromoContentItem, 'id'>>(
      'promoContent',
      (data) => {
        setItems(data as PromoContentItem[])
        setLoading(false)
      },
      [orderByField('updatedAt', 'desc')],
    )
    return unsubscribe
  }, [])

  return { items, loading }
}

export function useCreatePromoContent() {
  const { user } = useAuth()
  return (input: { title: string; type: PromoContentType; releaseId: string | null }) => {
    const now = Date.now()
    return createDoc('promoContent', {
      title: input.title,
      type: input.type,
      status: 'idea' as PromoContentStatus,
      releaseId: input.releaseId,
      driveLinks: [],
      publishDate: null,
      notes: '',
      createdAt: now,
      createdBy: user?.email ?? 'unknown',
      updatedAt: now,
    })
  }
}

export function useUpdatePromoContent() {
  return (id: string, data: Partial<Omit<PromoContentItem, 'id'>>) =>
    updateDocFields('promoContent', id, { ...data, updatedAt: Date.now() })
}

export function useDeletePromoContent() {
  return (id: string) => removeDoc('promoContent', id)
}
