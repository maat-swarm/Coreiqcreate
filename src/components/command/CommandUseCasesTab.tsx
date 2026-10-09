import React, { useState, useEffect, useRef } from 'react';
import { 
  Briefcase, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Upload, 
  FileText, 
  Download, 
  RefreshCw, 
  X, 
  AlertTriangle, 
  Image as ImageIcon,
  Building2,
  User,
  Users,
  Eye,
  EyeOff,
  FolderOpen,
  Check
} from 'lucide-react';
import { UseCase, UseCaseCategory, UseCaseFile, UseCaseAudience } from '../../types/useCases';

function getAuthHeaders(isJson = true): Record<string, string> {
  const headers: Record<string, string> = {
    'x-operator-auth': 'true',
  };
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (typeof window !== 'undefined') {
    let rawDevKey = '';
    try {
      if (window.localStorage) {
        rawDevKey = localStorage.getItem('coreiq_api_key_master') || '';
      }
    } catch {}

    if (rawDevKey) {
      headers['Authorization'] = `Bearer ${rawDevKey}`;
    } else {
      headers['Authorization'] = 'Bearer ciq_live_devmaster_00000000000000000000000000000000';
    }
  }
  return headers;
}

export const CommandUseCasesTab: React.FC = () => {
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [categories, setCategories] = useState<UseCaseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter by category in manager view
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modals & form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUseCase, setEditingUseCase] = useState<UseCase | null>(null);
  const [fileManagerUseCase, setFileManagerUseCase] = useState<UseCase | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // New use case form inputs
  const [formCategory, setFormCategory] = useState('ai-agents');
  const [formTitle, setFormTitle] = useState('');
  const [formProblem, setFormProblem] = useState('');
  const [formApproach, setFormApproach] = useState('');
  const [formOutcome, setFormOutcome] = useState('');
  const [formAudience, setFormAudience] = useState<UseCaseAudience>('business');
  const [formIndustryTags, setFormIndustryTags] = useState('');
  const [formPublished, setFormPublished] = useState(false);

  // Image upload
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const activeImageUseCaseId = useRef<string | null>(null);

  // File upload state in file manager
  const [newFileLabel, setNewFileLabel] = useState('');
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [ucRes, catRes] = await Promise.all([
        fetch('/api/v1/admin/use-cases', { headers: getAuthHeaders(true) }),
        fetch('/api/v1/use-cases/categories', { headers: getAuthHeaders(true) }),
      ]);

      if (!ucRes.ok) throw new Error('Failed to load admin use cases');
      const ucData = await ucRes.json();
      const catData = await catRes.json();

      setUseCases(ucData.use_cases || []);
      setCategories(catData.categories || []);
    } catch (err: any) {
      setError(err.message || 'Error loading use cases');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  // Toggle published
  const handleTogglePublished = async (uc: UseCase) => {
    const nextPublished = !uc.published;
    setUseCases((prev) =>
      prev.map((item) => (item.id === uc.id ? { ...item, published: nextPublished } : item))
    );

    try {
      const res = await fetch(`/api/v1/admin/use-cases/${uc.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(true),
        body: JSON.stringify({ published: nextPublished }),
      });
      if (!res.ok) throw new Error('Failed to update published status');
      triggerSuccess(`"${uc.title}" is now ${nextPublished ? 'Published' : 'Unpublished'}`);
    } catch (e: any) {
      // Revert
      setUseCases((prev) =>
        prev.map((item) => (item.id === uc.id ? { ...item, published: uc.published } : item))
      );
      setError(e.message || 'Failed to update use case');
    }
  };

  // Create use case
  const handleCreateUseCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formProblem || !formApproach || !formOutcome) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const tags = formIndustryTags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const res = await fetch('/api/v1/admin/use-cases', {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          category_slug: formCategory,
          title: formTitle,
          problem: formProblem,
          approach: formApproach,
          outcome: formOutcome,
          audience: formAudience,
          industry_tags: tags,
          published: formPublished,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create use case');
      }

      setShowCreateModal(false);
      setFormTitle('');
      setFormProblem('');
      setFormApproach('');
      setFormOutcome('');
      setFormIndustryTags('');
      setFormPublished(false);
      triggerSuccess('New Use Case created successfully');
      loadData();
    } catch (e: any) {
      setError(e.message || 'Error creating use case');
    }
  };

  // Edit use case submit
  const handleUpdateUseCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUseCase) return;

    try {
      const tags = typeof formIndustryTags === 'string'
        ? formIndustryTags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
        : editingUseCase.industry_tags;

      const res = await fetch(`/api/v1/admin/use-cases/${editingUseCase.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          category_slug: formCategory,
          title: formTitle,
          problem: formProblem,
          approach: formApproach,
          outcome: formOutcome,
          audience: formAudience,
          industry_tags: tags,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to update use case');
      }

      const data = await res.json();
      setUseCases((prev) =>
        prev.map((item) => (item.id === editingUseCase.id ? data.use_case : item))
      );
      setEditingUseCase(null);
      triggerSuccess(`"${formTitle}" updated successfully`);
    } catch (e: any) {
      setError(e.message || 'Error updating use case');
    }
  };

  // Open edit modal
  const openEditModal = (uc: UseCase) => {
    setEditingUseCase(uc);
    setFormCategory(uc.category_slug);
    setFormTitle(uc.title);
    setFormProblem(uc.problem);
    setFormApproach(uc.approach);
    setFormOutcome(uc.outcome);
    setFormAudience(uc.audience);
    setFormIndustryTags((uc.industry_tags || []).join(', '));
  };

  // Delete use case
  const handleDeleteUseCase = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/admin/use-cases/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(true),
      });
      if (!res.ok) throw new Error('Failed to delete use case');
      setUseCases((prev) => prev.filter((item) => item.id !== id));
      setDeleteConfirmId(null);
      triggerSuccess('Use case deleted');
      loadData();
    } catch (e: any) {
      setError(e.message || 'Error deleting use case');
    }
  };

  // Image Upload trigger
  const triggerImageUpload = (useCaseId: string) => {
    activeImageUseCaseId.current = useCaseId;
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
      imageInputRef.current.click();
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const ucId = activeImageUseCaseId.current;
    if (!file || !ucId) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }

    try {
      setUploadingImageId(ucId);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt', file.name.replace(/\.[^/.]+$/, ''));

      const res = await fetch(`/api/v1/use-cases/${ucId}/image`, {
        method: 'POST',
        headers: getAuthHeaders(false),
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to upload image');
      }

      const data = await res.json();
      setUseCases((prev) =>
        prev.map((item) =>
          item.id === ucId
            ? { ...item, image_url: data.image_url, image_alt: data.image_alt }
            : item
        )
      );
      triggerSuccess('Use case image updated');
    } catch (err: any) {
      setError(err.message || 'Error uploading image');
    } finally {
      setUploadingImageId(null);
      activeImageUseCaseId.current = null;
    }
  };

  // File Upload in File Manager
  const handleUploadFileToUseCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileManagerUseCase || !selectedUploadFile) return;

    if (selectedUploadFile.size > 50 * 1024 * 1024) {
      setError('File must be under 50MB');
      return;
    }

    try {
      setIsUploadingFile(true);
      const formData = new FormData();
      formData.append('file', selectedUploadFile);
      formData.append('label', newFileLabel || selectedUploadFile.name);

      const res = await fetch(`/api/v1/use-cases/${fileManagerUseCase.id}/files`, {
        method: 'POST',
        headers: getAuthHeaders(false),
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to upload file');
      }

      const data = await res.json();
      const updatedFiles = [...(fileManagerUseCase.files || []), data.file];
      const updatedUseCase = { ...fileManagerUseCase, files: updatedFiles };

      setFileManagerUseCase(updatedUseCase);
      setUseCases((prev) =>
        prev.map((item) => (item.id === fileManagerUseCase.id ? updatedUseCase : item))
      );

      setSelectedUploadFile(null);
      setNewFileLabel('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      triggerSuccess('Downloadable file uploaded successfully');
    } catch (err: any) {
      setError(err.message || 'Error uploading file');
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Delete file
  const handleDeleteFile = async (fileId: string) => {
    if (!fileManagerUseCase) return;
    try {
      const res = await fetch(`/api/v1/use-cases/${fileManagerUseCase.id}/files/${fileId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(true),
      });

      if (!res.ok) throw new Error('Failed to delete file');

      const updatedFiles = (fileManagerUseCase.files || []).filter((f) => f.id !== fileId);
      const updatedUseCase = { ...fileManagerUseCase, files: updatedFiles };

      setFileManagerUseCase(updatedUseCase);
      setUseCases((prev) =>
        prev.map((item) => (item.id === fileManagerUseCase.id ? updatedUseCase : item))
      );
      triggerSuccess('File removed');
    } catch (err: any) {
      setError(err.message || 'Error removing file');
    }
  };

  const displayedUseCases = useCases.filter(
    (uc) => categoryFilter === 'all' || uc.category_slug === categoryFilter
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Hidden file input for image uploads */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageFileChange}
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
      />

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

      {/* 5b — CATEGORY OVERVIEW */}
      <div className="rounded-2xl bg-[#070d1f]/80 border border-slate-800/80 p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Briefcase className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">
              Category Overview
            </h3>
          </div>
          <button
            onClick={loadData}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh use cases"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {categories.map((cat) => (
            <div
              key={cat.id || cat.slug}
              onClick={() => setCategoryFilter(categoryFilter === cat.slug ? 'all' : cat.slug)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                categoryFilter === cat.slug
                  ? 'bg-cyan-500/15 border-cyan-400 shadow-[0_0_15px_rgba(25,217,255,0.2)]'
                  : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold text-white truncate">{cat.label}</div>
              <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Total: {cat.use_cases_count || 0}</span>
                <span className="text-cyan-400 font-semibold">
                  Pub: {cat.published_count || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5a — USE CASE MANAGER */}
      <div className="rounded-2xl bg-[#070d1f]/80 border border-slate-800/80 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
              <span>Use Case Manager</span>
              <span className="text-xs font-mono font-normal text-slate-400">
                ({displayedUseCases.length} records)
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage scenario cards, publishing flags, photographic hero assets, and downloadable documentation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setFormCategory('ai-agents');
                setFormTitle('');
                setFormProblem('');
                setFormApproach('');
                setFormOutcome('');
                setFormAudience('business');
                setFormIndustryTags('');
                setFormPublished(false);
                setShowCreateModal(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-colors shadow-[0_0_15px_rgba(25,217,255,0.3)] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Use Case</span>
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
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => setCategoryFilter(c.slug)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                categoryFilter === c.slug
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Use Cases Table / List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">Title & Problem</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Audience</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Hero Image</th>
                <th className="py-3 px-3">Files</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayedUseCases.map((uc) => {
                const catObj = categories.find((c) => c.slug === uc.category_slug);
                const fileCount = uc.files ? uc.files.length : 0;
                const isUploadingThisImage = uploadingImageId === uc.id;

                return (
                  <tr key={uc.id} className="hover:bg-slate-900/50 transition-colors">
                    {/* Title & snippet */}
                    <td className="py-3.5 px-3 max-w-xs">
                      <div className="font-bold text-white text-xs leading-snug truncate">
                        {uc.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {uc.problem}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                        {catObj?.label || uc.category_slug}
                      </span>
                    </td>

                    {/* Audience */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="capitalize text-slate-300 text-[11px] flex items-center gap-1">
                        {uc.audience === 'personal' && <User className="w-3 h-3 text-sky-400" />}
                        {uc.audience === 'business' && <Building2 className="w-3 h-3 text-cyan-400" />}
                        {uc.audience === 'both' && <Users className="w-3 h-3 text-emerald-400" />}
                        <span>{uc.audience}</span>
                      </span>
                    </td>

                    {/* Status toggle */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <button
                        onClick={() => handleTogglePublished(uc)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                          uc.published
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                            : 'bg-slate-800/90 text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                        title="Click to toggle publish status"
                      >
                        {uc.published ? (
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

                    {/* Hero Image status & upload */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {uc.image_url ? (
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                            <img src={uc.image_url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-slate-600">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                        <button
                          onClick={() => triggerImageUpload(uc.id)}
                          disabled={isUploadingThisImage}
                          className="px-2 py-1 rounded text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                        >
                          {isUploadingThisImage ? 'Uploading...' : uc.image_url ? 'Replace' : 'Upload'}
                        </button>
                      </div>
                    </td>

                    {/* File count & Manage files */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <button
                        onClick={() => setFileManagerUseCase(uc)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-colors cursor-pointer"
                      >
                        <FolderOpen className="w-3 h-3 text-cyan-400" />
                        <span>{fileCount} {fileCount === 1 ? 'file' : 'files'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3 whitespace-nowrap text-right space-x-1">
                      <button
                        onClick={() => openEditModal(uc)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Edit use case"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {deleteConfirmId === uc.id ? (
                        <div className="inline-flex items-center gap-1 bg-red-950/80 px-2 py-1 rounded border border-red-800">
                          <span className="text-[10px] text-red-200 font-bold">Sure?</span>
                          <button
                            onClick={() => handleDeleteUseCase(uc.id)}
                            className="text-[10px] text-red-400 font-bold hover:underline"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-[10px] text-slate-400 hover:text-white"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(uc.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                          title="Delete use case"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: CREATE USE CASE */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-[#090f24] border border-slate-700 shadow-2xl p-6 sm:p-8 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-cyan-400" />
                <span>Create New Use Case</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUseCase} className="space-y-4">
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
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Audience *
                  </label>
                  <select
                    value={formAudience}
                    onChange={(e) => setFormAudience(e.target.value as UseCaseAudience)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  >
                    <option value="business">Business</option>
                    <option value="personal">Personal</option>
                    <option value="both">Both (Business & Personal)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Intelligent Invoice Processing Pipeline"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  The Problem *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="What friction, cost, or delay was occurring?"
                  value={formProblem}
                  onChange={(e) => setFormProblem(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Approach / What We Do *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="How does Core IQ design and deploy the solution?"
                  value={formApproach}
                  onChange={(e) => setFormApproach(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  The Outcome *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Measurable results, hours reclaimed, conversion rate increase..."
                  value={formOutcome}
                  onChange={(e) => setFormOutcome(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Industry Tags (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="retail, finance, legal, healthcare..."
                  value={formIndustryTags}
                  onChange={(e) => setFormIndustryTags(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="create-published-check"
                  checked={formPublished}
                  onChange={(e) => setFormPublished(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="create-published-check" className="text-xs text-slate-300 cursor-pointer select-none">
                  Publish immediately (visible on public /use-cases page)
                </label>
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
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-[0_0_15px_rgba(25,217,255,0.3)]"
                >
                  Create Use Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT USE CASE */}
      {editingUseCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-[#090f24] border border-slate-700 shadow-2xl p-6 sm:p-8 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-400" />
                <span>Edit Use Case: {editingUseCase.title}</span>
              </h3>
              <button
                onClick={() => setEditingUseCase(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUseCase} className="space-y-4">
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
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Audience *
                  </label>
                  <select
                    value={formAudience}
                    onChange={(e) => setFormAudience(e.target.value as UseCaseAudience)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  >
                    <option value="business">Business</option>
                    <option value="personal">Personal</option>
                    <option value="both">Both (Business & Personal)</option>
                  </select>
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
                  The Problem *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formProblem}
                  onChange={(e) => setFormProblem(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Approach / What We Do *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formApproach}
                  onChange={(e) => setFormApproach(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  The Outcome *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formOutcome}
                  onChange={(e) => setFormOutcome(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Industry Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formIndustryTags}
                  onChange={(e) => setFormIndustryTags(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUseCase(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-[0_0_15px_rgba(25,217,255,0.3)]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: FILE MANAGER PANEL */}
      {fileManagerUseCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl bg-[#090f24] border border-slate-700 shadow-2xl p-6 sm:p-8 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-cyan-400" />
                  <span>Downloadable Documents & Specs</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md">
                  {fileManagerUseCase.title}
                </p>
              </div>
              <button
                onClick={() => setFileManagerUseCase(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List existing files */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                Existing Attached Files ({fileManagerUseCase.files?.length || 0})
              </span>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {(fileManagerUseCase.files || []).length > 0 ? (
                  (fileManagerUseCase.files || []).map((file) => (
                    <div
                      key={file.id}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                        <div className="truncate">
                          <div className="font-semibold text-white truncate">{file.label}</div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">
                            {file.filename} · {file.file_type.toUpperCase()}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors shrink-0"
                        title="Remove file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 bg-slate-900/40 rounded-xl border border-slate-800 text-xs text-slate-500">
                    No files attached to this use case yet.
                  </div>
                )}
              </div>
            </div>

            {/* Add File Uploader */}
            <form onSubmit={handleUploadFileToUseCase} className="pt-4 border-t border-slate-800 space-y-4">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono block">
                Attach New Downloadable Asset
              </span>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  File Label (Displayed to visitors) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Case Study PDF, Executive Summary, Slide Deck..."
                  value={newFileLabel}
                  onChange={(e) => setNewFileLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Select File (Any file type: PDF, DOCX, PPTX, etc. — Max 50MB) *
                </label>
                <input
                  type="file"
                  required
                  ref={fileInputRef}
                  onChange={(e) => setSelectedUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-cyan-300 hover:file:bg-slate-700 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFileManagerUseCase(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={!selectedUploadFile || isUploadingFile}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 transition-colors shadow-[0_0_15px_rgba(25,217,255,0.3)] flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingFile ? 'Uploading...' : 'Upload File'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
