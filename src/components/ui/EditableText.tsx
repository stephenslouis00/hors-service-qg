import { useRef, useState } from 'react'
import clsx from 'clsx'

export function EditableText({
  value,
  onSave,
  className,
  inputClassName,
  as: As = 'span',
}: {
  value: string
  onSave: (next: string) => void | Promise<unknown>
  className?: string
  inputClassName?: string
  as?: 'span' | 'h1' | 'h2'
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  function startEditing() {
    setDraft(value)
    setEditing(true)
    requestAnimationFrame(() => inputRef.current?.select())
  }

  function commit() {
    const trimmed = draft.trim()
    setEditing(false)
    if (trimmed && trimmed !== value) {
      onSave(trimmed)
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          }
          if (e.key === 'Escape') {
            e.preventDefault()
            setEditing(false)
          }
        }}
        onClick={(e) => e.stopPropagation()}
        autoFocus
        className={clsx(
          'rounded border border-zinc-400 bg-white px-1 py-0.5 outline-none focus:border-blue-500 dark:border-zinc-600 dark:bg-zinc-900',
          inputClassName ?? className,
        )}
      />
    )
  }

  return (
    <As
      onClick={(e) => {
        e.stopPropagation()
        startEditing()
      }}
      title="Cliquer pour renommer"
      className={clsx('cursor-text rounded px-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800', className)}
    >
      {value}
    </As>
  )
}
