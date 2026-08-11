import { useState } from 'react'
import { useCreateShow, useDeleteShow, useShows, useUpdateShow } from '../hooks/useShows'
import { useVenues } from '../hooks/useVenues'
import { CreateShowModal } from '../components/booking/CreateShowModal'
import { ShowsByStatus } from '../components/booking/ShowsByStatus'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'

export function BookingPage() {
  const { shows, loading: showsLoading } = useShows()
  const createShow = useCreateShow()
  const updateShow = useUpdateShow()
  const deleteShow = useDeleteShow()

  // Kept read-only, for contact info on shows created before venues were folded into events.
  const { venues } = useVenues()

  const [showCreateShow, setShowCreateShow] = useState(false)

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
          onRename={(id, venueName) => updateShow(id, { venueName })}
          onStatusChange={(id, status) => updateShow(id, { status })}
          onDelete={(id) => deleteShow(id)}
        />
      )}

      {showCreateShow && (
        <CreateShowModal
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
