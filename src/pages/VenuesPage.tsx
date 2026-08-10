import { useState } from 'react'
import { useCreateVenue, useDeleteVenue, useUpdateVenue, useVenues } from '../hooks/useVenues'
import { ContactCard } from '../components/contacts/ContactCard'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'

export function VenuesPage() {
  const { venues, loading } = useVenues()
  const createVenue = useCreateVenue()
  const updateVenue = useUpdateVenue()
  const deleteVenue = useDeleteVenue()

  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  async function handleCreate() {
    if (!name.trim() || !email.trim()) return
    await createVenue({ name: name.trim(), city: city.trim(), contactPerson: contactPerson.trim(), email: email.trim(), phone: phone.trim() })
    setName('')
    setCity('')
    setContactPerson('')
    setEmail('')
    setPhone('')
    setShowCreate(false)
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Booking</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Salles et contacts pour les concerts.</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          + Nouvelle salle
        </Button>
      </div>

      {!loading && venues.length === 0 && (
        <EmptyState title="Aucune salle enregistrée" description="Ajoute une salle et son contact." />
      )}

      <div className="space-y-2">
        {venues.map((venue) => (
          <ContactCard
            key={venue.id}
            name={venue.name}
            subtitle={`${venue.city}${venue.contactPerson ? ' · ' + venue.contactPerson : ''}`}
            email={venue.email}
            onRename={(name) => updateVenue(venue.id, { name })}
            onDelete={() => deleteVenue(venue.id)}
          />
        ))}
      </div>

      {showCreate && (
        <Modal title="Nouvelle salle" onClose={() => setShowCreate(false)}>
          <div className="space-y-3">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom de la salle"
              className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
            />
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ville"
              className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
            />
            <input
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="Personne à contacter (optionnel)"
              className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Téléphone (optionnel)"
              className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
            />
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
