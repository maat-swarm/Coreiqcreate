import { useState, useEffect, useCallback } from 'react';
import { MediaSlot, MediaSlotItem } from '../types/command';
import { getSupabase } from './supabase';

const API_BASE = (import.meta as any).env?.VITE_API_URL ?? '';

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

  // 2. Fetch from Express API
  try {
    const res = await fetch(`${API_BASE}/api/v1/media/slots/${encodeURIComponent(slotKey)}`, {
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
      items: (data.items || []).filter((i: MediaSlotItem) => i.published),
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
  const res = await fetch(`${API_BASE}/api/v1/media/slots?page=${encodeURIComponent(page)}`, {
    headers: getAuthHeaders(true),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch slots (${res.status})`);
  }
  const data = await res.json();
  return data.slots || [];
}

export async function fetchCommandMediaSlotDetail(slotKey: string): Promise<{ slot: MediaSlot; items: MediaSlotItem[] }> {
  const res = await fetch(`${API_BASE}/api/v1/media/slots/${encodeURIComponent(slotKey)}`, {
    headers: getAuthHeaders(true),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch slot details (${res.status})`);
  }
  return res.json();
}

export async function uploadMediaItem(
  slotKey: string,
  formData: FormData
): Promise<MediaSlotItem> {
  const headers = getAuthHeaders(false);
  const res = await fetch(`${API_BASE}/api/v1/media/slots/${encodeURIComponent(slotKey)}/items`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || `Upload failed (${res.status})`);
  }
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
  const res = await fetch(`${API_BASE}/api/v1/media/slots/${encodeURIComponent(slotKey)}/items`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || `Creation failed (${res.status})`);
  }
  invalidateSlotCache(slotKey);
  return data.item;
}

export async function updateMediaItem(
  slotKey: string,
  itemId: string,
  updates: Partial<MediaSlotItem>
): Promise<MediaSlotItem> {
  const res = await fetch(`${API_BASE}/api/v1/media/slots/${encodeURIComponent(slotKey)}/items/${encodeURIComponent(itemId)}`, {
    method: 'PATCH',
    headers: getAuthHeaders(true),
    body: JSON.stringify(updates),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || `Update failed (${res.status})`);
  }
  invalidateSlotCache(slotKey);
  return data.item;
}

export async function reorderMediaItems(
  slotKey: string,
  itemIds: string[]
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/media/slots/${encodeURIComponent(slotKey)}/order`, {
    method: 'PUT',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ item_ids: itemIds }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Reorder failed (${res.status})`);
  }
  invalidateSlotCache(slotKey);
}

export async function deleteMediaItem(
  slotKey: string,
  itemId: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/media/slots/${encodeURIComponent(slotKey)}/items/${encodeURIComponent(itemId)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(true),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Delete failed (${res.status})`);
  }
  invalidateSlotCache(slotKey);
}
