import { useState, useEffect, useCallback } from 'react';
import { MediaSlot, MediaSlotItem } from '../types/command';
import { getSupabase } from './supabase';

export const RENDER_BACKEND_URL = 'https://coreiqcreate.onrender.com';

export function getApiBase(): string {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return RENDER_BACKEND_URL;
}

const API_BASE = getApiBase();

/**
 * Robust fetch wrapper with automatic 1-retry mechanism (3s wait)
 * to handle Render free-tier cold starts or transient network interruptions.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 1,
  delayMs = 3000
): Promise<Response> {
  try {
    const res = await fetch(url, options);
    // If server is warming up or temporarily unavailable, retry once after delay
    if (!res.ok && (res.status === 502 || res.status === 503 || res.status === 504) && retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return fetchWithRetry(url, options, retries - 1, delayMs);
    }
    return res;
  } catch (err: any) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return fetchWithRetry(url, options, retries - 1, delayMs);
    }
    throw err;
  }
}

/**
 * Extracts descriptive server error messages from API responses
 */
async function extractServerErrorMessage(res: Response, fallbackPrefix: string): Promise<string> {
  try {
    const data = await res.json();
    return data.message || data.error || `${fallbackPrefix} (${res.status})`;
  } catch {
    try {
      const text = await res.text();
      if (text && text.trim().length > 0 && !text.includes('<!DOCTYPE')) {
        return text.slice(0, 250);
      }
    } catch {}
    return `${fallbackPrefix} (${res.status})`;
  }
}

// Short in-memory cache for public slot queries
interface CacheEntry {
  slot: MediaSlot | null;
  items: MediaSlotItem[];
  timestamp: number;
}

const slotCache: Record<string, CacheEntry> = {};
const CACHE_TTL_MS = 30000; // 30 seconds cache TTL

export function invalidateSlotCache(slotKey?: string) {
  if (slotKey) {
    delete slotCache[slotKey];
  } else {
    Object.keys(slotCache).forEach((k) => delete slotCache[k]);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('coreiq_media_updated', { detail: { slotKey } }));
  }
}

/**
 * Fetch a single slot and its published items.
 * Tries Supabase anon first (if configured), then falls back to /api/v1/media/slots/:slot_key.
 */
export async function getMediaSlotPublished(
  slotKey: string,
  bypassCache = false
): Promise<{ slot: MediaSlot | null; items: MediaSlotItem[] }> {
  const now = Date.now();
  if (!bypassCache && slotCache[slotKey] && (now - slotCache[slotKey].timestamp < CACHE_TTL_MS)) {
    return { slot: slotCache[slotKey].slot, items: slotCache[slotKey].items };
  }

  // 1. Try Supabase anon direct query if configured
  const supabase = getSupabase();
  if (supabase) {
    try {
      const [slotRes, itemsRes] = await Promise.all([
        supabase.from('media_slots').select('*').eq('slot_key', slotKey).maybeSingle(),
        supabase
          .from('media_slot_items')
          .select('*')
          .eq('slot_key', slotKey)
          .eq('published', true)
          .order('sort_order', { ascending: true }),
      ]);

      if (!slotRes.error && slotRes.data) {
        const result = {
          slot: slotRes.data as MediaSlot,
          items: (itemsRes.data || []) as MediaSlotItem[],
        };
        slotCache[slotKey] = { ...result, timestamp: now };
        return result;
      }
    } catch {
      // Fall through to backend API
    }
  }

  // 2. Fetch from Express API with retry
  try {
    const res = await fetchWithRetry(`${API_BASE}/api/v1/media/slots/${encodeURIComponent(slotKey)}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      return { slot: null, items: [] };
    }

    const data = await res.json();
    const result = {
      slot: data.slot || null,
      items: data.items || [],
    };
    slotCache[slotKey] = { ...result, timestamp: now };
    return result;
  } catch {
    return { slot: null, items: [] };
  }
}

/**
 * React hook: useMediaSlot
 * Reads published items for slotKey with memory cache, loading, error, and safe empty fallback.
 */
export function useMediaSlot(slotKey: string) {
  const [slot, setSlot] = useState<MediaSlot | null>(() => slotCache[slotKey]?.slot || null);
  const [items, setItems] = useState<MediaSlotItem[]>(() => slotCache[slotKey]?.items || []);
  const [loading, setLoading] = useState<boolean>(!slotCache[slotKey]);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async (bypassCache = false) => {
    try {
      setLoading(true);
      const res = await getMediaSlotPublished(slotKey, bypassCache);
      setSlot(res.slot);
      setItems(res.items);
      setError(null);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setItems([]);
      setSlot(null);
    } finally {
      setLoading(false);
    }
  }, [slotKey]);

  useEffect(() => {
    loadData();

    // Listen for media update events from Command or other tabs
    const handleUpdate = (e: any) => {
      if (!e.detail?.slotKey || e.detail.slotKey === slotKey) {
        loadData(true);
      }
    };

    window.addEventListener('coreiq_media_updated', handleUpdate);
    return () => {
      window.removeEventListener('coreiq_media_updated', handleUpdate);
    };
  }, [slotKey, loadData]);

  return {
    slot,
    items,
    loading,
    error,
    refetch: () => loadData(true),
  };
}

// -----------------------------------------------------------------------------
// OPERATOR / COMMAND API HELPERS
// -----------------------------------------------------------------------------

function getAuthHeaders(isJson = true): Record<string, string> {
  const headers: Record<string, string> = {
    'x-operator-auth': 'true',
  };
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  // If operator session token exists in localStorage or sessionStorage
  if (typeof window !== 'undefined') {
    let rawDevKey = '';
    try {
      if (window.localStorage) {
        rawDevKey = localStorage.getItem('coreiq_api_key_master') || '';
      }
    } catch {}

    if (rawDevKey) {
      headers['Authorization'] = `Bearer ${rawDevKey}`;
    } else {
      headers['Authorization'] = 'Bearer ciq_live_devmaster_00000000000000000000000000000000';
    }
  }
  return headers;
}

export async function fetchCommandMediaSlots(page = 'home'): Promise<MediaSlot[]> {
  const url = `${API_BASE}/api/v1/media/slots?page=${encodeURIComponent(page)}`;
  let res: Response;
  try {
    res = await fetchWithRetry(url, {
      headers: getAuthHeaders(true),
    });
  } catch (err: any) {
    throw new Error(
      `Unable to reach media server at ${API_BASE} (${err.message || 'Failed to fetch'}). Server may be starting up from cold sleep. Please wait a moment and try again.`
    );
  }

  if (!res.ok) {
    const errorMsg = await extractServerErrorMessage(res, 'Failed to fetch slots');
    throw new Error(errorMsg);
  }
  const data = await res.json();
  return data.slots || [];
}

export async function fetchCommandMediaSlotDetail(slotKey: string): Promise<{ slot: MediaSlot; items: MediaSlotItem[] }> {
  const url = `${API_BASE}/api/v1/media/slots/${encodeURIComponent(slotKey)}`;
  let res: Response;
  try {
    res = await fetchWithRetry(url, {
      headers: getAuthHeaders(true),
    });
  } catch (err: any) {
    throw new Error(
      `Unable to reach media server for slot '${slotKey}' (${err.message || 'Failed to fetch'}).`
    );
  }

  if (!res.ok) {
    const errorMsg = await extractServerErrorMessage(res, 'Failed to fetch slot details');
    throw new Error(errorMsg);
  }
  return res.json();
}

export async function uploadMediaItem(
  slotKey: string,
  formData: FormData
): Promise<MediaSlotItem> {
  const url = `${API_BASE}/api/v1/media/slots/${encodeURIComponent(slotKey)}/items`;
  const headers = getAuthHeaders(false);
  let res: Response;
  try {
    res = await fetchWithRetry(url, {
      method: 'POST',
      headers,
      body: formData,
    });
  } catch (err: any) {
    throw new Error(
      `Upload network error (${err.message || 'Failed to fetch'}). Render server may be waking up. Please retry in a few seconds.`
    );
  }

  if (!res.ok) {
    const errorMsg = await extractServerErrorMessage(res, 'Upload failed');
    throw new Error(errorMsg);
  }

  const data = await res.json();
  invalidateSlotCache(slotKey);
  return data.item;
}

export async function createUrlMediaItem(
  slotKey: string,
  payload: {
    type: 'url';
    url: string;
    title?: string;
    caption?: string;
    alt?: string;
    cta_label?: string;
    cta_url?: string;
  }
): Promise<MediaSlotItem> {
  const url = `${API_BASE}/api/v1/media/slots/${encodeURIComponent(slotKey)}/items`;
  let res: Response;
  try {
    res = await fetchWithRetry(url, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
    throw new Error(
      `Connection failed (${err.message || 'Failed to fetch'}). Please try again.`
    );
  }

  if (!res.ok) {
    const errorMsg = await extractServerErrorMessage(res, 'Creation failed');
    throw new Error(errorMsg);
  }

  const data = await res.json();
  invalidateSlotCache(slotKey);
  return data.item;
}

export async function updateMediaItem(
  slotKey: string,
  itemId: string,
  updates: Partial<MediaSlotItem>
): Promise<MediaSlotItem> {
  const url = `${API_BASE}/api/v1/media/slots/${encodeURIComponent(slotKey)}/items/${encodeURIComponent(itemId)}`;
  let res: Response;
  try {
    res = await fetchWithRetry(url, {
      method: 'PATCH',
      headers: getAuthHeaders(true),
      body: JSON.stringify(updates),
    });
  } catch (err: any) {
    throw new Error(
      `Failed to update item (${err.message || 'Failed to fetch'}).`
    );
  }

  if (!res.ok) {
    const errorMsg = await extractServerErrorMessage(res, 'Update failed');
    throw new Error(errorMsg);
  }

  const data = await res.json();
  invalidateSlotCache(slotKey);
  return data.item;
}

export async function reorderMediaItems(
  slotKey: string,
  itemIds: string[]
): Promise<void> {
  const url = `${API_BASE}/api/v1/media/slots/${encodeURIComponent(slotKey)}/order`;
  let res: Response;
  try {
    res = await fetchWithRetry(url, {
      method: 'PUT',
      headers: getAuthHeaders(true),
      body: JSON.stringify({ item_ids: itemIds }),
    });
  } catch (err: any) {
    throw new Error(
      `Failed to reorder items (${err.message || 'Failed to fetch'}).`
    );
  }

  if (!res.ok) {
    const errorMsg = await extractServerErrorMessage(res, 'Reorder failed');
    throw new Error(errorMsg);
  }
  invalidateSlotCache(slotKey);
}

export async function deleteMediaItem(
  slotKey: string,
  itemId: string
): Promise<void> {
  const url = `${API_BASE}/api/v1/media/slots/${encodeURIComponent(slotKey)}/items/${encodeURIComponent(itemId)}`;
  let res: Response;
  try {
    res = await fetchWithRetry(url, {
      method: 'DELETE',
      headers: getAuthHeaders(true),
    });
  } catch (err: any) {
    throw new Error(
      `Failed to delete item (${err.message || 'Failed to fetch'}).`
    );
  }

  if (!res.ok) {
    const errorMsg = await extractServerErrorMessage(res, 'Delete failed');
    throw new Error(errorMsg);
  }
  invalidateSlotCache(slotKey);
}
