export const PROMO_CONTENT_TYPES = ['video', 'photo', 'post', 'other'] as const
export type PromoContentType = (typeof PROMO_CONTENT_TYPES)[number]

export const PROMO_CONTENT_STATUSES = ['idea', 'in-progress', 'review', 'scheduled', 'published'] as const
export type PromoContentStatus = (typeof PROMO_CONTENT_STATUSES)[number]

export interface PromoContentItem {
  id: string
  title: string
  type: PromoContentType
  status: PromoContentStatus
  releaseId: string | null
  driveLinks: string[]
  publishDate: number | null
  notes: string
  createdAt: number
  createdBy: string
  updatedAt: number
}

export interface PromoCalendarEvent {
  id: string
  title: string
  description: string
  startAt: number
  endAt: number
  allDay: boolean
  platform?: string
  contentItemId?: string | null
  releaseId?: string | null
  createdBy: string
  googleEventId?: Record<string, string>
}

export const RELEASE_TYPES = ['single', 'ep', 'album'] as const
export type ReleaseType = (typeof RELEASE_TYPES)[number]

export const RELEASE_STATUSES = ['upcoming', 'released'] as const
export type ReleaseStatus = (typeof RELEASE_STATUSES)[number]

export interface Release {
  id: string
  title: string
  type: ReleaseType
  songIds: string[]
  releaseDate: number | null
  status: ReleaseStatus
  coverImageDriveUrl?: string
  pinterestUrl?: string
  order: number
  createdAt: number
  updatedAt: number
}

export const PROMO_CONTACT_ROLES = ['journalist', 'blog', 'playlist-curator', 'other'] as const
export type PromoContactRole = (typeof PROMO_CONTACT_ROLES)[number]

export interface PromoContact {
  id: string
  name: string
  org: string
  role: PromoContactRole
  email: string
  notes: string
  tags: string[]
  createdBy: string
  createdAt: number
  updatedAt: number
}
