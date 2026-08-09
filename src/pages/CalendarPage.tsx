import { useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import {
  usePromoCalendarEvents,
  useCreatePromoCalendarEvent,
  useUpdatePromoCalendarEvent,
  useDeletePromoCalendarEvent,
} from '../hooks/useCalendarEvents'
import { useReleases } from '../hooks/useReleases'
import { usePromoContent, useUpdatePromoContent } from '../hooks/usePromoContent'
import { useSongs } from '../hooks/useSongs'
import { useCreateShow, useDeleteShow, useShows, useUpdateShow } from '../hooks/useShows'
import { useVenues } from '../hooks/useVenues'
import { SHOW_STATUSES, type ShowStatus } from '../types/booking'
import { CalendarView, type CalendarItem } from '../components/calendar/CalendarView'
import { EventForm, eventFormValueToRange, type EventFormValue } from '../components/calendar/EventForm'
import { SyncToGoogleButton } from '../components/calendar/SyncToGoogleButton'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { StatusPill } from '../components/ui/StatusPill'
import { Table, TableHead, TableHeaderCell, TableRow, TableCell } from '../components/ui/Table'
import { formatDate, formatDateTime, parseDateInputValue } from '../lib/dates'
import { showStatusLabel, showStatusTone, type Tone } from '../lib/statusTone'
import { useAuth } from '../contexts/AuthContext'
import { useGoogleToken } from '../hooks/useGoogleToken'
import { GOOGLE_SCOPES } from '../firebase/auth'
import {
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  getOrCreateHsCalendar,
  otherSyncedEmails,
} from '../lib/googleCalendar'

type FilterKind = 'show' | 'promo-event' | 'promo-content' | 'release'

// A Record (not array+find) so TypeScript enforces every FilterKind has metadata —
// no non-null assertions needed to look it up.
const FILTER_META: Record<FilterKind, { label: string; tone: Tone }> = {
  show: { label: '🎤 Concerts', tone: 'green' },
  'promo-event': { label: '📣 Événements promo', tone: 'blue' },
  'promo-content': { label: '🎬 Contenus', tone: 'purple' },
  release: { label: '💿 Sorties', tone: 'yellow' },
}
const FILTER_KINDS: FilterKind[] = ['show', 'promo-event', 'promo-content', 'release']

export function CalendarPage() {
  const { events } = usePromoCalendarEvents()
  const createEvent = useCreatePromoCalendarEvent()
  const updateEvent = useUpdatePromoCalendarEvent()
  const deleteEvent = useDeletePromoCalendarEvent()
  const { releases } = useReleases()
  const { items: contentItems } = usePromoContent()
  const updateContent = useUpdatePromoContent()
  const { songs } = useSongs()
  const { shows } = useShows()
  const { venues } = useVenues()
  const createShow = useCreateShow()
  const updateShow = useUpdateShow()
  const deleteShow = useDeleteShow()
  const { user } = useAuth()
  const { getToken, invalidate } = useGoogleToken([GOOGLE_SCOPES.calendar])
  const [deleting, setDeleting] = useState(false)
  const [syncingAll, setSyncingAll] = useState(false)
  const [syncAllError, setSyncAllError] = useState<string | null>(null)

  const [activeFilters, setActiveFilters] = useState<Set<FilterKind>>(new Set(FILTER_KINDS))
  const [dayPickerDate, setDayPickerDate] = useState<string | undefined>()
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [showCreateShow, setShowCreateShow] = useState(false)
  const [prefillDate, setPrefillDate] = useState<string | undefined>()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [venueName, setVenueName] = useState('')
  const [city, setCity] = useState('')
  const [showDate, setShowDate] = useState('')
  const [showStatus, setShowStatus] = useState<ShowStatus>('target')
  const [venueId, setVenueId] = useState('')

  function toggleFilter(kind: FilterKind) {
    setActiveFilters((current) => {
      const next = new Set(current)
      if (next.has(kind)) next.delete(kind)
      else next.add(kind)
      return next
    })
  }

  const selectedShow = selectedId?.startsWith('show-') ? shows.find((s) => `show-${s.id}` === selectedId) : undefined
  const selectedEvent = selectedId?.startsWith('event-') ? events.find((e) => `event-${e.id}` === selectedId) : undefined
  const selectedContent = selectedId?.startsWith('content-')
    ? contentItems.find((i) => `content-${i.id}` === selectedId)
    : undefined
  const selectedContentRelease = selectedContent?.releaseId ? releases.find((r) => r.id === selectedContent.releaseId) : undefined
  const selectedSong = selectedId?.startsWith('release-') ? songs.find((s) => `release-${s.id}` === selectedId) : undefined

  const items: CalendarItem[] = [
    ...(activeFilters.has('show')
      ? shows.map((s) => ({ id: `show-${s.id}`, date: s.date, label: s.venueName, tone: showStatusTone[s.status] }))
      : []),
    ...(activeFilters.has('promo-event')
      ? events.map((e) => ({ id: `event-${e.id}`, date: e.startAt, label: e.title, tone: 'blue' as Tone }))
      : []),
    ...(activeFilters.has('promo-content')
      ? contentItems
          .filter((i) => i.publishDate != null)
          .map((i) => ({ id: `content-${i.id}`, date: i.publishDate!, label: i.title, tone: 'purple' as Tone }))
      : []),
    ...(activeFilters.has('release')
      ? songs
          .filter((s) => s.releaseDate != null)
          .map((s) => ({ id: `release-${s.id}`, date: s.releaseDate!, label: `💿 ${s.title}`, tone: 'yellow' as Tone }))
      : []),
  ]

  const allDated = [
    ...shows.map((s) => ({ id: `show-${s.id}`, date: s.date, kind: 'show' as const, title: s.venueName, sub: s.city })),
    ...events.map((e) => ({ id: `event-${e.id}`, date: e.startAt, kind: 'promo-event' as const, title: e.title, sub: '' })),
    ...contentItems
      .filter((i) => i.publishDate != null)
      .map((i) => ({ id: `content-${i.id}`, date: i.publishDate!, kind: 'promo-content' as const, title: i.title, sub: '' })),
    ...songs
      .filter((s) => s.releaseDate != null)
      .map((s) => ({ id: `release-${s.id}`, date: s.releaseDate!, kind: 'release' as const, title: s.title, sub: '' })),
  ]
    .filter((entry) => activeFilters.has(entry.kind))
    .sort((a, b) => a.date - b.date)

  async function handleCreateEvent(value: EventFormValue) {
    const { startAt, endAt } = eventFormValueToRange(value)
    await createEvent({
      title: value.title,
      description: value.description,
      startAt,
      endAt,
      allDay: value.allDay,
      releaseId: value.releaseId || null,
    })
    setShowCreateEvent(false)
  }

  function handleVenueSelect(id: string) {
    setVenueId(id)
    const venue = venues.find((v) => v.id === id)
    if (venue) {
      setVenueName(venue.name)
      setCity(venue.city)
    }
  }

  async function handleCreateShow() {
    if (!venueName.trim() || !showDate) return
    await createShow({
      venueId: venueId || null,
      venueName: venueName.trim(),
      city: city.trim(),
      date: parseDateInputValue(showDate)!,
      status: showStatus,
      notes: '',
    })
    setVenueName('')
    setCity('')
    setShowDate('')
    setVenueId('')
    setShowCreateShow(false)
  }

  async function handleSyncAll(forceReconnect = false) {
    if (!user?.email) return
    const email = user.email
    setSyncingAll(true)
    setSyncAllError(null)
    try {
      const accessToken = await getToken(forceReconnect)
      const calendarId = await getOrCreateHsCalendar(accessToken)

      for (const show of shows) {
        const input = {
          title: `Concert · ${show.venueName}`,
          description: show.city,
          startAt: show.date,
          endAt: show.date,
          allDay: true,
        }
        const existingId = show.googleEventId?.[email]
        if (existingId) {
          await updateGoogleCalendarEvent(accessToken, calendarId, existingId, input)
        } else {
          const id = await createGoogleCalendarEvent(accessToken, calendarId, input)
          await updateShow(show.id, { googleEventId: { ...show.googleEventId, [email]: id } })
        }
      }

      for (const event of events) {
        const input = {
          title: event.title,
          description: event.description,
          startAt: event.startAt,
          endAt: event.endAt,
          allDay: event.allDay,
        }
        const existingId = event.googleEventId?.[email]
        if (existingId) {
          await updateGoogleCalendarEvent(accessToken, calendarId, existingId, input)
        } else {
          const id = await createGoogleCalendarEvent(accessToken, calendarId, input)
          await updateEvent(event.id, { googleEventId: { ...event.googleEventId, [email]: id } })
        }
      }
    } catch (err) {
      const status = (err as Error & { status?: number }).status
      if (status === 401 && !forceReconnect) {
        invalidate()
        return handleSyncAll(true)
      }
      setSyncAllError('Échec de la synchronisation.')
    } finally {
      setSyncingAll(false)
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Calendrier</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Concerts, événements promo, contenus et sorties, au même endroit.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => handleSyncAll(false)} disabled={syncingAll}>
            {syncingAll ? 'Synchronisation…' : '↻ Tout synchroniser sur HS'}
          </Button>
          <Button onClick={() => { setPrefillDate(undefined); setShowCreateEvent(true) }}>+ Événement promo</Button>
          <Button variant="primary" onClick={() => { setShowDate(''); setShowCreateShow(true) }}>
            + Date de concert
          </Button>
        </div>
      </div>

      {syncAllError && <p className="mb-3 text-xs text-red-600 dark:text-red-400">{syncAllError}</p>}

      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTER_KINDS.map((kind) => (
          <button key={kind} onClick={() => toggleFilter(kind)} className={activeFilters.has(kind) ? '' : 'opacity-40'}>
            <StatusPill label={FILTER_META[kind].label} tone={FILTER_META[kind].tone} />
          </button>
        ))}
      </div>

      <CalendarView
        items={items}
        onDayClick={(day) => setDayPickerDate(format(day, 'yyyy-MM-dd'))}
        onItemClick={(id) => setSelectedId(id)}
      />

      <h2 className="mb-2 mt-6 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Toutes les dates</h2>
      <Table>
        <TableHead>
          <TableHeaderCell>Type</TableHeaderCell>
          <TableHeaderCell>Titre</TableHeaderCell>
          <TableHeaderCell>Date</TableHeaderCell>
        </TableHead>
        <tbody>
          {allDated.map((entry) => (
            <TableRow key={entry.id} onClick={() => setSelectedId(entry.id)}>
              <TableCell>
                <StatusPill label={FILTER_META[entry.kind].label} tone={FILTER_META[entry.kind].tone} />
              </TableCell>
              <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                {entry.title}
                {entry.sub && <span className="text-zinc-500 dark:text-zinc-400"> · {entry.sub}</span>}
              </TableCell>
              <TableCell className="text-zinc-500 dark:text-zinc-400">{formatDate(entry.date)}</TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>

      {dayPickerDate && (
        <Modal title={`Ajouter le ${dayPickerDate}`} onClose={() => setDayPickerDate(undefined)}>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => {
                setPrefillDate(dayPickerDate)
                setDayPickerDate(undefined)
                setShowCreateEvent(true)
              }}
            >
              📣 Événement promo
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setShowDate(dayPickerDate)
                setDayPickerDate(undefined)
                setShowCreateShow(true)
              }}
            >
              🎤 Date de concert
            </Button>
          </div>
        </Modal>
      )}

      {showCreateEvent && (
        <Modal title="Nouvel événement promo" onClose={() => setShowCreateEvent(false)}>
          <EventForm
            initial={{ date: prefillDate }}
            releaseOptions={releases.map((r) => ({ id: r.id, title: r.title }))}
            onCancel={() => setShowCreateEvent(false)}
            onSubmit={handleCreateEvent}
          />
        </Modal>
      )}

      {showCreateShow && (
        <Modal title="Nouvelle date de concert" onClose={() => setShowCreateShow(false)}>
          <div className="space-y-3">
            <select
              value={venueId}
              onChange={(e) => handleVenueSelect(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
            >
              <option value="">Salle non répertoriée…</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            <input
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="Nom de la salle"
              className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
            />
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ville"
              className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
            />
            <input
              type="date"
              value={showDate}
              onChange={(e) => setShowDate(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
            />
            <select
              value={showStatus}
              onChange={(e) => setShowStatus(e.target.value as ShowStatus)}
              className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
            >
              {SHOW_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {showStatusLabel[s]}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setShowCreateShow(false)}>Annuler</Button>
              <Button variant="primary" onClick={handleCreateShow} disabled={!venueName.trim() || !showDate}>
                Créer
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {selectedShow && (
        <Modal title={selectedShow.venueName} onClose={() => setSelectedId(null)}>
          <div className="space-y-3 text-sm">
            <p className="text-zinc-500 dark:text-zinc-500">
              {selectedShow.city} · {formatDate(selectedShow.date)}
            </p>
            <select
              value={selectedShow.status}
              onChange={(e) => updateShow(selectedShow.id, { status: e.target.value as ShowStatus })}
              className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
            >
              {SHOW_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {showStatusLabel[s]}
                </option>
              ))}
            </select>
            <SyncToGoogleButton
              title={`Concert · ${selectedShow.venueName}`}
              description={selectedShow.city}
              startAt={selectedShow.date}
              endAt={selectedShow.date}
              allDay
              googleEventId={user?.email ? selectedShow.googleEventId?.[user.email] : undefined}
              onSynced={(googleEventId) => {
                if (!user?.email) return
                updateShow(selectedShow.id, {
                  googleEventId: { ...selectedShow.googleEventId, [user.email]: googleEventId },
                })
              }}
            />
            <div className="flex justify-end">
              <Button
                variant="danger"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true)
                  try {
                    const myEventId = user?.email ? selectedShow.googleEventId?.[user.email] : undefined
                    if (myEventId) {
                      try {
                        const accessToken = await getToken()
                        const calendarId = await getOrCreateHsCalendar(accessToken)
                        await deleteGoogleCalendarEvent(accessToken, calendarId, myEventId)
                      } catch {
                        // Best-effort: don't block deleting the app record if Google's unreachable.
                      }
                    }
                    const others = otherSyncedEmails(selectedShow.googleEventId, user?.email)
                    await deleteShow(selectedShow.id)
                    setSelectedId(null)
                    if (others.length > 0) {
                      alert(`Cette date était aussi sur l'agenda Google de : ${others.join(', ')}. Ils devront la supprimer eux-mêmes de leur côté.`)
                    }
                  } finally {
                    setDeleting(false)
                  }
                }}
              >
                {deleting ? 'Suppression…' : 'Supprimer'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {selectedEvent && (
        <Modal title={selectedEvent.title} onClose={() => setSelectedId(null)}>
          <div className="space-y-3 text-sm">
            {selectedEvent.description && <p className="text-zinc-600 dark:text-zinc-400">{selectedEvent.description}</p>}
            <p className="text-zinc-500 dark:text-zinc-500">{formatDateTime(selectedEvent.startAt)}</p>
            <SyncToGoogleButton
              title={selectedEvent.title}
              description={selectedEvent.description}
              startAt={selectedEvent.startAt}
              endAt={selectedEvent.endAt}
              allDay={selectedEvent.allDay}
              googleEventId={user?.email ? selectedEvent.googleEventId?.[user.email] : undefined}
              onSynced={(googleEventId) => {
                if (!user?.email) return
                updateEvent(selectedEvent.id, {
                  googleEventId: { ...selectedEvent.googleEventId, [user.email]: googleEventId },
                })
              }}
            />
            <div className="flex justify-end">
              <Button
                variant="danger"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true)
                  try {
                    const myEventId = user?.email ? selectedEvent.googleEventId?.[user.email] : undefined
                    if (myEventId) {
                      try {
                        const accessToken = await getToken()
                        const calendarId = await getOrCreateHsCalendar(accessToken)
                        await deleteGoogleCalendarEvent(accessToken, calendarId, myEventId)
                      } catch {
                        // Best-effort: don't block deleting the app record if Google's unreachable.
                      }
                    }
                    const others = otherSyncedEmails(selectedEvent.googleEventId, user?.email)
                    await deleteEvent(selectedEvent.id)
                    setSelectedId(null)
                    if (others.length > 0) {
                      alert(`Cet événement était aussi sur l'agenda Google de : ${others.join(', ')}. Ils devront le supprimer eux-mêmes de leur côté.`)
                    }
                  } finally {
                    setDeleting(false)
                  }
                }}
              >
                {deleting ? 'Suppression…' : 'Supprimer'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {selectedContent && (
        <Modal title={selectedContent.title} onClose={() => setSelectedId(null)}>
          <div className="space-y-3 text-sm">
            <p className="text-zinc-500 dark:text-zinc-500">
              Publication prévue le {formatDateTime(selectedContent.publishDate ?? undefined)}
            </p>
            {selectedContentRelease && (
              <Link to={`/promotion/projects/${selectedContentRelease.id}`} className="text-blue-600 hover:underline dark:text-blue-400">
                Voir le projet « {selectedContentRelease.title} » →
              </Link>
            )}
            <div className="flex justify-end">
              <Button
                variant="danger"
                onClick={async () => {
                  await updateContent(selectedContent.id, { publishDate: null })
                  setSelectedId(null)
                }}
              >
                Retirer du calendrier
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {selectedSong && (
        <Modal title={selectedSong.title} onClose={() => setSelectedId(null)}>
          <div className="space-y-3 text-sm">
            <p className="text-zinc-500 dark:text-zinc-500">Sortie prévue le {formatDate(selectedSong.releaseDate)}</p>
            <Link to={`/production/${selectedSong.id}`} className="text-blue-600 hover:underline dark:text-blue-400">
              Voir le morceau →
            </Link>
          </div>
        </Modal>
      )}
    </div>
  )
}
