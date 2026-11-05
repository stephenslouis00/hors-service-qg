/** Mirror of site-data.js in the public site's repository. */
export const SITE_PLATFORMS = {
  spotify: 'Spotify',
  apple: 'Apple Music',
  deezer: 'Deezer',
  youtube: 'YouTube',
} as const

export type SitePlatform = keyof typeof SITE_PLATFORMS

export interface SiteRelease {
  id: string
  title: string
  date: string
  color: string
  cover: string
  audio: string
  excerpt?: boolean
  links: Partial<Record<SitePlatform, string>>
}

export interface SiteSocial {
  label: string
  handle: string
  url: string
}

export interface SiteShow {
  date: string
  city: string
  venue?: string
  url?: string
}

export interface SitePhoto {
  file: string
  stamp: string
  caption: string
  track: string
  image: string
}

export interface SiteData {
  featured: string
  platforms: Partial<Record<SitePlatform, string>>
  socials: SiteSocial[]
  releases: SiteRelease[]
  shows: SiteShow[]
  photos: SitePhoto[]
}
