import type { ChecklistItem } from '../types/checklist'
import type { Tone } from './statusTone'

export interface ReleasePhase {
  label: string
  tone: Tone
  /** null once everything is done, or when there's nothing to check yet. */
  currentSection: { label: string; done: number; total: number } | null
  doneCount: number
  totalCount: number
}

const LEADING_SECTION_LABEL = 'Production'

/**
 * Derives "where a release stands" purely from its checklist — the checklist
 * is the single source of truth for progress, not a separate manually-set status.
 */
export function computeReleasePhase(items: ChecklistItem[]): ReleasePhase {
  const checkable = items.filter((i) => !i.header)
  const doneCount = checkable.filter((i) => i.done).length
  const totalCount = checkable.length

  if (totalCount === 0) {
    return { label: 'Non démarré', tone: 'gray', currentSection: null, doneCount: 0, totalCount: 0 }
  }
  if (doneCount === totalCount) {
    return { label: '🎉 Sorti', tone: 'green', currentSection: null, doneCount, totalCount }
  }

  const sorted = [...items].sort((a, b) => a.order - b.order)
  const sections: { label: string; items: ChecklistItem[] }[] = [{ label: LEADING_SECTION_LABEL, items: [] }]
  for (const item of sorted) {
    if (item.header) {
      sections.push({ label: item.label, items: [] })
    } else {
      sections[sections.length - 1].items.push(item)
    }
  }

  const currentIndex = sections.findIndex((s) => s.items.some((i) => !i.done))
  const current = currentIndex === -1 ? sections[sections.length - 1] : sections[currentIndex]
  const tone: Tone = currentIndex <= 0 ? 'blue' : currentIndex === sections.length - 1 ? 'yellow' : 'purple'

  return {
    label: current.label,
    tone,
    currentSection: { label: current.label, done: current.items.filter((i) => i.done).length, total: current.items.length },
    doneCount,
    totalCount,
  }
}
