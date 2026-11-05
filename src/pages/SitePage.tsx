import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Spinner } from '../components/ui/Spinner'
import { CallSection, MessagesSection } from '../components/site/SiteTextSections'
import { LeaderboardSection } from '../components/site/LeaderboardSection'
import {
  MAX_CLIP_SECONDS,
  audioDuration,
  clearSiteConnection,
  DEFAULT_SITE_REPO,
  getSiteConnection,
  loadSiteData,
  publishSiteData,
  readRepoFile,
  saveSiteConnection,
  siteProblems,
  slugify,
  squareJpeg,
  type SiteConnection,
} from '../lib/siteRepo'
import { SITE_PLATFORMS, type SiteData, type SitePhoto, type SitePlatform, type SiteRelease } from '../types/site'

const inputClass =
  'w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700'
const PLATFORM_KEYS = Object.keys(SITE_PLATFORMS) as SitePlatform[]
const SECTIONS = [
  { id: 'music', label: 'Musiques' },
  { id: 'call', label: 'Appel' },
  { id: 'messages', label: 'Messages' },
  { id: 'photos', label: 'Photos' },
  { id: 'links', label: 'Liens' },
  { id: 'shows', label: 'Concerts' },
  { id: 'scores', label: 'Classement' },
] as const
type SectionId = (typeof SECTIONS)[number]['id']

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>}
    </label>
  )
}

function FileButton({ label, accept, onFile }: { label: string; accept: string; onFile: (file: File) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center rounded-md border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700">
      {label}
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) onFile(file)
        }}
      />
    </label>
  )
}

/** Shows a file from the repository, or the local version if it's waiting to be published. */
function SiteImage({ connection, path, pending, alt }: { connection: SiteConnection; path: string; pending: Map<string, Blob>; alt: string }) {
  const [url, setUrl] = useState('')
  const local = path ? pending.get(path) : undefined
  useEffect(() => {
    let cancelled = false
    let created = ''
    const show = (blob: Blob) => {
      if (cancelled) return
      created = URL.createObjectURL(blob)
      setUrl(created)
    }
    setUrl('')
    if (local) show(local)
    else if (path) readRepoFile(connection, path).then(show).catch(() => {})
    return () => {
      cancelled = true
      if (created) URL.revokeObjectURL(created)
    }
  }, [connection, path, local])
  return (
    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
      {url && <img src={url} alt={alt} className="h-full w-full object-cover" />}
    </div>
  )
}

function ConnectForm({ error, onConnect }: { error: string; onConnect: (connection: SiteConnection) => void }) {
  const [repo, setRepo] = useState(DEFAULT_SITE_REPO)
  const [token, setToken] = useState('')
  return (
    <Card className="max-w-xl p-4">
      <h2 className="text-sm font-semibold">Connecter le portail au site</h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        À faire une fois par appareil. Le jeton reste uniquement sur cet appareil.
      </p>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-300">
        <li>
          Sur GitHub, ouvre{' '}
          <a className="underline" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">
            la création d’un jeton « fine-grained »
          </a>
          .
        </li>
        <li>Sous « Repository access », choisis uniquement le dépôt du site.</li>
        <li>Sous « Permissions », mets « Contents » sur « Read and write ».</li>
        <li>Crée le jeton et colle-le ci-dessous.</li>
      </ol>
      <form
        className="mt-4 space-y-3"
        onSubmit={(event) => {
          event.preventDefault()
          if (repo.trim() && token.trim()) onConnect({ repo: repo.trim(), token: token.trim() })
        }}
      >
        <Field label="Dépôt GitHub du site">
          <input className={inputClass} value={repo} onChange={(event) => setRepo(event.target.value)} />
        </Field>
        <Field label="Jeton GitHub">
          <input className={inputClass} type="password" autoComplete="off" value={token} onChange={(event) => setToken(event.target.value)} />
        </Field>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <Button variant="primary" type="submit" disabled={!repo.trim() || !token.trim()}>
          Connecter
        </Button>
      </form>
    </Card>
  )
}

export function SitePage() {
  const [connection, setConnection] = useState(getSiteConnection)
  const [original, setOriginal] = useState<SiteData | null>(null)
  const [draft, setDraft] = useState<SiteData | null>(null)
  const [head, setHead] = useState('')
  const [pending, setPending] = useState<Map<string, Blob>>(new Map())
  const [section, setSection] = useState<SectionId>('music')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async (current: SiteConnection) => {
    setBusy(true)
    setError('')
    try {
      const loaded = await loadSiteData(current)
      setOriginal(loaded.data)
      setDraft(loaded.data)
      setHead(loaded.head)
      setPending(new Map())
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Chargement impossible.')
      setDraft(null)
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    if (connection) void load(connection)
  }, [connection, load])

  const dirty = useMemo(
    () => pending.size > 0 || JSON.stringify(draft) !== JSON.stringify(original),
    [draft, original, pending],
  )
  const problems = useMemo(() => (draft ? siteProblems(draft) : []), [draft])

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  function connect(next: SiteConnection) {
    saveSiteConnection(next)
    setConnection(next)
  }

  function disconnect() {
    clearSiteConnection()
    setConnection(null)
    setDraft(null)
    setOriginal(null)
    setError('')
  }

  function change(update: (data: SiteData) => SiteData) {
    setNotice('')
    setDraft((current) => (current ? update(current) : current))
  }

  function addFile(path: string, blob: Blob) {
    setPending((current) => new Map(current).set(path, blob))
  }

  function updateRelease(id: string, fields: Partial<SiteRelease>) {
    change((data) => ({ ...data, releases: data.releases.map((release) => (release.id === id ? { ...release, ...fields } : release)) }))
  }

  function addRelease() {
    change((data) => {
      let id = 'nouveau-morceau'
      for (let n = 2; data.releases.some((release) => release.id === id); n += 1) id = `nouveau-morceau-${n}`
      const today = new Date().toISOString().slice(0, 10)
      return {
        ...data,
        releases: [{ id, title: '', date: today, color: '#ff3d7f', cover: '', audio: '', excerpt: true, links: {} }, ...data.releases],
      }
    })
    setSection('music')
  }

  function removeRelease(release: SiteRelease) {
    change((data) => {
      const releases = data.releases.filter((other) => other.id !== release.id)
      return {
        ...data,
        releases,
        featured: data.featured === release.id ? (releases[0]?.id ?? '') : data.featured,
        photos: data.photos.map((photo) => (photo.track === release.id ? { ...photo, track: releases[0]?.id ?? '' } : photo)),
        call: data.call.track === release.id ? { ...data.call, track: releases[0]?.id ?? '' } : data.call,
        inboxSenders: data.inboxSenders.map((sender) => ({
          ...sender,
          messages: sender.messages.map((message) => (message.track === release.id ? { ...message, track: releases[0]?.id ?? '' } : message)),
        })),
      }
    })
  }

  function updatePhoto(index: number, fields: Partial<SitePhoto>) {
    change((data) => ({ ...data, photos: data.photos.map((photo, i) => (i === index ? { ...photo, ...fields } : photo)) }))
  }

  function movePhoto(index: number, by: number) {
    change((data) => {
      const photos = [...data.photos]
      const [photo] = photos.splice(index, 1)
      photos.splice(index + by, 0, photo)
      return { ...data, photos }
    })
  }

  async function run(task: () => Promise<void>) {
    setError('')
    try {
      await task()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Une erreur est survenue.')
    }
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

  async function addPhoto(file: File) {
    await run(async () => {
      if (!draft) return
      const stamp = Date.now()
      const image = `assets/galerie/photo-${stamp}.jpg`
      addFile(image, await squareJpeg(file, 180))
      change((data) => ({
        ...data,
        photos: [{ file: `IMG_${String(stamp).slice(-4)}`, stamp: '12.10.07 23:59', caption: '', track: data.featured, image }, ...data.photos],
      }))
    })
  }

  async function publish() {
    if (!connection || !draft || !original || problems.length > 0) return
    setBusy(true)
    setError('')
    try {
      // Newest first, and a song's address follows its title the first time it's named
      const renamed = new Map<string, string>()
      const taken = new Set(original.releases.map((release) => release.id))
      const fileMoves = new Map<string, Blob>(pending)
      const releases = [...draft.releases]
        .map((release) => {
          if (taken.has(release.id)) return release
          let id = slugify(release.title)
          for (let n = 2; taken.has(id); n += 1) id = `${slugify(release.title)}-${n}`
          taken.add(id)
          renamed.set(release.id, id)
          const move = (path: string) => {
            const next = path.replace(release.id, id)
            const blob = fileMoves.get(path)
            if (blob) {
              fileMoves.delete(path)
              fileMoves.set(next, blob)
            }
            return next
          }
          return { ...release, id, cover: move(release.cover), audio: move(release.audio) }
        })
        .sort((a, b) => b.date.localeCompare(a.date))
      const data: SiteData = {
        ...draft,
        releases,
        featured: renamed.get(draft.featured) ?? draft.featured,
        photos: draft.photos.map((photo) => ({ ...photo, track: renamed.get(photo.track) ?? photo.track })),
        call: { ...draft.call, track: renamed.get(draft.call.track) ?? draft.call.track },
        inboxSenders: draft.inboxSenders.map((sender) => ({
          ...sender,
          messages: sender.messages.map((message) => ({ ...message, track: message.track ? (renamed.get(message.track) ?? message.track) : message.track })),
        })),
        shows: [...draft.shows].sort((a, b) => a.date.localeCompare(b.date)),
      }
      const newHead = await publishSiteData(connection, { data, original, files: fileMoves, head, message: 'Mise à jour du site depuis HSHQ' })
      setOriginal(data)
      setDraft(data)
      setHead(newHead)
      setPending(new Map())
      setNotice('Publié. Le site se met à jour d’ici une à deux minutes.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Publication impossible.')
    } finally {
      setBusy(false)
    }
  }

  if (!connection || (!draft && !busy && error)) {
    return (
      <div className="p-4">
        <h1 className="mb-4 text-lg font-semibold">Site web</h1>
        <ConnectForm error={error} onConnect={connect} />
      </div>
    )
  }

  if (!draft) {
    return (
      <div className="flex items-center justify-center p-10">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="p-4 pb-24">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Site web</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Rien ne change en ligne avant d’avoir cliqué sur « Publier ».</p>
        </div>
        <Button variant="ghost" onClick={disconnect}>
          Déconnecter cet appareil
        </Button>
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
        {SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            className={
              'shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ' +
              (section === id
                ? 'border-blue-500 text-zinc-900 dark:text-zinc-50'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100')
            }
          >
            {label}
          </button>
        ))}
      </div>

      {section === 'music' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button variant="primary" onClick={addRelease}>
              + Nouveau morceau
            </Button>
          </div>
          {draft.releases.map((release) => (
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
                  <input type="radio" name="featured" checked={draft.featured === release.id} onChange={() => change((data) => ({ ...data, featured: release.id }))} />
                  Mis en avant
                </label>
                <Button variant="ghost" className="ml-auto text-red-600 dark:text-red-400" disabled={draft.releases.length === 1} onClick={() => removeRelease(release)}>
                  Supprimer
                </Button>
              </div>
              {release.audio && pending.has(release.audio) && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Nouvel extrait prêt à être publié.</p>
              )}
            </Card>
          ))}
        </div>
      )}

      {section === 'scores' && <LeaderboardSection connection={connection} />}

      {section === 'call' && <CallSection data={draft} change={change} />}

      {section === 'messages' && <MessagesSection data={draft} change={change} />}

      {section === 'photos' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <FileButton label="+ Ajouter une photo" accept="image/*" onFile={(file) => void addPhoto(file)} />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">La photo est recadrée au carré, réduite et débarrassée de ses métadonnées (lieu, appareil…).</p>
          {draft.photos.map((photo, index) => (
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
                      {draft.releases.map((release) => (
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
                  <Button variant="ghost" disabled={index === draft.photos.length - 1} onClick={() => movePhoto(index, 1)} aria-label="Descendre la photo">
                    ↓
                  </Button>
                  <Button
                    variant="ghost"
                    className="ml-auto text-red-600 dark:text-red-400"
                    onClick={() => change((data) => ({ ...data, photos: data.photos.filter((_, i) => i !== index) }))}
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {section === 'links' && (
        <div>
          <SectionHeading className="mb-2">Pages de l’artiste</SectionHeading>
          <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">Laisse un champ vide pour retirer la plateforme du site.</p>
          <Card className="grid gap-3 p-4 sm:grid-cols-2">
            {PLATFORM_KEYS.map((key) => (
              <Field key={key} label={SITE_PLATFORMS[key]}>
                <input
                  className={inputClass}
                  type="url"
                  value={draft.platforms[key] ?? ''}
                  onChange={(event) =>
                    change((data) => {
                      const platforms = { ...data.platforms }
                      if (event.target.value) platforms[key] = event.target.value
                      else delete platforms[key]
                      return { ...data, platforms }
                    })
                  }
                />
              </Field>
            ))}
          </Card>
          <div className="mb-2 mt-6 flex items-center justify-between">
            <SectionHeading className="">Réseaux et autres liens</SectionHeading>
            <Button onClick={() => change((data) => ({ ...data, socials: [...data.socials, { label: '', handle: '', url: '' }] }))}>+ Ajouter un lien</Button>
          </div>
          <div className="space-y-2">
            {draft.socials.map((social, index) => {
              const update = (fields: Partial<typeof social>) =>
                change((data) => ({ ...data, socials: data.socials.map((other, i) => (i === index ? { ...other, ...fields } : other)) }))
              return (
                <Card key={index} className="grid gap-3 p-4 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end">
                  <Field label="Nom">
                    <input className={inputClass} placeholder="Instagram" value={social.label} onChange={(event) => update({ label: event.target.value })} />
                  </Field>
                  <Field label="Détail">
                    <input className={inputClass} placeholder="@hsmusique" value={social.handle} onChange={(event) => update({ handle: event.target.value })} />
                  </Field>
                  <Field label="Adresse">
                    <input className={inputClass} type="url" placeholder="https://…" value={social.url} onChange={(event) => update({ url: event.target.value })} />
                  </Field>
                  <Button variant="ghost" className="text-red-600 dark:text-red-400" onClick={() => change((data) => ({ ...data, socials: data.socials.filter((_, i) => i !== index) }))}>
                    Supprimer
                  </Button>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {section === 'shows' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Les concerts passés disparaissent seuls du téléphone.</p>
            <Button variant="primary" onClick={() => change((data) => ({ ...data, shows: [...data.shows, { date: '', city: '', venue: '', url: '' }] }))}>
              + Nouveau concert
            </Button>
          </div>
          {draft.shows.length === 0 && <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">Aucun concert. La tuile Agenda reste cachée.</p>}
          {draft.shows.map((show, index) => {
            const update = (fields: Partial<typeof show>) =>
              change((data) => ({ ...data, shows: data.shows.map((other, i) => (i === index ? { ...other, ...fields } : other)) }))
            return (
              <Card key={index} className="grid gap-3 p-4 sm:grid-cols-[auto_1fr_1fr_2fr_auto] sm:items-end">
                <Field label="Date">
                  <input className={inputClass} type="date" value={show.date} onChange={(event) => update({ date: event.target.value })} />
                </Field>
                <Field label="Ville">
                  <input className={inputClass} value={show.city} onChange={(event) => update({ city: event.target.value })} />
                </Field>
                <Field label="Salle">
                  <input className={inputClass} value={show.venue ?? ''} onChange={(event) => update({ venue: event.target.value })} />
                </Field>
                <Field label="Billetterie">
                  <input className={inputClass} type="url" placeholder="https://…" value={show.url ?? ''} onChange={(event) => update({ url: event.target.value })} />
                </Field>
                <Button variant="ghost" className="text-red-600 dark:text-red-400" onClick={() => change((data) => ({ ...data, shows: data.shows.filter((_, i) => i !== index) }))}>
                  Supprimer
                </Button>
              </Card>
            )
          })}
        </div>
      )}

      {(dirty || error || notice) && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-[#0d1117] md:left-56">
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-0 flex-1 text-sm">
              {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
              {notice && !dirty && <p className="text-green-700 dark:text-green-400">{notice}</p>}
              {dirty && problems.length > 0 && <p className="text-amber-700 dark:text-amber-400">À corriger : {problems[0]}{problems.length > 1 ? ` (+${problems.length - 1})` : ''}</p>}
              {dirty && problems.length === 0 && !error && <p className="text-zinc-500 dark:text-zinc-400">Changements non publiés.</p>}
            </div>
            {dirty && (
              <>
                <Button disabled={busy} onClick={() => connection && void load(connection)}>
                  Annuler
                </Button>
                <Button variant="primary" disabled={busy || problems.length > 0} onClick={() => void publish()}>
                  {busy ? 'Publication…' : 'Publier'}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
