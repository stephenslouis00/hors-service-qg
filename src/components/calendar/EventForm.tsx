import { useState } from 'react'
import { Button } from '../ui/Button'

export interface EventFormValue {
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  allDay: boolean
  releaseId: string
}

export function EventForm({
  initial,
  releaseOptions,
  onCancel,
  onSubmit,
}: {
  initial?: Partial<EventFormValue>
  /** When provided, shows a "related release" select (used by the Promotion calendar). */
  releaseOptions?: { id: string; title: string }[]
  onCancel: () => void
  onSubmit: (value: EventFormValue) => Promise<unknown>
}) {
  const [value, setValue] = useState<EventFormValue>({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    date: initial?.date ?? '',
    startTime: initial?.startTime ?? '18:00',
    endTime: initial?.endTime ?? '19:00',
    allDay: initial?.allDay ?? true,
    releaseId: initial?.releaseId ?? '',
  })
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!value.title.trim() || !value.date) return
    setSubmitting(true)
    try {
      await onSubmit(value)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-3">
      <input
        autoFocus
        value={value.title}
        onChange={(e) => setValue((v) => ({ ...v, title: e.target.value }))}
        placeholder="Titre"
        className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
      />
      <textarea
        value={value.description}
        onChange={(e) => setValue((v) => ({ ...v, description: e.target.value }))}
        placeholder="Description (optionnel)"
        rows={2}
        className="w-full resize-none rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
      />
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={value.date}
          onChange={(e) => setValue((v) => ({ ...v, date: e.target.value }))}
          className="rounded-md border border-zinc-300 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700"
        />
        <label className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
          <input
            type="checkbox"
            checked={value.allDay}
            onChange={(e) => setValue((v) => ({ ...v, allDay: e.target.checked }))}
          />
          Journée entière
        </label>
      </div>
      {!value.allDay && (
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={value.startTime}
            onChange={(e) => setValue((v) => ({ ...v, startTime: e.target.value }))}
            className="rounded-md border border-zinc-300 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700"
          />
          <span className="text-sm text-zinc-500">→</span>
          <input
            type="time"
            value={value.endTime}
            onChange={(e) => setValue((v) => ({ ...v, endTime: e.target.value }))}
            className="rounded-md border border-zinc-300 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700"
          />
        </div>
      )}
      {releaseOptions && (
        <select
          value={value.releaseId}
          onChange={(e) => setValue((v) => ({ ...v, releaseId: e.target.value }))}
          className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
        >
          <option value="">Aucune sortie associée</option>
          {releaseOptions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>
      )}
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel}>Annuler</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={submitting || !value.title.trim() || !value.date}>
          Enregistrer
        </Button>
      </div>
    </div>
  )
}

export function eventFormValueToRange(value: EventFormValue): { startAt: number; endAt: number } {
  const [year, month, day] = value.date.split('-').map(Number)
  if (value.allDay) {
    const start = new Date(year, month - 1, day).getTime()
    const end = new Date(year, month - 1, day, 23, 59).getTime()
    return { startAt: start, endAt: end }
  }
  const [sh, sm] = value.startTime.split(':').map(Number)
  const [eh, em] = value.endTime.split(':').map(Number)
  return {
    startAt: new Date(year, month - 1, day, sh, sm).getTime(),
    endAt: new Date(year, month - 1, day, eh, em).getTime(),
  }
}
