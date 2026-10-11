export type NewsCategorySlug = 'models-releases' | 'tools-launches' | 'business-policy';

export interface CategoryMeta {
  slug: NewsCategorySlug;
  label: string;
  color: string;
}

export const CATEGORIES: Record<NewsCategorySlug, CategoryMeta> = {
  'models-releases': {
    slug: 'models-releases',
    label: 'Models & Releases',
    color: '#19d9ff',
  },
  'tools-launches': {
    slug: 'tools-launches',
    label: 'Tools & Launches',
    color: '#ffb020',
  },
  'business-policy': {
    slug: 'business-policy',
    label: 'Business & Policy',
    color: '#a78bfa',
  },
};

export interface NormalizedNewsItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: NewsCategorySlug;
  categoryLabel: string;
  categoryColor: string;
  sourceName: string;
  sourceDomain: string;
  sourceUrl: string;
  hasOutboundLink: boolean;
  imageUrl: string | null;
  issueDate: string; // YYYY-MM-DD (Friday on or before)
  rank: number;
  isLead: boolean;
  publishedAt: string;
  relativeTime: string;
}

export interface NewsIssueSummary {
  date: string; // YYYY-MM-DD
  count: number;
  issueNumber: number; // 1-indexed, oldest = 1
  formattedDate: string;
}

/**
 * Returns the YYYY-MM-DD representation of the Friday on or before a given UTC date.
 */
export function getFridayOnOrBeforeUTC(dateInput?: string | number | Date | null): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) {
    return getFridayOnOrBeforeUTC(new Date());
  }
  const day = d.getUTCDay(); // 0 = Sun, 5 = Fri
  const diff = (day + 7 - 5) % 7;
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

/**
 * Extracts a clean domain from a URL (e.g., "techcrunch.com" from "https://www.techcrunch.com/article").
 */
export function extractCleanDomain(url?: string | null): string {
  if (!url) return '';
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

/**
 * Maps raw/legacy category strings to the 3 canonical category slugs.
 */
export function mapCategory(rawCat?: string | null): NewsCategorySlug {
  if (!rawCat) return 'business-policy';
  const clean = rawCat.trim().toLowerCase();

  if (
    clean === 'models-releases' ||
    clean === 'frontier models' ||
    clean === 'autonomous agents' ||
    clean === 'breakthroughs'
  ) {
    return 'models-releases';
  }

  if (
    clean === 'tools-launches' ||
    clean === 'tools & protocols' ||
    clean === 'tools and protocols' ||
    clean === 'protocols'
  ) {
    return 'tools-launches';
  }

  if (
    clean === 'business-policy' ||
    clean === 'business & policy' ||
    clean === 'business and policy'
  ) {
    return 'business-policy';
  }

  return 'business-policy';
}

/**
 * Generates a human-friendly relative or short date string.
 */
export function formatRelativeTime(dateInput?: string | null): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(d);
}

/**
 * Format a Friday issue date (YYYY-MM-DD) according to the masthead requirements:
 * "FRIDAY 16 OCTOBER 2026"
 */
export function formatIssueDate(isoDateString: string): string {
  try {
    const [year, month, day] = isoDateString.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const parts = new Intl.DateTimeFormat('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).formatToParts(d);

    // Filter and uppercase to strictly produce "FRIDAY 16 OCTOBER 2026"
    const weekday = parts.find((p) => p.type === 'weekday')?.value.toUpperCase() || '';
    const dayVal = parts.find((p) => p.type === 'day')?.value || '';
    const monthVal = parts.find((p) => p.type === 'month')?.value.toUpperCase() || '';
    const yearVal = parts.find((p) => p.type === 'year')?.value || '';

    return `${weekday} ${dayVal} ${monthVal} ${yearVal}`.trim();
  } catch {
    return isoDateString;
  }
}

/**
 * Normalizes any raw news item from the API or local store into the canonical shape.
 * Returns null if the item is not published (drafts are never shown).
 */
export function normalizeNewsItem(raw: any): NormalizedNewsItem | null {
  if (!raw || typeof raw !== 'object') return null;

  // Never show drafts
  if (raw.published === false) return null;

  const id = String(raw.id || raw.slug || Math.random());
  const slug = String(raw.slug || raw.id || id);
  const title = String(raw.title || 'Untitled Article');
  const summary = String(raw.summary || raw.dek || '');
  const categorySlug = mapCategory(raw.category);
  const catMeta = CATEGORIES[categorySlug];

  const sourceName = String(raw.source_name || raw.source || raw.author || 'CoreIQ Dispatch');
  const rawUrl = raw.source_url ? String(raw.source_url).trim() : '';
  const sourceDomain = raw.source_domain ? String(raw.source_domain).trim() : extractCleanDomain(rawUrl);

  const hasOutboundLink = Boolean(rawUrl && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')));
  const sourceUrl = hasOutboundLink ? rawUrl : '';

  const imageUrl = raw.image_url || raw.hero_image || null;

  // Determine issue date: issue_date, else published_at, else created_at
  let issueDate: string;
  if (raw.issue_date && typeof raw.issue_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.issue_date.trim())) {
    issueDate = raw.issue_date.trim();
  } else {
    issueDate = getFridayOnOrBeforeUTC(raw.published_at || raw.created_at);
  }

  const rank = typeof raw.rank === 'number' ? raw.rank : (typeof raw.sort_order === 'number' ? raw.sort_order : 100);
  const isLead = Boolean(raw.is_lead ?? raw.featured);
  const publishedAt = raw.published_at || raw.created_at || new Date().toISOString();
  const relativeTime = formatRelativeTime(publishedAt);

  return {
    id,
    slug,
    title,
    summary,
    category: categorySlug,
    categoryLabel: catMeta.label,
    categoryColor: catMeta.color,
    sourceName,
    sourceDomain,
    sourceUrl,
    hasOutboundLink,
    imageUrl,
    issueDate,
    rank,
    isLead,
    publishedAt,
    relativeTime,
  };
}

/**
 * Organizes a list of raw items into normalized, sorted issues.
 * Enforces:
 * 1. Filter drafts.
 * 2. Exactly one lead item per issue: if multiple items have is_lead, lowest rank wins and the other becomes normal.
 * 3. Sorting by rank asc, then published_at desc.
 */
export function groupAndNormalizeIssues(rawItems: any[]): {
  issuesMap: Record<string, NormalizedNewsItem[]>;
  issueSummaries: NewsIssueSummary[];
} {
  const normalizedList: NormalizedNewsItem[] = [];

  for (const raw of rawItems) {
    const item = normalizeNewsItem(raw);
    if (item) normalizedList.push(item);
  }

  // Group by issueDate
  const issuesMap: Record<string, NormalizedNewsItem[]> = {};
  for (const item of normalizedList) {
    if (!issuesMap[item.issueDate]) {
      issuesMap[item.issueDate] = [];
    }
    issuesMap[item.issueDate].push(item);
  }

  // Process each issue: ensure single lead and proper sorting
  const uniqueDates = Object.keys(issuesMap).sort(); // oldest to newest

  for (const date of uniqueDates) {
    const items = issuesMap[date];

    // Find all marked as lead
    const leadCandidates = items.filter((i) => i.isLead);

    if (leadCandidates.length > 1) {
      // Sort candidates by rank asc, then published_at desc
      leadCandidates.sort((a, b) => {
        if (a.rank !== b.rank) return a.rank - b.rank;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });

      const winningId = leadCandidates[0].id;
      // Demote all others in this issue
      for (const item of items) {
        if (item.isLead && item.id !== winningId) {
          item.isLead = false;
        }
      }
    }

    // Sort items within issue: lead first, then rank asc, then publishedAt desc
    items.sort((a, b) => {
      if (a.isLead && !b.isLead) return -1;
      if (!a.isLead && b.isLead) return 1;
      if (a.rank !== b.rank) return a.rank - b.rank;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }

  // Build summaries with 1-indexed issue numbers (oldest = 1)
  const issueSummaries: NewsIssueSummary[] = uniqueDates.map((date, idx) => ({
    date,
    count: issuesMap[date].length,
    issueNumber: idx + 1,
    formattedDate: formatIssueDate(date),
  }));

  // Reverse summaries for display (newest first)
  issueSummaries.sort((a, b) => b.date.localeCompare(a.date));

  return { issuesMap, issueSummaries };
}
