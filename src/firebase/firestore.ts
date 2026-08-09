import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  writeBatch,
  type QueryConstraint,
} from 'firebase/firestore'
import { db } from './config'

export function watchCollection<T>(
  path: string,
  onData: (items: (T & { id: string })[]) => void,
  constraints: QueryConstraint[] = [],
): () => void {
  const q = query(collection(db, path), ...constraints)
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as T) }))
    onData(items)
  })
}

/** Queries every subcollection with this name across all parent documents (e.g. every song's feedback thread at once). */
export function watchCollectionGroup<T>(
  collectionId: string,
  onData: (items: (T & { id: string; parentId: string })[]) => void,
  constraints: QueryConstraint[] = [],
): () => void {
  const q = query(collectionGroup(db, collectionId), ...constraints)
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({
      id: d.id,
      parentId: d.ref.parent.parent?.id ?? '',
      ...(d.data() as T),
    }))
    onData(items)
  })
}

export function orderByField(field: string, direction: 'asc' | 'desc' = 'asc') {
  return orderBy(field, direction)
}

export function limitTo(count: number) {
  return limit(count)
}

export function createDoc<T extends object>(path: string, data: T) {
  return addDoc(collection(db, path), data)
}

export function updateDocFields(path: string, id: string, data: Record<string, unknown>) {
  return updateDoc(doc(db, path, id), data)
}

export function removeDoc(path: string, id: string) {
  return deleteDoc(doc(db, path, id))
}

/**
 * Persists a new drag-and-drop order in one write: each item's `order` field
 * becomes its index in the array. Items can span different collections (e.g.
 * Production's list mixes song rows and release folders in one order).
 */
export function reorderAcrossCollections(items: { path: string; id: string }[]) {
  const batch = writeBatch(db)
  items.forEach(({ path, id }, index) => {
    batch.update(doc(db, path, id), { order: index })
  })
  return batch.commit()
}
