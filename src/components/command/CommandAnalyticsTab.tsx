import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  CheckSquare, 
  Globe, 
  MessageSquare, 
  Zap, 
  Clock,
  Sparkles,
  Smartphone,
  Monitor,
  Tablet,
  Share2,
  FileCode,
  ArrowRight,
  Filter
} from 'lucide-react';
import { LeadItem, SocialMessageItem, CommandTask, SiteVisitRecord } from '../../types/command';
import { CoreIQData } from '../../services/supabase';

interface CommandAnalyticsTabProps {
  leads: LeadItem[];
  socialMessages: SocialMessageItem[];
  tasks: CommandTask[];
}

function hasRealContact(contact?: string | null): boolean {
  if (!contact) return false;
  const trimmed = contact.trim();
  if (!trimmed) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+/;
  const phoneRegex = /(?:\+?\d[\d\s\-()]{6,}\d)/;
  return emailRegex.test(trimmed) || phoneRegex.test(trimmed);
}

export const CommandAnalyticsTab: React.FC<CommandAnalyticsTabProps> = ({
  leads,
  socialMessages,
  tasks,
}) => {
  const [siteVisits, setSiteVisits] = useState<SiteVisitRecord[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(true);

  // Fetch real first-party site visits (last 30 days, limit 1000)
  useEffect(() => {
    let mounted = true;
    CoreIQData.getSiteVisits(30, 1000)
      .then((records) => {
        if (mounted) {
          setSiteVisits(records || []);
          setLoadingVisits(false);
        }
      })
      .catch((err) => {
        console.warn('[Analytics] Could not load visits:', err);
        if (mounted) setLoadingVisits(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Filter out test leads so analytics always reflect real client interest
  const realLeads = useMemo(
    () => leads.filter((l) => l.status !== 'test' && l.crm_skipped_reason !== 'test'),
    [leads]
  );
  const realSocial = useMemo(
    () => socialMessages.filter((s) => s.status !== 'test'),
    [socialMessages]
  );

  const totalLeads = realLeads.length;
  const totalSocial = realSocial.length;

  // Real contact leads
  const leadsWithContact = useMemo(
    () => realLeads.filter((l) => hasRealContact(l.client_contact)),
    [realLeads]
  );

  // This week calculation (honest, no fake pluses)
  const oneWeekAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }, []);

  const leadsThisWeek = useMemo(
    () => realLeads.filter((l) => new Date(l.created_at) >= oneWeekAgo).length,
    [realLeads, oneWeekAgo]
  );

  // Intent breakdown
  const intentEntries = useMemo(() => {
    const counts: Record<string, number> = {};
    realLeads.forEach((l) => {
      const it = l.intent_type || 'General Inquiry';
      counts[it] = (counts[it] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [realLeads]);

  // Tasks metrics
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const taskCompletionRate = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  // Unique Visitors breakdown (Today, 7d, 30d)
  const { uniqueToday, unique7d, unique30d, totalPageViews } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const visitsToday = siteVisits.filter((v) => new Date(v.created_at).getTime() >= startOfToday);
    const visits7d = siteVisits.filter((v) => new Date(v.created_at).getTime() >= sevenDaysAgo);

    return {
      uniqueToday: new Set(visitsToday.map((v) => v.visitor_id)).size,
      unique7d: new Set(visits7d.map((v) => v.visitor_id)).size,
      unique30d: new Set(siteVisits.map((v) => v.visitor_id)).size,
      totalPageViews: siteVisits.length,
    };
  }, [siteVisits]);

  // Real Conversion Rate: leads with real contact details / unique visitors
  const conversionRateDisplay = useMemo(() => {
    if (unique30d === 0) {
      return { value: '—', label: 'No visitor data yet' };
    }
    const rate = Math.round((leadsWithContact.length / unique30d) * 100);
    return {
      value: `${Math.min(100, rate)}%`,
      label: `${leadsWithContact.length} contact leads / ${unique30d} visitors`,
    };
  }, [leadsWithContact, unique30d]);

  // Top Pages
  const topPages = useMemo(() => {
    const pageCounts: Record<string, number> = {};
    siteVisits.forEach((v) => {
      const p = v.path || '/';
      pageCounts[p] = (pageCounts[p] || 0) + 1;
    });
    return Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [siteVisits]);

  // Top Referrers
  const topReferrers = useMemo(() => {
    const refCounts: Record<string, number> = {};
    siteVisits.forEach((v) => {
      const ref = v.referrer_domain || 'Direct / Internal';
      refCounts[ref] = (refCounts[ref] || 0) + 1;
    });
    return Object.entries(refCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [siteVisits]);

  // Device Split
  const deviceSplit = useMemo(() => {
    const counts = { desktop: 0, mobile: 0, tablet: 0 };
    siteVisits.forEach((v) => {
      const d = (v.device_type || 'desktop') as keyof typeof counts;
      if (counts[d] !== undefined) counts[d]++;
      else counts.desktop++;
    });
    const total = siteVisits.length || 1;
    return {
      desktop: { count: counts.desktop, pct: Math.round((counts.desktop / total) * 100) },
      mobile: { count: counts.mobile, pct: Math.round((counts.mobile / total) * 100) },
      tablet: { count: counts.tablet, pct: Math.round((counts.tablet / total) * 100) },
    };
  }, [siteVisits]);

  // Real Funnel: Visitors → Started a Chat → Left Contact Details → Became a Task
  const funnelSteps = useMemo(() => {
    const funnelVisitors = Math.max(unique30d, realLeads.length);
    const funnelChats = realLeads.length;
    const funnelContacts = leadsWithContact.length;
    const funnelTasks = tasks.length;

    return [
      {
        step: 1,
        title: 'Unique Visitors',
        count: funnelVisitors,
        pct: 100,
        subtext: 'First-party tracked visits',
      },
      {
        step: 2,
        title: 'Started Inquiry/Chat',
        count: funnelChats,
        pct: funnelVisitors > 0 ? Math.round((funnelChats / funnelVisitors) * 100) : 0,
        subtext: 'Dispatched message or brief',
      },
      {
        step: 3,
        title: 'Left Contact Details',
        count: funnelContacts,
        pct: funnelVisitors > 0 ? Math.round((funnelContacts / funnelVisitors) * 100) : 0,
        subtext: 'Valid email or phone shared',
      },
      {
        step: 4,
        title: 'Became Operator Task',
        count: funnelTasks,
        pct: funnelVisitors > 0 ? Math.round((funnelTasks / funnelVisitors) * 100) : 0,
        subtext: 'Active pipeline delivery',
      },
    ];
  }, [unique30d, realLeads, leadsWithContact, tasks]);

  // Past 7 days inquiry volume
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dayKey = d.toLocaleDateString([], { weekday: 'short' });
      const count = realLeads.filter((l) => {
        const leadDate = new Date(l.created_at);
        return leadDate.toDateString() === d.toDateString();
      }).length;
      return { day: dayKey, count };
    });
  }, [realLeads]);

  const maxVolume = Math.max(...last7Days.map((d) => d.count), 1);

  return (
    <div className="space-y-4">
      
      {/* Top 4 Real KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Total Leads */}
        <div className="p-4 rounded-2xl bg-[#060b1c] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Real Leads</span>
            <Globe className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{totalLeads}</div>
          <div className="text-[11px] text-cyan-300 flex items-center gap-1 font-mono">
            <TrendingUp className="w-3 h-3" />
            <span>
              {leadsThisWeek > 0 ? `+${leadsThisWeek} recorded this week` : '0 recorded this week'}
            </span>
          </div>
        </div>

        {/* Unique Visitors */}
        <div className="p-4 rounded-2xl bg-[#060b1c] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Unique Visitors</span>
            <Users className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {loadingVisits ? '...' : unique30d}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {loadingVisits ? 'Calculating...' : `${uniqueToday} today • ${unique7d} this week`}
          </div>
        </div>

        {/* Real Conversion Rate */}
        <div className="p-4 rounded-2xl bg-[#060b1c] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Lead Conversion Rate</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {conversionRateDisplay.value}
          </div>
          <div className="text-[11px] text-slate-400 font-mono truncate">
            {conversionRateDisplay.label}
          </div>
        </div>

        {/* Operator Execution */}
        <div className="p-4 rounded-2xl bg-[#060b1c] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Operator Execution</span>
            <CheckSquare className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{taskCompletionRate}%</div>
          <div className="text-[11px] text-slate-400 font-mono">
            {doneTasks} done / {inProgressTasks} active tasks
          </div>
        </div>

      </div>

      {/* Conversion Funnel Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#060b1c] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Full Conversion Funnel (Last 30 Days)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Verified visitor lifecycle: from initial page visit to active operational task.
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-300">
            {totalPageViews} page views tracked
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
          {funnelSteps.map((step, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 relative overflow-hidden"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-[10px] uppercase font-bold text-slate-500">
                  Step {step.step}
                </span>
                <span className="font-mono text-cyan-400 font-bold">{step.pct}%</span>
              </div>
              <div className="text-xl font-bold text-white font-mono">{step.count}</div>
              <div className="text-xs font-medium text-slate-200">{step.title}</div>
              <div className="text-[10px] text-slate-500 font-mono">{step.subtext}</div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mt-2">
                <div
                  style={{ width: `${Math.max(4, step.pct)}%` }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Traffic Diagnostics & Demographics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Top Visited Pages */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#060b1c] border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>Top Pages (30d)</span>
          </h4>
          {topPages.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              No page visits tracked yet.
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {topPages.map(([path, count], i) => (
                <div key={i} className="flex items-center justify-between py-1 border-b border-slate-800/40">
                  <span className="font-mono text-slate-300 truncate max-w-[180px]">{path}</span>
                  <span className="font-mono text-cyan-300 font-semibold">{count} views</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Referrers */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#060b1c] border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-violet-400" />
            <span>Top Referrers (30d)</span>
          </h4>
          {topReferrers.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              No external referrers logged.
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {topReferrers.map(([domain, count], i) => (
                <div key={i} className="flex items-center justify-between py-1 border-b border-slate-800/40">
                  <span className="font-mono text-slate-300 truncate max-w-[180px]">{domain}</span>
                  <span className="font-mono text-violet-300 font-semibold">{count} hits</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Device Split */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#060b1c] border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-emerald-400" />
            <span>Device Split</span>
          </h4>
          <div className="space-y-2.5 pt-1 text-xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-slate-400" />
                  <span>Desktop</span>
                </span>
                <span className="font-mono text-slate-300">
                  {deviceSplit.desktop.count} ({deviceSplit.desktop.pct}%)
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                <div
                  style={{ width: `${deviceSplit.desktop.pct}%` }}
                  className="h-full bg-cyan-400 rounded-full"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mobile</span>
                </span>
                <span className="font-mono text-slate-300">
                  {deviceSplit.mobile.count} ({deviceSplit.mobile.pct}%)
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                <div
                  style={{ width: `${deviceSplit.mobile.pct}%` }}
                  className="h-full bg-violet-400 rounded-full"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Tablet className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tablet</span>
                </span>
                <span className="font-mono text-slate-300">
                  {deviceSplit.tablet.count} ({deviceSplit.tablet.pct}%)
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                <div
                  style={{ width: `${deviceSplit.tablet.pct}%` }}
                  className="h-full bg-amber-400 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Inquiry Volume and Top Intents Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Chart: Inquiry Volume Over Time */}
        <div className="col-span-12 lg:col-span-7 p-4 sm:p-5 rounded-2xl bg-[#060b1c] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Inquiry Volume (Last 7 Days)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Aggregated daily incoming client inquiries (excluding test leads).
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-300">
              {last7Days.reduce((acc, c) => acc + c.count, 0)} total inquiries
            </span>
          </div>

          {/* Geometric Bar Chart */}
          <div className="h-44 flex items-end justify-between gap-2 pt-6 px-2 border-b border-slate-800">
            {last7Days.map((item, idx) => {
              const heightPercent = Math.round((item.count / maxVolume) * 100);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.count}
                  </span>
                  <div
                    style={{ height: `${Math.max(12, heightPercent)}%` }}
                    className="w-full max-w-[36px] rounded-t-lg bg-gradient-to-t from-cyan-600/40 to-cyan-400 border-t border-cyan-300 shadow-[0_0_12px_rgba(25,217,255,0.2)] transition-all group-hover:brightness-125"
                  />
                  <span className="text-[10px] font-mono text-slate-400 mt-1">
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Chart: Top Intent Types */}
        <div className="col-span-12 lg:col-span-5 p-4 sm:p-5 rounded-2xl bg-[#060b1c] border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span>Top Inquiry Intents</span>
            </h3>
            <p className="text-xs text-slate-400">
              Categorized solutions and system architecture requests.
            </p>
          </div>

          <div className="space-y-3">
            {intentEntries.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No intent data logged yet.
              </div>
            ) : (
              intentEntries.slice(0, 5).map(([intent, count], idx) => {
                const pct = Math.round((count / Math.max(1, totalLeads)) * 100);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-200 capitalize font-medium">{intent}</span>
                      <span className="text-cyan-300 font-mono">{count} leads ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 shadow-[0_0_8px_rgba(25,217,255,0.4)]"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
