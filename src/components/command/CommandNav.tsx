import React from 'react';
import { 
  Inbox, 
  CheckSquare, 
  Users, 
  Brain, 
  Key,
  Wrench, 
  Globe, 
  FolderKanban, 
  Share2, 
  BarChart3,
  ArrowUpRight,
  UploadCloud
} from 'lucide-react';
import { CommandTab } from '../../types/command';

interface CommandNavProps {
  activeTab: CommandTab;
  onSelectTab: (tab: CommandTab) => void;
  newInboxCount: number;
  activeTasksCount: number;
  onExitToWebsite: () => void;
}

export const COMMAND_TABS: { id: CommandTab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'brain', label: 'Agent Brain', icon: Brain },
  { id: 'api_keys', label: 'API Keys', icon: Key },
  { id: 'tools', label: 'Tools', icon: Wrench },
  { id: 'platforms', label: 'Platforms', icon: Globe },
  { id: 'content', label: 'Content', icon: FolderKanban },
  { id: 'upload', label: 'Media Slots', icon: UploadCloud },
  { id: 'swarm', label: 'Swarm', icon: Share2 },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export const CommandNav: React.FC<CommandNavProps> = ({
  activeTab,
  onSelectTab,
  newInboxCount,
  activeTasksCount,
  onExitToWebsite,
}) => {
  return (
    <div className="w-full">
      {/* Desktop / Tablet Bar: Horizontal Scrollable Segmented Control */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-2 px-1 border-b border-slate-800/80 bg-[#060b1c]/80 backdrop-blur-xl">
        <div className="flex items-center gap-1.5 shrink-0">
          {COMMAND_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const hasInboxBadge = tab.id === 'inbox' && newInboxCount > 0;
            const hasTaskBadge = tab.id === 'tasks' && activeTasksCount > 0;

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`relative px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-200 select-none shrink-0 min-h-[44px] ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(25,217,255,0.2)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>

                {/* Badges */}
                {hasInboxBadge && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500 text-slate-950 shadow-[0_0_8px_rgba(25,217,255,0.8)] animate-pulse">
                    {newInboxCount}
                  </span>
                )}
                {hasTaskBadge && !hasInboxBadge && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    {activeTasksCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Public Website Exit link */}
        <div className="shrink-0 pl-2">
          <button
            onClick={onExitToWebsite}
            className="px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-900/70 hover:bg-slate-800 border border-slate-800 flex items-center gap-1.5 transition-colors min-h-[44px]"
            title="Switch to Public Website view"
          >
            <span>Public Site</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
