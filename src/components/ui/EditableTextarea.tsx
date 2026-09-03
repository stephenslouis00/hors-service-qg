import { useState } from 'react'

export function EditableTextarea({
  value,
  onSave,
  placeholder = '+ Ajouter',
  rows = 3,
}: {
  value: string
  onSave: (next: string) => void
  placeholder?: string
  rows?: number
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function commit() {
    const trimmed = draft.trim()
    setEditing(false)
    if (trimmed !== value) onSave(trimmed)
  }

  if (editing) {
    return (
      <textarea
        autoFocus
        rows={rows}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault()
            setEditing(false)
          }
        }}
        className="w-full resize-y rounded-md border border-zinc-300 bg-transparent p-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-700"
      />
    )
  }

  return (
    <div
      onClick={() => {
        setDraft(value)
        setEditing(true)
      }}
      title="Cliquer pour éditer"
      className="min-h-[1.75rem] cursor-text whitespace-pre-wrap rounded px-1 py-0.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
    >
      {value ? value : <span className="text-zinc-400 dark:text-zinc-600">{placeholder}</span>}
    </div>
  )
}
