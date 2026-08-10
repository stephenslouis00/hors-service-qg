import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAddSongFeedback, useDeleteSong, useSongFeedback, useSongs, useUpdateSong } from '../hooks/useSongs'
import { useAllowlist } from '../hooks/useAllowlist'
import { useAuth } from '../contexts/AuthContext'
import { SONG_STAGES, type SongStage } from '../types/song'
import { StatusPill } from '../components/ui/StatusPill'
import { ActivityFeed } from '../components/activity/ActivityFeed'
import { FeedbackComposer } from '../components/activity/FeedbackComposer'
import { DriveAttachButton } from '../components/documents/DriveAttachButton'
import { Button } from '../components/ui/Button'
import { EditableText } from '../components/ui/EditableText'
import { songStageLabel, songStageTone } from '../lib/statusTone'
import { dateInputValue, parseDateInputValue } from '../lib/dates'

export function SongDetailPage() {
  const { songId } = useParams<{ songId: string }>()
  const { songs, loading } = useSongs()
  const { feedback } = useSongFeedback(songId)
  const addFeedback = useAddSongFeedback(songId)
  const updateSong = useUpdateSong()
  const deleteSong = useDeleteSong()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { members } = useAllowlist()

  const song = songs.find((s) => s.id === songId)

  if (loading) return null
  if (!song) {
    return (
      <div className="p-6 text-sm text-zinc-500">
        Morceau introuvable. <Link to="/production" className="text-blue-600 hover:underline">Retour</Link>
      </div>
    )
  }

  async function handleStageChange(stage: SongStage) {
    // Non-null: this handler is only ever wired up from the JSX below, which
    // isn't reached until the `!song` guard above has already returned.
    await updateSong(song!.id, { status: stage })
  }

  async function handleDelete() {
    if (!confirm(`Supprimer « ${song!.title} » ?`)) return
    await deleteSong(song!.id)
    navigate('/production')
  }

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <Link to="/production" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
        ← Production
      </Link>

      <div className="mt-2 flex items-start justify-between gap-4">
        <EditableText
          as="h1"
          value={song.title}
          onSave={(title) => updateSong(song.id, { title })}
          className="text-xl font-semibold text-zinc-900 dark:text-zinc-50"
        />
        <Button variant="danger" onClick={handleDelete}>
          Supprimer
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">Étape :</span>
        <div className="flex flex-wrap gap-1.5">
          {SONG_STAGES.map((stage) => (
            <button key={stage} onClick={() => handleStageChange(stage)}>
              <StatusPill
                label={songStageLabel[stage]}
                tone={stage === song.status ? songStageTone[stage] : 'gray'}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 text-sm">
        <span className="text-zinc-500 dark:text-zinc-400">Fichier audio :</span>
        {song.driveFolderUrl ? (
          <a
            href={song.driveFolderUrl}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            Ouvrir dans Drive
          </a>
        ) : (
          <span className="text-zinc-500 dark:text-zinc-500">Aucun fichier attaché</span>
        )}
        <DriveAttachButton
          label={song.driveFolderUrl ? '↻ Remplacer' : '📎 Attacher depuis Drive'}
          shareWithEmails={members.map((m) => m.email).filter((email) => email !== user?.email)}
          onPicked={(file) => updateSong(song.id, { driveFolderUrl: file.url })}
        />
        {song.driveFolderUrl && (
          <button
            onClick={() => updateSong(song.id, { driveFolderUrl: '' })}
            className="text-xs text-red-600 hover:underline dark:text-red-400"
          >
            Retirer
          </button>
        )}
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
        <input
          type="checkbox"
          checked={Boolean(song.sacemDeposited)}
          onChange={(e) => updateSong(song.id, { sacemDeposited: e.target.checked })}
          className="h-4 w-4 cursor-pointer accent-green-600"
        />
        Déposé à la SACEM
      </label>

      {song.status === 'uploaded' && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <label className="text-zinc-500 dark:text-zinc-400">Date de sortie :</label>
          <input
            type="date"
            value={dateInputValue(song.releaseDate)}
            onChange={(e) => updateSong(song.id, { releaseDate: parseDateInputValue(e.target.value) })}
            className="rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-sm dark:border-zinc-700"
          />
        </div>
      )}

      <h2 className="mt-6 mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Retours</h2>
      <ActivityFeed feedback={feedback} />
      <div className="mt-4">
        <FeedbackComposer currentStage={song.status} onSubmit={(text) => addFeedback(song.status, text)} />
      </div>
    </div>
  )
}
