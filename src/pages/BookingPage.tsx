import { useState } from 'react'
import { useCreateShow, useDeleteShow, useShows, useUpdateShow } from '../hooks/useShows'
import { useVenues } from '../hooks/useVenues'
import { useReleases } from '../hooks/useReleases'
import { BookingEventModal } from '../components/booking/BookingEventModal'
import { ShowsByStatus } from '../components/booking/ShowsByStatus'
import { ContactCard } from '../components/contacts/ContactCard'
import { bookingEventTypeLabel } from '../lib/statusTone'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'

export function BookingPage() {
  const { shows, loading: showsLoading } = useShows()
  const createShow = useCreateShow()
  const updateShow = useUpdateShow()
  const deleteShow = useDeleteShow()

  // Kept read-only, for contact info on shows created before venues were folded into events.
  const { venues } = useVenues()
  const { releases } = useReleases()

  const [showCreateShow, setShowCreateShow] = useState(false)

  // Derived, not a separate list — always in sync with the events above since it's the same data.
  // Includes every event, with or without contact info, so it also works as a "known places" directory.
  const contacts = shows
    .map((show) => ({ show, email: show.email || venues.find((v) => v.id === show.venueId)?.email }))
    .sort((a, b) => a.show.venueName.localeCompare(b.show.venueName))

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Booking</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Bars, salles, tremplins et festivals à suivre.</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateShow(true)}>
          + Nouvel événement
        </Button>
      </div>

      {!showsLoading && shows.length === 0 && (
        <EmptyState title="Aucun événement" description="Ajoute un bar, une salle, un tremplin ou un festival à suivre." />
      )}
      {shows.length > 0 && (
        <ShowsByStatus
          shows={shows}
          venues={venues}
          releases={releases}
          onUpdate={(id, data) => updateShow(id, data)}
          onDelete={(id) => deleteShow(id)}
        />
      )}

      {contacts.length > 0 && (
        <>
          <h2 className="mb-2 mt-8 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Contacts</h2>
          <div className="space-y-2">
            {contacts.map(({ show, email }) => (
              <ContactCard
                key={show.id}
                name={show.venueName}
                subtitle={`${bookingEventTypeLabel[show.type]}${show.city ? ' · ' + show.city : ''}`}
                email={email}
                onRename={(venueName) => updateShow(show.id, { venueName })}
                onDelete={() => deleteShow(show.id)}
              />
            ))}
          </div>
        </>
      )}

      {showCreateShow && (
        <BookingEventModal
          releases={releases}
          onClose={() => setShowCreateShow(false)}
          onSubmit={async (input) => {
            await createShow(input)
            setShowCreateShow(false)
          }}
        />
      )}
    </div>
  )
}
