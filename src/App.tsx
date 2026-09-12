import { SplashScreen } from './components/common/SplashScreen';
import React, { useState, useEffect } from 'react';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { SiteVisualEnvironment } from './components/environment/SiteVisualEnvironment';
import { HomePage } from './pages/HomePage';
import { SolutionsPage } from './pages/SolutionsPage';
import { AppsPage } from './pages/AppsPage';
import { LearnPage } from './pages/LearnPage';
import { ToolsPage } from './pages/ToolsPage';
import { AboutPage } from './pages/AboutPage';
import { AskPage } from './pages/AskPage';
import { NavRoute } from './types';
import { useScrollReveal } from './hooks/useScrollReveal';

export default function App() {
  const getRoute = (): NavRoute => {
    const p = window.location.pathname.replace(/^\//, '').toLowerCase();
    if (p === 'solutions') return 'solutions';
    if (p === 'apps') return 'apps';
    if (p === 'learn') return 'learn';
    if (p === 'tools') return 'tools';
    if (p === 'about') return 'about';
    if (p === 'ask') return 'ask';
    return 'home';
  };

  const [currentRoute, setCurrentRoute] = useState<NavRoute>(getRoute);
  const [activePrompt, setActivePrompt] = useState('');
  const [showSplash, setShowSplash] = React.useState(true);
  const [pageKey, setPageKey] = useState(0);

  useScrollReveal();

  useEffect(() => {
    const onPop = () => { setCurrentRoute(getRoute()); setPageKey(k => k + 1); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigateTo = (route: NavRoute, query?: string) => {
    setCurrentRoute(route);
    setPageKey(k => k + 1);
    if (query) setActivePrompt(query);
    window.history.pushState({}, '', route === 'home' ? '/' : `/${route}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (showSplash) return <SplashScreen onComplete={() => setShowSplash(false)} />;

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <SiteVisualEnvironment currentRoute={currentRoute} />
      <Header currentRoute={currentRoute} onNavigate={navigateTo} />
      <main key={pageKey} className="relative z-10 flex-1 w-full flex flex-col page-enter">
        {currentRoute === 'home'      && <HomePage      onNavigate={navigateTo} onAsk={q => navigateTo('ask', q)} />}
        {currentRoute === 'solutions' && <SolutionsPage onNavigate={navigateTo} onAsk={q => navigateTo('ask', q)} />}
        {currentRoute === 'apps'      && <AppsPage      onNavigate={navigateTo} onAsk={q => navigateTo('ask', q)} />}
        {currentRoute === 'learn'     && <LearnPage     onNavigate={navigateTo} onAsk={q => navigateTo('ask', q)} />}
        {currentRoute === 'tools'     && <ToolsPage     onNavigate={navigateTo} onAsk={q => navigateTo('ask', q)} />}
        {currentRoute === 'about'     && <AboutPage     onNavigate={navigateTo} onAsk={q => navigateTo('ask', q)} />}
        {currentRoute === 'ask'       && <AskPage       initialPrompt={activePrompt} onNavigate={navigateTo} />}
      </main>
      <Footer onNavigate={navigateTo} />
    </div>
  );
}