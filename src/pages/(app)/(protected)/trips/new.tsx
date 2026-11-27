import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { callAction } from '../../../../lib/callAction'
import {
  DAILY_GENERATE_LIMIT,
  MAX_TRIP_DAYS,
  MIN_TRIP_DAYS,
  PACE_BLURBS,
  PACE_LABELS,
  TRIP_PACES,
  TRIP_VIBES,
  VIBE_BLURBS,
  VIBE_LABELS,
  type TripPace,
  type TripVibe,
} from '../../../../lib/trip-types'
import { Button, Input, Label } from '@/components/ui'

export default function NewTripPage() {
  const navigate = useNavigate()
  const [destination, setDestination] = useState('')
  const [vibe, setVibe] = useState<TripVibe>('culture')
  const [pace, setPace] = useState<TripPace>('balanced')
  const [daysCount, setDaysCount] = useState(3)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const result = await callAction<{ tripId: string }>('startTripGenerate', {
      destination,
      vibe,
      pace,
      daysCount,
    })
    setBusy(false)
    if (!result.success) {
      setError(result.error)
      return
    }
    navigate(`/trips/${result.data.tripId}`)
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-foreground">
        New sketch
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We search the web, write a day plan with morning → evening shape, and draw a
        cover. Limit {DAILY_GENERATE_LIMIT} per day.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-8">
        <div className="space-y-2">
          <Label htmlFor="destination">Destination</Label>
          <Input
            id="destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Lisbon, Portugal"
            required
            maxLength={120}
            disabled={busy}
          />
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-foreground">Vibe</legend>
          <div className="grid grid-cols-2 gap-2">
            {TRIP_VIBES.map((v) => (
              <button
                key={v}
                type="button"
                disabled={busy}
                onClick={() => setVibe(v)}
                className={`border px-3 py-2.5 text-left transition-colors ${
                  vibe === v
                    ? 'border-[var(--trip-teal)] bg-[var(--trip-teal)]/10 text-foreground'
                    : 'border-border text-muted-foreground hover:border-foreground/30'
                }`}
              >
                <span className="block text-sm font-medium">{VIBE_LABELS[v]}</span>
                <span className="mt-0.5 block text-xs leading-snug opacity-80">
                  {VIBE_BLURBS[v]}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-foreground">Pace</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {TRIP_PACES.map((p) => (
              <button
                key={p}
                type="button"
                disabled={busy}
                onClick={() => setPace(p)}
                className={`border px-3 py-2.5 text-left transition-colors ${
                  pace === p
                    ? 'border-[var(--trip-teal)] bg-[var(--trip-teal)]/10 text-foreground'
                    : 'border-border text-muted-foreground hover:border-foreground/30'
                }`}
              >
                <span className="block text-sm font-medium">{PACE_LABELS[p]}</span>
                <span className="mt-0.5 block text-xs leading-snug opacity-80">
                  {PACE_BLURBS[p]}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="days">Days ({daysCount})</Label>
          <input
            id="days"
            type="range"
            min={MIN_TRIP_DAYS}
            max={MAX_TRIP_DAYS}
            value={daysCount}
            onChange={(e) => setDaysCount(Number(e.target.value))}
            disabled={busy}
            className="w-full accent-[var(--trip-teal)]"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{MIN_TRIP_DAYS} day</span>
            <span>up to {MAX_TRIP_DAYS} days</span>
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" disabled={busy || destination.trim().length < 2} className="w-full">
          {busy ? 'Starting…' : 'Generate itinerary'}
        </Button>
      </form>
    </div>
  )
}
