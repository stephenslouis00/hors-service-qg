import { openGmailCompose } from '../../lib/gmailLink'
import { Avatar } from '../ui/Avatar'
import { Card } from '../ui/Card'

export function ContactCard({
  name,
  subtitle,
  email,
  tags,
  onClick,
}: {
  name: string
  subtitle?: string
  email: string
  tags?: string[]
  onClick?: () => void
}) {
  return (
    <Card className="flex items-center justify-between gap-3 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={name} size={32} />
        <div className="min-w-0">
          <button
            onClick={onClick}
            className="truncate text-left text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-100"
          >
            {name}
          </button>
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
      </div>
      <button
        onClick={() => openGmailCompose(email)}
        title={`Écrire à ${email} sur Gmail`}
        className="shrink-0 rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        ✉ Email
      </button>
    </Card>
  )
}
