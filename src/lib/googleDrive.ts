declare global {
  interface Window {
    gapi: any
    google: any
  }
}

let pickerApiLoaded: Promise<void> | null = null

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.body.appendChild(script)
  })
}

function loadPickerApi(): Promise<void> {
  if (!pickerApiLoaded) {
    pickerApiLoaded = loadScript('https://apis.google.com/js/api.js').then(
      () =>
        new Promise((resolve) => {
          window.gapi.load('picker', () => resolve())
        }),
    )
  }
  return pickerApiLoaded
}

export interface DrivePickedFile {
  id: string
  name: string
  url: string
  mimeType: string
}

export async function openDrivePicker({
  accessToken,
  onPicked,
}: {
  accessToken: string
  onPicked: (file: DrivePickedFile) => void
}): Promise<void> {
  const apiKey = import.meta.env.VITE_GOOGLE_PICKER_API_KEY
  await loadPickerApi()

  const view = new window.google.picker.DocsView().setIncludeFolders(true).setSelectFolderEnabled(false)
  const uploadView = new window.google.picker.DocsUploadView()

  const picker = new window.google.picker.PickerBuilder()
    .addView(view)
    .addView(uploadView)
    .setOAuthToken(accessToken)
    .setDeveloperKey(apiKey)
    .setCallback((data: any) => {
      if (data.action === window.google.picker.Action.PICKED) {
        const doc = data.docs[0]
        // Build the link from the file id rather than trusting `doc.url`, which the
        // upload view sometimes leaves empty/unreliable.
        onPicked({ id: doc.id, name: doc.name, url: `https://drive.google.com/file/d/${doc.id}/view`, mimeType: doc.mimeType })
      }
    })
    .build()

  picker.setVisible(true)
}

/**
 * Picking/uploading a file only grants the picker's own account access to it —
 * it does NOT share it with anyone else. Since the app's allowlist is our
 * source of truth for "who's in the band", explicitly share every picked file
 * with each allowlisted email so nobody hits "access denied" when they click
 * a link from inside the app. Requires the drive.file scope, which covers
 * managing permissions on files the app opened/created via the Picker.
 */
export async function shareFileWithEmails(accessToken: string, fileId: string, emails: string[]): Promise<void> {
  await Promise.all(
    emails.map(async (email) => {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?sendNotificationEmail=false`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: 'reader', type: 'user', emailAddress: email }),
        },
      )
      if (!response.ok && response.status !== 409) {
        // Best-effort: a single failed share (e.g. already shared) shouldn't block the others.
        console.warn(`Impossible de partager le fichier avec ${email} (${response.status})`)
      }
    }),
  )
}
