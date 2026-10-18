export type SlotPlacement = {
  slotKey: string;
  page: 'home' | 'solutions' | 'apps' | 'learn' | 'tools' | 'about' | 'news' | 'site' | 'maatverse';
  route: string;
  component: string;
  position: string;
  wired: boolean;
  label?: string;
  type?: string;
  allowedTypes?: ('image' | 'video' | 'url' | 'file')[];
  capacity?: number;
  maxSize?: number;
  imageMaxBytes?: number;
  videoMaxBytes?: number;
  fileMaxBytes?: number;
  aspectRatio?: string;
  placement?: string;
  fields?: string[];
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
  'learn.lesson_of_week': {
    slotKey: 'learn.lesson_of_week',
    page: 'learn',
    route: '/learn',
    component: 'LessonOfTheWeekCard',
    position: 'Hero zone: Lesson of the Week large video card with click-to-load facade',
    wired: true,
    label: 'Lesson of the Week',
    type: 'VIDEO or URL',
    allowedTypes: ['video', 'url'],
    capacity: 1,
    maxSize: 209715200, // 200 MB raised cap for Learn
    videoMaxBytes: 209715200,
    aspectRatio: '16:9',
    fields: ['alt', 'title', 'caption', 'cta_label', 'cta_url'],
  },
  'learn.step1.video': {
    slotKey: 'learn.step1.video',
    page: 'learn',
    route: '/learn',
    component: 'StepCard',
    position: 'Step 1: Video player with click-to-load facade',
    wired: true,
    label: 'Step 1 Video',
    type: 'VIDEO',
    allowedTypes: ['video'],
    capacity: 1,
    maxSize: 209715200, // 200 MB
    videoMaxBytes: 209715200,
    aspectRatio: '16:9',
  },
  'learn.step2.video': {
    slotKey: 'learn.step2.video',
    page: 'learn',
    route: '/learn',
    component: 'StepCard',
    position: 'Step 2: Video player with click-to-load facade',
    wired: true,
    label: 'Step 2 Video',
    type: 'VIDEO',
    allowedTypes: ['video'],
    capacity: 1,
    maxSize: 209715200, // 200 MB
    videoMaxBytes: 209715200,
    aspectRatio: '16:9',
  },
  'learn.step3.video': {
    slotKey: 'learn.step3.video',
    page: 'learn',
    route: '/learn',
    component: 'StepCard',
    position: 'Step 3: Video player with click-to-load facade',
    wired: true,
    label: 'Step 3 Video',
    type: 'VIDEO',
    allowedTypes: ['video'],
    capacity: 1,
    maxSize: 209715200, // 200 MB
    videoMaxBytes: 209715200,
    aspectRatio: '16:9',
  },
  'learn.step1.pdf': {
    slotKey: 'learn.step1.pdf',
    page: 'learn',
    route: '/learn',
    component: 'StepCard',
    position: 'Step 1: Download PDF button',
    wired: true,
    label: 'Step 1 PDF Guide',
    type: 'FILE (PDF)',
    allowedTypes: ['file'],
    capacity: 1,
    maxSize: 20971520, // 20 MB
    fields: ['title', 'file'],
  },
  'learn.step2.pdf': {
    slotKey: 'learn.step2.pdf',
    page: 'learn',
    route: '/learn',
    component: 'StepCard',
    position: 'Step 2: Download PDF button',
    wired: true,
    label: 'Step 2 PDF Guide',
    type: 'FILE (PDF)',
    allowedTypes: ['file'],
    capacity: 1,
    maxSize: 20971520, // 20 MB
    fields: ['title', 'file'],
  },
  'learn.step3.pdf': {
    slotKey: 'learn.step3.pdf',
    page: 'learn',
    route: '/learn',
    component: 'StepCard',
    position: 'Step 3: Download PDF button',
    wired: true,
    label: 'Step 3 PDF Guide',
    type: 'FILE (PDF)',
    allowedTypes: ['file'],
    capacity: 1,
    maxSize: 20971520, // 20 MB
    fields: ['title', 'file'],
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
  'tools.maatverse.banner': {
    slotKey: 'tools.maatverse.banner',
    page: 'tools',
    route: '/tools',
    component: 'MaatverseBanner',
    position: 'Banner art 1600x600, keep key content in the centre 60%. Leave the caption EMPTY if your artwork already contains its own text. Link defaults to /maatverse.',
    wired: true,
    label: "Ma'atverse Stage Banner",
    type: 'IMAGE / VIDEO',
    allowedTypes: ['image', 'video'],
    capacity: 1,
    maxSize: 52428800,
    imageMaxBytes: 5242880,
    videoMaxBytes: 52428800,
    aspectRatio: '8:3',
    fields: ['caption', 'link', 'order'],
  },
  'tools.maatverse.mascot': {
    slotKey: 'tools.maatverse.mascot',
    page: 'tools',
    route: '/tools',
    component: 'MaatverseStage',
    position: 'Transparent PNG/WebP or animated WebP, portrait about 560x700. Replace it any time. Shown beside the banner.',
    wired: true,
    label: "Ma'atverse Mascot",
    type: 'IMAGE / VIDEO',
    allowedTypes: ['image', 'video'],
    capacity: 1,
    maxSize: 52428800,
    imageMaxBytes: 5242880,
    videoMaxBytes: 52428800,
    aspectRatio: '4:5',
    fields: ['order'],
  },
  'tools.page.background': {
    slotKey: 'tools.page.background',
    page: 'tools',
    route: '/tools',
    component: 'PageBackground',
    position: 'Background for the whole Tools page. 1920x1080 image or short looping muted MP4 under 6 MB. Dark, low-contrast art works best; text sits on top of it.',
    wired: true,
    label: 'Tools Page Background',
    type: 'IMAGE / VIDEO',
    allowedTypes: ['image', 'video'],
    capacity: 1,
    maxSize: 52428800,
    imageMaxBytes: 6291456,
    videoMaxBytes: 6291456,
    aspectRatio: '16:9',
    fields: ['order'],
  },
  'maatverse.page.background': {
    slotKey: 'maatverse.page.background',
    page: 'maatverse',
    route: '/maatverse',
    component: 'PageBackground',
    position: 'Background for the whole /maatverse page. 1920x1080 image or short looping muted MP4 under 6 MB.',
    wired: true,
    label: "Ma'atverse Page Background",
    type: 'IMAGE / VIDEO',
    allowedTypes: ['image', 'video'],
    capacity: 1,
    maxSize: 52428800,
    imageMaxBytes: 6291456,
    videoMaxBytes: 6291456,
    aspectRatio: '16:9',
    fields: ['order'],
  },
};

export const MEDIA_PLACEMENTS_LIST: SlotPlacement[] = Object.values(MEDIA_PLACEMENTS);

export function getPlacementForSlot(slotKey: string): SlotPlacement | undefined {
  return MEDIA_PLACEMENTS[slotKey];
}
