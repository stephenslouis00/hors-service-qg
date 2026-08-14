import { useState } from 'react'
import { Link } from 'react-router-dom'
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
import { useDeleteRelease, useReleases, useUpdateRelease } from '../hooks/useReleases'
import { useCreatePromoContent, usePromoContent, useUpdatePromoContent } from '../hooks/usePromoContent'
import { useSongs } from '../hooks/useSongs'
import { useAllowlist } from '../hooks/useAllowlist'
import { useUnclassifiedLabel, useUpdateUnclassifiedLabel } from '../hooks/useSettings'
import { useAuth } from '../contexts/AuthContext'
import type { DrivePickedFile } from '../lib/googleDrive'
import { PROMO_CONTENT_TYPES, type PromoContentItem, type PromoContentStatus, type PromoContentType, type Release } from '../types/promo'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { StatusPill } from '../components/ui/StatusPill'
import { EmptyState } from '../components/ui/EmptyState'
import { EditableText } from '../components/ui/EditableText'
import { EditableLink } from '../components/ui/EditableLink'
import { ContentItemRow } from '../components/releases/ContentItemRow'
import { CreateProjectModal } from '../components/releases/CreateProjectModal'
import { ChevronRightIcon, FolderIcon, GripIcon } from '../components/layout/icons'
import { releaseTypeLabel, promoContentTypeLabel } from '../lib/statusTone'
import { reorderAcrossCollections } from '../firebase/firestore'
import { formatDate } from '../lib/dates'
import clsx from 'clsx'

const pinterestUrl = import.meta.env.VITE_PINTEREST_URL as string | undefined

const UNCLASSIFIED = '__unclassified__'

export function ProjectsPage() {
  const { releases, loading: releasesLoading } = useReleases()
  const { items, loading: itemsLoading } = usePromoContent()
  const { songs } = useSongs()
  const { members } = useAllowlist()
  const { user } = useAuth()
  const deleteRelease = useDeleteRelease()
  const updateRelease = useUpdateRelease()
  const createContent = useCreatePromoContent()
  const updateContent = useUpdatePromoContent()
  const unclassifiedLabel = useUnclassifiedLabel()
  const updateUnclassifiedLabel = useUpdateUnclassifiedLabel()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))
  const shareWithEmails = members.map((m) => m.email).filter((email) => email !== user?.email)

  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showCreateRelease, setShowCreateRelease] = useState(false)
  const [contentModalReleaseId, setContentModalReleaseId] = useState<string | null>(null)

  function toggleExpanded(id: string) {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleDelete(releaseId: string, title: string) {
    if (!confirm(`Supprimer le projet « ${title} » ? Les morceaux resteront dans Production.`)) return
    await deleteRelease(releaseId)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = releases.findIndex((r) => r.id === active.id)
    const newIndex = releases.findIndex((r) => r.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const newOrder = arrayMove(releases, oldIndex, newIndex)
    reorderAcrossCollections(newOrder.map((r) => ({ path: 'releases', id: r.id })))
  }

  const unclassifiedItems = items.filter((i) => !i.releaseId)
  const loading = releasesLoading || itemsLoading

  return (
    <div>
      <div className="mb-4 flex justify-end gap-2">
        <Button onClick={() => setContentModalReleaseId(UNCLASSIFIED)}>+ Nouveau contenu</Button>
        <Button variant="primary" onClick={() => setShowCreateRelease(true)}>
          + Nouveau projet
        </Button>
      </div>

      {!loading && releases.length === 0 && unclassifiedItems.length === 0 && (
        <EmptyState title="Aucun projet" description="Crée un single, un EP ou un album pour commencer." />
      )}

      <div className="space-y-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={releases.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            {releases.map((release) => (
              <ProjectFolder
                key={release.id}
                release={release}
                isOpen={expanded.has(release.id)}
                items={items.filter((i) => i.releaseId === release.id)}
                shareWithEmails={shareWithEmails}
                onToggle={() => toggleExpanded(release.id)}
                onRename={(title) => updateRelease(release.id, { title })}
                onDelete={() => handleDelete(release.id, release.title)}
                onAddContent={() => setContentModalReleaseId(release.id)}
                onRenameContent={(id, title) => updateContent(id, { title })}
                onStatusChange={(id, status) => updateContent(id, { status })}
                onPinterestSave={(url) => updateRelease(release.id, { pinterestUrl: url })}
                onAttachDrive={(item, file) => updateContent(item.id, { driveLinks: [...item.driveLinks, { url: file.url, name: file.name }] })}
                onRemoveDrive={(item, url) => updateContent(item.id, { driveLinks: item.driveLinks.filter((link) => link.url !== url) })}
                onPublishDateChange={(id, date) => updateContent(id, { publishDate: date })}
              />
            ))}
          </SortableContext>
        </DndContext>

        {unclassifiedItems.length > 0 && (
          <Card>
            <div
              role="button"
              tabIndex={0}
              onClick={() => toggleExpanded(UNCLASSIFIED)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleExpanded(UNCLASSIFIED)}
              className="flex w-full cursor-pointer items-center gap-1.5 px-4 py-3 text-left text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-900/60"
            >
              <ChevronRightIcon className={clsx('shrink-0 text-zinc-400 transition-transform', expanded.has(UNCLASSIFIED) && 'rotate-90')} />
              <FolderIcon className="shrink-0 text-zinc-400" />
              <EditableText value={unclassifiedLabel} onSave={updateUnclassifiedLabel} />
            </div>
            {expanded.has(UNCLASSIFIED) && (
              <div className="space-y-2 border-t border-zinc-100 p-4 dark:border-zinc-900">
                {unclassifiedItems.map((item) => (
                  <ContentItemRow
                    key={item.id}
                    item={item}
                    shareWithEmails={shareWithEmails}
                    onRename={(title) => updateContent(item.id, { title })}
                    onStatusChange={(status) => updateContent(item.id, { status })}
                    onAttachDrive={(file) => updateContent(item.id, { driveLinks: [...item.driveLinks, { url: file.url, name: file.name }] })}
                    onRemoveDrive={(url) => updateContent(item.id, { driveLinks: item.driveLinks.filter((link) => link.url !== url) })}
                    onPublishDateChange={(date) => updateContent(item.id, { publishDate: date })}
                  />
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      {showCreateRelease && (
        <CreateProjectModal
          songs={songs.map((s) => ({ id: s.id, title: s.title }))}
          onClose={() => setShowCreateRelease(false)}
        />
      )}

      {contentModalReleaseId && (
        <CreateContentModal
          releases={releases}
          unclassifiedLabel={unclassifiedLabel}
          initialReleaseId={contentModalReleaseId === UNCLASSIFIED ? '' : contentModalReleaseId}
          onClose={() => setContentModalReleaseId(null)}
          onSubmit={async (input) => {
            await createContent(input)
            setContentModalReleaseId(null)
          }}
        />
      )}
    </div>
  )
}

function ProjectFolder({
  release,
  isOpen,
  items,
  shareWithEmails,
  onToggle,
  onRename,
  onDelete,
  onAddContent,
  onRenameContent,
  onStatusChange,
  onPinterestSave,
  onAttachDrive,
  onRemoveDrive,
  onPublishDateChange,
}: {
  release: Release
  isOpen: boolean
  items: PromoContentItem[]
  shareWithEmails: string[]
  onToggle: () => void
  onRename: (title: string) => void
  onDelete: () => void
  onAddContent: () => void
  onRenameContent: (id: string, title: string) => void
  onStatusChange: (id: string, status: PromoContentStatus) => void
  onPinterestSave: (url: string) => void
  onAttachDrive: (item: PromoContentItem, file: DrivePickedFile) => void
  onRemoveDrive: (item: PromoContentItem, url: string) => void
  onPublishDateChange: (id: string, date: number | null) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: release.id })

  return (
    <Card ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}>
      <div className="flex w-full items-center justify-between gap-3 px-2 py-1">
        <span
          {...listeners}
          {...attributes}
          className="flex shrink-0 cursor-grab items-center px-2 py-2 text-zinc-400 hover:text-zinc-600 active:cursor-grabbing dark:hover:text-zinc-300"
        >
          <GripIcon />
        </span>
        <div
          role="button"
          tabIndex={0}
          onClick={onToggle}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onToggle()}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 py-2 text-left hover:opacity-80"
        >
          <ChevronRightIcon className={clsx('shrink-0 text-zinc-400 transition-transform', isOpen && 'rotate-90')} />
          <FolderIcon className="shrink-0 text-zinc-400" />
          <span className="min-w-0 truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
            <EditableText value={release.title} onSave={onRename} />
          </span>
        </div>
        <span className="flex shrink-0 items-center gap-2">
          <StatusPill label={releaseTypeLabel[release.type]} tone="gray" />
          <StatusPill
            label={release.status === 'upcoming' ? 'À venir' : 'Sorti'}
            tone={release.status === 'upcoming' ? 'yellow' : 'green'}
          />
          <span className="hidden text-xs text-zinc-500 dark:text-zinc-500 sm:inline">{formatDate(release.releaseDate)}</span>
        </span>
      </div>

      {isOpen && (
        <div className="border-t border-zinc-100 p-4 dark:border-zinc-900">
          <div className="flex items-center justify-between">
            <Link to={`/promotion/projects/${release.id}`} className="text-xs text-blue-600 hover:underline dark:text-blue-400">
              Voir le détail complet (morceaux, calendrier, documents) →
            </Link>
            <button onClick={onDelete} className="text-xs text-red-600 hover:underline dark:text-red-400">
              Supprimer le projet
            </button>
          </div>

          <div className="mt-2">
            <EditableLink
              url={release.pinterestUrl}
              onSave={onPinterestSave}
              icon="📌"
              linkLabel="Moodboard Pinterest"
              emptyLabel="Aucun moodboard Pinterest"
              createUrl={pinterestUrl}
              createLabel="+ Créer un moodboard Pinterest"
            />
          </div>

          <div className="mt-3 space-y-2">
            {items.length === 0 && <p className="text-sm text-zinc-500">Aucun contenu pour ce projet.</p>}
            {items.map((item) => (
              <ContentItemRow
                key={item.id}
                item={item}
                shareWithEmails={shareWithEmails}
                onRename={(title) => onRenameContent(item.id, title)}
                onStatusChange={(status) => onStatusChange(item.id, status)}
                onAttachDrive={(file) => onAttachDrive(item, file)}
                onRemoveDrive={(url) => onRemoveDrive(item, url)}
                onPublishDateChange={(date) => onPublishDateChange(item.id, date)}
              />
            ))}
          </div>

          <Button className="mt-3" onClick={onAddContent}>
            + Ajouter un contenu
          </Button>
        </div>
      )}
    </Card>
  )
}

function CreateContentModal({
  releases,
  unclassifiedLabel,
  initialReleaseId,
  onClose,
  onSubmit,
}: {
  releases: { id: string; title: string }[]
  unclassifiedLabel: string
  initialReleaseId: string
  onClose: () => void
  onSubmit: (input: { title: string; type: PromoContentType; releaseId: string | null }) => Promise<unknown>
}) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<PromoContentType>('post')
  const [releaseId, setReleaseId] = useState(initialReleaseId)

  async function handleSubmit() {
    if (!title.trim()) return
    await onSubmit({ title: title.trim(), type, releaseId: releaseId || null })
  }

  return (
    <Modal title="Nouveau contenu" onClose={onClose}>
      <div className="space-y-3">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre"
          className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as PromoContentType)}
          className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
        >
          {PROMO_CONTENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {promoContentTypeLabel[t]}
            </option>
          ))}
        </select>
        <select
          value={releaseId}
          onChange={(e) => setReleaseId(e.target.value)}
          className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
        >
          <option value="">{unclassifiedLabel}</option>
          {releases.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!title.trim()}>
            Créer
          </Button>
        </div>
      </div>
    </Modal>
  )
}
