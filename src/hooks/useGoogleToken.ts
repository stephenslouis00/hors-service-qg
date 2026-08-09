import { useCallback, useState } from 'react'
import { requestGoogleAccessToken } from '../lib/googleAuthToken'
import { useAuth } from '../contexts/AuthContext'

interface CachedToken {
  accessToken: string
  scope: string
  expiresAt: number
}

// Module-level cache: the token is shared across every component that needs
// it for the current tab session, but is never written to storage.
const tokenCache = new Map<string, CachedToken>()

const TOKEN_LIFETIME_MS = 55 * 60 * 1000 // Google access tokens last ~1h; refresh a bit early.

function cacheKey(scopes: string[]) {
  return [...scopes].sort().join(' ')
}

/**
 * Returns a getter for a Google OAuth access token covering the given scopes.
 * Requests an interactive consent popup only when there's no valid cached
 * token, so repeated calls (e.g. syncing several events) don't re-prompt.
 */
export function useGoogleToken(scopes: string[]) {
  const { user } = useAuth()
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const key = cacheKey(scopes)

  const getToken = useCallback(
    async (forceReconnect = false): Promise<string> => {
      const cached = tokenCache.get(key)
      if (!forceReconnect && cached && cached.expiresAt > Date.now()) {
        return cached.accessToken
      }

      setConnecting(true)
      setError(null)
      try {
        const accessToken = await requestGoogleAccessToken(scopes, user?.email ?? undefined)
        tokenCache.set(key, { accessToken, scope: key, expiresAt: Date.now() + TOKEN_LIFETIME_MS })
        return accessToken
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not connect to Google.'
        setError(message)
        throw err
      } finally {
        setConnecting(false)
      }
    },
    [key, scopes, user?.email],
  )

  const invalidate = useCallback(() => {
    tokenCache.delete(key)
  }, [key])

  return { getToken, invalidate, connecting, error }
}
