import { useState } from 'react'
import { useAdminDocs, useCreateAdminDoc, useDeleteAdminDoc } from '../hooks/useDocs'
import { useAddMember, useAllowlist, useRemoveMember, useUpdateMemberRole } from '../hooks/useAllowlist'
import { useReleases } from '../hooks/useReleases'
import { ADMIN_DOC_TYPES, type AdminDocType } from '../types/admin'
import type { MemberRole } from '../types/user'
import { DocumentRepo } from '../components/documents/DocumentRepo'
import { DriveAttachButton } from '../components/documents/DriveAttachButton'
import type { DrivePickedFile } from '../lib/googleDrive'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { Card, CardHeader } from '../components/ui/Card'
import { StatusPill } from '../components/ui/StatusPill'
import { StatusPillSelect } from '../components/ui/StatusPillSelect'
import { SectionHeading } from '../components/ui/SectionHeading'
import { useAuth } from '../contexts/AuthContext'

// Mirrors the same protection enforced server-side in firestore.rules — the
// owner account can't be demoted or removed by anyone, including other admins.
const PROTECTED_OWNER_EMAIL = 'stephenslouis00@gmail.com'
const MEMBER_ROLES: MemberRole[] = ['member', 'admin']
const ROLE_LABEL: Record<MemberRole, string> = { member: 'member', admin: 'admin' }

const typeLabels: Record<AdminDocType, string> = {
  contract: 'Contrat',
  payment: 'Paiement',
  legal: 'Juridique',
}

export function AdministrativePage() {
  const { docs, loading } = useAdminDocs()
  const createDoc = useCreateAdminDoc()
  const deleteDoc = useDeleteAdminDoc()
  const { allowlistEntry, user } = useAuth()
  const { members } = useAllowlist()
  const { releases } = useReleases()

  const [pickedFile, setPickedFile] = useState<DrivePickedFile | null>(null)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<AdminDocType>('contract')
  const [description, setDescription] = useState('')
  const [relatedReleaseId, setRelatedReleaseId] = useState('')

  function handlePicked(file: DrivePickedFile) {
    setPickedFile(file)
    setTitle(file.name)
  }

  async function handleSave() {
    if (!pickedFile || !title.trim()) return
    await createDoc({
      title: title.trim(),
      type,
      description,
      driveUrl: pickedFile.url,
      relatedReleaseId: relatedReleaseId || null,
    })
    setPickedFile(null)
    setTitle('')
    setDescription('')
    setRelatedReleaseId('')
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Administratif</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Contrats, paiements et documents juridiques.</p>
        </div>
        <DriveAttachButton
          onPicked={handlePicked}
          shareWithEmails={members.map((m) => m.email).filter((email) => email !== user?.email)}
        />
      </div>

      {!loading && docs.length === 0 && (
        <EmptyState title="Aucun document" description="Ajoute un contrat, un paiement ou un document juridique depuis Drive." />
      )}

      {docs.length > 0 && <DocumentRepo docs={docs} onDelete={deleteDoc} />}

      {allowlistEntry?.role === 'admin' && <MembersPanel />}

      {pickedFile && (
        <Modal title="Ajouter le document" onClose={() => setPickedFile(null)}>
          <div className="space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre"
              className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AdminDocType)}
              className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
            >
              {ADMIN_DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {typeLabels[t]}
                </option>
              ))}
            </select>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optionnel)"
              rows={2}
              className="w-full resize-none rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
            />
            <select
              value={relatedReleaseId}
              onChange={(e) => setRelatedReleaseId(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
            >
              <option value="">Aucune sortie associée</option>
              {releases.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setPickedFile(null)}>Annuler</Button>
              <Button variant="primary" onClick={handleSave} disabled={!title.trim()}>
                Ajouter
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function MembersPanel() {
  const { members } = useAllowlist()
  const addMember = useAddMember()
  const removeMember = useRemoveMember()
  const updateMemberRole = useUpdateMemberRole()
  const { user } = useAuth()
  const [email, setEmail] = useState('')

  async function handleAdd() {
    if (!email.trim()) return
    await addMember(email.trim(), 'member')
    setEmail('')
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <SectionHeading className="">Membres autorisés</SectionHeading>
      </CardHeader>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
        {members.map((member) => {
          const isProtected = member.email === PROTECTED_OWNER_EMAIL
          return (
            <div key={member.email} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-zinc-700 dark:text-zinc-300">{member.email}</span>
              <div className="flex items-center gap-2">
                {isProtected ? (
                  <span title="Le compte propriétaire ne peut pas être rétrogradé.">
                    <StatusPill label={ROLE_LABEL[member.role]} tone="purple" />
                  </span>
                ) : (
                  <StatusPillSelect
                    value={member.role}
                    options={MEMBER_ROLES}
                    labelFor={(r) => ROLE_LABEL[r]}
                    toneFor={(r) => (r === 'admin' ? 'purple' : 'gray')}
                    onChange={(role) => updateMemberRole(member.email, role)}
                  />
                )}
                {member.email !== user?.email && !isProtected && (
                  <button
                    onClick={() => removeMember(member.email)}
                    className="text-xs text-red-600 hover:underline dark:text-red-400"
                  >
                    Retirer
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex gap-2 border-t border-zinc-100 p-3 dark:border-zinc-900">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@gmail.com"
          className="flex-1 rounded-md border border-zinc-300 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
        />
        <Button variant="primary" onClick={handleAdd} disabled={!email.trim()}>
          Ajouter
        </Button>
      </div>
    </Card>
  )
}
