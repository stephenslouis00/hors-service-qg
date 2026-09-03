import { Link } from 'react-router-dom'
import { useChecklist } from '../../hooks/useChecklist'
import { computeReleasePhase } from '../../lib/releasePhase'
import { ProgressBar } from '../ui/ProgressBar'

/** One-line spotlight for the dashboard: the release closest to its release date, and how far along its checklist is. */
export function ReleaseProgressLine({ releaseId, title }: { releaseId: string; title: string }) {
  const { items } = useChecklist(releaseId)
  const phase = computeReleasePhase(items)

  return (
    <Link
      to={`/releases/projects/${releaseId}`}
      className="mb-4 block rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/60"
    >
      <div className="flex items-center gap-2">
        <span className="shrink-0">🎵</span>
        <span className="min-w-0 truncate font-medium text-zinc-900 dark:text-zinc-100">{title}</span>
        <span className="shrink-0 text-zinc-500 dark:text-zinc-500">— {phase.label}</span>
        <span className="ml-auto shrink-0 font-mono text-xs text-zinc-500 dark:text-zinc-500">{phase.percent}%</span>
      </div>
      <ProgressBar percent={phase.percent} tone={phase.tone} className="mt-1.5" />
    </Link>
  )
}
