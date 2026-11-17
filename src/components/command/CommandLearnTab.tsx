import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  X,
  AlertTriangle,
  Eye,
  EyeOff,
  Check,
  Video,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { getAuthHeaders } from '../../services/mediaSlots';

const API_BASE = (import.meta as any).env?.VITE_API_URL ?? '';

const LEARN_CATEGORIES = [
  'AI Agents',
  'Automation',
  'Apps',
  'Websites',
  'Voice AI',
  'Integrations',
] as const;

export interface AdminLearnLesson {
  id: string;
  title: string;
  description: string;
  category: string;
  video_url: string | null;
  poster_url: string | null;
  pdf_url: string | null;
  pdf_label: string | null;
  published: boolean;
  sort_order: number;
  created_at?: string;
}

export const CommandLearnTab: React.FC = () => {
  const [lessons, setLessons] = useState<AdminLearnLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal & delete confirm state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<AdminLearnLesson | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<string>('AI Agents');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formPosterUrl, setFormPosterUrl] = useState('');
  const [formPdfUrl, setFormPdfUrl] = useState('');
  const [formPdfLabel, setFormPdfLabel] = useState('');
  const [formSortOrder, setFormSortOrder] = useState<number>(0);

  const notifyPublicLearnUpdated = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('coreiq_learn_updated'));
    }
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const loadLessons = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const headers = await getAuthHeaders(true);
      const res = await fetch(`${API_BASE}/api/v1/admin/learn/lessons`, { headers });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to load lessons');
      }

      const data = await res.json();
      setLessons(data.lessons || []);
    } catch (err: any) {
      setError(err.message || 'Error loading lessons');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLessons();
  }, []);

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormCategory('AI Agents');
    setFormVideoUrl('');
    setFormPosterUrl('');
    setFormPdfUrl('');
    setFormPdfLabel('');
    setFormSortOrder(0);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (lesson: AdminLearnLesson) => {
    setEditingLesson(lesson);
    setFormTitle(lesson.title);
    setFormDescription(lesson.description || '');
    setFormCategory(lesson.category || 'AI Agents');
    setFormVideoUrl(lesson.video_url || '');
    setFormPosterUrl(lesson.poster_url || '');
    setFormPdfUrl(lesson.pdf_url || '');
    setFormPdfLabel(lesson.pdf_label || '');
    setFormSortOrder(lesson.sort_order ?? 0);
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const headers = await getAuthHeaders(true);
      const res = await fetch(`${API_BASE}/api/v1/admin/learn/lessons`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDescription.trim(),
          category: formCategory,
          video_url: formVideoUrl.trim() || null,
          poster_url: formPosterUrl.trim() || null,
          pdf_url: formPdfUrl.trim() || null,
          pdf_label: formPdfLabel.trim() || null,
          sort_order: Number(formSortOrder) || 0,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create lesson');
      }

      setShowCreateModal(false);
      resetForm();
      triggerSuccess('New lesson created successfully');
      notifyPublicLearnUpdated();
      loadLessons();
    } catch (err: any) {
      setError(err.message || 'Error creating lesson');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson || !formTitle.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const headers = await getAuthHeaders(true);
      const res = await fetch(`${API_BASE}/api/v1/admin/learn/lessons/${editingLesson.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDescription.trim(),
          category: formCategory,
          video_url: formVideoUrl.trim() || null,
          poster_url: formPosterUrl.trim() || null,
          pdf_url: formPdfUrl.trim() || null,
          pdf_label: formPdfLabel.trim() || null,
          sort_order: Number(formSortOrder) || 0,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to update lesson');
      }

      const data = await res.json();
      setLessons((prev) =>
        prev.map((item) => (item.id === editingLesson.id ? data.lesson : item))
      );
      setEditingLesson(null);
      triggerSuccess(`"${formTitle.trim()}" updated successfully`);
      notifyPublicLearnUpdated();
    } catch (err: any) {
      setError(err.message || 'Error updating lesson');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublished = async (lesson: AdminLearnLesson) => {
    const nextPublished = !lesson.published;
    setLessons((prev) =>
      prev.map((item) => (item.id === lesson.id ? { ...item, published: nextPublished } : item))
    );

    try {
      const headers = await getAuthHeaders(true);
      const action = nextPublished ? 'publish' : 'unpublish';
      const res = await fetch(`${API_BASE}/api/v1/admin/learn/lessons/${lesson.id}/${action}`, {
        method: 'POST',
        headers,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to ${action} lesson`);
      }

      const data = await res.json();
      if (data.lesson) {
        setLessons((prev) =>
          prev.map((item) => (item.id === lesson.id ? data.lesson : item))
        );
      }
      triggerSuccess(`"${lesson.title}" is now ${nextPublished ? 'Published' : 'Draft'}`);
      notifyPublicLearnUpdated();
    } catch (err: any) {
      setLessons((prev) =>
        prev.map((item) => (item.id === lesson.id ? { ...item, published: lesson.published } : item))
      );
      setError(err.message || 'Failed to update lesson status');
    }
  };

  const handleDeleteLesson = async (id: string) => {
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch(`${API_BASE}/api/v1/admin/learn/lessons/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to delete lesson');
      }

      setLessons((prev) => prev.filter((item) => item.id !== id));
      setDeleteConfirmId(null);
      triggerSuccess('Lesson deleted');
      notifyPublicLearnUpdated();
    } catch (err: any) {
      setError(err.message || 'Error deleting lesson');
    }
  };

  const displayedLessons = lessons.filter(
    (l) => categoryFilter === 'all' || l.category === categoryFilter
  );

  const publishedCount = lessons.filter((l) => l.published).length;

  return (
    <div className="space-y-8 pb-16">
      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="p-1 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="p-1 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CATEGORY OVERVIEW */}
      <div className="rounded-2xl bg-[#070d1f]/80 border border-slate-800/80 p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">
              Learn Curriculum Overview
            </h3>
          </div>
          <button
            onClick={loadLessons}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh lessons"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {LEARN_CATEGORIES.map((cat) => {
            const catLessons = lessons.filter((l) => l.category === cat);
            const catPub = catLessons.filter((l) => l.published).length;
            return (
              <div
                key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                  categoryFilter === cat
                    ? 'bg-cyan-500/15 border-cyan-400 shadow-[0_0_15px_rgba(25,217,255,0.2)]'
                    : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-white truncate">{cat}</div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Total: {catLessons.length}</span>
                  <span className="text-cyan-400 font-semibold">Pub: {catPub}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* LEARN LESSONS MANAGER */}
      <div className="rounded-2xl bg-[#070d1f]/80 border border-slate-800/80 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
              <span>Learn Lessons Manager</span>
              <span className="text-xs font-mono font-normal text-slate-400">
                ({displayedLessons.length} records · {publishedCount} published)
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Create, order, and publish video lessons and PDF guides to the public /learn page.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-colors shadow-[0_0_15px_rgba(25,217,255,0.3)] cursor-pointer min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Lesson</span>
            </button>
          </div>
        </div>

        {/* Category filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-slate-800/60">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              categoryFilter === 'all'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Categories
          </button>
          {LEARN_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Lessons Table */}
        {isLoading ? (
          <div className="py-12 text-center text-xs font-mono text-slate-400">
            Loading lessons...
          </div>
        ) : displayedLessons.length === 0 ? (
          <div className="py-12 text-center rounded-xl border border-slate-800/70 bg-slate-900/30 space-y-2">
            <p className="text-sm font-medium text-slate-300">No lessons found</p>
            <p className="text-xs text-slate-500">
              Click &ldquo;Add Lesson&rdquo; to create your first video or PDF guide.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Title &amp; Description</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Assets</th>
                  <th className="py-3 px-3">Order</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {displayedLessons.map((lesson) => (
                  <tr key={lesson.id} className="hover:bg-slate-900/50 transition-colors">
                    {/* Title & snippet */}
                    <td className="py-3.5 px-3 max-w-xs">
                      <div className="font-bold text-white text-xs leading-snug truncate">
                        {lesson.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {lesson.description || 'No description'}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                        {lesson.category}
                      </span>
                    </td>

                    {/* Assets */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono">
                        {lesson.poster_url && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700" title="Poster configured">
                            <ImageIcon className="w-3 h-3 text-cyan-400" />
                            <span>Poster</span>
                          </span>
                        )}
                        {lesson.video_url && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30" title="Video configured">
                            <Video className="w-3 h-3 text-cyan-400" />
                            <span>Video</span>
                          </span>
                        )}
                        {lesson.pdf_url && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700" title={lesson.pdf_label || 'PDF Guide'}>
                            <FileText className="w-3 h-3 text-emerald-400" />
                            <span>{lesson.pdf_label || 'PDF'}</span>
                          </span>
                        )}
                        {!lesson.poster_url && !lesson.video_url && !lesson.pdf_url && (
                          <span className="text-slate-500">Text only</span>
                        )}
                      </div>
                    </td>

                    {/* Sort order */}
                    <td className="py-3.5 px-3 whitespace-nowrap font-mono text-slate-300">
                      #{lesson.sort_order ?? 0}
                    </td>

                    {/* Status toggle */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <button
                        onClick={() => handleTogglePublished(lesson)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                          lesson.published
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                            : 'bg-slate-800/90 text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                        title="Click to publish or unpublish"
                      >
                        {lesson.published ? (
                          <>
                            <Eye className="w-3 h-3 text-emerald-400" />
                            <span>Published</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 text-slate-500" />
                            <span>Draft</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3 whitespace-nowrap text-right space-x-1">
                      <button
                        onClick={() => openEditModal(lesson)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit lesson"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {deleteConfirmId === lesson.id ? (
                        <div className="inline-flex items-center gap-1 bg-red-950/80 px-2 py-1 rounded border border-red-800">
                          <span className="text-[10px] text-red-200 font-bold">Sure?</span>
                          <button
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="text-[10px] text-red-400 font-bold hover:underline cursor-pointer"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(lesson.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Delete lesson"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: CREATE LESSON */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-[#090f24] border border-slate-700 shadow-2xl p-6 sm:p-8 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-cyan-400" />
                <span>Add Learn Lesson</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLesson} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  >
                    {LEARN_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(parseInt(e.target.value || '0', 10))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Building Autonomous Customer Support Agents"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Short summary shown on the lesson card..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Video URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://youtube.com/... or /media/...mp4"
                    value={formVideoUrl}
                    onChange={(e) => setFormVideoUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Poster URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://... or /media/..."
                    value={formPosterUrl}
                    onChange={(e) => setFormPosterUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    PDF URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://... or /downloads/guide.pdf"
                    value={formPdfUrl}
                    onChange={(e) => setFormPdfUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    PDF Button Label
                  </label>
                  <input
                    type="text"
                    placeholder="Download Guide"
                    value={formPdfLabel}
                    onChange={(e) => setFormPdfLabel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-slate-950 transition-colors shadow-[0_0_15px_rgba(25,217,255,0.3)]"
                >
                  {isSaving ? 'Creating...' : 'Create Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT LESSON */}
      {editingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-[#090f24] border border-slate-700 shadow-2xl p-6 sm:p-8 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-400" />
                <span>Edit Lesson: {editingLesson.title}</span>
              </h3>
              <button
                onClick={() => setEditingLesson(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateLesson} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  >
                    {LEARN_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(parseInt(e.target.value || '0', 10))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Video URL
                  </label>
                  <input
                    type="text"
                    value={formVideoUrl}
                    onChange={(e) => setFormVideoUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Poster URL
                  </label>
                  <input
                    type="text"
                    value={formPosterUrl}
                    onChange={(e) => setFormPosterUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    PDF URL
                  </label>
                  <input
                    type="text"
                    value={formPdfUrl}
                    onChange={(e) => setFormPdfUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    PDF Button Label
                  </label>
                  <input
                    type="text"
                    value={formPdfLabel}
                    onChange={(e) => setFormPdfLabel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingLesson(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-slate-950 transition-colors shadow-[0_0_15px_rgba(25,217,255,0.3)]"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
