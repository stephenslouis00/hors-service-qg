import { useEffect, useState } from 'react'
import { watchCollection, createDoc, updateDocFields, removeDoc } from '../firebase/firestore'
import type { Release, ReleaseStatus, ReleaseType } from '../types/promo'

export function useReleases() {
  const [releases, setReleases] = useState<Release[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = watchCollection<Omit<Release, 'id'>>('releases', (data) => {
      // Sorted client-side so releases created before the `order` field existed
      // still show up instead of being silently excluded by a server orderBy.
      const sorted = (data as Release[]).sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt))
      setReleases(sorted)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return { releases, loading }
}

export function useCreateRelease() {
  return (input: { title: string; type: ReleaseType; releaseDate: number | null; songIds: string[] }) => {
    const now = Date.now()
    return createDoc('releases', {
      title: input.title,
      type: input.type,
      songIds: input.songIds,
      releaseDate: input.releaseDate,
      status: (input.releaseDate && input.releaseDate <= Date.now() ? 'released' : 'upcoming') as ReleaseStatus,
      order: now,
      createdAt: now,
      updatedAt: now,
    })
  }
}

export function useUpdateRelease() {
  return (id: string, data: Partial<Omit<Release, 'id'>>) =>
    updateDocFields('releases', id, { ...data, updatedAt: Date.now() })
}

export function useDeleteRelease() {
  return (id: string) => removeDoc('releases', id)
}
