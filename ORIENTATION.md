# TripSketch orientation (live-coding cheat sheet)

## Mental model (say this out loud)

> The UI calls `startTripGenerate` → that action creates a `trips` row and enqueues a `generate-trip` job → the job calls Exa, then OpenAI, then Gemini, uploads the cover to R2, and updates the trip record → the UI watches the trip with `useQuery` so progress appears without refresh.

## Files that matter

| File | Why |
|------|-----|
| `src/schemas/trips-schema.ts` | Columns + RBAC (`published` for share links) |
| `src/actions/index.ts` | Auth + daily cap + create trip + `enqueueJob` |
| `src/server/jobs/generateTripJob.ts` | The three integrations + progress patches |
| `src/jobs.ts` | Dispatches `generate-trip` |
| `src/integrations.ts` | Owner-pays billing for exa/openai/gemini |
| `src/pages/(app)/(protected)/trips/new.tsx` | Form that starts generation |
| `src/pages/(app)/(protected)/trips/[id]/index.tsx` | Live progress + ready/failed UI |
| `src/pages/(app)/s/[slug].tsx` | Public share reader |

## Why each integration

1. **Exa** — real sources so the plan isn’t pure hallucination.  
2. **OpenAI chat** — turns sources into structured days/stops JSON.  
3. **Gemini image** — creative cover; optional if it fails (itinerary still ships).

## Why JobRoom (not a long HTTP request)

Generation can take longer than a single Worker request/`waitUntil` window. JobRoom persists the job, broadcasts progress, and can retry.

## Why share is separate

Members only update **own** trips. Public readers use `visibility: 'public'` + `read: 'published'` (and `*` for anonymous) so strangers can open `/s/:slug` without listing private drafts.

## Quiz (answer before the live session)

1. Where does a generate click start, and where does the itinerary land?  
2. What happens if Gemini fails but Exa + OpenAI succeed?  
3. If asked live to add a fifth vibe, which two places do you touch?
