declare global {
  interface Window {
    google: any
  }
}

let gisLoaded: Promise<void> | null = null

function loadGis(): Promise<void> {
  if (!gisLoaded) {
    gisLoaded = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'))
      document.body.appendChild(script)
    })
  }
  return gisLoaded
}

/**
 * Gets a Google OAuth access token for the given scopes via Google Identity
 * Services' token client — separate from Firebase Auth's own sign-in popup.
 * Mixing the two (re-running signInWithPopup for incremental scopes) hits a
 * known Firebase/Chrome popup conflict (COOP-related "Database is
 * closing/hidden" errors), so authorization is kept fully independent from
 * identity here.
 */
export async function requestGoogleAccessToken(scopes: string[], loginHint?: string): Promise<string> {
  await loadGis()
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new Error('VITE_GOOGLE_CLIENT_ID manquant dans .env.local')
  }

  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: scopes.join(' '),
      hint: loginHint,
      callback: (response: { access_token?: string; error?: string }) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error ?? 'Aucun token reçu de Google'))
          return
        }
        resolve(response.access_token)
      },
      error_callback: (error: { type?: string }) => {
        reject(new Error(error?.type ?? 'Échec de la demande Google'))
      },
    })
    client.requestAccessToken()
  })
}
