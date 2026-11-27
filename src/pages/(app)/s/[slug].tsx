import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from 'deepspace'
import { TripCover } from '../../../components/TripCover'
import { TripItinerary } from '../../../components/TripItinerary'
import {
  PACE_LABELS,
  VIBE_LABELS,
  parseItinerary,
  parseSources,
  type TripPace,
  type TripRecord,
  type TripVibe,
} from '../../../lib/trip-types'
import { APP_NAME } from '../../../constants'

/** Public share reader — no sign-in required; published trips only. */
export default function PublicTripPage() {
  const { slug } = useParams()
  const shareSlug = slug ?? ''
  const { records, status, error } = useQuery<TripRecord>('trips', {
    where: { shareSlug },
    limit: 5,
  })

  const trip = useMemo(() => {
    const match = records.find((r) => r.data.shareSlug === shareSlug)
    if (!match) return null
    if (match.data.visibility !== 'public' && match.data.status !== 'ready') return null
    return match
  }, [records, shareSlug])

  if (status === 'loading') {
    return <p className="p-10 text-center text-sm text-muted-foreground">Loading sketch…</p>
  }
  if (status === 'error') {
    return <p className="p-10 text-center text-sm text-destructive">{error}</p>
  }
  if (!trip) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-2xl">Sketch not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This link may be private or still generating.
        </p>
        <Link to="/" className="mt-6 inline-block text-sm text-[var(--trip-teal)] hover:underline">
          {APP_NAME}
        </Link>
      </div>
    )
  }

  const t = trip.data
  const vibe = (t.vibe as TripVibe) in VIBE_LABELS ? VIBE_LABELS[t.vibe as TripVibe] : t.vibe
  const pace =
    t.pace && (t.pace as TripPace) in PACE_LABELS
      ? PACE_LABELS[t.pace as TripPace]
      : t.pace || null

  return (
    <article className="pb-16">
      <TripCover
        coverKey={t.coverKey}
        title={t.title}
        className="aspect-[21/9] max-h-[420px] w-full"
      />
      <div className="mx-auto max-w-3xl px-6 pt-8">
        <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">{APP_NAME}</p>
        <p className="mt-3 text-sm tracking-wide text-muted-foreground uppercase">
          {t.destination} · {vibe}
          {pace ? ` · ${pace}` : ''} · {t.daysCount} days
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-foreground">
          {t.title}
        </h1>
        {t.summary ? (
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">{t.summary}</p>
        ) : null}
        <div className="mt-12">
          <TripItinerary days={parseItinerary(t.itineraryJson)} sources={parseSources(t.sourcesJson)} />
        </div>
      </div>
    </article>
  )
}
