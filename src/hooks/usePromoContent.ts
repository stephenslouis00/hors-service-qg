import { useEffect, useState } from 'react'
import { watchCollection, orderByField, createDoc, updateDocFields, removeDoc } from '../firebase/firestore'
import type { DriveLink, PromoContentItem, PromoContentStatus, PromoContentType } from '../types/promo'
import { useAuth } from '../contexts/AuthContext'

/** Older items stored driveLinks as plain URL strings, before file names were tracked. */
function normalizeDriveLinks(links: unknown): DriveLink[] {
  if (!Array.isArray(links)) return []
  return links.map((link) => (typeof link === 'string' ? { url: link, name: 'Fichier' } : (link as DriveLink)))
}

export function usePromoContent() {
  const [items, setItems] = useState<PromoContentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = watchCollection<Omit<PromoContentItem, 'id'>>(
      'promoContent',
      (data) => {
        setItems(
          data.map((item) => ({ ...item, driveLinks: normalizeDriveLinks(item.driveLinks) })) as PromoContentItem[],
        )
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
