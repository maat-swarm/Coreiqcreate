import React, { useState } from 'react';
import { 
  Globe, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Filter, 
  Sparkles, 
  Trash2, 
  X, 
  Plus, 
  Send, 
  FileText, 
  User, 
  Mail, 
  Phone,
  Layers,
  Bell
} from 'lucide-react';
import { LeadItem, SocialMessageItem, UnifiedInboxItem, LeadStatus } from '../../types/command';
import { CoreIQData } from '../../services/supabase';

interface CommandInboxTabProps {
  leads: LeadItem[];
  socialMessages: SocialMessageItem[];
  onRefresh: () => void;
  onConvertToTask: (item: UnifiedInboxItem) => void;
}

export const CommandInboxTab: React.FC<CommandInboxTabProps> = ({
  leads,
  socialMessages,
  onRefresh,
  onConvertToTask,
}) => {
  const [filterSource, setFilterSource] = useState<'all' | 'website' | 'social'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | LeadStatus>('all');
  const [selectedItem, setSelectedItem] = useState<UnifiedInboxItem | null>(null);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simType, setSimType] = useState<'website' | 'social'>('website');

  // New simulation form state
  const [simName, setSimName] = useState('');
  const [simContact, setSimContact] = useState('');
  const [simMessage, setSimMessage] = useState('');
  const [simPlatform, setSimPlatform] = useState('instagram');
  const [simIntent, setSimIntent] = useState('automation');

  // Merge unified items sorted by date descending
  const unifiedItems: UnifiedInboxItem[] = [
    ...leads.map((l) => ({ ...l, itemType: 'lead' as const })),
    ...socialMessages.map((s) => ({ ...s, itemType: 'social' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Filter items
  const filteredItems = unifiedItems.filter((item) => {
    if (filterSource === 'website' && item.itemType !== 'lead') return false;
    if (filterSource === 'social' && item.itemType !== 'social') return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    return true;
  });

  const handleStatusChange = async (item: UnifiedInboxItem, newStatus: LeadStatus) => {
    if (item.itemType === 'lead') {
      await CoreIQData.updateLeadStatus(item.id, newStatus);
    } else {
      await CoreIQData.updateSocialStatus(item.id, newStatus);
    }
    onRefresh();
    if (selectedItem && selectedItem.id === item.id) {
      setSelectedItem({ ...selectedItem, status: newStatus });
    }
  };

  const handleDeleteItem = async (item: UnifiedInboxItem) => {
    if (item.itemType === 'lead') {
      await CoreIQData.deleteLead(item.id);
    }
    onRefresh();
    if (selectedItem?.id === item.id) setSelectedItem(null);
  };

  const handleSimulateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simName.trim()) return;

    if (simType === 'website') {
      await CoreIQData.insertLead({
        source: 'website',
        client_name: simName.trim(),
        client_contact: simContact.trim() || 'client@example.com',
        client_message: simMessage.trim() || 'Looking for an autonomous sales agent with CRM integration.',
        conversation_summary: `Client requested architecture for ${simIntent}. Priority inquiry.`,
        intent_type: simIntent,
        status: 'new',
        full_conversation: [
          {
            sender: 'user',
            text: simMessage.trim() || 'Looking for an autonomous sales agent with CRM integration.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          {
            sender: 'coreiq',
            text: `CoreIQ synthesized a custom ${simIntent} blueprint. Ready for operator validation.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      });
    } else {
      await CoreIQData.insertSocialMessage({
        source: simPlatform,
        sender_name: simName.trim(),
        sender_contact: simContact.trim() || `@${simName.toLowerCase().replace(/\s+/g, '')}`,
        message_text: simMessage.trim() || `Inquiry from ${simPlatform}: "Hi, do you build custom voice AI assistants?"`,
        status: 'new',
      });
    }

    setShowSimulateModal(false);
    setSimName('');
    setSimContact('');
    setSimMessage('');
    onRefresh();
  };

  return (
    <div className="space-y-4">
      
      {/* PUSH NOTIFICATION INTEGRATION POINT (Architectural hook documented per spec) */}
      {/* 
        NOTE FOR PUSH NOTIFICATION SERVICE (Firebase Cloud Messaging / Web Push / OneSignal):
        When this app is closed on Android (e.g. Samsung Galaxy A24), hook your Service Worker
        in /public/sw.js to listen to Supabase Edge Function database webhooks on 'leads' and
        'social_messages' INSERT events, triggering self.registration.showNotification('CoreIQ Alert', { body: ... }).
      */}

      {/* Top Filter & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#060b1c]/90 border border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2">
          {/* Source filter */}
          <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs">
            <button
              onClick={() => setFilterSource('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterSource === 'all' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Sources ({unifiedItems.length})
            </button>
            <button
              onClick={() => setFilterSource('website')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                filterSource === 'website' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Website ({leads.length})</span>
            </button>
            <button
              onClick={() => setFilterSource('social')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                filterSource === 'social' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
              <span>Social ({socialMessages.length})</span>
            </button>
          </div>

          {/* Status filter */}
          <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                filterStatus === 'all' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('new')}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                filterStatus === 'new' ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>New</span>
            </button>
            <button
              onClick={() => setFilterStatus('in_progress')}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                filterStatus === 'in_progress' ? 'bg-amber-500/20 text-amber-300 font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>In Progress</span>
            </button>
            <button
              onClick={() => setFilterStatus('done')}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                filterStatus === 'done' ? 'bg-emerald-500/20 text-emerald-300 font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Done</span>
            </button>
          </div>
        </div>

        {/* Action Button: Test Simulation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSimulateModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition-colors min-h-[44px]"
            title="Create an inbound inquiry test record"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Test Inbound Arrival</span>
          </button>
        </div>
      </div>

      {/* Main Inbox Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left List: Unified Feed */}
        <div className={`${selectedItem ? 'hidden lg:block lg:col-span-5' : 'col-span-12'} space-y-2.5`}>
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#060b1c]/60 border border-slate-800/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                <Filter className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">No Inquiries Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No items match your active filter. Inquiries from the website "Ask Core IQ" surface or social channels appear here in realtime.
              </p>
              <button
                onClick={() => setShowSimulateModal(true)}
                className="mt-2 px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold"
              >
                Create Test Lead
              </button>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isLead = item.itemType === 'lead';
              const isSelected = selectedItem?.id === item.id;
              const dateStr = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const dayStr = new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' });

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden select-none active:scale-[0.99] ${
                    isSelected
                      ? 'bg-[#0a122e] border-cyan-400/80 shadow-[0_0_20px_rgba(25,217,255,0.2)]'
                      : item.status === 'new'
                      ? 'bg-[#080d24] border-cyan-500/40 hover:border-cyan-400/60'
                      : 'bg-[#060a1c]/80 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {/* Left accent border for new status */}
                  {item.status === 'new' && (
                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_10px_#19d9ff]" />
                  )}

                  <div className="flex items-start justify-between gap-3 mb-2">
                    {/* Source tag & Name */}
                    <div className="flex items-center gap-2">
                      {isLead ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          <span>Website Lead</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-violet-500/15 border border-violet-500/30 text-violet-300 flex items-center gap-1 uppercase">
                          <MessageSquare className="w-3 h-3" />
                          <span>{item.source}</span>
                        </span>
                      )}

                      {isLead && item.intent_type && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800">
                          {item.intent_type}
                        </span>
                      )}
                    </div>

                    {/* Timestamp */}
                    <span className="text-[11px] font-mono text-slate-500">
                      {dayStr} {dateStr}
                    </span>
                  </div>

                  {/* Sender Name & Preview */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white truncate">
                        {isLead ? item.client_name : item.sender_name}
                      </h4>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          item.status === 'new'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : item.status === 'in_progress'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {isLead
                        ? item.client_message || item.conversation_summary || 'Website discovery session logged.'
                        : item.message_text}
                    </p>
                  </div>

                  {/* Contact info snippet */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate">{isLead ? item.client_contact : item.sender_contact}</span>
                    <span className="text-cyan-400 font-medium flex items-center gap-1 hover:underline">
                      <span>Inspect</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Detail Pane: Full Conversation & Operator Actions */}
        {selectedItem && (
          <div className="col-span-12 lg:col-span-7 bg-[#060c24] border border-cyan-500/30 rounded-2xl p-5 sm:p-6 space-y-5 shadow-[0_0_40px_rgba(25,217,255,0.1)]">
            
            {/* Detail Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold ${
                      selectedItem.itemType === 'lead'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                    }`}
                  >
                    {selectedItem.itemType === 'lead' ? 'WEBSITE LEAD' : `SOCIAL: ${selectedItem.source.toUpperCase()}`}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(selectedItem.created_at).toLocaleString()}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white">
                  {selectedItem.itemType === 'lead' ? selectedItem.client_name : selectedItem.sender_name}
                </h3>
                <p className="text-xs text-cyan-300 font-mono mt-0.5">
                  {selectedItem.itemType === 'lead' ? selectedItem.client_contact : selectedItem.sender_contact}
                </p>
              </div>

              {/* Close button for mobile */}
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
                aria-label="Close details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Control & Task Conversion */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Status:</span>
                <select
                  value={selectedItem.status}
                  onChange={(e) => handleStatusChange(selectedItem, e.target.value as LeadStatus)}
                  className="bg-slate-900 border border-slate-700 text-xs text-white font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-400"
                >
                  <option value="new">New</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onConvertToTask(selectedItem)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(25,217,255,0.2)]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Convert to Task</span>
                </button>
                <button
                  onClick={() => handleDeleteItem(selectedItem)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                  title="Delete record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Conversation Transcript or Message Content */}
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                {selectedItem.itemType === 'lead' ? 'Full Conversation Transcript' : 'Incoming Message Content'}
              </span>

              {selectedItem.itemType === 'lead' ? (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {/* Summary card if exists */}
                  {selectedItem.conversation_summary && (
                    <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-slate-300">
                      <span className="font-semibold text-cyan-400 block mb-1">Architecture Summary:</span>
                      {selectedItem.conversation_summary}
                    </div>
                  )}

                  {/* Transcript turns */}
                  {Array.isArray(selectedItem.full_conversation) && selectedItem.full_conversation.length > 0 ? (
                    selectedItem.full_conversation.map((turn, i) => (
                      <div
                        key={i}
                        className={`p-3.5 rounded-xl text-xs space-y-1 ${
                          turn.sender === 'user'
                            ? 'bg-cyan-950/40 border border-cyan-500/30 text-white ml-4'
                            : turn.sender === 'operator'
                            ? 'bg-violet-950/40 border border-violet-500/30 text-white mr-4'
                            : 'bg-slate-900 border border-slate-800 text-slate-200 mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span className="uppercase font-bold text-cyan-300">{turn.sender}</span>
                          <span>{turn.timestamp}</span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{turn.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
                      <p className="leading-relaxed">
                        {typeof selectedItem.full_conversation === 'string'
                          ? selectedItem.full_conversation
                          : selectedItem.client_message || 'Inquiry logged from website.'}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedItem.message_text}
                </div>
              )}
            </div>

            {/* Client Context Details */}
            <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-mono mb-1">Contact Details</span>
                <span className="text-white font-medium">{selectedItem.itemType === 'lead' ? selectedItem.client_contact : selectedItem.sender_contact}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-mono mb-1">Source System</span>
                <span className="text-cyan-300 font-medium font-mono">{selectedItem.source.toUpperCase()}</span>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Test Simulation Modal */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02050f]/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#060b1c] border border-cyan-500/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Simulate Inbound Inquiry</h3>
              <button
                onClick={() => setShowSimulateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSimulateSubmit} className="space-y-3.5 text-xs">
              <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSimType('website')}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                    simType === 'website' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
                  }`}
                >
                  Website Lead
                </button>
                <button
                  type="button"
                  onClick={() => setSimType('social')}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                    simType === 'social' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
                  }`}
                >
                  Social Message
                </button>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Client / Sender Name</label>
                <input
                  type="text"
                  required
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  placeholder="e.g. David Vance"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Contact (Email, Phone, or Handle)</label>
                <input
                  type="text"
                  value={simContact}
                  onChange={(e) => setSimContact(e.target.value)}
                  placeholder="e.g. david@apexlogistics.io"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              {simType === 'website' ? (
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Intent Type</label>
                  <select
                    value={simIntent}
                    onChange={(e) => setSimIntent(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="automation">Enterprise Workflow Automation</option>
                    <option value="agent">Autonomous AI Customer Support</option>
                    <option value="website">Modern Web Platform</option>
                    <option value="voice">Inbound Voice AI Receptionist</option>
                    <option value="custom">Custom Intelligent System</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Social Platform</label>
                  <select
                    value={simPlatform}
                    onChange={(e) => setSimPlatform(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="instagram">Instagram Direct</option>
                    <option value="facebook">Facebook Messenger</option>
                    <option value="x">X / Twitter DM</option>
                    <option value="whatsapp">WhatsApp Business</option>
                    <option value="linkedin">LinkedIn InMail</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Message / Project Brief</label>
                <textarea
                  rows={3}
                  value={simMessage}
                  onChange={(e) => setSimMessage(e.target.value)}
                  placeholder="Tell CoreIQ what you need built..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                >
                  Send to CoreIQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
