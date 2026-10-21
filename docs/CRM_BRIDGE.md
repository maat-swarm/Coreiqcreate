# CoreIQ CRM Bridge Documentation

## Overview
The CRM Bridge connects the CoreIQ Create customer-facing website with the CoreIQ CRM system hosted at `https://coreiqcreate-crm.onrender.com`. When prospective clients express interest via `/ask` conversation blueprints or Store App Requests, their contact details, inquiry intent, project summary, and sanitized transcripts are captured server-side and reliably synchronized to the CRM's intake API via a resilient outbox pattern.

---

## 1. Environment Variables

| Variable | Scope | Required | Description |
|---|---|---|---|
| `CRM_INTAKE_URL` | Server only | Yes (for active sync) | Target endpoint for CRM intake, e.g. `https://coreiqcreate-crm.onrender.com/api/v1/intake` |
| `CRM_INTAKE_KEY` | Server only | Yes (for active sync) | Secret bearer token for authorizing requests to the CRM intake API |

**Security Note:** These keys live strictly in server environment variables on Render/Node.js. They are **never** included in Vite client-side builds, git repositories, client responses, or server logs.

If either variable is missing, the bridge operates in an unconfigured state: lead capture continues normally on the website, local leads are saved, and outbox rows accumulate in a safe `pending` state awaiting future configuration.

---

## 2. CRM Intake Contract

### Endpoint
`POST /api/v1/intake`
Headers:
- `Content-Type: application/json`
- `Authorization: Bearer <CRM_INTAKE_KEY>`

### Request Payload Schema
```json
{
  "source": "coreiq-website" | "coreiq-website-app-request" | "coreiq-website-test",
  "session_id": "c62efd44-6729-4c12-98aa-f19e4a31742f",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+27821234567",
  "company": "Acme Corp",
  "summary": "Building an automated inventory tracking portal...",
  "intent": "website" | "app" | "automation" | "agent" | "voice" | "unknown",
  "budget_hint": null,
  "page_url": "https://create.coreiq.co.za/ask",
  "consent": true,
  "transcript": [
    {
      "role": "visitor",
      "text": "Can you build a field inspection app?",
      "at": "2026-10-21T14:00:00.000Z"
    },
    {
      "role": "assistant",
      "text": "Yes, we can build a mobile app with offline capture...",
      "at": "2026-10-21T14:00:05.000Z"
    }
  ],
  "honeypot": ""
}
```

### Data Transformations & Normalization
1. **Source**: Default `"coreiq-website"`. For store requests: `"coreiq-website-app-request"`.
2. **Email**: Trimmed and lowercased.
3. **Phone**: Normalized to E.164. South African 10-digit numbers (`082...`, `07...`, `01...`) automatically default to the `+27` country code (`+27821234567`).
4. **Intent Detection**: Analyzed by keyword matching against conversation summary:
   - `website`: `website`, `site`, `landing`
   - `app`: `app`, `mobile`, `ios`, `android`
   - `automation`: `automat`, `workflow`, `pipeline`, `zapier`, `integromat`, `webhook`
   - `agent`: `agent`, `chatbot`, `assistant`, `bot`, `ai rep`
   - `voice`: `voice`, `call`, `reception`, `telephon`, `phone agent`
   - Default: `unknown`
5. **Transcript Limits & Hygiene**:
   - Truncated to the last 40 dialogue turns.
   - Each turn text is clipped to a maximum of 2,000 characters.
   - HTML tags are stripped.
   - Sensitive tokens are scrubbed: `ciq_live_*` API keys, OpenAI/Anthropic `sk-*` keys, JWT tokens starting with `eyJ`, and passwords matching `password: ...`.
6. **Summary**: Clipped to 1,200 characters.

### CRM Response Schema
```json
{
  "client_id": "c1f7b98d-a78b-4f9e-a864-123456789abc",
  "code": "CIQ-C-1042",
  "stage": "inbound",
  "engagement_id": "eng_8273648"
}
```
The CRM dedupes contacts by email then phone number. Submissions bearing the same `session_id` append transcript history and update client records without creating duplicate leads.

---

## 3. End-to-End Flow

```
[ Visitor on /ask ]
       │
       ▼ (Generates blueprint)
[ "Take this forward" card ] ──(Fills details & ticks consent)
       │
       ▼ POST /api/v1/public/lead-capture (10/min, 30/hr rate limit)
[ Express API Server ]
       ├─► Insert/Upsert into `leads` table (local website inbox)
       └─► Upsert into `crm_outbox` (status: 'pending', session_id keyed)
             │
             ▼ (Fire-and-forget trigger & 60s background interval)
       [ crmBridge.processOutbox() ]
             ├─ Claim rows (`status: sending`, 5-min lease)
             ├─ POST CRM /api/v1/intake (65s timeout)
             ├─ 2xx Success:
             │    ├─ Set outbox `status: sent`, save client_id and code
             │    └─ Update `leads` with `crm_client_id`, `crm_client_code`, `crm_synced_at`
             └─ Errors: Handle retry backoff or mark dead
```

---

## 4. Failure Modes & Resilience

### 1. CRM Service Sleep / Cold Starts
Render free-tier instances spin down when inactive and can take up to 50–55 seconds to boot.
- The outbound HTTP request timeout is configured to **65 seconds** to accommodate cold boot times without dropping payloads.
- Background worker processes rows asynchronously so visitors on the website receive immediate sub-second confirmation.

### 2. Network Errors & Retries (5xx, 408, 429, Timeouts)
- If the CRM returns a server error, is rate limited, or times out, the outbox record increments `attempts` and schedules an exponential backoff retry:
  - Attempt 1: +30 seconds
  - Attempt 2: +2 minutes
  - Attempt 3: +10 minutes
  - Attempt 4: +1 hour
  - Attempt 5: +6 hours
- After 6 failed attempts, the record transitions to `status: 'dead'`.

### 3. Non-Retryable Client Errors (4xx except 408 & 429)
- Permanent errors (e.g. 400 Bad Request, 422 Unprocessable Entity) mark the outbox row as `status: 'dead'` immediately without wasting retries.
- The error message is truncated and recorded in `last_error`.

### 4. Lease Expiration
- To prevent duplicate concurrent dispatches across multiple server instances or restarts, workers claim rows with a 5-minute lease (`lease_until`).
- If an instance crashes mid-flight, expired leases are automatically returned to `status: 'pending'` on the next worker cycle.

---

## 5. Replaying a Dead Row

When a row is marked `dead` (due to exceeding max retries or a transient schema issue that has been resolved):

### Option A: From Command UI (Recommended)
1. Sign in as Owner to CoreIQ Command.
2. Navigate to **Inbox & Leads**.
3. View the **CRM Bridge** control card.
4. Locate the dead entry in the Outbox monitor table.
5. Click **Run Outbox Now** (or re-submit if an action button is enabled).

### Option B: Via Admin API Endpoint
Send an authorized POST request using your Command Bearer token:
```bash
curl -X POST https://create.coreiq.co.za/api/v1/admin/crm-bridge/run \
  -H "Authorization: Bearer <COMMAND_ACCESS_TOKEN>" \
  -H "Content-Type: application/json"
```

### Option C: Direct Database SQL Update
If direct Supabase access is available:
```sql
UPDATE public.crm_outbox
SET status = 'pending',
    attempts = 0,
    next_attempt_at = NOW(),
    lease_until = NULL,
    last_error = NULL
WHERE session_id = '<target-session-id>';
```
The background outbox worker will claim and re-dispatch the payload within 60 seconds.
