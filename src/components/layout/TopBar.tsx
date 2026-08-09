import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../hooks/useTheme'
import { Avatar } from '../ui/Avatar'
import { MoonIcon, SunIcon } from './icons'

export function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-[#0d1117]">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 md:hidden"
          aria-label="Menu"
        >
          ☰
        </button>
        <span className="font-mono text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Hors Service
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          aria-label="Changer de thème"
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        {user && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-md p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Avatar name={user.displayName ?? user.email ?? '?'} photoUrl={user.photoURL} />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-full z-10 mt-1 w-48 rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-[#151b23]"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <div className="border-b border-zinc-100 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  {user.email}
                </div>
                <button
                  onClick={() => signOut()}
                  className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
