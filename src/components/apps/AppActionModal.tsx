import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  ExternalLink,
  CreditCard,
  Mail,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FileCode,
  ShieldCheck,
  Send
} from 'lucide-react';
import {
  PublicStoreApp,
  GetAppResponse,
  getAppAccess,
  submitAppRequest,
  AppApiError
} from '../../services/storePublic';

interface AppActionModalProps {
  app: PublicStoreApp;
  isOpen: boolean;
  onClose: () => void;
  initialActionResponse?: GetAppResponse | null;
  initialError?: string | null;
}

export const AppActionModal: React.FC<AppActionModalProps> = ({
  app,
  isOpen,
  onClose,
  initialActionResponse,
  initialError
}) => {
  // Step state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [copiedMethodId, setCopiedMethodId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(initialError || null);
  const [actionData, setActionData] = useState<GetAppResponse | null>(initialActionResponse || null);
  const [requestSuccessMessage, setRequestSuccessMessage] = useState<string | null>(null);

  // Sync state if props change
  useEffect(() => {
    setActionData(initialActionResponse || null);
  }, [initialActionResponse]);

  useEffect(() => {
    setModalError(initialError || null);
  }, [initialError]);

  // Start download automatically from signed URL when download action is received
  useEffect(() => {
    if (isOpen && actionData?.action === 'download' && actionData.url) {
      try {
        const link = document.createElement('a');
        link.href = actionData.url;
        link.download = actionData.fileName || `${app.slug}.zip`;
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        console.warn('Auto-download notice:', e);
      }
    }
  }, [isOpen, actionData, app.slug]);

  if (!isOpen) return null;

  // Determine current modal view
  const isEmailInputStep = !actionData && !modalError;
  const isPayView = actionData?.action === 'pay';
  const isRequestView = actionData?.action === 'request';
  const isDownloadView = actionData?.action === 'download';

  const handleCopyDetails = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMethodId(id);
    setTimeout(() => setCopiedMethodId(null), 2500);
  };

  const handleFetchWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setModalError('Please enter a valid email address.');
      return;
    }

    try {
      setIsLoading(true);
      setModalError(null);
      const res = await getAppAccess(app.slug, { email: email.trim(), name: name.trim() });
      if (res.action === 'open') {
        window.open(res.url, '_blank', 'noopener,noreferrer');
        onClose();
        return;
      }
      setActionData(res);
    } catch (err: any) {
      if (err instanceof AppApiError && err.status === 409) {
        setModalError(err.message || 'This app is not available to download yet.');
      } else {
        setModalError(err.message || 'Unable to retrieve access. Please retry.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRequestForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setModalError('A valid email address is required.');
      return;
    }

    try {
      setIsLoading(true);
      setModalError(null);
      const res = await submitAppRequest(app.slug, {
        email: email.trim(),
        name: name.trim(),
        message: requestMessage.trim(),
      });
      setRequestSuccessMessage(
        res.message || 'Your request has been received. Our team will verify and provide your access link.'
      );
    } catch (err: any) {
      setModalError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isApkFile = Boolean(
    (actionData?.action === 'download' && actionData.fileName?.toLowerCase().endsWith('.apk')) ||
    app.slug.toLowerCase().includes('android') ||
    app.category.toLowerCase().includes('android') ||
    app.title.toLowerCase().includes('apk')
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#05091a] border border-cyan-500/30 rounded-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: `${app.accent_color || '#06b6d4'}20`,
                borderColor: `${app.accent_color || '#06b6d4'}40`,
              }}
            >
              <FileCode className="w-5 h-5" style={{ color: app.accent_color || '#06b6d4' }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">{app.title}</h3>
              <p className="text-[11px] font-mono text-cyan-400 capitalize">
                {app.price_mode} • {app.distribution_type}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error message alert */}
        {modalError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <div className="flex-1">{modalError}</div>
          </div>
        )}

        {/* 1. EMAIL REQUIRED INTAKE VIEW */}
        {isEmailInputStep && (
          <form onSubmit={handleFetchWithEmail} className="space-y-4 pt-1">
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Enter your email to continue</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Provide your email address to receive download verification and release updates for {app.title}.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Email address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[44px]"
                  placeholder="name@company.com"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Your name (optional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[44px]"
                  placeholder="Alex Rivers"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-slate-300 hover:bg-slate-800 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-colors disabled:opacity-50 min-h-[44px]"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>Continue</span>
              </button>
            </div>
          </form>
        )}

        {/* 2. DOWNLOAD PACKAGE VIEW */}
        {isDownloadView && (
          <div className="space-y-4 pt-1">
            <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Download package verified and prepared for release.</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-xs text-slate-300 space-y-1.5">
              <div className="font-bold text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span className="truncate">{actionData.fileName || `${app.slug}.zip`}</span>
              </div>
              <div className="text-slate-400 text-[11px] flex items-center justify-between">
                <span>Size: {actionData.size ? `${(actionData.size / (1024 * 1024)).toFixed(2)} MB` : 'Included'}</span>
                <span>Version: {app.version}</span>
              </div>
              {actionData.sha256 && (
                <div className="text-[10px] text-slate-400 break-all pt-1 border-t border-slate-800/80">
                  <span className="text-slate-500">SHA-256:</span> {actionData.sha256}
                </div>
              )}
            </div>

            {isApkFile && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] leading-relaxed">
                ℹ️ <strong>Android Installation:</strong> For APK packages, Android may ask you to enable &ldquo;Allow from this source&rdquo; under system security settings when opening the installer.
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-slate-300 hover:bg-slate-800 min-h-[44px]"
              >
                Close
              </button>
              <a
                href={actionData.url}
                download={actionData.fileName || `${app.slug}.zip`}
                onClick={() => {
                  setTimeout(onClose, 1500);
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-colors min-h-[44px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Start Download</span>
              </a>
            </div>
          </div>
        )}

        {/* 3. PAYMENT MODAL VIEW */}
        {isPayView && !requestSuccessMessage && (
          <div className="space-y-4 pt-1 max-h-[75vh] overflow-y-auto pr-1">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-violet-400" />
                <span>{app.payment_settings?.heading || 'Purchase License & Direct Access'}</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {actionData.instructions ||
                  app.payment_settings?.instructions ||
                  'Complete payment below, then submit your confirmation to receive your private access token.'}
              </p>
              {app.price_amount !== null && (
                <div className="pt-1">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-violet-500/15 border border-violet-500/30 text-violet-300">
                    License Price: ${app.price_amount} {app.currency || 'USD'}
                  </span>
                </div>
              )}
            </div>

            {/* Payment Methods List */}
            {actionData.methods && actionData.methods.length > 0 && (
              <div className="space-y-2.5 pt-1">
                <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Select Settlement Method:
                </div>
                {actionData.methods.map((method) => (
                  <div
                    key={method.id}
                    className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 hover:border-violet-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white">{method.label}</span>
                      {method.url && (
                        <a
                          href={method.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 text-[11px] font-semibold flex items-center gap-1 transition-colors min-h-[36px]"
                        >
                          <span>Open checkout</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    {method.details && (
                      <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-black/50 text-[11px] font-mono text-slate-300">
                        <span className="break-all">{method.details}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyDetails(method.id, method.details)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white shrink-0 min-h-[36px] flex items-center gap-1 transition-colors"
                          title="Copy details"
                        >
                          {copiedMethodId === method.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span className="text-[10px]">{copiedMethodId === method.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Confirmation / Request Form */}
            <form onSubmit={handleSubmitRequestForm} className="space-y-3 pt-3 border-t border-slate-800">
              <h5 className="text-xs font-bold text-cyan-300">
                I&rsquo;ve paid / Request Access Link
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-0.5">Your email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[44px]"
                    placeholder="you@email.com"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-0.5">Your name (optional)</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[44px]"
                    placeholder="Alex"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-0.5">
                  Payment confirmation memo or transaction ID
                </label>
                <input
                  type="text"
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[44px]"
                  placeholder="e.g. PayPal TX#12345678 or sender name"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-slate-300 hover:bg-slate-800 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-1.5 transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Submit Confirmation</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 4. REQUEST ACCESS MODAL VIEW (Contact price mode) */}
        {isRequestView && !requestSuccessMessage && (
          <form onSubmit={handleSubmitRequestForm} className="space-y-4 pt-1">
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Request Architecture Access</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {app.title} is deployed with dedicated integration support. Submit your specifications to receive custom licensing details.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Your email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[44px]"
                  placeholder="lead@company.com"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[44px]"
                  placeholder="Alex Rivers"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Project or Integration Notes</label>
                <textarea
                  rows={3}
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Describe your company use case, expected volume, or timeline."
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-slate-300 hover:bg-slate-800 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-colors disabled:opacity-50 min-h-[44px]"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Submit Request</span>
              </button>
            </div>
          </form>
        )}

        {/* 5. REQUEST CONFIRMATION SUCCESS MESSAGE */}
        {requestSuccessMessage && (
          <div className="space-y-4 pt-1 text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Request Received</h4>
              <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto leading-relaxed">
                {requestSuccessMessage}
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-xl text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 min-h-[44px]"
              >
                Done
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
