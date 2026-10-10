const API_BASE = (import.meta as any).env?.VITE_API_URL ?? '';

function getAuthHeaders(includeContentType = true): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  try {
    const token = localStorage.getItem('coreiq_command_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {}
  return headers;
}

export interface PaymentMethodConfig {
  id: string;
  label: string;
  url: string;
  details: string;
}

export interface PaymentSettings {
  heading: string;
  instructions: string;
  default_currency: string;
  methods: PaymentMethodConfig[];
}

export interface PublicStoreApp {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  status: 'published' | 'coming_soon';
  version: string;
  changelog: string;
  featured: boolean;
  sort_order: number;
  icon_url: string | null;
  icon_name: string;
  accent_color: string;
  screenshots: string[];
  price_mode: 'free' | 'paid' | 'contact';
  price_amount: number | null;
  currency: string;
  price_note: string;
  payment_label: string;
  distribution_type: 'web' | 'store' | 'file' | 'external' | 'download' | 'link' | 'access' | 'custom' | string;
  external_url?: string;
  app_url?: string;
  requires_email: boolean;
  has_file: boolean;
  updated_at?: string;
  payment_settings?: PaymentSettings;
}

export type GetAppResponse =
  | { action: 'open'; url: string }
  | { action: 'download'; url: string; fileName?: string; size?: number; sha256?: string | null }
  | { action: 'pay'; label?: string; url?: string; instructions?: string; methods?: PaymentMethodConfig[] }
  | { action: 'request' };

export class AppApiError extends Error {
  status?: number;
  code?: string;
  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'AppApiError';
    this.status = status;
    this.code = code;
  }
}

async function handleJsonResponse<T>(res: Response, fallbackErrMsg: string): Promise<T> {
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
    const errorMsg = data?.message || data?.error || `${fallbackErrMsg} (${res.status})`;
    throw new AppApiError(errorMsg, res.status, data?.error);
  }

  return data as T;
}

export async function fetchPublicApps(category?: string, search?: string): Promise<PublicStoreApp[]> {
  const params = new URLSearchParams();
  if (category && category !== 'All' && category !== 'all') {
    params.set('category', category);
  }
  if (search && search.trim()) {
    params.set('search', search.trim());
  }
  const qs = params.toString() ? `?${params.toString()}` : '';

  const res = await fetch(`${API_BASE}/api/v1/store/apps/public${qs}`, {
    headers: getAuthHeaders(false),
  });

  const data = await handleJsonResponse<{ apps: PublicStoreApp[]; count: number }>(
    res,
    'Failed to load applications'
  );
  return data.apps || [];
}

export async function fetchPublicAppBySlug(slug: string): Promise<PublicStoreApp> {
  const res = await fetch(`${API_BASE}/api/v1/store/apps/public/${encodeURIComponent(slug)}`, {
    headers: getAuthHeaders(false),
  });

  const data = await handleJsonResponse<{ app: PublicStoreApp }>(
    res,
    `Application "${slug}" could not be found`
  );
  return data.app;
}

export async function getAppAccess(
  slug: string,
  payload?: { email?: string; name?: string }
): Promise<GetAppResponse> {
  const res = await fetch(`${API_BASE}/api/v1/store/apps/${encodeURIComponent(slug)}/get`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload || {}),
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  let data: any = null;
  if (isJson) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  if (res.status === 409) {
    throw new AppApiError(
      'This app is not available to download yet.',
      409,
      data?.error || 'not_available'
    );
  }

  if (!res.ok) {
    const errorMsg = data?.message || data?.error || `Unable to access application (${res.status})`;
    throw new AppApiError(errorMsg, res.status, data?.error);
  }

  return data as GetAppResponse;
}

export async function submitAppRequest(
  slug: string,
  payload: { email: string; name?: string; message?: string }
): Promise<{ success: boolean; message: string; id?: string }> {
  const res = await fetch(`${API_BASE}/api/v1/store/apps/${encodeURIComponent(slug)}/request`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  });

  const data = await handleJsonResponse<{ success: boolean; message: string; id?: string }>(
    res,
    'Failed to submit request'
  );
  return data;
}

export interface AccessGrantResponse {
  status: string;
  action: 'open' | 'download';
  url: string;
  download_url?: string;
  fileName?: string;
  size?: number;
  sha256?: string | null;
  app: {
    id: string;
    title: string;
    slug: string;
    version: string;
  };
  uses_remaining: number;
  expires_at: string;
}

export async function redeemAccessToken(token: string): Promise<AccessGrantResponse> {
  if (!token || !token.trim()) {
    throw new AppApiError('This link is not valid', 404, 'not_found');
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/v1/store/access/${encodeURIComponent(token.trim())}`, {
      headers: getAuthHeaders(false),
    });
  } catch (netErr: any) {
    throw new AppApiError('Network connection failed. Please check your connection and retry.', 0, 'network_error');
  }

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  let data: any = null;
  if (isJson) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  if (res.status === 404) {
    throw new AppApiError('This link is not valid', 404, 'not_found');
  }

  if (res.status === 410) {
    throw new AppApiError(
      data?.message || 'This link has expired or has been used',
      410,
      'expired_or_used'
    );
  }

  if (!res.ok) {
    const errorMsg = data?.message || data?.error || `Unable to redeem access link (${res.status})`;
    throw new AppApiError(errorMsg, res.status, data?.error);
  }

  if (!data || typeof data !== 'object') {
    throw new AppApiError('Invalid server response. Please retry.', 500, 'invalid_response');
  }

  return data as AccessGrantResponse;
}
