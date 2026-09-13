import React, { useState } from 'react';
import { 
  KeyRound, 
  Database, 
  Check, 
  Copy, 
  ExternalLink, 
  X, 
  ShieldCheck, 
  AlertCircle,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { 
  saveSupabaseCredentials, 
  testSupabaseConnection, 
  SUPABASE_SQL_SCHEMA,
  CoreIQAuth 
} from '../../services/supabase';

interface CommandAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCredentialsUpdated: () => void;
  currentUrl?: string;
  currentKey?: string;
}

export const CommandAuthModal: React.FC<CommandAuthModalProps> = ({
  isOpen,
  onClose,
  onCredentialsUpdated,
  currentUrl = '',
  currentKey = '',
}) => {
  const [url, setUrl] = useState(currentUrl);
  const [anonKey, setAnonKey] = useState(currentKey);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'connection' | 'auth' | 'sql'>('connection');

  if (!isOpen) return null;

  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseCredentials(url, anonKey);
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
      onCredentialsUpdated();
    } finally {
      setTesting(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      await CoreIQAuth.signIn(adminEmail.trim() || 'operator@coreiq.create', adminPass);
      onCredentialsUpdated();
      onClose();
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication failed.');
    }
  };

  const handleDevBypass = () => {
    CoreIQAuth.setDevSession(true);
    onCredentialsUpdated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#02050f]/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#060b1c] border border-cyan-500/30 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(25,217,255,0.15)] overflow-hidden my-6">
        
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-display">
                CoreIQ Command Gateway
              </h2>
              <p className="text-[11px] text-slate-400">
                Supabase Unified Brain & Operator Controls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800/80 bg-slate-950/40 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('connection')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'connection'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Supabase Keys</span>
          </button>
          <button
            onClick={() => setActiveTab('auth')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'auth'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Operator Auth</span>
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'sql'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SQL Schema</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {activeTab === 'connection' && (
            <form onSubmit={handleSaveConnection} className="space-y-4">
              <div className="text-xs text-slate-300 bg-cyan-950/30 border border-cyan-500/20 rounded-xl p-3.5 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Both the public website and CoreIQ Command query this shared Supabase instance.
                  Credentials are encrypted and masked locally with instant reactive updates.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Supabase Anon Public Key
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    {showKey ? 'Mask Key' : 'Reveal Key'}
                  </button>
                </div>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                    testResult.success
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={testing}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-98 shadow-[0_0_20px_rgba(25,217,255,0.3)] disabled:opacity-50"
                >
                  {testing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4" />
                  )}
                  <span>Save & Test Realtime Connection</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'auth' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-300 bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                <p>
                  Single operator authentication via Supabase Auth (email/password).
                  No public registration exists for CoreIQ Command.
                </p>
              </div>

              <form onSubmit={handleAdminSignIn} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Operator Email
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="operator@coreiq.create"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Operator Password
                  </label>
                  <input
                    type="password"
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-98"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Sign In to Cockpit</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDevBypass}
                    className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                  >
                    Local Operator Bypass
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Bootstrap SQL Migration Script
                </span>
                <button
                  onClick={handleCopySql}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy Schema SQL'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Paste this into your Supabase project's SQL Editor to automatically create the 9 operational tables (leads, social_messages, tasks, clients, agent_config, agent_tools, platforms, content, swarm_comms) and enable Realtime replication.
              </p>
              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 max-h-56 overflow-y-auto leading-relaxed selection:bg-cyan-500/40">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-950/70 flex items-center justify-between text-[11px] text-slate-500">
          <span>Target Architecture: Samsung Galaxy A24 & Desktop</span>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-cyan-400 hover:underline"
          >
            <span>Supabase Console</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

      </div>
    </div>
  );
};
