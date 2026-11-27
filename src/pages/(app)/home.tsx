import { Link } from 'react-router-dom'
import { useAuthProfileReady, useQuery } from 'deepspace'
import { AuthOverlay } from 'deepspace'
import { useState } from 'react'
import { TripCover } from '../../components/TripCover'
import {
  PACE_LABELS,
  VIBE_LABELS,
  type TripPace,
  type TripRecord,
  type TripVibe,
} from '../../lib/trip-types'
import { Button } from '@/components/ui'

export default function HomePage() {
  const { isSignedIn, user } = useAuthProfileReady({ requireUser: true })
  const [showAuth, setShowAuth] = useState(false)
  const { records, status, error } = useQuery<TripRecord>('trips', {
    orderBy: 'createdAt',
    orderDir: 'desc',
    limit: 40,
  })

  if (!isSignedIn) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-foreground">
          Your sketches live here
        </h1>
        <p className="mt-3 text-muted-foreground">
          Sign in to generate itineraries and keep them across devices.
        </p>
        <Button className="mt-8" onClick={() => setShowAuth(true)}>
          Sign in
        </Button>
        {showAuth ? <AuthOverlay onClose={() => setShowAuth(false)} /> : null}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-foreground">
            Trips
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as {user?.name ?? user?.email}
          </p>
        </div>
        <Link
          to="/trips/new"
          className="inline-flex items-center bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          New sketch
        </Link>
      </div>

      {status === 'loading' ? (
        <p className="mt-12 text-sm text-muted-foreground">Loading trips…</p>
      ) : null}
      {status === 'error' ? (
        <p className="mt-12 text-sm text-destructive">{error ?? 'Could not load trips'}</p>
      ) : null}
      {status === 'ready' && records.length === 0 ? (
        <div className="mt-16 space-y-3 text-center">
          <p className="font-[family-name:var(--font-display)] text-xl text-foreground">
            No trips yet
          </p>
          <p className="text-sm text-muted-foreground">
            Pick a destination and vibe — we&apos;ll research and sketch the days.
          </p>
          <Link
            to="/trips/new"
            className="inline-flex text-sm font-medium text-[var(--trip-teal)] underline-offset-4 hover:underline"
          >
            Create your first sketch
          </Link>
        </div>
      ) : null}

      <ul className="mt-10 grid gap-6 sm:grid-cols-2">
        {records.map((r) => {
          const t = r.data
          const vibe = (t.vibe as TripVibe) in VIBE_LABELS ? VIBE_LABELS[t.vibe as TripVibe] : t.vibe
          const pace =
            t.pace && (t.pace as TripPace) in PACE_LABELS
              ? PACE_LABELS[t.pace as TripPace]
              : null
          return (
            <li key={r.recordId}>
              <Link
                to={`/trips/${r.recordId}`}
                className="group block overflow-hidden border border-border bg-card transition-transform duration-300 hover:-translate-y-0.5"
              >
                <TripCover
                  coverKey={t.coverKey}
                  title={t.title || t.destination}
                  className="aspect-[16/10]"
                />
                <div className="space-y-1 p-4">
                  <p className="font-[family-name:var(--font-display)] text-lg text-foreground group-hover:text-[var(--trip-teal)]">
                    {t.title || t.destination}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t.destination} · {vibe}
                    {pace ? ` · ${pace}` : ''} · {t.daysCount} days · {t.status}
                  </p>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
