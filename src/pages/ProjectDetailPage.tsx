import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDeleteRelease, useReleases, useUpdateRelease } from '../hooks/useReleases'
import { usePromoContent, useUpdatePromoContent } from '../hooks/usePromoContent'
import { usePromoCalendarEvents } from '../hooks/useCalendarEvents'
import { useAdminDocs } from '../hooks/useDocs'
import { useSongs } from '../hooks/useSongs'
import { useAllowlist } from '../hooks/useAllowlist'
import { useAuth } from '../contexts/AuthContext'
import { StatusPill } from '../components/ui/StatusPill'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { EditableText } from '../components/ui/EditableText'
import { EditableLink } from '../components/ui/EditableLink'
import { DriveAttachButton } from '../components/documents/DriveAttachButton'
import { promoContentTone, releaseTypeLabel, songStageLabel, songStageTone } from '../lib/statusTone'
import { formatDate, formatDateTime, dateInputValue, parseDateInputValue } from '../lib/dates'

const pinterestUrl = import.meta.env.VITE_PINTEREST_URL as string | undefined

export function ProjectDetailPage() {
  const { releaseId } = useParams<{ releaseId: string }>()
  const { releases, loading } = useReleases()
  const { items } = usePromoContent()
  const { events } = usePromoCalendarEvents()
  const { docs } = useAdminDocs()
  const { songs } = useSongs()
  const { members } = useAllowlist()
  const { user } = useAuth()
  const deleteRelease = useDeleteRelease()
  const updateRelease = useUpdateRelease()
  const updateContent = useUpdatePromoContent()
  const navigate = useNavigate()
  const shareWithEmails = members.map((m) => m.email).filter((email) => email !== user?.email)

  const release = releases.find((s) => s.id === releaseId)
  if (loading) return null
  if (!release) {
    return (
      <div className="p-6 text-sm text-zinc-500">
        Projet introuvable. <Link to="/promotion/projects" className="text-blue-600 hover:underline">Retour</Link>
      </div>
    )
  }

  const includedSongs = songs.filter((s) => release.songIds.includes(s.id))
  const relatedContent = items.filter((i) => i.releaseId === release.id)
  const relatedEvents = events.filter((e) => e.releaseId === release.id)
  const relatedDocs = docs.filter((d) => d.relatedReleaseId === release.id)

  async function handleDelete() {
    // Non-null: only wired up from JSX below, unreachable until the `!release` guard above returns.
    if (!confirm(`Supprimer le projet « ${release!.title} » ? Les morceaux resteront dans Production.`)) return
    await deleteRelease(release!.id)
    navigate('/promotion/projects')
  }

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <Link to="/promotion/projects" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
        ← Projets
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
          <StatusPill
            label={release.status === 'upcoming' ? 'À venir' : 'Sorti'}
            tone={release.status === 'upcoming' ? 'yellow' : 'green'}
          />
        </div>
        <Button variant="danger" onClick={handleDelete}>
          Supprimer
        </Button>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Sortie le {formatDate(release.releaseDate)}</p>
      <div className="mt-2">
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
            <Link key={song.id} to={`/production/${song.id}`}>
              <Card className="flex items-center justify-between p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/60">
                <span className="text-sm text-zinc-900 dark:text-zinc-100">{song.title}</span>
                <StatusPill label={songStageLabel[song.status]} tone={songStageTone[song.status]} />
              </Card>
            </Link>
          ))}
        </div>
      )}

      <h2 className="mt-6 mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Contenus promo</h2>
      {relatedContent.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucun contenu associé.</p>
      ) : (
        <div className="space-y-2">
          {relatedContent.map((item) => (
            <Card key={item.id} className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-900 dark:text-zinc-100">{item.title}</span>
                <StatusPill label={item.status} tone={promoContentTone[item.status]} />
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <label htmlFor={`publish-detail-${item.id}`}>Date de publication :</label>
                <input
                  id={`publish-detail-${item.id}`}
                  type="date"
                  value={dateInputValue(item.publishDate)}
                  onChange={(e) => updateContent(item.id, { publishDate: parseDateInputValue(e.target.value) })}
                  className="rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-xs dark:border-zinc-700"
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {item.driveLinks.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-blue-600 hover:underline dark:bg-zinc-800 dark:text-blue-400"
                  >
                    📎 Fichier {item.driveLinks.length > 1 ? i + 1 : ''}
                  </a>
                ))}
                <DriveAttachButton
                  label={item.driveLinks.length > 0 ? '+ Ajouter un fichier' : '📎 Attacher depuis Drive'}
                  shareWithEmails={shareWithEmails}
                  onPicked={(file) => updateContent(item.id, { driveLinks: [...item.driveLinks, file.url] })}
                />
              </div>
            </Card>
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
