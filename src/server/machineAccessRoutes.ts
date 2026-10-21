import type { Express, Request, Response, NextFunction } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { executeRegistryTool } from './registryExecution';
import { hasScope } from '../shared/scopes';
import { maskSecrets } from './validators';

export interface MachineAccessDeps {
  authenticateApiKey: (req: Request, res: Response, next: NextFunction) => any;
  requireScope: (scope: string, legacyFallbackScope?: string) => (req: Request, res: Response, next: NextFunction) => any;
  supabase: SupabaseClient | null;
  adminSupabase: SupabaseClient | null;
  localStore: Record<string, any[]>;
}

export function registerMachineAccessRoutes(app: Express, deps: MachineAccessDeps) {
  const { authenticateApiKey, requireScope, supabase, adminSupabase, localStore } = deps;
  const db = adminSupabase || supabase;

  const getCtx = (req: Request) => ({
    db,
    store: localStore,
    callerApiKey: (req as any).apiKey,
    isOperatorSession:
      Boolean((req as any).apiKey?.scopes?.includes('*')) ||
      Boolean((req as any).apiKey?.id?.startsWith('operator_')) ||
      (req as any).apiKey?.id === 'key_operator_session',
  });

  const sendResult = (res: Response, result: any) => {
    const statusCode = result.statusCode || (result.success ? 200 : (result.isForbidden ? 403 : (result.isNotFound ? 404 : 400)));
    if (!result.success) {
      return res.status(statusCode).json({ error: result.error, ...(result.data || {}) });
    }
    return res.status(statusCode).json(result.data);
  };

  // Helper for operator-session only routes (key management)
  const requireOperatorSession = (req: Request, res: Response, next: NextFunction) => {
    const key = (req as any).apiKey;
    const isOperator =
      key &&
      (key.id === 'key_operator_session' ||
        key.id?.startsWith('operator_') ||
        (req.headers['x-operator-auth'] === 'true' && key.scopes?.includes('*')));

    if (!isOperator) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'API Key management (create, revoke, edit scopes) is strictly restricted to interactive operator sessions. Machine API keys cannot manage API keys.',
      });
    }
    next();
  };

  // --- CAPABILITIES & PING ---
  app.get('/api/v1/capabilities', async (req: Request, res: Response) => {
    // Optional auth: inspect token if passed
    await new Promise<void>((resolve) => {
      authenticateApiKey(req, res, () => resolve());
    });
    const result = await executeRegistryTool('site_capabilities', {}, getCtx(req));
    return sendResult(res, result);
  });

  // --- PLATFORMS ---
  app.get('/api/v1/platforms', authenticateApiKey, requireScope('READ_PLATFORMS'), async (req: Request, res: Response) => {
    const result = await executeRegistryTool('site_platforms_list', {}, getCtx(req));
    return sendResult(res, result);
  });

  app.post('/api/v1/platforms', authenticateApiKey, requireScope('WRITE_PLATFORMS'), async (req: Request, res: Response) => {
    const result = await executeRegistryTool('site_platforms_create', req.body, getCtx(req));
    return sendResult(res, result);
  });

  app.delete('/api/v1/platforms/:id', authenticateApiKey, requireScope('WRITE_PLATFORMS'), async (req: Request, res: Response) => {
    const result = await executeRegistryTool('site_platforms_delete', { id: req.params.id }, getCtx(req));
    return sendResult(res, result);
  });

  // --- SWARM COMMS ---
  app.get(['/api/v1/swarm/comms', '/api/v1/swarm'], authenticateApiKey, requireScope('READ_SWARM'), async (req: Request, res: Response) => {
    const result = await executeRegistryTool('site_swarm_list_messages', { limit: req.query.limit }, getCtx(req));
    return sendResult(res, result);
  });

  app.post(['/api/v1/swarm/comms', '/api/v1/swarm'], authenticateApiKey, requireScope('WRITE_SWARM'), async (req: Request, res: Response) => {
    const result = await executeRegistryTool('site_swarm_send_message', req.body, getCtx(req));
    return sendResult(res, result);
  });

  // --- SOCIAL MESSAGES ---
  app.get(['/api/v1/social/messages', '/api/v1/social-messages'], authenticateApiKey, requireScope('READ_SOCIAL'), async (req: Request, res: Response) => {
    const result = await executeRegistryTool('site_social_list_messages', { limit: req.query.limit, status: req.query.status }, getCtx(req));
    return sendResult(res, result);
  });

  app.patch(['/api/v1/social/messages/:id', '/api/v1/social-messages/:id'], authenticateApiKey, requireScope('WRITE_SOCIAL'), async (req: Request, res: Response) => {
    const result = await executeRegistryTool('site_social_update_status', { id: req.params.id, status: req.body.status }, getCtx(req));
    return sendResult(res, result);
  });

  // --- ANALYTICS ---
  app.get(['/api/v1/analytics/summary', '/api/v1/analytics'], authenticateApiKey, requireScope('READ_ANALYTICS'), async (req: Request, res: Response) => {
    const result = await executeRegistryTool('site_analytics_get_summary', {}, getCtx(req));
    return sendResult(res, result);
  });

  // --- USE CASES (Publish, Unpublish & File Metadata) ---
  app.post('/api/v1/admin/use-cases/:id/publish', authenticateApiKey, requireScope('PUBLISH_USE_CASES'), async (req: Request, res: Response) => {
    const result = await executeRegistryTool('site_use_cases_publish', { id: req.params.id }, getCtx(req));
    return sendResult(res, result);
  });

  app.post('/api/v1/admin/use-cases/:id/unpublish', authenticateApiKey, requireScope('PUBLISH_USE_CASES'), async (req: Request, res: Response) => {
    const result = await executeRegistryTool('site_use_cases_unpublish', { id: req.params.id }, getCtx(req));
    return sendResult(res, result);
  });

  app.get('/api/v1/admin/use-cases/:id/files', authenticateApiKey, requireScope('READ_USE_CASES'), async (req: Request, res: Response) => {
    const result = await executeRegistryTool('site_use_cases_list_files', { use_case_id: req.params.id }, getCtx(req));
    return sendResult(res, result);
  });

  app.post('/api/v1/admin/use-cases/:id/files', authenticateApiKey, requireScope('WRITE_USE_CASES'), async (req: Request, res: Response) => {
    const result = await executeRegistryTool('site_use_cases_add_file_metadata', { use_case_id: req.params.id, ...req.body }, getCtx(req));
    return sendResult(res, result);
  });

  app.delete('/api/v1/admin/use-cases/:id/files/:fileId', authenticateApiKey, requireScope('WRITE_USE_CASES'), async (req: Request, res: Response) => {
    const result = await executeRegistryTool('site_use_cases_remove_file_metadata', { file_id: req.params.fileId }, getCtx(req));
    return sendResult(res, result);
  });

  // --- NEWS (Publish & Unpublish) ---
  app.post('/api/v1/admin/news/:id/publish', authenticateApiKey, requireScope('PUBLISH_NEWS'), async (req: Request, res: Response) => {
    const result = await executeRegistryTool('site_news_publish', { id: req.params.id }, getCtx(req));
    return sendResult(res, result);
  });

  app.post('/api/v1/admin/news/:id/unpublish', authenticateApiKey, requireScope('PUBLISH_NEWS'), async (req: Request, res: Response) => {
    const result = await executeRegistryTool('site_news_unpublish', { id: req.params.id }, getCtx(req));
    return sendResult(res, result);
  });

  // --- API KEYS: Read Only for Machine API Keys ---
  app.get('/api/v1/keys', authenticateApiKey, requireScope('READ_KEYS'), async (req: Request, res: Response) => {
    const result = await executeRegistryTool('site_keys_list', {}, getCtx(req));
    return sendResult(res, result);
  });

  app.get('/api/v1/keys/audit', authenticateApiKey, requireScope('READ_KEYS'), async (req: Request, res: Response) => {
    const result = await executeRegistryTool('site_keys_audit_list', { limit: req.query.limit }, getCtx(req));
    return sendResult(res, result);
  });

  // --- API KEYS: Operator Session Only Mutations ---
  app.post('/api/v1/keys', authenticateApiKey, requireOperatorSession, async (req: Request, res: Response) => {
    const { name, scopes } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Key name is required' });
    }

    const rawToken = `ciq_live_${crypto.randomBytes(24).toString('hex')}`;
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const prefix = `${rawToken.substring(0, 16)}...`;

    const newKeyRecord = {
      id: crypto.randomUUID ? crypto.randomUUID() : `key_${Date.now()}`,
      name: name.trim(),
      key_prefix: prefix,
      key_hash: tokenHash,
      scopes: Array.isArray(scopes) && scopes.length > 0 ? scopes : ['*'],
      revoked: false,
      created_at: new Date().toISOString(),
    };

    if (db) {
      try {
        const { data, error } = await db.from('api_keys').insert([newKeyRecord]).select().single();
        if (!error && data) {
          const { key_hash, ...safeData } = data;
          return res.status(201).json({ key: safeData, token: rawToken });
        }
      } catch (err: any) {
        console.error('[Create API Key Error]', err);
      }
    }

    if (!localStore.api_keys) localStore.api_keys = [];
    localStore.api_keys.unshift(newKeyRecord);
    const { key_hash, ...safeLocal } = newKeyRecord;
    return res.status(201).json({ key: safeLocal, token: rawToken });
  });

  app.patch('/api/v1/keys/:id/scopes', authenticateApiKey, requireOperatorSession, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { scopes } = req.body;

    if (!Array.isArray(scopes)) {
      return res.status(400).json({ error: 'scopes must be an array of strings' });
    }

    if (db) {
      try {
        const { data, error } = await db
          .from('api_keys')
          .update({ scopes, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .maybeSingle();

        if (!error && data) {
          const { key_hash, ...safeData } = data;
          return res.json({ status: 'updated', key: safeData });
        }
      } catch (err: any) {
        console.error('[Update Key Scopes Error]', err);
      }
    }

    const localKey = (localStore.api_keys || []).find((k: any) => k.id === id);
    if (!localKey) {
      return res.status(404).json({ error: 'API Key not found' });
    }

    localKey.scopes = scopes;
    const { key_hash, ...safeKey } = localKey;
    return res.json({ status: 'updated', key: safeKey });
  });

  app.delete('/api/v1/keys/:id', authenticateApiKey, requireOperatorSession, async (req: Request, res: Response) => {
    const { id } = req.params;

    if (db) {
      try {
        await db.from('api_keys').update({ revoked: true }).eq('id', id);
        return res.json({ status: 'revoked', id });
      } catch {}
    }

    const localKey = (localStore.api_keys || []).find((k: any) => k.id === id);
    if (localKey) {
      localKey.revoked = true;
    }

    return res.json({ status: 'revoked', id });
  });
}
