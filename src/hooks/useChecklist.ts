import { useEffect, useState } from 'react'
import { collection, doc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase/config'
import { watchCollection, orderByField, createDoc, updateDocFields, removeDoc } from '../firebase/firestore'
import { DEFAULT_CHECKLIST_TEMPLATE, type ChecklistItem } from '../types/checklist'

function checklistPath(releaseId: string) {
  return `releases/${releaseId}/checklist`
}

export function useChecklist(releaseId: string | undefined) {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!releaseId) return
    setLoading(true)
    const unsubscribe = watchCollection<Omit<ChecklistItem, 'id'>>(
      checklistPath(releaseId),
      (data) => {
        setItems(data as ChecklistItem[])
        setLoading(false)
      },
      [orderByField('order', 'asc')],
    )
    return unsubscribe
  }, [releaseId])

  return { items, loading }
}

/** Batch-creates every template step in one write, in order. */
export function useSeedChecklist(releaseId: string) {
  return async () => {
    const batch = writeBatch(db)
    const now = Date.now()
    DEFAULT_CHECKLIST_TEMPLATE.forEach((step, index) => {
      const ref = doc(collection(db, checklistPath(releaseId)))
      batch.set(ref, { label: step.label, header: Boolean(step.header), done: false, order: index, createdAt: now })
    })
    await batch.commit()
  }
}

export function useAddChecklistItem(releaseId: string) {
  return (label: string, order: number) =>
    createDoc(checklistPath(releaseId), { label, header: false, done: false, order, createdAt: Date.now() })
}

export function useUpdateChecklistItem(releaseId: string) {
  return (id: string, data: Partial<Omit<ChecklistItem, 'id'>>) => updateDocFields(checklistPath(releaseId), id, data)
}

export function useDeleteChecklistItem(releaseId: string) {
  return (id: string) => removeDoc(checklistPath(releaseId), id)
}
