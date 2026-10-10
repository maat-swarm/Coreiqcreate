import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  FileCode,
  Link as LinkIcon,
  ExternalLink,
  Key,
  CreditCard,
  Inbox,
  Check,
  Copy,
  ArrowRight,
  ArrowLeft,
  X,
  FileText,
  DollarSign,
  Shield,
  Clock,
  Sparkles,
  Flame,
  PenTool,
  Database,
  GitMerge,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown
} from 'lucide-react';
import {
  StoreApp,
  StoreAccessLink,
  StoreRequest,
  PaymentSettingsConfig,
  PaymentMethodConfig,
  fetchStoreApps,
  createStoreApp,
  updateStoreApp,
  deleteStoreApp,
  uploadAppMedia,
  createAccessLink,
  fetchAccessLinks,
  fetchStoreRequests,
  updateStoreRequest,
  fetchStoreSettings,
  saveStoreSettings,
  checkStoreUrl,
  uploadAppFileDirect,
} from '../../services/storeAdmin';

type StoreSubTab = 'apps' | 'requests' | 'payment';

const ICON_OPTIONS = [
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Flame', icon: Flame },
  { name: 'PenTool', icon: PenTool },
  { name: 'Database', icon: Database },
  { name: 'GitMerge', icon: GitMerge },
  { name: 'FileCode', icon: FileCode },
  { name: 'ShoppingBag', icon: ShoppingBag },
];

const ACCENT_COLORS = [
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
];

const CATEGORY_OPTIONS = [
  'Productivity',
  'Creative',
  'Data',
  'Automation',
  'Development',
  'Business',
  'Utility',
];

interface SteppedFormData {
  id?: string;
  // Delivery
  deliveryChoice: 'web' | 'file' | 'external';
  external_url: string;
  // Details
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  status: 'draft' | 'published' | 'coming_soon';
  version: string;
  changelog: string;
  sort_order: number;
  featured: boolean;
  icon_name: string;
  accent_color: string;
  // Media
  icon_url: string | null;
  screenshots: string[];
  // Price & Access
  price_mode: 'free' | 'paid' | 'contact';
  price_amount: string;
  currency: string;
  price_note: string;
  payment_label: string;
  payment_url: string;
  payment_instructions: string;
}

const DEFAULT_FORM_DATA: SteppedFormData = {
  deliveryChoice: 'web',
  external_url: '',
  slug: '',
  title: '',
  tagline: '',
  description: '',
  category: 'Productivity',
  status: 'draft',
  version: '1.0.0',
  changelog: 'Initial version release.',
  sort_order: 0,
  featured: false,
  icon_name: 'Sparkles',
  accent_color: '#06b6d4',
  icon_url: null,
  screenshots: [],
  price_mode: 'free',
  price_amount: '',
  currency: 'USD',
  price_note: '',
  payment_label: '',
  payment_url: '',
  payment_instructions: '',
};

export const CommandStoreTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<StoreSubTab>('apps');
  const [apps, setApps] = useState<StoreApp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Form modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formStep, setFormStep] = useState<1 | 2 | 3 | 4>(1);
  const [formData, setFormData] = useState<SteppedFormData>(DEFAULT_FORM_DATA);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Link checking state
  const [checkingUrl, setCheckingUrl] = useState(false);
  const [urlCheckResult, setUrlCheckResult] = useState<{ reachable: boolean; status: number | null; error?: string } | null>(null);

  // Media uploading state
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // App file upload modal/state
  const [fileUploadApp, setFileUploadApp] = useState<StoreApp | null>(null);
  const [selectedPackageFile, setSelectedPackageFile] = useState<File | null>(null);
  const [isUploadingPackage, setIsUploadingPackage] = useState(false);
  const [packageUploadStatus, setPackageUploadStatus] = useState<string>('');
  const [packageUploadResult, setPackageUploadResult] = useState<{
    name: string;
    size: number;
    sha256: string;
    fallbackMode: boolean;
  } | null>(null);

  // Access Links Modal
  const [linksApp, setLinksApp] = useState<StoreApp | null>(null);
  const [accessLinks, setAccessLinks] = useState<StoreAccessLink[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [newLinkHours, setNewLinkHours] = useState<number>(72);
  const [newLinkMaxUses, setNewLinkMaxUses] = useState<number>(1);
  const [newLinkNote, setNewLinkNote] = useState<string>('');
  const [generatedLinkUrl, setGeneratedLinkUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  // Requests state
  const [requests, setRequests] = useState<StoreRequest[]>([]);
  const [requestFilter, setRequestFilter] = useState('all');
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Payment settings state
  const [paymentConfig, setPaymentConfig] = useState<PaymentSettingsConfig>({
    heading: 'Global Payment & Direct Release',
    default_instructions: '',
    default_currency: 'USD',
    methods: [],
  });
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  // Confirm delete modal
  const [deleteTargetApp, setDeleteTargetApp] = useState<StoreApp | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Confirm delete demo apps modal
  const [showDeleteDemosModal, setShowDeleteDemosModal] = useState(false);
  const [isDeletingDemos, setIsDeletingDemos] = useState(false);

  // Auto-dismiss success toast
  useEffect(() => {
    if (!actionSuccess) return;
    const t = setTimeout(() => setActionSuccess(null), 4000);
    return () => clearTimeout(t);
  }, [actionSuccess]);

  // Load apps
  const loadApps = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await fetchStoreApps(statusFilter, categoryFilter);
      setApps(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch store applications.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, categoryFilter]);

  // Load requests
  const loadRequests = useCallback(async () => {
    try {
      setLoadingRequests(true);
      const data = await fetchStoreRequests(undefined, requestFilter);
      setRequests(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch customer requests.');
    } finally {
      setLoadingRequests(false);
    }
  }, [requestFilter]);

  // Load payment settings
  const loadPaymentSettings = useCallback(async () => {
    try {
      setLoadingPayment(true);
      const cfg = await fetchStoreSettings('payment');
      if (cfg) {
        setPaymentConfig(cfg);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch payment settings.');
    } finally {
      setLoadingPayment(false);
    }
  }, []);

  useEffect(() => {
    if (activeSubTab === 'apps') {
      loadApps();
    } else if (activeSubTab === 'requests') {
      loadRequests();
    } else if (activeSubTab === 'payment') {
      loadPaymentSettings();
    }
  }, [activeSubTab, loadApps, loadRequests, loadPaymentSettings]);

  // Handle URL reachability check
  const handleCheckUrl = async (urlToCheck: string) => {
    if (!urlToCheck || !urlToCheck.trim()) {
      setUrlCheckResult({ reachable: false, status: null, error: 'Please enter a URL first' });
      return;
    }
    try {
      setCheckingUrl(true);
      setUrlCheckResult(null);
      const res = await checkStoreUrl(urlToCheck.trim());
      setUrlCheckResult(res);
    } catch (e: any) {
      setUrlCheckResult({ reachable: false, status: null, error: e.message || 'Check failed' });
    } finally {
      setCheckingUrl(false);
    }
  };

  // Open stepped form for Create
  const handleOpenCreateForm = () => {
    setFormData(DEFAULT_FORM_DATA);
    setFormStep(1);
    setFormError(null);
    setUrlCheckResult(null);
    setIsFormOpen(true);
  };

  // Open stepped form for Edit
  const handleOpenEditForm = (app: StoreApp) => {
    let delivery: 'web' | 'file' | 'external' = 'web';
    if (app.distribution_type === 'download') delivery = 'file';
    else if (app.distribution_type === 'custom') delivery = 'external';
    else delivery = 'web';

    setFormData({
      id: app.id,
      deliveryChoice: delivery,
      external_url: app.external_url || '',
      slug: app.slug,
      title: app.title,
      tagline: app.tagline || '',
      description: app.description || '',
      category: app.category || 'Productivity',
      status: app.status || 'draft',
      version: app.version || '1.0.0',
      changelog: app.changelog || '',
      sort_order: app.sort_order ?? 0,
      featured: Boolean(app.featured),
      icon_name: app.icon_name || 'Sparkles',
      accent_color: app.accent_color || '#06b6d4',
      icon_url: app.icon_url || null,
      screenshots: Array.isArray(app.screenshots) ? app.screenshots : [],
      price_mode: app.price_mode || 'free',
      price_amount: app.price_amount !== null && app.price_amount !== undefined ? String(app.price_amount) : '',
      currency: app.currency || 'USD',
      price_note: app.price_note || '',
      payment_label: app.payment_label || '',
      payment_url: app.payment_url || '',
      payment_instructions: app.payment_instructions || '',
    });
    setFormStep(1);
    setFormError(null);
    setUrlCheckResult(null);
    setIsFormOpen(true);
  };

  // Step validation
  const validateCurrentStep = (): boolean => {
    setFormError(null);
    if (formStep === 1) {
      if (formData.deliveryChoice === 'web' || formData.deliveryChoice === 'external') {
        if (!formData.external_url || !formData.external_url.trim()) {
          setFormError('Destination URL is required for web apps and external links.');
          return false;
        }
        if (!/^https?:\/\//i.test(formData.external_url.trim())) {
          setFormError('URL must start with https://');
          return false;
        }
      }
      return true;
    }
    if (formStep === 2) {
      if (!formData.title || !formData.title.trim()) {
        setFormError('App title is required.');
        return false;
      }
      if (!formData.slug || !formData.slug.trim()) {
        setFormError('Slug is required.');
        return false;
      }
      if (!/^[a-z0-9-]+$/.test(formData.slug.trim())) {
        setFormError('Slug must contain only lowercase letters, numbers, and hyphens (a-z0-9-).');
        return false;
      }
      return true;
    }
    if (formStep === 4) {
      if (formData.price_mode === 'paid') {
        if (!formData.price_amount || isNaN(Number(formData.price_amount))) {
          setFormError('A valid price amount is required for paid applications.');
          return false;
        }
      }
      return true;
    }
    return true;
  };

  // Submit stepped form
  const handleSaveForm = async () => {
    if (!validateCurrentStep()) return;

    setFormSubmitting(true);
    setFormError(null);

    let distribution_type: 'download' | 'link' | 'custom' | 'access' = 'link';
    if (formData.deliveryChoice === 'file') distribution_type = 'download';
    else if (formData.deliveryChoice === 'external') distribution_type = 'custom';
    else distribution_type = 'link';

    const payload: Partial<StoreApp> = {
      slug: formData.slug.trim().toLowerCase(),
      title: formData.title.trim(),
      tagline: formData.tagline.trim(),
      description: formData.description.trim(),
      category: formData.category,
      status: formData.status,
      version: formData.version.trim() || '1.0.0',
      changelog: formData.changelog.trim(),
      sort_order: Number(formData.sort_order) || 0,
      featured: formData.featured,
      icon_name: formData.icon_name,
      accent_color: formData.accent_color,
      icon_url: formData.icon_url,
      screenshots: formData.screenshots,
      distribution_type,
      external_url: formData.external_url.trim(),
      price_mode: formData.price_mode,
      price_amount: formData.price_mode === 'paid' && formData.price_amount ? Number(formData.price_amount) : null,
      currency: formData.currency.trim() || 'USD',
      price_note: formData.price_note.trim(),
      payment_label: formData.payment_label.trim(),
      payment_url: formData.payment_url.trim(),
      payment_instructions: formData.payment_instructions.trim(),
    };

    try {
      if (formData.id) {
        await updateStoreApp(formData.id, payload);
        setActionSuccess(`Application "${formData.title}" updated successfully.`);
      } else {
        const created = await createStoreApp(payload);
        setActionSuccess(`Application "${created.title}" created successfully.`);
      }
      setIsFormOpen(false);
      loadApps();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save application.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Quick toggle publish/unpublish
  const handleTogglePublish = async (app: StoreApp) => {
    const nextStatus = app.status === 'published' ? 'draft' : 'published';
    try {
      await updateStoreApp(app.id, { status: nextStatus });
      setActionSuccess(`App "${app.title}" is now ${nextStatus}.`);
      loadApps();
    } catch (err: any) {
      setErrorMessage(err.message || `Failed to update status for ${app.title}.`);
    }
  };

  // Delete single app
  const handleConfirmDeleteApp = async () => {
    if (!deleteTargetApp) return;
    try {
      setIsDeleting(true);
      await deleteStoreApp(deleteTargetApp.id);
      setActionSuccess(`Application "${deleteTargetApp.title}" deleted.`);
      setDeleteTargetApp(null);
      loadApps();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete application.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Remove Demo Apps (id starts with 'app-seed-')
  const handleConfirmDeleteDemoApps = async () => {
    try {
      setIsDeletingDemos(true);
      const demoApps = apps.filter((a) => a.id.startsWith('app-seed-'));
      if (demoApps.length === 0) {
        setActionSuccess('No demo apps found.');
        setShowDeleteDemosModal(false);
        return;
      }
      for (const d of demoApps) {
        await deleteStoreApp(d.id);
      }
      setActionSuccess(`Removed ${demoApps.length} demo seed application(s).`);
      setShowDeleteDemosModal(false);
      loadApps();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to remove demo apps.');
    } finally {
      setIsDeletingDemos(false);
    }
  };

  // Media upload inside form step 3
  const handleUploadMediaFile = async (e: React.ChangeEvent<HTMLInputElement>, isIcon: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!formData.id) {
      setFormError('Please save the app draft first before uploading images to storage.');
      return;
    }

    try {
      setUploadingMedia(true);
      setFormError(null);
      const res = await uploadAppMedia(formData.id, file);
      if (isIcon) {
        setFormData((prev) => ({ ...prev, icon_url: res.url }));
      } else {
        setFormData((prev) => ({ ...prev, screenshots: [...prev.screenshots, res.url] }));
      }
      setActionSuccess('Media uploaded successfully.');
    } catch (err: any) {
      setFormError(err.message || 'Media upload failed.');
    } finally {
      setUploadingMedia(false);
      e.target.value = '';
    }
  };

  // App package upload flow
  const handleOpenPackageUpload = (app: StoreApp) => {
    setFileUploadApp(app);
    setSelectedPackageFile(null);
    setPackageUploadStatus('');
    setPackageUploadResult(null);
  };

  const handleExecutePackageUpload = async () => {
    if (!fileUploadApp || !selectedPackageFile) return;

    try {
      setIsUploadingPackage(true);
      setPackageUploadStatus('Starting package upload...');
      const res = await uploadAppFileDirect(fileUploadApp.id, selectedPackageFile, (msg) => {
        setPackageUploadStatus(msg);
      });
      setPackageUploadResult(res);
      setActionSuccess(`File "${res.name}" successfully attached to "${fileUploadApp.title}".`);
      loadApps();
    } catch (err: any) {
      setPackageUploadStatus(`Error: ${err.message || 'File upload failed'}`);
    } finally {
      setIsUploadingPackage(false);
    }
  };

  // Access Links flow
  const handleOpenAccessLinks = async (app: StoreApp) => {
    setLinksApp(app);
    setGeneratedLinkUrl(null);
    setCopiedLink(false);
    setNewLinkHours(72);
    setNewLinkMaxUses(1);
    setNewLinkNote('');
    try {
      setLoadingLinks(true);
      const links = await fetchAccessLinks(app.id);
      setAccessLinks(links);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch access links.');
    } finally {
      setLoadingLinks(false);
    }
  };

  const handleGenerateLink = async () => {
    if (!linksApp) return;
    try {
      setGeneratingLink(true);
      const created = await createAccessLink(linksApp.id, {
        hours: newLinkHours,
        max_uses: newLinkMaxUses,
        note: newLinkNote,
      });
      setGeneratedLinkUrl(created.url);
      setCopiedLink(false);
      // Refresh list
      const updated = await fetchAccessLinks(linksApp.id);
      setAccessLinks(updated);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate link.');
    } finally {
      setGeneratingLink(false);
    }
  };

  // Requests update
  const handleUpdateRequestStatus = async (reqId: string, newStatus: StoreRequest['status']) => {
    try {
      await updateStoreRequest(reqId, { status: newStatus });
      setActionSuccess(`Request status updated to "${newStatus}".`);
      loadRequests();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update request.');
    }
  };

  // Payment settings handlers
  const handleSavePaymentConfig = async () => {
    try {
      setSavingPayment(true);
      await saveStoreSettings('payment', paymentConfig);
      setActionSuccess('Payment configuration saved successfully.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save payment settings.');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleAddPaymentMethod = () => {
    const newMethod: PaymentMethodConfig = {
      id: `method_${Date.now()}`,
      label: 'New Payment Method',
      url: '',
      details: 'Instructions for sender.',
    };
    setPaymentConfig((prev) => ({
      ...prev,
      methods: [...prev.methods, newMethod],
    }));
  };

  const handleRemovePaymentMethod = (index: number) => {
    setPaymentConfig((prev) => ({
      ...prev,
      methods: prev.methods.filter((_, i) => i !== index),
    }));
  };

  const handleMovePaymentMethod = (index: number, direction: 'up' | 'down') => {
    setPaymentConfig((prev) => {
      const arr = [...prev.methods];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= arr.length) return prev;
      const temp = arr[index];
      arr[index] = arr[targetIndex];
      arr[targetIndex] = temp;
      return { ...prev, methods: arr };
    });
  };

  const hasDemoApps = apps.some((a) => a.id.startsWith('app-seed-'));

  return (
    <div className="w-full space-y-6">
      {/* Top Banner / Alerts */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="p-1 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setErrorMessage(null);
                if (activeSubTab === 'apps') loadApps();
                else if (activeSubTab === 'requests') loadRequests();
                else loadPaymentSettings();
              }}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold min-h-[44px] flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            <button
              onClick={() => setErrorMessage(null)}
              className="p-1 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Sub-Tabs Bar & Main Action Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        {/* Navigation Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setActiveSubTab('apps')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all min-h-[44px] ${
              activeSubTab === 'apps'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(25,217,255,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Apps Directory</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
              {apps.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('requests')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all min-h-[44px] ${
              activeSubTab === 'requests'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(25,217,255,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Customer Requests</span>
            {requests.filter((r) => r.status === 'new').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                {requests.filter((r) => r.status === 'new').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('payment')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all min-h-[44px] ${
              activeSubTab === 'payment'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(25,217,255,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payment Options</span>
          </button>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {hasDemoApps && activeSubTab === 'apps' && (
            <button
              onClick={() => setShowDeleteDemosModal(true)}
              className="px-3 py-2 rounded-xl text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors min-h-[44px] flex items-center gap-1.5"
              title="Delete demo apps with id starting with app-seed-"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove demo apps</span>
            </button>
          )}

          {activeSubTab === 'apps' && (
            <button
              onClick={handleOpenCreateForm}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 flex items-center gap-1.5 shadow-[0_0_15px_rgba(25,217,255,0.3)] transition-all min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Application</span>
            </button>
          )}

          <button
            onClick={() => {
              if (activeSubTab === 'apps') loadApps();
              else if (activeSubTab === 'requests') loadRequests();
              else loadPaymentSettings();
            }}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Refresh current tab"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: APPS DIRECTORY */}
      {activeSubTab === 'apps' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-xl bg-[#060b1e]/90 border border-slate-800/80">
            <span className="text-xs font-mono text-slate-400">Filters:</span>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 min-h-[44px]"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 min-h-[44px]"
            >
              <option value="all">All Categories</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-7 h-7 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
              <span className="text-xs text-slate-400 font-mono">Loading store applications...</span>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && apps.length === 0 && (
            <div className="p-12 rounded-2xl bg-[#060b1e]/50 border border-slate-800 text-center">
              <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-300">No applications found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No apps match the selected filter criteria. Create a new app or reset filters to view all entries.
              </p>
              <button
                onClick={handleOpenCreateForm}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-all min-h-[44px]"
              >
                + Add First App
              </button>
            </div>
          )}

          {/* Apps Cards List */}
          {!isLoading && apps.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {apps.map((app) => {
                const isPaid = app.price_mode === 'paid';
                const isContact = app.price_mode === 'contact';
                const isPublished = app.status === 'published';

                return (
                  <div
                    key={app.id}
                    className="p-4 rounded-2xl bg-[#060b1e] border border-slate-800/80 hover:border-cyan-500/40 transition-all flex flex-col justify-between group shadow-sm hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                  >
                    <div>
                      {/* Top Chips Row */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Status Chip */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                              isPublished
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : app.status === 'draft'
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {app.status}
                          </span>

                          {/* Price Chip */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                              isPaid
                                ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                                : isContact
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                            }`}
                          >
                            {isPaid ? `$${app.price_amount ?? 0} ${app.currency}` : isContact ? 'Contact' : 'Free'}
                          </span>

                          {/* Delivery Type */}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800">
                            {app.distribution_type}
                          </span>
                        </div>

                        {/* Has File Indicator */}
                        <div
                          className="flex items-center gap-1 text-[11px]"
                          title={app.file_path ? `Attached file: ${app.file_name || 'package'}` : 'No file uploaded'}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              app.file_path ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : 'bg-slate-600'
                            }`}
                          />
                          <span className="text-[10px] text-slate-400 font-mono">
                            {app.file_path ? 'File attached' : 'No file'}
                          </span>
                        </div>
                      </div>

                      {/* Header & Icon */}
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                          style={{
                            backgroundColor: `${app.accent_color || '#06b6d4'}20`,
                            borderColor: `${app.accent_color || '#06b6d4'}40`,
                          }}
                        >
                          {app.icon_url ? (
                            <img src={app.icon_url} alt="" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <Sparkles className="w-5 h-5" style={{ color: app.accent_color || '#06b6d4' }} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-white tracking-tight truncate">{app.title}</h4>
                          <p className="text-[11px] font-mono text-cyan-400/80 truncate">/{app.slug}</p>
                        </div>
                      </div>

                      {/* Tagline / Description */}
                      <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                        {app.tagline || app.description || 'No description provided.'}
                      </p>

                      {/* File Details if attached */}
                      {app.file_path && (
                        <div className="mt-3 p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px] font-mono text-slate-300 space-y-0.5">
                          <div className="truncate">📦 {app.file_name || 'package.zip'}</div>
                          <div className="text-[10px] text-slate-400 flex items-center justify-between">
                            <span>{app.file_size_bytes ? `${(app.file_size_bytes / (1024 * 1024)).toFixed(2)} MB` : '0 MB'}</span>
                            {app.sha256 && (
                              <span title={`SHA-256: ${app.sha256}`}>
                                SHA: {app.sha256.substring(0, 8)}...
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1">
                        {/* Publish/Unpublish Toggle */}
                        <button
                          onClick={() => handleTogglePublish(app)}
                          className={`p-2 rounded-lg text-xs font-semibold min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors ${
                            isPublished
                              ? 'text-emerald-400 hover:bg-emerald-500/10'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                          title={isPublished ? 'Unpublish to draft' : 'Publish app'}
                        >
                          {isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>

                        {/* File Upload Trigger */}
                        <button
                          onClick={() => handleOpenPackageUpload(app)}
                          className="p-2 rounded-lg text-xs text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                          title="Attach or replace file package"
                        >
                          <UploadCloud className="w-4 h-4" />
                        </button>

                        {/* Access Link Trigger (Paid / Contact) */}
                        {(isPaid || isContact) && (
                          <button
                            onClick={() => handleOpenAccessLinks(app)}
                            className="p-2 rounded-lg text-xs text-slate-400 hover:text-violet-300 hover:bg-violet-500/10 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                            title="Generate secure expiring access link"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditForm(app)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors min-h-[44px] flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setDeleteTargetApp(app)}
                          className="p-2 rounded-lg text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                          title="Delete application"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: CUSTOMER REQUESTS */}
      {activeSubTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#060b1e]/90 border border-slate-800/80">
            <span className="text-xs font-mono text-slate-400">Filter requests by status:</span>
            <select
              value={requestFilter}
              onChange={(e) => setRequestFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 min-h-[44px]"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {loadingRequests && (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-7 h-7 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
              <span className="text-xs text-slate-400 font-mono">Loading requests...</span>
            </div>
          )}

          {!loadingRequests && requests.length === 0 && (
            <div className="p-12 rounded-2xl bg-[#060b1e]/50 border border-slate-800 text-center">
              <Inbox className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-300">No requests found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Customer requests from Contact and custom deployment flows will appear here.
              </p>
            </div>
          )}

          {!loadingRequests && requests.length > 0 && (
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-xl bg-[#060b1e] border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{req.user_name || req.user_email}</span>
                      <span className="text-xs font-mono text-cyan-400">({req.user_email})</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                          req.status === 'new'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : req.status === 'contacted'
                            ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                    {req.message && <p className="text-xs text-slate-300 italic">"{req.message}"</p>}
                    <p className="text-[10px] text-slate-500 font-mono">
                      Received: {new Date(req.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <select
                      value={req.status}
                      onChange={(e) => handleUpdateRequestStatus(req.id, e.target.value as any)}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 min-h-[44px]"
                    >
                      <option value="new">Mark New</option>
                      <option value="contacted">Mark Contacted</option>
                      <option value="closed">Mark Closed</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: PAYMENT SETTINGS */}
      {activeSubTab === 'payment' && (
        <div className="space-y-6 max-w-4xl">
          <div className="p-5 rounded-2xl bg-[#060b1e] border border-slate-800/80 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-cyan-400" />
              <span>Global Payment Settings & Instructions</span>
            </h3>
            <p className="text-xs text-slate-400">
              Configure universal payment instructions and checkout destinations shown to visitors when purchasing paid apps.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Heading</label>
                <input
                  type="text"
                  value={paymentConfig.heading}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, heading: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[44px]"
                  placeholder="Global Payment & Direct Release"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Default Instructions</label>
                <textarea
                  rows={3}
                  value={paymentConfig.default_instructions}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, default_instructions: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Instructions for how buyers complete settlement and receive their link."
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Default Currency</label>
                <input
                  type="text"
                  value={paymentConfig.default_currency}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, default_currency: e.target.value.toUpperCase() })}
                  className="w-32 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 min-h-[44px]"
                  placeholder="USD"
                />
              </div>
            </div>
          </div>

          {/* Payment Methods List */}
          <div className="p-5 rounded-2xl bg-[#060b1e] border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-white">Payment Methods</h4>
                <p className="text-xs text-slate-400">Add direct payment destinations (e.g. PayPal, Wise, Stripe, Wire).</p>
              </div>
              <button
                onClick={handleAddPaymentMethod}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-colors min-h-[44px] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Method</span>
              </button>
            </div>

            <div className="space-y-3">
              {paymentConfig.methods.map((method, idx) => (
                <div key={method.id || idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">Method #{idx + 1}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMovePaymentMethod(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Move Up"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMovePaymentMethod(idx, 'down')}
                        disabled={idx === paymentConfig.methods.length - 1}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Move Down"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemovePaymentMethod(idx)}
                        className="p-1 text-slate-400 hover:text-rose-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Remove Method"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-0.5">Label</label>
                      <input
                        type="text"
                        value={method.label}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPaymentConfig((prev) => {
                            const arr = [...prev.methods];
                            arr[idx] = { ...arr[idx], label: val };
                            return { ...prev, methods: arr };
                          });
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[44px]"
                        placeholder="PayPal (International)"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-0.5">Payment URL</label>
                      <input
                        type="text"
                        value={method.url}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPaymentConfig((prev) => {
                            const arr = [...prev.methods];
                            arr[idx] = { ...arr[idx], url: val };
                            return { ...prev, methods: arr };
                          });
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[44px]"
                        placeholder="https://paypal.me/coreiqcreate"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-0.5">Details / Memo Memo</label>
                    <input
                      type="text"
                      value={method.details}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPaymentConfig((prev) => {
                          const arr = [...prev.methods];
                          arr[idx] = { ...arr[idx], details: val };
                          return { ...prev, methods: arr };
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[44px]"
                      placeholder="Include your email or application name in the payment reference."
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 flex justify-end">
              <button
                onClick={handleSavePaymentConfig}
                disabled={savingPayment}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-colors disabled:opacity-50 min-h-[44px]"
              >
                {savingPayment ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Payment Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEPPED ADD/EDIT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#05091a] border border-cyan-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_0_30px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {formData.id ? `Edit: ${formData.title}` : 'Add New Application'}
                </h3>
                <p className="text-[11px] font-mono text-cyan-400">Step {formStep} of 4</p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Indicator */}
            <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono shrink-0">
              <button
                onClick={() => setFormStep(1)}
                className={`flex items-center gap-1.5 min-h-[44px] ${formStep === 1 ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}
              >
                <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">1</span>
                <span>Delivery</span>
              </button>
              <span className="text-slate-700">/</span>
              <button
                onClick={() => setFormStep(2)}
                className={`flex items-center gap-1.5 min-h-[44px] ${formStep === 2 ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}
              >
                <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">2</span>
                <span>Details</span>
              </button>
              <span className="text-slate-700">/</span>
              <button
                onClick={() => setFormStep(3)}
                className={`flex items-center gap-1.5 min-h-[44px] ${formStep === 3 ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}
              >
                <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">3</span>
                <span>Media</span>
              </button>
              <span className="text-slate-700">/</span>
              <button
                onClick={() => setFormStep(4)}
                className={`flex items-center gap-1.5 min-h-[44px] ${formStep === 4 ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}
              >
                <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">4</span>
                <span>Pricing</span>
              </button>
            </div>

            {/* Step Content Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* STEP 1: DELIVERY */}
              {formStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-mono font-bold text-slate-300 uppercase">Select Delivery Method</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, deliveryChoice: 'web' })}
                      className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all min-h-[88px] ${
                        formData.deliveryChoice === 'web'
                          ? 'bg-cyan-500/15 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(25,217,255,0.2)]'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <LinkIcon className="w-5 h-5 mb-2 text-cyan-400" />
                      <div>
                        <div className="text-xs font-bold text-white">Web App URL</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Launches in browser tab</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, deliveryChoice: 'file' })}
                      className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all min-h-[88px] ${
                        formData.deliveryChoice === 'file'
                          ? 'bg-cyan-500/15 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(25,217,255,0.2)]'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <FileCode className="w-5 h-5 mb-2 text-cyan-400" />
                      <div>
                        <div className="text-xs font-bold text-white">File Upload</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Zip / installer direct download</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, deliveryChoice: 'external' })}
                      className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all min-h-[88px] ${
                        formData.deliveryChoice === 'external'
                          ? 'bg-cyan-500/15 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(25,217,255,0.2)]'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <ExternalLink className="w-5 h-5 mb-2 text-cyan-400" />
                      <div>
                        <div className="text-xs font-bold text-white">External Link</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">App Store, Google Play, GitHub</div>
                      </div>
                    </button>
                  </div>

                  {(formData.deliveryChoice === 'web' || formData.deliveryChoice === 'external') && (
                    <div className="space-y-2 pt-2">
                      <label className="block text-xs font-mono text-slate-300">
                        {formData.deliveryChoice === 'web' ? 'Web Application URL (https://)' : 'External Portal Link (https://)'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={formData.external_url}
                          onChange={(e) => {
                            setFormData({ ...formData, external_url: e.target.value });
                            setUrlCheckResult(null);
                          }}
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[44px]"
                          placeholder="https://example.com/app"
                        />
                        <button
                          type="button"
                          onClick={() => handleCheckUrl(formData.external_url)}
                          disabled={checkingUrl}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors disabled:opacity-50 min-h-[44px] flex items-center gap-1.5"
                        >
                          {checkingUrl ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                          <span>Check link</span>
                        </button>
                      </div>

                      {urlCheckResult && (
                        <div
                          className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                            urlCheckResult.reachable
                              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                          }`}
                        >
                          {urlCheckResult.reachable ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span>Reachable (Status: {urlCheckResult.status || 200}) — SSRF verified safe.</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-4 h-4 text-rose-400" />
                              <span>Failed check: {urlCheckResult.error || 'Destination unreachable.'}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {formData.deliveryChoice === 'file' && (
                    <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-1">
                      <p className="font-semibold text-cyan-300">File package download mode selected</p>
                      <p className="text-slate-400">
                        You can attach a .zip, .exe, or .dmg file directly up to 50 MB in Step 3 or from the main apps list table.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: APP DETAILS */}
              {formStep === 2 && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono text-slate-300 mb-1">Title *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => {
                          const t = e.target.value;
                          setFormData({
                            ...formData,
                            title: t,
                            slug: formData.slug || t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                          });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[44px]"
                        placeholder="ImageForge"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-300 mb-1">Slug (URL identifier) *</label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 min-h-[44px]"
                        placeholder="imageforge"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Tagline</label>
                    <input
                      type="text"
                      value={formData.tagline}
                      onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[44px]"
                      placeholder="Create and edit stunning images with AI."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Full Description</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      placeholder="Detailed features, capabilities, and system specifications."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-mono text-slate-300 mb-1">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[44px]"
                      >
                        {CATEGORY_OPTIONS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-300 mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[44px]"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="coming_soon">Coming Soon</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-300 mb-1">Version</label>
                      <input
                        type="text"
                        value={formData.version}
                        onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 min-h-[44px]"
                        placeholder="1.0.0"
                      />
                    </div>
                  </div>

                  {/* Icon & Accent Color Picker */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-mono text-slate-300 mb-1">Symbol Icon</label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {ICON_OPTIONS.map((opt) => {
                          const IconC = opt.icon;
                          const isSelected = formData.icon_name === opt.name;
                          return (
                            <button
                              key={opt.name}
                              type="button"
                              onClick={() => setFormData({ ...formData, icon_name: opt.name })}
                              className={`p-2 rounded-lg border min-h-[44px] min-w-[44px] flex items-center justify-center transition-all ${
                                isSelected ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                              }`}
                              title={opt.name}
                            >
                              <IconC className="w-4 h-4" />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-300 mb-1">Accent Theme Color</label>
                      <div className="flex items-center gap-2">
                        {ACCENT_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setFormData({ ...formData, accent_color: c })}
                            className={`w-8 h-8 rounded-full border-2 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center ${
                              formData.accent_color === c ? 'scale-110 border-white' : 'border-transparent'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full" style={{ backgroundColor: c }} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: MEDIA (THUMBNAIL & SCREENSHOTS) */}
              {formStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-mono font-bold text-slate-300 uppercase">App Icon / Thumbnail</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Recommended 512x512 PNG, WebP or JPEG.</p>

                    <div className="flex items-center gap-4 mt-2">
                      <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                        {formData.icon_url ? (
                          <img src={formData.icon_url} alt="App icon" className="w-full h-full object-cover" />
                        ) : (
                          <Sparkles className="w-6 h-6 text-slate-600" />
                        )}
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <label className="inline-block px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer min-h-[44px] transition-colors">
                          <span>{uploadingMedia ? 'Uploading...' : 'Upload Image'}</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={(e) => handleUploadMediaFile(e, true)}
                            disabled={uploadingMedia}
                            className="hidden"
                          />
                        </label>
                        {formData.icon_url && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, icon_url: null })}
                            className="text-[11px] text-rose-400 hover:underline block"
                          >
                            Remove thumbnail
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div>
                        <h4 className="text-xs font-mono font-bold text-slate-300 uppercase">App Screenshots</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Add preview screenshots for app cards & modals.</p>
                      </div>
                      <label className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 cursor-pointer min-h-[44px] flex items-center gap-1 transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Screenshot</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(e) => handleUploadMediaFile(e, false)}
                          disabled={uploadingMedia}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {formData.screenshots.map((sUrl, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-800 aspect-video bg-slate-900">
                          <img src={sUrl} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                screenshots: formData.screenshots.filter((_, i) => i !== idx),
                              })
                            }
                            className="absolute top-1 right-1 p-1 rounded-md bg-black/70 text-rose-400 hover:text-rose-300 min-h-[36px] min-w-[36px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: PRICE & ACCESS */}
              {formStep === 4 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-mono font-bold text-slate-300 uppercase">Price & Acquisition Model</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {(['free', 'paid', 'contact'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setFormData({ ...formData, price_mode: m })}
                        className={`p-3 rounded-xl border text-center font-bold text-xs capitalize transition-all min-h-[44px] ${
                          formData.price_mode === m
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(25,217,255,0.2)]'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  <p className="text-[11px] font-mono text-slate-400 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    ℹ️ <strong>Button Behavior:</strong> Free displays &ldquo;Open app&rdquo; or &ldquo;Download&rdquo;. Paid displays &ldquo;Buy now&rdquo; (or custom label) and opens the direct settlement modal. Contact displays &ldquo;Request access&rdquo; and opens the inquiry intake form.
                  </p>

                  {formData.price_mode === 'paid' && (
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-mono text-slate-300 mb-1">Amount ($) *</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.price_amount}
                            onChange={(e) => setFormData({ ...formData, price_amount: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[44px]"
                            placeholder="49.00"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-mono text-slate-300 mb-1">Currency</label>
                          <input
                            type="text"
                            value={formData.currency}
                            onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 min-h-[44px]"
                            placeholder="USD"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-slate-300 mb-1">Price Note</label>
                        <input
                          type="text"
                          value={formData.price_note}
                          onChange={(e) => setFormData({ ...formData, price_note: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[44px]"
                          placeholder="One-Time License with Full Source"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-slate-300 mb-1">Payment Action Button Label</label>
                        <input
                          type="text"
                          value={formData.payment_label}
                          onChange={(e) => setFormData({ ...formData, payment_label: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[44px]"
                          placeholder="Purchase License"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-slate-300 mb-1">Custom Payment Destination URL</label>
                        <input
                          type="url"
                          value={formData.payment_url}
                          onChange={(e) => setFormData({ ...formData, payment_url: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 min-h-[44px]"
                          placeholder="https://paypal.me/coreiqcreate"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-slate-300 mb-1">Specific Payment Instructions</label>
                        <textarea
                          rows={2}
                          value={formData.payment_instructions}
                          onChange={(e) => setFormData({ ...formData, payment_instructions: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                          placeholder="Leave blank to use global payment instructions."
                        />
                      </div>
                    </div>
                  )}

                  {formData.price_mode === 'contact' && (
                    <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-1">
                      <p className="font-semibold text-amber-300">Contact / Architecture Session Mode</p>
                      <p className="text-slate-400">
                        Visitors will submit an access inquiry via modal, routing directly into your Requests sub-tab.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Stepper Footer */}
            <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between shrink-0">
              {formStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setFormStep((prev) => (prev - 1) as any)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1 min-h-[44px]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              {formStep < 4 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (validateCurrentStep()) setFormStep((prev) => (prev + 1) as any);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1 min-h-[44px]"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveForm}
                  disabled={formSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 flex items-center gap-1.5 shadow-[0_0_15px_rgba(25,217,255,0.3)] disabled:opacity-50 min-h-[44px]"
                >
                  {formSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{formData.id ? 'Save Changes' : 'Create Application'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* APP FILE PACKAGE UPLOAD MODAL */}
      {fileUploadApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <div className="bg-[#05091a] border border-cyan-500/30 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-cyan-400" />
                  <span>Attach Package to {fileUploadApp.title}</span>
                </h3>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Max 50 MB package file. For larger files, use an External link.
                </p>
              </div>
              <button
                onClick={() => setFileUploadApp(null)}
                className="p-1 text-slate-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 text-center space-y-3">
              <input
                type="file"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setSelectedPackageFile(f);
                }}
                className="hidden"
                id="package-file-input"
              />
              <label
                htmlFor="package-file-input"
                className="inline-block px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs cursor-pointer border border-slate-700 min-h-[44px]"
              >
                Choose Application File
              </label>

              {selectedPackageFile ? (
                <div className="text-xs text-white font-mono space-y-1">
                  <div>Selected: {selectedPackageFile.name}</div>
                  <div className="text-slate-400">
                    {(selectedPackageFile.size / (1024 * 1024)).toFixed(2)} MB
                    {selectedPackageFile.size > 50 * 1024 * 1024 && (
                      <span className="text-rose-400 font-bold block mt-1">
                        ⚠️ File exceeds 50 MB limit! Use an External Link instead.
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">Supports .zip, .tar.gz, .dmg, .exe, .apk</p>
              )}
            </div>

            {packageUploadStatus && (
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 flex items-center gap-2">
                {isUploadingPackage && <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />}
                <span>{packageUploadStatus}</span>
              </div>
            )}

            {packageUploadResult && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Upload Completed & Verified</span>
                </div>
                <div>Name: {packageUploadResult.name}</div>
                <div>Size: {(packageUploadResult.size / (1024 * 1024)).toFixed(2)} MB</div>
                <div className="break-all text-[10px]">SHA-256: {packageUploadResult.sha256}</div>
                {packageUploadResult.fallbackMode && (
                  <div className="text-[10px] text-amber-300 mt-1">
                    Note: Stored in local development fallback environment.
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFileUploadApp(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-slate-300 hover:bg-slate-800 min-h-[44px]"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleExecutePackageUpload}
                disabled={!selectedPackageFile || isUploadingPackage || (selectedPackageFile?.size ?? 0) > 50 * 1024 * 1024}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 disabled:opacity-40 min-h-[44px] flex items-center gap-1.5"
              >
                {isUploadingPackage ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                <span>Upload & Hash Package</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACCESS LINKS MODAL */}
      {linksApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#05091a] border border-cyan-500/30 rounded-2xl w-full max-w-xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-violet-400" />
                  <span>Access Links: {linksApp.title}</span>
                </h3>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Generate secure, time-limited download links for authorized customers.
                </p>
              </div>
              <button
                onClick={() => setLinksApp(null)}
                className="p-1 text-slate-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Link Generation Box */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-mono font-bold text-slate-300">Generate New Token Link</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-0.5">Validity (Hours)</label>
                  <select
                    value={newLinkHours}
                    onChange={(e) => setNewLinkHours(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white min-h-[44px]"
                  >
                    <option value={24}>24 Hours (1 Day)</option>
                    <option value={48}>48 Hours (2 Days)</option>
                    <option value={72}>72 Hours (3 Days)</option>
                    <option value={168}>168 Hours (7 Days)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-0.5">Max Uses</label>
                  <input
                    type="number"
                    min={1}
                    value={newLinkMaxUses}
                    onChange={(e) => setNewLinkMaxUses(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-0.5">Note / Client Identifier</label>
                <input
                  type="text"
                  value={newLinkNote}
                  onChange={(e) => setNewLinkNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white min-h-[44px]"
                  placeholder="e.g. Issued to buyer John via PayPal TX#12345"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateLink}
                disabled={generatingLink}
                className="w-full py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-1.5"
              >
                {generatingLink ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                <span>Generate Single-Use Link</span>
              </button>

              {/* Show URL ONCE with Copy button & warning */}
              {generatedLinkUrl && (
                <div className="p-3.5 rounded-xl bg-violet-950/70 border border-violet-500/50 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold text-violet-300">New Access URL:</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLinkUrl);
                        setCopiedLink(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-violet-500 text-slate-950 text-xs font-bold flex items-center gap-1 min-h-[44px]"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Copy URL'}</span>
                    </button>
                  </div>
                  <div className="p-2 rounded bg-black/60 font-mono text-[11px] text-slate-200 break-all select-all">
                    {generatedLinkUrl}
                  </div>
                  <p className="text-[10px] text-amber-300">
                    ⚠️ Copy this URL now. For security, raw token values are never displayed again once this dialog closes.
                  </p>
                </div>
              )}
            </div>

            {/* Existing links table */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold text-slate-400">Existing Links ({accessLinks.length})</h4>
              {loadingLinks && <div className="text-xs text-slate-500 font-mono">Loading links...</div>}
              {!loadingLinks && accessLinks.length === 0 && (
                <div className="text-xs text-slate-500 italic">No access links generated yet.</div>
              )}
              {!loadingLinks && accessLinks.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-1.5">
                  {accessLinks.map((link) => (
                    <div
                      key={link.id}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono flex items-center justify-between"
                    >
                      <div>
                        <div className="text-slate-200">{link.note || 'Untitled link'}</div>
                        <div className="text-slate-500 text-[10px]">
                          Expires: {new Date(link.expires_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                          {link.use_count} / {link.max_uses} used
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setLinksApp(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-slate-300 hover:bg-slate-800 min-h-[44px]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteTargetApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#05091a] border border-rose-500/40 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-white">Delete "{deleteTargetApp.title}"?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete this application? This action will remove the app record and its metadata permanently.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetApp(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-slate-300 hover:bg-slate-800 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteApp}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white min-h-[44px] flex items-center gap-1.5"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DEMO APPS MODAL */}
      {showDeleteDemosModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#05091a] border border-rose-500/40 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <Trash2 className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-white">Remove Demo Seed Applications?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will delete only the demonstration placeholder apps whose IDs begin with <code className="text-cyan-400">app-seed-</code> (such as ImageForge, WritePro, DataMind, and FlowBuilder). Any customized or manually created apps will remain untouched.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteDemosModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-slate-300 hover:bg-slate-800 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDemoApps}
                disabled={isDeletingDemos}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white min-h-[44px] flex items-center gap-1.5"
              >
                {isDeletingDemos && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Remove Demo Apps</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
