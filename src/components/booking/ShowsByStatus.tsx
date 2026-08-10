import { SHOW_STATUSES, type BookingShow, type ShowStatus } from '../../types/booking'
import { showStatusLabel, showStatusTone } from '../../lib/statusTone'
import { formatDate } from '../../lib/dates'
import { StatusPill } from '../ui/StatusPill'
import { StatusPillSelect } from '../ui/StatusPillSelect'

export function ShowsByStatus({
  shows,
  onStatusChange,
  onDelete,
}: {
  shows: BookingShow[]
  onStatusChange: (id: string, status: ShowStatus) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="space-y-5">
      {SHOW_STATUSES.map((status) => {
        const group = shows.filter((s) => s.status === status)
        if (group.length === 0) return null
        return (
          <div key={status}>
            <div className="mb-1.5 flex items-center gap-2">
              <StatusPill label={showStatusLabel[status]} tone={showStatusTone[status]} />
              <span className="text-xs text-zinc-500 dark:text-zinc-500">{group.length}</span>
            </div>
            <div className="space-y-1.5">
              {group.map((show) => (
                <ShowRow
                  key={show.id}
                  show={show}
                  onStatusChange={(s) => onStatusChange(show.id, s)}
                  onDelete={() => onDelete(show.id)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ShowRow({
  show,
  onStatusChange,
  onDelete,
}: {
  show: BookingShow
  onStatusChange: (status: ShowStatus) => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-zinc-200 p-2.5 dark:border-zinc-800">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{show.venueName}</p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-500">
          {show.city}
          {show.city && ' · '}
          {formatDate(show.date)}
        </p>
      </div>
      <StatusPillSelect
        value={show.status}
        options={SHOW_STATUSES}
        labelFor={(s) => showStatusLabel[s]}
        toneFor={(s) => showStatusTone[s]}
        onChange={onStatusChange}
      />
      <button
        onClick={() => {
          if (confirm(`Supprimer la date « ${show.venueName} » ?`)) onDelete()
        }}
        className="shrink-0 text-xs text-red-600 hover:underline dark:text-red-400"
      >
        Retirer
      </button>
    </div>
  )
}
