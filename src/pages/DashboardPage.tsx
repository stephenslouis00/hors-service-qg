import { Link } from 'react-router-dom'
import { useDashboard } from '../hooks/useDashboard'
import { Card, CardHeader } from '../components/ui/Card'
import { StatusPill } from '../components/ui/StatusPill'
import { StatTile } from '../components/ui/StatTile'
import { Avatar } from '../components/ui/Avatar'
import { EmptyState } from '../components/ui/EmptyState'
import { ReleaseProgressLine } from '../components/releases/ReleaseProgressLine'
import { formatDate, formatRelative } from '../lib/dates'

const quickLinks = [
  { url: import.meta.env.VITE_AWAL_URL as string | undefined, icon: '💿', label: 'AWAL' },
  { url: import.meta.env.VITE_BAND_DRIVE_FOLDER_URL as string | undefined, icon: '📁', label: 'Drive' },
  { url: import.meta.env.VITE_SPOTIFY_FOR_ARTISTS_URL as string | undefined, icon: '🎧', label: 'Spotify for Artists' },
  { url: import.meta.env.VITE_META_BUSINESS_SUITE_URL as string | undefined, icon: '📊', label: 'Meta Business Suite' },
  { url: import.meta.env.VITE_INSTAGRAM_URL as string | undefined, icon: '📸', label: 'Instagram' },
  { url: import.meta.env.VITE_TIKTOK_URL as string | undefined, icon: '🎵', label: 'TikTok' },
  { url: import.meta.env.VITE_LINKTREE_URL as string | undefined, icon: '🔗', label: 'Linktree' },
].filter((link): link is { url: string; icon: string; label: string } => Boolean(link.url))

export function DashboardPage() {
  const { upcoming, activity, stats, nextRelease, loading } = useDashboard()

  return (
    <div className="p-4 md:p-6">
      {nextRelease && <ReleaseProgressLine releaseId={nextRelease.id} title={nextRelease.title} />}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Tableau de bord</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Ce qui arrive et ce qui vient de se passer.</p>
        </div>
        {quickLinks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {quickLinks.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {link.icon} {link.label}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon="🎵" value={stats.releasesInProgress} label="Sorties en cours" tone="blue" to="/releases/projects" />
        <StatTile icon="📋" value={stats.sacemPending} label="SACEM en attente" tone="yellow" to="/releases/projects" />
        <StatTile icon="🎤" value={stats.upcomingShows} label="Concerts à venir" tone="green" to="/calendar" />
        <StatTile icon="💿" value={stats.upcomingReleases} label="Sorties à venir" tone="purple" to="/calendar" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">À venir</h2>
          </CardHeader>
          {!loading && upcoming.length === 0 && (
            <div className="p-4">
              <EmptyState title="Rien à l'horizon" description="Aucune date programmée pour le moment." />
            </div>
          )}
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {upcoming.slice(0, 5).map((item) => (
              <li key={item.id}>
                <Link to={item.to} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/60">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-zinc-900 dark:text-zinc-100">{item.title}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">{formatDate(item.date)}</p>
                  </div>
                  <StatusPill label={item.category} tone={item.tone} />
                </Link>
              </li>
            ))}
          </ul>
          {upcoming.length > 0 && (
            <Link
              to="/calendar"
              className="block border-t border-zinc-100 px-4 py-2.5 text-center text-xs font-medium text-blue-600 hover:bg-zinc-50 dark:border-zinc-900 dark:text-blue-400 dark:hover:bg-zinc-900/60"
            >
              Voir tout le calendrier →
            </Link>
          )}
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Activité récente</h2>
          </CardHeader>
          {!loading && activity.length === 0 && (
            <div className="p-4">
              <EmptyState title="Aucune activité" description="Les dernières actions du groupe apparaîtront ici." />
            </div>
          )}
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {activity.map((item) => (
              <li key={item.id}>
                <Link to={item.to} className="flex items-start gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/60">
                  <Avatar name={item.actorEmail} size={24} />
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{item.actorEmail}</span>{' '}
                      {item.description}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">{formatRelative(item.at)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
