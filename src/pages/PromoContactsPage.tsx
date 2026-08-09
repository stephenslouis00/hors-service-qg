import { useState } from 'react'
import { useCreatePromoContact, usePromoContacts } from '../hooks/usePromoContacts'
import { PROMO_CONTACT_ROLES, type PromoContactRole } from '../types/promo'
import { ContactCard } from '../components/contacts/ContactCard'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'

const roleLabels: Record<PromoContactRole, string> = {
  journalist: 'Journaliste',
  blog: 'Blog',
  'playlist-curator': 'Curateur playlist',
  other: 'Autre',
}

export function PromoContactsPage() {
  const { contacts, loading } = usePromoContacts()
  const createContact = useCreatePromoContact()

  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [org, setOrg] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<PromoContactRole>('journalist')

  async function handleCreate() {
    if (!name.trim() || !email.trim()) return
    await createContact({ name: name.trim(), org: org.trim(), role, email: email.trim() })
    setName('')
    setOrg('')
    setEmail('')
    setShowCreate(false)
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          + Nouveau contact
        </Button>
      </div>

      {!loading && contacts.length === 0 && (
        <EmptyState title="Aucun contact promo" description="Ajoute un journaliste, un blog ou un curateur de playlist." />
      )}

      <div className="space-y-2">
        {contacts.map((contact) => (
          <ContactCard
            key={contact.id}
            name={contact.name}
            subtitle={`${roleLabels[contact.role]}${contact.org ? ' · ' + contact.org : ''}`}
            email={contact.email}
          />
        ))}
      </div>

      {showCreate && (
        <Modal title="Nouveau contact promo" onClose={() => setShowCreate(false)}>
          <div className="space-y-3">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom"
              className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
            />
            <input
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              placeholder="Organisation (optionnel)"
              className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as PromoContactRole)}
              className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
            >
              {PROMO_CONTACT_ROLES.map((r) => (
                <option key={r} value={r}>
                  {roleLabels[r]}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setShowCreate(false)}>Annuler</Button>
              <Button variant="primary" onClick={handleCreate} disabled={!name.trim() || !email.trim()}>
                Créer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
