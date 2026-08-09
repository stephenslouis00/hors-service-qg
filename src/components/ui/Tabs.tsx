import { NavLink } from 'react-router-dom'

export interface TabItem {
  to: string
  label: string
  end?: boolean
}

export function Tabs({ items }: { items: TabItem[] }) {
  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800">
      <nav className="flex gap-1 px-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              'border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ' +
              (isActive
                ? 'border-orange-500 text-zinc-900 dark:text-zinc-50'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100')
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
