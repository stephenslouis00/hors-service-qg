import { useEffect, useState } from 'react'
import { doc, setDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { watchCollection, orderByField, updateDocFields } from '../firebase/firestore'
import type { AllowlistEntry, MemberRole } from '../types/user'
import { useAuth } from '../contexts/AuthContext'

export function useAllowlist() {
  const [members, setMembers] = useState<AllowlistEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = watchCollection<AllowlistEntry>(
      'allowlist',
      (data) => {
        setMembers(data)
        setLoading(false)
      },
      [orderByField('addedAt', 'asc')],
    )
    return unsubscribe
  }, [])

  return { members, loading }
}

export function useAddMember() {
  const { user } = useAuth()
  return (email: string, role: MemberRole) => {
    const normalized = email.trim().toLowerCase()
    return setDoc(doc(db, 'allowlist', normalized), {
      email: normalized,
      role,
      addedBy: user?.email ?? 'unknown',
      addedAt: Date.now(),
    })
  }
}

export function useRemoveMember() {
  return (email: string) => deleteDoc(doc(db, 'allowlist', email.toLowerCase()))
}

export function useUpdateMemberRole() {
  return (email: string, role: MemberRole) => updateDocFields('allowlist', email.toLowerCase(), { role })
}
