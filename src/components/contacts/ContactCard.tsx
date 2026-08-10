import type { ReactNode } from 'react'
import { openGmailCompose } from '../../lib/gmailLink'
import { Avatar } from '../ui/Avatar'
import { EditableText } from '../ui/EditableText'
import { MailIcon } from '../layout/icons'

export function ContactCard({
  name,
  subtitle,
  email,
  tags,
  extra,
  onRename,
  onDelete,
}: {
  name: string
  subtitle?: string
  email: string
  tags?: string[]
  /** Extra control shown before the email button, e.g. a role pill. */
  extra?: ReactNode
  onRename: (name: string) => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-zinc-200 p-2.5 dark:border-zinc-800">
      <Avatar name={name} size={32} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
          <EditableText value={name} onSave={onRename} />
        </p>
        {subtitle && <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
        {tags && tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      {extra}
      <button
        onClick={() => openGmailCompose(email)}
        title={`Écrire à ${email} sur Gmail`}
        aria-label={`Écrire à ${email} sur Gmail`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-300 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <MailIcon />
      </button>
      <button
        onClick={() => {
          if (confirm(`Supprimer « ${name} » ?`)) onDelete()
        }}
        className="shrink-0 text-xs text-red-600 hover:underline dark:text-red-400"
      >
        Retirer
      </button>
    </div>
  )
}
