import type { ReactNode } from 'react'
import type { Tone } from '../../lib/statusTone'

const toneClasses: Record<Tone, string> = {
  gray: 'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
  blue: 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  yellow:
    'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  green:
    'bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
  red: 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
  purple:
    'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
}

/** `icon` is the category marker (stable per kind of thing — a release, a concert…); tone stays free to mean status/urgency. */
export function StatusPill({ label, tone, icon }: { label: string; tone: Tone; icon?: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium font-mono ${toneClasses[tone]}`}
    >
      {icon && <span className="shrink-0 [&>svg]:h-3 [&>svg]:w-3">{icon}</span>}
      {label}
    </span>
  )
}
