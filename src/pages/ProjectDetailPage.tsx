import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDeleteRelease, useReleases, useUpdateRelease } from '../hooks/useReleases'
import { usePromoCalendarEvents } from '../hooks/useCalendarEvents'
import { useAdminDocs } from '../hooks/useDocs'
import { useSongs } from '../hooks/useSongs'
import { useShows } from '../hooks/useShows'
import { useAllowlist } from '../hooks/useAllowlist'
import { useAuth } from '../contexts/AuthContext'
import { StatusPill } from '../components/ui/StatusPill'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { EditableText } from '../components/ui/EditableText'
import { EditableLink } from '../components/ui/EditableLink'
import { ChecklistSection } from '../components/releases/ChecklistSection'
import { ReleasePhaseBadge } from '../components/releases/ReleasePhaseBadge'
import { releaseTypeLabel } from '../lib/statusTone'
import { formatDateTime } from '../lib/dates'

const pinterestUrl = import.meta.env.VITE_PINTEREST_URL as string | undefined

export function ProjectDetailPage() {
  const { releaseId } = useParams<{ releaseId: string }>()
  const { releases, loading } = useReleases()
  const { events } = usePromoCalendarEvents()
  const { docs } = useAdminDocs()
  const { songs } = useSongs()
  const { shows } = useShows()
  const { members } = useAllowlist()
  const { user } = useAuth()
  const deleteRelease = useDeleteRelease()
  const updateRelease = useUpdateRelease()
  const navigate = useNavigate()
  const shareWithEmails = members.map((m) => m.email).filter((email) => email !== user?.email)

  const release = releases.find((s) => s.id === releaseId)
  if (loading) return null
  if (!release) {
    return (
      <div className="p-6 text-sm text-zinc-500">
        Projet introuvable. <Link to="/releases/projects" className="text-blue-600 hover:underline">Retour</Link>
      </div>
    )
  }

  const includedSongs = songs.filter((s) => release.songIds.includes(s.id))
  const relatedEvents = events.filter((e) => e.releaseId === release.id)
  const relatedDocs = docs.filter((d) => d.relatedReleaseId === release.id)
  const linkedShows = shows.filter((s) => s.releaseId === release.id)

  async function handleDelete() {
    // Non-null: only wired up from JSX below, unreachable until the `!release` guard above returns.
    if (!confirm(`Supprimer le projet « ${release!.title} » ? Les morceaux resteront dans Sorties.`)) return
    await deleteRelease(release!.id)
    navigate('/releases/projects')
  }

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <Link to="/releases/projects" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
        ← Sorties
      </Link>
      <div className="mt-2 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <EditableText
            as="h1"
            value={release.title}
            onSave={(title) => updateRelease(release.id, { title })}
            className="text-xl font-semibold text-zinc-900 dark:text-zinc-50"
          />
          <StatusPill label={releaseTypeLabel[release.type]} tone="gray" />
          <ReleasePhaseBadge releaseId={release.id} showProgress />
        </div>
        <Button variant="danger" onClick={handleDelete}>
          Supprimer
        </Button>
      </div>

      <div className="mt-4">
        <ChecklistSection
          releaseId={release.id}
          shareWithEmails={shareWithEmails}
          linkedShows={linkedShows}
          onCompletionChange={(allDone) => updateRelease(release.id, { status: allDone ? 'released' : 'upcoming' })}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
        <EditableLink
          url={release.pinterestUrl}
          onSave={(pinterestUrl) => updateRelease(release.id, { pinterestUrl })}
          icon="📌"
          linkLabel="Moodboard Pinterest"
          emptyLabel="Aucun moodboard Pinterest"
          createUrl={pinterestUrl}
          createLabel="+ Créer un moodboard Pinterest"
        />
      </div>

      <h2 className="mt-6 mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Morceaux</h2>
      {includedSongs.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucun morceau associé.</p>
      ) : (
        <div className="space-y-2">
          {includedSongs.map((song) => (
            <Link key={song.id} to={`/releases/songs/${song.id}`}>
              <Card className="flex items-center justify-between p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/60">
                <span className="text-sm text-zinc-900 dark:text-zinc-100">{song.title}</span>
                {song.sacemDeposited && <StatusPill label="✓ SACEM" tone="green" />}
              </Card>
            </Link>
          ))}
        </div>
      )}

      <h2 className="mt-6 mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Événements</h2>
      {relatedEvents.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucun événement planifié.</p>
      ) : (
        <div className="space-y-2">
          {relatedEvents.map((event) => (
            <Card key={event.id} className="p-3">
              <p className="text-sm text-zinc-900 dark:text-zinc-100">{event.title}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">{formatDateTime(event.startAt)}</p>
            </Card>
          ))}
        </div>
      )}

      <h2 className="mt-6 mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Documents</h2>
      {relatedDocs.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucun document associé.</p>
      ) : (
        <div className="space-y-2">
          {relatedDocs.map((doc) => (
            <Card key={doc.id} className="p-3">
              <a href={doc.driveUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                {doc.title}
              </a>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
