import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Spinner } from '../components/ui/Spinner'
import { Field, inputClass } from '../components/site/fields'
import { LeaderboardSection } from '../components/site/LeaderboardSection'
import { LinksSection, ShowsSection } from '../components/site/LinkSections'
import { MusicSection, PhotosSection } from '../components/site/MediaSections'
import { CallSection, MessagesSection, TextsSection } from '../components/site/SiteTextSections'
import {
  clearSiteConnection,
  DEFAULT_SITE_REPO,
  getSiteConnection,
  loadSiteData,
  publishSiteData,
  saveSiteConnection,
  siteProblems,
  slugify,
  type SiteConnection,
} from '../lib/siteRepo'
import type { SiteData } from '../types/site'

const SECTIONS = [
  { id: 'music', label: 'Musiques' },
  { id: 'call', label: 'Appel' },
  { id: 'messages', label: 'Messages' },
  { id: 'photos', label: 'Photos' },
  { id: 'links', label: 'Liens' },
  { id: 'shows', label: 'Concerts' },
  { id: 'texts', label: 'Textes' },
  { id: 'scores', label: 'Classement' },
] as const
type SectionId = (typeof SECTIONS)[number]['id']

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

  async function run(task: () => Promise<void>) {
    setError('')
    try {
      await task()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Une erreur est survenue.')
    }
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
        contacts: draft.contacts.map((contact) => ({ ...contact, track: renamed.get(contact.track) ?? contact.track })),
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

  const media = { data: draft, change, connection, pending, addFile, run }

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

      {section === 'music' && <MusicSection {...media} />}
      {section === 'call' && <CallSection data={draft} change={change} />}
      {section === 'messages' && <MessagesSection data={draft} change={change} />}
      {section === 'photos' && <PhotosSection {...media} />}
      {section === 'links' && <LinksSection data={draft} change={change} />}
      {section === 'shows' && <ShowsSection data={draft} change={change} />}
      {section === 'texts' && <TextsSection data={draft} change={change} />}
      {section === 'scores' && <LeaderboardSection connection={connection} />}

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
