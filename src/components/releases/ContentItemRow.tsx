import { useState } from 'react'
import { EditableText } from '../ui/EditableText'
import { StatusPillSelect } from '../ui/StatusPillSelect'
import { DriveAttachButton } from '../documents/DriveAttachButton'
import { PROMO_CONTENT_STATUSES, type PromoContentItem, type PromoContentStatus } from '../../types/promo'
import { promoContentTone, promoContentTypeIcon, promoContentTypeLabel } from '../../lib/statusTone'
import { formatDate, dateInputValue, parseDateInputValue } from '../../lib/dates'

const CONTENT_STATUS_LABEL: Record<PromoContentStatus, string> = {
  idea: 'Idée',
  'in-progress': 'En cours',
  review: 'À valider',
  scheduled: 'Programmé',
  published: 'Publié',
}

export function ContentItemRow({
  item,
  shareWithEmails,
  onRename,
  onStatusChange,
  onAttachDrive,
  onRemoveDrive,
  onPublishDateChange,
}: {
  item: PromoContentItem
  shareWithEmails: string[]
  onRename: (title: string) => void
  onStatusChange: (status: PromoContentStatus) => void
  onAttachDrive: (url: string) => void
  onRemoveDrive: (url: string) => void
  onPublishDateChange: (date: number | null) => void
}) {
  const [editingDate, setEditingDate] = useState(false)
  const [filesOpen, setFilesOpen] = useState(false)

  const subtitle = [
    promoContentTypeLabel[item.type],
    item.publishDate != null ? formatDate(item.publishDate) : 'sans date',
    item.driveLinks.length > 0 ? `${item.driveLinks.length} fichier${item.driveLinks.length > 1 ? 's' : ''}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="flex items-center gap-2.5 rounded-md border border-zinc-200 p-2 dark:border-zinc-800">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-sm dark:bg-zinc-800">
        {promoContentTypeIcon[item.type]}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-zinc-900 dark:text-zinc-100">
          <EditableText value={item.title} onSave={onRename} />
        </p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-500">{subtitle}</p>
      </div>

      <StatusPillSelect
        value={item.status}
        options={PROMO_CONTENT_STATUSES}
        labelFor={(s) => CONTENT_STATUS_LABEL[s]}
        toneFor={(s) => promoContentTone[s]}
        onChange={onStatusChange}
      />

      {editingDate ? (
        <input
          autoFocus
          type="date"
          value={dateInputValue(item.publishDate)}
          onChange={(e) => onPublishDateChange(parseDateInputValue(e.target.value))}
          onBlur={() => setEditingDate(false)}
          className="w-[132px] shrink-0 rounded-md border border-zinc-300 bg-transparent px-1.5 py-1 text-xs dark:border-zinc-700"
        />
      ) : (
        <button
          onClick={() => setEditingDate(true)}
          title="Date de publication"
          aria-label="Modifier la date de publication"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-300 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          📅
        </button>
      )}

      {item.driveLinks.length > 0 && (
        <div className="relative shrink-0">
          <button
            onClick={() => setFilesOpen((v) => !v)}
            title={`${item.driveLinks.length} fichier(s) attaché(s)`}
            aria-label="Voir les fichiers attachés"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-300 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {item.driveLinks.length}
          </button>
          {filesOpen && (
            <div
              className="absolute right-0 top-full z-10 mt-1 w-48 rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-[#151b23]"
              onMouseLeave={() => setFilesOpen(false)}
            >
              {item.driveLinks.map((url, i) => (
                <div key={i} className="flex items-center gap-1 px-1.5 py-0.5 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 flex-1 truncate rounded px-1.5 py-1 text-xs text-blue-600 dark:text-blue-400"
                  >
                    📎 Fichier {item.driveLinks.length > 1 ? i + 1 : ''}
                  </a>
                  <button
                    onClick={() => onRemoveDrive(url)}
                    title="Retirer ce fichier"
                    aria-label="Retirer ce fichier"
                    className="shrink-0 rounded px-1.5 py-1 text-xs text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <DriveAttachButton compact shareWithEmails={shareWithEmails} onPicked={(file) => onAttachDrive(file.url)} />
    </div>
  )
}
