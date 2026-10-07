import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SplashScreen } from './components/common/SplashScreen';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { SiteVisualEnvironment } from './components/environment/SiteVisualEnvironment';
import { BackToTop } from './components/common/BackToTop';
import { useScrollReveal } from './hooks/useScrollReveal';
import { NavRoute } from './types';
import { seedManifestPlaceholders } from './services/contentResolver';
import { HomePage } from './pages/HomePage';

export type AppRoute =
  | NavRoute
  | 'writing-assistant'
  | 'imageforge'
  | 'core-principles'
  | '404';

const VALID_NAV_ROUTES: readonly NavRoute[] = [
  'home',
  'solutions',
  'apps',
  'learn',
  'tools',
  'about',
  'news',
  'ask',
  'command',
];

// Lazy loaded secondary page components for performance
const SolutionsPage = React.lazy(() => import('./pages/SolutionsPage').then((m) => ({ default: m.SolutionsPage })));
const AppsPage = React.lazy(() => import('./pages/AppsPage').then((m) => ({ default: m.AppsPage })));
const LearnPage = React.lazy(() => import('./pages/LearnPage').then((m) => ({ default: m.LearnPage })));
const ToolsPage = React.lazy(() => import('./pages/ToolsPage').then((m) => ({ default: m.ToolsPage })));
const AboutPage = React.lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const NewsPage = React.lazy(() => import('./pages/NewsPage').then((m) => ({ default: m.NewsPage })));
const AskPage = React.lazy(() => import('./pages/AskPage').then((m) => ({ default: m.AskPage })));
const CommandDashboardPage = React.lazy(() => import('./pages/CommandDashboardPage').then((m) => ({ default: m.CommandDashboardPage })));
const LearnArticlePage = React.lazy(() => import('./pages/LearnArticlePage').then((m) => ({ default: m.LearnArticlePage })));
const ComingSoon = React.lazy(() => import('./pages/ComingSoon').then((m) => ({ default: m.ComingSoon })));

function ScrollToTop({ route }: { route: string }) {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [route]);
  return null;
}

export default function App() {
  const getRoute = (): AppRoute => {
    const p = window.location.pathname.replace(/^\//, '').toLowerCase();
    if (p.startsWith('learn/')) return p as AppRoute;
    if (p === 'command' || window.location.hash === '#command') return 'command';
    if (p === 'solutions') return 'solutions';
    if (p === 'apps') return 'apps';
    if (p === 'learn') return 'learn';
    if (p === 'tools') return 'tools';
    if (p === 'about') return 'about';
    if (p === 'news') return 'news';
    if (p === 'ask') return 'ask';
    if (p === 'writing-assistant') return 'writing-assistant';
    if (p === 'imageforge') return 'imageforge';
    if (p === 'core-principles') return 'core-principles';
    if (!p || p === '') return 'home';
    return '404';
  };

  const [currentRoute, setCurrentRoute] = useState<AppRoute>(getRoute);
  const [activePrompt, setActivePrompt] = useState('');
  const [showSplash, setShowSplash] = React.useState(true);

  useScrollReveal();

  useEffect(() => {
    try {
      seedManifestPlaceholders().catch((err) => {
        console.warn('[CoreIQ] Manifest seeding warning:', err);
      });
    } catch {}
    const onPop = () => {
      setCurrentRoute(getRoute());
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigateTo = (route: string, query?: string) => {
    setCurrentRoute(route as AppRoute);
    if (query) setActivePrompt(query);
    window.history.pushState({}, '', route === 'home' ? '/' : `/${route}`);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  if (showSplash) return <SplashScreen onComplete={() => setShowSplash(false)} />;

  const suspenseFallback = (
    <div
      style={{
        minHeight: '100svh',
        background: '#080808',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '2px solid transparent',
          borderTopColor: '#00e676',
          animation: 'spin 0.8s linear infinite',
        }}
      />
    </div>
  );

  if (currentRoute === 'command') {
    return (
      <Suspense fallback={suspenseFallback}>
        <CommandDashboardPage onExitToWebsite={() => navigateTo('home')} />
      </Suspense>
    );
  }

  const activeNavRoute: NavRoute = currentRoute.startsWith('learn/')
    ? 'learn'
    : (VALID_NAV_ROUTES.includes(currentRoute as NavRoute)
      ? (currentRoute as NavRoute)
      : 'home');

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <ScrollToTop route={currentRoute} />
      <SiteVisualEnvironment currentRoute={activeNavRoute} />
      <Header currentRoute={activeNavRoute} onNavigate={navigateTo} />
      <Suspense fallback={suspenseFallback}>
        <AnimatePresence mode="wait">
          <motion.main
            id="main-content"
            key={currentRoute}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', flex: 1 }}
            className="relative z-10 w-full"
          >
            {currentRoute === 'home' && <HomePage onNavigate={navigateTo} onAsk={(q) => navigateTo('ask', q)} />}
            {currentRoute === 'solutions' && <SolutionsPage onNavigate={navigateTo} onAsk={(q) => navigateTo('ask', q)} />}
            {currentRoute === 'apps' && <AppsPage onNavigate={navigateTo} onAsk={(q) => navigateTo('ask', q)} />}
            {currentRoute === 'learn' && <LearnPage onNavigate={navigateTo} onAsk={(q) => navigateTo('ask', q)} />}
            {currentRoute.startsWith('learn/') && (
              <LearnArticlePage
                slug={currentRoute.replace(/^learn\//, '')}
                onNavigate={navigateTo}
                onAsk={(q) => navigateTo('ask', q)}
              />
            )}
            {currentRoute === 'tools' && <ToolsPage onNavigate={navigateTo} onAsk={(q) => navigateTo('ask', q)} />}
            {currentRoute === 'about' && <AboutPage onNavigate={navigateTo} onAsk={(q) => navigateTo('ask', q)} />}
            {currentRoute === 'news' && <NewsPage onNavigate={navigateTo} onAsk={(q) => navigateTo('ask', q)} />}
            {currentRoute === 'ask' && <AskPage initialPrompt={activePrompt} onNavigate={navigateTo} />}
            {currentRoute === 'writing-assistant' && (
              <ComingSoon
                title="Writing Assistant"
                description="AI-powered writing tools for proposals, briefs, and content. Launching soon."
                onNavigate={navigateTo}
              />
            )}
            {currentRoute === 'imageforge' && (
              <ComingSoon
                title="ImageForge Studio"
                description="Generate, edit, and export AI imagery for your brand and campaigns. Launching soon."
                onNavigate={navigateTo}
              />
            )}
            {currentRoute === 'core-principles' && (
              <ComingSoon
                title="Core Principles"
                description="The philosophy behind CoreIQ Create and how we think about intelligent creation."
                onNavigate={navigateTo}
              />
            )}
            {currentRoute === '404' && (
              <ComingSoon
                title="Page Not Found"
                description="This page doesn't exist yet — or it's being built right now."
                onNavigate={navigateTo}
              />
            )}
          </motion.main>
        </AnimatePresence>
      </Suspense>
      <BackToTop />
      <Footer onNavigate={navigateTo} />
    </div>
  );
}