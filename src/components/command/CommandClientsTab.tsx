import React, { useState } from 'react';
import { 
  Users, 
  Mail, 
  Phone, 
  Plus, 
  Download, 
  FileSpreadsheet, 
  Link as LinkIcon, 
  CheckSquare, 
  Globe, 
  X, 
  Search,
  UserCheck
} from 'lucide-react';
import { CommandClient, LeadItem, CommandTask } from '../../types/command';
import { CoreIQData } from '../../services/supabase';

interface CommandClientsTabProps {
  clients: CommandClient[];
  leads: LeadItem[];
  tasks: CommandTask[];
  onRefresh: () => void;
}

export const CommandClientsTab: React.FC<CommandClientsTabProps> = ({
  clients,
  leads,
  tasks,
  onRefresh,
}) => {
  const [viewMode, setViewMode] = useState<'directory' | 'mailing_list'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<CommandClient | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Client Form
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientNotes, setClientNotes] = useState('');

  // Generate unified mailing list by merging client records and all captured lead contacts
  const mailingListMap = new Map<string, { email: string; name: string; source: string; date: string }>();

  // Add from clients table
  clients.forEach((c) => {
    if (c.contact_email && c.contact_email.includes('@')) {
      const em = c.contact_email.trim().toLowerCase();
      mailingListMap.set(em, {
        email: c.contact_email.trim(),
        name: c.name,
        source: 'Client Record',
        date: c.created_at,
      });
    }
  });

  // Add from leads table
  leads.forEach((l) => {
    if (l.client_contact && l.client_contact.includes('@')) {
      const em = l.client_contact.trim().toLowerCase();
      if (!mailingListMap.has(em)) {
        mailingListMap.set(em, {
          email: l.client_contact.trim(),
          name: l.client_name,
          source: 'Website Lead',
          date: l.created_at,
        });
      }
    }
  });

  const mailingList = Array.from(mailingListMap.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientEmail.trim()) return;

    await CoreIQData.insertClient({
      name: clientName.trim(),
      contact_email: clientEmail.trim(),
      contact_phone: clientPhone.trim() || null,
      notes: clientNotes.trim() || '',
    });

    setShowCreateModal(false);
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setClientNotes('');
    onRefresh();
  };

  const handleExportCSV = () => {
    if (mailingList.length === 0) return;

    const headers = ['Name', 'Email', 'Source', 'Date Captured'];
    const rows = mailingList.map((item) => [
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.email.replace(/"/g, '""')}"`,
      `"${item.source.replace(/"/g, '""')}"`,
      `"${new Date(item.date).toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `coreiq_client_mailing_list_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contact_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.contact_phone && c.contact_phone.includes(searchQuery))
  );

  return (
    <div className="space-y-4">
      
      {/* Top Header & Sub-view Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#060b1c]/90 border border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs">
            <button
              onClick={() => setViewMode('directory')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'directory'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Client Directory ({clients.length})</span>
            </button>
            <button
              onClick={() => setViewMode('mailing_list')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'mailing_list'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Mailing List ({mailingList.length})</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'mailing_list' ? (
            <button
              onClick={handleExportCSV}
              disabled={mailingList.length === 0}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)] disabled:opacity-50 min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              <span>Export Mailing List CSV</span>
            </button>
          ) : (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-98 shadow-[0_0_15px_rgba(25,217,255,0.25)] min-h-[44px]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>New Client Record</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: CLIENT DIRECTORY */}
      {viewMode === 'directory' && (
        <div className="space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients by name, email, or phone..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {filteredClients.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#060b1c]/60 border border-slate-800/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">No Client Records</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Maintain formal client accounts separate from individual website leads.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-2 px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold"
              >
                Add Client
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredClients.map((client) => {
                // Find all linked leads and tasks for this client
                const linkedLeads = leads.filter(
                  (l) => l.client_id === client.id || (client.contact_email && l.client_contact === client.contact_email)
                );
                const linkedTasks = tasks.filter((t) => t.linked_client_id === client.id);

                return (
                  <div
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className="p-4 rounded-2xl border border-slate-800 bg-[#060b1e] hover:border-cyan-500/40 transition-all cursor-pointer space-y-3 select-none"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-bold text-white truncate">{client.name}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-mono">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate">{client.contact_email}</span>
                        </div>
                        {client.contact_phone && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                            <Phone className="w-3 h-3 shrink-0" />
                            <span>{client.contact_phone}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
                        {new Date(client.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {client.notes && (
                      <p className="text-xs text-slate-400 line-clamp-2 italic">
                        "{client.notes}"
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3 text-cyan-400" />
                        <span>{linkedLeads.length} Leads</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckSquare className="w-3 h-3 text-amber-400" />
                        <span>{linkedTasks.length} Tasks</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: DEDICATED CLIENT MAILING LIST */}
      {viewMode === 'mailing_list' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#060b1c] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Client & Lead Email Directory</span>
              </h3>
              <p className="text-xs text-slate-400">
                Continuous running list of all unique client emails captured across all website inquiries and client records.
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-cyan-300">
              {mailingList.length} unique contacts
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Contact Name</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Origin Source</th>
                  <th className="py-3 px-4">Captured Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-[#040817]/60">
                {mailingList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No email addresses captured yet.
                    </td>
                  </tr>
                ) : (
                  mailingList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-white">{item.name}</td>
                      <td className="py-3 px-4 font-mono text-cyan-300">{item.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                          {item.source}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {new Date(item.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selected Client Modal / Inspect Sheet */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02050f]/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#060b1c] border border-cyan-500/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">Client Profile</span>
                <h3 className="text-lg font-bold text-white">{selectedClient.name}</h3>
                <p className="text-xs text-slate-400">{selectedClient.contact_email}</p>
                {selectedClient.contact_phone && (
                  <p className="text-xs text-slate-400">{selectedClient.contact_phone}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedClient.notes && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
                <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1">Operator Notes</span>
                <p>{selectedClient.notes}</p>
              </div>
            )}

            {/* Linked Website Leads */}
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Associated Website Leads & Inquiries
              </span>
              {leads.filter(
                (l) => l.client_id === selectedClient.id || l.client_contact === selectedClient.contact_email
              ).length === 0 ? (
                <p className="text-xs text-slate-500 italic">No associated leads recorded.</p>
              ) : (
                leads
                  .filter((l) => l.client_id === selectedClient.id || l.client_contact === selectedClient.contact_email)
                  .map((lead) => (
                    <div key={lead.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{lead.intent_type || 'Website Inquiry'}</span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-400 line-clamp-2">{lead.client_message || lead.conversation_summary}</p>
                    </div>
                  ))
              )}
            </div>

            {/* Linked Tasks */}
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Associated Execution Tasks
              </span>
              {tasks.filter((t) => t.linked_client_id === selectedClient.id).length === 0 ? (
                <p className="text-xs text-slate-500 italic">No associated tasks recorded.</p>
              ) : (
                tasks
                  .filter((t) => t.linked_client_id === selectedClient.id)
                  .map((task) => (
                    <div key={task.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                      <div>
                        <h5 className="font-semibold text-white">{task.title}</h5>
                        <p className="text-slate-400 text-[11px]">{task.description}</p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300">
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedClient(null)}
                className="w-full py-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Client Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02050f]/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#060b1c] border border-cyan-500/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Create Client Account</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Client Name *</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Apex Logistics / Sarah Chen"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Contact Email *</label>
                <input
                  type="email"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="sarah@apexlogistics.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Contact Phone (Optional)</label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+1 (555) 349-2910"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Notes & Account Scope</label>
                <textarea
                  rows={3}
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder="Business context, contracted deliverables, or special instructions..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
