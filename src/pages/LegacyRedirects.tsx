import { Navigate, useParams } from 'react-router-dom'

// Production + Promotion merged into a single "Sorties" section — these keep
// old bookmarks/PWA shortcuts and any lingering hash links working.
export function LegacySongRedirect() {
  const { songId } = useParams<{ songId: string }>()
  return <Navigate to={`/releases/songs/${songId}`} replace />
}

export function LegacyReleaseRedirect() {
  const { releaseId } = useParams<{ releaseId: string }>()
  return <Navigate to={`/releases/projects/${releaseId}`} replace />
}
