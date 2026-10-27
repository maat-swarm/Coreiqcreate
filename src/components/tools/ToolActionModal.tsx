import React, { useState } from 'react';
import { X, Send, CheckCircle2, AlertCircle, ExternalLink, Upload, FileText, Sparkles } from 'lucide-react';
import { PublicSiteTool, submitToolForm } from '../../services/siteTools';

export interface ToolActionModalProps {
  tool: PublicSiteTool | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ToolActionModal: React.FC<ToolActionModalProps> = ({ tool, isOpen, onClose }) => {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [formFiles, setFormFiles] = useState<Record<string, File>>({});
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    reference_id: string;
    payment_url?: string;
    message: string;
  } | null>(null);

  if (!isOpen || !tool) return null;

  const isPaid = tool.is_paid || tool.launch_type === 'payment';
  const formSchema = Array.isArray(tool.form_schema) ? tool.form_schema : [];

  const handleInputChange = (key: string, val: string) => {
    setFormValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleFileChange = (key: string, file: File | null) => {
    setFormFiles((prev) => {
      const next = { ...prev };
      if (file) next[key] = file;
      else delete next[key];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!clientName.trim() || clientName.trim().length < 2) {
      setErrorMessage('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!clientEmail.trim() || !clientEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    // Check required fields
    for (const f of formSchema) {
      if (f.required) {
        if (f.type === 'file') {
          if (!formFiles[f.key]) {
            setErrorMessage(`Please upload a file for "${f.label}".`);
            return;
          }
        } else if (!formValues[f.key] || !formValues[f.key].trim()) {
          setErrorMessage(`"${f.label}" is required.`);
          return;
        }
      }
    }

    try {
      setIsSubmitting(true);
      const fd = new FormData();
      fd.append('client_name', clientName.trim());
      fd.append('client_email', clientEmail.trim());
      if (honeypot) fd.append('honeypot', honeypot);

      // Append form text fields
      Object.entries(formValues).forEach(([k, v]) => {
        fd.append(k, v);
      });

      // Append files
      Object.entries(formFiles).forEach(([k, file]) => {
        fd.append(k, file);
      });

      const res = await submitToolForm(tool.slug, fd);
      setSuccessResult(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setClientName('');
    setClientEmail('');
    setFormValues({});
    setFormFiles({});
    setHoneypot('');
    setErrorMessage(null);
    setSuccessResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl max-h-[90vh] bg-[#080d24] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-[#060b1c]/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-bold">
                {tool.category}
              </span>
              {isPaid && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {tool.price_amount ? `$${tool.price_amount} ${tool.price_currency}` : 'PAID'}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white font-display flex items-center gap-2">
              {tool.name}
            </h2>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {successResult ? (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Submission Received</h3>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  {successResult.message}
                </p>
                <div className="inline-block mt-3 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-400">
                  Reference ID: {successResult.reference_id}
                </div>
              </div>

              {successResult.payment_url && (
                <div className="pt-4 p-5 rounded-xl bg-gradient-to-r from-emerald-950/40 to-cyan-950/40 border border-emerald-500/30 space-y-3">
                  <p className="text-xs text-slate-300 font-medium">
                    Complete your payment to activate execution:
                  </p>
                  <a
                    href={successResult.payment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all min-h-[44px]"
                  >
                    <span>Proceed to Secure Payment</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold min-h-[44px]"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-xs text-slate-300 leading-relaxed">
                {tool.description || tool.tagline}
              </p>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Honeypot hidden input */}
              <input
                type="text"
                name="honeypot"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
              />

              {/* Client Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                    Your Name <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                    Email Address <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Dynamic Form Schema Fields */}
              {formSchema.length > 0 && (
                <div className="pt-2 space-y-4 border-t border-slate-800/80">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                    Parameters & Requirements
                  </h4>
                  {formSchema.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <label className="block text-xs font-mono text-slate-300">
                        {field.label} {field.required && <span className="text-cyan-400">*</span>}
                      </label>

                      {field.type === 'long_text' ? (
                        <textarea
                          rows={3}
                          required={field.required}
                          value={formValues[field.key] || ''}
                          onChange={(e) => handleInputChange(field.key, e.target.value)}
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors"
                        />
                      ) : field.type === 'select' ? (
                        <select
                          required={field.required}
                          value={formValues[field.key] || ''}
                          onChange={(e) => handleInputChange(field.key, e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-sm text-white focus:outline-none transition-colors"
                        >
                          <option value="">Select an option...</option>
                          {(field.options || []).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : field.type === 'file' ? (
                        <div className="flex items-center gap-3">
                          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-400/50 text-xs text-slate-300 hover:text-white cursor-pointer transition-colors min-h-[44px]">
                            <Upload className="w-4 h-4 text-cyan-400" />
                            <span>Choose file (PDF, DOCX, TXT, PNG, JPG max 10MB)</span>
                            <input
                              type="file"
                              accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
                              onChange={(e) => handleFileChange(field.key, e.target.files?.[0] || null)}
                              className="hidden"
                            />
                          </label>
                          {formFiles[field.key] && (
                            <span className="text-xs font-mono text-cyan-400 truncate max-w-xs">
                              {formFiles[field.key].name}
                            </span>
                          )}
                        </div>
                      ) : (
                        <input
                          type={field.type === 'email' ? 'email' : 'text'}
                          required={field.required}
                          value={formValues[field.key] || ''}
                          onChange={(e) => handleInputChange(field.key, e.target.value)}
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2.5 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all min-h-[44px]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Submitting...' : isPaid ? `Continue to Payment ($${tool.price_amount || 0})` : 'Submit & Execute'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
