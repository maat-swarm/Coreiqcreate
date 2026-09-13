import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  ShieldCheck, 
  AlertCircle, 
  ArrowLeft, 
  Copy, 
  Check, 
  ExternalLink,
  Lock,
  ChevronDown,
  ChevronUp,
  Cpu
} from 'lucide-react';
import { CoreIQAuth, testSupabaseConnection, SUPABASE_SQL_SCHEMA } from '../services/supabase';

interface CommandLoginPageProps {
  onLoginSuccess: () => void;
  onExitToWebsite: () => void;
}

export const CommandLoginPage: React.FC<CommandLoginPageProps> = ({
  onLoginSuccess,
  onExitToWebsite,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [connStatus, setConnStatus] = useState<{
    tested: boolean;
    tablesFound: boolean;
    message: string;
  }>({
    tested: false,
    tablesFound: false,
    message: 'Verifying database endpoint...',
  });

  useEffect(() => {
    let mounted = true;
    testSupabaseConnection().then((res) => {
      if (!mounted) return;
      setConnStatus({
        tested: true,
        tablesFound: res.tablesFound,
        message: res.message,
      });
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Please provide both operator email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await CoreIQAuth.signIn(cleanEmail, password);
      onLoginSuccess();
    } catch (err: any) {
      console.error('Operator login error:', err);
      const msg = err?.message || 'Authentication failed. Please verify credentials in Supabase Auth.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#02050f] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-br from-cyan-600/10 via-blue-700/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

      {/* Top minimal bar */}
      <header className="px-6 py-5 flex items-center justify-between z-10">
        <button
          onClick={onExitToWebsite}
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-300 transition-colors py-2 px-3 rounded-lg hover:bg-slate-900/60 border border-transparent hover:border-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Public Website</span>
        </button>

        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connStatus.tablesFound ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400 animate-pulse'}`} />
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            {connStatus.tested 
              ? (connStatus.tablesFound ? 'Supabase Unified Brain Live' : 'Database Migration Pending')
              : 'Checking Connection...'}
          </span>
        </div>
      </header>

      {/* Center authentication vault */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 z-10">
        <div className="w-full max-w-md bg-[#050a1b]/95 border border-cyan-500/25 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(25,217,255,0.12)] backdrop-blur-xl relative">
          
          {/* Luminous phoenix energy core */}
          <div className="flex justify-center mb-6">
            <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-purple-600/20 border border-cyan-400/40 shadow-[0_0_30px_rgba(25,217,255,0.25)]">
              <div className="w-6 h-6 rounded-full bg-cyan-400 shadow-[0_0_16px_#19d9ff] animate-pulse" />
              <Lock className="w-4 h-4 text-slate-950 absolute" />
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 mb-2">
              Restricted Area
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-display">
              CoreIQ Command
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Unified Operator Cockpit & Autonomous Swarm Gateway. Enter your Supabase operator credentials to decrypt access.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                Operator Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@coreiq.create"
                className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 font-mono transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                Operator Password
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 font-mono transition-colors"
              />
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-98 shadow-[0_0_25px_rgba(25,217,255,0.35)] disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Decrypting Session...' : 'Authenticate & Enter Cockpit'}</span>
            </button>
          </form>

          {/* Database Setup & Migration Guidance */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-xs">
            <button
              onClick={() => setShowSqlGuide(!showSqlGuide)}
              className="w-full flex items-center justify-between text-slate-400 hover:text-slate-200 transition-colors py-1"
            >
              <span className="font-mono text-[11px] flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Supabase Database Status & Migration</span>
              </span>
              {showSqlGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showSqlGuide && (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-start gap-2 text-[11px] text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    {connStatus.message}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={handleCopySql}
                    className="flex-1 py-2 px-3 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'Schema Copied!' : 'Copy SQL Schema'}</span>
                  </button>

                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1 transition-colors"
                  >
                    <span>Supabase SQL</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Footer copyright and security note */}
      <footer className="px-6 py-4 text-center text-[11px] text-slate-500 font-mono z-10">
        <span>Restricted Operator Access — CoreIQ Sovereign Cognitive Architecture</span>
      </footer>

    </div>
  );
};
