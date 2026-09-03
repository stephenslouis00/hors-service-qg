import { Outlet } from 'react-router-dom'
import { Tabs } from '../components/ui/Tabs'

const items = [
  { to: '/releases/projects', label: 'Projets' },
  { to: '/releases/contacts', label: 'Contacts' },
]

export function ReleasesLayout() {
  return (
    <div>
      <div className="p-4 pb-0 md:p-6 md:pb-0">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Sorties</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Chaque morceau ou projet, de la production à la promotion, au même endroit.
        </p>
      </div>
      <div className="mt-4">
        <Tabs items={items} />
      </div>
      <div className="p-4 md:p-6">
        <Outlet />
      </div>
    </div>
  )
}
