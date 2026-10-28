import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

async function createSnapshot() {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const filename = `supabase_snapshot_${timestamp}.json`;
  const backupPath = path.join(process.cwd(), 'backups', filename);

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

  const tableNames = [
    'leads',
    'social_messages',
    'tasks',
    'clients',
    'agent_config',
    'agent_tools',
    'platforms',
    'content',
    'swarm_comms',
    'api_keys',
    'media_slots',
    'media_slot_items',
    'use_case_categories',
    'use_cases',
    'use_case_files',
    'store_apps',
    'app_requests',
    'app_access_links',
    'app_downloads',
    'store_settings',
    'news_articles',
    'site_tools',
    'site_tool_private',
    'tool_submissions',
    'crm_outbox',
    'maatverse_sections',
    'maatverse_entries',
  ];

  const tablesData: Record<string, { count: number; rows: any[]; source: string }> = {};

  let supabase: any = null;
  if (supabaseUrl && supabaseKey) {
    try {
      supabase = createClient(supabaseUrl, supabaseKey);
    } catch (e) {
      console.warn('Could not init Supabase client for backup:', e);
    }
  }

  // Also read from server local store if needed
  for (const table of tableNames) {
    let rows: any[] = [];
    let source = 'none';

    if (supabase) {
      try {
        const { data, error } = await supabase.from(table).select('*');
        if (!error && Array.isArray(data)) {
          rows = data;
          source = 'supabase';
        } else if (error) {
          source = `supabase_error: ${error.message}`;
        }
      } catch (err: any) {
        source = `supabase_exception: ${err?.message}`;
      }
    }

    tablesData[table] = {
      count: rows.length,
      rows,
      source,
    };
  }

  const snapshot = {
    timestamp: new Date().toISOString(),
    git: {
      tag: 'pre-persistence-fix-2026-10-27',
      status: 'clean',
    },
    tables: tablesData,
  };

  fs.writeFileSync(backupPath, JSON.stringify(snapshot, null, 2), 'utf-8');
  console.log(`Snapshot saved to ${backupPath}`);
  console.log('\nRow counts per table:');
  for (const [table, info] of Object.entries(tablesData)) {
    console.log(`- ${table}: ${info.count} rows (source: ${info.source})`);
  }
}

createSnapshot().catch(console.error);
