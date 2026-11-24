import type { CollectionSchema } from 'deepspace/schema'

/**
 * One trip = one generation. Itinerary days live in `itineraryJson`
 * so we avoid a second collection for a finishable MVP.
 *
 * `visibilityField` + read: 'published' lets anonymous visitors load
 * shared trips without a privileged public API.
 */
export const tripsSchema: CollectionSchema = {
  name: 'trips',
  visibilityField: 'visibility',
  columns: [
    { name: 'title', storage: 'text', interpretation: 'plain' },
    { name: 'destination', storage: 'text', interpretation: 'plain' },
    {
      name: 'vibe',
      storage: 'text',
      interpretation: { kind: 'select', options: ['foodie', 'outdoors', 'culture', 'chill'] },
    },
    { name: 'daysCount', storage: 'number', interpretation: 'plain' },
    {
      name: 'status',
      storage: 'text',
      interpretation: {
        kind: 'select',
        options: ['draft', 'generating', 'ready', 'failed'],
      },
    },
    { name: 'statusMessage', storage: 'text', interpretation: 'plain' },
    { name: 'progress', storage: 'number', interpretation: 'plain' },
    { name: 'summary', storage: 'text', interpretation: 'plain' },
    { name: 'itineraryJson', storage: 'text', interpretation: { kind: 'json' } },
    { name: 'sourcesJson', storage: 'text', interpretation: { kind: 'json' } },
    { name: 'coverKey', storage: 'text', interpretation: 'plain' },
    { name: 'shareSlug', storage: 'text', interpretation: 'plain' },
    { name: 'jobId', storage: 'text', interpretation: 'plain' },
    { name: 'failureReason', storage: 'text', interpretation: 'plain' },
    {
      name: 'visibility',
      storage: 'text',
      interpretation: { kind: 'select', options: ['private', 'public'] },
    },
  ],
  permissions: {
    // Anonymous (`*` / viewer): only visibility === 'public'
    '*': { read: 'published', create: false, update: false, delete: false },
    viewer: { read: 'published', create: false, update: false, delete: false },
    // Members: own trips (any status) OR anyone's public sketches
    member: { read: 'published', create: true, update: 'own', delete: 'own' },
    admin: { read: true, create: true, update: true, delete: true },
  },
}
