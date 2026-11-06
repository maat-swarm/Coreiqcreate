/**
 * routeSeo.ts
 * Centralized per-route SEO head manager without external dependencies.
 * Synchronizes document.title, meta description, canonical link,
 * robots indexing directives, and OpenGraph/Twitter tags for every route.
 */

export const SITE_ORIGIN = 'https://coreiqcreate-ten.vercel.app';

export interface RouteMeta {
  title: string;
  description: string;
  canonical: string;
  noindex?: boolean;
}

export const ROUTE_METADATA: Record<string, RouteMeta> = {
  home: {
    title: 'CoreIQ Create',
    description:
      'CoreIQ Create — AI agents, custom apps, and automation built for your business. Deployed in days, not months.',
    canonical: `${SITE_ORIGIN}/`,
  },
  services: {
    title: 'AI Agents, Workflow Automation & Custom Systems | CoreIQ Create',
    description:
      'CoreIQ Create builds AI agents, workflow automation, WhatsApp and voice AI, and custom systems for businesses in South Africa, Africa and worldwide.',
    canonical: `${SITE_ORIGIN}/services`,
  },
  'use-cases': {
    title: 'Use Cases & AI Solutions | CoreIQ Create',
    description:
      'Real-world AI implementations, automation workflows, and measurable business outcomes built with CoreIQ Create.',
    canonical: `${SITE_ORIGIN}/use-cases`,
  },
  solutions: {
    title: 'Use Cases & AI Solutions | CoreIQ Create',
    description:
      'Real-world AI implementations, automation workflows, and measurable business outcomes built with CoreIQ Create.',
    canonical: `${SITE_ORIGIN}/use-cases`,
  },
  apps: {
    title: 'Applications & Software Products | CoreIQ Create',
    description:
      'Explore custom software, creative studios, and automation tools built and deployed on the CoreIQ platform.',
    canonical: `${SITE_ORIGIN}/apps`,
  },
  learn: {
    title: 'Learn AI & Automation Guides | CoreIQ Create',
    description:
      'Comprehensive guides, tutorials, and practical frameworks for prompt engineering, autonomous agents, and workflows.',
    canonical: `${SITE_ORIGIN}/learn`,
  },
  tools: {
    title: 'Interactive AI Tools & Utilities | CoreIQ Create',
    description:
      'Free interactive AI tools for prompt enhancement, regex generation, headline copywriting, and workflow mapping.',
    canonical: `${SITE_ORIGIN}/tools`,
  },
  about: {
    title: 'About CoreIQ Create — Philosophy, Trust & Compliance',
    description:
      'Our mission, architectural principles, enterprise security whitepaper, and legal compliance documentation.',
    canonical: `${SITE_ORIGIN}/about`,
  },
  news: {
    title: 'AI News & Signals — The CoreIQ Weekly',
    description:
      'Weekly analysis and curated signals on multimodal AI, autonomous coding swarms, MCP standards, and enterprise AI.',
    canonical: `${SITE_ORIGIN}/news`,
  },
  ask: {
    title: 'Ask CoreIQ — Autonomous System Architect',
    description:
      'Describe your project or automation challenge to CoreIQ and receive structured architecture blueprints instantly.',
    canonical: `${SITE_ORIGIN}/ask`,
  },
  maatverse: {
    title: "The Ma'atverse — Multimodal Creative Universe | CoreIQ Create",
    description:
      "Explore multimodal creativity, storytelling, audio synthesis, and visual arts generated within the Ma'atverse.",
    canonical: `${SITE_ORIGIN}/maatverse`,
  },
  command: {
    title: 'Command Dashboard — CoreIQ Create',
    description: 'CoreIQ Command operator control panel and real-time execution orchestrator.',
    canonical: `${SITE_ORIGIN}/command`,
    noindex: true,
  },
  'writing-assistant': {
    title: 'Writing Assistant — CoreIQ Create',
    description: 'AI-powered writing tools for proposals, briefs, and content. Launching soon.',
    canonical: `${SITE_ORIGIN}/writing-assistant`,
    noindex: true,
  },
  imageforge: {
    title: 'ImageForge Studio — CoreIQ Create',
    description: 'Generate, edit, and export AI imagery for your brand and campaigns. Launching soon.',
    canonical: `${SITE_ORIGIN}/imageforge`,
    noindex: true,
  },
  'core-principles': {
    title: 'Core Principles — CoreIQ Create',
    description: 'The philosophy behind CoreIQ Create and how we think about intelligent creation.',
    canonical: `${SITE_ORIGIN}/core-principles`,
    noindex: true,
  },
  '404': {
    title: 'Page Not Found — CoreIQ Create',
    description: 'The requested resource was not found on CoreIQ Create.',
    canonical: `${SITE_ORIGIN}/404`,
    noindex: true,
  },
};

function setMetaTag(attrName: 'name' | 'property', attrValue: string, content: string) {
  if (typeof document === 'undefined') return;
  let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonicalTag(url: string) {
  if (typeof document === 'undefined') return;
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}

function setRobotsTag(noindex: boolean) {
  if (typeof document === 'undefined') return;
  let el = document.querySelector('meta[name="robots"]');
  if (noindex) {
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', 'robots');
      document.head.appendChild(el);
    }
    el.setAttribute('content', 'noindex, nofollow');
  } else {
    if (el) {
      el.setAttribute('content', 'index, follow');
    }
  }
}

/**
 * Resolve metadata for any route, including dynamic patterns
 */
export function resolveRouteMetadata(route: string): RouteMeta {
  const clean = route.replace(/^\//, '').toLowerCase();

  // 1. Direct match in static registry
  if (ROUTE_METADATA[clean]) {
    return ROUTE_METADATA[clean];
  }

  // 2. Command route or hash
  if (clean === 'command' || clean.startsWith('command/')) {
    return ROUTE_METADATA.command;
  }

  // 3. App access token verification link
  if (clean.startsWith('apps/access/')) {
    return {
      title: 'Access Verification — CoreIQ Create',
      description: 'Verify and download your licensed digital application package from CoreIQ Create.',
      canonical: `${SITE_ORIGIN}/apps`,
      noindex: true,
    };
  }

  // 4. Dynamic app detail page: apps/:slug
  if (clean.startsWith('apps/')) {
    const slug = clean.replace(/^apps\//, '');
    const formattedTitle = slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return {
      title: `${formattedTitle} — Application Details | CoreIQ Create`,
      description: `Explore ${formattedTitle} on CoreIQ Create. Discover features, architecture specifications, and distribution packages.`,
      canonical: `${SITE_ORIGIN}/apps/${slug}`,
    };
  }

  // 5. Dynamic learn guide page: learn/:slug
  if (clean.startsWith('learn/')) {
    const slug = clean.replace(/^learn\//, '');
    const formattedTitle = slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return {
      title: `${formattedTitle} — Intelligence Guide | CoreIQ Create`,
      description: `Comprehensive guide to ${formattedTitle}. Practical patterns, prompt structures, and implementation workflows from CoreIQ.`,
      canonical: `${SITE_ORIGIN}/learn/${slug}`,
    };
  }

  // 6. Dynamic maatverse section/entry: maatverse/:subpath
  if (clean.startsWith('maatverse/')) {
    const subpath = clean.replace(/^maatverse\//, '');
    return {
      title: `The Ma'atverse — ${subpath} | CoreIQ Create`,
      description: `Explore multimodal creativity and artistic productions in the Ma'atverse.`,
      canonical: `${SITE_ORIGIN}/maatverse/${subpath}`,
    };
  }

  // Fallback to home
  return ROUTE_METADATA.home;
}

/**
 * Update document head with metadata for the current route
 */
export function applyRouteSeo(route: string) {
  if (typeof document === 'undefined') return;

  const meta = resolveRouteMetadata(route);

  // 1. Document Title
  document.title = meta.title;

  // 2. Meta Description
  setMetaTag('name', 'description', meta.description);

  // 3. Canonical Tag
  setCanonicalTag(meta.canonical);

  // 4. Robots Tag (noindex on command/auth, index on public)
  setRobotsTag(Boolean(meta.noindex));

  // 5. OpenGraph Tags
  setMetaTag('property', 'og:title', meta.title);
  setMetaTag('property', 'og:description', meta.description);
  setMetaTag('property', 'og:url', meta.canonical);

  // 6. Twitter Tags
  setMetaTag('name', 'twitter:title', meta.title);
  setMetaTag('name', 'twitter:description', meta.description);
}
