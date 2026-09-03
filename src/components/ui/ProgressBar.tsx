import type { Tone } from '../../lib/statusTone'

const fillClasses: Record<Tone, string> = {
  gray: 'bg-zinc-400 dark:bg-zinc-600',
  blue: 'bg-blue-600 dark:bg-blue-500',
  yellow: 'bg-amber-500 dark:bg-amber-500',
  green: 'bg-green-600 dark:bg-green-500',
  red: 'bg-red-600 dark:bg-red-500',
  purple: 'bg-purple-600 dark:bg-purple-500',
}

export function ProgressBar({ percent, tone, className = '' }: { percent: number; tone: Tone; className?: string }) {
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800 ${className}`}>
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${fillClasses[tone]}`}
        style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
      />
    </div>
  )
}
