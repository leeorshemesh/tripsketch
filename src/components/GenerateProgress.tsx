export function GenerateProgress({
  progress,
  message,
}: {
  progress: number
  message: string
}) {
  const pct = Math.max(0, Math.min(100, Math.round(progress)))
  return (
    <div className="mx-auto w-full max-w-md space-y-4 text-center" role="status" aria-live="polite">
      <div className="mx-auto h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-[var(--trip-teal)] transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="font-[family-name:var(--font-display)] text-lg text-foreground">{message || 'Working…'}</p>
      <p className="text-sm text-muted-foreground">{pct}%</p>
    </div>
  )
}
