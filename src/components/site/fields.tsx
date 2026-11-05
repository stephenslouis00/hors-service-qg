import { useEffect, useState, type ReactNode } from 'react'
import { Button } from '../ui/Button'
import { readRepoFile, type SiteConnection } from '../../lib/siteRepo'
import type { SiteData } from '../../types/site'

export const inputClass =
  'w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700'

export type ChangeSite = (update: (data: SiteData) => SiteData) => void

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>}
    </label>
  )
}

export function RemoveButton({ onClick, label = 'Supprimer', disabled }: { onClick: () => void; label?: string; disabled?: boolean }) {
  return (
    <Button variant="ghost" className="text-red-600 dark:text-red-400" disabled={disabled} onClick={onClick}>
      {label}
    </Button>
  )
}

export function FileButton({ label, accept, onFile }: { label: string; accept: string; onFile: (file: File) => void }) {
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

export function SongSelect({ data, value, allowNone, onChange }: { data: SiteData; value: string; allowNone?: boolean; onChange: (track: string) => void }) {
  return (
    <select className={inputClass} value={value} onChange={(event) => onChange(event.target.value)}>
      {allowNone && <option value="">Aucune</option>}
      {data.releases.map((release) => (
        <option key={release.id} value={release.id}>
          {release.title || 'Nouveau morceau'}
        </option>
      ))}
    </select>
  )
}

/** Shows a file from the repository, or the local version if it's waiting to be published. */
export function SiteImage({ connection, path, pending, alt }: { connection: SiteConnection; path: string; pending: Map<string, Blob>; alt: string }) {
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
