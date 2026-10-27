# CoreIQ Create — CRM Bridge Architecture & Operational Guide

The **CRM Bridge** connects the CoreIQ Create public website with the CoreIQ CRM system hosted at `https://coreiqcreate-crm.onrender.com`.

---

## 1. CRM Intake Contract

### Target Endpoint
- **URL**: `POST https://coreiqcreate-crm.onrender.com/api/v1/intake` (configured via `CRM_INTAKE_URL`)
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <CRM_INTAKE_KEY>`
- **Timeout**: 65 seconds (accommodating Render cold-wake latency ~50s)

### Request Payload (`CrmPayload`)
| Field | Type | Description / Rules |
| :--- | :--- | :--- |
| `source` | `string` | Origin identifier (e.g. `coreiq-website`, `coreiq-website-ask`, `coreiq-website-app-request`, `coreiq-website-test`). |
| `session_id` | `string` | Unique session UUID (`crypto.randomUUID`) or identifier (e.g. `app-request-<id>`). |
| `name` | `string` | Full name of the prospect/visitor. Required. |
| `email` | `string \| null` | Trimmed, lowercased email address. |
| `phone` | `string \| null` | Normalized E.164 phone number with South Africa (`+27`) default prefix. |
| `company` | `string \| null` | Organization or studio name if provided. |
| `summary` | `string` | Executive inquiry overview or project blueprint synopsis (max 1200 chars). |
| `intent` | `string` | One of `website`, `app`, `automation`, `agent`, `voice`, or `unknown`. Derived from keyword classification. |
| `budget_hint` | `string \| null` | Budget tier or estimated investment range if indicated. |
| `page_url` | `string \| null` | URL where the inquiry was submitted. |
| `consent` | `boolean` | Must be strictly `true`. Inquiries without consent are not sent. |
| `transcript` | `Array<{ role, text, at }>` | Last 40 turns with HTML stripped and sensitive tokens redacted. `role` is `'visitor'` or `'assistant'`. Max 2000 chars per turn. |
| `honeypot` | `string` | Must be empty string `""`. If filled, discarded immediately with HTTP 200. |

### Redaction Rules
Before transmission, all transcript entries are sanitized to redact:
- API Keys: `ciq_live_*`
- OpenAI / LLM Keys: `sk-*`
- JSON Web Tokens: `eyJ*`
- Credentials: Any text following `password:` or `token:`

### Response Schema
```json
{
  "client_id": "c1a94e23-...",
  "code": "CIQ-C-0104",
  "stage": "inbound",
  "engagement_id": "eng_..."
}
```

The CRM dedupes inbound leads by email, then phone number. Submissions sharing the same `session_id` append conversation history rather than duplicating client records.

---

## 2. Server Environment Variables

| Variable | Required | Description |
| :--- | :--- | :--- |
| `CRM_INTAKE_URL` | No | Full target intake URL (defaults to `https://coreiqcreate-crm.onrender.com/api/v1/intake`). |
| `CRM_INTAKE_KEY` | Recommended | Bearer secret token authorized for the CRM intake route. |

### Behavior When Unconfigured
If `CRM_INTAKE_KEY` or `CRM_INTAKE_URL` is omitted:
- Bridge health status reports `configured: false`.
- Inbound inquiries and leads continue saving to Supabase (`leads` table) normally.
- Outbox rows are safely queued as `status: 'pending'` without raising unhandled errors.
- Visitors receive standard confirmation without disruption.

---

## 3. Transmission Flow in Words

1. **Visitor Intake Trigger**:
   - On `/ask`: After CoreIQ synthesizes an architecture response containing blueprint markers (`INTENT`, `BLUEPRINT`, `MILESTONES`, `CAPABILITIES`), a "Take this forward" card allows the user to submit their name, contact details, and explicit consent.
   - On Store Apps: When submitting an app order or access request form, the user checks the mandatory consent checkbox.
2. **Client Submission**:
   - The frontend submits an HTTP POST to `/api/v1/public/lead-capture` with `session_id`, sanitized details, and transcript.
3. **Ingestion & Validation**:
   - Rate limiting validates that the IP does not exceed 10 req/min and the session does not exceed 30 req/hour.
   - Honeypot check: If the hidden honeypot contains text, HTTP 200 `{ ok: true }` is returned instantly and the payload is discarded.
   - Contact check: At least one valid email or phone number is required.
   - Consent check: If `consent` is false, the lead is stored with `crm_skipped_reason: 'no_consent'` and is not queued.
4. **Outbox Enqueuing**:
   - If contact and consent are present, payload is built and upserted into `crm_outbox` by `session_id`.
   - If the row was previously marked `sent` and updated with new turns, its status reverts to `pending` with a 60-second debounce.
5. **Outbox Worker**:
   - `processOutbox(limit: 10)` runs immediately in background (fire-and-forget), every 60 seconds via server interval, and on-demand via the Command dashboard.
   - Rows are claimed using a 5-minute lease (`lease_until`) to prevent race conditions or duplicate sends across concurrent workers.
   - Transmission executes with Bearer authorization and a 65-second HTTP timeout.
6. **Resolution**:
   - **On 2xx Success**: Status updates to `sent`. `crm_client_id` and `crm_client_code` are saved to the outbox row and synced to the corresponding `leads` record.
   - **On Visitor Continuation**: After details are captured, any subsequent assistant replies on `/ask` automatically trigger an update 5 seconds later.

---

## 4. Failure Modes & Exponential Backoff

| HTTP Status / Condition | Outbox Status | Retry Schedule | Behavior |
| :--- | :--- | :--- | :--- |
| **200 - 299** | `sent` | None | Success. Synced with CRM client code. |
| **400, 401, 403, 404, 422** | `dead` | None | Non-transient client error. Marked dead with truncated error message. |
| **408, 429, 500, 502, 503, 504** | `pending` | Exponential Backoff | Transient error or rate limit. Rescheduled according to backoff table. |
| **Network Timeout / Abort** | `pending` | Exponential Backoff | Server or network cold-boot delay. Rescheduled according to backoff table. |

### Retry Backoff Schedule
1. Attempt 1 failure: `now + 30 seconds`
2. Attempt 2 failure: `now + 2 minutes`
3. Attempt 3 failure: `now + 10 minutes`
4. Attempt 4 failure: `now + 1 hour`
5. Attempt 5 failure: `now + 6 hours`
6. Attempt 6 failure: Marked `dead` (exceeded maximum attempts)

### Lease Expiration Recovery
If an outbox processor worker crashes or restarts while rows are in `sending` state, any row whose `lease_until` has lapsed is automatically reclaimed and returned to `pending` on the next interval.

---

## 5. How to Replay a Dead Row

When a transmission reaches `dead` status (due to network outage or temporary authorization misconfiguration), it can be manually re-queued:

### Option A: Via CoreIQ Command UI (Recommended)
1. Navigate to `/command` and select the **Inbox** tab.
2. Locate the **CRM Bridge Control Surface** card at the top.
3. In the Outbox Queue list, dead rows feature a red status badge and a **Replay** button.
4. Click **Replay**. The row is instantly reset to `status: 'pending'`, attempts are reset to 0, and `next_attempt_at` is set to the current time.
5. Click **Run now** to trigger immediate processing.

### Option B: Via Admin API Endpoint
Issue an authenticated POST request with `WRITE_CONFIG` scope:
```bash
curl -X POST https://coreiqcreate.com/api/v1/admin/crm-bridge/replay/<OUTBOX_ROW_OR_SESSION_ID> \
  -H "Authorization: Bearer <COREIQ_API_KEY>" \
  -H "Content-Type: application/json"
```

Response:
```json
{
  "ok": true,
  "message": "Outbox row queued for retry",
  "id": "c1000000-0000-4000-8000-000000000001",
  "status": "pending"
}
```
