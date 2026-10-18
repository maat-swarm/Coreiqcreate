import { useState, useEffect, useCallback } from 'react';
import { STARTER_PLACEHOLDER_TOOLS } from '../data/toolsData';

export interface PublicSiteTool {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  tier: 'free' | 'pro';
  launch_type: 'link' | 'download' | 'payment' | 'inline' | 'coming_soon';
  launch_url: string | null;
  cta_label: string;
  image_url: string | null;
  featured: boolean;
  sort_order: number;
  origin: 'coreiq' | 'opensource';
}

const API_BASE = (import.meta as any).env?.VITE_API_URL ?? '';

export async function fetchPublicSiteTools(): Promise<{ tools: PublicSiteTool[]; isPlaceholder: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/site-tools/public`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Failed to load tools (${res.status})`);
    }

    const data = await res.json();
    const serverTools = Array.isArray(data.tools) ? (data.tools as PublicSiteTool[]) : [];

    // When the DB returns ZERO published tools, show the starter placeholder list.
    // The moment one published DB row exists, show ONLY DB rows.
    if (serverTools.length === 0) {
      return { tools: STARTER_PLACEHOLDER_TOOLS as PublicSiteTool[], isPlaceholder: true };
    }

    return { tools: serverTools, isPlaceholder: false };
  } catch (err) {
    console.warn('[siteTools] Public fetch fallback to placeholders:', err);
    // On network or offline fallback, show placeholders
    return { tools: STARTER_PLACEHOLDER_TOOLS as PublicSiteTool[], isPlaceholder: true };
  }
}

export function usePublicSiteTools() {
  const [tools, setTools] = useState<PublicSiteTool[]>([]);
  const [isPlaceholder, setIsPlaceholder] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchPublicSiteTools();
      setTools(res.tools);
      setIsPlaceholder(res.isPlaceholder);
    } catch (e: any) {
      setError(e?.message || 'Failed to load tools. Please retry.');
      // Keep placeholders on error
      setTools(STARTER_PLACEHOLDER_TOOLS as PublicSiteTool[]);
      setIsPlaceholder(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { tools, isPlaceholder, loading, error, reload: load };
}
