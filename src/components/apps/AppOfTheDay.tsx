import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ExternalLink,
  Download,
  CreditCard,
  Send,
  Clock,
  RefreshCw
} from 'lucide-react';
import { PublicStoreApp, GetAppResponse, getAppAccess, AppApiError } from '../../services/storePublic';
import { AppScreenshotCarousel } from './AppScreenshotCarousel';
import { AppActionModal } from './AppActionModal';

interface AppOfTheDayProps {
  apps: PublicStoreApp[];
  onNavigateToDetail: (slug: string) => void;
}

export const AppOfTheDay: React.FC<AppOfTheDayProps> = ({ apps, onNavigateToDetail }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [actionData, setActionData] = useState<GetAppResponse | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const published = apps.filter((a) => a.status === 'published');

  if (published.length === 0) {
    return null;
  }

  // 1. If any published app has featured=true, use the first by sort_order
  const featured = [...published]
    .filter((a) => a.featured)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0];

  // 2. Else index = floor(Date.now() / 86400000) % count of published apps
  const app = featured || published[Math.floor(Date.now() / 86400000) % published.length];
  const label = featured ? 'Featured app' : 'App of the Day';

  const isPaid = app.price_mode === 'paid';
  const isContact = app.price_mode === 'contact';
  const isDownload = app.distribution_type === 'file' || app.distribution_type === 'download' || app.has_file;

  let buttonLabel = 'Open App';
  let ButtonIcon = ExternalLink;

  if (isPaid) {
    buttonLabel = app.payment_label?.trim() || 'Buy Now';
    ButtonIcon = CreditCard;
  } else if (isContact) {
    buttonLabel = 'Request Access';
    ButtonIcon = Send;
  } else if (isDownload) {
    buttonLabel = 'Download';
    ButtonIcon = Download;
  }

  const handleMainButtonClick = async () => {
    if (app.requires_email) {
      setModalError(null);
      setActionData(null);
      setModalOpen(true);
      return;
    }

    try {
      setIsProcessing(true);
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
        setModalError(err.message || 'Access error occurred.');
      }
      setActionData(null);
      setModalOpen(true);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="relative w-full rounded-3xl bg-[#060b1e]/90 border border-cyan-500/30 p-6 sm:p-7 shadow-[0_0_50px_rgba(34,211,238,0.15)] overflow-hidden space-y-5">
        {/* Ambient background glow */}
        <div
          className="absolute -top-12 -right-12 w-64 h-64 rounded-full blur-[80px] pointer-events-none opacity-25"
          style={{ backgroundColor: app.accent_color || '#06b6d4' }}
        />

        {/* Top Badges Bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wide uppercase bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.25)]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{label}</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold uppercase bg-slate-900 border border-slate-800 text-slate-300">
              {app.category}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wide ${
                isPaid
                  ? 'bg-violet-950/90 text-violet-300 border border-violet-500/40'
                  : isContact
                  ? 'bg-amber-950/90 text-amber-300 border border-amber-500/40'
                  : 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/40'
              }`}
            >
              {isPaid ? `$${app.price_amount ?? 0} ${app.currency}` : isContact ? 'Contact' : 'Free'}
            </span>
            <span className="text-[11px] font-mono text-slate-500">v{app.version}</span>
          </div>
        </div>

        {/* Screenshot Carousel Preview */}
        <div className="w-full">
          <AppScreenshotCarousel
            screenshots={app.screenshots}
            appTitle={app.title}
            fallbackIconUrl={app.icon_url}
            accentColor={app.accent_color}
          />
        </div>

        {/* Content Details */}
        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-bold text-white font-display tracking-tight">
            {app.title}
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-2">
            {app.tagline || app.description}
          </p>
        </div>

        {/* Actions Row */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-800/80">
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleMainButtonClick}
            className={`px-6 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all min-h-[44px] ${
              isPaid
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.35)]'
                : isContact
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold'
                : 'bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-extrabold shadow-[0_0_20px_rgba(34,211,238,0.35)]'
            }`}
          >
            {isProcessing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ButtonIcon className="w-3.5 h-3.5" />
            )}
            <span>{buttonLabel}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToDetail(app.slug)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/30 transition-colors min-h-[44px]"
          >
            <span>View details</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Action modal for download / payment / request flows */}
      <AppActionModal
        app={app}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialActionResponse={actionData}
        initialError={modalError}
      />
    </>
  );
};
