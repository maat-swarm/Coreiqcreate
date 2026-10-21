# CoreIQ CRM Bridge — Inspection Status (Step 0)

Date: 2026-10-21  
Target CRM Endpoint: `https://coreiqcreate-crm.onrender.com/api/v1/intake`

---

## 1. Where Leads Are Created Today

| Surface / Flow | Location | Mechanism | CRM Bridge Status Before |
| :--- | :--- | :--- | :--- |
| **Ask CoreIQ AI Chat** | `/api/ask` in `server.ts:4668` | Direct insert to `leads` table if history &ge; 2 turns | Unsynced; no contact info collected in chat |
| **Client Brief Handoff** | `coreiqRuntime.ts:101` | Parses `##BRIEF##` from assistant, creates task in Command | Unsynced; created as internal task only |
| **Store App Request** | `POST /api/v1/store/apps/:slug/request` (`server.ts:4348`) | Calls `recordStoreLead()`, writes to `app_requests` & `leads` | Needs CRM bridge enqueue on consent |
| **Store Free App Download**| `POST /api/v1/store/apps/:slug/get` (`server.ts:4292`) | Calls `recordStoreLead()` | Unsynced |
| **Machine / REST API** | `POST /api/v1/leads` (`server.ts:1278`) | Writes directly to `leads` | Unsynced |
| **MCP Tool (`create_lead`)**| `src/mcp/coreiqMcp.ts:530` | Writes directly to `leads` | Unsynced |
| **Registry Tool (`site_leads_create`)** | `src/server/registryExecution.ts:1496` | Writes directly to `leads` | Unsynced |
| **Command Inbox Test Lead**| `CommandInboxTab.tsx:89` | Calls `CoreIQData.insertLead()` | Manual test simulation |

---

## 2. Existing Schema for `public.leads`

From `supabase/schema.sql` and `server.ts`:
- `id` (text, primary key)
- `created_at` (timestamptz, default now())
- `source` (text, default 'website')
- `client_name` (text, not null)
- `client_contact` (text, not null)
- `client_message` (text, nullable)
- `conversation_summary` (text, nullable)
- `intent_type` (text, default 'custom')
- `status` (text, default 'new')
- `full_conversation` (jsonb, nullable)
- `client_id` (text, nullable)
- `budget_range` (text, nullable)
- `notes` (text, nullable)

### Added Nullable Columns (CRM Bridge)
- `session_id` (text, nullable, indexed)
- `crm_client_id` (text, nullable)
- `crm_client_code` (text, nullable)
- `crm_synced_at` (timestamptz, nullable)
- `crm_skipped_reason` (text, nullable: e.g. `'no_contact'`, `'no_consent'`)

---

## 3. How /ask Sends History to `/api/ask`

1. **Frontend (`src/services/coreiqRuntime.ts`)**:
   - Maintains `this.history: { role: string; content: string }[]`.
   - Sends `POST /api/ask` with JSON body: `{ message: string, history: this.history }`.
   - Additive enhancement: Include `session_id` (retrieved or generated via `crypto.randomUUID()` in `sessionStorage`).
2. **Backend (`server.ts:4569`)**:
   - Parses `{ message, history = [], session_id } = req.body`.
   - Passes context to agent model.

---

## 4. Vercel Rewrites Analysis (`vercel.json`)

`vercel.json` already defines:
```json
{
  "source": "/api/v1/:path*",
  "destination": "https://coreiqcreate.onrender.com/api/v1/:path*"
},
{
  "source": "/api/:path*",
  "destination": "https://coreiqcreate.onrender.com/api/:path*"
}
```
All routes under `/api/v1/public/*`, including `/api/v1/public/lead-capture`, are **fully covered** by `/api/v1/:path*`. No additional rewrite rules are needed.
