import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldCheck,
  Download,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  Clock,
  CheckCircle2,
  FileCode,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { redeemAccessToken, AccessGrantResponse, AppApiError } from '../services/storePublic';

interface AppAccessPageProps {
  token: string;
  onNavigate: (route: string) => void;
}

export const AppAccessPage: React.FC<AppAccessPageProps> = ({ token, onNavigate }) => {
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [grant, setGrant] = useState<AccessGrantResponse | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Guard against double calls and React StrictMode
  const hasExecutedRef = useRef(false);

  // Set document title without ever putting the token in the title
  useEffect(() => {
    const originalTitle = document.title;
    document.title = 'Access Verification — CoreIQ Create';
    return () => {
      document.title = originalTitle;
    };
  }, []);

  // Add robots noindex meta tag
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    let created = false;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
      created = true;
    }
    const prevContent = meta.content;
    meta.content = 'noindex, nofollow';

    return () => {
      if (created && meta) {
        meta.remove();
      } else if (meta) {
        meta.content = prevContent;
      }
    };
  }, []);

  const triggerDownload = (url: string, fileName?: string) => {
    try {
      const a = document.createElement('a');
      a.href = url;
      if (fileName) a.download = fileName;
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {}
  };

  const handleRedeem = useCallback(async () => {
    if (hasExecutedRef.current) return;
    hasExecutedRef.current = true;

    setHasStarted(true);
    setIsLoading(true);
    setErrorMessage(null);
    setErrorStatus(null);

    try {
      const result = await redeemAccessToken(token);
      setGrant(result);

      if (result.action === 'open' && result.url) {
        window.open(result.url, '_blank', 'noopener,noreferrer');
      } else if (result.action === 'download' && result.url) {
        triggerDownload(result.url, result.fileName);
      }
    } catch (err: any) {
      hasExecutedRef.current = false; // Allow retry on failure
      if (err instanceof AppApiError) {
        setErrorStatus(err.status || 500);
        setErrorMessage(err.message);
      } else {
        setErrorStatus(500);
        setErrorMessage(err.message || 'Unable to verify access. Please retry.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const isApk = Boolean(
    grant?.fileName?.toLowerCase().endsWith('.apk') ||
    grant?.app?.slug.toLowerCase().includes('android')
  );

  return (
    <div className="w-full min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-[#060b1e]/90 border border-cyan-500/30 shadow-[0_0_50px_rgba(34,211,238,0.15)] backdrop-blur-xl relative overflow-hidden space-y-6">
        
        {/* Glow orb */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* 1. INITIAL UNTOUCHED STATE (Does not call API until user taps Continue) */}
        {!hasStarted && (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 mx-auto shadow-[0_0_25px_rgba(34,211,238,0.25)]">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                COREIQ SECURE ACCESS
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">
                Authorized Application Release
              </h1>
              <p className="text-slate-300 text-sm leading-relaxed max-w-md mx-auto">
                You have received a private authorization link. Tap Continue to unlock your application package or web workspace.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 text-xs font-mono">
              ⚡ This single-use link has an active countdown and quota verification.
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={handleRedeem}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 shadow-[0_0_25px_rgba(34,211,238,0.4)] transition-all min-h-[44px] flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('apps')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-xs text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-800 transition-colors min-h-[44px]"
              >
                Return to Apps
              </button>
            </div>
          </div>
        )}

        {/* 2. LOADING STATE */}
        {hasStarted && isLoading && (
          <div className="py-12 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin mx-auto" />
            <h3 className="text-base font-bold text-white">Verifying Authorization...</h3>
            <p className="text-xs text-slate-400 font-mono">Securing release bundle from private storage</p>
          </div>
        )}

        {/* 3. ERROR STATES (404, 410, Network, etc.) */}
        {hasStarted && !isLoading && errorMessage && (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                {errorStatus === 410
                  ? 'Link Expired or Fully Used'
                  : errorStatus === 404
                  ? 'Invalid Access Link'
                  : 'Unable to Complete Request'}
              </h2>
              <p className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
                {errorMessage}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              {errorStatus !== 404 && errorStatus !== 410 ? (
                <button
                  type="button"
                  onClick={handleRedeem}
                  className="px-6 py-3 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors min-h-[44px] inline-flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry</span>
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => onNavigate('apps')}
                className="px-6 py-3 rounded-xl font-semibold text-xs text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors min-h-[44px] inline-flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Apps</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. SUCCESS: DOWNLOAD ACTION */}
        {hasStarted && !isLoading && grant && grant.action === 'download' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                  Access Granted
                </span>
                <h2 className="text-lg font-bold text-white">{grant.app.title}</h2>
                <span className="text-xs font-mono text-slate-400">v{grant.app.version}</span>
              </div>
            </div>

            {/* Package details */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-white font-bold">
                <div className="flex items-center gap-2 truncate">
                  <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="truncate">{grant.fileName || `${grant.app.slug}.zip`}</span>
                </div>
                <span className="text-slate-400 text-[11px] shrink-0">
                  {grant.size ? `${(grant.size / (1024 * 1024)).toFixed(2)} MB` : 'Direct download'}
                </span>
              </div>

              {grant.sha256 && (
                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 break-all">
                  <span className="text-slate-500">SHA-256:</span> {grant.sha256}
                </div>
              )}
            </div>

            {isApk && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed">
                ℹ️ <strong>Android note:</strong> For APK files, Android may ask to allow installs from this source in security settings.
              </div>
            )}

            <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between px-1">
              <span>Uses remaining: {grant.uses_remaining}</span>
              <span>Expires: {new Date(grant.expires_at).toLocaleDateString()}</span>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                onClick={() => onNavigate('apps')}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 text-slate-300 hover:bg-slate-800 min-h-[44px]"
              >
                Back to Apps
              </button>
              <button
                type="button"
                onClick={() => triggerDownload(grant.url, grant.fileName)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950 flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                <span>Download again</span>
              </button>
            </div>
          </div>
        )}

        {/* 5. SUCCESS: OPEN WEB ACTION */}
        {hasStarted && !isLoading && grant && grant.action === 'open' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                  Access Granted
                </span>
                <h2 className="text-lg font-bold text-white">{grant.app.title}</h2>
                <span className="text-xs font-mono text-slate-400">Web Application Instance</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <p className="font-semibold text-white">Your web application has been opened in a new tab.</p>
              <p className="text-slate-400 text-[11px]">
                If your browser blocked the window popup, click &ldquo;Open again&rdquo; below to launch.
              </p>
            </div>

            <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between px-1">
              <span>Uses remaining: {grant.uses_remaining}</span>
              <span>Expires: {new Date(grant.expires_at).toLocaleDateString()}</span>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                onClick={() => onNavigate('apps')}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 text-slate-300 hover:bg-slate-800 min-h-[44px]"
              >
                Back to Apps
              </button>
              <a
                href={grant.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950 flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open again</span>
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
