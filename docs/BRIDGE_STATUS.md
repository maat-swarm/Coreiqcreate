# CoreIQ CRM Bridge — Inspection Status (Step 0)

## 1. Where Leads Are Created
1. **/ask Chat Flow (Client-side)**:
   - `src/pages/Ask.tsx`: Inside `sendQuery()`, calls `CoreIQData.insertLead()` with client_name ("Anonymous Creator"), client_contact ("inbound@coreiq.dev"), client_message, conversation_summary, intent_type (tab category), status ("new"), and full_conversation turns. Updates the existing lead on subsequent turns.
2. **/api/ask Endpoint (Server-side)**:
   - `server.ts`: At line 4618, when conversation history length is >= 2, automatically inserts a record into the `leads` table with client_name ("Website Visitor"), client_message, conversation_summary, intent_type ("custom"), source ("ask_page"), status ("new").
3. **/api/v1/leads (REST API)**:
   - `server.ts`: Authenticated endpoint (`WRITE_LEADS` scope) accepts `client_name`, `client_contact`, `client_message`, `conversation_summary`, `intent_type`, `source`, `budget_range`, `notes`. Inserts into Supabase `leads` or falls back to in-memory `localStore.leads`.
4. **Store App Requests**:
   - `server.ts`: `app.post('/api/v1/store/apps/:slug/request')` records a request in `app_requests` and calls `recordStoreLead(...)`, which creates a lead row in `leads` table with `source: 'app_request_<slug>'` and `intent_type: 'app_store'`.
5. **CoreIQ MCP Tool**:
   - `src/mcp/coreiqMcp.ts`: `create_lead` tool calls `executeCoreIQTool('create_lead', args)` which inserts into `leads`.

## 2. Real `leads` Table Columns (Supabase)
As verified in `supabase/schema.sql` and `src/types/command.ts`:
- `id`: TEXT PRIMARY KEY
- `created_at`: TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
- `source`: TEXT DEFAULT 'website' NOT NULL
- `client_name`: TEXT NOT NULL
- `client_contact`: TEXT NOT NULL
- `client_message`: TEXT
- `conversation_summary`: TEXT
- `intent_type`: TEXT DEFAULT 'custom'
- `status`: TEXT DEFAULT 'new' NOT NULL
- `full_conversation`: JSONB
- `client_id`: TEXT
- `budget_range`: TEXT
- `notes`: TEXT

### Required Nullable Bridge Columns to Add (Step 2)
- `session_id`: TEXT (NULLABLE, indexed)
- `crm_client_id`: TEXT (NULLABLE)
- `crm_client_code`: TEXT (NULLABLE)
- `crm_synced_at`: TIMESTAMPTZ (NULLABLE)
- `crm_skipped_reason`: TEXT (NULLABLE)

## 3. How Ask Sends History to /api/ask
- The client-side runtime `src/services/coreiqRuntime.ts` contains `RemoteCoreIQRuntime.analyzeIntent(prompt)`.
- It executes `fetch(`${API_BASE}/api/ask`, { method: 'POST', body: JSON.stringify({ message: prompt, history: this.history }) })`.
- `this.history` tracks an array of `{ role: 'user' | 'assistant', content: string }` representing the ongoing dialog.
- The server receives `{ message, history = [], session_id }`, executes model completion via Groq or Gemini fallback, and records the conversation turn.

## 4. Vercel.json Rewrites
Inspected `/vercel.json`:
- Contains rule: `{"source": "/api/v1/:path*", "destination": "https://coreiqcreate.onrender.com/api/v1/:path*"}`
- Contains rule: `{"source": "/api/:path*", "destination": "https://coreiqcreate.onrender.com/api/:path*"}`
- Because `/api/v1/:path*` is a wildcard match, all routes under `/api/v1/public/*`, `/api/v1/crm-bridge/*`, and `/api/v1/admin/crm-bridge/*` are automatically forwarded to Render. No additional rules are needed.
