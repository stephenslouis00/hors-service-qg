export function Avatar({ name, photoUrl, size = 24 }: { name: string; photoUrl?: string | null; size?: number }) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-full"
        referrerPolicy="no-referrer"
      />
    )
  }
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      className="flex items-center justify-center rounded-full bg-zinc-300 font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
    >
      {initial}
    </div>
  )
}
