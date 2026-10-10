import { getSupabase } from './supabase';
import { getAuthHeaders } from './mediaSlots';

const API_BASE = (import.meta as any).env?.VITE_API_URL ?? '';

export interface StoreApp {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  status: 'draft' | 'published' | 'coming_soon';
  price_mode: 'free' | 'paid' | 'contact';
  price_amount: number | null;
  currency: string;
  price_note: string;
  payment_label: string;
  payment_url: string;
  payment_instructions: string;
  distribution_type: 'download' | 'link' | 'access' | 'custom';
  external_url: string;
  file_path: string | null;
  file_name: string | null;
  file_size_bytes: number | null;
  sha256: string | null;
  icon_url: string | null;
  icon_name: string;
  accent_color: string;
  screenshots: string[];
  version: string;
  changelog: string;
  sort_order: number;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreAccessLink {
  id: string;
  app_id: string;
  note: string;
  expires_at: string;
  max_uses: number;
  use_count: number;
  created_at: string;
}

export interface StoreRequest {
  id: string;
  app_id?: string;
  user_email: string;
  user_name?: string;
  message?: string;
  status: 'new' | 'contacted' | 'closed';
  admin_note?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethodConfig {
  id: string;
  label: string;
  url: string;
  details: string;
}

export interface PaymentSettingsConfig {
  heading: string;
  default_instructions: string;
  default_currency: string;
  methods: PaymentMethodConfig[];
}

async function parseResponse<T>(res: Response, fallbackActionName: string): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  let data: any = null;

  if (isJson) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    try {
      const text = await res.text();
      data = { message: text };
    } catch {}
  }

  if (!res.ok) {
    const errorMsg =
      data?.message ||
      data?.error ||
      (Array.isArray(data?.messages) ? data.messages.join('; ') : `${fallbackActionName} failed (${res.status})`);
    throw new Error(errorMsg);
  }

  return data as T;
}

export async function fetchStoreApps(status?: string, category?: string): Promise<StoreApp[]> {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.set('status', status);
  if (category && category !== 'all' && category !== 'All') params.set('category', category);

  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE}/api/v1/store/apps${qs}`, {
    headers: getAuthHeaders(true),
  });
  const data = await parseResponse<{ apps: StoreApp[]; total: number }>(res, 'Fetch apps');
  return data.apps || [];
}

export async function createStoreApp(payload: Partial<StoreApp>): Promise<StoreApp> {
  const res = await fetch(`${API_BASE}/api/v1/store/apps`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  });
  const data = await parseResponse<{ status: string; app: StoreApp }>(res, 'Create app');
  return data.app;
}

export async function updateStoreApp(id: string, updates: Partial<StoreApp>): Promise<StoreApp> {
  const res = await fetch(`${API_BASE}/api/v1/store/apps/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: getAuthHeaders(true),
    body: JSON.stringify(updates),
  });
  const data = await parseResponse<{ status: string; app: StoreApp }>(res, 'Update app');
  return data.app;
}

export async function deleteStoreApp(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/store/apps/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(true),
  });
  await parseResponse<{ status: string; id: string }>(res, 'Delete app');
}

export async function getUploadUrl(
  id: string,
  filename?: string
): Promise<{ path: string; token: string; signedUrl: string }> {
  const res = await fetch(`${API_BASE}/api/v1/store/apps/${encodeURIComponent(id)}/upload-url`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ filename }),
  });
  return parseResponse<{ path: string; token: string; signedUrl: string }>(res, 'Get upload URL');
}

export async function completeFileUpload(
  id: string,
  payload: { path: string; name?: string; size: number; sha256?: string }
): Promise<StoreApp> {
  const res = await fetch(`${API_BASE}/api/v1/store/apps/${encodeURIComponent(id)}/file-complete`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  });
  const data = await parseResponse<{ status: string; app: StoreApp }>(res, 'Complete file upload');
  return data.app;
}

export async function uploadAppMedia(
  appId: string,
  file: File
): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/api/v1/store/apps/${encodeURIComponent(appId)}/media-upload`, {
    method: 'POST',
    headers: getAuthHeaders(false),
    body: formData,
  });
  const data = await parseResponse<{ status: string; url: string; filename: string }>(res, 'Upload media');
  return { url: data.url, filename: data.filename };
}

export async function createAccessLink(
  id: string,
  payload: { note?: string; hours?: number; max_uses?: number }
): Promise<{ id: string; url: string; token: string; expires_at: string; max_uses: number; note: string }> {
  const res = await fetch(`${API_BASE}/api/v1/store/apps/${encodeURIComponent(id)}/access-links`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  });
  return parseResponse<{ id: string; url: string; token: string; expires_at: string; max_uses: number; note: string }>(
    res,
    'Create access link'
  );
}

export async function fetchAccessLinks(id: string): Promise<StoreAccessLink[]> {
  const res = await fetch(`${API_BASE}/api/v1/store/apps/${encodeURIComponent(id)}/access-links`, {
    headers: getAuthHeaders(true),
  });
  const data = await parseResponse<{ links: StoreAccessLink[] }>(res, 'Fetch access links');
  return data.links || [];
}

export async function fetchStoreRequests(app_id?: string, status?: string): Promise<StoreRequest[]> {
  const params = new URLSearchParams();
  if (app_id) params.set('app_id', app_id);
  if (status && status !== 'all') params.set('status', status);

  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE}/api/v1/store/requests${qs}`, {
    headers: getAuthHeaders(true),
  });
  const data = await parseResponse<{ requests: StoreRequest[]; total: number }>(res, 'Fetch requests');
  return data.requests || [];
}

export async function updateStoreRequest(
  id: string,
  updates: { status?: string; admin_note?: string }
): Promise<StoreRequest> {
  const res = await fetch(`${API_BASE}/api/v1/store/requests/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: getAuthHeaders(true),
    body: JSON.stringify(updates),
  });
  const data = await parseResponse<{ status: string; request: StoreRequest }>(res, 'Update request');
  return data.request;
}

export async function fetchStoreSettings(key: string): Promise<PaymentSettingsConfig | null> {
  const res = await fetch(`${API_BASE}/api/v1/store/settings/${encodeURIComponent(key)}`, {
    headers: getAuthHeaders(true),
  });
  const data = await parseResponse<{ key: string; value: PaymentSettingsConfig | null }>(res, 'Fetch settings');
  return data.value;
}

export async function saveStoreSettings(key: string, value: any): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/store/settings/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ value }),
  });
  await parseResponse<{ status: string; key: string; value: any }>(res, 'Save settings');
}

export async function checkStoreUrl(
  url: string
): Promise<{ reachable: boolean; status: number | null; error?: string }> {
  const res = await fetch(`${API_BASE}/api/v1/store/check-url`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ url }),
  });
  return parseResponse<{ reachable: boolean; status: number | null; error?: string }>(res, 'Check URL');
}

export async function computeFileSha256(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function uploadAppFileDirect(
  appId: string,
  file: File,
  onProgressMessage?: (msg: string) => void
): Promise<{ path: string; name: string; size: number; sha256: string; fallbackMode: boolean }> {
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `Package file is ${(file.size / (1024 * 1024)).toFixed(1)} MB, exceeding the 50 MB limit. For larger packages, please provide an External Link instead.`
    );
  }

  onProgressMessage?.('Requesting upload destination from server...');
  const { path: storagePath, token, signedUrl } = await getUploadUrl(appId, file.name);

  let isFallback = false;

  if (token && token !== 'local_upload_dev_token') {
    onProgressMessage?.('Uploading directly to private cloud storage...');
    const supabase = getSupabase();
    if (supabase) {
      const { error: upErr } = await supabase.storage.from('app-files').uploadToSignedUrl(storagePath, token, file);
      if (upErr) {
        throw new Error(`Direct cloud upload failed: ${upErr.message}`);
      }
    } else {
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      });
      if (!uploadRes.ok) {
        throw new Error(`Signed upload failed with status ${uploadRes.status}`);
      }
    }
  } else {
    isFallback = true;
    onProgressMessage?.('Using server local storage mode...');
    try {
      const fullUrl = signedUrl.startsWith('http') ? signedUrl : `${API_BASE}${signedUrl}`;
      await fetch(fullUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      });
    } catch {}
  }

  onProgressMessage?.('Calculating SHA-256 checksum in browser...');
  const sha256 = await computeFileSha256(file);

  onProgressMessage?.('Finalizing file record with server...');
  await completeFileUpload(appId, {
    path: storagePath,
    name: file.name,
    size: file.size,
    sha256,
  });

  return {
    path: storagePath,
    name: file.name,
    size: file.size,
    sha256,
    fallbackMode: isFallback,
  };
}
