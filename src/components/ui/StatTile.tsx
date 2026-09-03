import { Link } from 'react-router-dom'
import clsx from 'clsx'
import type { ReactNode } from 'react'
import type { Tone } from '../../lib/statusTone'

const toneClasses: Record<Tone, string> = {
  gray: 'text-zinc-700 dark:text-zinc-300',
  blue: 'text-blue-600 dark:text-blue-400',
  yellow: 'text-amber-600 dark:text-amber-400',
  green: 'text-green-600 dark:text-green-400',
  red: 'text-red-600 dark:text-red-400',
  purple: 'text-purple-600 dark:text-purple-400',
}

export function StatTile({
  icon,
  value,
  label,
  tone = 'gray',
  to,
}: {
  icon: ReactNode
  value: number
  label: string
  tone?: Tone
  to?: string
}) {
  const content = (
    <>
      <div className="flex items-center gap-2">
        <span className={clsx('shrink-0 [&>svg]:h-5 [&>svg]:w-5', toneClasses[tone])}>{icon}</span>
        <span className={clsx('font-mono text-2xl font-semibold', toneClasses[tone])}>{value}</span>
      </div>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
    </>
  )

  const className = 'rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-[#0d1117]'

  if (to) {
    return (
      <Link to={to} className={clsx(className, 'block hover:bg-zinc-50 dark:hover:bg-zinc-900/60')}>
        {content}
      </Link>
    )
  }

  return <div className={className}>{content}</div>
}
