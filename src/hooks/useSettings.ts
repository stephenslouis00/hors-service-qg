import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

const DEFAULT_UNCLASSIFIED_LABEL = 'Non classé'

/** Shared label for Promotion's "unclassified content" folder — it's a derived group, not a real
 *  record, so there's nowhere else to store a custom name for it. */
export function useUnclassifiedLabel() {
  const [label, setLabel] = useState(DEFAULT_UNCLASSIFIED_LABEL)

  useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'promotion'), (snapshot) => {
      const value = snapshot.data()?.unclassifiedLabel
      setLabel(typeof value === 'string' && value.trim() ? value : DEFAULT_UNCLASSIFIED_LABEL)
    })
  }, [])

  return label
}

export function useUpdateUnclassifiedLabel() {
  return (label: string) => setDoc(doc(db, 'settings', 'promotion'), { unclassifiedLabel: label }, { merge: true })
}
