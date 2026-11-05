import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldCheck,
  Search,
  Lock,
  X,
  FileCheck,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import {
  fetchAdminDocuments,
  createAdminDocument,
  updateAdminDocument,
  uploadDocumentPdf,
  publishDocument,
  unpublishDocument,
  deleteAdminDocument,
  CreateLegalDocumentPayload,
  UpdateLegalDocumentPayload
} from '../../services/documentsAdmin';
import {
  LegalDocumentItem,
  LegalDocumentCategory,
  LegalDocumentStatus
} from '../../types/command';

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'All Documents' },
  { id: 'legal', label: 'Legal' },
  { id: 'policy', label: 'Policies' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'agreement', label: 'Agreements' },
  { id: 'other', label: 'Other' },
];

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const CommandDocumentsTab: React.FC = () => {
  const [documents, setDocuments] = useState<LegalDocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters & search
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<LegalDocumentItem | null>(null);
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState<LegalDocumentItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form inputs
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategory, setFormCategory] = useState<LegalDocumentCategory>('legal');
  const [formDescription, setFormDescription] = useState('');
  const [formSortOrder, setFormSortOrder] = useState<number>(0);

  // Uploading state
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetUploadDocId = useRef<string | null>(null);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchAdminDocuments();
      setDocuments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  // Helper to slugify title
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Open create modal
  const handleOpenCreate = () => {
    setFormTitle('');
    setFormSlug('');
    setFormCategory('legal');
    setFormDescription('');
    setFormSortOrder((documents.length + 1) * 10);
    setShowCreateModal(true);
  };

  // Open edit modal
  const handleOpenEdit = (doc: LegalDocumentItem) => {
    setEditingDoc(doc);
    setFormTitle(doc.title);
    setFormSlug(doc.slug);
    setFormCategory(doc.category);
    setFormDescription(doc.description || '');
    setFormSortOrder(doc.sort_order ?? 0);
  };

  // Create submission
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const payload: CreateLegalDocumentPayload = {
        title: formTitle.trim(),
        slug: formSlug.trim() ? slugify(formSlug) : slugify(formTitle),
        category: formCategory,
        description: formDescription.trim(),
        sort_order: Number(formSortOrder) || 0,
      };

      const created = await createAdminDocument(payload);
      setDocuments((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order));
      setShowCreateModal(false);
      triggerSuccess(`Document "${created.title}" created successfully.`);
    } catch (err: any) {
      setError(err.message || 'Error creating document');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    if (!formTitle.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const isPublishedEver = editingDoc.published_at != null || editingDoc.status === 'published';
      const payload: UpdateLegalDocumentPayload = {
        title: formTitle.trim(),
        category: formCategory,
        description: formDescription.trim(),
        sort_order: Number(formSortOrder) || 0,
      };

      // Only allow editing slug if it was never published
      if (!isPublishedEver && formSlug.trim()) {
        payload.slug = slugify(formSlug);
      }

      const updated = await updateAdminDocument(editingDoc.id, payload);
      setDocuments((prev) =>
        prev
          .map((d) => (d.id === updated.id ? updated : d))
          .sort((a, b) => a.sort_order - b.sort_order)
      );
      setEditingDoc(null);
      triggerSuccess(`Document "${updated.title}" updated.`);
    } catch (err: any) {
      setError(err.message || 'Error updating document');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Publish / Unpublish
  const handleTogglePublish = async (doc: LegalDocumentItem) => {
    if (doc.status === 'published') {
      try {
        setError(null);
        const updated = await unpublishDocument(doc.id);
        setDocuments((prev) => prev.map((d) => (d.id === doc.id ? updated : d)));
        triggerSuccess(`"${doc.title}" is now unpublished (Draft).`);
      } catch (err: any) {
        setError(err.message || 'Failed to unpublish document');
      }
    } else {
      // Must have file
      const hasFile = Boolean(doc.storage_path || doc.has_file);
      if (!hasFile) {
        setError(`Cannot publish "${doc.title}": You must upload a PDF document first.`);
        return;
      }

      try {
        setError(null);
        const updated = await publishDocument(doc.id);
        setDocuments((prev) => prev.map((d) => (d.id === doc.id ? updated : d)));
        triggerSuccess(`"${doc.title}" is now Published live.`);
      } catch (err: any) {
        setError(err.message || 'Failed to publish document');
      }
    }
  };

  // Trigger file upload for doc
  const handleTriggerUpload = (docId: string) => {
    targetUploadDocId.current = docId;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const docId = targetUploadDocId.current;
    if (!file || !docId) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setError('Invalid file type. Only PDF documents (.pdf) are allowed.');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError('File exceeds maximum size of 4MB for PayFast compliance documents.');
      return;
    }

    try {
      setUploadingDocId(docId);
      setError(null);
      const updated = await uploadDocumentPdf(docId, file);
      setDocuments((prev) => prev.map((d) => (d.id === docId ? updated : d)));
      triggerSuccess(`PDF uploaded for "${updated.title}" (v${updated.version}).`);
    } catch (err: any) {
      setError(err.message || 'Failed to upload PDF');
    } finally {
      setUploadingDocId(null);
      targetUploadDocId.current = null;
    }
  };

  // Delete document
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmDoc) return;
    try {
      setError(null);
      await deleteAdminDocument(deleteConfirmDoc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== deleteConfirmDoc.id));
      triggerSuccess(`Document "${deleteConfirmDoc.title}" deleted.`);
      setDeleteConfirmDoc(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete document');
    }
  };

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (selectedCategory !== 'all' && doc.category !== selectedCategory) return false;
      if (statusFilter === 'published' && doc.status !== 'published') return false;
      if (statusFilter === 'draft' && doc.status === 'published') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = doc.title.toLowerCase().includes(q);
        const matchesSlug = doc.slug.toLowerCase().includes(q);
        const matchesDesc = (doc.description || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesSlug && !matchesDesc) return false;
      }
      return true;
    });
  }, [documents, selectedCategory, statusFilter, searchQuery]);

  const publishedCount = documents.filter((d) => d.status === 'published').length;
  const draftCount = documents.filter((d) => d.status !== 'published').length;

  return (
    <div className="space-y-6">
      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-[#0d1630] to-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Document Manager
                <span className="text-[11px] font-mono font-normal px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  PayFast Compliance
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Manage legal terms, refund policies, and compliance PDFs for the About page.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDocuments}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800/80 text-slate-300 hover:text-white transition-colors"
            title="Refresh Documents"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]"
          >
            <Plus className="w-4 h-4" />
            <span>New Document</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-sm flex items-start gap-3 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Action Error</span>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-sm flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Status selector */}
          <div className="flex items-center rounded-lg bg-slate-800/80 p-0.5 border border-slate-700">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                statusFilter === 'all' ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({documents.length})
            </button>
            <button
              onClick={() => setStatusFilter('published')}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                statusFilter === 'published' ? 'bg-emerald-500/20 text-emerald-300 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Published ({publishedCount})
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                statusFilter === 'draft' ? 'bg-amber-500/20 text-amber-300 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Drafts ({draftCount})
            </button>
          </div>

          {/* Search box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Main Document List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-sm font-mono">Loading legal compliance documents...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
          <FileText className="w-12 h-12 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-300">No documents found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No legal documents match your current filter. Adjust filters or create a new entry.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Document</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocuments.map((doc) => {
            const isPublished = doc.status === 'published';
            const hasFile = Boolean(doc.storage_path || doc.has_file);
            const isUploading = uploadingDocId === doc.id;

            return (
              <div
                key={doc.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isPublished
                    ? 'bg-gradient-to-br from-slate-900/90 via-[#0c142b]/80 to-slate-900/90 border-slate-700/80 shadow-lg'
                    : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700/60'
                }`}
              >
                {/* Card Top */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                          {doc.category}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          Order: {doc.sort_order}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white truncate" title={doc.title}>
                        {doc.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
                        <span className="text-slate-500">/</span>
                        <span className="text-slate-300 truncate">{doc.slug}</span>
                      </div>
                    </div>

                    {/* Status Chip */}
                    <div>
                      {isPublished ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          Draft
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {doc.description && (
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {doc.description}
                    </p>
                  )}

                  {/* Attachment Status Box */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3">
                    {hasFile ? (
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                          <FileCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-200 truncate">
                              {doc.file_name || `${doc.slug}.pdf`}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300">
                              v{doc.version || 1}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                            <span>{formatBytes(doc.file_size_bytes)}</span>
                            {doc.file_sha256 && (
                              <span className="truncate max-w-[120px]" title={`SHA256: ${doc.file_sha256}`}>
                                sha: {doc.file_sha256.substring(0, 8)}...
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-amber-400/90 font-mono">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                        <span>No PDF attached — upload required</span>
                      </div>
                    )}

                    {/* Quick upload / replace button */}
                    <button
                      onClick={() => handleTriggerUpload(doc.id)}
                      disabled={isUploading}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <Upload className={`w-3.5 h-3.5 ${isUploading ? 'animate-spin text-cyan-400' : ''}`} />
                      <span>{isUploading ? 'Uploading...' : hasFile ? 'Replace PDF' : 'Upload PDF'}</span>
                    </button>
                  </div>
                </div>

                {/* Card Actions Bottom */}
                <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Publish / Unpublish Toggle */}
                    <button
                      onClick={() => handleTogglePublish(doc)}
                      disabled={!hasFile && !isPublished}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isPublished
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                          : hasFile
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                          : 'bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed'
                      }`}
                      title={!hasFile ? 'Attach a PDF first to publish' : ''}
                    >
                      {isPublished ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Unpublish</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Publish</span>
                        </>
                      )}
                    </button>

                    {/* Preview link if published or has url */}
                    {isPublished && (
                      <a
                        href={`/api/v1/documents/${doc.slug}/file`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-cyan-300 text-xs font-medium transition-colors"
                        title="Open public PDF URL"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Public Link</span>
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(doc)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                      title="Edit metadata"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeleteConfirmDoc(doc)}
                      className="p-1.5 rounded-lg hover:bg-red-950/40 text-slate-500 hover:text-red-400 transition-colors"
                      title="Delete document"
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

      {/* CREATE DOCUMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Create New Document</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Document Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Terms and Conditions"
                  value={formTitle}
                  onChange={(e) => {
                    setFormTitle(e.target.value);
                    if (!formSlug || formSlug === slugify(formTitle)) {
                      setFormSlug(slugify(e.target.value));
                    }
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as LegalDocumentCategory)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="legal">Legal</option>
                    <option value="policy">Policy</option>
                    <option value="compliance">Compliance</option>
                    <option value="agreement">Agreement</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Sort Order</label>
                  <input
                    type="number"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">URL Slug</label>
                <div className="flex items-center rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-400">
                  <span className="text-slate-500 select-none mr-1">/documents/</span>
                  <input
                    type="text"
                    placeholder="terms-and-conditions"
                    value={formSlug}
                    onChange={(e) => setFormSlug(slugify(e.target.value))}
                    className="flex-1 bg-transparent text-white focus:outline-none font-mono text-xs"
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-sans">
                  The slug is permanently locked once published to prevent breaking public links.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of what this document covers..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all"
                >
                  {isSubmitting ? 'Creating...' : 'Create Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DOCUMENT MODAL */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Edit Document</h3>
              </div>
              <button
                onClick={() => setEditingDoc(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Document Title *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as LegalDocumentCategory)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="legal">Legal</option>
                    <option value="policy">Policy</option>
                    <option value="compliance">Compliance</option>
                    <option value="agreement">Agreement</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Sort Order</label>
                  <input
                    type="number"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">URL Slug</label>
                  {(editingDoc.published_at || editingDoc.status === 'published') && (
                    <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Locked (Published)
                    </span>
                  )}
                </div>
                <div className={`flex items-center rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-sm ${
                  (editingDoc.published_at || editingDoc.status === 'published') ? 'opacity-60 cursor-not-allowed' : ''
                }`}>
                  <span className="text-slate-500 select-none mr-1">/documents/</span>
                  <input
                    type="text"
                    value={formSlug}
                    disabled={Boolean(editingDoc.published_at || editingDoc.status === 'published')}
                    onChange={(e) => setFormSlug(slugify(e.target.value))}
                    className="flex-1 bg-transparent text-white focus:outline-none font-mono text-xs disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirmDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2 rounded-xl bg-red-950/50 border border-red-500/30">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Document</h3>
            </div>

            <p className="text-sm text-slate-300">
              Are you sure you want to delete <strong className="text-white">"{deleteConfirmDoc.title}"</strong>?
              Any uploaded PDF in storage will be removed. This cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmDoc(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors"
              >
                Delete Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
