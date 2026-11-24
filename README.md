# TripSketch

Turn a **destination + vibe** into a researched day-by-day itinerary with a generated travel cover — built on the [DeepSpace](https://docs.deep.space/) SDK.

**Live:** `https://tripsketch.app.space` (after deploy)

## Important path

1. Sign in  
2. **New sketch** → destination, vibe, days  
3. Watch live progress (search → plan → cover)  
4. Open the itinerary and copy the public share link (`/s/:slug`)

## DeepSpace pieces

| Piece | Role |
|-------|------|
| Auth | Sign-in required to generate |
| `trips` schema + `useQuery` | Live trip library and detail |
| JobRoom `generate-trip` | Durable pipeline with progress |
| Integrations | `exa/search`, `openai/chat-completion`, `gemini/generate-image` |
| R2 (`appFiles`) | Public cover images |
| `visibility` / published | Anonymous share pages |

## Develop

```bash
npm install
npx deepspace auth login
npx deepspace app init
npx deepspace dev start
```

Deploy (clean git tree required):

```bash
git add -A && git commit -m "…"
npx deepspace deploy
```

## Submission notes

See [SUBMISSION.md](./SUBMISSION.md) for the portal writeup draft and your personal verification checklist.
