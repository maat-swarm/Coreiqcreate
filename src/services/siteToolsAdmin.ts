import { getAuthHeaders } from './supabase';
import { ToolFormField, ToolSubmissionItem } from '../types/command';

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
  launch_type: 'link' | 'download' | 'payment' | 'in_app' | 'coming_soon' | 'inline';
  launch_url: string | null;
  payment_url?: string | null;
  download_path?: string | null;
  cta_label: string;
  image_url: string | null;
  image_path: string | null;
  featured: boolean;
  sort_order: number;
  origin: 'coreiq' | 'opensource';
  is_paid: boolean;
  price_amount: number | null;
  price_currency: string;
  form_schema: ToolFormField[];
  is_mock: boolean;
  new_submissions_count?: number;
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
  launch_type?: 'link' | 'download' | 'payment' | 'in_app' | 'coming_soon' | 'inline';
  launch_url?: string | null;
  payment_url?: string | null;
  download_path?: string | null;
  cta_label?: string;
  image_url?: string | null;
  image_path?: string | null;
  featured?: boolean;
  sort_order?: number;
  origin?: 'coreiq' | 'opensource';
  is_paid?: boolean;
  price_amount?: number | null;
  price_currency?: string;
  form_schema?: ToolFormField[];
  is_mock?: boolean;
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

export async function duplicateAdminSiteTool(id: string): Promise<AdminSiteTool> {
  const headers = await getAuthHeaders(true);
  const res = await fetch(`${API_BASE}/api/v1/site-tools/${encodeURIComponent(id)}/duplicate`, {
    method: 'POST',
    headers,
  });
  const data = await handleAdminResponse<{ tool: AdminSiteTool } & AdminSiteTool>(res, 'Failed to duplicate tool');
  return data.tool || (data as AdminSiteTool);
}

export async function deleteAllMockSiteTools(): Promise<{ deleted: number }> {
  const headers = await getAuthHeaders(true);
  const res = await fetch(`${API_BASE}/api/v1/site-tools/mocks`, {
    method: 'DELETE',
    headers,
  });
  return handleAdminResponse<{ deleted: number }>(res, 'Failed to delete mock tools');
}

export async function uploadSiteToolImage(file: File): Promise<{ image_url: string; image_path: string }> {
  const headers = await getAuthHeaders(false);
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/api/v1/site-tools/image`, {
    method: 'POST',
    headers,
    body: formData,
  });

  return handleAdminResponse<{ image_url: string; image_path: string }>(res, 'Failed to upload tool image');
}

export async function uploadSiteToolFile(file: File): Promise<{ file_path: string; file_name: string }> {
  const headers = await getAuthHeaders(false);
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/api/v1/site-tools/upload-file`, {
    method: 'POST',
    headers,
    body: formData,
  });

  return handleAdminResponse<{ file_path: string; file_name: string }>(res, 'Failed to upload tool file');
}

// --- SUBMISSIONS MANAGEMENT ---
export async function fetchToolSubmissions(toolId?: string, status?: string): Promise<ToolSubmissionItem[]> {
  const headers = await getAuthHeaders(true);
  const params = new URLSearchParams();
  if (toolId) params.set('tool_id', toolId);
  if (status && status !== 'all') params.set('status', status);

  const url = `${API_BASE}/api/v1/site-tools/submissions${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url, { headers });
  const data = await handleAdminResponse<{ submissions: ToolSubmissionItem[] }>(res, 'Failed to fetch submissions');
  return data.submissions || [];
}

export async function updateToolSubmission(
  id: string,
  payload: Partial<ToolSubmissionItem>
): Promise<ToolSubmissionItem> {
  const headers = await getAuthHeaders(true);
  const res = await fetch(`${API_BASE}/api/v1/site-tools/submissions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await handleAdminResponse<{ submission: ToolSubmissionItem }>(res, 'Failed to update submission');
  return data.submission;
}

export async function deleteToolSubmission(id: string): Promise<void> {
  const headers = await getAuthHeaders(true);
  const res = await fetch(`${API_BASE}/api/v1/site-tools/submissions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  });
  await handleAdminResponse<{ status: string; id: string }>(res, 'Failed to delete submission');
}

export async function uploadSubmissionDeliverable(
  id: string,
  file: File
): Promise<{ deliverable_path: string; signed_url: string }> {
  const headers = await getAuthHeaders(false);
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/api/v1/site-tools/submissions/${encodeURIComponent(id)}/deliverable`, {
    method: 'POST',
    headers,
    body: formData,
  });

  return handleAdminResponse<{ deliverable_path: string; signed_url: string }>(res, 'Failed to upload deliverable');
}

export async function getSubmissionShareableLink(id: string): Promise<{ signed_url: string; expires_at: string }> {
  const headers = await getAuthHeaders(true);
  const res = await fetch(`${API_BASE}/api/v1/site-tools/submissions/${encodeURIComponent(id)}/shareable-link`, {
    headers,
  });
  return handleAdminResponse<{ signed_url: string; expires_at: string }>(res, 'Failed to generate shareable link');
}
