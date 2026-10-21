import React, { useState, useEffect } from 'react';
import {
  Server,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  ShieldAlert,
  ArrowUpRight,
  Database
} from 'lucide-react';
import { getAuthHeaders } from '../../services/supabase';

interface CrmStats {
  configured: boolean;
  crm_host: string | null;
  counts: {
    pending: number;
    sending: number;
    sent: number;
    dead: number;
    total: number;
  };
  last_success_at: string | null;
  oldest_pending_age_seconds: number | null;
}

interface OutboxRow {
  id: string;
  session_id: string;
  short_session_id: string;
  source: string;
  status: 'pending' | 'sending' | 'sent' | 'dead';
  attempts: number;
  last_error?: string | null;
  next_attempt_at: string;
  crm_client_id?: string | null;
  crm_client_code?: string | null;
  created_at: string;
  updated_at: string;
}

export const CommandCrmBridgeCard: React.FC = () => {
  const [stats, setStats] = useState<CrmStats | null>(null);
  const [outboxRows, setOutboxRows] = useState<OutboxRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    client_code?: string | null;
    client_id?: string | null;
    error?: string | null;
  } | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders(true);
      const [resHealth, resOutbox] = await Promise.all([
        fetch('/api/v1/crm-bridge/health', { headers }),
        fetch('/api/v1/admin/crm-bridge/outbox?limit=20', { headers }),
      ]);

      if (resHealth.ok) {
        const hData = await resHealth.json();
        setStats(hData);
      }
      if (resOutbox.ok) {
        const oData = await resOutbox.json();
        setOutboxRows(oData.rows || []);
      }
    } catch (err: any) {
      console.warn('CRM bridge fetch error:', err?.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunNow = async () => {
    setIsRunning(true);
    setActionNotice(null);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch('/api/v1/admin/crm-bridge/run', {
        method: 'POST',
        headers,
        body: JSON.stringify({ limit: 20 }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionNotice(
          `Outbox processed: ${data.run_results?.sent ?? 0} sent, ${data.run_results?.pending ?? 0} pending, ${data.run_results?.dead ?? 0} dead.`
        );
        fetchData();
      } else {
        setActionNotice(`Failed to run outbox: ${data.message || data.error}`);
      }
    } catch (err: any) {
      setActionNotice(`Error: ${err?.message}`);
    } finally {
      setIsRunning(false);
      setTimeout(() => setActionNotice(null), 6000);
    }
  };

  const handleSendTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    setActionNotice(null);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch('/api/v1/admin/crm-bridge/test', {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      setTestResult(data);
      fetchData();
    } catch (err: any) {
      setTestResult({ success: false, error: err?.message || 'Network error running test' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="rounded-2xl bg-[#060b1e]/90 border border-slate-800 p-5 sm:p-6 space-y-5 shadow-xl">
      {/* Top Banner & Config Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>CoreIQ CRM Bridge</span>
                {stats?.configured ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                    CONFIGURED (LIVE)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                    NOT CONFIGURED (PENDING QUEUE)
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Intake Host: {stats?.crm_host || 'https://coreiqcreate-crm.onrender.com'}
              </p>
            </div>
          </div>
        </div>

        {/* Top Control Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchData}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors disabled:opacity-50"
            title="Refresh status"
            aria-label="Refresh status"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleRunNow}
            disabled={isRunning}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white flex items-center gap-1.5 min-h-[44px] transition-colors disabled:opacity-50"
          >
            {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" /> : <Database className="w-3.5 h-3.5 text-cyan-400" />}
            <span>Run now</span>
          </button>

          <button
            type="button"
            onClick={handleSendTest}
            disabled={isTesting}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 min-h-[44px] transition-colors disabled:opacity-50"
          >
            {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Send test lead</span>
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Test Result Display */}
      {testResult && (
        <div
          className={`p-3.5 rounded-xl border text-xs space-y-1 ${
            testResult.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2 font-bold">
            {testResult.success ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Test Lead Verified by CoreIQ CRM: Client Code {testResult.client_code || 'CIQ-C-SUCCESS'}</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Test Lead Failed: {testResult.error || 'CRM intake rejected request.'}</span>
              </>
            )}
          </div>
          {testResult.client_id && (
            <p className="text-[11px] font-mono text-emerald-400/80">CRM Client ID: {testResult.client_id}</p>
          )}
        </div>
      )}

      {/* Status Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-0.5">Pending</span>
          <span className="text-xl font-bold font-mono text-amber-400">{stats?.counts.pending ?? 0}</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-0.5">Sending</span>
          <span className="text-xl font-bold font-mono text-cyan-400">{stats?.counts.sending ?? 0}</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-0.5">Sent</span>
          <span className="text-xl font-bold font-mono text-emerald-400">{stats?.counts.sent ?? 0}</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-0.5">Dead (Failed)</span>
          <span className="text-xl font-bold font-mono text-rose-400">{stats?.counts.dead ?? 0}</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-0.5">Total Outbox</span>
          <span className="text-xl font-bold font-mono text-white">{stats?.counts.total ?? 0}</span>
        </div>
      </div>

      {/* Meta timings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400 font-mono bg-black/40 p-3 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Last Success:</span>
          <span className="text-slate-200">
            {stats?.last_success_at ? new Date(stats.last_success_at).toLocaleString() : 'None logged yet'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
          <span>Oldest Pending:</span>
          <span className="text-slate-200">
            {stats?.oldest_pending_age_seconds !== null && stats?.oldest_pending_age_seconds !== undefined
              ? `${stats.oldest_pending_age_seconds}s ago`
              : 'Queue clear'}
          </span>
        </div>
      </div>

      {/* Last 20 Outbox Rows List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            Recent CRM Outbox Records (Last 20)
          </h4>
          <span className="text-[11px] font-mono text-slate-500">Auto-debounces &amp; dedupes</span>
        </div>

        {outboxRows.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-slate-900/30 border border-slate-800 text-xs text-slate-400">
            No outbox rows queued yet. When visitors submit the intake card on /ask or request an app, queued records appear here.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-2.5">Session ID</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">CRM Code</th>
                  <th className="p-2.5">Attempts</th>
                  <th className="p-2.5">Source</th>
                  <th className="p-2.5">Error / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-950/50">
                {outboxRows.map((row) => {
                  let statusBadgeClass = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
                  if (row.status === 'sent') statusBadgeClass = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
                  else if (row.status === 'sending') statusBadgeClass = 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
                  else if (row.status === 'dead') statusBadgeClass = 'bg-rose-500/15 text-rose-300 border-rose-500/30';

                  return (
                    <tr key={row.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-2.5 text-slate-300" title={row.session_id}>
                        {row.short_session_id || row.session_id.slice(0, 12)}...
                      </td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${statusBadgeClass}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-cyan-400 font-bold">
                        {row.crm_client_code || '—'}
                      </td>
                      <td className="p-2.5 text-slate-400">{row.attempts}</td>
                      <td className="p-2.5 text-slate-400 truncate max-w-[120px]">{row.source}</td>
                      <td className="p-2.5 text-slate-400 max-w-[200px] truncate" title={row.last_error || ''}>
                        {row.last_error || (row.status === 'sent' ? 'Delivered' : 'Pending dispatch')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
