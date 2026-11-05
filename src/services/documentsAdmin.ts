import { getAuthHeaders } from './supabase';
import { LegalDocumentItem, LegalDocumentCategory, LegalDocumentStatus } from '../types/command';

const API_BASE = (import.meta as any).env?.VITE_API_URL ?? '';

export interface CreateLegalDocumentPayload {
  title: string;
  slug?: string;
  category: LegalDocumentCategory;
  description?: string;
  sort_order?: number;
}

export interface UpdateLegalDocumentPayload {
  title?: string;
  slug?: string;
  category?: LegalDocumentCategory;
  description?: string;
  sort_order?: number;
}

export interface PublicLegalDocument {
  id: string;
  slug: string;
  title: string;
  category: LegalDocumentCategory;
  description?: string | null;
  status: 'published' | 'in_preparation';
  version: number;
  file_name?: string | null;
  file_size_bytes?: number | null;
  url?: string;
  has_file: boolean;
  sort_order: number;
  updated_at: string;
}

/**
 * Fetch all public documents for the About page.
 * Returns safe metadata. Never exposes internal storage paths.
 */
export async function fetchPublicDocuments(): Promise<PublicLegalDocument[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/documents`, {
      headers: {
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch documents (${res.status})`);
    }
    const data = await res.json();
    return data.documents || [];
  } catch (err) {
    console.warn('Error fetching public documents:', err);
    return [];
  }
}

/**
 * Admin: Fetch all legal documents (draft, published, archived)
 */
export async function fetchAdminDocuments(): Promise<LegalDocumentItem[]> {
  const headers = await getAuthHeaders(true);
  const res = await fetch(`${API_BASE}/api/v1/admin/documents`, {
    headers,
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || `Failed to fetch admin documents (${res.status})`);
  }
  const data = await res.json();
  return data.documents || [];
}

/**
 * Admin: Create a new legal document entry
 */
export async function createAdminDocument(payload: CreateLegalDocumentPayload): Promise<LegalDocumentItem> {
  const headers = await getAuthHeaders(true);
  const res = await fetch(`${API_BASE}/api/v1/admin/documents`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create document (${res.status})`);
  }
  const data = await res.json();
  return data.document;
}

/**
 * Admin: Update an existing legal document
 */
export async function updateAdminDocument(id: string, payload: UpdateLegalDocumentPayload): Promise<LegalDocumentItem> {
  const headers = await getAuthHeaders(true);
  const res = await fetch(`${API_BASE}/api/v1/admin/documents/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to update document (${res.status})`);
  }
  const data = await res.json();
  return data.document;
}

/**
 * Admin: Upload or replace a PDF for a document
 */
export async function uploadDocumentPdf(id: string, file: File): Promise<LegalDocumentItem> {
  const authHeaders = await getAuthHeaders(false);
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/api/v1/admin/documents/${id}/upload`, {
    method: 'POST',
    headers: authHeaders,
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to upload PDF (${res.status})`);
  }

  const data = await res.json();
  return data.document;
}

/**
 * Admin: Publish document
 */
export async function publishDocument(id: string): Promise<LegalDocumentItem> {
  const headers = await getAuthHeaders(true);
  const res = await fetch(`${API_BASE}/api/v1/admin/documents/${id}/publish`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to publish document (${res.status})`);
  }
  const data = await res.json();
  return data.document;
}

/**
 * Admin: Unpublish document
 */
export async function unpublishDocument(id: string): Promise<LegalDocumentItem> {
  const headers = await getAuthHeaders(true);
  const res = await fetch(`${API_BASE}/api/v1/admin/documents/${id}/unpublish`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to unpublish document (${res.status})`);
  }
  const data = await res.json();
  return data.document;
}

/**
 * Admin: Delete document
 */
export async function deleteAdminDocument(id: string): Promise<void> {
  const headers = await getAuthHeaders(true);
  const res = await fetch(`${API_BASE}/api/v1/admin/documents/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to delete document (${res.status})`);
  }
}
