import { useCallback, useEffect, useState } from 'react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { deleteSiteScore, loadSiteScores, type SiteConnection, type SiteScore } from '../../lib/siteRepo'

/** Unlike the other tabs, this acts on the live leaderboard straight away: there's nothing to publish. */
export function LeaderboardSection({ connection }: { connection: SiteConnection }) {
  const [scores, setScores] = useState<SiteScore[] | null>(null)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    setError('')
    try {
      setScores(await loadSiteScores())
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Classement indisponible.')
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function remove(score: SiteScore) {
    if (!window.confirm(`Supprimer définitivement « ${score.name} » (${score.score} points) du classement ?`)) return
    setDeleting(score.id)
    setError('')
    try {
      await deleteSiteScore(connection, score.id)
      setScores((current) => current?.filter((other) => other.id !== score.id) ?? null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Suppression impossible.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="max-w-xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Les 100 meilleurs scores. Une suppression s’applique tout de suite, sans « Publier ».</p>
        <Button onClick={() => void refresh()}>Actualiser</Button>
      </div>
      {error && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {scores?.length === 0 && <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">Aucun score pour l’instant.</p>}
      {scores && scores.length > 0 && (
        <Card className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {scores.map((score, index) => (
            <div key={score.id} className="flex items-center gap-3 px-4 py-2 text-sm">
              <span className="w-6 shrink-0 text-right text-zinc-500 dark:text-zinc-400">{index + 1}</span>
              <span className="min-w-0 flex-1 truncate font-medium">{score.name}</span>
              <span className="shrink-0 tabular-nums">{score.score}</span>
              <Button variant="ghost" disabled={deleting === score.id} onClick={() => void remove(score)} aria-label={`Supprimer ${score.name}`}>
                Supprimer
              </Button>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
