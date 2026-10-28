/**
 * CoreIQ Create — First-party, privacy-preserving visitor analytics tracking.
 * - No IP addresses, no personal names, no tracking cookies.
 * - Respects Do Not Track (DNT) header.
 * - Filters out bots, crawlers, and authenticated operator sessions.
 * - Non-blocking fire-and-forget execution.
 */

import { getSupabase } from './supabase';

const VISITOR_ID_KEY = 'coreiq_visitor_id';

// In-memory fallback if localStorage is unavailable or blocked (e.g. strict sandbox or private browsing)
let inMemoryVisitorId: string | null = null;

export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') {
    if (!inMemoryVisitorId) {
      inMemoryVisitorId = 'srv_' + Math.random().toString(36).substring(2, 10);
    }
    return inMemoryVisitorId;
  }

  try {
    const existing = localStorage.getItem(VISITOR_ID_KEY);
    if (existing && existing.length >= 8) {
      return existing;
    }
    const newId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'vis_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    try {
      localStorage.setItem(VISITOR_ID_KEY, newId);
    } catch {
      // Storage blocked
    }
    return newId;
  } catch {
    if (!inMemoryVisitorId) {
      inMemoryVisitorId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : 'vis_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
    return inMemoryVisitorId;
  }
}

export function detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

export function isBotOrCrawler(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return /bot|crawler|spider|crawling|slurp|duckduckbot|baiduspider|yandex|bingbot|googlebot|headlesschrome|facebookexternalhit|whatsapp|telegram/i.test(
    ua
  );
}

export function isDoNotTrackEnabled(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const nav = navigator as any;
  const win = window as any;
  return (
    nav.doNotTrack === '1' ||
    win.doNotTrack === '1' ||
    nav.msDoNotTrack === '1' ||
    nav.doNotTrack === 'yes'
  );
}

export function isOperatorSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const isAuth =
      sessionStorage.getItem('coreiq_authenticated') === 'true' ||
      localStorage.getItem('coreiq_operator_active') === 'true' ||
      localStorage.getItem('coreiq_authenticated') === 'true';
    return Boolean(isAuth);
  } catch {
    return false;
  }
}

/**
 * Tracks a page visit. Completely fire-and-forget; never blocks rendering or user interaction.
 */
export function trackPageView(pathOrRoute: string): void {
  if (typeof window === 'undefined') return;

  // 1. Skip if route is /command or starts with command
  const normalizedPath = (pathOrRoute || window.location.pathname || '/').replace(/^\/?/, '/');
  if (normalizedPath.startsWith('/command')) {
    return;
  }

  // 2. Skip bots and crawlers
  if (isBotOrCrawler()) {
    return;
  }

  // 3. Skip if visitor enabled Do Not Track
  if (isDoNotTrackEnabled()) {
    return;
  }

  // 4. Skip authenticated operator sessions
  if (isOperatorSession()) {
    return;
  }

  const visitorId = getOrCreateVisitorId();
  const deviceType = detectDeviceType();

  let referrerDomain: string | null = null;
  if (typeof document !== 'undefined' && document.referrer) {
    try {
      const parsed = new URL(document.referrer);
      referrerDomain = parsed.hostname.replace(/^www\./, '');
    } catch {
      referrerDomain = 'external';
    }
  }

  const visitRecord = {
    visitor_id: visitorId,
    path: normalizedPath,
    referrer_domain: referrerDomain,
    device_type: deviceType,
    created_at: new Date().toISOString(),
  };

  // Asynchronous fire-and-forget send
  try {
    const client = getSupabase();
    if (client) {
      Promise.resolve(client.from('site_visits').insert([visitRecord])).catch(() => {});
    }

    // Also record in local fallback store for local development/preview
    try {
      const localVisits = JSON.parse(localStorage.getItem('coreiq_local_site_visits') || '[]');
      localVisits.unshift(visitRecord);
      if (localVisits.length > 500) localVisits.length = 500;
      localStorage.setItem('coreiq_local_site_visits', JSON.stringify(localVisits));
    } catch {}
  } catch {
    // Non-blocking catch
  }
}
