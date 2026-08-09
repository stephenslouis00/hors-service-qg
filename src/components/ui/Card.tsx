import { forwardRef, type CSSProperties, type ReactNode } from 'react'
import clsx from 'clsx'

export const Card = forwardRef<HTMLDivElement, { children: ReactNode; className?: string; style?: CSSProperties }>(
  function Card({ children, className, style }, ref) {
    return (
      <div
        ref={ref}
        style={style}
        className={clsx(
          'rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0d1117]',
          className,
        )}
      >
        {children}
      </div>
    )
  },
)

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        'flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800',
        className,
      )}
    >
      {children}
    </div>
  )
}
