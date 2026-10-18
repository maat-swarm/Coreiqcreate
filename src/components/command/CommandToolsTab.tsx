import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Wrench,
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Download,
  Image as ImageIcon,
  Sparkles,
  Layers,
  ArrowRight,
  UploadCloud,
  X,
  Eye,
  EyeOff,
  Star
} from 'lucide-react';
import {
  AdminSiteTool,
  CreateSiteToolPayload,
  UpdateSiteToolPayload,
  fetchAdminSiteTools,
  createAdminSiteTool,
  updateAdminSiteTool,
  deleteAdminSiteTool,
  uploadSiteToolImage
} from '../../services/siteToolsAdmin';
import { TOOL_CATEGORIES } from '../../data/toolsData';

interface CommandToolsTabProps {
  tools?: any;
  onRefresh?: () => void;
}

export const CommandToolsTab: React.FC<CommandToolsTabProps> = () => {
  const [toolsList, setToolsList] = useState<AdminSiteTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingTool, setEditingTool] = useState<AdminSiteTool | null>(null);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Writing');
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formTier, setFormTier] = useState<'free' | 'pro'>('free');
  const [formOrigin, setFormOrigin] = useState<'coreiq' | 'opensource'>('coreiq');

  const [formLaunchType, setFormLaunchType] = useState<'link' | 'download' | 'payment' | 'inline' | 'coming_soon'>('coming_soon');
  const [formLaunchUrl, setFormLaunchUrl] = useState('');
  const [formCtaLabel, setFormCtaLabel] = useState('Open');

  const [formImageUrl, setFormImageUrl] = useState('');
  const [formImagePath, setFormImagePath] = useState('');
  const [formFeatured, setFormFeatured] = useState(false);
  const [formSortOrder, setFormSortOrder] = useState<number>(100);
  const [formStatus, setFormStatus] = useState<'draft' | 'published'>('draft');

  // Image Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Fetch from server
  const loadTools = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await fetchAdminSiteTools();
      // Sort: featured desc, sort_order asc, created_at asc to match display order
      const sorted = [...data].sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
      setToolsList(sorted);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load tools from database.');
      setToolsList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTools();
  }, [loadTools]);

  const openCreateModal = () => {
    setEditingTool(null);
    setActiveStep(1);
    setFormName('');
    setFormSlug('');
    setFormTagline('');
    setFormDescription('');
    setFormCategory('Writing');
    setFormCustomCategory('');
    setFormTier('free');
    setFormOrigin('coreiq');
    setFormLaunchType('coming_soon');
    setFormLaunchUrl('');
    setFormCtaLabel('Open');
    setFormImageUrl('');
    setFormImagePath('');
    setFormFeatured(false);
    setFormSortOrder(toolsList.length ? (toolsList.length + 1) * 10 : 10);
    setFormStatus('draft');
    setModalError(null);
    setShowModal(true);
  };

  const openEditModal = (tool: AdminSiteTool) => {
    setEditingTool(tool);
    setActiveStep(1);
    setFormName(tool.name);
    setFormSlug(tool.slug);
    setFormTagline(tool.tagline || '');
    setFormDescription(tool.description || '');
    setFormCategory(tool.category || 'Writing');
    setFormCustomCategory('');
    setFormTier(tool.tier);
    setFormOrigin(tool.origin);
    setFormLaunchType(tool.launch_type);
    setFormLaunchUrl(tool.launch_url || '');
    setFormCtaLabel(tool.cta_label || 'Open');
    setFormImageUrl(tool.image_url || '');
    setFormImagePath(tool.image_path || '');
    setFormFeatured(Boolean(tool.featured));
    setFormSortOrder(tool.sort_order);
    setFormStatus(tool.status);
    setModalError(null);
    setShowModal(true);
  };

  // Auto-slugify on name change when creating
  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingTool) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormSlug(generated);
    }
  };

  // Image Upload handler
  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setModalError('Image file exceeds the 2 MB limit.');
      return;
    }

    try {
      setIsUploadingImage(true);
      setModalError(null);
      const res = await uploadSiteToolImage(file);
      setFormImageUrl(res.image_url);
      setFormImagePath(res.image_path);
    } catch (err: any) {
      setModalError(err?.message || 'Failed to upload image.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Save tool (Create or Update)
  const handleSaveTool = async () => {
    setModalError(null);

    // Validation checks
    if (!formName.trim() || formName.trim().length < 2 || formName.trim().length > 80) {
      setModalError('Name must be between 2 and 80 characters.');
      setActiveStep(1);
      return;
    }

    if (!editingTool && (!formSlug.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formSlug.trim()))) {
      setModalError('Valid slug is required (lowercase letters, numbers, and hyphens).');
      setActiveStep(1);
      return;
    }

    const finalCategory = formCategory === '__custom' ? formCustomCategory.trim() : formCategory;
    if (!finalCategory) {
      setModalError('Category is required.');
      setActiveStep(1);
      return;
    }

    // Stripe validation
    if (formLaunchType === 'payment' && formLaunchUrl.toLowerCase().includes('stripe.com')) {
      setModalError('Stripe is not permitted. Please use PayPal, Square, or Wise.');
      setActiveStep(2);
      return;
    }

    // URL requirement check
    if ((formLaunchType === 'link' || formLaunchType === 'download') && formStatus === 'published' && !formLaunchUrl.trim()) {
      setModalError(`A URL is required when launch type is "${formLaunchType}" and status is published.`);
      setActiveStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTool) {
        const payload: UpdateSiteToolPayload = {
          name: formName.trim(),
          tagline: formTagline.trim(),
          description: formDescription.trim(),
          category: finalCategory,
          tier: formTier,
          origin: formOrigin,
          launch_type: formLaunchType,
          launch_url: formLaunchUrl.trim() || null,
          cta_label: formCtaLabel.trim() || 'Open',
          image_url: formImageUrl.trim() || null,
          image_path: formImagePath.trim() || null,
          featured: formFeatured,
          sort_order: Number(formSortOrder) || 100,
          status: formStatus,
        };
        await updateAdminSiteTool(editingTool.id, payload);
        setActionSuccess(`Updated tool "${formName}".`);
      } else {
        const payload: CreateSiteToolPayload = {
          name: formName.trim(),
          slug: formSlug.trim(),
          tagline: formTagline.trim(),
          description: formDescription.trim(),
          category: finalCategory,
          tier: formTier,
          origin: formOrigin,
          launch_type: formLaunchType,
          launch_url: formLaunchUrl.trim() || null,
          cta_label: formCtaLabel.trim() || 'Open',
          image_url: formImageUrl.trim() || null,
          image_path: formImagePath.trim() || null,
          featured: formFeatured,
          sort_order: Number(formSortOrder) || 100,
          status: formStatus,
        };
        await createAdminSiteTool(payload);
        setActionSuccess(`Created tool "${formName}".`);
      }

      setShowModal(false);
      await loadTools();
    } catch (err: any) {
      setModalError(err?.message || 'Database write failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Publish/Unpublish
  const handleTogglePublish = async (tool: AdminSiteTool) => {
    try {
      const nextStatus = tool.status === 'published' ? 'draft' : 'published';
      await updateAdminSiteTool(tool.id, { status: nextStatus });
      setActionSuccess(`Tool "${tool.name}" is now ${nextStatus}.`);
      await loadTools();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update tool status.');
    }
  };

  // Delete tool with confirm
  const handleDelete = async (tool: AdminSiteTool) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${tool.name}"?`)) {
      return;
    }
    try {
      await deleteAdminSiteTool(tool.id);
      setActionSuccess(`Deleted tool "${tool.name}".`);
      await loadTools();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to delete tool.');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Top Banner Notice */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-[#071330] to-slate-900 border border-cyan-500/20 shadow-[0_0_30px_rgba(25,217,255,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#19d9ff] animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-cyan-300 font-bold uppercase">
              TOOLS CATALOGUE MANAGEMENT
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white font-display">
            Public Tools Registry
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Banner, mascot and the Tools page background are changed in Media Slots, Tools page. The Ma'atverse page background is under Media Slots, Ma'atverse. Provider keys are never entered here.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadTools}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-cyan-300 text-xs font-mono font-semibold flex items-center gap-2 border border-slate-700 transition-colors min-h-[44px]"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-98 shadow-[0_0_15px_rgba(25,217,255,0.25)] min-h-[44px]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Tool</span>
          </button>
        </div>
      </div>

      {/* Action Notifications */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="p-1 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="p-1 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* List Content */}
      {loading ? (
        <div className="p-12 rounded-2xl bg-[#060b1c]/80 border border-slate-800 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
        </div>
      ) : toolsList.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#060b1c]/60 border border-slate-800/80 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No tools yet.</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            The public page is showing starter placeholders. Once you add and publish your first tool, the public page will show your custom tools exclusively.
          </p>
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2 transition-transform active:scale-98 min-h-[44px]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create Your First Tool</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-2 font-mono">
            <span>TOTAL TOOLS: {toolsList.length}</span>
            <span className="text-cyan-400">First 3 tools feed &ldquo;Start here&rdquo;</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {toolsList.map((tool, idx) => {
              const isStartHere = idx < 3;

              return (
                <div
                  key={tool.id}
                  className="p-4 rounded-2xl bg-[#060b1e] border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-16 h-12 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {tool.image_url ? (
                        <img src={tool.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Wrench className="w-5 h-5 text-slate-600" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-white truncate">{tool.name}</h4>
                        <span className="text-[10px] font-mono text-slate-500">/{tool.slug}</span>
                        {isStartHere && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide"
                            style={{
                              background: 'rgba(201, 162, 75, 0.15)',
                              color: '#C9A24B',
                              border: '1px solid rgba(201, 162, 75, 0.35)',
                            }}
                          >
                            Start here ({idx + 1})
                          </span>
                        )}
                        {tool.featured && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            <span>Featured</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 truncate max-w-md">
                        {tool.tagline || tool.description || 'No tagline configured.'}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-500 pt-0.5">
                        <span className="text-cyan-400/80">{tool.category}</span>
                        <span>Order: {tool.sort_order}</span>
                        <span>Type: {tool.launch_type}</span>
                        {tool.launch_url && (
                          <span className="text-slate-400 truncate max-w-[200px]" title={tool.launch_url}>
                            {tool.launch_url}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Badges & Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/60">
                    <div className="flex items-center gap-2">
                      {/* Tier Badge */}
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase ${
                          tool.tier === 'pro'
                            ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                            : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        {tool.tier}
                      </span>

                      {/* Status Badge */}
                      <button
                        onClick={() => handleTogglePublish(tool)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px] ${
                          tool.status === 'published'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                        }`}
                        title="Click to toggle published status"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            tool.status === 'published'
                              ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]'
                              : 'bg-slate-500'
                          }`}
                        />
                        <span>{tool.status}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(tool)}
                        className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-slate-900 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Edit tool"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tool)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Delete tool"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stepped Modal (Basics -> Launch -> Image & Publish) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02050f]/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-lg bg-[#060b1c] border border-cyan-500/30 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xl my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {editingTool ? `Edit Tool: ${editingTool.name}` : 'Create New Tool'}
                </h3>
                <p className="text-xs text-slate-400">Step {activeStep} of 3</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Pills */}
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className={`py-1.5 px-2 rounded-lg text-center font-semibold transition-colors ${
                  activeStep === 1
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                1. Basics
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className={`py-1.5 px-2 rounded-lg text-center font-semibold transition-colors ${
                  activeStep === 2
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                2. Launch
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className={`py-1.5 px-2 rounded-lg text-center font-semibold transition-colors ${
                  activeStep === 3
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                3. Media & Publish
              </button>
            </div>

            {/* Modal Error */}
            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{modalError}</span>
              </div>
            )}

            {/* STEP 1: BASICS */}
            {activeStep === 1 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tool Name *</label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Prompt Enhancer"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 text-xs min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Slug (URL identifier) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingTool)}
                    maxLength={60}
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value.toLowerCase())}
                    placeholder="e.g. prompt-enhancer"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 text-xs font-mono disabled:opacity-50 min-h-[44px]"
                  />
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">
                    {editingTool ? 'Slug cannot be modified once created.' : 'Auto-generated from name. Lowercase letters, numbers, and hyphens.'}
                  </p>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tagline (Max 120 chars)</label>
                  <input
                    type="text"
                    maxLength={120}
                    value={formTagline}
                    onChange={(e) => setFormTagline(e.target.value)}
                    placeholder="Short punchy summary..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 text-xs min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Description (Max 400 chars)</label>
                  <textarea
                    rows={3}
                    maxLength={400}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Detailed explanation of tool output and parameters..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 text-xs leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 text-xs min-h-[44px]"
                    >
                      {TOOL_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="__custom">+ Custom Category</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Tier</label>
                    <select
                      value={formTier}
                      onChange={(e) => setFormTier(e.target.value as 'free' | 'pro')}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 text-xs min-h-[44px]"
                    >
                      <option value="free">FREE</option>
                      <option value="pro">PRO</option>
                    </select>
                  </div>
                </div>

                {formCategory === '__custom' && (
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Custom Category Name</label>
                    <input
                      type="text"
                      maxLength={40}
                      value={formCustomCategory}
                      onChange={(e) => setFormCustomCategory(e.target.value)}
                      placeholder="e.g. Finance"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 text-xs min-h-[44px]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Origin</label>
                  <div className="flex items-center gap-4 pt-1">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="origin"
                        value="coreiq"
                        checked={formOrigin === 'coreiq'}
                        onChange={() => setFormOrigin('coreiq')}
                        className="text-cyan-500 focus:ring-cyan-400"
                      />
                      <span className="text-slate-300">CoreIQ Native</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="origin"
                        value="opensource"
                        checked={formOrigin === 'opensource'}
                        onChange={() => setFormOrigin('opensource')}
                        className="text-cyan-500 focus:ring-cyan-400"
                      />
                      <span className="text-slate-300">Open Source (OSS)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: LAUNCH */}
            {activeStep === 2 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Launch Type</label>
                  <div className="space-y-2">
                    {[
                      { type: 'link', label: 'Opens a link', desc: 'Navigates to an internal route (e.g. /tools) or opens an external https:// URL' },
                      { type: 'download', label: 'Downloads a file', desc: 'Triggers direct download of a checklist, prompt pack or script' },
                      { type: 'payment', label: 'Goes to a payment page', desc: 'Redirects to PayPal, Square, or Wise payment page' },
                      { type: 'inline', label: 'Runs inside CoreIQ (next build)', desc: 'Interactive utility widget running in Phase 2' },
                      { type: 'coming_soon', label: 'Coming soon, no button', desc: 'Renders disabled "Coming soon" pill, no action' },
                    ].map((item) => (
                      <label
                        key={item.type}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          formLaunchType === item.type
                            ? 'bg-cyan-500/10 border-cyan-500/40'
                            : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900'
                        }`}
                      >
                        <input
                          type="radio"
                          name="launchType"
                          value={item.type}
                          checked={formLaunchType === item.type}
                          onChange={() => setFormLaunchType(item.type as any)}
                          className="mt-0.5 text-cyan-500 focus:ring-cyan-400"
                        />
                        <div>
                          <p className="font-semibold text-white">{item.label}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {formLaunchType !== 'coming_soon' && formLaunchType !== 'inline' && (
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Launch Destination URL {formStatus === 'published' && '(Required)'}
                    </label>
                    <input
                      type="text"
                      value={formLaunchUrl}
                      onChange={(e) => setFormLaunchUrl(e.target.value)}
                      placeholder={
                        formLaunchType === 'payment'
                          ? 'https://paypal.me/coreiq or https://wise.com/pay/coreiq'
                          : formLaunchType === 'download'
                          ? '/downloads/my-tool.pdf or https://...'
                          : '/use-cases or https://example.com'
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 text-xs font-mono min-h-[44px]"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      {formLaunchType === 'payment'
                        ? 'PayPal, Square, or Wise only. Stripe is strictly prohibited.'
                        : 'Must start with a single "/" for internal pages or "https://" for external.'}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">CTA Button Label</label>
                  <input
                    type="text"
                    maxLength={24}
                    value={formCtaLabel}
                    onChange={(e) => setFormCtaLabel(e.target.value)}
                    placeholder="e.g. Open, Download, Try Now"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 text-xs min-h-[44px]"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: MEDIA & PUBLISH */}
            {activeStep === 3 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Tool Card Image (Recommended: 800x500 WebP/PNG/JPG, max 2MB)
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleImageFile}
                  />

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={isUploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors min-h-[44px]"
                    >
                      <UploadCloud className="w-4 h-4 text-cyan-400" />
                      <span>{isUploadingImage ? 'Uploading...' : 'Choose Image File'}</span>
                    </button>

                    {formImageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormImageUrl('');
                          setFormImagePath('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-xs text-rose-400 hover:underline min-h-[44px] flex items-center"
                      >
                        Remove Image
                      </button>
                    )}
                  </div>

                  {formImageUrl && (
                    <div className="mt-3 w-40 aspect-video rounded-xl border border-slate-700 overflow-hidden bg-slate-950">
                      <img src={formImageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="mt-2">
                    <label className="block text-slate-500 font-mono text-[11px] mb-1">
                      Or direct image URL (/media/... or https://)
                    </label>
                    <input
                      type="text"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="/media/tools/tool-cover.webp"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 text-xs font-mono min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Sort Order (0-9999)</label>
                    <input
                      type="number"
                      min={0}
                      max={9999}
                      value={formSortOrder}
                      onChange={(e) => setFormSortOrder(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 text-xs min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Publication Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as 'draft' | 'published')}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 text-xs min-h-[44px]"
                    >
                      <option value="draft">Draft (Hidden)</option>
                      <option value="published">Published (Live)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <input
                      type="checkbox"
                      checked={formFeatured}
                      onChange={(e) => setFormFeatured(e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400"
                    />
                    <div>
                      <span className="text-white font-semibold">Featured Tool</span>
                      <p className="text-[11px] text-slate-400">
                        Featured tools take priority in the &ldquo;Start here&rdquo; row and search results.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Modal Footer Controls */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <div>
                {activeStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setActiveStep((prev) => (prev - 1) as any)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold min-h-[44px]"
                  >
                    Back
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-semibold min-h-[44px]"
                >
                  Cancel
                </button>

                {activeStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setActiveStep((prev) => (prev + 1) as any)}
                    className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs min-h-[44px]"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSaveTool}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-98 min-h-[44px]"
                  >
                    {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
                    <span>{editingTool ? 'Save Changes' : 'Create Tool'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
