import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { PwaInstallBanner } from '../PwaInstallBanner'

export function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex h-screen flex-col">
      <PwaInstallBanner />
      <TopBar onMenuClick={() => setMobileNavOpen((v) => !v)} />
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-56 shrink-0 border-r border-zinc-200 dark:border-zinc-800 md:block">
          <Sidebar />
        </aside>

        {mobileNavOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileNavOpen(false)} />
            <div className="relative z-10 w-64 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0d1117]">
              <Sidebar onNavigate={() => setMobileNavOpen(false)} />
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 overflow-y-auto bg-white dark:bg-[#0d1117]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
