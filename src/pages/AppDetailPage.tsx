import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  MessageSquare,
  Sparkles,
  Download,
  ExternalLink,
  CreditCard,
  Send,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  Tag,
  Shield,
  History,
  Layers
} from 'lucide-react';
import {
  PublicStoreApp,
  GetAppResponse,
  fetchPublicAppBySlug,
  getAppAccess,
  AppApiError
} from '../services/storePublic';
import { AppScreenshotCarousel } from '../components/apps/AppScreenshotCarousel';
import { AppActionModal } from '../components/apps/AppActionModal';
import { NavRoute } from '../types';

interface AppDetailPageProps {
  slug: string;
  onNavigate: (route: string) => void;
  onAsk: (query: string) => void;
}

export const AppDetailPage: React.FC<AppDetailPageProps> = ({ slug, onNavigate, onAsk }) => {
  const [app, setApp] = useState<PublicStoreApp | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal / Action flow state
  const [modalOpen, setModalOpen] = useState(false);
  const [actionData, setActionData] = useState<GetAppResponse | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Document Title synchronization
  useEffect(() => {
    const originalTitle = document.title;
    if (app?.title) {
      document.title = `${app.title} — CoreIQ Apps`;
    } else {
      document.title = 'CoreIQ Apps — Application Details';
    }
    return () => {
      document.title = originalTitle;
    };
  }, [app?.title]);

  const loadApp = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await fetchPublicAppBySlug(slug);
      setApp(data);
    } catch (err: any) {
      setErrorMessage(err.message || `Application "${slug}" could not be loaded.`);
      setApp(null);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadApp();
  }, [loadApp]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-8 animate-pulse">
        {/* Back Link Skeleton */}
        <div className="w-24 h-6 bg-slate-800 rounded-lg" />

        {/* Top Header Skeleton */}
        <div className="space-y-4">
          <div className="w-48 h-5 bg-slate-800 rounded-full" />
          <div className="w-80 h-10 bg-slate-800 rounded-xl" />
          <div className="w-full max-w-xl h-6 bg-slate-800 rounded-lg" />
        </div>

        {/* Carousel Skeleton */}
        <div className="w-full aspect-video rounded-3xl bg-slate-900 border border-slate-800" />
      </div>
    );
  }

  if (errorMessage || !app) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white font-display">Application Not Found</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            {errorMessage || `We couldn't locate an application corresponding to "/apps/${slug}".`}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigate('apps')}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-800 transition-colors min-h-[44px] flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Apps</span>
          </button>
          <button
            onClick={loadApp}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors min-h-[44px] flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  const isComingSoon = app.status === 'coming_soon';
  const isPaid = app.price_mode === 'paid';
  const isContact = app.price_mode === 'contact';
  const isDownload = app.distribution_type === 'file' || app.distribution_type === 'download' || app.has_file;

  // Button config
  let buttonLabel = 'Open App';
  let ButtonIcon = ExternalLink;

  if (isComingSoon) {
    buttonLabel = 'Coming Soon';
    ButtonIcon = Clock;
  } else if (isPaid) {
    buttonLabel = app.payment_label?.trim() || 'Buy Now';
    ButtonIcon = CreditCard;
  } else if (isContact) {
    buttonLabel = 'Request Access';
    ButtonIcon = Send;
  } else if (isDownload) {
    buttonLabel = 'Download';
    ButtonIcon = Download;
  }

  const handleMainActionClick = async () => {
    if (isComingSoon) return;

    if (app.requires_email) {
      setModalError(null);
      setActionData(null);
      setModalOpen(true);
      return;
    }

    try {
      setIsProcessingAction(true);
      setModalError(null);
      const res = await getAppAccess(app.slug);
      if (res.action === 'open') {
        window.open(res.url, '_blank', 'noopener,noreferrer');
      } else {
        setActionData(res);
        setModalOpen(true);
      }
    } catch (err: any) {
      if (err instanceof AppApiError && err.status === 409) {
        setModalError('This app is not available to download yet.');
      } else {
        setModalError(err.message || 'Unable to access application.');
      }
      setActionData(null);
      setModalOpen(true);
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <div className="w-full relative pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">
        
        {/* Navigation Breadcrumb / Back Link */}
        <div>
          <button
            onClick={() => onNavigate('apps')}
            className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors p-2 -ml-2 rounded-lg hover:bg-cyan-500/10 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Applications</span>
          </button>
        </div>

        {/* Hero Header Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-slate-900 border border-slate-800 text-cyan-300">
                {app.category}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                  isPaid
                    ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                    : isContact
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {isPaid ? `$${app.price_amount ?? 0} ${app.currency}` : isContact ? 'Contact License' : 'Free License'}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono text-slate-400 bg-slate-950 border border-slate-800">
                v{app.version}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white font-display">
              {app.title}
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl">
              {app.tagline || app.description}
            </p>
          </div>

          {/* Quick Action Side Panel */}
          <div className="lg:col-span-4 p-5 rounded-2xl coreiq-glass-card border border-cyan-500/20 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-mono text-slate-400">Status</span>
              <span
                className={`text-xs font-mono font-bold capitalize ${
                  isComingSoon ? 'text-slate-400' : 'text-emerald-400'
                }`}
              >
                {isComingSoon ? 'Coming Soon' : 'Available'}
              </span>
            </div>

            {app.price_note && (
              <p className="text-xs font-mono text-slate-300 italic">{app.price_note}</p>
            )}

            <button
              type="button"
              disabled={isComingSoon || isProcessingAction}
              onClick={handleMainActionClick}
              className={`w-full py-3 px-5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all min-h-[44px] ${
                isComingSoon
                  ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                  : isPaid
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.35)]'
                  : isContact
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.35)]'
              }`}
            >
              {isProcessingAction ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ButtonIcon className="w-4 h-4" />
              )}
              <span>{buttonLabel}</span>
            </button>

            <button
              type="button"
              onClick={() => onAsk(`Tell me about the ${app.title} application, its features and use cases.`)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-slate-800 hover:border-cyan-500/30 transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ask CoreIQ about this app</span>
            </button>
          </div>
        </div>

        {/* Hero Screenshot Carousel Preview */}
        <section className="space-y-3">
          <AppScreenshotCarousel
            screenshots={app.screenshots}
            appTitle={app.title}
            fallbackIconUrl={app.icon_url}
            accentColor={app.accent_color}
          />
        </section>

        {/* Structured Details Sections */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
          
          {/* Main Description & Specification */}
          <div className="lg:col-span-8 space-y-6">
            <div className="p-6 rounded-2xl coreiq-glass-card border border-slate-800 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Overview & Capabilities</span>
              </h2>
              <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line space-y-3">
                {app.description || 'No detailed documentation provided for this application.'}
              </div>
            </div>

            {/* Version Changelog */}
            {app.changelog && (
              <div className="p-6 rounded-2xl coreiq-glass-card border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-400" />
                  <span>Version {app.version} Release Notes</span>
                </h3>
                <div className="text-slate-300 text-xs font-mono leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-900 whitespace-pre-wrap">
                  {app.changelog}
                </div>
              </div>
            )}
          </div>

          {/* Metadata Specification Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 rounded-2xl coreiq-glass-card border border-slate-800 text-xs space-y-3 font-mono">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                Technical Specifications
              </h3>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-900">
                <span className="text-slate-400">Distribution:</span>
                <span className="text-white capitalize">{app.distribution_type}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-900">
                <span className="text-slate-400">Current Version:</span>
                <span className="text-white">{app.version}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-900">
                <span className="text-slate-400">Pricing Tier:</span>
                <span className="text-white capitalize">{app.price_mode}</span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-400">Package Status:</span>
                <span className="text-white">{app.has_file ? 'Package Attached' : 'Cloud / Web'}</span>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Action / Download / Pay Modal */}
      <AppActionModal
        app={app}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialActionResponse={actionData}
        initialError={modalError}
      />
    </div>
  );
};
