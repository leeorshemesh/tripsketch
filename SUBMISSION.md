# TripSketch — internship build writeup (draft)

**Live URL:** https://tripsketch.app.space  
**Repository:** https://github.com/leeorshemesh/tripsketch  
**(Also on DeepSpace cloud `space` remote for deploys — app id `app_01M87ZRJVHF4MG6VG6X7DN8K2M`)**

## What I built

TripSketch turns a **destination + vibe + day count** into a researched day-by-day itinerary with a generated travel cover image and a public share link. The important path is: sign in → create sketch → watch live generation progress → open itinerary → copy share URL.

## DeepSpace integrations used

1. **`exa/search`** — real web sources for the destination/vibe (not invented places alone).
2. **`openai/chat-completion`** — structures those sources into a JSON itinerary.
3. **`gemini/generate-image`** — cover art for the trip mood.

Platform primitives (not reinvented): Auth, RecordRoom schemas/`useQuery`, JobRoom/`enqueueJob` with live progress, R2 via `appFiles` for covers, integration proxy (no provider API keys in the repo).

## Main tradeoff

I chose a **single search → one LLM pass → one image** pipeline over a longer multi-agent loop, maps, Stripe credits, or multiplayer editing. That keeps generation fast and finishable in the submission window while still showing jobs, realtime records, and three integrations that each change the product. Quality depends on search hits + one model pass; unfinished edges I’d do next: per-stop re-roll, weather/dates, map pins.

## What the agent did vs what I verified

- **Agent:** scaffolded the DeepSpace app, schemas, generate-trip job, actions (daily cap), UI (landing/home/new/detail/share), theme, writeup draft.
- **I verified (checklist):**
  - [ ] Sign in / out on the live URL
  - [ ] Generate a real trip; progress updates without refresh
  - [ ] Cover image + day structure + source links
  - [ ] Share link works in an anonymous/private window
  - [ ] No secrets (`.dev.vars`, session) committed
  - [ ] I can explain the job pipeline and why each integration exists in ~1 minute
