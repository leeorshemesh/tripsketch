/** Shared trip domain types — used by UI, actions, and the generate job. */

export const TRIP_VIBES = ['foodie', 'outdoors', 'culture', 'chill'] as const
export type TripVibe = (typeof TRIP_VIBES)[number]

export const TRIP_STATUSES = ['draft', 'generating', 'ready', 'failed'] as const
export type TripStatus = (typeof TRIP_STATUSES)[number]

export interface TripStop {
  name: string
  note: string
  url?: string
}

export interface TripDay {
  dayIndex: number
  title: string
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

export const VIBE_LABELS: Record<TripVibe, string> = {
  foodie: 'Foodie',
  outdoors: 'Outdoors',
  culture: 'Culture',
  chill: 'Chill',
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
