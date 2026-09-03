import { useEffect, useState } from 'react'
import { collection, doc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase/config'
import { watchCollection, watchCollectionGroup, orderByField, createDoc, updateDocFields, removeDoc } from '../firebase/firestore'
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

export interface ChecklistCalendarItem extends ChecklistItem {
  /** The release this step belongs to — every collection-group item carries it. */
  releaseId: string
}

/** Every checklist step across every release that has its own date/deadline set — feeds the calendar. */
export function useChecklistCalendarItems() {
  const [items, setItems] = useState<ChecklistCalendarItem[]>([])

  useEffect(() => {
    return watchCollectionGroup<Omit<ChecklistItem, 'id'>>('checklist', (data) => {
      setItems(
        data
          .filter((item) => !item.header && item.date != null)
          .map(({ parentId, ...rest }) => ({ ...rest, releaseId: parentId }) as ChecklistCalendarItem),
      )
    })
  }, [])

  return items
}

/**
 * Cross-release update — for callers (like the calendar) that only have a
 * checklist item's `releaseId` from a collection-group query, not a
 * component already scoped to one release.
 */
export function updateChecklistItemFields(releaseId: string, itemId: string, data: Partial<Omit<ChecklistItem, 'id'>>) {
  return updateDocFields(checklistPath(releaseId), itemId, data)
}

/**
 * Batch-creates every template step in one write, in order. A plain async
 * function (not a real hook — no hook calls inside) so it can also be
 * called right after a release is created, before any component has
 * mounted with that release's id.
 */
export async function seedChecklist(releaseId: string) {
  const batch = writeBatch(db)
  const now = Date.now()
  DEFAULT_CHECKLIST_TEMPLATE.forEach((step, index) => {
    const ref = doc(collection(db, checklistPath(releaseId)))
    batch.set(ref, { label: step.label, header: Boolean(step.header), done: false, order: index, createdAt: now })
  })
  await batch.commit()
}

export function useSeedChecklist(releaseId: string) {
  return () => seedChecklist(releaseId)
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
