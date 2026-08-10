import type { SongStage } from '../types/song'
import type { PromoContentStatus, PromoContentType, ReleaseType } from '../types/promo'
import type { ShowStatus } from '../types/booking'

export type Tone = 'gray' | 'blue' | 'yellow' | 'green' | 'red' | 'purple'

export const songStageTone: Record<SongStage, Tone> = {
  demo: 'gray',
  production: 'blue',
  mixing: 'purple',
  mastering: 'yellow',
  uploaded: 'green',
}

export const songStageLabel: Record<SongStage, string> = {
  demo: 'Démo',
  production: 'Production',
  mixing: 'Mixage',
  mastering: 'Mastering',
  uploaded: 'Publié',
}

export const promoContentTone: Record<PromoContentStatus, Tone> = {
  idea: 'gray',
  'in-progress': 'blue',
  review: 'purple',
  scheduled: 'yellow',
  published: 'green',
}

export const showStatusTone: Record<ShowStatus, Tone> = {
  proposed: 'gray',
  target: 'yellow',
  confirmed: 'green',
  past: 'gray',
}

export const showStatusLabel: Record<ShowStatus, string> = {
  proposed: 'Proposé',
  target: 'À viser',
  confirmed: 'Confirmé',
  past: 'Passé',
}

export const releaseTypeLabel: Record<ReleaseType, string> = {
  single: 'Single',
  ep: 'EP',
  album: 'Album',
}

export const promoContentTypeLabel: Record<PromoContentType, string> = {
  video: 'Vidéo',
  photo: 'Photo',
  post: 'Post',
  other: 'Autre',
}
