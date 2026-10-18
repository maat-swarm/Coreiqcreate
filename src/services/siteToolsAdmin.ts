import { getAuthHeaders } from './supabase';

const API_BASE = (import.meta as any).env?.VITE_API_URL ?? '';

export interface AdminSiteTool {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  tier: 'free' | 'pro';
  status: 'draft' | 'published';
  launch_type: 'link' | 'download' | 'payment' | 'inline' | 'coming_soon';
  launch_url: string | null;
  cta_label: string;
  image_url: string | null;
  image_path: string | null;
  featured: boolean;
  sort_order: number;
  origin: 'coreiq' | 'opensource';
  created_at: string;
  updated_at: string;
}

export interface CreateSiteToolPayload {
  name: string;
  slug?: string;
  tagline?: string;
  description?: string;
  category?: string;
  tier?: 'free' | 'pro';
  status?: 'draft' | 'published';
  launch_type?: 'link' | 'download' | 'payment' | 'inline' | 'coming_soon';
  launch_url?: string | null;
  cta_label?: string;
  image_url?: string | null;
  image_path?: string | null;
  featured?: boolean;
  sort_order?: number;
  origin?: 'coreiq' | 'opensource';
}

export type UpdateSiteToolPayload = Partial<CreateSiteToolPayload>;

async function handleAdminResponse<T>(res: Response, defaultMessage: string): Promise<T> {
  let data: any = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
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
    if (data?.fields && typeof data.fields === 'object') {
      const fieldList = Object.entries(data.fields)
        .map(([f, msg]) => `${f}: ${msg}`)
        .join(', ');
      throw new Error(`Validation failed: ${fieldList}`);
    }
    const errText = data?.detail
      ? `${data.error || 'Database Error'}: ${data.detail}`
      : data?.message || data?.error || `${defaultMessage} (${res.status})`;
    throw new Error(errText);
  }

  return data as T;
}

export async function fetchAdminSiteTools(): Promise<AdminSiteTool[]> {
  const headers = await getAuthHeaders(true);
  const res = await fetch(`${API_BASE}/api/v1/site-tools`, { headers });
  const data = await handleAdminResponse<{ tools: AdminSiteTool[] }>(res, 'Failed to fetch tools');
  return data.tools || [];
}

export async function createAdminSiteTool(payload: CreateSiteToolPayload): Promise<AdminSiteTool> {
  const headers = await getAuthHeaders(true);
  const res = await fetch(`${API_BASE}/api/v1/site-tools`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await handleAdminResponse<{ tool: AdminSiteTool } & AdminSiteTool>(res, 'Failed to create tool');
  return data.tool || (data as AdminSiteTool);
}

export async function updateAdminSiteTool(id: string, payload: UpdateSiteToolPayload): Promise<AdminSiteTool> {
  const headers = await getAuthHeaders(true);
  const res = await fetch(`${API_BASE}/api/v1/site-tools/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await handleAdminResponse<{ tool: AdminSiteTool } & AdminSiteTool>(res, 'Failed to update tool');
  return data.tool || (data as AdminSiteTool);
}

export async function deleteAdminSiteTool(id: string): Promise<void> {
  const headers = await getAuthHeaders(true);
  const res = await fetch(`${API_BASE}/api/v1/site-tools/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  });
  await handleAdminResponse<{ status: string; id: string }>(res, 'Failed to delete tool');
}

export async function uploadSiteToolImage(file: File): Promise<{ image_url: string; image_path: string }> {
  const headers = await getAuthHeaders(false); // multipart: browser sets content-type with boundary
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/api/v1/site-tools/image`, {
    method: 'POST',
    headers,
    body: formData,
  });

  return handleAdminResponse<{ image_url: string; image_path: string }>(res, 'Failed to upload tool image');
}
