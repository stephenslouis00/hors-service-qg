import type { SiteData } from '../types/site'

/**
 * The portal edits the public site by committing to its GitHub repository;
 * Cloudflare Pages then redeploys on its own. The token stays on this device only,
 * and should be limited to that one repository's contents.
 */
const API = import.meta.env.VITE_SITE_GITHUB_API || 'https://api.github.com'
const DATA_PATH = 'site-data.js'
const BRANCH = 'main'
const REPO_KEY = 'hs-site-repo'
const TOKEN_KEY = 'hs-site-token'
export const DEFAULT_SITE_REPO = 'stephenslouis00/hors-service'
const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://hors-service.stephenslouis00.workers.dev'

export interface SiteConnection {
  repo: string
  token: string
}

export function getSiteConnection(): SiteConnection | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    return token ? { repo: localStorage.getItem(REPO_KEY) || DEFAULT_SITE_REPO, token } : null
  } catch {
    return null
  }
}

export function saveSiteConnection({ repo, token }: SiteConnection) {
  localStorage.setItem(REPO_KEY, repo)
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearSiteConnection() {
  localStorage.removeItem(TOKEN_KEY)
}

async function github(connection: SiteConnection, path: string, init: RequestInit = {}, accept = 'application/vnd.github+json') {
  const response = await fetch(`${API}/repos/${connection.repo}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Accept: accept,
      Authorization: `Bearer ${connection.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  })
  if (response.ok) return response
  if (response.status === 401) throw new Error('GitHub refuse ce jeton : il est invalide ou expiré.')
  if (response.status === 403) throw new Error("Ce jeton n'a pas le droit de modifier le dépôt (ou la limite GitHub est atteinte).")
  if (response.status === 404) throw new Error(`Introuvable sur GitHub : vérifie le dépôt « ${connection.repo} », son contenu et l'accès du jeton.`)
  throw new Error(`Erreur GitHub (${response.status}).`)
}

async function json<T>(connection: SiteConnection, path: string, body?: unknown, method = body ? 'POST' : 'GET'): Promise<T> {
  const response = await github(connection, path, { method, body: body ? JSON.stringify(body) : undefined })
  return response.json() as Promise<T>
}

async function headCommit(connection: SiteConnection) {
  const ref = await json<{ object: { sha: string } }>(connection, `/git/ref/heads/${BRANCH}`)
  return ref.object.sha
}

function repoFilePath(path: string) {
  return path.split('/').map(encodeURIComponent).join('/')
}

export async function loadSiteData(connection: SiteConnection): Promise<{ data: SiteData; head: string }> {
  const head = await headCommit(connection)
  const response = await github(connection, `/contents/${DATA_PATH}?ref=${head}`, {}, 'application/vnd.github.raw+json')
  const text = (await response.text()).trim().replace(/^window\.SITE_DATA\s*=\s*/, '').replace(/;$/, '')
  return { data: JSON.parse(text) as SiteData, head }
}

export async function readRepoFile(connection: SiteConnection, path: string): Promise<Blob> {
  const response = await github(connection, `/contents/${repoFilePath(path)}?ref=${BRANCH}`, {}, 'application/vnd.github.raw+json')
  return response.blob()
}

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(new Error('Lecture du fichier impossible.'))
    reader.readAsDataURL(blob)
  })
}

/** Every file a version of the content points to, so unused ones can be removed on publish. */
export function filesUsedBy(data: SiteData): Set<string> {
  return new Set([
    ...data.releases.flatMap((release) => [release.cover, release.audio]),
    ...data.photos.map((photo) => photo.image),
  ].filter((path) => !/^https?:/.test(path)))
}

/** Publishes the content and its files as one commit, so the site never sees half a change. Returns the new head. */
export async function publishSiteData(
  connection: SiteConnection,
  { data, original, files, head, message }: { data: SiteData; original: SiteData; files: Map<string, Blob>; head: string; message: string },
): Promise<string> {
  if ((await headCommit(connection)) !== head) {
    throw new Error("Le site a changé depuis l'ouverture de cette page. Annule tes changements pour recharger, puis recommence.")
  }
  const used = filesUsedBy(data)
  const tree: { path: string; mode: '100644'; type: 'blob'; sha?: string | null; content?: string }[] = [
    { path: DATA_PATH, mode: '100644', type: 'blob', content: `window.SITE_DATA = ${JSON.stringify(data, null, 2)};\n` },
  ]
  for (const [path, blob] of files) {
    if (!used.has(path)) continue
    const uploaded = await json<{ sha: string }>(connection, '/git/blobs', { content: await toBase64(blob), encoding: 'base64' })
    tree.push({ path, mode: '100644', type: 'blob', sha: uploaded.sha })
  }
  for (const path of filesUsedBy(original)) {
    if (!used.has(path)) tree.push({ path, mode: '100644', type: 'blob', sha: null })
  }
  const parent = await json<{ tree: { sha: string } }>(connection, `/git/commits/${head}`)
  const newTree = await json<{ sha: string }>(connection, '/git/trees', { base_tree: parent.tree.sha, tree })
  const commit = await json<{ sha: string }>(connection, '/git/commits', { message, tree: newTree.sha, parents: [head] })
  await json(connection, `/git/refs/heads/${BRANCH}`, { sha: commit.sha }, 'PATCH')
  return commit.sha
}

/** Square-crops an image and re-encodes it, which also drops its metadata (location, device…). */
export async function squareJpeg(file: File, size: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = Math.min(size, side)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Traitement de l’image impossible.')
  context.imageSmoothingQuality = 'high'
  context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Traitement de l’image impossible.'))), 'image/jpeg', 0.82)
  })
}

export const MAX_CLIP_SECONDS = 45

export function audioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(audio.duration)
    }
    audio.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Fichier audio illisible. Utilise un .m4a ou un .mp3.'))
    }
    audio.src = url
  })
}

export function slugify(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/gi, 'oe').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'morceau'
}

/** What would stop the site working or send visitors nowhere. Empty when it's safe to publish. */
export function siteProblems(data: SiteData): string[] {
  const problems: string[] = []
  const badUrl = (url?: string) => Boolean(url) && !/^(https?:\/\/|mailto:)\S+$/.test(url ?? '')
  if (data.releases.length === 0) problems.push('Il faut au moins un morceau.')
  if (!data.releases.some((release) => release.id === data.featured)) problems.push('Choisis le morceau mis en avant.')
  for (const release of data.releases) {
    const name = release.title || 'Nouveau morceau'
    if (!release.title.trim()) problems.push('Un morceau n’a pas de titre.')
    if (!release.date) problems.push(`${name} : date manquante.`)
    if (!release.cover) problems.push(`${name} : pochette manquante.`)
    if (!release.audio) problems.push(`${name} : extrait manquant.`)
    if (Object.values(release.links).some(badUrl)) problems.push(`${name} : un lien n’est pas valide.`)
  }
  if (Object.values(data.platforms).some(badUrl)) problems.push('Un lien de plateforme n’est pas valide.')
  for (const social of data.socials) {
    if (!social.label.trim() || !social.url.trim() || badUrl(social.url)) problems.push(`Lien « ${social.label || 'sans nom'} » : nom ou adresse à corriger.`)
  }
  for (const photo of data.photos) {
    if (!photo.image) problems.push('Une photo n’a pas d’image.')
    if (!photo.caption.trim()) problems.push(`${photo.file} : légende manquante.`)
    if (!data.releases.some((release) => release.id === photo.track)) problems.push(`${photo.file} : choisis un morceau.`)
  }
  for (const show of data.shows) {
    if (!show.date || !show.city.trim()) problems.push('Un concert n’a pas de date ou de ville.')
    if (badUrl(show.url)) problems.push(`Concert à ${show.city} : le lien n’est pas valide.`)
  }
  const hasSong = (id?: string) => data.releases.some((release) => release.id === id)
  if (!data.call.name.trim()) problems.push('Appel : le nom est manquant.')
  if (!hasSong(data.call.track)) problems.push('Appel : choisis la chanson.')
  for (const sender of data.inboxSenders) {
    const name = sender.from || 'Sans nom'
    if (!sender.from.trim()) problems.push('Une personne de la messagerie n’a pas de nom.')
    if (sender.messages.length === 0) problems.push(`${name} : ajoute au moins un message, ou supprime cette personne.`)
    for (const message of sender.messages) {
      if (!message.text.trim()) problems.push(`${name} : un message est vide.`)
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(message.time)) problems.push(`${name} : une heure est à écrire sous la forme 09:30.`)
      if (message.track && !hasSong(message.track)) problems.push(`${name} : un message pointe vers un morceau supprimé.`)
    }
  }
  if (data.exMessages.length === 0 || data.exMessages.some((text) => !text.trim())) problems.push('Textos à ton ex : il en faut au moins un, et aucun vide.')
  if (!data.exReply.trim()) problems.push('La réponse de ton ex est vide.')
  if (data.exLost.length === 0 || data.exLost.some((notice) => !notice.title.trim() || !notice.text.trim())) problems.push('Notifications après ton ex : il en faut au moins une, avec titre et texte.')
  if (!data.gameOverTitle.trim() || data.gameOver.length === 0 || data.gameOver.some((text) => !text.trim())) problems.push('Fin du jeu : titre et messages à compléter.')
  return problems
}

export interface SiteScore {
  id: number
  name: string
  score: number
}

export async function loadSiteScores(): Promise<SiteScore[]> {
  const response = await fetch(`${SITE_URL}/api/scores`, { cache: 'no-store' })
  if (!response.ok) throw new Error('Classement indisponible pour le moment.')
  return response.json() as Promise<SiteScore[]>
}

export async function deleteSiteScore(connection: SiteConnection, id: number) {
  const response = await fetch(`${SITE_URL}/api/scores/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${connection.token}` },
  })
  if (response.status === 403) throw new Error('Ce jeton n’a pas le droit de modifier le classement.')
  if (!response.ok) throw new Error('Suppression impossible pour le moment.')
}
