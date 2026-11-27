/**
 * generate-trip job — Exa search → LLM itinerary → Gemini cover → R2.
 *
 * Runs inside AppJobRoom so generation survives tab close and reports
 * live progress via both JobContext and the trip record.
 */

import { appFiles, buildCronContext, type JobContext } from 'deepspace/worker'
import type { Env } from '../../../worker'
import {
  PACE_STOP_GUIDANCE,
  TIME_OF_DAY,
  type TimeOfDay,
  type TripDay,
  type TripPace,
  type TripSource,
  type TripVibe,
} from '../../lib/trip-types'

export interface GenerateTripPayload {
  tripId: string
  userId: string
  destination: string
  vibe: TripVibe
  pace: TripPace
  daysCount: number
}

interface ExaResult {
  title?: string
  url?: string
  text?: string
  highlights?: string[]
  summary?: string
}

interface ExaSearchData {
  results?: ExaResult[]
}

interface ChatCompletionData {
  choices?: Array<{ message?: { content?: string } }>
  // Some proxy shapes nest the OpenAI body
  response?: { choices?: Array<{ message?: { content?: string } }> }
}

interface GeminiImageData {
  base64Images?: string[]
}

interface ItineraryPayload {
  title?: string
  summary?: string
  days?: Array<{
    dayIndex?: number
    title?: string
    overview?: string
    stops?: Array<{
      name?: string
      note?: string
      url?: string
      timeOfDay?: string
      tip?: string
      duration?: string
    }>
  }>
}

export async function runGenerateTripJob(
  payload: GenerateTripPayload,
  ctx: JobContext,
  env: Env,
): Promise<{ ok: boolean; tripId: string }> {
  const { tripId, userId, destination, vibe, pace, daysCount } = payload
  const room = buildCronContext(env, env.OWNER_USER_ID, `app:${env.DEEPSPACE_APP_ID}`)

  const patch = async (data: Record<string, unknown>) => {
    await room.records.update('trips', tripId, data)
  }

  try {
    ctx.progress(0.05, 'Searching the web…')
    await patch({
      status: 'generating',
      statusMessage: 'Searching travel sources…',
      progress: 5,
      failureReason: '',
    })

    if (ctx.signal.aborted) throw new Error('canceled')

    // Two targeted searches beat one vague query for stop variety.
    const [generalRaw, focusedRaw] = await Promise.all([
      room.integrations.call('exa/search', {
        query: `${destination} ${vibe} travel itinerary best places tips`,
        numResults: 6,
        contents: {
          text: { maxCharacters: 1400 },
          highlights: { numSentences: 2, highlightsPerUrl: 2 },
        },
      }),
      room.integrations.call('exa/search', {
        query: `${destination} ${vibe} neighborhoods restaurants things to do day by day`,
        numResults: 5,
        contents: {
          text: { maxCharacters: 1200 },
          highlights: { numSentences: 2, highlightsPerUrl: 2 },
        },
      }),
    ])
    const general = generalRaw as ExaSearchData
    const focused = focusedRaw as ExaSearchData

    const results = dedupeExaResults([
      ...(Array.isArray(general?.results) ? general.results : []),
      ...(Array.isArray(focused?.results) ? focused.results : []),
    ]).slice(0, 10)

    const sources: TripSource[] = results
      .filter((r) => r.url && r.title)
      .slice(0, 10)
      .map((r) => ({ title: String(r.title), url: String(r.url) }))

    const sourceBlock = results
      .slice(0, 10)
      .map((r, i) => {
        const snippet =
          (Array.isArray(r.highlights) ? r.highlights.join(' ') : '') ||
          r.summary ||
          (typeof r.text === 'string' ? r.text.slice(0, 700) : '')
        return `[${i + 1}] ${r.title ?? 'Untitled'}\nURL: ${r.url ?? ''}\n${snippet}`
      })
      .join('\n\n')

    ctx.progress(0.35, 'Planning days…')
    await patch({
      statusMessage: 'Writing your day-by-day plan…',
      progress: 35,
      sourcesJson: sources,
    })

    if (ctx.signal.aborted) throw new Error('canceled')

    const system = [
      'You are TripSketch, a travel planner who writes itineraries people can actually picture living.',
      'Return ONLY valid JSON with keys:',
      'title (string), summary (string, 2-3 sentences selling the trip arc),',
      'days (array of { dayIndex: number starting at 1, title: string, overview: string,',
      'stops: array of { name, note, timeOfDay, duration?, tip?, url? } }).',
      `Exactly ${daysCount} days.`,
      `Pace is "${pace}": use ${PACE_STOP_GUIDANCE[pace]}.`,
      'Each day MUST include an overview (2-3 sentences) describing how the day flows —',
      'where morning energy goes, what afternoon feels like, how evening winds down.',
      'Every stop MUST set timeOfDay to one of: morning, afternoon, evening.',
      'Cover morning, afternoon, AND evening across the day when pace allows;',
      'relaxed days may skip one slot if intentional.',
      'Notes: 1-2 concrete sentences (what you do there, why it fits the vibe).',
      'Tips: optional practical line (transit, booking, what to order, best time).',
      'duration: short estimate like "45 min" or "1–2 hrs" when useful.',
      'Prefer real places from the sources; include source URLs on stops when known.',
      'Vary neighborhoods across days when the destination is large enough.',
      'Do not invent dangerous or illegal activities.',
    ].join(' ')

    const userMsg = [
      `Destination: ${destination}`,
      `Vibe: ${vibe}`,
      `Pace: ${pace}`,
      `Days: ${daysCount}`,
      '',
      'Sources:',
      sourceBlock || '(no search hits — use well-known public attractions carefully)',
    ].join('\n')

    let itinerary = await planWithLlm(room, system, userMsg, daysCount)
    if (!itinerary.days.length) {
      itinerary = await planWithLlm(
        room,
        system,
        `${userMsg}\n\nPrevious output was invalid. Reply with JSON only.`,
        daysCount,
      )
    }
    if (!itinerary.days.length) {
      throw new Error('Could not parse a usable itinerary from the model')
    }

    ctx.progress(0.7, 'Drawing cover…')
    await patch({
      title: itinerary.title,
      summary: itinerary.summary,
      itineraryJson: itinerary.days,
      statusMessage: 'Generating cover image…',
      progress: 70,
    })

    if (ctx.signal.aborted) throw new Error('canceled')

    let coverKey = ''
    try {
      const coverPrompt = [
        `Travel poster illustration for a trip to ${destination},`,
        `${vibe} vibe, ${pace} pace, cinematic lighting, no text, no logos, rich atmosphere.`,
      ].join(' ')

      const image = (await room.integrations.call('gemini/generate-image', {
        prompt: coverPrompt,
        model: 'gemini-2.5-flash-image',
        aspectRatio: '16:9',
      })) as GeminiImageData

      const raw = image?.base64Images?.[0]
      if (raw) {
        const files = appFiles(env, { scope: 'app', userId })
        const uploaded = await files.upload(base64ToBlob(raw, 'image/png'), {
          key: `trips/${tripId}/cover.png`,
          name: `${tripId}-cover.png`,
        })
        coverKey = uploaded.key
      }
    } catch (err) {
      // Cover is nice-to-have — itinerary still ships.
      console.error(
        '[generate-trip] cover failed:',
        err instanceof Error ? err.message : String(err),
      )
    }

    ctx.progress(1, 'Ready')
    await patch({
      status: 'ready',
      statusMessage: 'Ready',
      progress: 100,
      coverKey,
      visibility: 'public',
      failureReason: '',
    })

    return { ok: true, tripId }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[generate-trip ${tripId}]`, msg)
    try {
      await patch({
        status: 'failed',
        statusMessage: 'Generation failed',
        progress: 100,
        failureReason: msg.slice(0, 500),
      })
    } catch {
      /* ignore secondary failure */
    }
    throw err
  }
}

async function planWithLlm(
  room: ReturnType<typeof buildCronContext>,
  system: string,
  userMsg: string,
  daysCount: number,
): Promise<{ title: string; summary: string; days: TripDay[] }> {
  // Longer trips need more output budget so day overviews don't get truncated.
  const maxTokens = Math.min(8000, 2000 + daysCount * 400)

  const completion = (await room.integrations.call('openai/chat-completion', {
    model: 'gpt-4.1-mini',
    max_tokens: maxTokens,
    temperature: 0.55,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userMsg },
    ],
  })) as ChatCompletionData

  const content =
    completion?.choices?.[0]?.message?.content ??
    completion?.response?.choices?.[0]?.message?.content ??
    ''

  return normalizeItinerary(extractJson(content), daysCount)
}

function dedupeExaResults(results: ExaResult[]): ExaResult[] {
  const seen = new Set<string>()
  const out: ExaResult[] = []
  for (const r of results) {
    const key = (r.url || r.title || '').toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(r)
  }
  return out
}

function extractJson(text: string): unknown {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced?.[1]?.trim() ?? trimmed
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as unknown
  } catch {
    return null
  }
}

function normalizeTimeOfDay(raw: unknown, fallbackIndex: number): TimeOfDay {
  const value = String(raw ?? '').toLowerCase().trim()
  if ((TIME_OF_DAY as readonly string[]).includes(value)) return value as TimeOfDay
  return TIME_OF_DAY[fallbackIndex % TIME_OF_DAY.length]!
}

function normalizeItinerary(
  raw: unknown,
  daysCount: number,
): { title: string; summary: string; days: TripDay[] } {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as ItineraryPayload
  const daysIn = Array.isArray(obj.days) ? obj.days : []
  const days: TripDay[] = daysIn.slice(0, daysCount).map((d, i) => ({
    dayIndex: typeof d.dayIndex === 'number' ? d.dayIndex : i + 1,
    title: String(d.title ?? `Day ${i + 1}`).slice(0, 120),
    overview: String(d.overview ?? '').slice(0, 520) || undefined,
    stops: (Array.isArray(d.stops) ? d.stops : [])
      .slice(0, 6)
      .map((s, si) => ({
        name: String(s?.name ?? 'Stop').slice(0, 120),
        note: String(s?.note ?? '').slice(0, 420),
        timeOfDay: normalizeTimeOfDay(s?.timeOfDay, si),
        tip: String(s?.tip ?? '').slice(0, 220) || undefined,
        duration: String(s?.duration ?? '').slice(0, 40) || undefined,
        url: typeof s?.url === 'string' && s.url.startsWith('http') ? s.url : undefined,
      }))
      .filter((s) => s.name),
  }))

  return {
    title: String(obj.title ?? 'Trip sketch').slice(0, 120),
    summary: String(obj.summary ?? '').slice(0, 520),
    days,
  }
}

function base64ToBlob(raw: string, mimeType: string): Blob {
  const stripped = raw.startsWith('data:') ? (raw.split(',', 2)[1] ?? '') : raw
  const binary = atob(stripped)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mimeType })
}
