/**
 * OpenAPI 3.0.0 Specification Generator for CoreIQ Create
 * Used by external agents (ORC-GROK, Grok Actions, Swarm Nodes, Custom Connectors)
 * to automatically discover and execute all endpoints and tools.
 */

export function buildOpenApiSpec(baseUrl = 'https://coreiqcreate.onrender.com') {
  return {
    openapi: '3.0.3',
    info: {
      title: 'CoreIQ Create Autonomous API & Swarm Control Plane',
      description:
        'Machine-to-machine interface for CoreIQ Create: Lead ingestion, task orchestration, agent configuration, 94-key Universal Content Manifest management, and Model Context Protocol (MCP) server access.',
      version: '1.2.0',
      contact: {
        name: 'CoreIQ Autonomous Engineering',
        url: 'https://coreiqcreate.onrender.com',
      },
    },
    servers: [
      {
        url: baseUrl,
        description: 'Primary CoreIQ Gateway Surface',
      },
      {
        url: '/',
        description: 'Relative / Localhost Gateway',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API-Key',
          description: 'Pass token as "Bearer ciq_live_..." in Authorization header.',
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'Pass token in x-api-key header.',
        },
      },
      schemas: {
        ContentItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            content_key: { type: 'string', example: 'learn.guide.ai-workflows' },
            key: { type: 'string' },
            title: { type: 'string' },
            summary: { type: 'string' },
            body: { type: 'string' },
            category: { type: 'string' },
            status: { type: 'string', enum: ['PLACEHOLDER', 'DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'] },
            content_type: { type: 'string' },
            slug: { type: 'string' },
            published: { type: 'boolean' },
            version: { type: 'integer' },
            updated_by: { type: 'string' },
            created_at: { type: 'string' },
            updated_at: { type: 'string' },
          },
        },
        ContentHealthReport: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            timestamp: { type: 'string' },
            total_manifest_keys: { type: 'integer', example: 94 },
            published: { type: 'integer' },
            placeholder: { type: 'integer' },
            missing: { type: 'integer' },
            stale: { type: 'integer' },
            overall_health_pct: { type: 'integer' },
            by_page: {
              type: 'object',
              additionalProperties: {
                type: 'object',
                properties: {
                  total: { type: 'integer' },
                  published: { type: 'integer' },
                  placeholder: { type: 'integer' },
                  missing: { type: 'integer' },
                  stale: { type: 'integer' },
                },
              },
            },
          },
        },
        ToolExecutionRequest: {
          type: 'object',
          required: ['tool'],
          properties: {
            tool: { type: 'string', description: 'Name of the tool to execute' },
            arguments: { type: 'object', description: 'Tool arguments' },
          },
        },
      },
    },
    security: [
      { BearerAuth: [] },
      { ApiKeyAuth: [] },
    ],
    paths: {
      '/api/v1/ping': {
        get: {
          summary: 'Ping API Gateway',
          description: 'Basic public status and health check.',
          responses: {
            '200': { description: 'Gateway online' },
          },
        },
      },
      '/api/v1/tools': {
        get: {
          summary: 'List Available Tools',
          description: 'Retrieve discovery registry of all 25 registered tools, descriptions, and required scopes.',
          responses: {
            '200': { description: 'List of tools' },
          },
        },
      },
      '/api/v1/tools/execute': {
        post: {
          summary: 'Execute Tool via REST',
          description: 'Execute any registered tool (coreiq_content_health, coreiq_get_content, coreiq_patch_content, coreiq_publish_content, etc.) over REST.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ToolExecutionRequest' },
              },
            },
          },
          responses: {
            '200': { description: 'Tool execution result' },
            '400': { description: 'Missing tool or invalid args' },
            '401': { description: 'Unauthorized' },
            '403': { description: 'Forbidden: Insufficient scope' },
          },
        },
      },
      '/api/v1/content/health': {
        get: {
          summary: 'Content Health Audit',
          description: 'Audits all 94 Universal Content Manifest keys across the 6 core surfaces (/home, /learn, /solutions, /apps, /tools, /about). Returns live published/placeholder counts and per-page metrics (Scope: READ_CONTENT / content:read).',
          responses: {
            '200': {
              description: 'Live content health report',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ContentHealthReport' },
                },
              },
            },
            '401': { description: 'Unauthorized' },
            '403': { description: 'Forbidden' },
          },
        },
      },
      '/api/v1/content': {
        get: {
          summary: 'List Content Items',
          description: 'List content records with optional page, status, and limit filters (Scope: READ_CONTENT / content:read).',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'string' }, description: 'Filter by page (e.g. home, learn, solutions, apps, tools, about)' },
            { name: 'status', in: 'query', schema: { type: 'string' }, description: 'Filter by status (e.g. PLACEHOLDER, DRAFT, PUBLISHED)' },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 }, description: 'Maximum results to return' },
          ],
          responses: {
            '200': { description: 'List of content records' },
            '401': { description: 'Unauthorized' },
            '403': { description: 'Forbidden' },
          },
        },
        post: {
          summary: 'Create Content Record',
          description: 'Insert a new content record (Scope: WRITE_CONTENT / content:write).',
          responses: {
            '201': { description: 'Created' },
          },
        },
      },
      '/api/v1/content/{key}': {
        get: {
          summary: 'Get Content by Key',
          description: 'Retrieve content item by manifest key, slug, or ID. Returns 404 if not found (Scope: READ_CONTENT / content:read).',
          parameters: [
            { name: 'key', in: 'path', required: true, schema: { type: 'string' }, description: 'Manifest content key (e.g. learn.guide.ai-workflows)' },
          ],
          responses: {
            '200': { description: 'Content found' },
            '404': { description: 'Not found' },
          },
        },
        patch: {
          summary: 'Patch Content Item',
          description: 'Draft or update title, summary, body, category, status, or slug with automatic version increment (Scope: WRITE_CONTENT / content:write).',
          parameters: [
            { name: 'key', in: 'path', required: true, schema: { type: 'string' }, description: 'Manifest content key' },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    summary: { type: 'string' },
                    body: { type: 'string' },
                    category: { type: 'string' },
                    status: { type: 'string', enum: ['PLACEHOLDER', 'DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'] },
                    slug: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Updated' },
            '201': { description: 'Created' },
            '401': { description: 'Unauthorized' },
            '403': { description: 'Forbidden' },
          },
        },
      },
      '/api/v1/content/{key}/publish': {
        post: {
          summary: 'Publish Content Item',
          description: 'Transition content item directly to PUBLISHED status, incrementing version and stamping publisher (Scope: PUBLISH_CONTENT / content:publish).',
          parameters: [
            { name: 'key', in: 'path', required: true, schema: { type: 'string' }, description: 'Manifest content key to publish' },
          ],
          responses: {
            '200': { description: 'Published successfully' },
            '401': { description: 'Unauthorized' },
            '403': { description: 'Forbidden' },
          },
        },
      },
      '/api/v1/content/{key}/resolve': {
        get: {
          summary: 'Resolve Content via Frontend Layer',
          description: 'Runs resolution through the frontend contentResolver to verify whether the key resolves as live published content or placeholder fallback (Scope: READ_CONTENT / content:read).',
          parameters: [
            { name: 'key', in: 'path', required: true, schema: { type: 'string' }, description: 'Manifest content key' },
          ],
          responses: {
            '200': { description: 'Resolved content preview' },
          },
        },
      },
      '/api/v1/content/{key}/verify': {
        post: {
          summary: 'Verify Content Assertions',
          description: 'Re-reads content item from database and asserts expected status, body substring, and resolution layer state (Scope: READ_CONTENT / content:read).',
          parameters: [
            { name: 'key', in: 'path', required: true, schema: { type: 'string' }, description: 'Manifest content key' },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    expected_status: { type: 'string', default: 'PUBLISHED' },
                    expected_body_substring: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Verification report' },
          },
        },
      },
      '/api/v1/content/placeholders/{page}': {
        get: {
          summary: 'Get Placeholders by Page',
          description: 'Retrieve all keys that remain in PLACEHOLDER status on a given page, along with default titles and requirements for systematic swarm drafting (Scope: READ_CONTENT / content:read).',
          parameters: [
            { name: 'page', in: 'path', required: true, schema: { type: 'string' }, description: 'Page name: home, solutions, apps, learn, tools, or about' },
          ],
          responses: {
            '200': { description: 'Placeholders for page' },
          },
        },
      },
      '/api/v1/leads': {
        get: {
          summary: 'List Leads',
          description: 'List recent inbound leads (Scope: READ_LEADS).',
          responses: { '200': { description: 'List of leads' } },
        },
        post: {
          summary: 'Create Lead',
          description: 'Ingest inbound lead or project inquiry (Scope: WRITE_LEADS).',
          responses: { '201': { description: 'Lead created' } },
        },
      },
      '/api/v1/tasks': {
        get: {
          summary: 'List Tasks',
          description: 'List engineering and operator tasks (Scope: READ_TASKS).',
          responses: { '200': { description: 'List of tasks' } },
        },
        post: {
          summary: 'Create Task',
          description: 'Create an operator task (Scope: WRITE_TASKS).',
          responses: { '201': { description: 'Task created' } },
        },
      },
      '/api/v1/config': {
        get: {
          summary: 'Get Agent Configuration',
          description: 'Read current provider, model, and system prompt (Scope: READ_CONFIG).',
          responses: { '200': { description: 'Agent config' } },
        },
        post: {
          summary: 'Update Agent Configuration',
          description: 'Update provider, model, or system prompt (Scope: WRITE_CONFIG).',
          responses: { '200': { description: 'Agent config updated' } },
        },
      },
      '/api/v1/clients': {
        get: {
          summary: 'List Clients',
          description: 'List registered clients in CRM (Scope: READ_CLIENTS).',
          responses: { '200': { description: 'List of clients' } },
        },
        post: {
          summary: 'Create Client',
          description: 'Register a client in CRM (Scope: WRITE_CLIENTS).',
          responses: { '201': { description: 'Client registered' } },
        },
      },
      '/mcp': {
        post: {
          summary: 'Model Context Protocol (MCP) Streamable Endpoint',
          description: 'JSON-RPC 2.0 endpoint for MCP clients and Swarm agents. Supports initialize, tools/list, and tools/call across all 25 tools.',
          responses: {
            '200': { description: 'MCP Stream / JSON-RPC Response' },
          },
        },
      },
    },
  };
}
