import { SHOW_STATUSES, type BookingShow, type ShowStatus, type Venue } from '../../types/booking'
import { showStatusLabel, showStatusTone } from '../../lib/statusTone'
import { formatDate } from '../../lib/dates'
import { openMailCompose } from '../../lib/mailLink'
import { MailIcon } from '../layout/icons'
import { StatusPill } from '../ui/StatusPill'
import { StatusPillSelect } from '../ui/StatusPillSelect'

export function ShowsByStatus({
  shows,
  venues,
  onStatusChange,
  onDelete,
}: {
  shows: BookingShow[]
  venues: Venue[]
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
                  venueEmail={venues.find((v) => v.id === show.venueId)?.email}
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
  venueEmail,
  onStatusChange,
  onDelete,
}: {
  show: BookingShow
  venueEmail?: string
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
      {venueEmail && (
        <button
          onClick={() => openMailCompose(venueEmail, `Concert · ${show.venueName}`)}
          title={`Écrire à ${venueEmail}`}
          aria-label={`Écrire à ${venueEmail}`}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-300 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <MailIcon />
        </button>
      )}
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
