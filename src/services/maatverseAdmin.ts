import { getAuthHeaders } from './supabase';
import { MaatverseSectionItem, MaatverseEntryItem } from '../types/command';

const API_BASE = (import.meta as any).env?.VITE_API_URL ?? '';

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
    const errText = data?.detail || data?.message || data?.error || `${defaultMessage} (${res.status})`;
    throw new Error(errText);
  }

  return data as T;
}

export async function fetchAdminMaatverseSections(): Promise<MaatverseSectionItem[]> {
  const headers = await getAuthHeaders(true);
  const res = await fetch(`${API_BASE}/api/v1/admin/maatverse/sections`, { headers });
  const data = await handleAdminResponse<{ sections: MaatverseSectionItem[] }>(res, 'Failed to fetch sections');
  return data.sections || [];
}

export async function createAdminMaatverseSection(
  payload: Partial<MaatverseSectionItem>
): Promise<MaatverseSectionItem> {
  const headers = await getAuthHeaders(true);
  const res = await fetch(`${API_BASE}/api/v1/admin/maatverse/sections`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await handleAdminResponse<{ section: MaatverseSectionItem }>(res, 'Failed to create section');
  return data.section;
}

export async function updateAdminMaatverseSection(
  id: string,
  payload: Partial<MaatverseSectionItem>
): Promise<void> {
  const headers = await getAuthHeaders(true);
  const res = await fetch(`${API_BASE}/api/v1/admin/maatverse/sections/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });
  await handleAdminResponse(res, 'Failed to update section');
}

export async function deleteAdminMaatverseSection(id: string): Promise<void> {
  const headers = await getAuthHeaders(true);
  const res = await fetch(`${API_BASE}/api/v1/admin/maatverse/sections/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  });
  await handleAdminResponse(res, 'Failed to delete section');
}

export async function fetchAdminMaatverseEntries(sectionSlug?: string): Promise<MaatverseEntryItem[]> {
  const headers = await getAuthHeaders(true);
  const url = `${API_BASE}/api/v1/admin/maatverse/entries${
    sectionSlug ? `?section_slug=${encodeURIComponent(sectionSlug)}` : ''
  }`;
  const res = await fetch(url, { headers });
  const data = await handleAdminResponse<{ entries: MaatverseEntryItem[] }>(res, 'Failed to fetch entries');
  return data.entries || [];
}

export async function createAdminMaatverseEntry(
  payload: Partial<MaatverseEntryItem>
): Promise<MaatverseEntryItem> {
  const headers = await getAuthHeaders(true);
  const res = await fetch(`${API_BASE}/api/v1/admin/maatverse/entries`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await handleAdminResponse<{ entry: MaatverseEntryItem }>(res, 'Failed to create entry');
  return data.entry;
}

export async function updateAdminMaatverseEntry(
  id: string,
  payload: Partial<MaatverseEntryItem>
): Promise<void> {
  const headers = await getAuthHeaders(true);
  const res = await fetch(`${API_BASE}/api/v1/admin/maatverse/entries/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });
  await handleAdminResponse(res, 'Failed to update entry');
}

export async function deleteAdminMaatverseEntry(id: string): Promise<void> {
  const headers = await getAuthHeaders(true);
  const res = await fetch(`${API_BASE}/api/v1/admin/maatverse/entries/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  });
  await handleAdminResponse(res, 'Failed to delete entry');
}

export async function deleteAllMockMaatverse(): Promise<{ deleted_sections: number; deleted_entries: number }> {
  const headers = await getAuthHeaders(true);
  const res = await fetch(`${API_BASE}/api/v1/admin/maatverse/mocks`, {
    method: 'DELETE',
    headers,
  });
  return handleAdminResponse<{ deleted_sections: number; deleted_entries: number }>(
    res,
    'Failed to delete mock Ma\'atverse content'
  );
}

export async function uploadMaatverseImage(file: File): Promise<{ image_url: string; image_path: string }> {
  const headers = await getAuthHeaders(false);
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/api/v1/admin/maatverse/image`, {
    method: 'POST',
    headers,
    body: formData,
  });

  return handleAdminResponse<{ image_url: string; image_path: string }>(res, 'Failed to upload image');
}
