import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  NormalizedNewsItem,
  NewsIssueSummary,
  NewsCategorySlug,
  groupAndNormalizeIssues,
} from './newsAdapter';

export type NewsLoadState = 'loading' | 'ready' | 'empty' | 'error';

interface UseNewsReturn {
  state: NewsLoadState;
  errorMessage: string | null;
  items: NormalizedNewsItem[];
  allIssueItems: NormalizedNewsItem[];
  selectedCategory: string; // 'all' | NewsCategorySlug
  selectedIssueDate: string; // YYYY-MM-DD
  currentIssueSummary: NewsIssueSummary | null;
  issueSummaries: NewsIssueSummary[];
  leadStory: NormalizedNewsItem | null;
  alsoThisWeekStories: NormalizedNewsItem[];
  setSelectedCategory: (cat: string) => void;
  setSelectedIssueDate: (date: string) => void;
  refetch: () => void;
}

export function useNews(): UseNewsReturn {
  const [state, setState] = useState<NewsLoadState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Raw fetched articles cache
  const [rawArticles, setRawArticles] = useState<any[]>([]);

  // Issues derived from grouping
  const [issuesData, setIssuesData] = useState<{
    issuesMap: Record<string, NormalizedNewsItem[]>;
    issueSummaries: NewsIssueSummary[];
  }>({ issuesMap: {}, issueSummaries: [] });

  // Read URL search params
  const getUrlParams = () => {
    if (typeof window === 'undefined') return { issue: '', cat: 'all' };
    const sp = new URLSearchParams(window.location.search);
    return {
      issue: sp.get('issue') || '',
      cat: sp.get('cat') || 'all',
    };
  };

  const [selectedIssueDate, setSelectedIssueDateState] = useState<string>(() => getUrlParams().issue);
  const [selectedCategory, setSelectedCategoryState] = useState<string>(() => getUrlParams().cat);

  // Sync state when browser back/forward buttons are pressed
  useEffect(() => {
    const onPopState = () => {
      const { issue, cat } = getUrlParams();
      setSelectedIssueDateState(issue);
      setSelectedCategoryState(cat || 'all');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Update URL search parameters without full page reload
  const updateUrlParams = useCallback((newIssue: string, newCat: string) => {
    if (typeof window === 'undefined') return;
    const currentParams = new URLSearchParams(window.location.search);

    if (newIssue) {
      currentParams.set('issue', newIssue);
    } else {
      currentParams.delete('issue');
    }

    if (newCat && newCat !== 'all') {
      currentParams.set('cat', newCat);
    } else {
      currentParams.delete('cat');
    }

    const searchStr = currentParams.toString();
    const newUrl = `${window.location.pathname}${searchStr ? `?${searchStr}` : ''}${window.location.hash}`;
    if (window.location.search !== (searchStr ? `?${searchStr}` : '')) {
      window.history.pushState(null, '', newUrl);
    }
  }, []);

  const setSelectedCategory = useCallback((cat: string) => {
    setSelectedCategoryState(cat);
    updateUrlParams(selectedIssueDate, cat);
  }, [selectedIssueDate, updateUrlParams]);

  const setSelectedIssueDate = useCallback((date: string) => {
    setSelectedIssueDateState(date);
    updateUrlParams(date, selectedCategory);
  }, [selectedCategory, updateUrlParams]);

  // Main fetch function
  const loadNews = useCallback(async () => {
    try {
      setErrorMessage(null);

      // Attempt to fetch from /api/v1/news
      const res = await fetch('/api/v1/news?issue=latest', {
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load news: HTTP ${res.status}`);
      }

      const data = await res.json();
      const rawList = Array.isArray(data.articles) ? data.articles : [];

      setRawArticles(rawList);

      const grouped = groupAndNormalizeIssues(rawList);
      setIssuesData(grouped);

      if (grouped.issueSummaries.length === 0) {
        setState('empty');
      } else {
        setState('ready');
      }
    } catch (err: any) {
      console.error('[useNews] Fetch error:', err);
      setErrorMessage(err?.message || 'Failed to load news');
      setState('error');
    }
  }, []);

  // Initial load and refetch on focus or visibility change
  useEffect(() => {
    loadNews();

    const handleFocus = () => {
      loadNews();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadNews();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('coreiq_news_updated', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('coreiq_news_updated', handleFocus);
    };
  }, [loadNews]);

  // Resolve the active issue date (fallback to the newest issue date)
  const activeIssueDate = useMemo(() => {
    if (issuesData.issueSummaries.length === 0) return '';
    if (selectedIssueDate && issuesData.issuesMap[selectedIssueDate]) {
      return selectedIssueDate;
    }
    // Default to latest published issue (issueSummaries is sorted newest first)
    return issuesData.issueSummaries[0]?.date || '';
  }, [selectedIssueDate, issuesData]);

  // Active issue summary
  const currentIssueSummary = useMemo(() => {
    return issuesData.issueSummaries.find((s) => s.date === activeIssueDate) || null;
  }, [issuesData.issueSummaries, activeIssueDate]);

  // All published items for the active issue
  const allIssueItems = useMemo(() => {
    return issuesData.issuesMap[activeIssueDate] || [];
  }, [issuesData.issuesMap, activeIssueDate]);

  // Filtered items by category if selectedCategory !== 'all'
  const items = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'all') {
      return allIssueItems;
    }
    return allIssueItems.filter((i) => i.category === selectedCategory);
  }, [allIssueItems, selectedCategory]);

  // Top Story / Lead story determination per Section 5C:
  // "TOP STORY (shown only on All, or when the lead belongs to the active category)"
  // "When a category tab other than All is active, the lead block is hidden and every matching item, including the lead, is listed here."
  // Wait! Let's check Section 5C & 5D exact wording:
  // Section 5C: "TOP STORY (shown only on All, or when the lead belongs to the active category)"
  // Section 5D: "When a category tab other than All is active, the lead block is hidden and every matching item, including the lead, is listed here."
  // Notice: on 'all', if there is a lead story (isLead === true or first item), it renders in Top Story, and the rest in Also This Week.
  // When a category tab is active (not 'all'), lead block is hidden and ALL items matching that category are in Also This Week!
  const isAllCategory = !selectedCategory || selectedCategory === 'all';

  const leadStory = useMemo(() => {
    if (!isAllCategory) return null;
    const found = allIssueItems.find((i) => i.isLead);
    return found || (allIssueItems.length > 0 ? allIssueItems[0] : null);
  }, [isAllCategory, allIssueItems]);

  const alsoThisWeekStories = useMemo(() => {
    if (isAllCategory) {
      if (!leadStory) return allIssueItems;
      return allIssueItems.filter((i) => i.id !== leadStory.id);
    }
    // When a category tab other than All is active, every matching item is listed in Also This Week
    return items;
  }, [isAllCategory, leadStory, allIssueItems, items]);

  return {
    state,
    errorMessage,
    items,
    allIssueItems,
    selectedCategory,
    selectedIssueDate: activeIssueDate,
    currentIssueSummary,
    issueSummaries: issuesData.issueSummaries,
    leadStory,
    alsoThisWeekStories,
    setSelectedCategory,
    setSelectedIssueDate,
    refetch: loadNews,
  };
}
