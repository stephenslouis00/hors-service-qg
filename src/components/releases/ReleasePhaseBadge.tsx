import { useChecklist } from '../../hooks/useChecklist'
import { computeReleasePhase } from '../../lib/releasePhase'
import { StatusPill } from '../ui/StatusPill'

/**
 * Read-only "where this release stands" pill, derived entirely from its checklist.
 * Does not seed anything — a release with no checklist yet just reads "Non démarré"
 * until its detail page is opened once (ChecklistSection auto-seeds it there).
 */
export function ReleasePhaseBadge({ releaseId, showProgress = false }: { releaseId: string; showProgress?: boolean }) {
  const { items } = useChecklist(releaseId)
  const phase = computeReleasePhase(items)

  return (
    <span className="inline-flex items-center gap-1.5">
      <StatusPill label={phase.label} tone={phase.tone} />
      {showProgress && phase.totalCount > 0 && (
        <span className="text-xs text-zinc-500 dark:text-zinc-500">
          {phase.doneCount}/{phase.totalCount}
        </span>
      )}
    </span>
  )
}
