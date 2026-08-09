import { useEffect, useState } from 'react'
import { watchCollection, orderByField, createDoc, updateDocFields, removeDoc } from '../firebase/firestore'
import type { AdminDocument, AdminDocType } from '../types/admin'
import { useAuth } from '../contexts/AuthContext'

export function useAdminDocs() {
  const [docs, setDocs] = useState<AdminDocument[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = watchCollection<Omit<AdminDocument, 'id'>>(
      'adminDocuments',
      (data) => {
        setDocs(data as AdminDocument[])
        setLoading(false)
      },
      [orderByField('uploadedAt', 'desc')],
    )
    return unsubscribe
  }, [])

  return { docs, loading }
}

export function useCreateAdminDoc() {
  const { user } = useAuth()
  return (input: { title: string; type: AdminDocType; description: string; driveUrl: string; relatedReleaseId?: string | null }) =>
    createDoc('adminDocuments', {
      ...input,
      relatedReleaseId: input.relatedReleaseId ?? null,
      associatedDate: null,
      uploadedBy: user?.email ?? 'unknown',
      uploadedAt: Date.now(),
    })
}

export function useUpdateAdminDoc() {
  return (id: string, data: Partial<Omit<AdminDocument, 'id'>>) => updateDocFields('adminDocuments', id, data)
}

export function useDeleteAdminDoc() {
  return (id: string) => removeDoc('adminDocuments', id)
}
