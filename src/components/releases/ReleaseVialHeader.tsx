import clsx from 'clsx'
import { useChecklist } from '../../hooks/useChecklist'
import { computeReleasePhase } from '../../lib/releasePhase'
import { releaseTypeLabel, type Tone } from '../../lib/statusTone'
import type { Release } from '../../types/promo'
import { EditableText } from '../ui/EditableText'
import { StatusPill } from '../ui/StatusPill'
import { Button } from '../ui/Button'

// Lighter tint than ProgressBar's fill — this bar is large enough that a full-strength
// color would fight with the title text sitting on top of it.
const vialFillClasses: Record<Tone, string> = {
  gray: 'bg-zinc-200 dark:bg-zinc-700',
  blue: 'bg-blue-100 dark:bg-blue-900/50',
  yellow: 'bg-amber-100 dark:bg-amber-900/50',
  green: 'bg-green-100 dark:bg-green-900/50',
  red: 'bg-red-100 dark:bg-red-900/50',
  purple: 'bg-purple-100 dark:bg-purple-900/50',
}

/**
 * The release's title sitting on a full-width bar that fills like a vial as the
 * checklist progresses — replaces the old title + small progress bar combo.
 * Type/phase/delete move to a secondary row underneath.
 */
export function ReleaseVialHeader({
  release,
  onRenameTitle,
  onDelete,
}: {
  release: Release
  onRenameTitle: (title: string) => void
  onDelete: () => void
}) {
  const { items } = useChecklist(release.id)
  const phase = computeReleasePhase(items)

  return (
    <div>
      <div className="relative overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div
          className={clsx('absolute inset-y-0 left-0 transition-[width] duration-500', vialFillClasses[phase.tone])}
          style={{ width: `${phase.percent}%` }}
        />
        <div className="relative flex items-center gap-3 px-4 py-3.5">
          <EditableText
            as="h1"
            value={release.title}
            onSave={onRenameTitle}
            className="text-xl font-semibold text-zinc-900 dark:text-zinc-50"
          />
          {phase.totalCount > 0 && (
            <span className="ml-auto shrink-0 font-mono text-sm text-zinc-500 dark:text-zinc-400">{phase.percent}%</span>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <span>{releaseTypeLabel[release.type]}</span>
          <span className="text-zinc-300 dark:text-zinc-700">·</span>
          <StatusPill label={phase.label} tone={phase.tone} />
        </div>
        <Button variant="danger" onClick={onDelete}>
          Supprimer
        </Button>
      </div>
    </div>
  )
}
