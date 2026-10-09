export type UseCaseAudience = 'personal' | 'business' | 'both';

export interface UseCaseCategory {
  id: string;
  slug: string;
  label: string;
  sort_order: number;
  created_at?: string;
  use_cases_count?: number;
  published_count?: number;
}

export interface UseCaseFile {
  id: string;
  use_case_id: string;
  filename: string;
  storage_path: string;
  label: string;
  file_type: string;
  sort_order: number;
  created_at?: string;
}

export interface UseCase {
  id: string;
  category_slug: string;
  title: string;
  problem: string;
  approach: string;
  outcome: string;
  audience: UseCaseAudience;
  industry_tags: string[];
  image_url?: string | null;
  image_alt?: string | null;
  published: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  files?: UseCaseFile[];
}

export interface CreateUseCaseInput {
  category_slug: string;
  title: string;
  problem: string;
  approach: string;
  outcome: string;
  audience: UseCaseAudience;
  industry_tags?: string[];
  published?: boolean;
  sort_order?: number;
}

export interface UpdateUseCaseInput {
  category_slug?: string;
  title?: string;
  problem?: string;
  approach?: string;
  outcome?: string;
  audience?: UseCaseAudience;
  industry_tags?: string[];
  image_url?: string | null;
  image_alt?: string | null;
  published?: boolean;
  sort_order?: number;
}
