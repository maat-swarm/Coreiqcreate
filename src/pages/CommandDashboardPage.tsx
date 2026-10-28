import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  CommandTab, 
  LeadItem, 
  SocialMessageItem, 
  CommandTask, 
  CommandClient, 
  AgentConfig, 
  AgentToolConnection, 
  PlatformRegistryItem, 
  ContentItem, 
  SwarmMessage,
  ApiKeyItem,
  UnifiedInboxItem 
} from '../types/command';
import { 
  CoreIQData, 
  CoreIQAuth,
  isSupabaseConfigured, 
  getSupabaseCredentials,
  DEFAULT_COREIQ_SYSTEM_PROMPT,
  DatabaseStatusResult,
  DbHealthStatus
} from '../services/supabase';
import { playCommandAlertChime } from '../utils/sound';
import { CommandNav } from '../components/command/CommandNav';
import { CommandInboxTab } from '../components/command/CommandInboxTab';
import { CommandTasksTab } from '../components/command/CommandTasksTab';
import { CommandClientsTab } from '../components/command/CommandClientsTab';
import { CommandBrainTab } from '../components/command/CommandBrainTab';
import { CommandApiKeysTab } from '../components/command/CommandApiKeysTab';
import { CommandToolsTab } from '../components/command/CommandToolsTab';
import { CommandMaatverseTab } from '../components/command/CommandMaatverseTab';
import { CommandPlatformsTab } from '../components/command/CommandPlatformsTab';
import { CommandContentTab } from '../components/command/CommandContentTab';
import { CommandUseCasesTab } from '../components/command/CommandUseCasesTab';
import { CommandNewsTab } from '../components/command/CommandNewsTab';
import { CommandStoreTab } from '../components/command/CommandStoreTab';
import { CommandUploadTab } from '../components/command/CommandUploadTab';
import { CommandSwarmTab } from '../components/command/CommandSwarmTab';
import { CommandAnalyticsTab } from '../components/command/CommandAnalyticsTab';
import { CommandAuthModal } from '../components/command/CommandAuthModal';
import { CommandLoginPage } from './CommandLoginPage';
import { ExtendedCommandTab } from '../components/command/CommandNav';
import { 
  Cpu, 
  Database, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Bell, 
  X, 
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  LogOut,
  AlertTriangle,
  Key
} from 'lucide-react';

interface CommandDashboardPageProps {
  onExitToWebsite: () => void;
}

export const CommandDashboardPage: React.FC<CommandDashboardPageProps> = ({ onExitToWebsite }) => {
  // Authentication state
  const [authSession, setAuthSession] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [activeTab, setActiveTab] = useState<ExtendedCommandTab>('inbox');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // In-app alert banner for new arrivals
  const [inAppAlert, setInAppAlert] = useState<{ title: string; subtitle: string } | null>(null);

  // State collections
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [socialMessages, setSocialMessages] = useState<SocialMessageItem[]>([]);
  const [tasks, setTasks] = useState<CommandTask[]>([]);
  const [clients, setClients] = useState<CommandClient[]>([]);
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    id: 'default',
    provider: 'groq',
    model_name: 'llama-3.3-70b-versatile',
    base_url: 'https://api.groq.com/openai/v1',
    api_key: '',
    system_prompt: DEFAULT_COREIQ_SYSTEM_PROMPT,
    updated_at: new Date().toISOString(),
  });
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [tools, setTools] = useState<AgentToolConnection[]>([]);
  const [platforms, setPlatforms] = useState<PlatformRegistryItem[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [swarmMessages, setSwarmMessages] = useState<SwarmMessage[]>([]);

  // Supabase connection & live schema status
  const [isConnectedToSupabase, setIsConnectedToSupabase] = useState(false);
  const [isLiveDb, setIsLiveDb] = useState(false);
  const [dbStatusDetails, setDbStatusDetails] = useState<string>('');
  const [dbHealth, setDbHealth] = useState<DatabaseStatusResult>({
    isLiveDb: false,
    status: isSupabaseConfigured() ? 'schema_missing' : 'local_only',
    details: 'Checking database connectivity...',
    missingTables: [],
  });
  const { url: currentSupabaseUrl, anonKey: currentSupabaseKey } = getSupabaseCredentials();

  // Track previous counts for arrival alerts
  const prevLeadsCount = useRef<number | null>(null);
  const prevSocialCount = useRef<number | null>(null);

  // Check auth on mount
  useEffect(() => {
    let mounted = true;
    CoreIQAuth.getSession().then((session) => {
      if (mounted) {
        setAuthSession(session);
        setCheckingAuth(false);
      }
    });

    const handleAuthChange = (e: any) => {
      setAuthSession(e.detail?.session ?? null);
    };
    window.addEventListener('coreiq_auth_state_change', handleAuthChange);

    return () => {
      mounted = false;
      window.removeEventListener('coreiq_auth_state_change', handleAuthChange);
    };
  }, []);

  const fetchAllData = useCallback(async () => {
    try {
      setIsConnectedToSupabase(isSupabaseConfigured());

      // Check database status
      const dbStatus = await CoreIQData.checkDatabaseStatus();
      setDbHealth(dbStatus);
      setIsLiveDb(dbStatus.isLiveDb);
      setDbStatusDetails(dbStatus.details);

      const [
        fetchedLeads,
        fetchedSocial,
        fetchedTasks,
        fetchedClients,
        fetchedConfig,
        fetchedApiKeys,
        fetchedTools,
        fetchedPlatforms,
        fetchedContent,
        fetchedSwarm,
      ] = await Promise.all([
        CoreIQData.getLeads(),
        CoreIQData.getSocialMessages(),
        CoreIQData.getTasks(),
        CoreIQData.getClients(),
        CoreIQData.getAgentConfig(),
        CoreIQData.getApiKeys(),
        CoreIQData.getAgentTools(),
        CoreIQData.getPlatforms(),
        CoreIQData.getContentItems(),
        CoreIQData.getSwarmMessages(),
      ]);

      // Check for newly arrived leads/messages
      if (prevLeadsCount.current !== null && fetchedLeads.length > prevLeadsCount.current) {
        const latest = fetchedLeads[0];
        if (!isSoundMuted) playCommandAlertChime();
        setInAppAlert({
          title: 'New Website Inquiry Received',
          subtitle: `${latest.client_name}: "${latest.client_message || latest.intent_type || 'Inquiry logged'}"`,
        });
      }

      if (prevSocialCount.current !== null && fetchedSocial.length > prevSocialCount.current) {
        const latestSocial = fetchedSocial[0];
        if (!isSoundMuted) playCommandAlertChime();
        setInAppAlert({
          title: `New Social Inbound (${latestSocial.source.toUpperCase()})`,
          subtitle: `${latestSocial.sender_name}: "${latestSocial.message_text}"`,
        });
      }

      prevLeadsCount.current = fetchedLeads.length;
      prevSocialCount.current = fetchedSocial.length;

      setLeads(fetchedLeads);
      setSocialMessages(fetchedSocial);
      setTasks(fetchedTasks);
      setClients(fetchedClients);
      setAgentConfig(fetchedConfig);
      setApiKeys(fetchedApiKeys);
      setTools(fetchedTools);
      setPlatforms(fetchedPlatforms);
      setContentItems(fetchedContent);
      setSwarmMessages(fetchedSwarm);
    } catch (err) {
      console.error('Error loading CoreIQ Command data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isSoundMuted]);

  // Initial load and subscriptions
  useEffect(() => {
    if (!authSession) return;
    fetchAllData();

    // Subscribe to realtime updates for all tables
    const unsubLeads = CoreIQData.subscribe('leads', () => fetchAllData());
    const unsubSocial = CoreIQData.subscribe('social_messages', () => fetchAllData());
    const unsubTasks = CoreIQData.subscribe('tasks', () => fetchAllData());
    const unsubClients = CoreIQData.subscribe('clients', () => fetchAllData());
    const unsubConfig = CoreIQData.subscribe('agent_config', () => fetchAllData());
    const unsubApiKeys = CoreIQData.subscribe('api_keys', () => fetchAllData());
    const unsubSwarm = CoreIQData.subscribe('swarm_comms', () => fetchAllData());

    return () => {
      unsubLeads();
      unsubSocial();
      unsubTasks();
      unsubClients();
      unsubConfig();
      unsubApiKeys();
      unsubSwarm();
    };
  }, [authSession, fetchAllData]);

  // Sign out handler
  const handleSignOut = async () => {
    await CoreIQAuth.signOut();
    setAuthSession(null);
  };

  // Convert inbox item to task
  const handleConvertToTask = async (item: UnifiedInboxItem) => {
    const isLead = item.itemType === 'lead';
    const title = isLead
      ? `Follow up with ${item.client_name} (${item.intent_type || 'Inquiry'})`
      : `Respond to ${item.sender_name} on ${item.source}`;
    
    const desc = isLead
      ? item.client_message || item.conversation_summary || 'Website intake inquiry'
      : item.message_text;

    await CoreIQData.insertTask({
      title,
      description: desc,
      status: 'not_started',
      linked_lead_id: isLead ? item.id : null,
    });

    setActiveTab('tasks');
    fetchAllData();
  };

  // Show auth checking spinner
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
          <span className="text-xs font-mono text-cyan-300">Authenticating CoreIQ Operator...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, render secure CommandLoginPage
  if (!authSession) {
    return (
      <CommandLoginPage
        onAuthenticated={(sess) => {
          setAuthSession(sess);
          fetchAllData();
        }}
        onExitToWebsite={onExitToWebsite}
      />
    );
  }

  const newInboxCount = leads.filter((l) => l.status === 'new').length + 
    socialMessages.filter((s) => s.status === 'new').length;

  const activeTasksCount = tasks.filter((t) => t.status === 'in_progress').length;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Top Cockpit Header */}
      <header className="sticky top-0 z-40 bg-[#040817]/95 border-b border-cyan-500/20 backdrop-blur-xl px-3 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 shadow-[0_0_20px_rgba(25,217,255,0.3)]">
              <div className="w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_12px_#19d9ff] animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white font-display">
                  CoreIQ <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">COMMAND</span>
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  OPERATOR SURFACE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden xs:block">
                Unified AI Control Center & Autonomous Runtime
              </p>
            </div>
          </div>

          {/* Top Right Cockpit Utilities */}
          <div className="flex items-center gap-2">
            
            {/* Supabase Status Pill */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-all min-h-[44px] ${
                isConnectedToSupabase && isLiveDb
                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : isConnectedToSupabase
                  ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title={dbStatusDetails || 'Click to view connection info or copy schema SQL'}
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isConnectedToSupabase && isLiveDb 
                  ? 'Supabase Realtime Live' 
                  : isConnectedToSupabase 
                  ? 'Schema Setup Needed' 
                  : 'Local Reactive Mode'}
              </span>
              <span className="sm:hidden">
                {isConnectedToSupabase && isLiveDb ? 'Live' : 'Cloud'}
              </span>
            </button>

            {/* Chime Sound Toggle */}
            <button
              onClick={() => setIsSoundMuted(!isSoundMuted)}
              className={`p-2 rounded-xl border text-xs transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                isSoundMuted
                  ? 'bg-slate-900 border-slate-800 text-slate-500'
                  : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
              }`}
              title={isSoundMuted ? 'Sound Alert Muted' : 'Sound Alert Enabled'}
            >
              {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Refresh Button */}
            <button
              onClick={fetchAllData}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Refresh Realtime Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Operator Badge & Sign Out */}
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-800">
              <span className="text-xs font-mono text-slate-400 max-w-[140px] truncate" title={authSession?.user?.email}>
                {authSession?.user?.email || 'Operator'}
              </span>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Sign Out of Command"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Persistent Database Health Strip */}
      <div className={`border-b px-3 sm:px-6 py-2.5 text-xs transition-colors backdrop-blur-md ${
        dbHealth.status === 'live'
          ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-300'
          : dbHealth.status === 'schema_missing'
          ? 'bg-amber-950/60 border-amber-500/30 text-amber-300'
          : dbHealth.status === 'not_signed_in'
          ? 'bg-purple-950/60 border-purple-500/30 text-purple-300'
          : 'bg-rose-950/60 border-rose-500/30 text-rose-300'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              dbHealth.status === 'live' ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]' :
              dbHealth.status === 'schema_missing' ? 'bg-amber-400 animate-pulse shadow-[0_0_8px_#fbbf24]' :
              dbHealth.status === 'not_signed_in' ? 'bg-purple-400 shadow-[0_0_8px_#c084fc]' :
              'bg-rose-400 shadow-[0_0_8px_#f87171]'
            }`} />
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="font-mono font-bold uppercase tracking-wider text-[11px]">
                {dbHealth.status === 'live' && '🟢 Live Database'}
                {dbHealth.status === 'schema_missing' && '🟡 Schema Missing'}
                {dbHealth.status === 'local_only' && '🔴 Local-Only Mode'}
                {dbHealth.status === 'not_signed_in' && '🔒 Not Signed In'}
              </span>
              <span className="text-slate-300">
                {dbHealth.status === 'live' && 'Remote Supabase connected. All 10 operational tables verified with Realtime sync.'}
                {dbHealth.status === 'schema_missing' && `Supabase connected, but missing tables: ${(dbHealth.missingTables || []).join(', ')}. Run migration in Supabase SQL editor.`}
                {dbHealth.status === 'local_only' && 'Supabase credentials not configured in environment. Changes exist in this browser only and will NOT appear on the public site.'}
                {dbHealth.status === 'not_signed_in' && 'No active operator session. Writes to secured tables will be blocked by RLS policies.'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            {dbHealth.status === 'schema_missing' && (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-mono text-[11px] font-semibold transition-colors"
              >
                Copy Missing Schema SQL
              </button>
            )}
            {dbHealth.status === 'local_only' && (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-2.5 py-1 rounded-md bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-mono text-[11px] font-semibold transition-colors"
              >
                Configure Supabase
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Realtime In-App Alert Banner */}
      {inAppAlert && (
        <div className="bg-gradient-to-r from-cyan-950/90 via-blue-950/90 to-violet-950/90 border-b border-cyan-500/40 py-2 px-4 shadow-[0_0_25px_rgba(25,217,255,0.25)] animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="p-1 rounded-lg bg-cyan-500 text-slate-950">
                <Bell className="w-3.5 h-3.5" />
              </span>
              <div>
                <span className="font-bold text-white mr-1.5">{inAppAlert.title}:</span>
                <span className="text-slate-300">{inAppAlert.subtitle}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveTab('inbox');
                  setInAppAlert(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-colors"
              >
                View in Inbox
              </button>
              <button
                onClick={() => setInAppAlert(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Segmented Bar */}
      <div className="sticky top-[61px] z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <CommandNav
            activeTab={activeTab}
            onSelectTab={(tab) => setActiveTab(tab)}
            newInboxCount={newInboxCount}
            activeTasksCount={activeTasksCount}
            onExitToWebsite={onExitToWebsite}
          />
        </div>
      </div>

      {/* Main Operating Surface Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        
        {/* Persistent Warning Banner when in Local-Only Mode */}
        {dbHealth.status === 'local_only' && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-2.5 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <strong className="font-semibold text-rose-200">Local-Only Mode Warning: </strong>
              Supabase credentials are not active in this environment. Content, tools, and news items saved here are stored in your browser's local storage only and will NOT appear on the public live site.
            </div>
          </div>
        )}
        
        {activeTab === 'inbox' && (
          <CommandInboxTab
            leads={leads}
            socialMessages={socialMessages}
            onRefresh={fetchAllData}
            onConvertToTask={handleConvertToTask}
          />
        )}

        {activeTab === 'tasks' && (
          <CommandTasksTab
            tasks={tasks}
            leads={leads}
            clients={clients}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === 'clients' && (
          <CommandClientsTab
            clients={clients}
            leads={leads}
            tasks={tasks}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === 'brain' && (
          <CommandBrainTab
            config={agentConfig}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === 'api_keys' && (
          <CommandApiKeysTab
            apiKeys={apiKeys}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === 'tools' && (
          <CommandToolsTab
            tools={tools}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === 'maatverse' && (
          <CommandMaatverseTab />
        )}

        {activeTab === 'platforms' && (
          <CommandPlatformsTab
            platforms={platforms}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === 'content' && (
          <CommandContentTab
            contentItems={contentItems}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === 'use_cases' && (
          <CommandUseCasesTab />
        )}

        {activeTab === 'news' && (
          <CommandNewsTab />
        )}

        {activeTab === 'store' && (
          <CommandStoreTab />
        )}

        {activeTab === 'upload' && (
          <CommandUploadTab />
        )}

        {activeTab === 'swarm' && (
          <CommandSwarmTab
            swarmMessages={swarmMessages}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === 'analytics' && (
          <CommandAnalyticsTab
            leads={leads}
            socialMessages={socialMessages}
            tasks={tasks}
          />
        )}

      </main>

      {/* Footer Operator Telemetry */}
      <footer className="border-t border-slate-900 bg-[#02050f] py-3 px-4 text-center text-slate-600 text-[11px] font-mono">
        <span>CoreIQ Command v2.4.0 — Operator Surface for CoreIQ Create</span>
        <span className="mx-2">•</span>
        <span>Mobile-First Engine (Samsung Galaxy A24 & Desktop)</span>
      </footer>

      {/* Supabase & Operator Auth Modal */}
      <CommandAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onCredentialsUpdated={fetchAllData}
        currentUrl={currentSupabaseUrl}
        currentKey={currentSupabaseKey}
      />

    </div>
  );
};
