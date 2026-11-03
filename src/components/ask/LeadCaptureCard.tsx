import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface LeadCaptureCardProps {
  sessionId: string;
  summaryText: string;
  transcript: Array<{ role: 'visitor' | 'assistant'; text: string; at: string }>;
  onCaptured?: (contact: { name: string; email: string; phone: string; company: string }) => void;
  alreadyCaptured?: boolean;
  prefillName?: string;
  prefillEmail?: string;
  prefillPhone?: string;
  prefillCompany?: string;
}

export const LeadCaptureCard: React.FC<LeadCaptureCardProps> = ({
  sessionId,
  summaryText,
  transcript,
  onCaptured,
  alreadyCaptured = false,
  prefillName = '',
  prefillEmail = '',
  prefillPhone = '',
  prefillCompany = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(prefillName);
  const [email, setEmail] = useState(prefillEmail);
  const [phone, setPhone] = useState(prefillPhone);
  const [company, setCompany] = useState(prefillCompany);
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(alreadyCaptured);
  const [submittedName, setSubmittedName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Field-specific validation errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [consentError, setConsentError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const isSubmittingRef = useRef(false);

  // Update prefill if incoming props change and form has not been modified
  useEffect(() => {
    if (prefillName && !name) setName(prefillName);
    if (prefillEmail && !email) setEmail(prefillEmail);
    if (prefillPhone && !phone) setPhone(prefillPhone);
    if (prefillCompany && !company) setCompany(prefillCompany);
  }, [prefillName, prefillEmail, prefillPhone, prefillCompany]);

  const handleOpen = () => {
    setIsOpen(true);
    // Smoothly bring the contact card into view
    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmittingRef.current || loading) return;

    // Reset errors
    setNameError(null);
    setContactError(null);
    setConsentError(null);
    setErrorMsg(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();

    let hasError = false;

    if (!cleanName) {
      setNameError('Please enter your name.');
      hasError = true;
    }

    if (!cleanEmail && !cleanPhone) {
      setContactError('Please provide an email or phone number.');
      hasError = true;
    }

    if (!consent) {
      setConsentError('Please confirm your consent to be contacted.');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);

    try {
      const res = await fetch('/api/v1/public/lead-capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          source: 'coreiq-website-ask',
          name: cleanName,
          email: cleanEmail || null,
          phone: cleanPhone || null,
          company: company.trim() || null,
          summary: summaryText,
          intent: 'website',
          consent: true,
          page_url: window.location.href,
          transcript,
          honeypot,
        }),
      });

      if (!res.ok) {
        throw new Error(`Submission failed with status ${res.status}`);
      }

      setSuccess(true);
      setSubmittedName(cleanName);
      if (onCaptured) {
        onCaptured({
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          company: company.trim(),
        });
      }
    } catch {
      setErrorMsg("We couldn't send that just now. Your details are still here, so please try again.");
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  if (success) {
    return (
      <div
        ref={containerRef}
        className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-sm flex items-start gap-3 animate-in fade-in duration-200"
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-white">
            Thanks {submittedName || name || 'there'}. Your request has been passed to our team.
          </p>
          <p className="text-xs text-emerald-300/80 mt-1">
            Our engineers will review your project blueprint directly from this session.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="mt-4 pt-2 border-t border-cyan-500/15">
      {!isOpen ? (
        <button
          type="button"
          onClick={handleOpen}
          style={{ touchAction: 'manipulation' }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-violet-500/20 hover:from-cyan-500/30 hover:to-violet-500/30 border border-cyan-500/40 text-cyan-200 text-xs font-semibold tracking-wide transition-all duration-200 shadow-[0_0_15px_rgba(34,211,238,0.12)] min-h-[44px] cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
          <span>Take this forward</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <form
              onSubmit={(e) => handleSubmit(e)}
              noValidate
              className="p-4 sm:p-5 rounded-2xl bg-[#090d1a] border border-cyan-500/35 shadow-[0_4px_24px_rgba(0,0,0,0.5)] space-y-3.5"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Take This Forward
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>

              {/* General error message with Retry button */}
              {errorMsg && (
                <div
                  className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-rose-200 text-xs flex items-center justify-between gap-2"
                  role="alert"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/25 hover:bg-rose-500/40 text-rose-100 font-semibold text-xs min-h-[44px] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Retry
                  </button>
                </div>
              )}

              {/* Hidden honeypot */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="lead_hp">Leave empty</label>
                <input
                  id="lead_hp"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="lead_name" className="block text-[11px] font-mono text-cyan-300">
                      Your Name <span className="text-rose-400">*</span>
                    </label>
                    {nameError && (
                      <span className="text-[10px] text-rose-400 font-mono font-medium">{nameError}</span>
                    )}
                  </div>
                  <input
                    id="lead_name"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (nameError) setNameError(null);
                    }}
                    placeholder="Alex Vance"
                    className={`w-full bg-slate-900/90 border rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none min-h-[44px] ${
                      nameError
                        ? 'border-rose-500/60 focus:border-rose-400'
                        : 'border-slate-700/80 focus:border-cyan-400'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="lead_company" className="block text-[11px] font-mono text-slate-400 mb-1">
                    Company / Need (optional)
                  </label>
                  <input
                    id="lead_company"
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Project or company name"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="lead_email" className="block text-[11px] font-mono text-cyan-300">
                      Email Address
                    </label>
                    {contactError && !phone.trim() && (
                      <span className="text-[10px] text-rose-400 font-mono font-medium">{contactError}</span>
                    )}
                  </div>
                  <input
                    id="lead_email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (contactError) setContactError(null);
                    }}
                    placeholder="alex@example.com"
                    className={`w-full bg-slate-900/90 border rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none min-h-[44px] ${
                      contactError && !phone.trim()
                        ? 'border-rose-500/60 focus:border-rose-400'
                        : 'border-slate-700/80 focus:border-cyan-400'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="lead_phone" className="block text-[11px] font-mono text-cyan-300">
                      Phone / WhatsApp
                    </label>
                  </div>
                  <input
                    id="lead_phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (contactError) setContactError(null);
                    }}
                    placeholder="+1 555 123 4567"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 min-h-[44px]"
                  />
                </div>
              </div>

              {/* Consent Checkbox */}
              <div>
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300 min-h-[44px] py-1 select-none">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      if (consentError) setConsentError(null);
                    }}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="leading-snug">
                    I agree that CoreIQ Create may contact me about this request.
                  </span>
                </label>
                {consentError && (
                  <p className="text-[10px] text-rose-400 font-mono mt-0.5 pl-6">{consentError}</p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 min-h-[44px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950 flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(34,211,238,0.25)] disabled:opacity-50 min-h-[44px] cursor-pointer"
                >
                  {loading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>{loading ? 'Submitting...' : 'Send Request'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default LeadCaptureCard;
