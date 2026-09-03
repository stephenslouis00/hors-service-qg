import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAddSongFeedback, useDeleteSong, useSongFeedback, useSongs, useUpdateSong } from '../hooks/useSongs'
import { useReleases } from '../hooks/useReleases'
import { useAllowlist } from '../hooks/useAllowlist'
import { useAuth } from '../contexts/AuthContext'
import { SONG_STAGES, type SongStage } from '../types/song'
import { ActivityFeed } from '../components/activity/ActivityFeed'
import { FeedbackComposer } from '../components/activity/FeedbackComposer'
import { DriveAttachButton } from '../components/documents/DriveAttachButton'
import { ReleasePhaseBadge } from '../components/releases/ReleasePhaseBadge'
import { PaperclipIcon } from '../components/layout/icons'
import { Button } from '../components/ui/Button'
import { EditableText } from '../components/ui/EditableText'
import { Spinner } from '../components/ui/Spinner'
import { SectionHeading } from '../components/ui/SectionHeading'
import { songStageLabel } from '../lib/statusTone'
import { dateInputValue, parseDateInputValue } from '../lib/dates'

export function SongDetailPage() {
  const { songId } = useParams<{ songId: string }>()
  const { songs, loading } = useSongs()
  const { releases } = useReleases()
  const { feedback } = useSongFeedback(songId)
  const addFeedback = useAddSongFeedback(songId)
  const updateSong = useUpdateSong()
  const deleteSong = useDeleteSong()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { members } = useAllowlist()
  // Local only — just tags which stage a new comment is about, decoupled from
  // any persisted status now that progress lives entirely in the release's checklist.
  const [feedbackStage, setFeedbackStage] = useState<SongStage>('demo')

  const song = songs.find((s) => s.id === songId)
  const parentRelease = song ? releases.find((r) => r.songIds.includes(song.id)) : undefined

  if (loading) return <Spinner />
  if (!song) {
    return (
      <div className="p-6 text-sm text-zinc-500">
        Morceau introuvable. <Link to="/releases/projects" className="text-blue-600 hover:underline">Retour</Link>
      </div>
    )
  }

  async function handleDelete() {
    if (!confirm(`Supprimer « ${song!.title} » ?`)) return
    await deleteSong(song!.id)
    navigate('/releases/projects')
  }

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <Link to="/releases/projects" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
        ← Sorties
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

      {parentRelease && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">Statut de la sortie :</span>
          <ReleasePhaseBadge releaseId={parentRelease.id} showProgress />
          <Link
            to={`/releases/projects/${parentRelease.id}`}
            className="text-xs text-blue-600 hover:underline dark:text-blue-400"
          >
            Voir la checklist de la sortie →
          </Link>
        </div>
      )}

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
          label={
            song.driveFolderUrl ? (
              '↻ Remplacer'
            ) : (
              <>
                <PaperclipIcon /> Attacher depuis Drive
              </>
            )
          }
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

      <div className="mt-3 flex items-center gap-2 text-sm">
        <label className="text-zinc-500 dark:text-zinc-400">Date de sortie :</label>
        <input
          type="date"
          value={dateInputValue(song.releaseDate)}
          onChange={(e) => updateSong(song.id, { releaseDate: parseDateInputValue(e.target.value) })}
          className="rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-sm dark:border-zinc-700"
        />
      </div>

      <SectionHeading>Retours</SectionHeading>
      <ActivityFeed feedback={feedback} />
      <div className="mt-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <label htmlFor="feedback-stage">Étape concernée :</label>
          <select
            id="feedback-stage"
            value={feedbackStage}
            onChange={(e) => setFeedbackStage(e.target.value as SongStage)}
            className="rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-xs dark:border-zinc-700"
          >
            {SONG_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {songStageLabel[stage]}
              </option>
            ))}
          </select>
        </div>
        <FeedbackComposer currentStage={feedbackStage} onSubmit={(text) => addFeedback(feedbackStage, text)} />
      </div>
    </div>
  )
}
