import { useEffect, useState } from 'react'

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

function isStandalone(): boolean {
  return (window.navigator as { standalone?: boolean }).standalone === true
}

export function PwaInstallBanner() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('hs-install-banner-dismissed') === '1')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(isIos() && !isStandalone())
  }, [])

  if (!visible || dismissed) return null

  function dismiss() {
    localStorage.setItem('hs-install-banner-dismissed', '1')
    setDismissed(true)
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
      <span>
        Installe Hors Service sur ton iPhone : appuie sur <strong>Partager</strong> puis{' '}
        <strong>Sur l'écran d'accueil</strong>.
      </span>
      <button onClick={dismiss} className="shrink-0 font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        Fermer
      </button>
    </div>
  )
}
