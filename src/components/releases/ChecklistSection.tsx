import { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import {
  useChecklist,
  useSeedChecklist,
  useAddChecklistItem,
  useUpdateChecklistItem,
  useDeleteChecklistItem,
} from '../../hooks/useChecklist'
import { groupChecklistSections } from '../../lib/releasePhase'
import { DriveAttachButton } from '../documents/DriveAttachButton'
import { ChevronRightIcon, PaperclipIcon } from '../layout/icons'
import { Button } from '../ui/Button'

function CheckButton({ done, onClick }: { done: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={done}
      aria-label={done ? 'Marquer comme non terminé' : 'Marquer comme terminé'}
      className={clsx(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
        done
          ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500'
          : 'border-zinc-300 hover:border-zinc-400 dark:border-zinc-600 dark:hover:border-zinc-500',
      )}
    >
      {done && (
        <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor" aria-hidden="true">
          <path d="M6.5 11.5 3 8l1.06-1.06L6.5 9.38l5.44-5.44L13 5l-6.5 6.5Z" />
        </svg>
      )}
    </button>
  )
}

export function ChecklistSection({
  releaseId,
  shareWithEmails,
  onCompletionChange,
}: {
  releaseId: string
  shareWithEmails: string[]
  onCompletionChange?: (allDone: boolean) => void
}) {
  const { items, loading } = useChecklist(releaseId)
  const seedChecklist = useSeedChecklist(releaseId)
  const addItem = useAddChecklistItem(releaseId)
  const updateItem = useUpdateChecklistItem(releaseId)
  const deleteItem = useDeleteChecklistItem(releaseId)
  const [draft, setDraft] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const seededRef = useRef(false)
  const wasCompleteRef = useRef<Map<string, boolean>>(new Map())
  const onCompletionChangeRef = useRef(onCompletionChange)
  onCompletionChangeRef.current = onCompletionChange

  const checkable = items.filter((i) => !i.header)
  const doneCount = checkable.filter((i) => i.done).length
  const sections = useMemo(() => groupChecklistSections(items), [items])

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

  // A section folds itself away the moment it's fully checked — including
  // already-complete sections on first load — but never forces itself back
  // open once a person has manually reopened it. The ref bookkeeping happens
  // directly in the effect (not inside the setState updater below, which
  // StrictMode invokes twice in dev and would corrupt it).
  useEffect(() => {
    const newlyCompleted: string[] = []
    for (const section of sections) {
      if (section.items.length === 0) continue
      const complete = section.items.every((i) => i.done)
      if (complete && wasCompleteRef.current.get(section.key) !== true) newlyCompleted.push(section.key)
      wasCompleteRef.current.set(section.key, complete)
    }
    if (newlyCompleted.length > 0) {
      setCollapsed((current) => {
        const next = new Set(current)
        newlyCompleted.forEach((key) => next.add(key))
        return next
      })
    }
  }, [items, sections])

  function toggleCollapsed(key: string) {
    setCollapsed((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function handleAdd() {
    const label = draft.trim()
    if (!label) return
    const nextOrder = items.length > 0 ? Math.max(...items.map((i) => i.order)) + 1 : 0
    await addItem(label, nextOrder)
    setDraft('')
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Checklist</h2>
        {checkable.length > 0 && (
          <span className="text-xs text-zinc-500 dark:text-zinc-500">
            {doneCount}/{checkable.length} terminées
          </span>
        )}
      </div>

      <div className="space-y-2">
        {sections.map((section) => {
          if (section.items.length === 0) return null
          const sectionDone = section.items.filter((i) => i.done).length
          const isCollapsed = collapsed.has(section.key)
          return (
            <div key={section.key} className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => toggleCollapsed(section.key)}
                className="flex w-full items-center gap-1.5 bg-zinc-50 px-3 py-2 text-left hover:bg-zinc-100 dark:bg-zinc-900/60 dark:hover:bg-zinc-900"
              >
                <ChevronRightIcon className={clsx('shrink-0 text-zinc-400 transition-transform', !isCollapsed && 'rotate-90')} />
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                  {section.label}
                </span>
                <span className="ml-auto text-xs text-zinc-400 dark:text-zinc-600">
                  {sectionDone}/{section.items.length}
                </span>
              </button>

              {!isCollapsed && (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                  {section.items.map((item) => (
                    <div key={item.id} className="group flex items-center gap-2.5 px-3 py-2">
                      <CheckButton done={item.done} onClick={() => updateItem(item.id, { done: !item.done })} />
                      <span
                        className={clsx(
                          'flex-1 text-sm',
                          item.done ? 'text-zinc-400 line-through dark:text-zinc-600' : 'text-zinc-700 dark:text-zinc-300',
                        )}
                      >
                        {item.label}
                      </span>

                      {item.driveUrl ? (
                        <span className="flex shrink-0 items-center gap-1">
                          <a
                            href={item.driveUrl}
                            target="_blank"
                            rel="noreferrer"
                            title={item.driveName}
                            className="flex max-w-[9rem] items-center gap-1 truncate rounded px-1.5 py-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
                          >
                            <PaperclipIcon className="shrink-0" />
                            <span className="truncate">{item.driveName || 'Fichier'}</span>
                          </a>
                          <button
                            onClick={() => updateItem(item.id, { driveUrl: '', driveName: '' })}
                            title="Retirer ce fichier"
                            aria-label="Retirer ce fichier"
                            className="shrink-0 rounded px-1 text-xs text-zinc-400 opacity-0 hover:text-red-600 group-hover:opacity-100 dark:hover:text-red-400"
                          >
                            ✕
                          </button>
                        </span>
                      ) : (
                        <DriveAttachButton
                          compact
                          shareWithEmails={shareWithEmails}
                          onPicked={(file) => updateItem(item.id, { driveUrl: file.url, driveName: file.name })}
                        />
                      )}

                      <button
                        onClick={() => deleteItem(item.id)}
                        className="shrink-0 text-xs text-red-600 opacity-0 hover:underline group-hover:opacity-100 dark:text-red-400"
                      >
                        Retirer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
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
