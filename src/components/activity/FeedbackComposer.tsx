import { useState } from 'react'
import type { SongStage } from '../../types/song'
import { Button } from '../ui/Button'

export function FeedbackComposer({
  currentStage,
  onSubmit,
}: {
  currentStage: SongStage
  onSubmit: (text: string) => Promise<unknown>
}) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!text.trim()) return
    setSubmitting(true)
    try {
      await onSubmit(text.trim())
      setText('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Ajouter un retour sur l'étape « ${currentStage} »…`}
        rows={3}
        className="w-full resize-none rounded-md border border-zinc-200 bg-transparent p-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:focus:border-zinc-500"
      />
      <div className="mt-2 flex justify-end">
        <Button variant="primary" onClick={handleSubmit} disabled={submitting || !text.trim()}>
          Commenter
        </Button>
      </div>
    </div>
  )
}
