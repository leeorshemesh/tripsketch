import type { ActionHandler } from 'deepspace/worker'
import { enqueueJob } from 'deepspace/worker'
import type { Env } from '../../worker'
import {
  DAILY_GENERATE_LIMIT,
  TRIP_VIBES,
  makeShareSlug,
  type TripVibe,
} from '../lib/trip-types'
import type { GenerateTripPayload } from '../server/jobs/generateTripJob'

const startTripGenerate: ActionHandler<Env> = async ({ userId, params, tools, env }) => {
  const destination = String(params.destination ?? '').trim()
  const vibeRaw = String(params.vibe ?? '').trim()
  const daysCount = Math.max(1, Math.min(7, Number(params.daysCount) || 3))

  if (destination.length < 2 || destination.length > 120) {
    return { success: false, error: 'Enter a destination (2–120 characters).' }
  }
  if (!TRIP_VIBES.includes(vibeRaw as TripVibe)) {
    return { success: false, error: 'Pick a vibe: foodie, outdoors, culture, or chill.' }
  }
  const vibe = vibeRaw as TripVibe

  // Daily cap — owner-billed integrations; prevent click-loop spend.
  const existing = await tools.query<{ status?: string }>('trips', {
    where: { createdBy: userId },
    orderBy: 'createdAt',
    orderDir: 'desc',
    limit: 40,
  })
  if (!existing.success) return existing

  const startOfUtcDay = new Date()
  startOfUtcDay.setUTCHours(0, 0, 0, 0)
  const startedToday = existing.data.records.filter((r) => {
    const created = Date.parse(r.createdAt)
    return Number.isFinite(created) && created >= startOfUtcDay.getTime()
  }).length

  if (startedToday >= DAILY_GENERATE_LIMIT) {
    return {
      success: false,
      error: `Daily limit reached (${DAILY_GENERATE_LIMIT} trips). Try again tomorrow.`,
    }
  }

  const shareSlug = makeShareSlug()
  const created = await tools.create('trips', {
    title: `${destination} · ${vibe}`,
    destination,
    vibe,
    daysCount,
    status: 'generating',
    statusMessage: 'Queued…',
    progress: 0,
    summary: '',
    itineraryJson: [],
    sourcesJson: [],
    coverKey: '',
    shareSlug,
    jobId: '',
    failureReason: '',
    visibility: 'private',
  })
  if (!created.success) return created

  const tripId = (created.data as { recordId?: string }).recordId
  if (!tripId) return { success: false, error: 'Failed to create trip record.' }

  const payload: GenerateTripPayload = {
    tripId,
    userId,
    destination,
    vibe,
    daysCount,
  }

  try {
    const jobId = await enqueueJob(
      env.JOB_ROOMS,
      `app:${env.DEEPSPACE_APP_ID}`,
      'generate-trip',
      payload,
      { maxAttempts: 2, enqueuedBy: userId },
    )
    await tools.update('trips', tripId, { jobId })
    return { success: true, data: { tripId, shareSlug, jobId } }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await tools.update('trips', tripId, {
      status: 'failed',
      statusMessage: 'Could not start generation',
      failureReason: msg.slice(0, 500),
      progress: 100,
    })
    return { success: false, error: msg }
  }
}

export const actions: Record<string, ActionHandler<Env>> = {
  startTripGenerate,
}
