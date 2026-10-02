export type SlotPlacement = {
  slotKey: string;
  page: 'home' | 'solutions' | 'apps' | 'learn' | 'tools' | 'about' | 'site';
  route: string;
  component: string;
  position: string;
  wired: boolean;
};

export const HERO_ANCHOR =
  'Hero zone: directly below the "Ask CoreIQ" input block, above the first content section. Rendered inside CoreIQSentinel.';

export const MEDIA_PLACEMENTS: Record<string, SlotPlacement> = {
  'home.showcase': {
    slotKey: 'home.showcase',
    page: 'home',
    route: '/',
    component: 'CoreIQSentinel',
    position: HERO_ANCHOR,
    wired: true,
  },
  'home.intro_video': {
    slotKey: 'home.intro_video',
    page: 'home',
    route: '/',
    component: 'CoreIQRuntimeCard',
    position: 'Inside the existing "COREIQ RUNTIME" card (replaces its static image)',
    wired: true,
  },
  'home.intro_poster': {
    slotKey: 'home.intro_poster',
    page: 'home',
    route: '/',
    component: 'CoreIQRuntimeCard',
    position: 'Poster of the RUNTIME card video',
    wired: true,
  },
  'solutions.showcase': {
    slotKey: 'solutions.showcase',
    page: 'solutions',
    route: '/solutions',
    component: 'CoreIQSentinel',
    position: HERO_ANCHOR,
    wired: false,
  },
  'apps.showcase': {
    slotKey: 'apps.showcase',
    page: 'apps',
    route: '/apps',
    component: 'CoreIQSentinel',
    position: HERO_ANCHOR,
    wired: false,
  },
  'learn.showcase': {
    slotKey: 'learn.showcase',
    page: 'learn',
    route: '/learn',
    component: 'CoreIQSentinel',
    position: HERO_ANCHOR,
    wired: false,
  },
  'tools.showcase': {
    slotKey: 'tools.showcase',
    page: 'tools',
    route: '/tools',
    component: 'CoreIQSentinel',
    position: HERO_ANCHOR,
    wired: false,
  },
  'about.showcase': {
    slotKey: 'about.showcase',
    page: 'about',
    route: '/about',
    component: 'CoreIQSentinel',
    position: HERO_ANCHOR,
    wired: false,
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
