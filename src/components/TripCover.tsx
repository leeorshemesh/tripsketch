import { useR2Files } from 'deepspace'

export function TripCover({
  coverKey,
  title,
  className = '',
}: {
  coverKey: string
  title: string
  className?: string
}) {
  const { getUrl } = useR2Files({ scope: 'app' })
  if (!coverKey) {
    return (
      <div
        className={`flex items-end bg-gradient-to-br from-[var(--trip-deep)] via-[var(--trip-teal)] to-[var(--trip-sand)] p-6 ${className}`}
        aria-hidden
      >
        <p className="font-[family-name:var(--font-display)] text-2xl text-white/90">{title}</p>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={getUrl(coverKey)}
        alt=""
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
    </div>
  )
}
