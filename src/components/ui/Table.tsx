import type { ReactNode } from 'react'

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  )
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
      <tr>{children}</tr>
    </thead>
  )
}

export function TableRow({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className={
        'border-b border-zinc-100 last:border-0 dark:border-zinc-900' +
        (onClick ? ' cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/60' : '')
      }
    >
      {children}
    </tr>
  )
}

export function TableCell({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={'px-4 py-3 align-middle ' + (className ?? '')}>{children}</td>
}

export function TableHeaderCell({ children }: { children?: ReactNode }) {
  return <th className="px-4 py-2 font-medium">{children}</th>
}
