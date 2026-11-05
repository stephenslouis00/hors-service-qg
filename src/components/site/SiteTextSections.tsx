import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { SectionHeading } from '../ui/SectionHeading'
import type { SiteContact, SiteData, SiteMessage, SiteNotice, SiteSender } from '../../types/site'
import { Field, RemoveButton, SongSelect, inputClass, type ChangeSite as Change } from './fields'

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

      <div className="mb-2 mt-8 flex items-center justify-between gap-3">
        <SectionHeading className="">Contacts du téléphone</SectionHeading>
        <Button onClick={() => change((current) => ({ ...current, contacts: [...current.contacts, { name: '', sub: '', line: '', track: current.featured }] }))}>+ Ajouter un contact</Button>
      </div>
      <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">Quand on appelle un contact, il dit sa phrase, puis sa chanson démarre.</p>
      <div className="space-y-2">
        {data.contacts.map((contact, index) => {
          const updateContact = (fields: Partial<SiteContact>) =>
            change((current) => ({ ...current, contacts: current.contacts.map((other, i) => (i === index ? { ...other, ...fields } : other)) }))
          return (
            <Card key={index} className="space-y-2 p-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Nom">
                  <input className={inputClass} value={contact.name} onChange={(event) => updateContact({ name: event.target.value })} />
                </Field>
                <Field label="Détail">
                  <input className={inputClass} value={contact.sub} onChange={(event) => updateContact({ sub: event.target.value })} />
                </Field>
              </div>
              <Field label="Ce que dit le contact">
                <textarea className={inputClass} rows={2} value={contact.line} onChange={(event) => updateContact({ line: event.target.value })} />
              </Field>
              <Field label="Chanson">
                <SongSelect data={data} value={contact.track} onChange={(track) => updateContact({ track })} />
              </Field>
              <RemoveButton onClick={() => change((current) => ({ ...current, contacts: current.contacts.filter((_, i) => i !== index) }))} />
            </Card>
          )
        })}
      </div>
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

export function TextsSection({ data, change }: { data: SiteData; change: Change }) {
  const codes = Object.entries(data.codes)
  const setCodes = (next: [string, { text: string }][]) => change((current) => ({ ...current, codes: Object.fromEntries(next) }))
  const updatePart = (index: number, title: string, lines: string[]) =>
    change((current) => ({ ...current, legal: current.legal.map((part, i) => (i === index ? { title, lines } : part)) }))
  return (
    <div className="max-w-3xl">
      <SectionHeading className="mb-2">Le groupe</SectionHeading>
      <Card className="space-y-3 p-4">
        <Field label="Bio" hint="Une ligne par paragraphe.">
          <textarea
            className={inputClass}
            rows={5}
            value={data.bio.join('\n')}
            onChange={(event) => change((current) => ({ ...current, bio: event.target.value.split('\n') }))}
          />
        </Field>
        <Field label="Adresse mail de booking">
          <input className={inputClass} type="email" value={data.booking} onChange={(event) => change((current) => ({ ...current, booking: event.target.value }))} />
        </Field>
      </Card>

      <div className="mb-2 mt-8 flex items-center justify-between gap-3">
        <SectionHeading className="">Numéros secrets</SectionHeading>
        <Button onClick={() => setCodes([...codes, ['', { text: '' }]])}>+ Ajouter un numéro</Button>
      </div>
      <div className="space-y-2">
        {codes.map(([code, value], index) => (
          <Card key={index} className="grid gap-2 p-4 sm:grid-cols-[8rem_1fr_auto] sm:items-end">
            <Field label="Numéro">
              <input className={inputClass} inputMode="numeric" value={code} onChange={(event) => setCodes(codes.map((entry, i) => (i === index ? [event.target.value, entry[1]] : entry)))} />
            </Field>
            <Field label="Ce qui s’affiche">
              <input className={inputClass} value={value.text} onChange={(event) => setCodes(codes.map((entry, i) => (i === index ? [entry[0], { ...entry[1], text: event.target.value }] : entry)))} />
            </Field>
            <RemoveButton onClick={() => setCodes(codes.filter((_, i) => i !== index))} />
          </Card>
        ))}
      </div>

      <SectionHeading className="mb-2 mt-8">Mentions légales</SectionHeading>
      <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">Change ces informations seulement si la situation de l’association change. Une ligne par paragraphe.</p>
      <div className="space-y-2">
        {data.legal.map((part, index) => (
          <Card key={index} className="space-y-2 p-4">
            <Field label="Titre">
              <input className={inputClass} value={part.title} onChange={(event) => updatePart(index, event.target.value, part.lines)} />
            </Field>
            <Field label="Texte">
              <textarea className={inputClass} rows={Math.max(3, part.lines.length + 1)} value={part.lines.join('\n')} onChange={(event) => updatePart(index, part.title, event.target.value.split('\n'))} />
            </Field>
          </Card>
        ))}
      </div>
    </div>
  )
}
