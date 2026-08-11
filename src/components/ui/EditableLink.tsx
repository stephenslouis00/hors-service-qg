import { useState } from 'react'
import { Button } from './Button'
import { isHttpUrl } from '../../lib/url'

export function EditableLink({
  url,
  onSave,
  emptyLabel,
  linkLabel,
  icon = '🔗',
  createUrl,
  createLabel,
}: {
  url: string | undefined
  onSave: (url: string) => void
  emptyLabel: string
  linkLabel: string
  icon?: string
  /** Optional secondary link (e.g. "create a new board") shown alongside the edit control. */
  createUrl?: string
  createLabel?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(url ?? '')
  const [error, setError] = useState<string | null>(null)

  function commit() {
    const trimmed = draft.trim()
    if (trimmed && !isHttpUrl(trimmed)) {
      setError('Doit être un lien commençant par http:// ou https://')
      return
    }
    setEditing(false)
    setError(null)
    if (trimmed !== (url ?? '')) onSave(trimmed)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          placeholder="https://pinterest.com/..."
          className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-sm outline-none focus:border-blue-500 dark:border-zinc-700"
        />
        <Button variant="primary" onClick={commit}>
          OK
        </Button>
        <Button onClick={() => setEditing(false)}>Annuler</Button>
        {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
      </div>
    )
  }

  const isSafeUrl = url && isHttpUrl(url)

  return (
    <div className="flex items-center gap-2 text-sm">
      {isSafeUrl ? (
        <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">
          {icon} {linkLabel}
        </a>
      ) : (
        <span className="text-zinc-500 dark:text-zinc-500">{emptyLabel}</span>
      )}
      <button
        onClick={() => {
          setDraft(url ?? '')
          setError(null)
          setEditing(true)
        }}
        className="text-xs text-zinc-500 hover:underline dark:text-zinc-400"
      >
        {isSafeUrl ? 'Modifier' : '+ Ajouter'}
      </button>
      {createUrl && (
        <a
          href={createUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-zinc-500 hover:underline dark:text-zinc-400"
        >
          {createLabel}
        </a>
      )}
    </div>
  )
}
