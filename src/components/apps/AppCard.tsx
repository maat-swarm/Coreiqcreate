import React, { useState, useRef } from 'react';
import {
  Flame,
  PenTool,
  Database,
  GitMerge,
  FileCode,
  ShoppingBag,
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
import { AppActionModal } from './AppActionModal';

interface AppCardProps {
  app: PublicStoreApp;
  onNavigateToDetail: (slug: string) => void;
}

export const AppCard: React.FC<AppCardProps> = ({ app, onNavigateToDetail }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [actionData, setActionData] = useState<GetAppResponse | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Flame': return Flame;
      case 'PenTool': return PenTool;
      case 'Database': return Database;
      case 'GitMerge': return GitMerge;
      case 'FileCode': return FileCode;
      case 'ShoppingBag': return ShoppingBag;
      default: return Sparkles;
    }
  };

  const IconC = getIconComponent(app.icon_name);
  const isComingSoon = app.status === 'coming_soon';
  const isPaid = app.price_mode === 'paid';
  const isContact = app.price_mode === 'contact';
  const isDownload = app.distribution_type === 'file' || app.distribution_type === 'download' || app.has_file;
  const accentColor = app.accent_color || '#06b6d4';

  // Determine main button label and icon
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

  // Handle Main Button Click via POST /store/apps/:slug/get
  const handleButtonClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // don't trigger card navigation
    if (isComingSoon) return;

    // If requires email, open email prompt modal first
    if (app.requires_email) {
      setModalError(null);
      setActionData(null); // will show email input
      setModalOpen(true);
      return;
    }

    // Call /get to retrieve real action, signed download URL, or payment methods
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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (typeof window !== 'undefined' && !window.matchMedia('(hover: hover)').matches) return;
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const thumbnailImage = app.screenshots && app.screenshots.length > 0 ? app.screenshots[0] : app.icon_url;

  return (
    <>
      <div
        ref={cardRef}
        role="button"
        tabIndex={0}
        onClick={() => onNavigateToDetail(app.slug)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onNavigateToDetail(app.slug);
          }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setMousePos(null);
        }}
        onMouseMove={handleMouseMove}
        style={{
          boxShadow: isHovered
            ? `0 16px 36px rgba(0,0,0,0.8), 0 0 24px ${accentColor}33`
            : undefined,
          borderColor: isHovered ? `${accentColor}80` : undefined,
        }}
        className={`group text-left cursor-pointer p-5 rounded-2xl coreiq-glass-card flex flex-col justify-between h-full min-h-[340px] relative border border-cyan-500/20 transition-all duration-200 hover:-translate-y-[2px] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 motion-reduce:transform-none motion-reduce:transition-none overflow-hidden ${
          isComingSoon ? 'opacity-85 grayscale-[15%]' : ''
        }`}
      >
        {/* Pointer Spotlight (mouse only, hover-capable screens) */}
        {mousePos && (
          <div
            className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-300"
            style={{
              background: `radial-gradient(280px circle at ${mousePos.x}px ${mousePos.y}px, ${accentColor}18, transparent 75%)`,
            }}
          />
        )}

        <div className="relative z-10">
          {/* Top Visual Banner / Thumbnail or Icon */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950/80 border border-slate-800/80 mb-3.5 flex items-center justify-center">
            {thumbnailImage ? (
              <img
                src={thumbnailImage}
                alt={app.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 motion-reduce:transform-none"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110 motion-reduce:transform-none"
                style={{
                  backgroundColor: `${accentColor}20`,
                  borderColor: `${accentColor}40`,
                }}
              >
                <IconC className="w-7 h-7" style={{ color: accentColor }} />
              </div>
            )}

            {/* Price Badge on Thumbnail */}
            <div className="absolute top-2.5 right-2.5 z-10">
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wide shadow-md backdrop-blur-md ${
                  isPaid
                    ? 'bg-violet-950/90 text-violet-300 border border-violet-500/40'
                    : isContact
                    ? 'bg-amber-950/90 text-amber-300 border border-amber-500/40'
                    : 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/40'
                }`}
              >
                {isPaid ? `$${app.price_amount ?? 0} ${app.currency}` : isContact ? 'Contact' : 'Free'}
              </span>
            </div>
          </div>

          {/* Chips Row */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span
              className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-900/90 border border-slate-800 text-slate-300 transition-colors"
              style={{
                borderColor: isHovered ? `${accentColor}40` : undefined,
                color: isHovered ? '#e2e8f0' : undefined,
              }}
            >
              {app.category}
            </span>

            {isComingSoon && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                Coming Soon
              </span>
            )}
          </div>

          {/* Title & Tagline */}
          <h3
            className="text-white font-bold text-lg mb-1.5 transition-colors tracking-tight line-clamp-1"
            style={{ color: isHovered ? '#ffffff' : undefined }}
          >
            {app.title}
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
            {app.tagline || app.description}
          </p>
        </div>

        {/* Bottom Actions Row */}
        <div className="relative z-10 pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
          {/* Main Action Button */}
          <button
            type="button"
            disabled={isComingSoon || isProcessing}
            onClick={handleButtonClick}
            className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
              isComingSoon
                ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                : isPaid
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.35)]'
                : isContact
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                : 'bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-extrabold shadow-[0_0_15px_rgba(34,211,238,0.35)]'
            }`}
          >
            {isProcessing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ButtonIcon className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="truncate">{buttonLabel}</span>
          </button>

          {/* Details arrow button with sliding arrow */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigateToDetail(app.slug);
            }}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="View app details"
            aria-label={`View details for ${app.title}`}
          >
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200 motion-reduce:transform-none" />
          </button>
        </div>
      </div>

      {/* Action / Download / Pay Modal */}
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
