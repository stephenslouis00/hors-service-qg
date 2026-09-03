import type { ReactNode } from 'react'

/** Same visual language as a checklist section card's header — one consistent style for every section title in the app. */
export function SectionHeading({ children, className = 'mt-6 mb-2' }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500 ${className}`}>
      {children}
    </h2>
  )
}
