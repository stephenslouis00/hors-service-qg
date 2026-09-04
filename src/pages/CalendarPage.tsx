import { Fragment, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  usePromoCalendarEvents,
  useCreatePromoCalendarEvent,
  useUpdatePromoCalendarEvent,
  useDeletePromoCalendarEvent,
} from '../hooks/useCalendarEvents'
import { useReleases } from '../hooks/useReleases'
import { usePromoContent, useUpdatePromoContent } from '../hooks/usePromoContent'
import { useSongs, useUpdateSong } from '../hooks/useSongs'
import { useCreateShow, useDeleteShow, useShows, useUpdateShow } from '../hooks/useShows'
import { useChecklistCalendarItems, updateChecklistItemFields } from '../hooks/useChecklist'
import { SHOW_STATUSES, type ShowStatus } from '../types/booking'
import { bookingEventTypeLabel } from '../lib/statusTone'
import { CalendarView, type CalendarItem } from '../components/calendar/CalendarView'
import { EventForm, eventFormValueToRange, type EventFormValue } from '../components/calendar/EventForm'
import { SyncToGoogleButton } from '../components/calendar/SyncToGoogleButton'
import { BookingEventModal } from '../components/booking/BookingEventModal'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { StatusPill } from '../components/ui/StatusPill'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Table, TableHead, TableHeaderCell, TableRow, TableCell } from '../components/ui/Table'
import { formatDate, formatDateTime } from '../lib/dates'
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
import { LocationIcon, MegaphoneIcon, VideoIcon, PromotionIcon, CheckCircleIcon } from '../components/layout/icons'

type FilterKind = 'show' | 'promo-event' | 'promo-content' | 'release' | 'checklist-task'

// A Record (not array+find) so TypeScript enforces every FilterKind has metadata —
// no non-null assertions needed to look it up. The icon is the stable category
// marker; tone stays free to carry status/urgency instead of doubling as identity.
const FILTER_META: Record<FilterKind, { label: string; tone: Tone; icon: ReactNode }> = {
  show: { label: 'Concerts', tone: 'green', icon: <LocationIcon /> },
  'promo-event': { label: 'Événements promo', tone: 'blue', icon: <MegaphoneIcon /> },
  'promo-content': { label: 'Contenus', tone: 'purple', icon: <VideoIcon /> },
  release: { label: 'Sorties', tone: 'yellow', icon: <PromotionIcon /> },
  'checklist-task': { label: 'Tâches', tone: 'red', icon: <CheckCircleIcon /> },
}
const FILTER_KINDS: FilterKind[] = ['show', 'promo-event', 'promo-content', 'release', 'checklist-task']

interface ChecklistDatePickState {
  releaseId: string
  itemId: string
  itemLabel: string
}

export function CalendarPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const pickingFor = (location.state as ChecklistDatePickState | null) ?? null
  const { events } = usePromoCalendarEvents()
  const createEvent = useCreatePromoCalendarEvent()
  const updateEvent = useUpdatePromoCalendarEvent()
  const deleteEvent = useDeletePromoCalendarEvent()
  const { releases } = useReleases()
  const { items: contentItems } = usePromoContent()
  const updateContent = useUpdatePromoContent()
  const { songs } = useSongs()
  const updateSong = useUpdateSong()
  const { shows } = useShows()
  const createShow = useCreateShow()
  const updateShow = useUpdateShow()
  const deleteShow = useDeleteShow()
  const checklistTasks = useChecklistCalendarItems()
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
  const [prefillShowDate, setPrefillShowDate] = useState<string | undefined>()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showPastDates, setShowPastDates] = useState(false)

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
  const selectedTask = selectedId?.startsWith('task-') ? checklistTasks.find((t) => `task-${t.id}` === selectedId) : undefined
  const selectedTaskRelease = selectedTask ? releases.find((r) => r.id === selectedTask.releaseId) : undefined

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
          .map((s) => ({ id: `release-${s.id}`, date: s.releaseDate!, label: s.title, tone: 'yellow' as Tone }))
      : []),
    ...(activeFilters.has('checklist-task')
      ? checklistTasks.map((t) => ({ id: `task-${t.id}`, date: t.date!, label: t.label, tone: 'red' as Tone }))
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
    ...checklistTasks.map((t) => ({
      id: `task-${t.id}`,
      date: t.date!,
      kind: 'checklist-task' as const,
      title: t.label,
      sub: releases.find((r) => r.id === t.releaseId)?.title ?? '',
    })),
  ]
    .filter((entry) => activeFilters.has(entry.kind))
    .sort((a, b) => a.date - b.date)

  const now = Date.now()
  const pastDated = allDated.filter((entry) => entry.date < now)
  const upcomingDated = allDated.filter((entry) => entry.date >= now)

  const upcomingByMonth: { label: string; entries: typeof allDated }[] = []
  for (const entry of upcomingDated) {
    const label = format(entry.date, 'MMMM yyyy', { locale: fr })
    let group = upcomingByMonth.find((g) => g.label === label)
    if (!group) {
      group = { label, entries: [] }
      upcomingByMonth.push(group)
    }
    group.entries.push(entry)
  }

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

      for (const task of checklistTasks) {
        const release = releases.find((r) => r.id === task.releaseId)
        const input = {
          title: `✅ ${task.label}${release ? ` · ${release.title}` : ''}`,
          startAt: task.date!,
          endAt: task.date!,
          allDay: true,
        }
        const existingId = task.googleEventId?.[email]
        if (existingId) {
          await updateGoogleCalendarEvent(accessToken, calendarId, existingId, input)
        } else {
          const id = await createGoogleCalendarEvent(accessToken, calendarId, input)
          await updateChecklistItemFields(task.releaseId, task.id, { googleEventId: { ...task.googleEventId, [email]: id } })
        }
      }

      for (const item of contentItems) {
        if (item.publishDate == null) continue
        const release = item.releaseId ? releases.find((r) => r.id === item.releaseId) : undefined
        const input = {
          title: `🎬 ${item.title}${release ? ` · ${release.title}` : ''}`,
          startAt: item.publishDate,
          endAt: item.publishDate,
          allDay: true,
        }
        const existingId = item.googleEventId?.[email]
        if (existingId) {
          await updateGoogleCalendarEvent(accessToken, calendarId, existingId, input)
        } else {
          const id = await createGoogleCalendarEvent(accessToken, calendarId, input)
          await updateContent(item.id, { googleEventId: { ...item.googleEventId, [email]: id } })
        }
      }

      for (const song of songs) {
        if (song.releaseDate == null) continue
        const input = {
          title: `💿 Sortie · ${song.title}`,
          startAt: song.releaseDate,
          endAt: song.releaseDate,
          allDay: true,
        }
        const existingId = song.googleEventId?.[email]
        if (existingId) {
          await updateGoogleCalendarEvent(accessToken, calendarId, existingId, input)
        } else {
          const id = await createGoogleCalendarEvent(accessToken, calendarId, input)
          await updateSong(song.id, { googleEventId: { ...song.googleEventId, [email]: id } })
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

  async function handlePickDateForChecklist(day: Date) {
    if (!pickingFor) return
    await updateChecklistItemFields(pickingFor.releaseId, pickingFor.itemId, { date: day.getTime() })
    navigate(`/releases/projects/${pickingFor.releaseId}`)
  }

  return (
    <div className="p-4 md:p-6">
      {pickingFor ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-sm dark:border-blue-800 dark:bg-blue-950">
          <span className="text-blue-800 dark:text-blue-300">
            📅 Choisis une date pour « {pickingFor.itemLabel} » — clique sur un jour.
          </span>
          <button
            onClick={() => navigate(`/releases/projects/${pickingFor.releaseId}`)}
            className="text-xs font-medium text-blue-700 hover:underline dark:text-blue-300"
          >
            Annuler
          </button>
        </div>
      ) : (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Calendrier</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Concerts, événements promo, contenus, sorties et tâches de checklist, au même endroit.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handleSyncAll(false)} disabled={syncingAll}>
              {syncingAll ? 'Synchronisation…' : '↻ Tout synchroniser sur HS'}
            </Button>
            <Button onClick={() => { setPrefillDate(undefined); setShowCreateEvent(true) }}>+ Événement promo</Button>
            <Button variant="primary" onClick={() => { setPrefillShowDate(undefined); setShowCreateShow(true) }}>
              + Nouvel événement
            </Button>
          </div>
        </div>
      )}

      {syncAllError && <p className="mb-3 text-xs text-red-600 dark:text-red-400">{syncAllError}</p>}

      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTER_KINDS.map((kind) => (
          <button key={kind} onClick={() => toggleFilter(kind)} className={activeFilters.has(kind) ? '' : 'opacity-40'}>
            <StatusPill label={FILTER_META[kind].label} tone={FILTER_META[kind].tone} icon={FILTER_META[kind].icon} />
          </button>
        ))}
      </div>

      <CalendarView
        items={items}
        onDayClick={pickingFor ? handlePickDateForChecklist : (day) => setDayPickerDate(format(day, 'yyyy-MM-dd'))}
        onItemClick={(id) => setSelectedId(id)}
      />

      <SectionHeading>Toutes les dates</SectionHeading>
      <Table>
        <TableHead>
          <TableHeaderCell>Type</TableHeaderCell>
          <TableHeaderCell>Titre</TableHeaderCell>
          <TableHeaderCell>Date</TableHeaderCell>
        </TableHead>
        <tbody>
          {pastDated.length > 0 && (
            <tr className="border-b border-zinc-100 dark:border-zinc-900">
              <td colSpan={3} className="px-4 py-2">
                <button
                  onClick={() => setShowPastDates((v) => !v)}
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  {showPastDates ? '▾' : '▸'} Dates passées ({pastDated.length})
                </button>
              </td>
            </tr>
          )}
          {showPastDates &&
            pastDated.map((entry) => (
              <TableRow key={entry.id} onClick={() => setSelectedId(entry.id)}>
                <TableCell>
                  <StatusPill label={FILTER_META[entry.kind].label} tone={FILTER_META[entry.kind].tone} icon={FILTER_META[entry.kind].icon} />
                </TableCell>
                <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                  {entry.title}
                  {entry.sub && <span className="text-zinc-500 dark:text-zinc-400"> · {entry.sub}</span>}
                </TableCell>
                <TableCell className="text-zinc-500 dark:text-zinc-400">{formatDate(entry.date)}</TableCell>
              </TableRow>
            ))}
          {upcomingByMonth.map((group) => (
            <Fragment key={group.label}>
              <tr className="border-b border-zinc-100 dark:border-zinc-900">
                <td colSpan={3} className="bg-zinc-50 px-4 py-1.5 text-xs font-medium capitalize text-zinc-500 dark:bg-zinc-900/40 dark:text-zinc-400">
                  {group.label}
                </td>
              </tr>
              {group.entries.map((entry) => (
                <TableRow key={entry.id} onClick={() => setSelectedId(entry.id)}>
                  <TableCell>
                    <StatusPill label={FILTER_META[entry.kind].label} tone={FILTER_META[entry.kind].tone} icon={FILTER_META[entry.kind].icon} />
                  </TableCell>
                  <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                    {entry.title}
                    {entry.sub && <span className="text-zinc-500 dark:text-zinc-400"> · {entry.sub}</span>}
                  </TableCell>
                  <TableCell className="text-zinc-500 dark:text-zinc-400">{formatDate(entry.date)}</TableCell>
                </TableRow>
              ))}
            </Fragment>
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
              <MegaphoneIcon /> Événement promo
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setPrefillShowDate(dayPickerDate)
                setDayPickerDate(undefined)
                setShowCreateShow(true)
              }}
            >
              <LocationIcon /> Nouvel événement
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
        <BookingEventModal
          initialDate={prefillShowDate}
          releases={releases}
          onClose={() => setShowCreateShow(false)}
          onSubmit={async (input) => {
            await createShow(input)
            setShowCreateShow(false)
          }}
        />
      )}

      {selectedShow && (
        <Modal title={selectedShow.venueName} onClose={() => setSelectedId(null)}>
          <div className="space-y-3 text-sm">
            <p className="text-zinc-500 dark:text-zinc-500">
              {bookingEventTypeLabel[selectedShow.type]}
              {selectedShow.city && ` · ${selectedShow.city}`} · {formatDate(selectedShow.date)}
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
              <Link to={`/releases/projects/${selectedContentRelease.id}`} className="text-blue-600 hover:underline dark:text-blue-400">
                Voir le projet « {selectedContentRelease.title} » →
              </Link>
            )}
            <div className="flex justify-end">
              <Button
                variant="danger"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true)
                  try {
                    const myEventId = user?.email ? selectedContent.googleEventId?.[user.email] : undefined
                    if (myEventId) {
                      try {
                        const accessToken = await getToken()
                        const calendarId = await getOrCreateHsCalendar(accessToken)
                        await deleteGoogleCalendarEvent(accessToken, calendarId, myEventId)
                      } catch {
                        // Best-effort: don't block clearing the date if Google's unreachable.
                      }
                    }
                    const others = otherSyncedEmails(selectedContent.googleEventId, user?.email)
                    await updateContent(selectedContent.id, { publishDate: null, googleEventId: {} })
                    setSelectedId(null)
                    if (others.length > 0) {
                      alert(`Ce contenu était aussi sur l'agenda Google de : ${others.join(', ')}. Ils devront le supprimer eux-mêmes de leur côté.`)
                    }
                  } finally {
                    setDeleting(false)
                  }
                }}
              >
                {deleting ? 'Suppression…' : 'Retirer du calendrier'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {selectedSong && (
        <Modal title={selectedSong.title} onClose={() => setSelectedId(null)}>
          <div className="space-y-3 text-sm">
            <p className="text-zinc-500 dark:text-zinc-500">Sortie prévue le {formatDate(selectedSong.releaseDate)}</p>
            <Link to={`/releases/songs/${selectedSong.id}`} className="text-blue-600 hover:underline dark:text-blue-400">
              Voir le morceau →
            </Link>
          </div>
        </Modal>
      )}

      {selectedTask && (
        <Modal title={selectedTask.label} onClose={() => setSelectedId(null)}>
          <div className="space-y-3 text-sm">
            <p className="text-zinc-500 dark:text-zinc-500">{formatDate(selectedTask.date)}</p>
            {selectedTaskRelease && (
              <Link to={`/releases/projects/${selectedTaskRelease.id}`} className="text-blue-600 hover:underline dark:text-blue-400">
                Voir la checklist « {selectedTaskRelease.title} » →
              </Link>
            )}
            <div className="flex justify-end">
              <Button
                variant="danger"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true)
                  try {
                    const myEventId = user?.email ? selectedTask.googleEventId?.[user.email] : undefined
                    if (myEventId) {
                      try {
                        const accessToken = await getToken()
                        const calendarId = await getOrCreateHsCalendar(accessToken)
                        await deleteGoogleCalendarEvent(accessToken, calendarId, myEventId)
                      } catch {
                        // Best-effort: don't block clearing the date if Google's unreachable.
                      }
                    }
                    const others = otherSyncedEmails(selectedTask.googleEventId, user?.email)
                    await updateChecklistItemFields(selectedTask.releaseId, selectedTask.id, { date: null, googleEventId: {} })
                    setSelectedId(null)
                    if (others.length > 0) {
                      alert(`Cette tâche était aussi sur l'agenda Google de : ${others.join(', ')}. Ils devront la supprimer eux-mêmes de leur côté.`)
                    }
                  } finally {
                    setDeleting(false)
                  }
                }}
              >
                {deleting ? 'Suppression…' : 'Retirer du calendrier'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
