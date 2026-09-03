import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import {
  useChecklist,
  useSeedChecklist,
  useAddChecklistItem,
  useUpdateChecklistItem,
  useDeleteChecklistItem,
} from '../../hooks/useChecklist'
import type { ChecklistItem } from '../../types/checklist'
import { Button } from '../ui/Button'

// Every item up to (not including) the next header belongs to the section
// opened by the closest preceding header — undefined while still in the
// implicit leading "Production" section, before any header has appeared.
function sectionCounts(items: ChecklistItem[]) {
  const sorted = [...items].sort((a, b) => a.order - b.order)
  const counts = new Map<number, { done: number; total: number }>()
  let currentHeaderIndex = -1
  sorted.forEach((item, index) => {
    if (item.header) {
      currentHeaderIndex = index
      return
    }
    if (currentHeaderIndex === -1) return
    const entry = counts.get(currentHeaderIndex) ?? { done: 0, total: 0 }
    entry.total += 1
    if (item.done) entry.done += 1
    counts.set(currentHeaderIndex, entry)
  })
  return { sorted, counts }
}

export function ChecklistSection({
  releaseId,
  onCompletionChange,
}: {
  releaseId: string
  onCompletionChange?: (allDone: boolean) => void
}) {
  const { items, loading } = useChecklist(releaseId)
  const seedChecklist = useSeedChecklist(releaseId)
  const addItem = useAddChecklistItem(releaseId)
  const updateItem = useUpdateChecklistItem(releaseId)
  const deleteItem = useDeleteChecklistItem(releaseId)
  const [draft, setDraft] = useState('')
  const seededRef = useRef(false)
  const onCompletionChangeRef = useRef(onCompletionChange)
  onCompletionChangeRef.current = onCompletionChange

  const checkable = items.filter((i) => !i.header)
  const doneCount = checkable.filter((i) => i.done).length

  // The checklist is the single source of progress — every release gets one
  // automatically (no manual "create checklist" step to skip or forget), and
  // this also self-heals releases created before this became automatic.
  useEffect(() => {
    if (loading || items.length > 0 || seededRef.current) return
    seededRef.current = true
    seedChecklist()
  }, [loading, items.length, seedChecklist])

  useEffect(() => {
    if (checkable.length === 0) return
    onCompletionChangeRef.current?.(doneCount === checkable.length)
  }, [doneCount, checkable.length])

  async function handleAdd() {
    const label = draft.trim()
    if (!label) return
    const nextOrder = items.length > 0 ? Math.max(...items.map((i) => i.order)) + 1 : 0
    await addItem(label, nextOrder)
    setDraft('')
  }

  const { sorted, counts } = sectionCounts(items)

  return (
    <div>
      <div className="mt-6 mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Checklist</h2>
        {checkable.length > 0 && (
          <span className="text-xs text-zinc-500 dark:text-zinc-500">
            {doneCount}/{checkable.length} terminées
          </span>
        )}
      </div>
      <div className="space-y-1">
        {sorted.map((item, index) =>
          item.header ? (
            <p
              key={item.id}
              className="mt-3 flex items-baseline justify-between text-xs font-semibold uppercase tracking-wide text-zinc-500 first:mt-0 dark:text-zinc-500"
            >
              <span>{item.label}</span>
              {counts.has(index) && (
                <span className="font-normal normal-case tracking-normal text-zinc-400 dark:text-zinc-600">
                  {counts.get(index)!.done}/{counts.get(index)!.total}
                </span>
              )}
            </p>
          ) : (
            <div
              key={item.id}
              className="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
            >
              <input
                type="checkbox"
                checked={item.done}
                onChange={(e) => updateItem(item.id, { done: e.target.checked })}
                className="h-4 w-4 shrink-0 cursor-pointer accent-blue-600"
              />
              <span
                className={clsx(
                  'flex-1 text-sm',
                  item.done ? 'text-zinc-400 line-through dark:text-zinc-600' : 'text-zinc-700 dark:text-zinc-300',
                )}
              >
                {item.label}
              </span>
              <button
                onClick={() => deleteItem(item.id)}
                className="shrink-0 text-xs text-red-600 opacity-0 hover:underline group-hover:opacity-100 dark:text-red-400"
              >
                Retirer
              </button>
            </div>
          ),
        )}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Ajouter une étape"
          className="flex-1 rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-sm outline-none focus:border-blue-500 dark:border-zinc-700"
        />
        <Button onClick={handleAdd} disabled={!draft.trim()}>
          Ajouter
        </Button>
      </div>
    </div>
  )
}
