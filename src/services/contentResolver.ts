import { ContentType, ContentStatus, CommandContentItem } from '../types/command';
import {
  CONTENT_MANIFEST,
  ContentManifestEntry,
  getManifestEntry,
  getManifestEntryBySlug,
  humanizeKey,
} from '../data/contentManifest';
import { CoreIQData } from './supabase';

export interface ResolvedContent {
  content_key: string;
  status: ContentStatus;
  content_type: ContentType;
  title: string;
  summary: string;
  body: string | null;
  slug?: string;
  category?: string;
  metadata?: Record<string, any>;
  asset_url?: string;
  version?: number;
  updated_by?: string;
  isPlaceholder: boolean;
  rawItem?: CommandContentItem | null;
}

let seedPromise: Promise<number> | null = null;

/**
 * Resolves content by content_key.
 * If status === 'PUBLISHED' and has real content, returns the published content.
 * Otherwise returns a typed placeholder:
 * { content_key, status: 'PLACEHOLDER', content_type, title, summary, body: null }
 * Never throws — missing content must never crash a page.
 */
export async function resolveContent(contentKey: string): Promise<ResolvedContent> {
  const manifestEntry = getManifestEntry(contentKey);
  const fallbackTitle = manifestEntry?.defaultTitle || humanizeKey(contentKey);
  const fallbackSummary =
    manifestEntry?.defaultSummary || `Content being prepared for ${fallbackTitle}.`;
  const fallbackType: ContentType = manifestEntry?.content_type || 'text';

  try {
    const item = await CoreIQData.getContentByContentKey(contentKey);

    if (item) {
      const normalizedStatus = (item.status || '').toUpperCase();
      const isPublished = normalizedStatus === 'PUBLISHED' || item.published === true;

      if (isPublished && normalizedStatus === 'PUBLISHED') {
        return {
          content_key: item.content_key || contentKey,
          status: 'PUBLISHED',
          content_type: (item.content_type as ContentType) || fallbackType,
          title: item.title || fallbackTitle,
          summary: item.summary || item.body?.slice(0, 200) || fallbackSummary,
          body: item.body || item.value || null,
          slug: item.slug || manifestEntry?.slug,
          category: item.category || manifestEntry?.category,
          metadata: item.metadata || manifestEntry?.metadata,
          asset_url: item.asset_url || item.media_reference,
          version: item.version || 1,
          updated_by: item.updated_by,
          isPlaceholder: false,
          rawItem: item,
        };
      }

      // Found in DB/store, but is in PLACEHOLDER/DRAFT/REVIEW state
      return {
        content_key: item.content_key || contentKey,
        status: 'PLACEHOLDER',
        content_type: (item.content_type as ContentType) || fallbackType,
        title: item.title || fallbackTitle,
        summary: item.summary || fallbackSummary,
        body: null,
        slug: item.slug || manifestEntry?.slug,
        category: item.category || manifestEntry?.category,
        metadata: item.metadata || manifestEntry?.metadata,
        asset_url: item.asset_url || item.media_reference,
        version: item.version || 1,
        updated_by: item.updated_by,
        isPlaceholder: true,
        rawItem: item,
      };
    }

    // No row found: return typed placeholder
    return {
      content_key: contentKey,
      status: 'PLACEHOLDER',
      content_type: fallbackType,
      title: fallbackTitle,
      summary: fallbackSummary,
      body: null,
      slug: manifestEntry?.slug,
      category: manifestEntry?.category,
      metadata: manifestEntry?.metadata,
      version: 1,
      isPlaceholder: true,
      rawItem: null,
    };
  } catch (err) {
    console.warn(`[ContentResolver] Non-fatal error resolving '${contentKey}':`, err);
    // Never throws — return safe fallback placeholder
    return {
      content_key: contentKey,
      status: 'PLACEHOLDER',
      content_type: fallbackType,
      title: fallbackTitle,
      summary: fallbackSummary,
      body: null,
      slug: manifestEntry?.slug,
      category: manifestEntry?.category,
      metadata: manifestEntry?.metadata,
      version: 1,
      isPlaceholder: true,
      rawItem: null,
    };
  }
}

/**
 * Resolves content by slug (e.g. 'ai-workflows' -> looks up 'learn.guide.ai-workflows' or slug match).
 */
export async function resolveBySlug(slug: string): Promise<ResolvedContent> {
  const guideKey = `learn.guide.${slug}`;
  const manifestEntry = getManifestEntryBySlug(slug);
  const keyToUse = manifestEntry?.content_key || guideKey;

  const resolved = await resolveContent(keyToUse);
  if (!resolved.slug) {
    resolved.slug = slug;
  }
  return resolved;
}

/**
 * Resolves multiple content keys in parallel.
 */
export async function resolveAll(
  contentKeys: string[]
): Promise<Record<string, ResolvedContent>> {
  const results = await Promise.all(contentKeys.map((key) => resolveContent(key)));
  const map: Record<string, ResolvedContent> = {};
  for (let i = 0; i < contentKeys.length; i++) {
    map[contentKeys[i]] = results[i];
  }
  return map;
}

/**
 * Idempotently seeds placeholder rows for any manifest entries with no existing row.
 * Re-running does not duplicate rows.
 */
export async function seedManifestPlaceholders(): Promise<number> {
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    try {
      const existingItems = await CoreIQData.getContentItems();
      const existingKeys = new Set<string>();

      for (const item of existingItems) {
        if (item.content_key) existingKeys.add(item.content_key);
        if (item.key) existingKeys.add(item.key);
      }

      let insertedCount = 0;

      for (const entry of CONTENT_MANIFEST) {
        if (!existingKeys.has(entry.content_key)) {
          const title = entry.defaultTitle || humanizeKey(entry.content_key);
          const summary =
            entry.defaultSummary || `Content being prepared for ${title}.`;

          await CoreIQData.insertContentItem({
            content_key: entry.content_key,
            key: entry.content_key,
            title,
            summary,
            body: '',
            value: '',
            category: entry.category || 'learning',
            content_type: entry.content_type,
            status: 'PLACEHOLDER',
            slug: entry.slug,
            metadata: entry.metadata || {},
            published: false,
            version: 1,
            type: entry.content_type === 'video' || entry.content_type === 'pdf' ? 'image' : 'text',
          });

          existingKeys.add(entry.content_key);
          insertedCount++;
        }
      }

      return insertedCount;
    } catch (e) {
      console.warn('[ContentResolver] Error seeding manifest placeholders:', e);
      return 0;
    } finally {
      seedPromise = null;
    }
  })();

  return seedPromise;
}
