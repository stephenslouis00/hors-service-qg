import { useState, type ReactNode } from 'react'
import { EditableTextarea } from '../ui/EditableTextarea'
import { EditableLink } from '../ui/EditableLink'
import { DriveAttachButton } from '../documents/DriveAttachButton'
import { Button } from '../ui/Button'
import { formatDate } from '../../lib/dates'
import type { PressKit, Release } from '../../types/promo'

const EMPTY_PRESS_KIT: PressKit = {
  bio: '',
  story: '',
  genreTags: '',
  quote: '',
  credits: '',
  priorPress: '',
  socials: '',
  contact: '',
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
      {children}
    </div>
  )
}

export function PressKitSection({
  release,
  shareWithEmails,
  onUpdate,
}: {
  release: Release
  shareWithEmails: string[]
  onUpdate: (data: Partial<Release>) => void
}) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const pressKit = release.pressKit ?? EMPTY_PRESS_KIT

  function setField<K extends keyof PressKit>(field: K, value: PressKit[K]) {
    onUpdate({ pressKit: { ...pressKit, [field]: value } })
  }

  async function copyAsText() {
    const lines = [
      release.title,
      release.releaseDate ? `Sortie : ${formatDate(release.releaseDate)}` : null,
      pressKit.genreTags ? `Genre / ambiance : ${pressKit.genreTags}` : null,
      pressKit.story ? `\n${pressKit.story}` : null,
      pressKit.bio ? `\nBio :\n${pressKit.bio}` : null,
      pressKit.quote ? `\nCitation : « ${pressKit.quote} »` : null,
      pressKit.credits ? `\nCrédits :\n${pressKit.credits}` : null,
      pressKit.priorPress ? `\nPresse antérieure :\n${pressKit.priorPress}` : null,
      pressKit.socials ? `\nRéseaux / streaming :\n${pressKit.socials}` : null,
      pressKit.contact ? `\nContact : ${pressKit.contact}` : null,
      pressKit.presaveUrl ? `\nPre-save : ${pressKit.presaveUrl}` : null,
      pressKit.lyricVideoUrl ? `Lyric video : ${pressKit.lyricVideoUrl}` : null,
    ]
      .filter((line) => line != null)
      .join('\n')
    try {
      await navigator.clipboard.writeText(lines)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be blocked (permissions, insecure context) — not worth surfacing an error for.
    }
  }

  return (
    <div>
      <div className="mt-6 mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Dossier de presse (EPK)</h2>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-xs text-blue-600 hover:underline dark:text-blue-400"
        >
          {open ? 'Réduire' : 'Afficher'}
        </button>
      </div>

      {open && (
        <div className="space-y-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-2">
            <DriveAttachButton
              label={release.coverImageDriveUrl ? '↻ Remplacer la cover' : '📎 Attacher la cover'}
              shareWithEmails={shareWithEmails}
              onPicked={(file) => onUpdate({ coverImageDriveUrl: file.url })}
            />
            <DriveAttachButton
              label={pressKit.pressShotUrl ? '↻ Remplacer la photo presse' : '📎 Attacher une photo presse'}
              shareWithEmails={shareWithEmails}
              onPicked={(file) => setField('pressShotUrl', file.url)}
            />
            <Button onClick={copyAsText}>{copied ? '✓ Copié' : '📋 Copier en texte'}</Button>
          </div>

          <Field label="Bio">
            <EditableTextarea value={pressKit.bio} onSave={(v) => setField('bio', v)} placeholder="Bio de l'artiste" rows={4} />
          </Field>

          <Field label="Histoire du morceau">
            <EditableTextarea
              value={pressKit.story}
              onSave={(v) => setField('story', v)}
              placeholder="En une ligne ou deux"
              rows={2}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Genre / ambiance">
              <EditableTextarea value={pressKit.genreTags} onSave={(v) => setField('genreTags', v)} placeholder="Ex. pop-rock, énergique" rows={1} />
            </Field>
            <Field label="Contact">
              <EditableTextarea value={pressKit.contact} onSave={(v) => setField('contact', v)} placeholder="Nom, email, téléphone" rows={1} />
            </Field>
          </div>

          <Field label="Citation sur le morceau">
            <EditableTextarea value={pressKit.quote} onSave={(v) => setField('quote', v)} placeholder="Une citation du groupe" rows={1} />
          </Field>

          <Field label="Réseaux sociaux et streaming">
            <EditableTextarea value={pressKit.socials} onSave={(v) => setField('socials', v)} placeholder="Handles, liens" rows={2} />
          </Field>

          <Field label="Crédits">
            <EditableTextarea value={pressKit.credits} onSave={(v) => setField('credits', v)} placeholder="Composition, prod, mix, master..." rows={3} />
          </Field>

          <Field label="Presse antérieure">
            <EditableTextarea
              value={pressKit.priorPress}
              onSave={(v) => setField('priorPress', v)}
              placeholder="Articles, playlists, passages radio précédents"
              rows={2}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Lien pre-save / sortie">
              <EditableLink
                url={pressKit.presaveUrl}
                onSave={(url) => setField('presaveUrl', url)}
                icon="🔗"
                linkLabel="Lien pre-save"
                emptyLabel="Aucun lien"
              />
            </Field>
            <Field label="Lyric video / teaser">
              <EditableLink
                url={pressKit.lyricVideoUrl}
                onSave={(url) => setField('lyricVideoUrl', url)}
                icon="🎬"
                linkLabel="Lyric video"
                emptyLabel="Aucun lien"
              />
            </Field>
          </div>
        </div>
      )}
    </div>
  )
}
