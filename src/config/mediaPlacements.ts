export type SlotPlacement = {
  slotKey: string;
  page: 'home' | 'solutions' | 'apps' | 'learn' | 'tools' | 'about' | 'news' | 'site';
  route: string;
  component: string;
  position: string;
  wired: boolean;
  label?: string;
  type?: string;
  allowedTypes?: ('image' | 'video' | 'url')[];
  capacity?: number;
  maxSize?: number;
  imageMaxBytes?: number;
  videoMaxBytes?: number;
  aspectRatio?: string;
  placement?: string;
};

export const HERO_ANCHOR =
  'Hero zone: directly below the "Ask CoreIQ" input block, above the first content section. Rendered inside CoreIQSentinel.';

export const CAROUSEL_LIMITS = {
  capacity: 6,
  aspectRatio: '16:9',
  allowedTypes: ['image', 'video'] as ('image' | 'video')[],
  imageMaxBytes: 5242880, // 5 MB (webp, png, jpeg)
  videoMaxBytes: 52428800, // 50 MB (mp4, webm)
  imageFormats: ['webp', 'png', 'jpeg'],
  videoFormats: ['mp4', 'webm'],
};

/**
 * Single Shared Carousel Configuration:
 * - Allowed types: image + video
 * - Image max: 5 MB (5,242,880 bytes) - webp, png, jpeg
 * - Video max: 50 MB (52,428,800 bytes) - mp4, webm
 * - Aspect Ratio: 16:9
 * - Capacity: 6 items
 */
export const SHARED_CAROUSEL_CONFIG = {
  component: 'CoreIQSentinel',
  position: HERO_ANCHOR,
  wired: true,
  type: 'IMAGE / VIDEO',
  allowedTypes: ['image', 'video'] as ('image' | 'video')[],
  capacity: 6,
  maxSize: 52428800, // 50 MB upper slot limit
  imageMaxBytes: 5242880, // 5 MB for image uploads
  videoMaxBytes: 52428800, // 50 MB for video uploads
  aspectRatio: '16:9',
  placement: HERO_ANCHOR,
};

export const MEDIA_PLACEMENTS: Record<string, SlotPlacement> = {
  'home.showcase': {
    slotKey: 'home.showcase',
    page: 'home',
    route: '/',
    label: 'Home showcase carousel',
    ...SHARED_CAROUSEL_CONFIG,
  },
  'home.intro_video': {
    slotKey: 'home.intro_video',
    page: 'home',
    route: '/',
    component: 'CoreIQRuntimeCard',
    position: 'Inside the existing "COREIQ RUNTIME" card (replaces its static image)',
    wired: true,
    allowedTypes: ['video', 'url'],
  },
  'home.intro_poster': {
    slotKey: 'home.intro_poster',
    page: 'home',
    route: '/',
    component: 'CoreIQRuntimeCard',
    position: 'Poster of the RUNTIME card video',
    wired: true,
    allowedTypes: ['image'],
  },
  'solutions.showcase': {
    slotKey: 'solutions.showcase',
    page: 'solutions',
    route: '/solutions',
    label: 'Solutions showcase carousel',
    ...SHARED_CAROUSEL_CONFIG,
  },
  'apps.showcase': {
    slotKey: 'apps.showcase',
    page: 'apps',
    route: '/apps',
    label: 'Apps showcase carousel',
    ...SHARED_CAROUSEL_CONFIG,
  },
  'learn.showcase': {
    slotKey: 'learn.showcase',
    page: 'learn',
    route: '/learn',
    label: 'Learn showcase carousel',
    ...SHARED_CAROUSEL_CONFIG,
  },
  'tools.showcase': {
    slotKey: 'tools.showcase',
    page: 'tools',
    route: '/tools',
    label: 'Tools showcase carousel',
    ...SHARED_CAROUSEL_CONFIG,
  },
  'tools': {
    slotKey: 'tools.showcase',
    page: 'tools',
    route: '/tools',
    label: 'Tools showcase carousel',
    ...SHARED_CAROUSEL_CONFIG,
  },
  'about.showcase': {
    slotKey: 'about.showcase',
    page: 'about',
    route: '/about',
    label: 'About showcase carousel',
    ...SHARED_CAROUSEL_CONFIG,
  },
  'about': {
    slotKey: 'about.showcase',
    page: 'about',
    route: '/about',
    label: 'About showcase carousel',
    ...SHARED_CAROUSEL_CONFIG,
  },
  'news.showcase': {
    slotKey: 'news.showcase',
    page: 'news',
    route: '/news',
    label: 'News showcase carousel',
    ...SHARED_CAROUSEL_CONFIG,
  },
  'news': {
    slotKey: 'news.showcase',
    page: 'news',
    route: '/news',
    label: 'News showcase carousel',
    ...SHARED_CAROUSEL_CONFIG,
  },
  'site.background': {
    slotKey: 'site.background',
    page: 'site',
    route: '*',
    component: 'VideoBackground',
    position: 'Fixed full-page background behind every page',
    wired: true,
  },
  'site.background_poster': {
    slotKey: 'site.background_poster',
    page: 'site',
    route: '*',
    component: 'VideoBackground',
    position: 'Image shown while the background video loads and when motion is reduced',
    wired: true,
  },
};

export const MEDIA_PLACEMENTS_LIST: SlotPlacement[] = Object.values(MEDIA_PLACEMENTS);

export function getPlacementForSlot(slotKey: string): SlotPlacement | undefined {
  return MEDIA_PLACEMENTS[slotKey];
}
