import React, { useState, useEffect } from 'react';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { AmbientBackground } from './components/common/AmbientBackground';
import { HomePage } from './pages/HomePage';
import { SolutionsPage } from './pages/SolutionsPage';
import { AppsPage } from './pages/AppsPage';
import { LearnPage } from './pages/LearnPage';
import { ToolsPage } from './pages/ToolsPage';
import { AboutPage } from './pages/AboutPage';
import { AskPage } from './pages/AskPage';
import { NavRoute } from './types';

export default function App() {
  // Parse initial route from window.location.pathname
  const getInitialRoute = (): NavRoute => {
    const path = window.location.pathname.replace(/^\//, '').toLowerCase();
    if (path === 'solutions') return 'solutions';
    if (path === 'apps') return 'apps';
    if (path === 'learn') return 'learn';
    if (path === 'tools') return 'tools';
    if (path === 'about') return 'about';
    if (path === 'ask') return 'ask';
    return 'home';
  };

  const [currentRoute, setCurrentRoute] = useState<NavRoute>(getInitialRoute);
  const [activePrompt, setActivePrompt] = useState<string>('');

  // Handle browser popstate (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(getInitialRoute());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (route: NavRoute, query?: string) => {
    setCurrentRoute(route);
    if (query) {
      setActivePrompt(query);
    }
    const path = route === 'home' ? '/' : `/${route}`;
    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAskTrigger = (query: string) => {
    navigateTo('ask', query);
  };

  return (
    <div className="min-h-screen bg-[#050814] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <AmbientBackground />
      
      {/* Persistent Global Navigation Header */}
      <Header
        currentRoute={currentRoute}
        onNavigate={(route) => navigateTo(route)}
      />

      {/* Main Page Canvas */}
      <main className="flex-1 w-full flex flex-col">
        {currentRoute === 'home' && (
          <HomePage onNavigate={navigateTo} onAsk={handleAskTrigger} />
        )}
        {currentRoute === 'solutions' && (
          <SolutionsPage onNavigate={navigateTo} onAsk={handleAskTrigger} />
        )}
        {currentRoute === 'apps' && (
          <AppsPage onNavigate={navigateTo} onAsk={handleAskTrigger} />
        )}
        {currentRoute === 'learn' && (
          <LearnPage onNavigate={navigateTo} onAsk={handleAskTrigger} />
        )}
        {currentRoute === 'tools' && (
          <ToolsPage onNavigate={navigateTo} onAsk={handleAskTrigger} />
        )}
        {currentRoute === 'about' && (
          <AboutPage onNavigate={navigateTo} onAsk={handleAskTrigger} />
        )}
        {currentRoute === 'ask' && (
          <AskPage initialPrompt={activePrompt} onNavigate={navigateTo} />
        )}
      </main>

      {/* Persistent Global Footer */}
      <Footer onNavigate={navigateTo} />
    </div>
  );
}
