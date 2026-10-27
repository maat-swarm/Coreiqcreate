import { useState, useEffect, useCallback } from 'react';
import { MaatverseSectionItem, MaatverseEntryItem } from '../types/command';

const API_BASE = (import.meta as any).env?.VITE_API_URL ?? '';

export async function fetchPublicMaatverseSections(): Promise<MaatverseSectionItem[]> {
  const res = await fetch(`${API_BASE}/api/v1/maatverse/sections`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Failed to load Ma'atverse sections (${res.status})`);
  const data = await res.json();
  return data.sections || [];
}

export async function fetchPublicMaatverseSection(
  slug: string
): Promise<{ section: MaatverseSectionItem; entries: MaatverseEntryItem[] }> {
  const res = await fetch(`${API_BASE}/api/v1/maatverse/sections/${encodeURIComponent(slug)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Failed to load Ma'atverse section (${res.status})`);
  return res.json();
}

export async function fetchPublicMaatverseEntry(
  sectionSlug: string,
  entrySlug: string
): Promise<MaatverseEntryItem> {
  const res = await fetch(
    `${API_BASE}/api/v1/maatverse/entries/${encodeURIComponent(sectionSlug)}/${encodeURIComponent(entrySlug)}`,
    { headers: { Accept: 'application/json' } }
  );
  if (!res.ok) throw new Error(`Failed to load Ma'atverse entry (${res.status})`);
  const data = await res.json();
  return data.entry;
}

export function usePublicMaatverseSections() {
  const [sections, setSections] = useState<MaatverseSectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPublicMaatverseSections();
      setSections(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load sections');
      setSections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { sections, loading, error, reload: load };
}
