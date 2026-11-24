import type { TripDay, TripSource } from '../lib/trip-types'

export function TripItinerary({
  days,
  sources,
}: {
  days: TripDay[]
  sources: TripSource[]
}) {
  if (days.length === 0) {
    return <p className="text-sm text-muted-foreground">No days yet.</p>
  }

  return (
    <div className="space-y-10">
      {days.map((day) => (
        <section key={day.dayIndex} className="space-y-4">
          <header className="flex items-baseline gap-3 border-b border-border pb-2">
            <span className="font-[family-name:var(--font-display)] text-sm tracking-wide text-[var(--trip-teal)]">
              Day {day.dayIndex}
            </span>
            <h3 className="font-[family-name:var(--font-display)] text-xl text-foreground">
              {day.title}
            </h3>
          </header>
          <ol className="space-y-4">
            {day.stops.map((stop, i) => (
              <li key={`${day.dayIndex}-${i}`} className="grid gap-1 sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-medium text-foreground">
                    {stop.url ? (
                      <a
                        href={stop.url}
                        target="_blank"
                        rel="noreferrer"
                        className="underline-offset-4 hover:underline"
                      >
                        {stop.name}
                      </a>
                    ) : (
                      stop.name
                    )}
                  </p>
                  {stop.note ? (
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{stop.note}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}

      {sources.length > 0 ? (
        <section className="border-t border-border pt-6">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Sources
          </h3>
          <ul className="space-y-2">
            {sources.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[var(--trip-teal)] underline-offset-4 hover:underline"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
