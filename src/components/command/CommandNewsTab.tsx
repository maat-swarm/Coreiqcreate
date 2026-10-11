import React, { useState, useEffect, useRef } from 'react';
import { 
  Newspaper, 
  Plus, 
  Search, 
  RefreshCw, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Sparkles, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Upload, 
  ExternalLink,
  Tag,
  Clock,
  User,
  Flame,
  FileText
} from 'lucide-react';
import { NewsArticleItem } from '../../types/command';
import { getAuthHeaders } from '../../services/supabase';

const CATEGORIES = [
  'All',
  'Frontier Models',
  'Autonomous Agents',
  'Breakthroughs',
  'Tools & Protocols',
  'Enterprise & Cloud',
];

const ACCENT_COLORS = ['cyan', 'purple', 'blue', 'amber', 'emerald'];

export const CommandNewsTab: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticleItem | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formCategory, setFormCategory] = useState('Frontier Models');
  const [formAuthor, setFormAuthor] = useState('CoreIQ Intelligence Desk');
  const [formReadTime, setFormReadTime] = useState('4 min read');
  const [formBadge, setFormBadge] = useState('UPDATE');
  const [formFeatured, setFormFeatured] = useState(false);
  const [formTags, setFormTags] = useState('');
  const [formTakeaways, setFormTakeaways] = useState('');
  const [formAccentColor, setFormAccentColor] = useState('cyan');
  const [formPublished, setFormPublished] = useState(true);
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [heroImageUrl, setHeroImageUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchArticles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch('/api/v1/admin/news', { headers });
      if (!res.ok) {
        throw new Error(`Failed to load news articles (${res.status})`);
      }
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (err: any) {
      console.error('Fetch news error:', err);
      setError(err.message || 'Error fetching news articles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const openCreateModal = () => {
    setEditingArticle(null);
    setFormTitle('');
    setFormSlug('');
    setFormSummary('');
    setFormBody('');
    setFormCategory('Frontier Models');
    setFormAuthor('CoreIQ Intelligence Desk');
    setFormReadTime('4 min read');
    setFormBadge('UPDATE');
    setFormFeatured(false);
    setFormTags('');
    setFormTakeaways('');
    setFormAccentColor('cyan');
    setFormPublished(true);
    setHeroImageFile(null);
    setHeroImageUrl('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (article: NewsArticleItem) => {
    setEditingArticle(article);
    setFormTitle(article.title);
    setFormSlug(article.slug);
    setFormSummary(article.summary);
    setFormBody(article.body);
    setFormCategory(article.category);
    setFormAuthor(article.author);
    setFormReadTime(article.read_time);
    setFormBadge(article.badge || 'UPDATE');
    setFormFeatured(Boolean(article.featured));
    setFormTags(article.tags ? article.tags.join(', ') : '');
    setFormTakeaways(article.takeaways ? article.takeaways.join('\n') : '');
    setFormAccentColor(article.accent_color || 'cyan');
    setFormPublished(Boolean(article.published));
    setHeroImageFile(null);
    setHeroImageUrl(article.hero_image || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setFormTitle(val);
    if (!editingArticle) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormSlug(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formSlug.trim() || !formSummary.trim() || !formBody.trim()) {
      setFormError('Please fill in title, slug, summary, and markdown body.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    const tagsArray = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const takeawaysArray = formTakeaways
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title: formTitle.trim(),
      slug: formSlug.trim(),
      summary: formSummary.trim(),
      body: formBody.trim(),
      category: formCategory,
      author: formAuthor.trim() || 'CoreIQ Intelligence Desk',
      read_time: formReadTime.trim() || '4 min read',
      badge: formBadge.trim() || 'UPDATE',
      featured: formFeatured,
      tags: tagsArray,
      takeaways: takeawaysArray,
      accent_color: formAccentColor,
      published: formPublished,
      hero_image: heroImageUrl || null,
    };

    try {
      const headers = await getAuthHeaders(true);
      let targetId = editingArticle?.id;

      if (editingArticle) {
        // Update
        const res = await fetch(`/api/v1/admin/news/${editingArticle.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `Update failed (${res.status})`);
        }
      } else {
        // Create
        const res = await fetch('/api/v1/admin/news', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `Creation failed (${res.status})`);
        }
        const created = await res.json();
        targetId = created.article?.id;
      }

      // Handle image upload if a file was selected
      if (heroImageFile && targetId) {
        const formData = new FormData();
        formData.append('image', heroImageFile);
        const authH = await getAuthHeaders(false);
        const imgRes = await fetch(`/api/v1/admin/news/${targetId}/image`, {
          method: 'POST',
          headers: authH,
          body: formData,
        });
        if (!imgRes.ok) {
          console.warn('Image upload error:', await imgRes.text());
        }
      }

      showToast(editingArticle ? 'Article updated successfully' : 'Article created successfully');
      setIsModalOpen(false);
      fetchArticles();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleTogglePublished = async (article: NewsArticleItem) => {
    try {
      const headers = await getAuthHeaders(true);
      const nextState = !article.published;
      const res = await fetch(`/api/v1/admin/news/${article.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ published: nextState }),
      });
      if (!res.ok) throw new Error('Toggle failed');
      setArticles((prev) =>
        prev.map((a) => (a.id === article.id ? { ...a, published: nextState } : a))
      );
      showToast(nextState ? 'Article published' : 'Article moved to draft');
    } catch (err: any) {
      alert(`Error toggling status: ${err.message}`);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch(`/api/v1/admin/news/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Delete failed');
      setArticles((prev) => prev.filter((a) => a.id !== id));
      showToast('Article deleted');
    } catch (err: any) {
      alert(`Error deleting article: ${err.message}`);
    }
  };

  const filteredArticles = articles.filter((a) => {
    const matchesCat = selectedCategory === 'All' || a.category === selectedCategory;
    const matchesQuery =
      searchQuery.trim() === '' ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.slug.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-cyan-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-[0_0_25px_rgba(25,217,255,0.4)] flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/40 border border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Newspaper className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-white font-display">AI News Dispatch Manager</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Publish, edit, and orchestrate frontier AI updates, intelligence briefings, and research dispatches.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={fetchArticles}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors min-h-[40px] flex items-center justify-center"
            title="Refresh articles"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 shadow-[0_0_15px_rgba(34,211,238,0.35)] flex items-center justify-center gap-1.5 transition-all min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            <span>New Article</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/30 border border-slate-800/80">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search news by title, summary, or slug..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Table / Cards */}
      {isLoading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading articles from database...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-950/20 border border-red-500/30 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <p className="text-sm text-red-300">{error}</p>
          <button
            onClick={fetchArticles}
            className="px-4 py-1.5 rounded-lg text-xs bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/40"
          >
            Retry
          </button>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-slate-900/20 border border-slate-800/80 p-8 space-y-3">
          <Sparkles className="w-8 h-8 text-cyan-400 mx-auto opacity-70" />
          <h3 className="text-sm font-bold text-white">No articles found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No articles match your active filter. Create a new article or reset filters.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors"
          >
            Create First Article
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              className="group p-5 rounded-2xl bg-[#060b1c]/80 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                    {article.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {article.featured && (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40 flex items-center gap-0.5">
                        <Flame className="w-2.5 h-2.5" />
                        <span>Featured</span>
                      </span>
                    )}
                    <button
                      onClick={() => handleTogglePublished(article)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
                        article.published
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50 hover:bg-emerald-900/60'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                      title={article.published ? 'Click to unpublish' : 'Click to publish'}
                    >
                      {article.published ? (
                        <>
                          <Eye className="w-2.5 h-2.5 text-emerald-400" />
                          <span>Published</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-2.5 h-2.5" />
                          <span>Draft</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                  {article.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {article.summary}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1 border-t border-slate-800/60 font-mono">
                  <span className="truncate">{article.author}</span>
                  <span>•</span>
                  <span>{article.read_time}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                <a
                  href={`/news#${article.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <span>View live</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(article)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                    title="Edit article"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(article.id, article.title)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950/60 text-slate-400 hover:text-red-300 border border-slate-800 hover:border-red-800 transition-colors"
                    title="Delete article"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#02050f]/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#060b1c] border border-cyan-500/30 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(25,217,255,0.15)] overflow-hidden my-6">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Newspaper className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-base font-bold text-white font-display">
                  {editingArticle ? 'Edit Article' : 'Compose News Article'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title & Slug */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Article Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Gemini 3.0 Reasoning Models Released..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">URL Slug *</label>
                <input
                  type="text"
                  required
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="gemini-3-multimodal-reasoning"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Category & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Badge Label</label>
                  <input
                    type="text"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    placeholder="BREAKING, BENCHMARK, UPDATE..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Author & Read Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Author</label>
                  <input
                    type="text"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="CoreIQ Intelligence Desk"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Read Time</label>
                  <input
                    type="text"
                    value={formReadTime}
                    onChange={(e) => setFormReadTime(e.target.value)}
                    placeholder="4 min read"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Executive Summary *</label>
                <textarea
                  rows={2}
                  required
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="2-3 sentence overview highlighting the breakthrough..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Markdown Body */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Markdown Body *</label>
                <textarea
                  rows={7}
                  required
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  placeholder="Full markdown article content with # headings, bullet points, code blocks..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Tags & Takeaways */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Tags (comma separated)</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="Gemini, Multimodal, Reasoning, Benchmarks"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Executive Takeaways (one per line)</label>
                <textarea
                  rows={3}
                  value={formTakeaways}
                  onChange={(e) => setFormTakeaways(e.target.value)}
                  placeholder="Speculative tool execution reduces latency by 40%&#10;Unified token space replaces cascaded models"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Hero Image (optional)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setHeroImageFile(e.target.files[0]);
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{heroImageFile ? heroImageFile.name : 'Choose Image File'}</span>
                  </button>
                  <input
                    type="text"
                    value={heroImageUrl}
                    onChange={(e) => setHeroImageUrl(e.target.value)}
                    placeholder="Or enter image URL..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Featured & Published */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={formFeatured}
                    onChange={(e) => setFormFeatured(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-0"
                  />
                  <span>Featured Hero Article</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={formPublished}
                    onChange={(e) => setFormPublished(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-0"
                  />
                  <span>Publish Immediately</span>
                </label>
              </div>

              {/* Form buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 shadow-[0_0_15px_rgba(34,211,238,0.35)] flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {formSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingArticle ? 'Save Changes' : 'Create Article'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
