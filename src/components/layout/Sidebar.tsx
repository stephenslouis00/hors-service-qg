import { NavLink } from 'react-router-dom'
import { AdminIcon, CalendarIcon, DashboardIcon, LocationIcon, PromotionIcon } from './icons'

const sections = [
  { to: '/dashboard', label: 'Tableau de bord', icon: DashboardIcon, end: true },
  { to: '/releases', label: 'Sorties', icon: PromotionIcon },
  { to: '/booking', label: 'Booking', icon: LocationIcon },
  { to: '/calendar', label: 'Calendrier', icon: CalendarIcon },
  { to: '/administrative', label: 'Administratif', icon: AdminIcon },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex h-full flex-col gap-0.5 p-3">
      {sections.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ' +
            (isActive
              ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
              : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100')
          }
        >
          <Icon className="shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
