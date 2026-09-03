export interface ChecklistItem {
  id: string
  label: string
  done: boolean
  /** Section label (e.g. "Photos / Vidéos") — not itself checkable. */
  header: boolean
  order: number
  createdAt: number
  /** '' means no file attached — never `undefined` (Firestore updateDoc rejects it). */
  driveUrl?: string
  driveName?: string
  /** This step's own release date or working deadline — shows up on /calendar when set. */
  date?: number | null
  /** Per-user Google Calendar event id, once synced via "Tout synchroniser sur HS". */
  googleEventId?: Record<string, string>
}

/** Seeded once per release, from the band's standard production/promotion pipeline. */
export const DEFAULT_CHECKLIST_TEMPLATE: { label: string; header?: boolean }[] = [
  { label: 'Démo' },
  { label: 'Enregistrement / Production' },
  { label: 'Mixage' },
  { label: 'Mastering' },
  { label: 'Dépôt SACEM' },
  { label: 'Photos / Vidéos', header: true },
  { label: 'Cover album (post programmé)' },
  { label: 'Photo presse' },
  { label: 'Teaser (post programmé)' },
  { label: 'Visualiseur 1 (pubs Meta)' },
  { label: 'Visualiseur 2 (pubs Meta)' },
  { label: 'Publication sur AWAL' },
  { label: 'Dossier de presse (EPK)', header: true },
  { label: 'Créer le dossier de presse (EPK)' },
  { label: 'Envoi du dossier de presse (médias / radios / contacts)' },
  { label: 'Mise en place des pubs Meta (visualiseur 1 ou 2)' },
  { label: 'Argumentaire marketing AWAL', header: true },
  { label: 'Introduction de la sortie (1-2 lignes)' },
  { label: 'Infos complémentaires (bio, collabs, anecdotes...)' },
  { label: "Lien de stream privé (avec code d'accès si besoin)" },
  { label: 'Activité radio' },
  { label: 'Presse / couverture en ligne' },
  { label: 'Dates de concerts' },
  { label: "Compteurs de streams et playlists (jusqu'à 5)" },
  { label: 'Activité TikTok' },
  { label: 'SORTIE FINALE 🎉' },
]
