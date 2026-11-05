import type { ReactNode } from 'react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { SectionHeading } from '../ui/SectionHeading'
import type { SiteData, SiteMessage, SiteNotice, SiteSender } from '../../types/site'

const inputClass =
  'w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700'

type Change = (update: (data: SiteData) => SiteData) => void

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>}
    </label>
  )
}

function RemoveButton({ onClick, label = 'Supprimer' }: { onClick: () => void; label?: string }) {
  return (
    <Button variant="ghost" onClick={onClick}>
      {label}
    </Button>
  )
}

function SongSelect({ data, value, allowNone, onChange }: { data: SiteData; value: string; allowNone?: boolean; onChange: (track: string) => void }) {
  return (
    <select className={inputClass} value={value} onChange={(event) => onChange(event.target.value)}>
      {allowNone && <option value="">Aucune</option>}
      {data.releases.map((release) => (
        <option key={release.id} value={release.id}>
          {release.title || 'Nouveau morceau'}
        </option>
      ))}
    </select>
  )
}

export function CallSection({ data, change }: { data: SiteData; change: Change }) {
  const update = (fields: Partial<SiteData['call']>) => change((current) => ({ ...current, call: { ...current.call, ...fields } }))
  return (
    <div className="max-w-xl">
      <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">L’appel qui fait vibrer le téléphone fermé, puis sonne une fois ouvert.</p>
      <Card className="space-y-3 p-4">
        <Field label="Qui appelle" hint={`Sur le téléphone fermé : « ${data.call.name} appelle… »`}>
          <input className={inputClass} value={data.call.name} onChange={(event) => update({ name: event.target.value })} />
        </Field>
        <Field label="Message en dessous">
          <input className={inputClass} value={data.call.note} onChange={(event) => update({ note: event.target.value })} />
        </Field>
        <Field label="Texte de l’appel">
          <input className={inputClass} value={data.call.label} onChange={(event) => update({ label: event.target.value })} />
        </Field>
        <Field label="Invitation sur le téléphone fermé">
          <input className={inputClass} value={data.call.hint} onChange={(event) => update({ hint: event.target.value })} />
        </Field>
        <Field label="Chanson quand on répond">
          <SongSelect data={data} value={data.call.track} onChange={(track) => update({ track })} />
        </Field>
      </Card>
    </div>
  )
}

function SenderCard({ data, sender, change, index }: { data: SiteData; sender: SiteSender; change: Change; index: number }) {
  const updateSender = (fields: Partial<SiteSender>) =>
    change((current) => ({ ...current, inboxSenders: current.inboxSenders.map((other, i) => (i === index ? { ...other, ...fields } : other)) }))
  const updateMessage = (messageIndex: number, fields: Partial<SiteMessage>) =>
    updateSender({ messages: sender.messages.map((message, i) => (i === messageIndex ? { ...message, ...fields } : message)) })
  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Field label="Nom">
            <input className={inputClass} value={sender.from} onChange={(event) => updateSender({ from: event.target.value })} />
          </Field>
        </div>
        <RemoveButton
          label="Supprimer la personne"
          onClick={() => change((current) => ({ ...current, inboxSenders: current.inboxSenders.filter((_, i) => i !== index) }))}
        />
      </div>
      {sender.messages.map((message, messageIndex) => (
        <div key={messageIndex} className="space-y-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
          <Field label="Message">
            <textarea className={inputClass} rows={2} value={message.text} onChange={(event) => updateMessage(messageIndex, { text: event.target.value })} />
          </Field>
          <div className="grid grid-cols-[6rem_1fr_auto] items-end gap-2">
            <Field label="Heure">
              <input className={inputClass} placeholder="09:30" value={message.time} onChange={(event) => updateMessage(messageIndex, { time: event.target.value })} />
            </Field>
            <Field label="Chanson">
              <SongSelect data={data} allowNone value={message.track ?? ''} onChange={(track) => updateMessage(messageIndex, { track })} />
            </Field>
            <RemoveButton onClick={() => updateSender({ messages: sender.messages.filter((_, i) => i !== messageIndex) })} />
          </div>
        </div>
      ))}
      <Button onClick={() => updateSender({ messages: [...sender.messages, { time: '12:00', text: '', track: data.featured }] })}>+ Ajouter un message</Button>
    </Card>
  )
}

/** An editable list of short texts, one per line in the phone's story. */
function TextList({ items, addLabel, onChange }: { items: string[]; addLabel: string; onChange: (items: string[]) => void }) {
  return (
    <Card className="space-y-2 p-4">
      {items.map((text, index) => (
        <div key={index} className="flex items-start gap-2">
          <textarea
            className={inputClass}
            rows={2}
            aria-label={`Texte ${index + 1}`}
            value={text}
            onChange={(event) => onChange(items.map((other, i) => (i === index ? event.target.value : other)))}
          />
          <RemoveButton onClick={() => onChange(items.filter((_, i) => i !== index))} />
        </div>
      ))}
      <Button onClick={() => onChange([...items, ''])}>{addLabel}</Button>
    </Card>
  )
}

export function MessagesSection({ data, change }: { data: SiteData; change: Change }) {
  const updateNotice = (index: number, fields: Partial<SiteNotice>) =>
    change((current) => ({ ...current, exLost: current.exLost.map((notice, i) => (i === index ? { ...notice, ...fields } : notice)) }))
  return (
    <div className="max-w-3xl">
      <div className="mb-2 flex items-center justify-between gap-3">
        <SectionHeading className="">Messagerie</SectionHeading>
        <Button onClick={() => change((current) => ({ ...current, inboxSenders: [...current.inboxSenders, { from: '', messages: [{ time: '12:00', text: '', track: current.featured }] }] }))}>
          + Ajouter une personne
        </Button>
      </div>
      <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">À chaque visite, le téléphone affiche 1 ou 2 messages au hasard par personne, triés par heure.</p>
      <div className="space-y-3">
        {data.inboxSenders.map((sender, index) => (
          <SenderCard key={index} data={data} sender={sender} change={change} index={index} />
        ))}
      </div>

      <SectionHeading className="mb-2 mt-8">Textos à ton ex</SectionHeading>
      <TextList
        items={data.exMessages}
        addLabel="+ Ajouter un texto"
        onChange={(exMessages) => change((current) => ({ ...current, exMessages }))}
      />

      <SectionHeading className="mb-2 mt-8">Réponse de ton ex</SectionHeading>
      <Card className="p-4">
        <input className={inputClass} aria-label="Réponse de ton ex" value={data.exReply} onChange={(event) => change((current) => ({ ...current, exReply: event.target.value }))} />
      </Card>

      <div className="mb-2 mt-8 flex items-center justify-between gap-3">
        <SectionHeading className="">Notifications après ton ex</SectionHeading>
        <Button onClick={() => change((current) => ({ ...current, exLost: [...current.exLost, { title: '', text: '' }] }))}>+ Ajouter une notification</Button>
      </div>
      <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">Une étape de plus à chaque nouvel essai. La dernière met fin aux essais jusqu’au rechargement de la page.</p>
      <div className="space-y-2">
        {data.exLost.map((notice, index) => (
          <Card key={index} className="space-y-2 p-4">
            <Field label={`Étape ${index + 1} : titre`}>
              <input className={inputClass} value={notice.title} onChange={(event) => updateNotice(index, { title: event.target.value })} />
            </Field>
            <Field label="Texte">
              <textarea className={inputClass} rows={2} value={notice.text} onChange={(event) => updateNotice(index, { text: event.target.value })} />
            </Field>
            <RemoveButton onClick={() => change((current) => ({ ...current, exLost: current.exLost.filter((_, i) => i !== index) }))} />
          </Card>
        ))}
      </div>

      <SectionHeading className="mb-2 mt-8">Fin du jeu</SectionHeading>
      <Card className="mb-2 p-4">
        <Field label="Titre">
          <input className={inputClass} value={data.gameOverTitle} onChange={(event) => change((current) => ({ ...current, gameOverTitle: event.target.value }))} />
        </Field>
      </Card>
      <TextList items={data.gameOver} addLabel="+ Ajouter un message" onChange={(gameOver) => change((current) => ({ ...current, gameOver }))} />
    </div>
  )
}
