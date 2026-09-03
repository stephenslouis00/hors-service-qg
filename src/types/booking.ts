export const SHOW_STATUSES = ['proposed', 'target', 'confirmed', 'past'] as const
export type ShowStatus = (typeof SHOW_STATUSES)[number]

export const BOOKING_EVENT_TYPES = ['bar', 'salle', 'tremplin', 'festival'] as const
export type BookingEventType = (typeof BOOKING_EVENT_TYPES)[number]

export interface BookingShow {
  id: string
  type: BookingEventType
  venueId: string | null
  venueName: string
  city: string
  email: string
  phone: string
  /** Only meaningful for type === 'tremplin' — the contest's submission link. */
  signupUrl?: string
  date: number
  status: ShowStatus
  fee?: string
  notes: string
  /** Optional link to the release it supports — surfaces this show on that release's checklist. */
  releaseId?: string | null
  createdBy: string
  createdAt: number
  updatedAt: number
  googleEventId?: Record<string, string>
}

