# CoreIQ Create — Access & Integration Status Matrix (Step 0 Inspection)

This document records the current state of Command tabs, write mechanisms, existing REST key-auth routes, and MCP tools prior to adding comprehensive machine access.

## Resource Matrix

| Resource | Command Tab | How Command Writes Today | Existing Key-Auth Routes | Existing MCP Tools |
| :--- | :--- | :--- | :--- | :--- |
| **leads** | Inbox (`CommandInboxTab`) | Server REST (`POST /api/v1/leads`) & direct Supabase client fallback | `GET /api/v1/leads` (`READ_LEADS`), `POST /api/v1/leads` (`WRITE_LEADS`) | `list_leads`, `create_lead` |
| **social_messages** | Inbox (`CommandInboxTab`) | Direct Supabase (`CoreIQData.insertSocialMessage`, `updateSocialStatus`) | None (Operator session only) | None |
| **tasks** | Tasks (`CommandTasksTab`) | Server REST (`POST /api/v1/tasks`) & direct Supabase client fallback | `GET /api/v1/tasks` (`READ_TASKS`), `POST /api/v1/tasks` (`WRITE_TASKS`) | `list_tasks`, `create_task` |
| **clients** | Clients (`CommandClientsTab`) | Server REST (`POST /api/v1/clients`) & direct Supabase client fallback | `GET /api/v1/clients` (`READ_CLIENTS`), `POST /api/v1/clients` (`WRITE_CLIENTS`) | None |
| **agent_config** | Brain (`CommandBrainTab`) | Server REST (`POST /api/v1/config`) & direct Supabase (`CoreIQData.saveAgentConfig`) | `GET /api/v1/config` (`READ_CONFIG`), `POST /api/v1/config` (`WRITE_CONFIG`) | `get_agent_config` |
| **agent_tools** | Brain (`CommandBrainTab`) | Direct Supabase (`CoreIQData.insertAgentTool`, `updateAgentTool`, `deleteAgentTool`) | None (Operator session only) | None |
| **platforms** | Platforms (`CommandPlatformsTab`) | Direct Supabase (`CoreIQData.insertPlatform`, `deletePlatform`) | None (Operator session only) | None |
| **content** (94 keys manifest) | Content (`CommandContentTab`) | Server REST (`PATCH /api/v1/content/:key`, `POST /api/v1/content/:key/publish`) | `GET /api/v1/content` (`READ_CONTENT`), `POST /api/v1/content` (`WRITE_CONTENT`), `GET /api/v1/content/health` (`READ_CONTENT`), `GET /api/v1/content/:key` (`READ_CONTENT`), `PATCH /api/v1/content/:key` (`WRITE_CONTENT`), `POST /api/v1/content/:key/publish` (`PUBLISH_CONTENT`), `GET /api/v1/content/placeholders/:page` (`READ_CONTENT`), `GET /api/v1/content/:key/resolve` (`READ_CONTENT`), `POST /api/v1/content/:key/verify` (`READ_CONTENT`) | `content_health`, `get_content`, `resolve_content`, `verify_content`, `list_placeholders`, `get_all_content`, `get_content_health`, `search_content`, `patch_content`, `publish_content` |
| **use_case_categories** | Use Cases (`CommandUseCasesTab`) | Direct Supabase (`use_case_categories` table) / read via public `GET /api/v1/use-cases/categories` | None for admin mutations (Public read only) | None |
| **use_cases** | Use Cases (`CommandUseCasesTab`) | Server REST (`POST /api/v1/admin/use-cases`, `PATCH /api/v1/admin/use-cases/:id`, `DELETE /api/v1/admin/use-cases/:id`) | Operator session only (`authenticateApiKey` without scope gate) | None |
| **use_case_files** | Use Cases (`CommandUseCasesTab`) | Server REST (`POST /api/v1/use-cases/:id/files`, `DELETE /api/v1/use-cases/:id/files/:fileId`) | Operator session only | None |
| **news_articles** | News (`CommandNewsTab`) | Server REST (`POST /api/v1/admin/news`, `PATCH /api/v1/admin/news/:id`, `DELETE /api/v1/admin/news/:id`) | Operator session only | None |
| **store tables** (`store_apps`, `app_requests`, `app_access_links`, `app_downloads`, `store_settings`) | Store (`CommandStoreTab`) | Server REST (`/api/v1/store/apps`, `/api/v1/store/requests`, `/api/v1/store/settings`, `/api/v1/store/stats`) | Borrowed `READ_MEDIA` / `WRITE_MEDIA` scopes, no dedicated `READ_STORE`/`WRITE_STORE` | None |
| **media_slots & items** | Upload / Media Slots (`CommandUploadTab`) | Server REST (`/api/v1/media/slots`) | `READ_MEDIA`, `WRITE_MEDIA` | None |
| **swarm_comms** | Swarm (`CommandSwarmTab`) | Direct Supabase (`CoreIQData.getSwarmComms`, `insertSwarmMessage`) | None (Operator session only) | None |
| **analytics** | Analytics (`CommandAnalyticsTab`) | Computed client-side from `leads`, `social_messages`, `tasks` queries | None | None |
| **api_keys** | API Keys (`CommandApiKeysTab`) | Direct Supabase client (`CoreIQData.getApiKeys`, `insertApiKey`, `revokeApiKey`, `deleteApiKey`) | None | None |

## Other Public Surfaces Edited in Command

1. **site_tools** (Tools Page Catalog Cards):
   - Managed in `CommandToolsTab` via `src/services/siteToolsAdmin.ts`.
   - Routes exist at `/api/v1/site-tools` but currently require `READ_MEDIA` and `WRITE_MEDIA` instead of dedicated `READ_TOOLS` and `WRITE_TOOLS`.
   - No MCP tools currently exist for `site_tools`.

2. **learn guides** (Learning & Blueprint Guides):
   - Managed in `CommandContentTab`.
   - Keys are organized under `learn.guide.*` within the 94-key Universal Content Manifest.
   - Handled via the content API routes and MCP tools (`patch_content`, `publish_content`, etc.).
