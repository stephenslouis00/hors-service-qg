export const SHOW_STATUSES = ['proposed', 'target', 'confirmed', 'past'] as const
export type ShowStatus = (typeof SHOW_STATUSES)[number]

export interface BookingShow {
  id: string
  venueId: string | null
  venueName: string
  city: string
  date: number
  status: ShowStatus
  fee?: string
  notes: string
  createdBy: string
  createdAt: number
  updatedAt: number
  googleEventId?: Record<string, string>
}

export interface Venue {
  id: string
  name: string
  city: string
  contactPerson: string
  email: string
  phone: string
  notes: string
  tags: string[]
  createdBy: string
  createdAt: number
  updatedAt: number
}
