import { useState } from 'react'
import { SHOW_STATUSES, type BookingShow, type ShowStatus, type Venue } from '../../types/booking'
import { bookingEventTypeLabel, showStatusLabel, showStatusTone } from '../../lib/statusTone'
import { formatDate } from '../../lib/dates'
import { openMailCompose } from '../../lib/mailLink'
import { isHttpUrl } from '../../lib/url'
import { MailIcon, LinkExternalIcon, PencilIcon } from '../layout/icons'
import { StatusPill } from '../ui/StatusPill'
import { StatusPillSelect } from '../ui/StatusPillSelect'
import { EditableText } from '../ui/EditableText'
import { BookingEventModal, type BookingEventInput } from './BookingEventModal'

export function ShowsByStatus({
  shows,
  venues,
  onUpdate,
  onDelete,
}: {
  shows: BookingShow[]
  venues: Venue[]
  onUpdate: (id: string, data: Partial<BookingEventInput>) => Promise<unknown>
  onDelete: (id: string) => void
}) {
  // A confirmed show whose date has passed reads as "Passé" here even though its own
  // status pill still honestly shows "Confirmé" — the booking itself didn't change,
  // it's just behind us now. Only confirmed shows move this way; a proposed/target
  // show with an old date stays put since it was never actually locked in.
  const now = Date.now()
  function groupOf(show: BookingShow): ShowStatus {
    return show.status === 'confirmed' && show.date < now ? 'past' : show.status
  }

  return (
    <div className="space-y-5">
      {SHOW_STATUSES.map((status) => {
        const group = shows.filter((s) => groupOf(s) === status)
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
                  venueEmail={show.email || venues.find((v) => v.id === show.venueId)?.email}
                  onUpdate={(data) => onUpdate(show.id, data)}
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
  onUpdate,
  onDelete,
}: {
  show: BookingShow
  venueEmail?: string
  onUpdate: (data: Partial<BookingEventInput>) => Promise<unknown>
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const signupUrl = show.signupUrl && isHttpUrl(show.signupUrl) ? show.signupUrl : undefined

  return (
    <div className="flex items-center gap-3 rounded-md border border-zinc-200 p-2.5 dark:border-zinc-800">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
          <EditableText value={show.venueName} onSave={(venueName) => onUpdate({ venueName })} />
        </p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-500">
          {bookingEventTypeLabel[show.type]}
          {show.city && ` · ${show.city}`} · {formatDate(show.date)}
        </p>
      </div>
      <StatusPillSelect
        value={show.status}
        options={SHOW_STATUSES}
        labelFor={(s) => showStatusLabel[s]}
        toneFor={(s) => showStatusTone[s]}
        onChange={(status) => onUpdate({ status })}
      />
      {signupUrl && (
        <a
          href={signupUrl}
          target="_blank"
          rel="noreferrer"
          title="Lien d'inscription"
          aria-label="Lien d'inscription"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-300 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <LinkExternalIcon />
        </a>
      )}
      {venueEmail && (
        <button
          onClick={() => openMailCompose(venueEmail, `${bookingEventTypeLabel[show.type]} · ${show.venueName}`)}
          title={`Écrire à ${venueEmail}`}
          aria-label={`Écrire à ${venueEmail}`}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-300 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <MailIcon />
        </button>
      )}
      <button
        onClick={() => setEditing(true)}
        title="Détails"
        aria-label="Voir les détails"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-300 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <PencilIcon />
      </button>
      <button
        onClick={() => {
          if (confirm(`Supprimer « ${show.venueName} » ?`)) onDelete()
        }}
        className="shrink-0 text-xs text-red-600 hover:underline dark:text-red-400"
      >
        Retirer
      </button>

      {editing && (
        <BookingEventModal
          show={show}
          onClose={() => setEditing(false)}
          onSubmit={async (input) => {
            await onUpdate(input)
            setEditing(false)
          }}
          onDelete={async () => {
            onDelete()
            setEditing(false)
          }}
        />
      )}
    </div>
  )
}
