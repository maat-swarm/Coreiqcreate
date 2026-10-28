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
  Bell,
  Download,
  CheckSquare,
  Square,
  AlertCircle
} from 'lucide-react';
import { LeadItem, SocialMessageItem, UnifiedInboxItem, LeadStatus } from '../../types/command';
import { CoreIQData } from '../../services/supabase';
import { CrmBridgeCard } from './CrmBridgeCard';

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
  const [filterNoContact, setFilterNoContact] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<UnifiedInboxItem | null>(null);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simType, setSimType] = useState<'website' | 'social'>('website');

  // Deletion modal & async feedback state
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    items: UnifiedInboxItem[];
  }>({ isOpen: false, items: [] });
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // New simulation form state
  const [simName, setSimName] = useState('');
  const [simContact, setSimContact] = useState('');
  const [simMessage, setSimMessage] = useState('');
  const [simPlatform, setSimPlatform] = useState('instagram');
  const [simIntent, setSimIntent] = useState('automation');

  const hasRealContact = (contact?: string | null): boolean => {
    if (!contact) return false;
    const trimmed = contact.trim();
    if (!trimmed) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+/;
    const phoneRegex = /(?:\+?\d[\d\s\-()]{6,}\d)/;
    return emailRegex.test(trimmed) || phoneRegex.test(trimmed);
  };

  // Merge unified items sorted by date descending
  const unifiedItems: UnifiedInboxItem[] = [
    ...leads.map((l) => ({ ...l, itemType: 'lead' as const })),
    ...socialMessages.map((s) => ({ ...s, itemType: 'social' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Count items with no real contact details
  const noContactCount = unifiedItems.filter((item) => {
    const contact = item.itemType === 'lead' ? item.client_contact : item.sender_contact;
    return !hasRealContact(contact);
  }).length;

  // Filter items
  const filteredItems = unifiedItems.filter((item) => {
    if (filterSource === 'website' && item.itemType !== 'lead') return false;
    if (filterSource === 'social' && item.itemType !== 'social') return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (filterNoContact) {
      const contact = item.itemType === 'lead' ? item.client_contact : item.sender_contact;
      if (hasRealContact(contact)) return false;
    }
    return true;
  });

  const allFilteredSelected =
    filteredItems.length > 0 && filteredItems.every((item) => selectedIds.has(item.id));

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((i) => i.id)));
    }
  };

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

  const handleToggleTestStatus = async (item: UnifiedInboxItem) => {
    const newStatus: LeadStatus = item.status === 'test' ? 'new' : 'test';
    if (item.itemType === 'lead') {
      await CoreIQData.updateLead(item.id, {
        status: newStatus,
        crm_skipped_reason: newStatus === 'test' ? 'test' : null,
      });
    } else {
      await CoreIQData.updateSocialStatus(item.id, newStatus);
    }
    onRefresh();
    if (selectedItem && selectedItem.id === item.id) {
      setSelectedItem({ ...selectedItem, status: newStatus });
    }
    setFeedbackBanner({
      type: 'success',
      message:
        newStatus === 'test'
          ? 'Marked as test lead (never syncs to CRM, excluded from analytics).'
          : 'Lead restored to active queue.',
    });
  };

  const executeDelete = async (itemsToDelete: UnifiedInboxItem[]) => {
    setIsDeleting(true);
    try {
      const leadIds = itemsToDelete.filter((i) => i.itemType === 'lead').map((i) => i.id);
      const socialIds = itemsToDelete.filter((i) => i.itemType === 'social').map((i) => i.id);

      let totalDeleted = 0;
      let errorMsg: string | undefined;

      if (leadIds.length > 0) {
        const res = await CoreIQData.deleteLeads(leadIds);
        totalDeleted += res.count;
        if (res.error) errorMsg = res.error;
      }

      if (socialIds.length > 0) {
        const res = await CoreIQData.deleteSocialMessages(socialIds);
        totalDeleted += res.count;
        if (res.error && !errorMsg) errorMsg = res.error;
      }

      if (errorMsg && totalDeleted === 0) {
        setFeedbackBanner({
          type: 'error',
          message: `Database error while deleting: ${errorMsg}`,
        });
      } else {
        setFeedbackBanner({
          type: 'success',
          message: `Deleted ${totalDeleted} record${totalDeleted === 1 ? '' : 's'} successfully.`,
        });
        setSelectedIds((prev) => {
          const next = new Set(prev);
          itemsToDelete.forEach((i) => next.delete(i.id));
          return next;
        });
        if (selectedItem && itemsToDelete.some((i) => i.id === selectedItem.id)) {
          setSelectedItem(null);
        }
        onRefresh();
      }
    } catch (err: any) {
      setFeedbackBanner({
        type: 'error',
        message: `Deletion failed: ${err?.message || err}`,
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmModal({ isOpen: false, items: [] });
    }
  };

  const handleExportItemsJson = (itemsToExport: UnifiedInboxItem[]) => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(itemsToExport, null, 2))}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `coreiq_inbox_backup_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const handleExportCsv = () => {
    const headers = ['ID', 'Type', 'Source', 'Client/Sender', 'Contact', 'Message', 'Summary', 'Status', 'Created At'];
    const rows = filteredItems.map((item) => {
      const isLead = item.itemType === 'lead';
      return [
        `"${item.id}"`,
        `"${item.itemType}"`,
        `"${item.source || ''}"`,
        `"${(isLead ? item.client_name : item.sender_name) || ''}"`,
        `"${(isLead ? item.client_contact : item.sender_contact) || ''}"`,
        `"${(isLead ? item.client_message || '' : item.message_text || '').replace(/"/g, '""')}"`,
        `"${(isLead ? item.conversation_summary || '' : '').replace(/"/g, '""')}"`,
        `"${item.status}"`,
        `"${item.created_at}"`,
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers.join(','), ...rows].join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `coreiq_inbox_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJson = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(filteredItems, null, 2))}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `coreiq_inbox_export_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

      {/* CRM Bridge Control Surface */}
      <CrmBridgeCard onRefreshParent={onRefresh} />

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
            <button
              onClick={() => setFilterStatus('test')}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                filterStatus === 'test' ? 'bg-amber-500/20 text-amber-300 font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Test</span>
            </button>
          </div>

          {/* Filter Chip: No contact details */}
          <button
            onClick={() => setFilterNoContact(!filterNoContact)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all min-h-[44px] ${
              filterNoContact
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
            title="Filter test chats and records with no email or phone"
          >
            <Filter className="w-3.5 h-3.5 text-rose-400" />
            <span>No contact details ({noContactCount})</span>
          </button>
        </div>

        {/* Action Buttons: Batch Actions, Export & Test Simulation */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Select all (filtered) */}
          <button
            onClick={handleToggleSelectAll}
            disabled={filteredItems.length === 0}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40 min-h-[44px] ${
              allFilteredSelected
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Select all currently filtered records"
          >
            {allFilteredSelected ? (
              <CheckSquare className="w-4 h-4 text-cyan-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>{allFilteredSelected ? 'Deselect all' : `Select all (${filteredItems.length})`}</span>
          </button>

          {/* Delete selected */}
          {selectedIds.size > 0 && (
            <button
              onClick={() => {
                const itemsToDelete = unifiedItems.filter((i) => selectedIds.has(i.id));
                setDeleteConfirmModal({ isOpen: true, items: itemsToDelete });
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-xs font-bold text-rose-300 hover:text-white flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(244,63,94,0.25)] min-h-[44px]"
              title="Delete selected records with confirmation"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Delete selected ({selectedIds.size})</span>
            </button>
          )}

          <button
            onClick={handleExportCsv}
            disabled={filteredItems.length === 0}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors disabled:opacity-40 min-h-[44px]"
            title="Export filtered inbox records as CSV"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJson}
            disabled={filteredItems.length === 0}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors disabled:opacity-40 min-h-[44px]"
            title="Export filtered inbox records as JSON"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={() => setShowSimulateModal(true)}
            className="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-xs font-semibold text-cyan-200 hover:text-white flex items-center gap-1.5 transition-colors min-h-[44px]"
            title="Create an inbound inquiry test record"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Test Inbound</span>
          </button>
        </div>
      </div>

      {/* Operation Feedback Banner */}
      {feedbackBanner && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-medium transition-all ${
            feedbackBanner.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{feedbackBanner.message}</span>
          </div>
          <button
            onClick={() => setFeedbackBanner(null)}
            className="p-1 hover:text-white text-slate-400 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Dismiss feedback notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden select-none active:scale-[0.99] flex items-start gap-3 ${
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

                  {/* Row Checkbox (44px touch target) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(item.id)) {
                          next.delete(item.id);
                        } else {
                          next.add(item.id);
                        }
                        return next;
                      });
                    }}
                    aria-label={`Select ${isLead ? item.client_name : item.sender_name}`}
                    className="p-2 -ml-1 text-slate-500 hover:text-cyan-300 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer flex-shrink-0 transition-colors"
                  >
                    {selectedIds.has(item.id) ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      {/* Source tag & Name */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {isLead ? (
                          <>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              <span>Website Lead</span>
                            </span>
                            {item.status === 'test' || (item as LeadItem).crm_skipped_reason === 'test' ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-slate-900 border border-slate-700 text-slate-400 flex items-center gap-1">
                                Test lead - not sent
                              </span>
                            ) : (item as LeadItem).crm_client_code ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                                CRM {(item as LeadItem).crm_client_code}
                              </span>
                            ) : (item as LeadItem).crm_synced_at ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                                CRM synced
                              </span>
                            ) : (item as LeadItem).crm_skipped_reason === 'no_consent' ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-900 border border-slate-700 text-slate-400 flex items-center gap-1">
                                not sent (no consent)
                              </span>
                            ) : (item as LeadItem).crm_skipped_reason === 'failed' || (item as LeadItem).crm_skipped_reason === 'crm_dead' ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center gap-1">
                                CRM failed
                              </span>
                            ) : !hasRealContact((item as LeadItem).client_contact) || (item as LeadItem).crm_skipped_reason === 'no_contact' ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-900 border border-slate-700 text-slate-400 flex items-center gap-1">
                                No contact - not sent
                              </span>
                            ) : (item as LeadItem).crm_skipped_reason ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-900 border border-slate-700 text-slate-400 flex items-center gap-1">
                                not sent ({(item as LeadItem).crm_skipped_reason})
                              </span>
                            ) : (item as LeadItem).session_id && hasRealContact((item as LeadItem).client_contact) ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1">
                                CRM pending
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-900 border border-slate-700 text-slate-400 flex items-center gap-1">
                                No contact - not sent
                              </span>
                            )}
                          </>
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
                      <span className="text-[11px] font-mono text-slate-500 flex-shrink-0">
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
                            item.status === 'test'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : item.status === 'new'
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
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold ${
                      selectedItem.itemType === 'lead'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                    }`}
                  >
                    {selectedItem.itemType === 'lead' ? 'WEBSITE LEAD' : `SOCIAL: ${selectedItem.source.toUpperCase()}`}
                  </span>
                  {selectedItem.itemType === 'lead' && (
                    selectedItem.status === 'test' || (selectedItem as LeadItem).crm_skipped_reason === 'test' ? (
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold bg-slate-900 border border-slate-700 text-slate-400">
                        Test lead - not sent
                      </span>
                    ) : (selectedItem as LeadItem).crm_client_code ? (
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                        CRM {(selectedItem as LeadItem).crm_client_code}
                      </span>
                    ) : (selectedItem as LeadItem).crm_synced_at ? (
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                        CRM synced
                      </span>
                    ) : (selectedItem as LeadItem).crm_skipped_reason === 'no_consent' ? (
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-mono bg-slate-900 border border-slate-700 text-slate-400">
                        not sent (no consent)
                      </span>
                    ) : (selectedItem as LeadItem).crm_skipped_reason === 'failed' || (selectedItem as LeadItem).crm_skipped_reason === 'crm_dead' ? (
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-mono bg-rose-500/20 border border-rose-500/40 text-rose-300">
                        CRM failed
                      </span>
                    ) : !hasRealContact((selectedItem as LeadItem).client_contact) || (selectedItem as LeadItem).crm_skipped_reason === 'no_contact' ? (
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-mono bg-slate-900 border border-slate-700 text-slate-400">
                        No contact - not sent
                      </span>
                    ) : (selectedItem as LeadItem).crm_skipped_reason ? (
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-mono bg-slate-900 border border-slate-700 text-slate-400">
                        not sent ({(selectedItem as LeadItem).crm_skipped_reason})
                      </span>
                    ) : (selectedItem as LeadItem).session_id && hasRealContact((selectedItem as LeadItem).client_contact) ? (
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-mono bg-amber-500/20 border border-amber-500/40 text-amber-300">
                        CRM pending
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-mono bg-slate-900 border border-slate-700 text-slate-400">
                        No contact - not sent
                      </span>
                    )
                  )}
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
                className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
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
                  className="bg-slate-900 border border-slate-700 text-xs text-white font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-400 min-h-[44px]"
                >
                  <option value="new">New</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                  <option value="test">Test</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleTestStatus(selectedItem)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all min-h-[44px] cursor-pointer ${
                    selectedItem.status === 'test'
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Test leads never sync to CRM and never count in analytics"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{selectedItem.status === 'test' ? 'Unmark Test' : 'Mark as Test'}</span>
                </button>

                <button
                  onClick={() => onConvertToTask(selectedItem)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(25,217,255,0.2)] min-h-[44px]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Convert to Task</span>
                </button>

                <button
                  onClick={() => setDeleteConfirmModal({ isOpen: true, items: [selectedItem] })}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                  title="Delete record"
                  aria-label="Delete record"
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

      {/* Confirmation & Export Delete Modal */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02050f]/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#060b1c] border border-rose-500/40 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Confirm Permanent Deletion</span>
              </h3>
              <button
                onClick={() => setDeleteConfirmModal({ isOpen: false, items: [] })}
                className="p-1 rounded-lg text-slate-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p>
                You are about to delete{' '}
                <span className="font-bold text-white font-mono">{deleteConfirmModal.items.length}</span>{' '}
                record{deleteConfirmModal.items.length === 1 ? '' : 's'} from the database.
              </p>
              <p className="text-rose-400/90 font-medium">
                Nothing is deleted automatically. This operation cannot be reversed once confirmed.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => handleExportItemsJson(deleteConfirmModal.items)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-center gap-1.5 transition-colors min-h-[44px] cursor-pointer"
                title="Download backup before deleting"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export JSON first</span>
              </button>
              <div className="flex-1 flex gap-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteConfirmModal({ isOpen: false, items: [] })}
                  className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-medium min-h-[44px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => executeDelete(deleteConfirmModal.items)}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 min-h-[44px] cursor-pointer shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                >
                  {isDeleting ? 'Deleting...' : `Delete ${deleteConfirmModal.items.length}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
