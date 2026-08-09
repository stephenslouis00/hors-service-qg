export type MemberRole = 'admin' | 'member'

export interface AllowlistEntry {
  email: string
  role: MemberRole
  addedBy: string
  addedAt: number
  displayName?: string
}
