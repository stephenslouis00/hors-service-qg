export const ADMIN_DOC_TYPES = ['contract', 'payment', 'legal'] as const
export type AdminDocType = (typeof ADMIN_DOC_TYPES)[number]

export interface AdminDocument {
  id: string
  title: string
  type: AdminDocType
  description: string
  associatedDate: number | null
  driveUrl: string
  uploadedBy: string
  uploadedAt: number
  relatedReleaseId?: string | null
}
