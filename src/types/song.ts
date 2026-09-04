export const SONG_STAGES = ['demo', 'production', 'mixing', 'mastering', 'uploaded'] as const
export type SongStage = (typeof SONG_STAGES)[number]

export interface Song {
  id: string
  title: string
  releaseDate: number | null
  driveFolderUrl?: string
  sacemDeposited: boolean
  order: number
  createdAt: number
  createdBy: string
  updatedAt: number
  /** Per-user Google Calendar event id, once synced via "Tout synchroniser sur HS". */
  googleEventId?: Record<string, string>
}

export interface SongFeedback {
  id: string
  stage: SongStage
  text: string
  authorEmail: string
  authorName: string
  createdAt: number
}
