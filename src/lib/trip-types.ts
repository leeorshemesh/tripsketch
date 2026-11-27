/** Shared trip domain types — used by UI, actions, and the generate job. */

export const TRIP_VIBES = [
  'foodie',
  'outdoors',
  'culture',
  'chill',
  'romance',
  'nightlife',
  'family',
  'adventure',
] as const
export type TripVibe = (typeof TRIP_VIBES)[number]

export const TRIP_PACES = ['relaxed', 'balanced', 'packed'] as const
export type TripPace = (typeof TRIP_PACES)[number]

export const TIME_OF_DAY = ['morning', 'afternoon', 'evening'] as const
export type TimeOfDay = (typeof TIME_OF_DAY)[number]

export const TRIP_STATUSES = ['draft', 'generating', 'ready', 'failed'] as const
export type TripStatus = (typeof TRIP_STATUSES)[number]

export interface TripStop {
  name: string
  note: string
  url?: string
  /** When in the day this stop fits — drives the itinerary timeline UI. */
  timeOfDay?: TimeOfDay
  /** Practical tip (transit, booking, what to order, etc.). */
  tip?: string
  /** Rough time to spend, e.g. "1–2 hrs". */
  duration?: string
}

export interface TripDay {
  dayIndex: number
  title: string
  /** 2–3 sentences describing how the day flows — the “what it feels like”. */
  overview?: string
  stops: TripStop[]
}

export interface TripSource {
  title: string
  url: string
}

export interface TripRecord {
  title: string
  destination: string
  vibe: TripVibe | string
  pace: TripPace | string
  daysCount: number
  status: TripStatus | string
  statusMessage: string
  progress: number
  summary: string
  itineraryJson: TripDay[] | string
  sourcesJson: TripSource[] | string
  coverKey: string
  shareSlug: string
  jobId: string
  failureReason: string
  visibility: 'private' | 'public' | string
}

export const DAILY_GENERATE_LIMIT = 8

/** Upper bound for one generation — long enough for 2-week trips, still one LLM pass. */
export const MAX_TRIP_DAYS = 14
export const MIN_TRIP_DAYS = 1

export const VIBE_LABELS: Record<TripVibe, string> = {
  foodie: 'Foodie',
  outdoors: 'Outdoors',
  culture: 'Culture',
  chill: 'Chill',
  romance: 'Romance',
  nightlife: 'Nightlife',
  family: 'Family',
  adventure: 'Adventure',
}

export const VIBE_BLURBS: Record<TripVibe, string> = {
  foodie: 'Markets, signature dishes, neighborhood eats',
  outdoors: 'Parks, trails, viewpoints, fresh air',
  culture: 'Museums, history, local arts',
  chill: 'Cafés, slow walks, soft evenings',
  romance: 'Sunset spots, intimate dinners, ambiance',
  nightlife: 'Bars, live music, late energy',
  family: 'Kid-friendly, easy logistics, shared fun',
  adventure: 'Active days, thrills, bigger moves',
}

export const PACE_LABELS: Record<TripPace, string> = {
  relaxed: 'Relaxed',
  balanced: 'Balanced',
  packed: 'Packed',
}

export const PACE_BLURBS: Record<TripPace, string> = {
  relaxed: '2–3 stops, breathing room, lingering',
  balanced: '3–4 stops, classic day shape',
  packed: '4–5 stops, maximize the city',
}

export const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
}

/** Stops per day guidance baked into the LLM prompt. */
export const PACE_STOP_GUIDANCE: Record<TripPace, string> = {
  relaxed: '2-3 stops per day with generous time between them',
  balanced: '3-4 stops per day with a natural morning → afternoon → evening arc',
  packed: '4-5 stops per day, still realistic about travel time between them',
}

export function parseItinerary(value: TripRecord['itineraryJson']): TripDay[] {
  if (Array.isArray(value)) return value as TripDay[]
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown
      return Array.isArray(parsed) ? (parsed as TripDay[]) : []
    } catch {
      return []
    }
  }
  return []
}

export function parseSources(value: TripRecord['sourcesJson']): TripSource[] {
  if (Array.isArray(value)) return value as TripSource[]
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown
      return Array.isArray(parsed) ? (parsed as TripSource[]) : []
    } catch {
      return []
    }
  }
  return []
}

export function makeShareSlug(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = crypto.getRandomValues(new Uint8Array(10))
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}
