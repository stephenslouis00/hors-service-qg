import type { SongFeedback } from '../../types/song'
import { Avatar } from '../ui/Avatar'
import { StatusPill } from '../ui/StatusPill'
import { formatDateTime } from '../../lib/dates'
import { songStageLabel, songStageTone } from '../../lib/statusTone'

export function ActivityFeed({ feedback }: { feedback: SongFeedback[] }) {
  if (feedback.length === 0) {
    return <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-500">Aucun commentaire pour l'instant.</p>
  }

  return (
    <ol className="relative ml-3 border-l border-zinc-200 dark:border-zinc-800">
      {feedback.map((entry) => (
        <li key={entry.id} className="relative pb-6 pl-6 last:pb-0">
          <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-white bg-zinc-400 dark:border-[#0d1117] dark:bg-zinc-600" />
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Avatar name={entry.authorName} size={20} />
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{entry.authorName}</span>
            <StatusPill label={songStageLabel[entry.stage]} tone={songStageTone[entry.stage]} />
            <span className="text-xs text-zinc-500 dark:text-zinc-500">{formatDateTime(entry.createdAt)}</span>
          </div>
          <p className="mt-1.5 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">{entry.text}</p>
        </li>
      ))}
    </ol>
  )
}
