import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { MAX_CLIP_SECONDS, audioDuration, squareJpeg, type SiteConnection } from '../../lib/siteRepo'
import { SITE_PLATFORMS, type SiteData, type SitePhoto, type SitePlatform, type SiteRelease } from '../../types/site'
import { Field, FileButton, RemoveButton, SiteImage, inputClass, type ChangeSite } from './fields'

const PLATFORM_KEYS = Object.keys(SITE_PLATFORMS) as SitePlatform[]

interface MediaProps {
  data: SiteData
  change: ChangeSite
  connection: SiteConnection
  pending: Map<string, Blob>
  addFile: (path: string, blob: Blob) => void
  /** Runs a task and shows its error in the page's bottom bar. */
  run: (task: () => Promise<void>) => Promise<void>
}

export function MusicSection({ data, change, connection, pending, addFile, run }: MediaProps) {
  function updateRelease(id: string, fields: Partial<SiteRelease>) {
    change((current) => ({ ...current, releases: current.releases.map((release) => (release.id === id ? { ...release, ...fields } : release)) }))
  }

  function addRelease() {
    change((current) => {
      let id = 'nouveau-morceau'
      for (let n = 2; current.releases.some((release) => release.id === id); n += 1) id = `nouveau-morceau-${n}`
      const today = new Date().toISOString().slice(0, 10)
      return {
        ...current,
        releases: [{ id, title: '', date: today, color: '#ff3d7f', cover: '', audio: '', excerpt: true, links: {} }, ...current.releases],
      }
    })
  }

  function removeRelease(release: SiteRelease) {
    change((current) => {
      const releases = current.releases.filter((other) => other.id !== release.id)
      return {
        ...current,
        releases,
        featured: current.featured === release.id ? (releases[0]?.id ?? '') : current.featured,
        photos: current.photos.map((photo) => (photo.track === release.id ? { ...photo, track: releases[0]?.id ?? '' } : photo)),
        contacts: current.contacts.map((contact) => (contact.track === release.id ? { ...contact, track: releases[0]?.id ?? '' } : contact)),
        call: current.call.track === release.id ? { ...current.call, track: releases[0]?.id ?? '' } : current.call,
        inboxSenders: current.inboxSenders.map((sender) => ({
          ...sender,
          messages: sender.messages.map((message) => (message.track === release.id ? { ...message, track: releases[0]?.id ?? '' } : message)),
        })),
      }
    })
  }

  async function setCover(release: SiteRelease, file: File) {
    await run(async () => {
      const path = `assets/covers/${release.id}.jpg`
      addFile(path, await squareJpeg(file, 800))
      updateRelease(release.id, { cover: path })
    })
  }

  async function setClip(release: SiteRelease, file: File) {
    await run(async () => {
      const seconds = await audioDuration(file)
      if (seconds > MAX_CLIP_SECONDS) {
        throw new Error(`Ce fichier dure ${Math.round(seconds)} s. Le site n’accepte que des extraits de ${MAX_CLIP_SECONDS} s maximum, pour ne jamais publier un morceau entier.`)
      }
      const extension = file.name.toLowerCase().endsWith('.mp3') ? 'mp3' : 'm4a'
      const path = `assets/clips/${release.id}.${extension}`
      addFile(path, file)
      updateRelease(release.id, { audio: path, excerpt: true })
    })
  }

  return (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button variant="primary" onClick={addRelease}>
              + Nouveau morceau
            </Button>
          </div>
          {data.releases.map((release) => (
            <Card key={release.id} className="space-y-3 p-4">
              <div className="flex gap-3">
                <SiteImage connection={connection} path={release.cover} pending={pending} alt={`Pochette de ${release.title}`} />
                <div className="min-w-0 flex-1 space-y-3">
                  <Field label="Titre">
                    <input className={inputClass} value={release.title} onChange={(event) => updateRelease(release.id, { title: event.target.value })} />
                  </Field>
                  <div className="grid grid-cols-[1fr_auto] gap-3">
                    <Field label="Date de sortie">
                      <input className={inputClass} type="date" value={release.date} onChange={(event) => updateRelease(release.id, { date: event.target.value })} />
                    </Field>
                    <Field label="Couleur">
                      <input className="h-[38px] w-14 rounded-md border border-zinc-300 bg-transparent p-1 dark:border-zinc-700" type="color" value={release.color} onChange={(event) => updateRelease(release.id, { color: event.target.value })} />
                    </Field>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {PLATFORM_KEYS.map((key) => (
                  <Field key={key} label={SITE_PLATFORMS[key]}>
                    <input
                      className={inputClass}
                      type="url"
                      placeholder="https://… (sinon, la page de l’artiste)"
                      value={release.links[key] ?? ''}
                      onChange={(event) => {
                        const links = { ...release.links }
                        if (event.target.value) links[key] = event.target.value
                        else delete links[key]
                        updateRelease(release.id, { links })
                      }}
                    />
                  </Field>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <FileButton label={release.cover ? 'Changer la pochette' : 'Ajouter la pochette'} accept="image/*" onFile={(file) => void setCover(release, file)} />
                <FileButton label={release.audio ? 'Changer l’extrait' : 'Ajouter l’extrait'} accept=".m4a,.mp3,audio/mp4,audio/mpeg" onFile={(file) => void setClip(release, file)} />
                <label className="ml-1 flex items-center gap-1.5 text-sm">
                  <input type="radio" name="featured" checked={data.featured === release.id} onChange={() => change((current) => ({ ...current, featured: release.id }))} />
                  Mis en avant
                </label>
                <div className="ml-auto">
                  <RemoveButton disabled={data.releases.length === 1} onClick={() => removeRelease(release)} />
                </div>
              </div>
              {release.audio && pending.has(release.audio) && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Nouvel extrait prêt à être publié.</p>
              )}
            </Card>
          ))}
        </div>
  )
}

export function PhotosSection({ data, change, connection, pending, addFile, run }: MediaProps) {
  function updatePhoto(index: number, fields: Partial<SitePhoto>) {
    change((current) => ({ ...current, photos: current.photos.map((photo, i) => (i === index ? { ...photo, ...fields } : photo)) }))
  }

  function movePhoto(index: number, by: number) {
    change((current) => {
      const photos = [...current.photos]
      const [photo] = photos.splice(index, 1)
      photos.splice(index + by, 0, photo)
      return { ...current, photos }
    })
  }

  async function addPhoto(file: File) {
    await run(async () => {
      const stamp = Date.now()
      const image = `assets/galerie/photo-${stamp}.jpg`
      addFile(image, await squareJpeg(file, 180))
      change((current) => ({
        ...current,
        photos: [{ file: `IMG_${String(stamp).slice(-4)}`, stamp: '12.10.07 23:59', caption: '', track: current.featured, image }, ...current.photos],
      }))
    })
  }

  return (
        <div className="space-y-3">
          <div className="flex justify-end">
            <FileButton label="+ Ajouter une photo" accept="image/*" onFile={(file) => void addPhoto(file)} />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">La photo est recadrée au carré, réduite et débarrassée de ses métadonnées (lieu, appareil…).</p>
          {data.photos.map((photo, index) => (
            <Card key={photo.image || index} className="flex gap-3 p-4">
              <SiteImage connection={connection} path={photo.image} pending={pending} alt={photo.caption} />
              <div className="min-w-0 flex-1 space-y-3">
                <Field label="Légende">
                  <input className={inputClass} value={photo.caption} onChange={(event) => updatePhoto(index, { caption: event.target.value })} />
                </Field>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Nom du fichier">
                    <input className={inputClass} value={photo.file} onChange={(event) => updatePhoto(index, { file: event.target.value })} />
                  </Field>
                  <Field label="Date affichée">
                    <input className={inputClass} value={photo.stamp} onChange={(event) => updatePhoto(index, { stamp: event.target.value })} />
                  </Field>
                  <Field label="Morceau lié">
                    <select className={inputClass} value={photo.track} onChange={(event) => updatePhoto(index, { track: event.target.value })}>
                      {data.releases.map((release) => (
                        <option key={release.id} value={release.id}>
                          {release.title || 'Nouveau morceau'}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" disabled={index === 0} onClick={() => movePhoto(index, -1)} aria-label="Monter la photo">
                    ↑
                  </Button>
                  <Button variant="ghost" disabled={index === data.photos.length - 1} onClick={() => movePhoto(index, 1)} aria-label="Descendre la photo">
                    ↓
                  </Button>
                  <div className="ml-auto">
                    <RemoveButton onClick={() => change((current) => ({ ...current, photos: current.photos.filter((_, i) => i !== index) }))} />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
  )
}
