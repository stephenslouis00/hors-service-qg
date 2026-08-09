export const SONG_STAGES = ['demo', 'production', 'mixing', 'mastering', 'uploaded'] as const
export type SongStage = (typeof SONG_STAGES)[number]

export interface Song {
  id: string
  title: string
  status: SongStage
  releaseDate: number | null
  driveFolderUrl?: string
  sacemDeposited: boolean
  order: number
  createdAt: number
  createdBy: string
  updatedAt: number
}

export interface SongFeedback {
  id: string
  stage: SongStage
  text: string
  authorEmail: string
  authorName: string
  createdAt: number
}
