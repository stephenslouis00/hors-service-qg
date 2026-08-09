import { useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Tone } from '../../lib/statusTone'
import { StatusPill } from '../ui/StatusPill'

export interface CalendarItem {
  id: string
  date: number
  label: string
  tone: Tone
}

export function CalendarView({
  items,
  onDayClick,
  onItemClick,
}: {
  items: CalendarItem[]
  onDayClick?: (date: Date) => void
  onItemClick?: (id: string) => void
}) {
  const [cursor, setCursor] = useState(new Date())

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [cursor])

  const itemsByDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>()
    for (const item of items) {
      const key = format(item.date, 'yyyy-MM-dd')
      const list = map.get(key) ?? []
      list.push(item)
      map.set(key, list)
    }
    return map
  }, [items])

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold capitalize text-zinc-900 dark:text-zinc-100">
          {format(cursor, 'MMMM yyyy', { locale: fr })}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setCursor((c) => subMonths(c, 1))}
            className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            ←
          </button>
          <button
            onClick={() => setCursor(new Date())}
            className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => setCursor((c) => addMonths(c, 1))}
            className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border border-zinc-200 bg-zinc-200 text-xs dark:border-zinc-800 dark:bg-zinc-800">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
          <div key={d} className="bg-zinc-50 px-2 py-1.5 text-center font-medium text-zinc-500 dark:bg-[#151b23] dark:text-zinc-400">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const dayItems = itemsByDay.get(key) ?? []
          return (
            <div
              key={key}
              onClick={() => onDayClick?.(day)}
              className={
                'min-h-24 cursor-pointer bg-white p-1.5 dark:bg-[#0d1117] ' +
                (!isSameMonth(day, cursor) ? 'opacity-40' : '') +
                (isSameDay(day, new Date()) ? ' ring-1 ring-inset ring-orange-400' : '')
              }
            >
              <div className="text-[11px] text-zinc-500 dark:text-zinc-500">{format(day, 'd')}</div>
              <div className="mt-1 flex flex-col gap-1">
                {dayItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onItemClick?.(item.id)
                    }}
                    className="block w-full truncate text-left"
                  >
                    <StatusPill label={item.label} tone={item.tone} />
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
