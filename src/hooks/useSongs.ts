import { useEffect, useState } from 'react'
import { watchCollection, orderByField, createDoc, updateDocFields, removeDoc } from '../firebase/firestore'
import type { Song, SongFeedback, SongStage } from '../types/song'
import { useAuth } from '../contexts/AuthContext'

export function useSongs() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = watchCollection<Omit<Song, 'id'>>('songs', (items) => {
      // Sorted client-side (not via Firestore orderBy) so songs created before the
      // `order` field existed still show up instead of being silently excluded.
      const sorted = (items as Song[]).sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt))
      setSongs(sorted)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return { songs, loading }
}

export function useCreateSong() {
  const { user } = useAuth()
  return (title: string) => {
    const now = Date.now()
    return createDoc('songs', {
      title,
      releaseDate: null,
      sacemDeposited: false,
      order: now,
      createdAt: now,
      createdBy: user?.email ?? 'unknown',
      updatedAt: now,
    })
  }
}

export function useUpdateSong() {
  return (songId: string, data: Partial<Omit<Song, 'id'>>) =>
    updateDocFields('songs', songId, { ...data, updatedAt: Date.now() })
}

export function useDeleteSong() {
  return (songId: string) => removeDoc('songs', songId)
}

export function useSongFeedback(songId: string | undefined) {
  const [feedback, setFeedback] = useState<SongFeedback[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!songId) return
    setLoading(true)
    const unsubscribe = watchCollection<Omit<SongFeedback, 'id'>>(
      `songs/${songId}/feedback`,
      (items) => {
        setFeedback(items as SongFeedback[])
        setLoading(false)
      },
      [orderByField('createdAt', 'asc')],
    )
    return unsubscribe
  }, [songId])

  return { feedback, loading }
}

export function useAddSongFeedback(songId: string | undefined) {
  const { user } = useAuth()
  return (stage: SongStage, text: string) => {
    if (!songId) return Promise.resolve()
    return createDoc(`songs/${songId}/feedback`, {
      stage,
      text,
      authorEmail: user?.email ?? 'unknown',
      authorName: user?.displayName ?? user?.email ?? 'Membre',
      createdAt: Date.now(),
    })
  }
}
