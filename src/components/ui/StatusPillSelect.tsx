import { useState } from 'react'
import { StatusPill } from './StatusPill'
import type { Tone } from '../../lib/statusTone'

export function StatusPillSelect<T extends string>({
  value,
  options,
  labelFor,
  toneFor,
  onChange,
}: {
  value: T
  options: readonly T[]
  labelFor: (option: T) => string
  toneFor: (option: T) => Tone
  onChange: (option: T) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative shrink-0">
      <button
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
      >
        <StatusPill label={labelFor(value)} tone={toneFor(value)} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-10 mt-1 w-40 rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-[#151b23]"
          onMouseLeave={() => setOpen(false)}
        >
          {options.map((option) => (
            <button
              key={option}
              onClick={(e) => {
                e.stopPropagation()
                onChange(option)
                setOpen(false)
              }}
              className="flex w-full items-center px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              <StatusPill label={labelFor(option)} tone={toneFor(option)} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
