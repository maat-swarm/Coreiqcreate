import { useState, useEffect, useCallback } from 'react';
import { ToolFormField } from '../types/command';

export interface PublicSiteTool {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  tier: 'free' | 'pro';
  launch_type: 'link' | 'download' | 'payment' | 'in_app' | 'coming_soon';
  cta_label: string;
  image_url: string | null;
  featured: boolean;
  sort_order: number;
  origin: 'coreiq' | 'opensource';
  is_paid: boolean;
  price_amount: number | null;
  price_currency: string;
  form_schema: ToolFormField[];
  is_mock: boolean;
}

export type ToolLaunchResult =
  | { action: 'link'; url: string }
  | { action: 'download'; url: string; fileName: string }
  | { action: 'payment'; payment_url: string; reference_id?: string }
  | { action: 'in_app'; form_schema: ToolFormField[] }
  | { action: 'coming_soon'; message?: string }
  | { action: 'paid_required'; price_amount: number | null; price_currency: string; message: string };

const API_BASE = (import.meta as any).env?.VITE_API_URL ?? '';

export async function fetchPublicSiteTools(): Promise<PublicSiteTool[]> {
  const res = await fetch(`${API_BASE}/api/v1/site-tools/public`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Failed to load tools (${res.status})`);
  }

  const data = await res.json();
  return Array.isArray(data.tools) ? (data.tools as PublicSiteTool[]) : [];
}

export async function launchTool(slug: string): Promise<ToolLaunchResult> {
  const res = await fetch(`${API_BASE}/api/v1/site-tools/${encodeURIComponent(slug)}/launch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Failed to launch tool');
  }

  return data as ToolLaunchResult;
}

export async function submitToolForm(
  slug: string,
  formData: FormData
): Promise<{ reference_id: string; payment_url?: string; message: string }> {
  const res = await fetch(`${API_BASE}/api/v1/site-tools/${encodeURIComponent(slug)}/submit`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    if (data.field_errors) {
      const errs = Object.entries(data.field_errors)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      throw new Error(`Validation failed: ${errs}`);
    }
    throw new Error(data.message || data.error || 'Failed to submit form');
  }

  return data;
}

export function usePublicSiteTools() {
  const [tools, setTools] = useState<PublicSiteTool[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await fetchPublicSiteTools();
      setTools(list);
    } catch (e: any) {
      setError(e?.message || 'Failed to load tools. Please retry.');
      setTools([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { tools, loading, error, reload: load };
}
