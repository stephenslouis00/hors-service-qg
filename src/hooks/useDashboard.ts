import { useEffect, useMemo, useState } from 'react'
import { watchCollectionGroup, orderByField, limitTo } from '../firebase/firestore'
import type { SongFeedback } from '../types/song'
import type { Tone } from '../lib/statusTone'
import { useSongs } from './useSongs'
import { useReleases } from './useReleases'
import { usePromoCalendarEvents } from './useCalendarEvents'
import { useShows } from './useShows'
import { usePromoContent } from './usePromoContent'
import { useVenues } from './useVenues'
import { usePromoContacts } from './usePromoContacts'
import { useAdminDocs } from './useDocs'

export interface UpcomingItem {
  id: string
  date: number
  title: string
  category: string
  tone: Tone
  to: string
}

export interface ActivityItem {
  id: string
  at: number
  actorEmail: string
  description: string
  to: string
}

export interface DashboardStats {
  releasesInProgress: number
  sacemPending: number
  upcomingShows: number
  upcomingReleases: number
}

function useRecentFeedback(limitCount = 10) {
  const [feedback, setFeedback] = useState<(SongFeedback & { parentId: string })[]>([])

  useEffect(() => {
    return watchCollectionGroup<SongFeedback>(
      'feedback',
      (items) => setFeedback(items),
      [orderByField('createdAt', 'desc'), limitTo(limitCount)],
    )
  }, [limitCount])

  return feedback
}

export function useDashboard() {
  const { songs, loading: songsLoading } = useSongs()
  const { releases } = useReleases()
  const { events } = usePromoCalendarEvents()
  const { shows } = useShows()
  const { items: promoContent } = usePromoContent()
  const { venues } = useVenues()
  const { contacts } = usePromoContacts()
  const { docs } = useAdminDocs()
  const recentFeedback = useRecentFeedback()

  const upcoming = useMemo<UpcomingItem[]>(() => {
    const now = Date.now()
    const list: UpcomingItem[] = []

    for (const event of events) {
      if (event.startAt >= now) {
        list.push({ id: `event-${event.id}`, date: event.startAt, title: event.title, category: 'Promo', tone: 'blue', to: '/calendar' })
      }
    }
    for (const show of shows) {
      if (show.date >= now && show.status !== 'past') {
        list.push({
          id: `show-${show.id}`,
          date: show.date,
          title: `${show.venueName}${show.city ? ' · ' + show.city : ''}`,
          category: 'Concert',
          tone: show.status === 'confirmed' ? 'green' : 'yellow',
          to: '/calendar',
        })
      }
    }
    for (const song of songs) {
      if (song.releaseDate && song.releaseDate >= now) {
        list.push({
          id: `song-${song.id}`,
          date: song.releaseDate,
          title: `Sortie · ${song.title}`,
          category: 'Sortie',
          tone: 'green',
          to: `/releases/songs/${song.id}`,
        })
      }
    }

    return list.sort((a, b) => a.date - b.date).slice(0, 8)
  }, [events, shows, songs])

  const activity = useMemo<ActivityItem[]>(() => {
    if (songsLoading) return []
    const songTitleById = new Map(songs.map((s) => [s.id, s.title]))
    const list: ActivityItem[] = []

    for (const entry of recentFeedback) {
      list.push({
        id: `feedback-${entry.id}`,
        at: entry.createdAt,
        actorEmail: entry.authorEmail,
        description: `a commenté « ${songTitleById.get(entry.parentId) ?? 'un morceau'} »`,
        to: `/releases/songs/${entry.parentId}`,
      })
    }
    for (const item of promoContent) {
      list.push({
        id: `promo-${item.id}`,
        at: item.updatedAt,
        actorEmail: item.createdBy,
        description: `a mis à jour le contenu « ${item.title} »`,
        to: item.releaseId ? `/releases/projects/${item.releaseId}` : '/releases/projects',
      })
    }
    for (const show of shows) {
      list.push({
        id: `show-${show.id}`,
        at: show.updatedAt,
        actorEmail: show.createdBy,
        description: `a mis à jour la date « ${show.venueName} »`,
        to: '/calendar',
      })
    }
    for (const venue of venues) {
      list.push({
        id: `venue-${venue.id}`,
        at: venue.updatedAt,
        actorEmail: venue.createdBy,
        description: `a ajouté la salle « ${venue.name} »`,
        to: '/booking',
      })
    }
    for (const contact of contacts) {
      list.push({
        id: `contact-${contact.id}`,
        at: contact.updatedAt,
        actorEmail: contact.createdBy,
        description: `a ajouté le contact « ${contact.name} »`,
        to: '/releases/contacts',
      })
    }
    for (const doc of docs) {
      list.push({
        id: `doc-${doc.id}`,
        at: doc.uploadedAt,
        actorEmail: doc.uploadedBy,
        description: `a ajouté le document « ${doc.title} »`,
        to: '/administrative',
      })
    }

    return list.sort((a, b) => b.at - a.at).slice(0, 15)
  }, [recentFeedback, promoContent, shows, venues, contacts, docs, songs, songsLoading])

  const stats = useMemo<DashboardStats>(() => {
    const now = Date.now()
    return {
      // Cheap aggregate kept in sync by ChecklistSection's onCompletionChange —
      // avoids fetching every release's checklist subcollection just for this count.
      releasesInProgress: releases.filter((r) => r.status !== 'released').length,
      sacemPending: songs.filter((s) => !s.sacemDeposited).length,
      upcomingShows: shows.filter((s) => s.date >= now && s.status !== 'past').length,
      upcomingReleases: songs.filter((s) => s.releaseDate != null && s.releaseDate >= now).length,
    }
  }, [songs, shows, releases])

  return { upcoming, activity, stats, loading: songsLoading }
}
