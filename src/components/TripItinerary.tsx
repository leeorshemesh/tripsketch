import {
  TIME_OF_DAY,
  TIME_OF_DAY_LABELS,
  type TimeOfDay,
  type TripDay,
  type TripSource,
  type TripStop,
} from '../lib/trip-types'

function groupStopsByTime(stops: TripStop[]): Array<{ slot: TimeOfDay; stops: TripStop[] }> {
  const buckets: Record<TimeOfDay, TripStop[]> = {
    morning: [],
    afternoon: [],
    evening: [],
  }
  const unslotted: TripStop[] = []

  for (const stop of stops) {
    if (stop.timeOfDay && TIME_OF_DAY.includes(stop.timeOfDay)) {
      buckets[stop.timeOfDay].push(stop)
    } else {
      unslotted.push(stop)
    }
  }

  // Older trips without timeOfDay still render as a flat morning-ish list.
  if (unslotted.length > 0 && TIME_OF_DAY.every((t) => buckets[t].length === 0)) {
    return [{ slot: 'morning', stops: unslotted }]
  }

  const groups = TIME_OF_DAY.filter((t) => buckets[t].length > 0).map((slot) => ({
    slot,
    stops: buckets[slot],
  }))

  if (unslotted.length > 0) {
    groups.push({ slot: 'afternoon', stops: unslotted })
  }

  return groups
}

function StopRow({ stop }: { stop: TripStop }) {
  return (
    <li className="relative pl-4 before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-[var(--trip-teal)]">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
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
        {stop.duration ? (
          <span className="text-xs tracking-wide text-muted-foreground uppercase">
            {stop.duration}
          </span>
        ) : null}
      </div>
      {stop.note ? (
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{stop.note}</p>
      ) : null}
      {stop.tip ? (
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--trip-teal)]/90">
          <span className="font-medium text-foreground/80">Tip · </span>
          {stop.tip}
        </p>
      ) : null}
    </li>
  )
}

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
    <div className="space-y-12">
      {days.map((day) => {
        const groups = groupStopsByTime(day.stops)
        return (
          <section key={day.dayIndex} className="space-y-5">
            <header className="space-y-2 border-b border-border pb-3">
              <div className="flex items-baseline gap-3">
                <span className="font-[family-name:var(--font-display)] text-sm tracking-wide text-[var(--trip-teal)]">
                  Day {day.dayIndex}
                </span>
                <h3 className="font-[family-name:var(--font-display)] text-xl text-foreground">
                  {day.title}
                </h3>
              </div>
              {day.overview ? (
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {day.overview}
                </p>
              ) : null}
            </header>

            <div className="space-y-6">
              {groups.map(({ slot, stops }) => (
                <div key={`${day.dayIndex}-${slot}`} className="space-y-3">
                  <h4 className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
                    {TIME_OF_DAY_LABELS[slot]}
                  </h4>
                  <ol className="space-y-4 border-l border-border/80 ml-1.5">
                    {stops.map((stop, i) => (
                      <StopRow key={`${day.dayIndex}-${slot}-${i}`} stop={stop} />
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </section>
        )
      })}

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
