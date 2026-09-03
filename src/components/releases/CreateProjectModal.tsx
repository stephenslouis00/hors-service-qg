import { useState } from 'react'
import { useCreateSong } from '../../hooks/useSongs'
import { useCreateRelease } from '../../hooks/useReleases'
import { seedChecklist } from '../../hooks/useChecklist'
import { RELEASE_TYPES, type ReleaseType } from '../../types/promo'
import { releaseTypeLabel } from '../../lib/statusTone'
import { parseDateInputValue } from '../../lib/dates'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

export function CreateProjectModal({
  songs,
  onClose,
  onCreated,
}: {
  songs: { id: string; title: string }[]
  onClose: () => void
  onCreated?: (releaseId: string) => void
}) {
  const createSong = useCreateSong()
  const createRelease = useCreateRelease()

  const [type, setType] = useState<ReleaseType>('single')
  const [title, setTitle] = useState('')
  const [releaseDate, setReleaseDate] = useState('')
  const [existingSongIds, setExistingSongIds] = useState<string[]>([])
  const [newSongTitles, setNewSongTitles] = useState<{ id: string; title: string }[]>([])
  const [newSongDraft, setNewSongDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function toggleExistingSong(id: string) {
    setExistingSongIds((current) => (current.includes(id) ? current.filter((s) => s !== id) : [...current, id]))
  }

  function addNewSongTitle() {
    const value = newSongDraft.trim()
    if (!value) return
    setNewSongTitles((current) => [...current, { id: crypto.randomUUID(), title: value }])
    setNewSongDraft('')
  }

  function removeNewSongTitle(id: string) {
    setNewSongTitles((current) => current.filter((s) => s.id !== id))
  }

  async function handleSubmit() {
    if (!title.trim()) return
    setSubmitting(true)
    try {
      if (type === 'single') {
        const songRef = await createSong(title.trim())
        const releaseRef = await createRelease({
          title: title.trim(),
          type: 'single',
          releaseDate: null,
          songIds: [songRef.id],
        })
        await seedChecklist(releaseRef.id)
        onCreated?.(releaseRef.id)
      } else {
        const createdIds = await Promise.all(newSongTitles.map((s) => createSong(s.title).then((ref) => ref.id)))
        const releaseRef = await createRelease({
          title: title.trim(),
          type,
          releaseDate: releaseDate ? parseDateInputValue(releaseDate) : null,
          songIds: [...existingSongIds, ...createdIds],
        })
        await seedChecklist(releaseRef.id)
        onCreated?.(releaseRef.id)
      }
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Nouveau projet" onClose={onClose}>
      <div className="space-y-3">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ReleaseType)}
          className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
        >
          {RELEASE_TYPES.map((t) => (
            <option key={t} value={t}>
              {releaseTypeLabel[t]}
            </option>
          ))}
        </select>

        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={type === 'single' ? 'Titre du morceau' : "Titre du projet (ex : nom de l'album)"}
          className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
        />

        {type !== 'single' && (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Date de sortie visée (optionnel)
              </label>
              <input
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
              />
            </div>

            {songs.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">Inclure des morceaux existants</p>
                <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border border-zinc-300 p-2 dark:border-zinc-700">
                  {songs.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800">
                      <input type="checkbox" checked={existingSongIds.includes(s.id)} onChange={() => toggleExistingSong(s.id)} />
                      {s.title}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">Ajouter de nouveaux morceaux</p>
              <div className="flex gap-2">
                <input
                  value={newSongDraft}
                  onChange={(e) => setNewSongDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addNewSongTitle()
                    }
                  }}
                  placeholder="Titre du morceau"
                  className="flex-1 rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
                />
                <Button onClick={addNewSongTitle} disabled={!newSongDraft.trim()}>
                  Ajouter
                </Button>
              </div>
              {newSongTitles.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {newSongTitles.map((s) => (
                    <li key={s.id} className="flex items-center justify-between rounded bg-zinc-50 px-2 py-1 text-sm dark:bg-zinc-800">
                      {s.title}
                      <button onClick={() => removeNewSongTitle(s.id)} className="text-xs text-red-600 hover:underline dark:text-red-400">
                        Retirer
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting || !title.trim()}>
            Créer
          </Button>
        </div>
      </div>
    </Modal>
  )
}
