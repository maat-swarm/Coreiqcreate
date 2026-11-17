# COREIQ — UPDATES DOCUMENT
# Version: 1.0 | Author: Desmond | Node: T-BUG
# This is the running changelog of updates pushed to CoreIQ.
# Every time something changes about the product, pricing, capabilities,
# or operations — it gets logged here so CoreIQ stays current.
# Format: [DATE] [CATEGORY] — Description

---

## HOW TO USE THIS FILE

When anything changes that CoreIQ needs to know:
1. Add a new entry at the TOP of the changelog below
2. Use the format: [YYYY-MM-DD] [CATEGORY] — What changed
3. Push to GitHub — CoreIQ reads this on next server restart

Categories:
- CAPABILITY — new thing CoreIQ can now build or offer
- PRICING — any pricing changes or new structures
- PROCESS — how jobs are handled has changed
- TOOL — a new tool has been added or removed from the stack
- POLICY — a rule or boundary has changed
- KNOWLEDGE — new information CoreIQ needs to know
- FIX — something was wrong, now corrected

---

## CHANGELOG

[2026-09-18] [CAPABILITY] — CoreIQ AI is now live and responding on the website.
Real Groq AI (openai/gpt-oss-120b) powers all client conversations.

[2026-09-18] [KNOWLEDGE] — Agent Brain files created: BRAIN.md, ROUTING.md,
KNOWLEDGE.md, RESPONSES.md, MEMORY.md, UPDATES.md. CoreIQ now reads these
at startup for full operational context.

[2026-09-18] [TOOL] — Mem0 selected as shared memory provider between
CoreIQ and Claude Code. MEM0_API_KEY needs to be added to Render env vars
before memory integration is live.

[2026-09-18] [PROCESS] — Three-tier job classification system established:
Tier 1 (Easy/AI tools), Tier 2 (Medium/Swarm builds), Tier 3 (Hard/Full architecture).
CoreIQ classifies invisibly. Client never sees the tiers.

[2026-09-16] [CAPABILITY] — /api/ask endpoint deployed on Render.
Frontend coreiqRuntime.ts now calls live backend instead of local fake runtime.

[2026-09-16] [TOOL] — Groq model updated from deprecated llama-3.3-70b-versatile
to openai/gpt-oss-120b. Previous model was decommissioned August 2026.

---

## PENDING ITEMS (not yet live — do not tell clients)

- Mem0 integration: spec written, API key not yet added, code not yet written
- HeroMascot: visual for homepage hero section still unresolved
- Render cold start: free tier sleeps after 15 min inactivity — decision pending
  on upgrade to paid instance ($7/month) to keep CoreIQ always awake
- KNOWLEDGE.md needs updating when new pages or features go live on the website

---

*CoreIQ Updates Document v1.0 — maintained by Desmond and the CoreIQ Swarm*
*Add new entries at the TOP of the changelog. Never delete old entries.*
