import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from 'deepspace'
import { GenerateProgress } from '../../../../../components/GenerateProgress'
import { TripCover } from '../../../../../components/TripCover'
import { TripItinerary } from '../../../../../components/TripItinerary'
import {
  PACE_LABELS,
  VIBE_LABELS,
  parseItinerary,
  parseSources,
  type TripPace,
  type TripRecord,
  type TripVibe,
} from '../../../../../lib/trip-types'
import { Button } from '@/components/ui'

export default function TripDetailPage() {
  const { id } = useParams()
  const tripId = id ?? ''
  // Recent list + client find — enough at the daily generate cap.
  // A larger library would fetch by recordId instead.
  const { records, status, error } = useQuery<TripRecord>('trips', {
    orderBy: 'createdAt',
    orderDir: 'desc',
    limit: 50,
  })
  const [copied, setCopied] = useState(false)

  const trip = useMemo(
    () => records.find((r) => r.recordId === tripId),
    [records, tripId],
  )

  if (status === 'loading') {
    return <p className="p-10 text-sm text-muted-foreground">Loading trip…</p>
  }
  if (status === 'error') {
    return <p className="p-10 text-sm text-destructive">{error ?? 'Failed to load'}</p>
  }
  if (!trip) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <p className="text-foreground">Trip not found</p>
        <Link to="/home" className="mt-4 inline-block text-sm text-[var(--trip-teal)] hover:underline">
          Back to trips
        </Link>
      </div>
    )
  }

  const t = trip.data
  const days = parseItinerary(t.itineraryJson)
  const sources = parseSources(t.sourcesJson)
  const vibe = (t.vibe as TripVibe) in VIBE_LABELS ? VIBE_LABELS[t.vibe as TripVibe] : t.vibe
  const pace =
    t.pace && (t.pace as TripPace) in PACE_LABELS
      ? PACE_LABELS[t.pace as TripPace]
      : t.pace || null
  const shareUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/s/${t.shareSlug}` : `/s/${t.shareSlug}`

  async function copyShare() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  if (t.status === 'generating' || t.status === 'draft') {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6">
        <p className="mb-8 font-[family-name:var(--font-display)] text-sm tracking-wide text-muted-foreground uppercase">
          {t.destination} · {vibe}
        </p>
        <GenerateProgress progress={t.progress ?? 0} message={t.statusMessage || 'Working…'} />
      </div>
    )
  }

  if (t.status === 'failed') {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-2xl text-foreground">
          Generation failed
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {t.failureReason || 'Something went wrong while building this trip.'}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/trips/new">
            <Button>Try again</Button>
          </Link>
          <Link to="/home" className="text-sm text-muted-foreground hover:underline self-center">
            Library
          </Link>
        </div>
      </div>
    )
  }

  return (
    <article className="pb-16">
      <TripCover
        coverKey={t.coverKey}
        title={t.title}
        className="aspect-[21/9] max-h-[420px] w-full"
      />
      <div className="mx-auto max-w-3xl px-6 pt-8">
        <p className="text-sm tracking-wide text-muted-foreground uppercase">
          {t.destination} · {vibe}
          {pace ? ` · ${pace}` : ''} · {t.daysCount} days
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-foreground">
          {t.title}
        </h1>
        {t.summary ? (
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">{t.summary}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" onClick={copyShare}>
            {copied ? 'Copied link' : 'Copy share link'}
          </Button>
          <Link
            to={`/s/${t.shareSlug}`}
            className="text-sm text-[var(--trip-teal)] underline-offset-4 hover:underline"
          >
            Open public view
          </Link>
        </div>

        <div className="mt-12">
          <TripItinerary days={days} sources={sources} />
        </div>
      </div>
    </article>
  )
}
