import { useState, useEffect, useCallback } from 'react';

const API_BASE = (import.meta as any).env?.VITE_API_URL ?? '';

export interface LearnLesson {
  id: string;
  title: string;
  description: string;
  category: string;
  video_url: string | null;
  poster_url: string | null;
  pdf_url: string | null;
  pdf_label: string | null;
  sort_order: number;
}

export function useLearnLessons() {
  const [lessons, setLessons] = useState<LearnLesson[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadLessons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/v1/learn/lessons`, {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to load lessons (${res.status})`);
      }

      const data = await res.json();
      setLessons(Array.isArray(data) ? data : data.lessons || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load lessons');
      setLessons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLessons();

    const handleUpdate = () => {
      loadLessons();
    };
    window.addEventListener('coreiq_learn_updated', handleUpdate);
    return () => {
      window.removeEventListener('coreiq_learn_updated', handleUpdate);
    };
  }, [loadLessons]);

  return { lessons, loading, error };
}
