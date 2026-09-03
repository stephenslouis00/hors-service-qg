import type { ChecklistItem } from '../types/checklist'
import type { Tone } from './statusTone'

export interface ChecklistSectionGroup {
  /** Stable key for React/collapse-state — the header item's id, or 'leading' for the headerless first group. */
  key: string
  label: string
  items: ChecklistItem[]
}

const LEADING_SECTION_LABEL = 'Production'

/**
 * Groups a checklist's items by their section headers — every item up to
 * (not including) the next header belongs to the section opened by the
 * closest preceding one; items before any header form an implicit leading
 * "Production" section. Single source of truth, shared by the checklist UI
 * and the phase computation below so they can never disagree.
 */
export function groupChecklistSections(items: ChecklistItem[]): ChecklistSectionGroup[] {
  const sorted = [...items].sort((a, b) => a.order - b.order)
  const groups: ChecklistSectionGroup[] = [{ key: 'leading', label: LEADING_SECTION_LABEL, items: [] }]
  for (const item of sorted) {
    if (item.header) {
      groups.push({ key: item.id, label: item.label, items: [] })
    } else {
      groups[groups.length - 1].items.push(item)
    }
  }
  return groups
}

export interface ReleasePhase {
  label: string
  tone: Tone
  /** null once everything is done, or when there's nothing to check yet. */
  currentSection: { label: string; done: number; total: number } | null
  doneCount: number
  totalCount: number
  percent: number
}

/**
 * Derives "where a release stands" purely from its checklist — the checklist
 * is the single source of truth for progress, not a separate manually-set status.
 */
export function computeReleasePhase(items: ChecklistItem[]): ReleasePhase {
  const checkable = items.filter((i) => !i.header)
  const doneCount = checkable.filter((i) => i.done).length
  const totalCount = checkable.length
  const percent = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100)

  if (totalCount === 0) {
    return { label: 'Non démarré', tone: 'gray', currentSection: null, doneCount: 0, totalCount: 0, percent: 0 }
  }
  if (doneCount === totalCount) {
    return { label: '🎉 Sorti', tone: 'green', currentSection: null, doneCount, totalCount, percent }
  }

  const sections = groupChecklistSections(items)
  const currentIndex = sections.findIndex((s) => s.items.some((i) => !i.done))
  const current = currentIndex === -1 ? sections[sections.length - 1] : sections[currentIndex]
  const tone: Tone = currentIndex <= 0 ? 'blue' : currentIndex === sections.length - 1 ? 'yellow' : 'purple'

  return {
    label: current.label,
    tone,
    currentSection: { label: current.label, done: current.items.filter((i) => i.done).length, total: current.items.length },
    doneCount,
    totalCount,
    percent,
  }
}
