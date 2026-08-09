import { Outlet } from 'react-router-dom'
import { Tabs } from '../components/ui/Tabs'

const items = [
  { to: '/promotion/projects', label: 'Projets' },
  { to: '/promotion/contacts', label: 'Contacts' },
]

export function PromotionLayout() {
  return (
    <div>
      <div className="p-4 pb-0 md:p-6 md:pb-0">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Promotion</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Projets et contacts promo.</p>
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
