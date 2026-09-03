import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'
import { updateDocFields } from '../firebase/firestore'
import type { BookingShow } from '../types/booking'

interface LegacyVenue {
  email?: string
  phone?: string
}

/**
 * One-time backfill: shows created before venues were folded directly into
 * booking events relied on a linked `venues` doc for contact info. This
 * copies that email/phone onto the show itself, so the app can stop reading
 * the `venues` collection entirely. Idempotent and cheap (no-ops once every
 * show already has its own contact info) — safe to delete this file and its
 * call site once confirmed run against production data.
 */
export async function migrateVenueContactsOntoShows(shows: BookingShow[]) {
  const needsMigration = shows.filter((s) => s.venueId && (!s.email || !s.phone))
  if (needsMigration.length === 0) return

  const snapshot = await getDocs(collection(db, 'venues'))
  const venueById = new Map(snapshot.docs.map((d) => [d.id, d.data() as LegacyVenue]))

  for (const show of needsMigration) {
    const venue = show.venueId ? venueById.get(show.venueId) : undefined
    if (!venue) continue
    const patch: Partial<BookingShow> = {}
    if (!show.email && venue.email) patch.email = venue.email
    if (!show.phone && venue.phone) patch.phone = venue.phone
    if (Object.keys(patch).length > 0) {
      await updateDocFields('bookingShows', show.id, patch)
    }
  }
}
