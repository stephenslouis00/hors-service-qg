import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export function formatDate(epochMs: number | null | undefined, pattern = 'd MMM yyyy'): string {
  if (!epochMs) return '—'
  return format(epochMs, pattern, { locale: fr })
}

export function formatDateTime(epochMs: number | null | undefined): string {
  if (!epochMs) return '—'
  return format(epochMs, "d MMM yyyy 'à' HH:mm", { locale: fr })
}

export function formatRelative(epochMs: number): string {
  return formatDistanceToNow(epochMs, { addSuffix: true, locale: fr })
}

export function dateInputValue(epochMs: number | null | undefined): string {
  if (!epochMs) return ''
  return format(epochMs, 'yyyy-MM-dd')
}

export function parseDateInputValue(value: string): number | null {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).getTime()
}
