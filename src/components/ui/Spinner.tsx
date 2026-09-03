export function Spinner({ className = 'p-10' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        role="status"
        aria-label="Chargement…"
        className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500"
      />
    </div>
  )
}
