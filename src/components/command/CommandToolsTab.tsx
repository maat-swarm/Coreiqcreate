import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Wrench,
  Plus,
  Trash2,
  Edit2,
  Copy,
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
  Star,
  FileText,
  DollarSign,
  ClipboardList,
  Link as LinkIcon,
  Clock,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import {
  AdminSiteTool,
  CreateSiteToolPayload,
  UpdateSiteToolPayload,
  fetchAdminSiteTools,
  createAdminSiteTool,
  updateAdminSiteTool,
  deleteAdminSiteTool,
  duplicateAdminSiteTool,
  deleteAllMockSiteTools,
  uploadSiteToolImage,
  uploadSiteToolFile,
  fetchToolSubmissions,
  updateToolSubmission,
  deleteToolSubmission,
  uploadSubmissionDeliverable,
  getSubmissionShareableLink,
} from '../../services/siteToolsAdmin';
import { TOOL_CATEGORIES } from '../../data/toolsData';
import { ToolFormField, ToolSubmissionItem } from '../../types/command';

interface CommandToolsTabProps {
  tools?: any;
  onRefresh?: () => void;
}

export const CommandToolsTab: React.FC<CommandToolsTabProps> = () => {
  const [activeView, setActiveView] = useState<'tools' | 'submissions'>('tools');
  const [toolsList, setToolsList] = useState<AdminSiteTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Submissions State
  const [submissions, setSubmissions] = useState<ToolSubmissionItem[]>([]);
  const [submissionFilterStatus, setSubmissionFilterStatus] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<ToolSubmissionItem | null>(null);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submissionActionMsg, setSubmissionActionMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const deliverableInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingDeliverable, setIsUploadingDeliverable] = useState(false);

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
  const [formTier, setFormTier] = useState<'free' | 'pro'>('free');
  const [formOrigin, setFormOrigin] = useState<'coreiq' | 'opensource'>('coreiq');

  // Paid Tool
  const [formIsPaid, setFormIsPaid] = useState(false);
  const [formPriceAmount, setFormPriceAmount] = useState<string>('');
  const [formPriceCurrency, setFormPriceCurrency] = useState('USD');

  // Launch Type
  const [formLaunchType, setFormLaunchType] = useState<'link' | 'download' | 'payment' | 'in_app' | 'coming_soon'>('coming_soon');
  const [formLaunchUrl, setFormLaunchUrl] = useState('');
  const [formPaymentUrl, setFormPaymentUrl] = useState('');
  const [formDownloadPath, setFormDownloadPath] = useState('');
  const [formCtaLabel, setFormCtaLabel] = useState('Open');
  const [formSchema, setFormSchema] = useState<ToolFormField[]>([]);

  // Step 3
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formImagePath, setFormImagePath] = useState('');
  const [formFeatured, setFormFeatured] = useState(false);
  const [formSortOrder, setFormSortOrder] = useState<number>(100);
  const [formStatus, setFormStatus] = useState<'draft' | 'published'>('draft');

  // File Upload Refs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const toolFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingToolFile, setIsUploadingToolFile] = useState(false);

  // Load tools
  const loadTools = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await fetchAdminSiteTools();
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

  // Load submissions
  const loadSubmissions = useCallback(async () => {
    try {
      setLoadingSubmissions(true);
      const data = await fetchToolSubmissions(undefined, submissionFilterStatus);
      setSubmissions(data);
    } catch (err: any) {
      console.warn('Failed to load submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  }, [submissionFilterStatus]);

  useEffect(() => {
    loadTools();
  }, [loadTools]);

  useEffect(() => {
    if (activeView === 'submissions') {
      loadSubmissions();
    }
  }, [activeView, loadSubmissions]);

  const openCreateModal = () => {
    setEditingTool(null);
    setActiveStep(1);
    setFormName('');
    setFormSlug('');
    setFormTagline('');
    setFormDescription('');
    setFormCategory('Writing');
    setFormTier('free');
    setFormOrigin('coreiq');
    setFormIsPaid(false);
    setFormPriceAmount('');
    setFormPriceCurrency('USD');
    setFormLaunchType('coming_soon');
    setFormLaunchUrl('');
    setFormPaymentUrl('');
    setFormDownloadPath('');
    setFormCtaLabel('Open');
    setFormSchema([]);
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
    setFormTier(tool.tier);
    setFormOrigin(tool.origin);
    setFormIsPaid(Boolean(tool.is_paid));
    setFormPriceAmount(tool.price_amount !== null && tool.price_amount !== undefined ? String(tool.price_amount) : '');
    setFormPriceCurrency(tool.price_currency || 'USD');
    setFormLaunchType(tool.launch_type === 'inline' ? 'in_app' : tool.launch_type);
    setFormLaunchUrl(tool.launch_url || '');
    setFormPaymentUrl(tool.payment_url || '');
    setFormDownloadPath(tool.download_path || '');
    setFormCtaLabel(tool.cta_label || 'Open');
    setFormSchema(Array.isArray(tool.form_schema) ? tool.form_schema : []);
    setFormImageUrl(tool.image_url || '');
    setFormImagePath(tool.image_path || '');
    setFormFeatured(Boolean(tool.featured));
    setFormSortOrder(tool.sort_order);
    setFormStatus(tool.status);
    setModalError(null);
    setShowModal(true);
  };

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

  const handleDuplicate = async (tool: AdminSiteTool) => {
    try {
      setLoading(true);
      await duplicateAdminSiteTool(tool.id);
      setActionSuccess(`Duplicated "${tool.name}" successfully.`);
      await loadTools();
    } catch (err: any) {
      setErrorMessage(err.message || 'Duplicate failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tool: AdminSiteTool) => {
    if (!window.confirm(`Are you sure you want to delete tool "${tool.name}"?`)) return;
    try {
      setLoading(true);
      await deleteAdminSiteTool(tool.id);
      setActionSuccess(`Deleted "${tool.name}".`);
      await loadTools();
    } catch (err: any) {
      setErrorMessage(err.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllMocks = async () => {
    if (!window.confirm('Delete all MOCK tools? This cannot be undone.')) return;
    try {
      setLoading(true);
      const res = await deleteAllMockSiteTools();
      setActionSuccess(`Deleted ${res.deleted} mock tools.`);
      await loadTools();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete mock tools.');
    } finally {
      setLoading(false);
    }
  };

  // Image Upload
  const handleImageFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setModalError('Image exceeds the 5 MB limit.');
      return;
    }

    try {
      setIsUploadingImage(true);
      setModalError(null);
      const res = await uploadSiteToolImage(file);
      setFormImageUrl(res.image_url);
      setFormImagePath(res.image_path);
    } catch (err: any) {
      setModalError(err.message || 'Image upload failed');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Tool Download File Upload
  const handleToolFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingToolFile(true);
      setModalError(null);
      const res = await uploadSiteToolFile(file);
      setFormDownloadPath(res.file_path);
    } catch (err: any) {
      setModalError(err.message || 'File upload failed');
    } finally {
      setIsUploadingToolFile(false);
    }
  };

  // Form builder helpers
  const addFormField = () => {
    const newField: ToolFormField = {
      label: 'New Field',
      key: `field_${Date.now()}`,
      type: 'text',
      required: false,
      options: [],
    };
    setFormSchema([...formSchema, newField]);
  };

  const updateFormField = (idx: number, updates: Partial<ToolFormField>) => {
    const updated = [...formSchema];
    updated[idx] = { ...updated[idx], ...updates };
    setFormSchema(updated);
  };

  const removeFormField = (idx: number) => {
    setFormSchema(formSchema.filter((_, i) => i !== idx));
  };

  // Save wizard tool
  const handleSaveTool = async () => {
    if (!formName.trim() || formName.trim().length < 2) {
      setActiveStep(1);
      setModalError('Tool name must be at least 2 characters.');
      return;
    }
    if (!formSlug.trim()) {
      setActiveStep(1);
      setModalError('Slug is required.');
      return;
    }

    const payload: CreateSiteToolPayload = {
      name: formName.trim(),
      slug: formSlug.trim().toLowerCase(),
      tagline: formTagline.trim(),
      description: formDescription.trim(),
      category: formCategory.trim(),
      tier: formTier,
      origin: formOrigin,
      is_paid: formIsPaid,
      price_amount: formIsPaid && formPriceAmount ? Number(formPriceAmount) : null,
      price_currency: formPriceCurrency,
      launch_type: formLaunchType,
      launch_url: formLaunchUrl.trim() || null,
      payment_url: formPaymentUrl.trim() || null,
      download_path: formDownloadPath.trim() || null,
      cta_label: formCtaLabel.trim() || 'Open',
      form_schema: formSchema,
      image_url: formImageUrl.trim() || null,
      image_path: formImagePath.trim() || null,
      featured: formFeatured,
      sort_order: Number(formSortOrder) || 100,
      status: formStatus,
    };

    try {
      setIsSubmitting(true);
      setModalError(null);

      if (editingTool) {
        await updateAdminSiteTool(editingTool.id, payload);
        setActionSuccess(`Updated tool "${formName}".`);
      } else {
        await createAdminSiteTool(payload);
        setActionSuccess(`Created tool "${formName}".`);
      }

      setShowModal(false);
      await loadTools();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save tool.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submissions Actions
  const handleUpdateSubmissionStatus = async (subId: string, status: ToolSubmissionItem['status'], notes?: string) => {
    try {
      setSubmissionActionMsg('Updating...');
      await updateToolSubmission(subId, { status, operator_notes: notes });
      setSubmissionActionMsg('Saved!');
      await loadSubmissions();
      if (selectedSubmission && selectedSubmission.id === subId) {
        setSelectedSubmission((prev) => (prev ? { ...prev, status, operator_notes: notes || prev.operator_notes } : null));
      }
      setTimeout(() => setSubmissionActionMsg(null), 2500);
    } catch (err: any) {
      setSubmissionActionMsg(err.message || 'Update failed');
    }
  };

  const handleUploadDeliverable = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedSubmission) return;
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingDeliverable(true);
      setSubmissionActionMsg('Uploading deliverable...');
      const res = await uploadSubmissionDeliverable(selectedSubmission.id, file);
      setSubmissionActionMsg('Deliverable uploaded & status set to delivered!');
      setSelectedSubmission((prev) => (prev ? { ...prev, status: 'delivered', signed_deliverable_url: res.signed_url } : null));
      await loadSubmissions();
      setTimeout(() => setSubmissionActionMsg(null), 3000);
    } catch (err: any) {
      setSubmissionActionMsg(err.message || 'Deliverable upload failed');
    } finally {
      setIsUploadingDeliverable(false);
    }
  };

  const handleCopyClientLink = async (subId: string) => {
    try {
      const res = await getSubmissionShareableLink(subId);
      await navigator.clipboard.writeText(res.signed_url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to generate link');
    }
  };

  const handleDeleteSubmission = async (subId: string) => {
    if (!window.confirm('Delete this submission and its uploaded files?')) return;
    try {
      await deleteToolSubmission(subId);
      setSelectedSubmission(null);
      await loadSubmissions();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  const totalNewSubmissions = toolsList.reduce((acc, t) => acc + (t.new_submissions_count || 0), 0);

  return (
    <div className="w-full space-y-6">
      {/* Top Header & Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-display flex items-center gap-2.5">
            <Wrench className="w-6 h-6 text-cyan-400" />
            <span>Tools Engine & Operations</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Publish utilities, build interactive schemas, monetize with payment links, and fulfill submissions.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sub-view toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setActiveView('tools')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'tools'
                  ? 'bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tools Catalog ({toolsList.length})
            </button>
            <button
              onClick={() => setActiveView('submissions')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeView === 'submissions'
                  ? 'bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Submissions</span>
              {totalNewSubmissions > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-cyan-400 text-slate-950 font-bold">
                  {totalNewSubmissions}
                </span>
              )}
            </button>
          </div>

          {activeView === 'tools' && (
            <>
              <button
                onClick={handleDeleteAllMocks}
                className="px-3 py-2 rounded-xl border border-rose-500/30 hover:border-rose-500/60 text-rose-300 hover:bg-rose-500/10 text-xs font-semibold transition-all"
                title="Delete all seed mock tools"
              >
                Delete all mock tools
              </button>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all min-h-[40px]"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Tool</span>
              </button>
            </>
          )}

          <button
            onClick={() => {
              if (activeView === 'tools') loadTools();
              else loadSubmissions();
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* VIEW 1: TOOLS CATALOG */}
      {activeView === 'tools' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm animate-pulse">
              Loading tools catalog...
            </div>
          ) : toolsList.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <Wrench className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-base font-semibold text-slate-300">No tools configured yet.</p>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 rounded-xl bg-cyan-400 text-slate-950 font-bold text-xs"
              >
                Create your first tool
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {toolsList.map((tool) => (
                <div
                  key={tool.id}
                  className="rounded-2xl bg-[#070b1a] border border-slate-800/80 p-5 flex flex-col justify-between space-y-4 hover:border-cyan-500/30 transition-all shadow-md"
                >
                  <div className="space-y-3">
                    {/* Top Row: Badges */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-bold">
                        {tool.category}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {tool.is_mock && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                            MOCK
                          </span>
                        )}
                        {tool.is_paid ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                            {tool.price_amount ? `$${tool.price_amount} ${tool.price_currency}` : 'PAID'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            FREE
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            tool.tier === 'pro'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {tool.tier.toUpperCase()}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            tool.status === 'published'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}
                        >
                          {tool.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Title & Tagline */}
                    <div>
                      <h3 className="text-base font-bold text-white font-display flex items-center justify-between">
                        <span>{tool.name}</span>
                        {tool.featured && <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />}
                      </h3>
                      <p className="text-xs font-mono text-slate-500">/{tool.slug}</p>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {tool.tagline || tool.description}
                      </p>
                    </div>

                    {/* Launch Mode info */}
                    <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/80">
                      <span>Type: <strong className="text-white">{tool.launch_type}</strong></span>
                      {tool.launch_type === 'in_app' && (
                        <span>{tool.form_schema?.length || 0} fields</span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bottom Bar */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    {/* Submissions count badge */}
                    <button
                      onClick={() => {
                        setActiveView('submissions');
                        setSubmissionFilterStatus('new');
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] font-mono text-slate-300 border border-slate-800 transition-colors"
                      title="View submissions"
                    >
                      <ClipboardList className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Submissions:</span>
                      <strong className={tool.new_submissions_count ? 'text-cyan-400' : 'text-slate-500'}>
                        {tool.new_submissions_count || 0} new
                      </strong>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(tool)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Edit tool"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(tool)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Duplicate tool"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(tool)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                        title="Delete tool"
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

      {/* VIEW 2: SUBMISSIONS */}
      {activeView === 'submissions' && (
        <div className="space-y-4">
          {/* Status Filter Tabs */}
          <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {['all', 'new', 'in_progress', 'awaiting_payment', 'paid', 'delivered', 'cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSubmissionFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                    submissionFilterStatus === st
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
            <span className="text-xs font-mono text-slate-500">
              {submissions.length} submission{submissions.length === 1 ? '' : 's'}
            </span>
          </div>

          {loadingSubmissions ? (
            <div className="p-12 text-center text-slate-400 text-sm animate-pulse">
              Loading submissions...
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <ClipboardList className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">No submissions found in this status.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSubmission(sub)}
                  className="p-4 rounded-xl bg-[#070b1a] border border-slate-800 hover:border-cyan-500/30 cursor-pointer transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{sub.client_name}</span>
                      <span className="text-xs text-slate-400">&lt;{sub.client_email}&gt;</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-800">
                        {sub.tool_slug}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-3">
                      <span>Submitted: {new Date(sub.created_at).toLocaleString()}</span>
                      {sub.file_paths?.length > 0 && (
                        <span>Files: {sub.file_paths.length} attached</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold capitalize ${
                        sub.status === 'new'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : sub.status === 'delivered'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : sub.status === 'awaiting_payment'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {sub.status.replace(/_/g, ' ')}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSubmission(sub.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                      title="Delete submission"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBMISSION DETAIL DRAWER / MODAL */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#080d24] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-[#060b1c]/80">
              <div>
                <span className="text-[10px] font-mono uppercase text-cyan-400 tracking-wider">
                  Submission for {selectedSubmission.tool_slug}
                </span>
                <h3 className="text-lg font-bold text-white">
                  {selectedSubmission.client_name} ({selectedSubmission.client_email})
                </h3>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {submissionActionMsg && (
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-300 font-mono">
                  {submissionActionMsg}
                </div>
              )}

              {/* Status & Payment Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Workflow Status
                  </label>
                  <select
                    value={selectedSubmission.status}
                    onChange={(e) =>
                      handleUpdateSubmissionStatus(
                        selectedSubmission.id,
                        e.target.value as any,
                        selectedSubmission.operator_notes
                      )
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  >
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="awaiting_payment">Awaiting Payment</option>
                    <option value="paid">Paid</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Payment Status
                  </label>
                  <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400">
                    {selectedSubmission.payment_status.toUpperCase()}{' '}
                    {selectedSubmission.amount_due ? `($${selectedSubmission.amount_due})` : ''}
                  </div>
                </div>
              </div>

              {/* Form Data Answers */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                  Client Answers & Form Payload
                </h4>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  {selectedSubmission.form_data && Object.keys(selectedSubmission.form_data).length > 0 ? (
                    Object.entries(selectedSubmission.form_data).map(([key, val]) => (
                      <div key={key} className="text-xs">
                        <span className="font-mono text-slate-400">{key}: </span>
                        <span className="text-white font-medium">{String(val)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">No additional form fields.</p>
                  )}
                </div>
              </div>

              {/* Uploaded Files */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                  Uploaded Files ({selectedSubmission.file_paths?.length || 0})
                </h4>
                {selectedSubmission.signed_file_urls && selectedSubmission.signed_file_urls.length > 0 ? (
                  <div className="space-y-2">
                    {selectedSubmission.signed_file_urls.map((f, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800"
                      >
                        <span className="text-xs font-mono text-slate-300 truncate max-w-sm">
                          {f.path.split('/').pop()}
                        </span>
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No client files attached.</p>
                )}
              </div>

              {/* Deliverable Section */}
              <div className="space-y-3 p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 to-slate-900 border border-cyan-500/30">
                <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold flex items-center justify-between">
                  <span>Deliverable Fulfillment</span>
                  {selectedSubmission.status === 'delivered' && (
                    <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
                    </span>
                  )}
                </h4>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    ref={deliverableInputRef}
                    type="file"
                    onChange={handleUploadDeliverable}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingDeliverable}
                    onClick={() => deliverableInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 min-h-[40px]"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{isUploadingDeliverable ? 'Uploading...' : 'Upload Finished Deliverable'}</span>
                  </button>

                  {selectedSubmission.deliverable_path && (
                    <button
                      type="button"
                      onClick={() => handleCopyClientLink(selectedSubmission.id)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 min-h-[40px]"
                    >
                      <LinkIcon className="w-4 h-4 text-cyan-400" />
                      <span>{copiedLink ? 'Copied 7-Day Link!' : 'Copy 7-Day Client Link'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Operator Notes */}
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase text-slate-400">
                  Operator Notes & Audit Comments
                </label>
                <textarea
                  rows={3}
                  defaultValue={selectedSubmission.operator_notes}
                  onBlur={(e) =>
                    handleUpdateSubmissionStatus(
                      selectedSubmission.id,
                      selectedSubmission.status,
                      e.target.value
                    )
                  }
                  placeholder="Add internal notes about this client request..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-xs text-white placeholder-slate-600 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3-STEP CREATE / EDIT WIZARD MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#080d24] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 bg-[#060b1c]/80 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white font-display">
                  {editingTool ? `Edit "${editingTool.name}"` : 'Create New Tool'}
                </h3>
                {/* 3-Step Indicator */}
                <div className="flex items-center gap-3 mt-2 text-xs font-mono">
                  <button
                    onClick={() => setActiveStep(1)}
                    className={`flex items-center gap-1.5 ${
                      activeStep === 1 ? 'text-cyan-400 font-bold' : 'text-slate-500'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full flex items-center justify-center border text-[10px] border-current">
                      1
                    </span>
                    <span>Basics</span>
                  </button>
                  <span className="text-slate-700">→</span>
                  <button
                    onClick={() => setActiveStep(2)}
                    className={`flex items-center gap-1.5 ${
                      activeStep === 2 ? 'text-cyan-400 font-bold' : 'text-slate-500'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full flex items-center justify-center border text-[10px] border-current">
                      2
                    </span>
                    <span>Launch & Logic</span>
                  </button>
                  <span className="text-slate-700">→</span>
                  <button
                    onClick={() => setActiveStep(3)}
                    className={`flex items-center gap-1.5 ${
                      activeStep === 3 ? 'text-cyan-400 font-bold' : 'text-slate-500'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full flex items-center justify-center border text-[10px] border-current">
                      3
                    </span>
                    <span>Media & Publish</span>
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {modalError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* STEP 1: BASICS */}
              {activeStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                        Tool Name <span className="text-cyan-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="e.g. Prompt Refiner"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-sm text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                        Slug (URL identifier) <span className="text-cyan-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formSlug}
                        onChange={(e) => setFormSlug(e.target.value)}
                        placeholder="prompt-refiner"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-sm text-white focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                      Tagline (Max 120 chars)
                    </label>
                    <input
                      type="text"
                      maxLength={120}
                      value={formTagline}
                      onChange={(e) => setFormTagline(e.target.value)}
                      placeholder="One punchy sentence describing the tool"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-sm text-white focus:outline-none"
                    />
                    <span className="text-[10px] font-mono text-slate-500">{formTagline.length}/120</span>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                      Description (Max 400 chars)
                    </label>
                    <textarea
                      rows={3}
                      maxLength={400}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Clear explanation of inputs, transform, and outputs"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-sm text-white focus:outline-none"
                    />
                    <span className="text-[10px] font-mono text-slate-500">{formDescription.length}/400</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                        Category
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-sm text-white focus:outline-none"
                      >
                        {TOOL_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                        Badge Tier
                      </label>
                      <select
                        value={formTier}
                        onChange={(e) => setFormTier(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-sm text-white focus:outline-none"
                      >
                        <option value="free">FREE</option>
                        <option value="pro">PRO</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                        Origin
                      </label>
                      <select
                        value={formOrigin}
                        onChange={(e) => setFormOrigin(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-sm text-white focus:outline-none"
                      >
                        <option value="coreiq">CoreIQ Native</option>
                        <option value="opensource">Open Source</option>
                      </select>
                    </div>
                  </div>

                  {/* Paid Tool Toggle */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-white block">Paid Tool Monetization</span>
                        <span className="text-[11px] text-slate-400">
                          Require client payment prior to execution or download
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={formIsPaid}
                        onChange={(e) => setFormIsPaid(e.target.checked)}
                        className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                      />
                    </div>

                    {formIsPaid && (
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                            Price Amount
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formPriceAmount}
                            onChange={(e) => setFormPriceAmount(e.target.value)}
                            placeholder="49"
                            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                            Currency
                          </label>
                          <input
                            type="text"
                            value={formPriceCurrency}
                            onChange={(e) => setFormPriceCurrency(e.target.value.toUpperCase())}
                            placeholder="USD"
                            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: LAUNCH TYPE & LOGIC */}
              {activeStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                      Launch Type
                    </label>
                    <select
                      value={formLaunchType}
                      onChange={(e) => setFormLaunchType(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-sm text-white focus:outline-none"
                    >
                      <option value="link">Link (Direct External or Internal URL)</option>
                      <option value="download">Download (File Package / ZIP)</option>
                      <option value="payment">Payment (Paid checkout link)</option>
                      <option value="in_app">In-App Interactive (Form Builder)</option>
                      <option value="coming_soon">Coming Soon (Disabled pill)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                      Card CTA Button Label
                    </label>
                    <input
                      type="text"
                      value={formCtaLabel}
                      onChange={(e) => setFormCtaLabel(e.target.value)}
                      placeholder="Open / Download / Apply"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-sm text-white focus:outline-none"
                    />
                  </div>

                  {/* Type: link */}
                  {formLaunchType === 'link' && (
                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                        Destination URL (Secure https:// or internal /path)
                      </label>
                      <input
                        type="text"
                        value={formLaunchUrl}
                        onChange={(e) => setFormLaunchUrl(e.target.value)}
                        placeholder="https://example.com/tool or /tools"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-sm text-white focus:outline-none font-mono"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Stored in private table: never exposed in public list responses.
                      </p>
                    </div>
                  )}

                  {/* Type: download */}
                  {formLaunchType === 'download' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                        Download File Package
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          ref={toolFileInputRef}
                          type="file"
                          onChange={handleToolFileSelected}
                          className="hidden"
                        />
                        <button
                          type="button"
                          disabled={isUploadingToolFile}
                          onClick={() => toolFileInputRef.current?.click()}
                          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-400/50 text-xs text-white flex items-center gap-2 min-h-[40px]"
                        >
                          <UploadCloud className="w-4 h-4 text-cyan-400" />
                          <span>{isUploadingToolFile ? 'Uploading...' : 'Upload File'}</span>
                        </button>
                        <input
                          type="text"
                          value={formDownloadPath}
                          onChange={(e) => setFormDownloadPath(e.target.value)}
                          placeholder="file path or storage ID"
                          className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* Type: payment or paid tool */}
                  {(formLaunchType === 'payment' || formIsPaid) && (
                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                        Payment Link (PayPal, Square or Wise)
                      </label>
                      <input
                        type="url"
                        value={formPaymentUrl}
                        onChange={(e) => setFormPaymentUrl(e.target.value)}
                        placeholder="https://paypal.me/... or payment checkout URL"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-sm text-white focus:outline-none font-mono"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Never exposed on the public card: returned after client submission is registered.
                      </p>
                    </div>
                  )}

                  {/* Type: in_app (Form Builder) */}
                  {formLaunchType === 'in_app' && (
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-cyan-400 font-bold">
                          In-App Interactive Form Builder
                        </span>
                        <button
                          type="button"
                          onClick={addFormField}
                          className="px-3 py-1.5 rounded-lg bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Field</span>
                        </button>
                      </div>

                      {formSchema.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          No custom fields added yet. The modal will collect client name and email.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {formSchema.map((field, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-[10px] font-mono uppercase text-slate-500">
                                    Label
                                  </label>
                                  <input
                                    type="text"
                                    value={field.label}
                                    onChange={(e) => updateFormField(idx, { label: e.target.value })}
                                    className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-mono uppercase text-slate-500">
                                    Key
                                  </label>
                                  <input
                                    type="text"
                                    value={field.key}
                                    onChange={(e) => updateFormField(idx, { key: e.target.value })}
                                    className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-mono uppercase text-slate-500">
                                    Type
                                  </label>
                                  <select
                                    value={field.type}
                                    onChange={(e) => updateFormField(idx, { type: e.target.value as any })}
                                    className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-white"
                                  >
                                    <option value="text">Text</option>
                                    <option value="long_text">Long Text</option>
                                    <option value="email">Email</option>
                                    <option value="file">File Upload</option>
                                    <option value="select">Select Dropdown</option>
                                  </select>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={field.required}
                                    onChange={(e) => updateFormField(idx, { required: e.target.checked })}
                                    className="accent-cyan-400 rounded"
                                  />
                                  <span>Required</span>
                                </label>
                                <button
                                  type="button"
                                  onClick={() => removeFormField(idx)}
                                  className="text-xs text-rose-400 hover:text-rose-300"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: MEDIA & PUBLISH */}
              {activeStep === 3 && (
                <div className="space-y-4">
                  {/* Image field */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono uppercase text-slate-400">
                      Tool Thumbnail Image (WebP, PNG, JPG max 5 MB)
                    </label>

                    <div className="flex items-center gap-3">
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageFileSelected}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={isUploadingImage}
                        onClick={() => imageInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-400/50 text-xs text-white flex items-center gap-2 min-h-[40px]"
                      >
                        <ImageIcon className="w-4 h-4 text-cyan-400" />
                        <span>{isUploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                      </button>
                      <input
                        type="text"
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        placeholder="https://... or /media/..."
                        className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none"
                      />
                    </div>

                    {formImageUrl && (
                      <div className="w-32 aspect-video rounded-lg overflow-hidden border border-slate-800 bg-slate-950 mt-2">
                        <img src={formImageUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                        Sort Order (Integer)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formSortOrder}
                        onChange={(e) => setFormSortOrder(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                        Publish Status
                      </label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none"
                      >
                        <option value="draft">Draft (Hidden from public)</option>
                        <option value="published">Published (Live on /tools)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Featured in Hero / Start Here</span>
                      <span className="text-[11px] text-slate-400">Pushed to priority display positions</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formFeatured}
                      onChange={(e) => setFormFeatured(e.target.checked)}
                      className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-6 border-t border-slate-800 bg-[#060b1c]/80 flex items-center justify-between">
              <div>
                {activeStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setActiveStep((prev) => (prev - 1) as any)}
                    className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    ← Back
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>

                {activeStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setActiveStep((prev) => (prev + 1) as any)}
                    className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSaveTool}
                    className="px-6 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                  >
                    {isSubmitting ? 'Saving...' : editingTool ? 'Save Changes' : 'Publish Tool'}
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
