import type { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'

type Variant = 'primary' | 'default' | 'danger' | 'ghost'

const variantClasses: Record<Variant, string> = {
  primary: 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700',
  default:
    'bg-zinc-50 text-zinc-900 border-zinc-300 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-700',
  danger: 'bg-red-600 text-white border-red-700 hover:bg-red-700',
  ghost:
    'bg-transparent text-zinc-700 border-transparent hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
}

export function Button({
  variant = 'default',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
}
