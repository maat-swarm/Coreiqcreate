import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Clock, 
  Trash2, 
  Calendar, 
  Link as LinkIcon, 
  CheckCircle2, 
  Circle, 
  AlertCircle,
  X,
  Edit2
} from 'lucide-react';
import { CommandTask, TaskStatus, LeadItem, CommandClient } from '../../types/command';
import { CoreIQData } from '../../services/supabase';

interface CommandTasksTabProps {
  tasks: CommandTask[];
  leads: LeadItem[];
  clients: CommandClient[];
  onRefresh: () => void;
}

export const CommandTasksTab: React.FC<CommandTasksTabProps> = ({
  tasks,
  leads,
  clients,
  onRefresh,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | TaskStatus>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<CommandTask | null>(null);

  // Form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('not_started');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [linkedLeadId, setLinkedLeadId] = useState('');
  const [linkedClientId, setLinkedClientId] = useState('');

  const openCreateModal = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskStatus('not_started');
    setTaskDueDate('');
    setLinkedLeadId('');
    setLinkedClientId('');
    setShowCreateModal(true);
  };

  const openEditModal = (task: CommandTask) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description);
    setTaskStatus(task.status);
    setTaskDueDate(task.due_date ? task.due_date.slice(0, 10) : '');
    setLinkedLeadId(task.linked_lead_id || '');
    setLinkedClientId(task.linked_client_id || '');
    setShowCreateModal(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    if (editingTask) {
      await CoreIQData.updateTaskStatus(editingTask.id, taskStatus);
      // Also update other fields in local table
      const allTasks = await CoreIQData.getTasks();
      const updated = allTasks.map((t) =>
        t.id === editingTask.id
          ? {
              ...t,
              title: taskTitle.trim(),
              description: taskDesc.trim(),
              status: taskStatus,
              due_date: taskDueDate || null,
              linked_lead_id: linkedLeadId || null,
              linked_client_id: linkedClientId || null,
            }
          : t
      );
      localStorage.setItem('coreiq_db_tasks', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('coreiq_table_tasks', { detail: updated }));
    } else {
      await CoreIQData.insertTask({
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        status: taskStatus,
        due_date: taskDueDate || null,
        linked_lead_id: linkedLeadId || null,
        linked_client_id: linkedClientId || null,
      });
    }

    setShowCreateModal(false);
    onRefresh();
  };

  const handleCycleStatus = async (task: CommandTask) => {
    const nextStatus: Record<TaskStatus, TaskStatus> = {
      not_started: 'in_progress',
      in_progress: 'done',
      done: 'not_started',
    };
    await CoreIQData.updateTaskStatus(task.id, nextStatus[task.status]);
    onRefresh();
  };

  const handleDeleteTask = async (id: string) => {
    await CoreIQData.deleteTask(id);
    onRefresh();
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === 'all') return true;
    return t.status === filterStatus;
  });

  const countNotStarted = tasks.filter((t) => t.status === 'not_started').length;
  const countInProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const countDone = tasks.filter((t) => t.status === 'done').length;

  return (
    <div className="space-y-4">
      {/* Top Controls & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#060b1c]/90 border border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterStatus === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({tasks.length})
            </button>
            <button
              onClick={() => setFilterStatus('not_started')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                filterStatus === 'not_started'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Circle className="w-3 h-3 text-slate-400" />
              <span>To Do ({countNotStarted})</span>
            </button>
            <button
              onClick={() => setFilterStatus('in_progress')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                filterStatus === 'in_progress'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3 h-3 text-amber-400" />
              <span>In Progress ({countInProgress})</span>
            </button>
            <button
              onClick={() => setFilterStatus('done')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                filterStatus === 'done'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Done ({countDone})</span>
            </button>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-transform active:scale-98 shadow-[0_0_15px_rgba(25,217,255,0.25)] min-h-[44px]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Operator Task</span>
        </button>
      </div>

      {/* Task List Grid */}
      {filteredTasks.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#060b1c]/60 border border-slate-800/80 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Tasks In This View</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Tasks can be created manually or generated directly from any inbound website lead or social message.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-2 px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold"
          >
            Create First Task
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredTasks.map((task) => {
            const linkedLead = leads.find((l) => l.id === task.linked_lead_id);
            const linkedClient = clients.find((c) => c.id === task.linked_client_id);

            return (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  task.status === 'done'
                    ? 'bg-[#060917]/70 border-slate-800/60 opacity-80'
                    : task.status === 'in_progress'
                    ? 'bg-[#070e28] border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.08)]'
                    : 'bg-[#060b1e] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2">
                  {/* Status badge & cycle clicker */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleCycleStatus(task)}
                      className={`text-[10px] font-semibold font-mono uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all ${
                        task.status === 'done'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : task.status === 'in_progress'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-cyan-400'
                      }`}
                      title="Tap to advance task state"
                    >
                      {task.status === 'done' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                      {task.status === 'in_progress' && <Clock className="w-3 h-3 text-amber-400" />}
                      {task.status === 'not_started' && <Circle className="w-3 h-3 text-slate-400" />}
                      <span>{task.status.replace('_', ' ')}</span>
                    </button>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(task)}
                        className="p-1.5 text-slate-500 hover:text-cyan-300 hover:bg-slate-900 rounded-lg transition-colors"
                        title="Edit task"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h4
                    className={`text-sm font-bold leading-snug ${
                      task.status === 'done' ? 'text-slate-400 line-through' : 'text-white'
                    }`}
                  >
                    {task.title}
                  </h4>

                  {task.description && (
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Footer metadata */}
                <div className="pt-2.5 border-t border-slate-800/80 space-y-1.5 text-[11px]">
                  {task.due_date && (
                    <div className="flex items-center gap-1.5 text-cyan-300">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Due: {new Date(task.due_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  )}

                  {linkedLead && (
                    <div className="flex items-center gap-1.5 text-violet-300 truncate">
                      <LinkIcon className="w-3 h-3 text-violet-400 shrink-0" />
                      <span className="truncate">Lead: {linkedLead.client_name}</span>
                    </div>
                  )}

                  {linkedClient && (
                    <div className="flex items-center gap-1.5 text-blue-300 truncate">
                      <LinkIcon className="w-3 h-3 text-blue-400 shrink-0" />
                      <span className="truncate">Client: {linkedClient.name}</span>
                    </div>
                  )}

                  <span className="text-[10px] font-mono text-slate-500 block">
                    Created {new Date(task.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Creation / Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02050f]/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#060b1c] border border-cyan-500/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingTask ? 'Edit Operator Task' : 'Create New Task'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Task Title *</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Implement custom CRM webhook integration"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Description</label>
                <textarea
                  rows={3}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Technical specifications, deliverable scope, or operator checklist..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Status</label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="not_started">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {leads.length > 0 && (
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Link to Website Lead (Optional)</label>
                  <select
                    value={linkedLeadId}
                    onChange={(e) => setLinkedLeadId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="">-- No linked lead --</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.client_name} ({l.intent_type || 'inquiry'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {clients.length > 0 && (
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Link to Client (Optional)</label>
                  <select
                    value={linkedClientId}
                    onChange={(e) => setLinkedClientId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="">-- No linked client --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.contact_email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                  {editingTask ? 'Update Task' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
