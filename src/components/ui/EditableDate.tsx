import { useState } from 'react'
import { dateInputValue, formatDate, parseDateInputValue } from '../../lib/dates'

export function EditableDate({
  value,
  onSave,
  emptyLabel = '+ Ajouter',
}: {
  value: number | null
  onSave: (date: number | null) => void
  emptyLabel?: string
}) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <input
        autoFocus
        type="date"
        value={dateInputValue(value)}
        onChange={(e) => onSave(parseDateInputValue(e.target.value))}
        onBlur={() => setEditing(false)}
        onClick={(e) => e.stopPropagation()}
        className="rounded-md border border-zinc-300 bg-transparent px-1.5 py-0.5 text-xs outline-none focus:border-blue-500 dark:border-zinc-700"
      />
    )
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        setEditing(true)
      }}
      className="text-left hover:underline"
    >
      {value ? formatDate(value) : <span className="text-zinc-400 dark:text-zinc-600">{emptyLabel}</span>}
    </button>
  )
}
