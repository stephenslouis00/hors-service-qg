import { useEffect, useState } from 'react'
import { watchCollection, orderByField } from '../firebase/firestore'
import type { Venue } from '../types/booking'

/** Read-only: venues are no longer created directly — booking events carry their own contact info.
 *  Kept only to resolve contact details on shows created before that change. */
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
