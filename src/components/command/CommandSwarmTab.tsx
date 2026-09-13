import React, { useState } from 'react';
import { 
  Share2, 
  Activity, 
  Cpu, 
  ShieldAlert, 
  Layers, 
  ArrowRight, 
  Eye, 
  Radio, 
  RefreshCw,
  Clock,
  Terminal,
  Play
} from 'lucide-react';
import { SwarmMessage } from '../../types/command';
import { CoreIQData } from '../../services/supabase';

interface CommandSwarmTabProps {
  swarmMessages: SwarmMessage[];
  onRefresh: () => void;
}

export const CommandSwarmTab: React.FC<CommandSwarmTabProps> = ({
  swarmMessages,
  onRefresh,
}) => {
  const [filterAgent, setFilterAgent] = useState<string>('all');

  // Distinct agent identities
  const agents = [
    { id: 'Orchestrator-Prime', role: 'Global Planning & Task Decomposition', status: 'active', color: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10' },
    { id: 'Architect-01', role: 'System Blueprint & Schema Design', status: 'active', color: 'text-violet-400 border-violet-500/40 bg-violet-500/10' },
    { id: 'Synthesizer-02', role: 'Code & Workflow Synthesis', status: 'active', color: 'text-blue-400 border-blue-500/40 bg-blue-500/10' },
    { id: 'Verifier-03', role: 'Deterministic Validation & Safety', status: 'idle', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
    { id: 'Intake-04', role: 'Public Inbound Intent Parser', status: 'active', color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
  ];

  const handleSimulateSwarmEvent = async () => {
    const sampleEvents = [
      {
        agent_name: 'Orchestrator-Prime',
        event_type: 'task_delegated',
        payload: { target: 'Architect-01', goal: 'Synthesize multi-agent customer support flow with human-in-the-loop escalation.' },
      },
      {
        agent_name: 'Architect-01',
        event_type: 'blueprint_compiled',
        payload: { nodes: 6, state_machine: 'Supabase pg_cron + Edge Functions', latency_target: '<350ms' },
      },
      {
        agent_name: 'Verifier-03',
        event_type: 'verification_passed',
        payload: { tests_passed: 14, zero_hallucination_score: 0.99, safety_envelope: 'compliant' },
      },
    ];

    const randomEv = sampleEvents[Math.floor(Math.random() * sampleEvents.length)];
    await CoreIQData.insertSwarmMessage(randomEv);
    onRefresh();
  };

  const filteredMessages = swarmMessages.filter((msg) => {
    if (filterAgent === 'all') return true;
    return msg.agent_name.toLowerCase() === filterAgent.toLowerCase();
  });

  return (
    <div className="space-y-4">
      
      {/* Top Banner: Read-Only SwarmHive OS Monitor */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#060b1c]/90 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0 shadow-[0_0_20px_rgba(139,92,246,0.15)]">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white font-display">
                SwarmHive OS Telemetry
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-violet-500/20 text-violet-300 border border-violet-500/30">
                READ-ONLY MONITOR
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous cross-agent communication bus. Inspects coordinated task distribution without interrupting execution.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateSwarmEvent}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-violet-300 hover:text-white flex items-center gap-1.5 transition-colors min-h-[44px]"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Emit Test Telemetry</span>
          </button>
        </div>
      </div>

      {/* Swarm Agents Active Matrix */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#060b1c] border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-violet-400 font-mono flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            <span>Active Swarm Nodes ({agents.length})</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-500">Autonomous Execution Protocol</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/60 flex items-start justify-between gap-2"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : 'bg-slate-500'}`} />
                  <h4 className="text-xs font-bold text-white font-mono">{agent.id}</h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{agent.role}</p>
              </div>

              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase shrink-0 ${agent.color}`}>
                {agent.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Realtime Event Stream */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#060b1c] border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white font-mono">
              Live Inter-Agent Event Feed
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Filter Agent:</span>
            <select
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-400 font-mono"
            >
              <option value="all">All Agents</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Messages List */}
        {filteredMessages.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <Activity className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
            <p className="text-xs text-slate-400">
              Swarm communication bus is idle. Events written to the `swarm_comms` table populate here instantaneously.
            </p>
            <button
              onClick={handleSimulateSwarmEvent}
              className="mt-2 px-3.5 py-1.5 rounded-lg bg-violet-500/20 text-violet-300 text-xs font-semibold border border-violet-500/30"
            >
              Generate Test Event
            </button>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1 font-mono text-xs">
            {filteredMessages.map((msg) => (
              <div
                key={msg.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-300 font-bold">{msg.agent_name}</span>
                    <span className="text-slate-600">→</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 text-violet-300 border border-slate-800 text-[10px]">
                      {msg.event_type}
                    </span>
                  </div>
                  <span className="text-slate-500 text-[10px]">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-[#02050f] text-[11px] text-slate-300 overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(msg.payload, null, 2)}</pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
