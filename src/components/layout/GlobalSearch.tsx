import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReleases } from '../../hooks/useReleases'
import { useSongs } from '../../hooks/useSongs'
import { usePromoContacts } from '../../hooks/usePromoContacts'
import { useAdminDocs } from '../../hooks/useDocs'
import { useShows } from '../../hooks/useShows'
import { Modal } from '../ui/Modal'
import { SearchIcon, PromotionIcon, MusicNoteIcon, PersonIcon, FileIcon, LocationIcon } from './icons'

interface SearchResult {
  id: string
  icon: ReactNode
  label: string
  sub: string
  to: string
}

function matches(query: string, ...fields: (string | undefined | null)[]) {
  const q = query.toLowerCase()
  return fields.some((f) => f?.toLowerCase().includes(q))
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const { releases } = useReleases()
  const { songs } = useSongs()
  const { contacts } = usePromoContacts()
  const { docs } = useAdminDocs()
  const { shows } = useShows()

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim()
    if (q.length < 2) return []

    const out: SearchResult[] = []
    for (const r of releases) {
      if (matches(q, r.title)) out.push({ id: `release-${r.id}`, icon: <PromotionIcon />, label: r.title, sub: 'Sortie', to: `/releases/projects/${r.id}` })
    }
    for (const s of songs) {
      if (matches(q, s.title)) out.push({ id: `song-${s.id}`, icon: <MusicNoteIcon />, label: s.title, sub: 'Morceau', to: `/releases/songs/${s.id}` })
    }
    for (const c of contacts) {
      if (matches(q, c.name, c.org)) out.push({ id: `contact-${c.id}`, icon: <PersonIcon />, label: c.name, sub: c.org || 'Contact', to: `/releases/contacts` })
    }
    for (const d of docs) {
      if (matches(q, d.title)) out.push({ id: `doc-${d.id}`, icon: <FileIcon />, label: d.title, sub: 'Document', to: `/administrative` })
    }
    for (const s of shows) {
      if (matches(q, s.venueName, s.city)) out.push({ id: `show-${s.id}`, icon: <LocationIcon />, label: s.venueName, sub: s.city || 'Concert', to: `/booking` })
    }
    return out.slice(0, 30)
  }, [query, releases, songs, contacts, docs, shows])

  function close() {
    setOpen(false)
    setQuery('')
  }

  function goTo(to: string) {
    close()
    navigate(to)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        aria-label="Rechercher"
        title="Rechercher"
      >
        <SearchIcon />
      </button>

      {open && (
        <Modal title="Rechercher" onClose={close}>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Un morceau, une sortie, un contact, un lieu…"
            className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-700"
          />

          {query.trim().length >= 2 && (
            <div className="mt-3 max-h-80 space-y-0.5 overflow-y-auto">
              {results.length === 0 ? (
                <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-500">Aucun résultat.</p>
              ) : (
                results.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => goTo(r.to)}
                    className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                  >
                    <span className="shrink-0 text-zinc-400 dark:text-zinc-500">{r.icon}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-zinc-900 dark:text-zinc-100">{r.label}</span>
                    <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-500">{r.sub}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </Modal>
      )}
    </>
  )
}
