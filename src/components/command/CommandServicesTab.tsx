import React, { useState, useEffect, useCallback } from 'react';
import {
  Save,
  RotateCcw,
  Sparkles,
  Check,
  AlertTriangle,
  Globe,
  HelpCircle,
  Layers,
  ArrowRight,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sliders,
  FileText,
  Workflow,
  Radio,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { CoreIQData } from '../../services/supabase';
import {
  DEFAULT_SERVICES_CONTENT,
  ServicesPageContent,
  parseServicesPageContent,
  ProblemItem,
  ServiceItem,
  BlueprintItem,
  DeliveryStage,
  FaqItem,
} from '../../data/servicesData';

interface CommandServicesTabProps {
  onRefreshParent?: () => void;
}

export const CommandServicesTab: React.FC<CommandServicesTabProps> = ({ onRefreshParent }) => {
  const [content, setContent] = useState<ServicesPageContent>(DEFAULT_SERVICES_CONTENT);
  const [isPublished, setIsPublished] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveFeedback, setSaveFeedback] = useState<{ success: boolean; savedToDb: boolean; error?: string } | null>(null);
  const [activeSection, setActiveSection] = useState<
    'seo' | 'hero' | 'ticker' | 'problems' | 'services' | 'blueprints' | 'delivery' | 'faqs' | 'closing'
  >('seo');

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Load existing content from Supabase / localStore
  const loadContent = useCallback(async () => {
    setIsLoading(true);
    try {
      const item = await CoreIQData.getContentByContentKey('services.page');
      if (item && (item.body || item.value)) {
        const rawJson = item.body || item.value;
        const parsed = parseServicesPageContent(rawJson);
        setContent(parsed);
        setIsPublished(item.published !== false && (item.status || '').toUpperCase() !== 'DRAFT');
      } else {
        setContent(DEFAULT_SERVICES_CONTENT);
        setIsPublished(true);
      }
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Failed to load services.page content:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const handleSave = async (publishedState: boolean = isPublished) => {
    setIsSaving(true);
    setSaveFeedback(null);
    try {
      const jsonString = JSON.stringify(content, null, 2);
      const res = await CoreIQData.saveContentItemVerified('services.page', jsonString, 'json');
      
      // Update published state in content row if supported
      if (res.item && res.item.id) {
        await CoreIQData.updateContentItem(res.item.id, {
          published: publishedState,
          status: publishedState ? 'PUBLISHED' : 'DRAFT',
          title: content.seo.title || 'AI Automation Services South Africa',
          summary: content.seo.description || 'CoreIQ Services Page Content',
        });
      }

      setIsPublished(publishedState);
      setHasUnsavedChanges(false);
      setSaveFeedback({
        success: res.success,
        savedToDb: res.savedToDb,
        error: res.error,
      });

      if (onRefreshParent) {
        onRefreshParent();
      }

      setTimeout(() => {
        setSaveFeedback(null);
      }, 5000);
    } catch (err: any) {
      setSaveFeedback({
        success: false,
        savedToDb: false,
        error: err?.message || 'Failed to save services content',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Reset all Services page fields to original source defaults? Any unsaved edits will be lost.')) {
      setContent(DEFAULT_SERVICES_CONTENT);
      setHasUnsavedChanges(true);
    }
  };

  // Helper updaters
  const updateSeo = (field: keyof ServicesPageContent['seo'], value: string) => {
    setContent((prev) => ({
      ...prev,
      seo: { ...prev.seo, [field]: value },
    }));
    setHasUnsavedChanges(true);
  };

  const updateHero = (field: keyof ServicesPageContent['hero'], value: string) => {
    setContent((prev) => ({
      ...prev,
      hero: { ...prev.hero, [field]: value },
    }));
    setHasUnsavedChanges(true);
  };

  const updateTickerEnabled = (enabled: boolean) => {
    setContent((prev) => ({
      ...prev,
      capabilityTicker: { ...prev.capabilityTicker, enabled },
    }));
    setHasUnsavedChanges(true);
  };

  const updateTickerItem = (index: number, value: string) => {
    const updated = [...content.capabilityTicker.items];
    updated[index] = value;
    setContent((prev) => ({
      ...prev,
      capabilityTicker: { ...prev.capabilityTicker, items: updated },
    }));
    setHasUnsavedChanges(true);
  };

  const addTickerItem = () => {
    setContent((prev) => ({
      ...prev,
      capabilityTicker: {
        ...prev.capabilityTicker,
        items: [...prev.capabilityTicker.items, 'NEW CAPABILITY'],
      },
    }));
    setHasUnsavedChanges(true);
  };

  const removeTickerItem = (index: number) => {
    setContent((prev) => ({
      ...prev,
      capabilityTicker: {
        ...prev.capabilityTicker,
        items: prev.capabilityTicker.items.filter((_, i) => i !== index),
      },
    }));
    setHasUnsavedChanges(true);
  };

  // Problems
  const updateProblem = (index: number, field: keyof ProblemItem, value: any) => {
    const updated = [...content.problemDiscovery.problems];
    updated[index] = { ...updated[index], [field]: value };
    setContent((prev) => ({
      ...prev,
      problemDiscovery: { ...prev.problemDiscovery, problems: updated },
    }));
    setHasUnsavedChanges(true);
  };

  // Services
  const updateService = (index: number, field: keyof ServiceItem, value: any) => {
    const updated = [...content.services];
    updated[index] = { ...updated[index], [field]: value };
    setContent((prev) => ({
      ...prev,
      services: updated,
    }));
    setHasUnsavedChanges(true);
  };

  // Blueprints
  const updateBlueprint = (index: number, field: keyof BlueprintItem, value: any) => {
    const updated = [...content.blueprints.items];
    updated[index] = { ...updated[index], [field]: value };
    setContent((prev) => ({
      ...prev,
      blueprints: { ...prev.blueprints, items: updated },
    }));
    setHasUnsavedChanges(true);
  };

  // Delivery stages
  const updateDeliveryStage = (index: number, field: keyof DeliveryStage, value: string) => {
    const updated = [...content.delivery.stages];
    updated[index] = { ...updated[index], [field]: value };
    setContent((prev) => ({
      ...prev,
      delivery: { ...prev.delivery, stages: updated },
    }));
    setHasUnsavedChanges(true);
  };

  // FAQs
  const updateFaq = (index: number, field: keyof FaqItem, value: any) => {
    const updated = [...content.faqs.items];
    updated[index] = { ...updated[index], [field]: value };
    setContent((prev) => ({
      ...prev,
      faqs: { ...prev.faqs, items: updated },
    }));
    setHasUnsavedChanges(true);
  };

  const addFaq = () => {
    const newFaq: FaqItem = {
      id: `faq-${Date.now()}`,
      question: 'New Question',
      answer: 'Detailed, helpful answer here.',
      published: true,
    };
    setContent((prev) => ({
      ...prev,
      faqs: { ...prev.faqs, items: [...prev.faqs.items, newFaq] },
    }));
    setHasUnsavedChanges(true);
  };

  const removeFaq = (index: number) => {
    setContent((prev) => ({
      ...prev,
      faqs: { ...prev.faqs, items: prev.faqs.items.filter((_, i) => i !== index) },
    }));
    setHasUnsavedChanges(true);
  };

  // Closing
  const updateClosing = (field: keyof ServicesPageContent['closing'], value: string) => {
    setContent((prev) => ({
      ...prev,
      closing: { ...prev.closing, [field]: value },
    }));
    setHasUnsavedChanges(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 font-mono text-xs">
        <RefreshCw className="w-4 h-4 animate-spin text-cyan-400 mr-2" />
        Loading Services Page content configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action / Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#030717]/95 border border-slate-800/90 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Services Page Live Editor
              </h3>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  isPublished
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                {isPublished ? 'PUBLISHED' : 'DRAFT'}
              </span>
              {hasUnsavedChanges && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
                  Unsaved Edits
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Manages public copy, SEO metadata, interactive discovery, 6 core services, blueprints, and FAQs for <code className="text-cyan-300">/services</code>.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleResetToDefaults}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Reset to source defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={() => handleSave(!isPublished)}
            disabled={isSaving}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            {isPublished ? 'Unpublish (Draft)' : 'Publish to Live'}
          </button>

          <button
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-98 shadow-[0_0_15px_rgba(25,217,255,0.25)] min-h-[40px] disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save & Publish Live</span>
          </button>
        </div>
      </div>

      {/* Save Feedback Banner */}
      {saveFeedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs font-mono ${
            saveFeedback.success
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}
        >
          {saveFeedback.success ? (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <div className="flex-1">
            {saveFeedback.success
              ? `Changes saved verified to services.page ${
                  saveFeedback.savedToDb ? '(persisted in database)' : '(saved in local storage fallback)'
                }. Live page updated.`
              : `Save failed: ${saveFeedback.error || 'Unknown error'}`}
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
        {[
          { id: 'seo', label: '1. SEO & Metadata', icon: Globe },
          { id: 'hero', label: '2. Hero Section', icon: Sparkles },
          { id: 'ticker', label: '3. Capability Strip', icon: Workflow },
          { id: 'problems', label: '4. Problem Discovery', icon: HelpCircle },
          { id: 'services', label: '5. Six Core Services', icon: Layers },
          { id: 'blueprints', label: '6. System Blueprints', icon: Radio },
          { id: 'delivery', label: '7. 7-Stage Delivery', icon: ArrowRight },
          { id: 'faqs', label: '8. FAQs (10)', icon: FileText },
          { id: 'closing', label: '9. Closing CTA', icon: Eye },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: SEO & Metadata */}
      {activeSection === 'seo' && (
        <div className="p-6 rounded-2xl bg-[#050814] border border-slate-800/80 space-y-5">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            SEO Target & Search Metadata
          </h4>
          <p className="text-xs text-slate-400">
            Targeting: <strong className="text-cyan-300">AI automation services South Africa</strong> and secondary keywords.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Page Title Tag (&lt;title&gt;)
              </label>
              <input
                type="text"
                value={content.seo.title}
                onChange={(e) => updateSeo('title', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-cyan-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Length: {content.seo.title.length} characters (ideal 50-60)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Meta Description
              </label>
              <textarea
                rows={3}
                value={content.seo.description}
                onChange={(e) => updateSeo('description', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-cyan-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Length: {content.seo.description.length} characters (ideal 140-160)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Canonical URL Route
              </label>
              <input
                type="text"
                value={content.seo.canonicalUrl}
                onChange={(e) => updateSeo('canonicalUrl', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Hero Section */}
      {activeSection === 'hero' && (
        <div className="p-6 rounded-2xl bg-[#050814] border border-slate-800/80 space-y-5">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Cinematic Hero Content
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Overline Badge
              </label>
              <input
                type="text"
                value={content.hero.overline}
                onChange={(e) => updateHero('overline', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Primary H1 Headline
              </label>
              <input
                type="text"
                value={content.hero.h1}
                onChange={(e) => updateHero('h1', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm font-bold focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Supporting Copy
              </label>
              <textarea
                rows={3}
                value={content.hero.supportingCopy}
                onChange={(e) => updateHero('supportingCopy', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Geographic Positioning Line
              </label>
              <input
                type="text"
                value={content.hero.geoLine}
                onChange={(e) => updateHero('geoLine', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 font-mono text-xs focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Primary CTA Label
              </label>
              <input
                type="text"
                value={content.hero.primaryCta}
                onChange={(e) => updateHero('primaryCta', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Primary CTA Ask CoreIQ Pre-filled Prompt
              </label>
              <input
                type="text"
                value={content.hero.primaryCtaPrompt}
                onChange={(e) => updateHero('primaryCtaPrompt', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Secondary CTA Label (Scroll to capabilities)
              </label>
              <input
                type="text"
                value={content.hero.secondaryCta}
                onChange={(e) => updateHero('secondaryCta', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Capability Strip Ticker */}
      {activeSection === 'ticker' && (
        <div className="p-6 rounded-2xl bg-[#050814] border border-slate-800/80 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Workflow className="w-4 h-4 text-cyan-400" />
                Animated Capability Ticker
              </h4>
              <p className="text-xs text-slate-400">
                Continuous horizontal ticker bar shown below the hero.
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={content.capabilityTicker.enabled}
                onChange={(e) => updateTickerEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700"
              />
              <span className="text-xs text-slate-300 font-medium">Enable Ticker</span>
            </label>
          </div>

          <div className="space-y-3">
            {content.capabilityTicker.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-6 text-xs text-slate-500 font-mono">{idx + 1}.</span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateTickerItem(idx, e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-cyan-500 focus:outline-none font-mono tracking-wider uppercase"
                />
                <button
                  onClick={() => removeTickerItem(idx)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <button
              onClick={addTickerItem}
              className="mt-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Capability Item</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 4: Problem Discovery */}
      {activeSection === 'problems' && (
        <div className="p-6 rounded-2xl bg-[#050814] border border-slate-800/80 space-y-6">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              Problem Discovery Selector
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Interactive diagnostic section where visitors pick their real business bottleneck.
            </p>
          </div>

          <div className="space-y-6">
            {content.problemDiscovery.problems.map((prob, idx) => (
              <div
                key={prob.id}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                    Problem 0{idx + 1}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{prob.id}</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Visitor Statement / Title
                  </label>
                  <input
                    type="text"
                    value={prob.title}
                    onChange={(e) => updateProblem(idx, 'title', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Underlying Root Cause Issue
                  </label>
                  <textarea
                    rows={2}
                    value={prob.issue}
                    onChange={(e) => updateProblem(idx, 'issue', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Recommended CoreIQ Solution
                  </label>
                  <input
                    type="text"
                    value={prob.solution}
                    onChange={(e) => updateProblem(idx, 'solution', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-cyan-200 text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Practical System Example
                  </label>
                  <textarea
                    rows={2}
                    value={prob.example}
                    onChange={(e) => updateProblem(idx, 'example', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    CTA Prompt (Prefills Ask CoreIQ)
                  </label>
                  <input
                    type="text"
                    value={prob.ctaPrompt}
                    onChange={(e) => updateProblem(idx, 'ctaPrompt', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: Six Core Services */}
      {activeSection === 'services' && (
        <div className="p-6 rounded-2xl bg-[#050814] border border-slate-800/80 space-y-6">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Six Core Service Capabilities
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Detailed editorial journey presenting each CoreIQ service offering.
            </p>
          </div>

          <div className="space-y-6">
            {content.services.map((svc, idx) => (
              <div
                key={svc.id}
                className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      {svc.number}
                    </span>
                    <span className="text-xs font-mono uppercase text-slate-400">
                      {svc.overline}
                    </span>
                  </div>
                  <span className="text-xs text-white font-bold">{svc.title}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Service Title
                    </label>
                    <input
                      type="text"
                      value={svc.title}
                      onChange={(e) => updateService(idx, 'title', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Overline Tag
                    </label>
                    <input
                      type="text"
                      value={svc.overline}
                      onChange={(e) => updateService(idx, 'overline', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-cyan-400 font-mono text-xs focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Summary (Lead narrative)
                    </label>
                    <input
                      type="text"
                      value={svc.summary}
                      onChange={(e) => updateService(idx, 'summary', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Full Description & Technical Architecture
                    </label>
                    <textarea
                      rows={3}
                      value={svc.description}
                      onChange={(e) => updateService(idx, 'description', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Example Workflow Flow (e.g. Trigger → Logic → Action)
                    </label>
                    <input
                      type="text"
                      value={svc.workflow}
                      onChange={(e) => updateService(idx, 'workflow', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      CTA Button Label
                    </label>
                    <input
                      type="text"
                      value={svc.ctaLabel}
                      onChange={(e) => updateService(idx, 'ctaLabel', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      CTA Pre-filled Enquiry Prompt
                    </label>
                    <input
                      type="text"
                      value={svc.ctaPrompt}
                      onChange={(e) => updateService(idx, 'ctaPrompt', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 6: System Blueprints */}
      {activeSection === 'blueprints' && (
        <div className="p-6 rounded-2xl bg-[#050814] border border-slate-800/80 space-y-6">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              Multi-Capability System Blueprints
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Detailed diagrams illustrating integrated solution combinations.
            </p>
          </div>

          <div className="space-y-5">
            {content.blueprints.items.map((bp, idx) => (
              <div
                key={bp.id}
                className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    {bp.badge}
                  </span>
                  <span className="text-xs font-mono text-slate-500">{bp.id}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Blueprint Title
                    </label>
                    <input
                      type="text"
                      value={bp.title}
                      onChange={(e) => updateBlueprint(idx, 'title', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Category Badge
                    </label>
                    <input
                      type="text"
                      value={bp.badge}
                      onChange={(e) => updateBlueprint(idx, 'badge', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Overview Description
                    </label>
                    <textarea
                      rows={2}
                      value={bp.description}
                      onChange={(e) => updateBlueprint(idx, 'description', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Flow Steps ({bp.steps.length})
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {bp.steps.map((st, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs space-y-1"
                      >
                        <span className="font-mono text-[10px] text-cyan-400 font-bold block">
                          Step {st.step}: {st.title}
                        </span>
                        <span className="text-[11px] text-slate-400 block line-clamp-2">
                          {st.detail}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 7: Delivery Process */}
      {activeSection === 'delivery' && (
        <div className="p-6 rounded-2xl bg-[#050814] border border-slate-800/80 space-y-6">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-cyan-400" />
              Seven-Stage Delivery Journey
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              End-to-end client journey: Discover → Blueprint → Design → Build → Integrate → Test & Deploy → Improve.
            </p>
          </div>

          <div className="space-y-3">
            {content.delivery.stages.map((stg, idx) => (
              <div
                key={stg.number}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center gap-3"
              >
                <div className="flex items-center gap-2.5 w-36 shrink-0">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    {stg.number}
                  </span>
                  <input
                    type="text"
                    value={stg.name}
                    onChange={(e) => updateDeliveryStage(idx, 'name', e.target.value)}
                    className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-white font-bold text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={stg.description}
                    onChange={(e) => updateDeliveryStage(idx, 'description', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 8: FAQs */}
      {activeSection === 'faqs' && (
        <div className="p-6 rounded-2xl bg-[#050814] border border-slate-800/80 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Frequently Asked Questions ({content.faqs.items.length})
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Natural commercial and technical answers for search queries and customer reassurance.
              </p>
            </div>
            <button
              onClick={addFaq}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add FAQ</span>
            </button>
          </div>

          <div className="space-y-4">
            {content.faqs.items.map((faq, idx) => (
              <div
                key={faq.id}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-cyan-400">Question #{idx + 1}</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={faq.published !== false}
                        onChange={(e) => updateFaq(idx, 'published', e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-cyan-500 bg-slate-950 border-slate-700"
                      />
                      <span className="text-[11px] text-slate-400">Published</span>
                    </label>
                    <button
                      onClick={() => removeFaq(idx)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={faq.question}
                  onChange={(e) => updateFaq(idx, 'question', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-medium text-xs focus:border-cyan-500 focus:outline-none"
                  placeholder="Enter Question"
                />

                <textarea
                  rows={3}
                  value={faq.answer}
                  onChange={(e) => updateFaq(idx, 'answer', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:border-cyan-500 focus:outline-none leading-relaxed"
                  placeholder="Enter detailed answer"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 9: Closing CTA */}
      {activeSection === 'closing' && (
        <div className="p-6 rounded-2xl bg-[#050814] border border-slate-800/80 space-y-5">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            Final Conversion Closing Section
          </h4>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Headline
              </label>
              <input
                type="text"
                value={content.closing.headline}
                onChange={(e) => updateClosing('headline', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm font-bold focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Supporting Text
              </label>
              <textarea
                rows={2}
                value={content.closing.supporting}
                onChange={(e) => updateClosing('supporting', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Primary CTA Button Label
                </label>
                <input
                  type="text"
                  value={content.closing.primaryCta}
                  onChange={(e) => updateClosing('primaryCta', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Primary CTA Pre-filled Prompt
                </label>
                <input
                  type="text"
                  value={content.closing.primaryCtaPrompt}
                  onChange={(e) => updateClosing('primaryCtaPrompt', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Secondary CTA Button Label
                </label>
                <input
                  type="text"
                  value={content.closing.secondaryCta}
                  onChange={(e) => updateClosing('secondaryCta', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Secondary CTA Pre-filled Prompt
                </label>
                <input
                  type="text"
                  value={content.closing.secondaryCtaPrompt}
                  onChange={(e) => updateClosing('secondaryCtaPrompt', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
