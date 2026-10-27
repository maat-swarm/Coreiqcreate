import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  AlertCircle, 
  RefreshCw, 
  Play, 
  Send, 
  CheckCircle2, 
  Clock, 
  RotateCcw,
  Activity,
  Layers,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getAuthHeaders } from '../../services/supabase';
import type { CrmBridgeHealth, CrmOutboxRecord } from '../../types/command';

interface CrmBridgeCardProps {
  onRefreshParent?: () => void;
}

export const CrmBridgeCard: React.FC<CrmBridgeCardProps> = ({ onRefreshParent }) => {
  const [health, setHealth] = useState<CrmBridgeHealth | null>(null);
  const [outboxRows, setOutboxRows] = useState<CrmOutboxRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [replayingId, setReplayingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [testLeadResult, setTestLeadResult] = useState<{ code: string | null; id: string | null } | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const fetchBridgeData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const headers = await getAuthHeaders(true);
      
      const [healthRes, outboxRes] = await Promise.all([
        fetch('/api/v1/crm-bridge/health', { headers }),
        fetch('/api/v1/crm-bridge/outbox?limit=20', { headers }),
      ]);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData);
      }

      if (outboxRes.ok) {
        const outboxData = await outboxRes.json();
        setOutboxRows(outboxData.rows || []);
      }
    } catch (e: any) {
      console.error('[CRM Bridge Card] Fetch error:', e);
      setErrorMessage(e?.message || 'Failed to load CRM bridge status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBridgeData();
  }, [fetchBridgeData]);

  const handleRunNow = async () => {
    setIsRunning(true);
    setErrorMessage(null);
    setSuccessNotice(null);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch('/api/v1/admin/crm-bridge/run', {
        method: 'POST',
        headers,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || `Run failed (${res.status})`);
      }

      const data = await res.json();
      setSuccessNotice(`Outbox processed: ${data.summary?.sent ?? 0} sent, ${data.summary?.dead ?? 0} dead, ${data.summary?.failed ?? 0} failed.`);
      await fetchBridgeData();
      if (onRefreshParent) onRefreshParent();
    } catch (e: any) {
      setErrorMessage(e?.message || 'Failed to execute outbox run');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSendTestLead = async () => {
    setIsSendingTest(true);
    setErrorMessage(null);
    setTestLeadResult(null);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch('/api/v1/admin/crm-bridge/test', {
        method: 'POST',
        headers,
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || data.message || `Test lead failed (${res.status})`);
      }

      setTestLeadResult({
        code: data.code || 'Received',
        id: data.client_id || null,
      });
      setSuccessNotice(`Synthetic lead dispatched. CRM Code: ${data.code || 'OK'}`);
      await fetchBridgeData();
      if (onRefreshParent) onRefreshParent();
    } catch (e: any) {
      setErrorMessage(e?.message || 'Failed to dispatch test lead');
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleReplayRow = async (id: string) => {
    setReplayingId(id);
    setErrorMessage(null);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch(`/api/v1/admin/crm-bridge/replay/${encodeURIComponent(id)}`, {
        method: 'POST',
        headers,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Replay failed (${res.status})`);
      }

      setSuccessNotice(`Row queued for replay.`);
      await fetchBridgeData();
    } catch (e: any) {
      setErrorMessage(e?.message || 'Failed to replay row');
    } finally {
      setReplayingId(null);
    }
  };

  const formatAge = (seconds: number | null | undefined): string => {
    if (seconds === null || seconds === undefined) return 'None';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const formatTime = (iso: string | null | undefined): string => {
    if (!iso) return 'Never';
    try {
      const date = new Date(iso);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (' + date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ')';
    } catch {
      return iso;
    }
  };

  return (
    <div className="w-full rounded-2xl bg-[#060b1c]/95 border border-cyan-500/30 overflow-hidden shadow-[0_0_25px_rgba(25,217,255,0.08)]">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-gradient-to-r from-cyan-950/20 to-blue-950/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                CRM Bridge Control Surface
              </h3>
              {health?.configured ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Configured</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Not Configured</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Target: <span className="text-cyan-300">{health?.crm_host || 'https://coreiqcreate-crm.onrender.com'}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={fetchBridgeData}
            disabled={isLoading}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors min-h-[44px]"
            title="Refresh status"
            aria-label="Refresh CRM bridge metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleRunNow}
            disabled={isRunning || isLoading}
            className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all min-h-[44px] disabled:opacity-50"
            title="Process pending outbox rows now"
          >
            {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>Run now</span>
          </button>

          <button
            type="button"
            onClick={handleSendTestLead}
            disabled={isSendingTest || isLoading}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] min-h-[44px] disabled:opacity-50"
            title="Send synthetic test lead to CRM"
          >
            {isSendingTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Send test lead</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
            aria-label={isExpanded ? 'Collapse CRM bridge details' : 'Expand CRM bridge details'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Alert Notices */}
      {successNotice && (
        <div className="mx-4 sm:mx-5 mt-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between gap-2" role="status">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessNotice(null)}
            className="text-emerald-400 hover:text-emerald-200 p-1"
          >
            &times;
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mx-4 sm:mx-5 mt-3 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center justify-between gap-2" role="alert">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-200 p-1"
          >
            &times;
          </button>
        </div>
      )}

      {testLeadResult && (
        <div className="mx-4 sm:mx-5 mt-3 p-3 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-200 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-violet-400 shrink-0" />
          <span>Test Lead Handshake Succeeded. Client Code: <strong className="text-white font-mono">{testLeadResult.code}</strong> (ID: {testLeadResult.id || 'N/A'})</span>
        </div>
      )}

      {/* Expandable Body */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Diagnostic Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] font-mono uppercase text-amber-400 mb-1">Pending</div>
              <div className="text-lg sm:text-xl font-bold font-mono text-white">
                {health?.counts?.pending ?? 0}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] font-mono uppercase text-cyan-400 mb-1">Sending</div>
              <div className="text-lg sm:text-xl font-bold font-mono text-white">
                {health?.counts?.sending ?? 0}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] font-mono uppercase text-emerald-400 mb-1">Sent</div>
              <div className="text-lg sm:text-xl font-bold font-mono text-white">
                {health?.counts?.sent ?? 0}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] font-mono uppercase text-rose-400 mb-1">Dead</div>
              <div className="text-lg sm:text-xl font-bold font-mono text-white">
                {health?.counts?.dead ?? 0}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 col-span-2 sm:col-span-2 lg:col-span-1">
              <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">Last Success</div>
              <div className="text-xs font-mono font-medium text-slate-200 truncate" title={health?.last_success_at || 'Never'}>
                {formatTime(health?.last_success_at)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 col-span-2 sm:col-span-2 lg:col-span-1">
              <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">Oldest Pending</div>
              <div className="text-xs font-mono font-medium text-amber-300">
                {formatAge(health?.oldest_pending_age_seconds)}
              </div>
            </div>
          </div>

          {/* Outbox Rows Feed (Last 20) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
              <span className="flex items-center gap-1.5 font-bold text-white uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Outbox Queue & Transmission Log (Last {outboxRows.length})</span>
              </span>
              <span>Sorted by recent activity</span>
            </div>

            {outboxRows.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 font-mono">
                No CRM outbox records found. New visitor inquiries with contact details will automatically queue here.
              </div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {outboxRows.map((row) => {
                  const shortSession = row.session_id ? `${row.session_id.slice(0, 8)}...` : 'unknown';
                  const isDead = row.status === 'dead';

                  return (
                    <div
                      key={row.id}
                      className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-mono"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status badge */}
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            row.status === 'sent'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : row.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : row.status === 'sending'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {row.status}
                        </span>

                        {/* Short session id */}
                        <span className="text-slate-300 font-bold" title={row.session_id}>
                          {shortSession}
                        </span>

                        {/* CRM Code if set */}
                        {row.crm_client_code && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-950/50 text-emerald-300 border border-emerald-800/40 text-[10px] font-bold">
                            {row.crm_client_code}
                          </span>
                        )}

                        {/* Source */}
                        <span className="text-[10px] text-slate-500">
                          [{row.source || 'website'}]
                        </span>

                        {/* Attempts */}
                        <span className="text-[10px] text-slate-400">
                          Attempts: <strong className="text-white">{row.attempts || 0}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 justify-between sm:justify-end">
                        {row.last_error && (
                          <span
                            className="text-[10px] text-rose-400 truncate max-w-[200px]"
                            title={row.last_error}
                          >
                            Err: {row.last_error}
                          </span>
                        )}

                        {isDead && (
                          <button
                            type="button"
                            onClick={() => handleReplayRow(row.id)}
                            disabled={replayingId === row.id}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-[10px] font-bold flex items-center gap-1 transition-colors min-h-[36px]"
                            title="Re-queue this dead row back to pending"
                          >
                            {replayingId === row.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3 h-3" />
                            )}
                            <span>Replay</span>
                          </button>
                        )}

                        <span className="text-[10px] text-slate-500 shrink-0">
                          {new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
