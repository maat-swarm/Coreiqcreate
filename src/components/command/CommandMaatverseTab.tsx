import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  BookOpen,
  Film,
  Music,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  Upload,
  RefreshCw,
  FolderOpen,
  Eye,
  Layers,
  ChevronRight,
  X,
  FileText,
} from 'lucide-react';
import {
  fetchAdminMaatverseSections,
  createAdminMaatverseSection,
  updateAdminMaatverseSection,
  deleteAdminMaatverseSection,
  fetchAdminMaatverseEntries,
  createAdminMaatverseEntry,
  updateAdminMaatverseEntry,
  deleteAdminMaatverseEntry,
  deleteAllMockMaatverse,
  uploadMaatverseImage,
} from '../../services/maatverseAdmin';
import { MaatverseSectionItem, MaatverseEntryItem } from '../../types/command';

export const CommandMaatverseTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'sections' | 'entries'>('sections');
  const [sections, setSections] = useState<MaatverseSectionItem[]>([]);
  const [entries, setEntries] = useState<MaatverseEntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Section Filtering for Entries
  const [selectedSectionSlug, setSelectedSectionSlug] = useState<string>('all');

  // Section Modal State
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<MaatverseSectionItem | null>(null);
  const [sectionForm, setSectionForm] = useState({
    title: '',
    slug: '',
    description: '',
    cover_url: '',
    sort_order: 10,
    status: 'live' as 'opening_soon' | 'live',
  });
  const [uploadingSectionImage, setUploadingSectionImage] = useState(false);
  const sectionFileInputRef = useRef<HTMLInputElement | null>(null);

  // Entry Modal State
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MaatverseEntryItem | null>(null);
  const [entryForm, setEntryForm] = useState({
    section_id: '',
    section_slug: '',
    title: '',
    slug: '',
    subtitle: '',
    body: '',
    media_type: 'text' as 'text' | 'image' | 'comic' | 'audio' | 'video',
    media_url: '',
    sort_order: 10,
    featured: false,
    status: 'published' as 'draft' | 'published',
  });
  const [uploadingEntryMedia, setUploadingEntryMedia] = useState(false);
  const entryFileInputRef = useRef<HTMLInputElement | null>(null);

  // Deletion confirm states
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeletingMock, setIsDeletingMock] = useState(false);

  // Flash notice helper
  const flashSuccess = (msg: string) => {
    setSuccessNotice(msg);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [secData, entData] = await Promise.all([
        fetchAdminMaatverseSections(),
        fetchAdminMaatverseEntries(),
      ]);
      setSections(secData);
      setEntries(entData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load Ma\'atverse records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Section form handlers
  const openNewSectionModal = () => {
    setEditingSection(null);
    setSectionForm({
      title: '',
      slug: '',
      description: '',
      cover_url: '',
      sort_order: (sections.length + 1) * 10,
      status: 'live',
    });
    setIsSectionModalOpen(true);
  };

  const openEditSectionModal = (sec: MaatverseSectionItem) => {
    setEditingSection(sec);
    setSectionForm({
      title: sec.title,
      slug: sec.slug,
      description: sec.description || sec.blurb || '',
      cover_url: sec.cover_url || sec.image_url || '',
      sort_order: sec.sort_order,
      status: sec.status,
    });
    setIsSectionModalOpen(true);
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionForm.title.trim()) {
      setError('Section title is required');
      return;
    }

    try {
      setLoading(true);
      const slug =
        sectionForm.slug.trim() ||
        sectionForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      if (editingSection) {
        await updateAdminMaatverseSection(editingSection.id, {
          title: sectionForm.title.trim(),
          slug,
          blurb: sectionForm.description.trim(),
          description: sectionForm.description.trim(),
          image_url: sectionForm.cover_url.trim() || null,
          cover_url: sectionForm.cover_url.trim() || null,
          sort_order: Number(sectionForm.sort_order),
          status: sectionForm.status,
        });
        flashSuccess(`Updated section "${sectionForm.title}"`);
      } else {
        await createAdminMaatverseSection({
          title: sectionForm.title.trim(),
          slug,
          blurb: sectionForm.description.trim(),
          description: sectionForm.description.trim(),
          image_url: sectionForm.cover_url.trim() || null,
          cover_url: sectionForm.cover_url.trim() || null,
          sort_order: Number(sectionForm.sort_order),
          status: sectionForm.status,
          is_mock: false,
        });
        flashSuccess(`Created section "${sectionForm.title}"`);
      }
      setIsSectionModalOpen(false);
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to save section');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this section and all associated entries?')) return;
    try {
      setLoading(true);
      await deleteAdminMaatverseSection(id);
      flashSuccess('Deleted section and associated entries');
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete section');
    } finally {
      setLoading(false);
    }
  };

  // Entry form handlers
  const openNewEntryModal = () => {
    setEditingEntry(null);
    const defaultSec = sections.length > 0 ? sections[0] : null;
    setEntryForm({
      section_id: defaultSec?.id || '',
      section_slug: defaultSec?.slug || '',
      title: '',
      slug: '',
      subtitle: '',
      body: '',
      media_type: 'text',
      media_url: '',
      sort_order: 10,
      featured: false,
      status: 'published',
    });
    setIsEntryModalOpen(true);
  };

  const openEditEntryModal = (ent: MaatverseEntryItem) => {
    setEditingEntry(ent);
    const mediaType = (ent.media_type || (ent.kind === 'entry' ? 'text' : ent.kind) || 'text') as any;
    setEntryForm({
      section_id: ent.section_id || '',
      section_slug: ent.section_slug,
      title: ent.title,
      slug: ent.slug,
      subtitle: ent.subtitle || ent.summary || '',
      body: ent.body || ent.body_md || '',
      media_type: mediaType,
      media_url: ent.media_url || ent.image_url || ent.external_url || '',
      sort_order: ent.sort_order,
      featured: Boolean(ent.featured),
      status: ent.status,
    });
    setIsEntryModalOpen(true);
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryForm.title.trim()) {
      setError('Entry title is required');
      return;
    }
    if (!entryForm.section_id && !entryForm.section_slug) {
      setError('Please select a target section');
      return;
    }

    try {
      setLoading(true);
      const targetSec = sections.find((s) => s.id === entryForm.section_id || s.slug === entryForm.section_slug);
      const section_slug = targetSec ? targetSec.slug : entryForm.section_slug;
      const slug =
        entryForm.slug.trim() ||
        entryForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const kindVal: any = entryForm.media_type === 'text' ? 'entry' : entryForm.media_type;

      if (editingEntry) {
        await updateAdminMaatverseEntry(editingEntry.id, {
          section_id: entryForm.section_id || targetSec?.id,
          section_slug,
          kind: kindVal,
          media_type: entryForm.media_type,
          title: entryForm.title.trim(),
          slug,
          summary: entryForm.subtitle.trim() || entryForm.title.trim(),
          subtitle: entryForm.subtitle.trim() || null,
          body_md: entryForm.body.trim(),
          body: entryForm.body.trim(),
          image_url: entryForm.media_url.trim() || null,
          media_url: entryForm.media_url.trim() || null,
          sort_order: Number(entryForm.sort_order),
          featured: Boolean(entryForm.featured),
          status: entryForm.status,
        });
        flashSuccess(`Updated entry "${entryForm.title}"`);
      } else {
        await createAdminMaatverseEntry({
          section_id: entryForm.section_id || targetSec?.id,
          section_slug,
          kind: kindVal,
          media_type: entryForm.media_type,
          title: entryForm.title.trim(),
          slug,
          summary: entryForm.subtitle.trim() || entryForm.title.trim(),
          subtitle: entryForm.subtitle.trim() || null,
          body_md: entryForm.body.trim(),
          body: entryForm.body.trim(),
          image_url: entryForm.media_url.trim() || null,
          media_url: entryForm.media_url.trim() || null,
          sort_order: Number(entryForm.sort_order),
          featured: Boolean(entryForm.featured),
          status: entryForm.status,
          is_mock: false,
        });
        flashSuccess(`Created entry "${entryForm.title}"`);
      }
      setIsEntryModalOpen(false);
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to save entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    try {
      setLoading(true);
      await deleteAdminMaatverseEntry(id);
      flashSuccess('Deleted entry');
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete entry');
    } finally {
      setLoading(false);
    }
  };

  // Delete all mock content
  const handleDeleteAllMocks = async () => {
    if (!confirm('Permanently delete all mock sections and mock lore entries?')) return;
    try {
      setIsDeletingMock(true);
      const res = await deleteAllMockMaatverse();
      flashSuccess(`Deleted ${res.deleted_sections} mock sections and ${res.deleted_entries} mock entries.`);
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete mock content');
    } finally {
      setIsDeletingMock(false);
    }
  };

  // Section Image Upload
  const handleSectionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingSectionImage(true);
      const res = await uploadMaatverseImage(file);
      setSectionForm((prev) => ({ ...prev, cover_url: res.image_url }));
      flashSuccess('Cover image uploaded successfully');
    } catch (err: any) {
      setError(err?.message || 'Image upload failed');
    } finally {
      setUploadingSectionImage(false);
    }
  };

  // Entry Media Upload
  const handleEntryMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingEntryMedia(true);
      const res = await uploadMaatverseImage(file);
      setEntryForm((prev) => ({ ...prev, media_url: res.image_url }));
      flashSuccess('Media asset uploaded successfully');
    } catch (err: any) {
      setError(err?.message || 'Upload failed');
    } finally {
      setUploadingEntryMedia(false);
    }
  };

  // Filtered entries
  const filteredEntries =
    selectedSectionSlug === 'all'
      ? entries
      : entries.filter((e) => e.section_slug === selectedSectionSlug);

  const mockCount =
    sections.filter((s) => s.is_mock).length + entries.filter((e) => e.is_mock).length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-red-200 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button onClick={() => setSuccessNotice(null)} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0d1430] to-[#080d22] border border-blue-900/40 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#C9A24B]/15 text-[#C9A24B] border border-[#C9A24B]/30">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">Ma'atverse Content Engine</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Author lore archives, builder profiles, comics, skins, and cosmic chapters directly for the public universe.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {mockCount > 0 && (
            <button
              onClick={handleDeleteAllMocks}
              disabled={isDeletingMock}
              className="px-3.5 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-2 transition-colors min-h-[44px]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete all mock ({mockCount})</span>
            </button>
          )}

          <button
            onClick={loadAll}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors min-h-[44px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {activeSubTab === 'sections' ? (
            <button
              onClick={openNewSectionModal}
              className="px-4 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#d8b056] text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg min-h-[44px]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Section / Door</span>
            </button>
          ) : (
            <button
              onClick={openNewEntryModal}
              className="px-4 py-2 rounded-xl bg-[#C9A24B] hover:bg-[#d8b056] text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg min-h-[44px]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Lore Entry</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-tab Switcher & Counter Badges */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('sections')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all min-h-[44px] ${
              activeSubTab === 'sections'
                ? 'bg-[#C9A24B]/20 text-[#C9A24B] border border-[#C9A24B]/50'
                : 'text-slate-400 hover:text-white bg-slate-900/60 border border-transparent'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Sections / Doors ({sections.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('entries')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all min-h-[44px] ${
              activeSubTab === 'entries'
                ? 'bg-[#C9A24B]/20 text-[#C9A24B] border border-[#C9A24B]/50'
                : 'text-slate-400 hover:text-white bg-slate-900/60 border border-transparent'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Lore Entries ({entries.length})</span>
          </button>
        </div>

        {activeSubTab === 'entries' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">Filter by Section:</span>
            <select
              value={selectedSectionSlug}
              onChange={(e) => setSelectedSectionSlug(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-[#C9A24B] min-h-[40px]"
            >
              <option value="all">All Sections ({entries.length})</option>
              {sections.map((s) => (
                <option key={s.id} value={s.slug}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* SUB-TAB 1: SECTIONS LIST */}
      {activeSubTab === 'sections' && (
        <div className="space-y-4">
          {sections.length === 0 && !loading ? (
            <div className="p-12 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 text-center space-y-3">
              <FolderOpen className="w-10 h-10 text-slate-500 mx-auto" />
              <p className="text-slate-400 text-sm">No sections defined yet.</p>
              <button
                onClick={openNewSectionModal}
                className="px-4 py-2 rounded-xl bg-[#C9A24B] text-slate-950 font-bold text-xs"
              >
                Create First Door
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sections.map((sec) => (
                <div
                  key={sec.id}
                  className="rounded-2xl bg-[#090e21] border border-slate-800 p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/40 text-blue-300">
                        /{sec.slug}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {sec.is_mock && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/60 border border-purple-700/40 text-purple-300 font-bold">
                            MOCK
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            sec.status === 'live'
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                              : 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                          }`}
                        >
                          {sec.status === 'live' ? 'LIVE' : 'OPENING SOON'}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-amber-200 transition-colors">
                      {sec.title}
                    </h3>

                    {(sec.description || sec.blurb) && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {sec.description || sec.blurb}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">
                      Sort: {sec.sort_order} &bull; {sec.entry_count || 0} entries
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditSectionModal(sec)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                        title="Edit Section"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSection(sec.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                        title="Delete Section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: ENTRIES LIST */}
      {activeSubTab === 'entries' && (
        <div className="space-y-4">
          {filteredEntries.length === 0 && !loading ? (
            <div className="p-12 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-slate-500 mx-auto" />
              <p className="text-slate-400 text-sm">No entries found for this selection.</p>
              <button
                onClick={openNewEntryModal}
                className="px-4 py-2 rounded-xl bg-[#C9A24B] text-slate-950 font-bold text-xs"
              >
                Create New Entry
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#090e21] border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-mono uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5 pl-5">Entry Title</th>
                      <th className="p-3.5">Section</th>
                      <th className="p-3.5">Type</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Featured</th>
                      <th className="p-3.5">Order</th>
                      <th className="p-3.5 pr-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {filteredEntries.map((ent) => (
                      <tr key={ent.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 pl-5">
                          <div className="font-semibold text-white flex items-center gap-2">
                            <span>{ent.title}</span>
                            {ent.is_mock && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950/80 border border-purple-700/50 text-purple-300">
                                MOCK
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-slate-400">/{ent.slug}</span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-300">
                          {ent.section_title || ent.section_slug}
                        </td>
                        <td className="p-3.5 font-mono text-[#C9A24B] uppercase">
                          {ent.media_type || ent.kind}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              ent.status === 'published'
                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                                : 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                            }`}
                          >
                            {ent.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {ent.featured ? (
                            <span className="text-cyan-400 font-mono font-bold text-[11px] flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Yes
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono text-[11px]">No</span>
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-slate-400">{ent.sort_order}</td>
                        <td className="p-3.5 pr-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditEntryModal(ent)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                              title="Edit Entry"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEntry(ent.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                              title="Delete Entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION MODAL */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0a0f24] border border-blue-900/60 shadow-2xl overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-[#C9A24B]" />
                {editingSection ? 'Edit Section / Door' : 'New Section / Door'}
              </h3>
              <button
                onClick={() => setIsSectionModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSection} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Lore, The Builders, Comics"
                  value={sectionForm.title}
                  onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-[#C9A24B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Slug (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. the-lore"
                    value={sectionForm.slug}
                    onChange={(e) => setSectionForm({ ...sectionForm, slug: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Sort Order</label>
                  <input
                    type="number"
                    value={sectionForm.sort_order}
                    onChange={(e) => setSectionForm({ ...sectionForm, sort_order: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Description</label>
                <textarea
                  rows={2}
                  placeholder="Short description for portal door and section header..."
                  value={sectionForm.description}
                  onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-[#C9A24B]"
                />
              </div>

              {/* Cover Image Upload / URL */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Cover Image (URL or Upload)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="https://... or upload"
                    value={sectionForm.cover_url}
                    onChange={(e) => setSectionForm({ ...sectionForm, cover_url: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-[#C9A24B]"
                  />
                  <input
                    type="file"
                    ref={sectionFileInputRef}
                    onChange={handleSectionImageUpload}
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => sectionFileInputRef.current?.click()}
                    disabled={uploadingSectionImage}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-medium flex items-center gap-1.5 shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingSectionImage ? 'Uploading...' : 'Upload'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Status</label>
                <select
                  value={sectionForm.status}
                  onChange={(e) => setSectionForm({ ...sectionForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-[#C9A24B]"
                >
                  <option value="live">Live (Portal Open on site)</option>
                  <option value="opening_soon">Opening Soon (Inert Door)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSectionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-[#C9A24B] text-slate-950 font-bold hover:bg-[#d8b056] transition-colors shadow-lg"
                >
                  {loading ? 'Saving...' : editingSection ? 'Save Changes' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ENTRY MODAL */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0a0f24] border border-blue-900/60 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#C9A24B]" />
                {editingEntry ? 'Edit Lore Entry' : 'New Lore Entry'}
              </h3>
              <button
                onClick={() => setIsEntryModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Target Section *</label>
                  <select
                    required
                    value={entryForm.section_id}
                    onChange={(e) => {
                      const sec = sections.find((s) => s.id === e.target.value);
                      setEntryForm({
                        ...entryForm,
                        section_id: e.target.value,
                        section_slug: sec?.slug || '',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-[#C9A24B]"
                  >
                    <option value="">Select Section</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} (/{s.slug})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Media Type</label>
                  <select
                    value={entryForm.media_type}
                    onChange={(e) => setEntryForm({ ...entryForm, media_type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-[#C9A24B]"
                  >
                    <option value="text">Text / Chapter</option>
                    <option value="image">Image Asset</option>
                    <option value="comic">Comic Strip / Panel</option>
                    <option value="audio">Audio / Soundtrack</option>
                    <option value="video">Video Archive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Origin of the First Sentinel"
                  value={entryForm.title}
                  onChange={(e) => setEntryForm({ ...entryForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-[#C9A24B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Slug (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. origin-first-sentinel"
                    value={entryForm.slug}
                    onChange={(e) => setEntryForm({ ...entryForm, slug: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Sort Order</label>
                  <input
                    type="number"
                    value={entryForm.sort_order}
                    onChange={(e) => setEntryForm({ ...entryForm, sort_order: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Subtitle / Summary</label>
                <input
                  type="text"
                  placeholder="A short hook for the entry..."
                  value={entryForm.subtitle}
                  onChange={(e) => setEntryForm({ ...entryForm, subtitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-[#C9A24B]"
                />
              </div>

              {/* Media URL / Upload */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Media Asset (Image / Video URL or Upload)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="https://... or upload file"
                    value={entryForm.media_url}
                    onChange={(e) => setEntryForm({ ...entryForm, media_url: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-[#C9A24B]"
                  />
                  <input
                    type="file"
                    ref={entryFileInputRef}
                    onChange={handleEntryMediaUpload}
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => entryFileInputRef.current?.click()}
                    disabled={uploadingEntryMedia}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-medium flex items-center gap-1.5 shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingEntryMedia ? 'Uploading...' : 'Upload'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Body Content (Markdown / Text) *</label>
                <textarea
                  rows={6}
                  required
                  placeholder="Inscribe the narrative lore, instructions, chapter details..."
                  value={entryForm.body}
                  onChange={(e) => setEntryForm({ ...entryForm, body: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-[#C9A24B] font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center pt-1">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Publish Status</label>
                  <select
                    value={entryForm.status}
                    onChange={(e) => setEntryForm({ ...entryForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-[#C9A24B]"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <div className="pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={entryForm.featured}
                      onChange={(e) => setEntryForm({ ...entryForm, featured: e.target.checked })}
                      className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700 focus:ring-0"
                    />
                    <span className="text-slate-300 font-semibold">Featured on Section Front</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-[#C9A24B] text-slate-950 font-bold hover:bg-[#d8b056] transition-colors shadow-lg"
                >
                  {loading ? 'Saving...' : editingEntry ? 'Save Changes' : 'Create Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
