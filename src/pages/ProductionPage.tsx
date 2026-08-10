import { Fragment, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useSongs, useUpdateSong } from '../hooks/useSongs'
import { useReleases, useUpdateRelease } from '../hooks/useReleases'
import { reorderAcrossCollections } from '../firebase/firestore'
import { Table, TableHead, TableHeaderCell, TableCell } from '../components/ui/Table'
import { StatusPill } from '../components/ui/StatusPill'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { EditableText } from '../components/ui/EditableText'
import { CreateProjectModal } from '../components/releases/CreateProjectModal'
import { ChevronRightIcon, FolderIcon, GripIcon } from '../components/layout/icons'
import { songStageLabel, songStageTone, releaseTypeLabel } from '../lib/statusTone'
import { formatDate } from '../lib/dates'
import type { Song } from '../types/song'
import type { Release } from '../types/promo'
import clsx from 'clsx'

type ProductionRow = { kind: 'folder'; release: Release; songs: Song[] } | { kind: 'song'; song: Song }

function rowId(row: ProductionRow) {
  return row.kind === 'folder' ? row.release.id : row.song.id
}

export function ProductionPage() {
  const { songs, loading } = useSongs()
  const { releases } = useReleases()
  const updateSong = useUpdateSong()
  const updateRelease = useUpdateRelease()
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  function toggleExpanded(id: string) {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const folders = releases.filter((r) => r.type !== 'single' && r.songIds.length > 0)
  const groupedSongIds = new Set(folders.flatMap((r) => r.songIds))
  const flatSongs = songs.filter((s) => !groupedSongIds.has(s.id))

  const rows: ProductionRow[] = [
    ...folders.map((release) => ({
      kind: 'folder' as const,
      release,
      songs: songs.filter((s) => release.songIds.includes(s.id)),
    })),
    ...flatSongs.map((song) => ({ kind: 'song' as const, song })),
  ].sort((a, b) => (a.kind === 'folder' ? a.release.order : a.song.order) - (b.kind === 'folder' ? b.release.order : b.song.order))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const activeData = active.data.current as { type: 'row' } | { type: 'songInFolder'; releaseId: string } | undefined
    const overData = over.data.current as typeof activeData

    if (activeData?.type === 'row') {
      const oldIndex = rows.findIndex((r) => rowId(r) === active.id)
      const newIndex = rows.findIndex((r) => rowId(r) === over.id)
      if (oldIndex === -1 || newIndex === -1) return
      const newRows = arrayMove(rows, oldIndex, newIndex)
      reorderAcrossCollections(
        newRows.map((r) => (r.kind === 'folder' ? { path: 'releases', id: r.release.id } : { path: 'songs', id: r.song.id })),
      )
    } else if (activeData?.type === 'songInFolder') {
      const releaseId = activeData.releaseId
      if (overData?.type !== 'songInFolder' || overData.releaseId !== releaseId) return
      const release = releases.find((r) => r.id === releaseId)
      if (!release) return
      const oldIndex = release.songIds.indexOf(String(active.id))
      const newIndex = release.songIds.indexOf(String(over.id))
      if (oldIndex === -1 || newIndex === -1) return
      updateRelease(releaseId, { songIds: arrayMove(release.songIds, oldIndex, newIndex) })
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Production</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Suivi des morceaux, de la démo à la sortie.</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          + Nouveau projet
        </Button>
      </div>

      {!loading && songs.length === 0 && (
        <EmptyState
          title="Aucun morceau pour l'instant"
          description="Crée un projet (single, EP ou album) pour commencer à suivre sa progression."
          action={
            <Button variant="primary" onClick={() => setShowCreate(true)}>
              + Nouveau projet
            </Button>
          }
        />
      )}

      {songs.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Table>
            <TableHead>
              <TableHeaderCell />
              <TableHeaderCell>Titre</TableHeaderCell>
              <TableHeaderCell>Statut</TableHeaderCell>
              <TableHeaderCell>SACEM</TableHeaderCell>
              <TableHeaderCell>Date de sortie</TableHeaderCell>
            </TableHead>
            <tbody>
              <SortableContext items={rows.map(rowId)} strategy={verticalListSortingStrategy}>
                {rows.map((row) =>
                  row.kind === 'folder' ? (
                    <Fragment key={row.release.id}>
                      <FolderRow
                        release={row.release}
                        songCount={row.songs.length}
                        isOpen={expanded.has(row.release.id)}
                        onToggle={() => toggleExpanded(row.release.id)}
                        onRename={(title) => updateRelease(row.release.id, { title })}
                      />
                      {expanded.has(row.release.id) && (
                        <SortableContext items={row.songs.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                          {row.songs.map((song) => (
                            <NestedSongRow
                              key={song.id}
                              song={song}
                              releaseId={row.release.id}
                              onNavigate={() => navigate(`/production/${song.id}`)}
                              onRename={(title) => updateSong(song.id, { title })}
                              onToggleSacem={(checked) => updateSong(song.id, { sacemDeposited: checked })}
                            />
                          ))}
                        </SortableContext>
                      )}
                    </Fragment>
                  ) : (
                    <FlatSongRow
                      key={row.song.id}
                      song={row.song}
                      onNavigate={() => navigate(`/production/${row.song.id}`)}
                      onRename={(title) => updateSong(row.song.id, { title })}
                      onToggleSacem={(checked) => updateSong(row.song.id, { sacemDeposited: checked })}
                    />
                  ),
                )}
              </SortableContext>
            </tbody>
          </Table>
        </DndContext>
      )}

      {showCreate && (
        <CreateProjectModal
          songs={songs.map((s) => ({ id: s.id, title: s.title }))}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}

function DragHandleCell({ listeners, attributes }: { listeners: ReturnType<typeof useSortable>['listeners']; attributes: ReturnType<typeof useSortable>['attributes'] }) {
  return (
    <TableCell className="w-6 px-2">
      <span
        {...listeners}
        {...attributes}
        onClick={(e) => e.stopPropagation()}
        className="flex cursor-grab items-center justify-center text-zinc-400 hover:text-zinc-600 active:cursor-grabbing dark:hover:text-zinc-300"
      >
        <GripIcon />
      </span>
    </TableCell>
  )
}

function FolderRow({
  release,
  songCount,
  isOpen,
  onToggle,
  onRename,
}: {
  release: Release
  songCount: number
  isOpen: boolean
  onToggle: () => void
  onRename: (title: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: release.id,
    data: { type: 'row' },
  })

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      onClick={onToggle}
      className="cursor-pointer border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900/60"
    >
      <DragHandleCell listeners={listeners} attributes={attributes} />
      <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
        <span className="flex items-center gap-1.5">
          <ChevronRightIcon className={clsx('shrink-0 text-zinc-400 transition-transform', isOpen && 'rotate-90')} />
          <FolderIcon className="shrink-0 text-zinc-400" />
          <EditableText value={release.title} onSave={onRename} />
        </span>
      </TableCell>
      <TableCell>
        <StatusPill label={releaseTypeLabel[release.type]} tone="gray" />
      </TableCell>
      <TableCell className="text-zinc-400">—</TableCell>
      <TableCell className="text-zinc-500 dark:text-zinc-400">
        {songCount} morceau{songCount > 1 ? 'x' : ''}
      </TableCell>
    </tr>
  )
}

function NestedSongRow({
  song,
  releaseId,
  onNavigate,
  onRename,
  onToggleSacem,
}: {
  song: Song
  releaseId: string
  onNavigate: () => void
  onRename: (title: string) => void
  onToggleSacem: (checked: boolean) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: song.id,
    data: { type: 'songInFolder', releaseId },
  })

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      onClick={onNavigate}
      className="cursor-pointer border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900/60"
    >
      <DragHandleCell listeners={listeners} attributes={attributes} />
      <TableCell className="pl-10 text-zinc-900 dark:text-zinc-100">
        <EditableText value={song.title} onSave={onRename} />
      </TableCell>
      <TableCell>
        <StatusPill label={songStageLabel[song.status]} tone={songStageTone[song.status]} />
      </TableCell>
      <SacemCell checked={Boolean(song.sacemDeposited)} onToggle={onToggleSacem} />
      <TableCell className="text-zinc-500 dark:text-zinc-400">{formatDate(song.releaseDate)}</TableCell>
    </tr>
  )
}

function FlatSongRow({
  song,
  onNavigate,
  onRename,
  onToggleSacem,
}: {
  song: Song
  onNavigate: () => void
  onRename: (title: string) => void
  onToggleSacem: (checked: boolean) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: song.id,
    data: { type: 'row' },
  })

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      onClick={onNavigate}
      className="cursor-pointer border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900/60"
    >
      <DragHandleCell listeners={listeners} attributes={attributes} />
      <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
        <EditableText value={song.title} onSave={onRename} />
      </TableCell>
      <TableCell>
        <StatusPill label={songStageLabel[song.status]} tone={songStageTone[song.status]} />
      </TableCell>
      <SacemCell checked={Boolean(song.sacemDeposited)} onToggle={onToggleSacem} />
      <TableCell className="text-zinc-500 dark:text-zinc-400">{formatDate(song.releaseDate)}</TableCell>
    </tr>
  )
}

function SacemCell({ checked, onToggle }: { checked: boolean; onToggle: (checked: boolean) => void }) {
  return (
    <TableCell>
      <input
        type="checkbox"
        checked={checked}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onToggle(e.target.checked)}
        title="Déposé à la SACEM"
        className="h-4 w-4 cursor-pointer accent-green-600"
      />
    </TableCell>
  )
}
