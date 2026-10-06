import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Clock, 
  Compass, 
  Wrench, 
  Hammer, 
  Target,
  Play,
  Download,
  Lock,
  CheckCircle2,
  X,
  ExternalLink,
  Sparkles,
  Video,
  FileText,
  ShieldCheck,
  Zap,
  BookmarkCheck
} from 'lucide-react';
import { ASSETS } from '../assets/images';
import { AskCoreIQBar } from '../components/common/AskCoreIQBar';
import { CosmicCTABanner } from '../components/common/CosmicCTABanner';
import { PageHeroVisual } from '../components/common/PageHeroVisual';
import { ScrollReveal } from '../components/common/ScrollReveal';
import { ContentPlaceholder } from '../components/common/ContentPlaceholder';
import { CoreIQSentinel } from '../components/common/CoreIQSentinel';
import { useMediaSlot } from '../services/mediaSlots';
import { NavRoute } from '../types';
import { LEARN_CATEGORIES, FOUR_PILLARS } from '../data/learnData';
import { resolveContent, seedManifestPlaceholders, ResolvedContent } from '../services/contentResolver';

interface LearnPageProps {
  onNavigate: (route: NavRoute) => void;
  onAsk: (query: string) => void;
}

const MANIFEST_GUIDE_KEYS = [
  'learn.guide.ai-workflows',
  'learn.guide.prompt-engineering',
  'learn.guide.automation',
  'learn.guide.agents',
  'learn.guide.ai-tools',
  'learn.guide.workflows',
];

const EDITORIAL_TOPICS = [
  { num: '01', label: 'AI News', query: 'What are the latest AI news and updates?' },
  { num: '02', label: 'Models', query: 'How to select and evaluate frontier AI models' },
  { num: '03', label: 'Agents', query: 'How do autonomous AI agents work?' },
  { num: '04', label: 'Automation', query: 'How to design intelligent business automations' },
  { num: '05', label: 'Workflows', query: 'Best practices for AI human-in-the-loop workflows' },
  { num: '06', label: 'Prompting', query: 'Advanced prompting engineering and structured output' },
  { num: '07', label: 'Business AI', query: 'How to implement AI across business operations' },
  { num: '08', label: 'Tutorials', query: 'Show me step-by-step AI tutorials' },
  { num: '09', label: 'Tools', query: 'What are the top AI tools and SDKs?' },
  { num: '10', label: 'Guides', query: 'Show me comprehensive Core IQ guides' },
];

// Helper to parse YouTube / Vimeo embed URLs
const getVideoEmbedUrl = (rawUrl?: string): string | null => {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  try {
    const ytMatch = rawUrl.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
    }
    const vmMatch = rawUrl.match(
      /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]*\/videos\/|album\/\d+\/video\/|video\/)?|player\.vimeo\.com\/video\/)(\d+)/
    );
    if (vmMatch && vmMatch[1]) {
      return `https://player.vimeo.com/video/${vmMatch[1]}?autoplay=1`;
    }
  } catch {}
  return null;
};

const isDirectVideoFile = (url?: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url) || url.startsWith('/assets/backgrounds/') || url.startsWith('/hero-');
};

export interface VideoTutorialItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  thumbnailUrl: string;
  videoUrl: string;
  embedUrl?: string;
  presenter?: string;
  isGated: boolean;
}

export interface DownloadableResourceItem {
  id: string;
  title: string;
  description: string;
  fileType: 'Cheat Sheet' | 'Checklist' | 'Template' | 'PDF Architecture';
  fileSize: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  downloadUrl?: string;
  isGated: boolean;
}

// Operators can easily replace or expand these tutorial video items
export const VIDEO_TUTORIALS: VideoTutorialItem[] = [
  {
    id: 'vid-1',
    title: 'Zero to Production AI: The 15-Minute Blueprint',
    description: 'Learn the core stack: LLMs, prompt contracts, and structured JSON output without complex frameworks.',
    duration: '14:20',
    level: 'Beginner',
    thumbnailUrl: ASSETS.energyCore,
    videoUrl: '/assets/backgrounds/coreiq-world.mp4',
    presenter: 'Professor Glitch & CoreIQ Labs',
    isGated: false,
  },
  {
    id: 'vid-2',
    title: 'Prompt Architecture for Reliable Automation',
    description: 'Stop hallucinations. Master few-shot exemplars, delimiters, and programmatic verification loops.',
    duration: '18:45',
    level: 'Beginner',
    thumbnailUrl: ASSETS.toolsCube,
    videoUrl: '/hero-bg-clean.mp4',
    presenter: 'CoreIQ Engineering',
    isGated: false,
  },
  {
    id: 'vid-3',
    title: 'Autonomous Swarm Orchestration in TypeScript',
    description: 'Multi-agent handoffs, state machines, and event dispatchers for reliable background workers.',
    duration: '26:10',
    level: 'Intermediate',
    thumbnailUrl: ASSETS.agentHead,
    videoUrl: '/assets/backgrounds/coreiq-world.mp4',
    presenter: 'Professor Glitch // Core Architect',
    isGated: true,
  },
  {
    id: 'vid-4',
    title: 'Vector Embeddings, RAG & Hybrid Search Pipelines',
    description: 'Connecting external document indexes and database vectors with low-latency retrieval.',
    duration: '32:05',
    level: 'Intermediate',
    thumbnailUrl: ASSETS.hypercubeCrystal,
    videoUrl: '/hero-bg-clean.mp4',
    presenter: 'CoreIQ Research',
    isGated: true,
  },
  {
    id: 'vid-5',
    title: 'Self-Healing Agents & Automated Error Remediation',
    description: 'Production patterns for token limit resilience, schema drift protection, and automated code recovery.',
    duration: '38:15',
    level: 'Advanced',
    thumbnailUrl: ASSETS.worldArt,
    videoUrl: '/assets/backgrounds/coreiq-world.mp4',
    presenter: 'Professor Glitch // Deep Diagnostics',
    isGated: true,
  },
];

// Operators can easily paste real PDF or Drive links into downloadUrl
export const DOWNLOADABLE_RESOURCES: DownloadableResourceItem[] = [
  {
    id: 'res-1',
    title: 'The AI Builder’s Pocket Cheat Sheet (2026 Edition)',
    description: 'One-page syntax reference for modern LLM system prompts, output delimiters, and error codes.',
    fileType: 'Cheat Sheet',
    fileSize: '1.2 MB',
    level: 'Beginner',
    downloadUrl: '/downloads/coreiq-prompt-pack.pdf',
    isGated: false,
  },
  {
    id: 'res-2',
    title: 'Production Readiness & Safety Audit Checklist',
    description: '30-point evaluation checklist before deploying autonomous agents to business users or clients.',
    fileType: 'Checklist',
    fileSize: '840 KB',
    level: 'Beginner',
    downloadUrl: '/downloads/automation-starter-checklist.pdf',
    isGated: false,
  },
  {
    id: 'res-3',
    title: 'Multi-Agent State Machine Architecture Template',
    description: 'Complete TypeScript schema and JSON serialization boilerplate for persistent swarm memory.',
    fileType: 'Template',
    fileSize: '2.8 MB',
    level: 'Intermediate',
    downloadUrl: '#',
    isGated: true,
  },
  {
    id: 'res-4',
    title: 'Enterprise AI Governance & Cost Estimation Model',
    description: 'Spreadsheet models and formulas for predicting token costs, caching efficacy, and latency bounds.',
    fileType: 'PDF Architecture',
    fileSize: '3.4 MB',
    level: 'Advanced',
    downloadUrl: '#',
    isGated: true,
  },
];

export const LearnPage: React.FC<LearnPageProps> = ({ onNavigate, onAsk }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [resolvedGuides, setResolvedGuides] = useState<ResolvedContent[]>([]);

  // Modal states for video and soft membership gating
  const [activeVideoModal, setActiveVideoModal] = useState<VideoTutorialItem | null>(null);
  const [membershipModalItem, setMembershipModalItem] = useState<{
    title: string;
    level: string;
    type: 'video' | 'resource';
  } | null>(null);
  const [videoFilter, setVideoFilter] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>('All');

  // Handle Escape key to close active modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveVideoModal(null);
        setMembershipModalItem(null);
      }
    };
    if (activeVideoModal || membershipModalItem) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeVideoModal, membershipModalItem]);

  // Read media slot learn.showcase
  const { items: showcaseItems } = useMediaSlot('learn.showcase');
  const publishedShowcaseItems = (showcaseItems || []).filter((item) => item.published);
  const hasPublishedShowcase = publishedShowcaseItems.length > 0;

  useEffect(() => {
    let isMounted = true;
    seedManifestPlaceholders().then(() => {
      Promise.all(MANIFEST_GUIDE_KEYS.map((k) => resolveContent(k))).then((items) => {
        if (isMounted) setResolvedGuides(items);
      });
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const displayedGuides: ResolvedContent[] = resolvedGuides.length > 0
    ? resolvedGuides
    : MANIFEST_GUIDE_KEYS.map((key) => {
        const slug = key.replace('learn.guide.', '');
        return {
          content_key: key,
          status: 'PLACEHOLDER' as const,
          content_type: 'guide' as const,
          title: slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
          summary: 'Content being prepared.',
          body: null,
          slug,
          category: 'Curated Guide',
          isPlaceholder: true,
        };
      });

  const filteredTopics = selectedCategory === 'All'
    ? displayedGuides
    : displayedGuides.filter(t => (t.category || 'General') === selectedCategory);

  const learnPills = [
    { label: 'Browse all', query: 'Show me all available Core IQ learning guides' },
    { label: 'Start with basics', query: 'I want to learn the basics of AI and agents' },
    { label: 'Explore workflows', query: 'How to build production AI workflows' },
  ];

  // Helper to categorize guide level cleanly
  const getGuideLevel = (topic: ResolvedContent): 'Beginner' | 'Intermediate' | 'Advanced' => {
    if (topic.metadata?.level) {
      const l = topic.metadata.level.toLowerCase();
      if (l.includes('beginner') || l.includes('basic')) return 'Beginner';
      if (l.includes('advanced') || l.includes('expert')) return 'Advanced';
      return 'Intermediate';
    }
    const key = (topic.content_key || topic.slug || '').toLowerCase();
    if (key.includes('prompt') || key.includes('tools')) return 'Beginner';
    if (key.includes('agents')) return 'Advanced';
    return 'Intermediate';
  };

  // Handle resource download
  const handleDownloadResource = (resource: DownloadableResourceItem) => {
    if (resource.isGated) {
      setMembershipModalItem({
        title: resource.title,
        level: resource.level,
        type: 'resource',
      });
      return;
    }

    if (resource.downloadUrl && resource.downloadUrl !== '#') {
      const a = document.createElement('a');
      a.href = resource.downloadUrl;
      a.download = resource.downloadUrl.split('/').pop() || 'resource.pdf';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // Direct starter file download for free beginner tools
    const textContent = 
`=============================================================
COREIQ LEARNING CODEX: ${resource.title.toUpperCase()}
Format: ${resource.fileType} | Level: ${resource.level} | Status: Free Tier
=============================================================

SUMMARY:
${resource.description}

CORE RECOMMENDATIONS:
1. Always establish unambiguous prompt contracts and strict output validation.
2. Structure error remediation loops with deterministic fallback logic.
3. Test edge cases across model families before scaling workflow pipelines.
4. Keep human verification gates on all high-stakes autonomous operations.

For complete guides, interactive playgrounds, and video tutorials:
Visit https://coreiq.ai/learn or ask CoreIQ directly.
=============================================================`;

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coreiq-${resource.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleVideoCardClick = (video: VideoTutorialItem) => {
    if (video.isGated) {
      setMembershipModalItem({
        title: video.title,
        level: video.level,
        type: 'video',
      });
      return;
    }
    setActiveVideoModal(video);
  };

  return (
    <div className="w-full relative">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[75vh] flex items-center pt-8 pb-16 lg:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-7 z-10">
              <span className="text-xs tracking-[0.3em] text-cyan-400 uppercase font-mono">
                LEARN / COREIQ
              </span>

              <h1 className="text-5xl sm:text-6xl xl:text-7xl font-bold tracking-tight text-white font-display leading-[1.05]">
                Learn what matters. <br />
                <span className="gradient-text-phoenix">Build what works.</span>
              </h1>

              <p className="text-slate-300 text-base sm:text-lg lg:text-xl max-w-xl leading-relaxed">
                Practical AI education for people who want to build real things.
              </p>

              <div className="pt-2 space-y-4">
                <AskCoreIQBar
                  placeholder="Ask CoreIQ what you want to learn..."
                  pills={learnPills}
                  onAsk={onAsk}
                  size="large"
                />

                {/* Level chips under the pills */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider mr-1">
                    Pathways:
                  </span>
                  
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('video-tutorials');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                      else onAsk('Show me beginner free AI tutorials and guides');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-400 transition-all cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.15)] hover:scale-105"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                    <span>Beginner · Free</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAsk('Show me intermediate AI workflows and agent architectures')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-400 transition-all cursor-pointer hover:scale-105"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>Intermediate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAsk('Show me advanced AI systems, memory architectures, and production orchestration')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-400 transition-all cursor-pointer hover:scale-105"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span>Advanced</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Visual: Media Slot learn.showcase or Fallback Static Book Hologram */}
            <div className="lg:col-span-5 relative flex justify-center items-center w-full">
              {hasPublishedShowcase ? (
                <div className="w-full max-w-[540px]">
                  <CoreIQSentinel
                    page="learn"
                    onAsk={onAsk}
                    onNavigate={onNavigate}
                  />
                </div>
              ) : (
                <PageHeroVisual>
                  <div className="relative w-full max-w-[480px] aspect-square flex items-center justify-center">
                    <div className="relative w-full h-full rounded-3xl overflow-hidden border border-cyan-500/30 shadow-[0_0_60px_rgba(6,182,212,0.3)]">
                      <img
                        src={ASSETS.learnBook}
                        alt="Core IQ Knowledge & Learning"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-40" />
                    </div>
                  </div>
                </PageHeroVisual>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* 2. FEATURED ARTICLE BLOCK */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="full-width rounded-3xl bg-gradient-to-br from-slate-900 via-[#060d22] to-slate-950 border border-cyan-500/20 p-8 sm:p-12 relative overflow-hidden backdrop-blur-md shadow-[0_0_50px_rgba(6,182,212,0.12)]">
          {/* Luminous aura behind */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-[90px] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            {/* Left side */}
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase">
                FEATURED
              </span>

              <h2 className="text-3xl sm:text-4xl font-bold text-white font-display leading-snug">
                How to turn an AI idea into a useful workflow.
              </h2>

              <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl">
                A practical walkthrough of breaking down a business problem, choosing the right AI approach, and building a working automation.
              </p>

              <div className="pt-2">
                <button
                  onClick={() => onNavigate('learn/ai-workflows' as NavRoute)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all duration-200 cursor-pointer"
                >
                  <span>Read the guide</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right side: 4-Box Connected Workflow Diagram */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-6 sm:p-8 backdrop-blur-md">
                <div className="flex items-center justify-between text-xs text-slate-500 font-mono mb-6">
                  <span className="text-cyan-400 uppercase tracking-widest">Workflow Architecture</span>
                  <span>4-Stage Pipeline</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
                  {[
                    { step: '01', title: 'Problem', desc: 'Isolate root bottleneck & scope' },
                    { step: '02', title: 'AI Approach', desc: 'Choose model & reasoning tools' },
                    { step: '03', title: 'Build', desc: 'Wire agents & data bridges' },
                    { step: '04', title: 'Result', desc: 'Working high-impact automation' },
                  ].map((box, idx) => (
                    <div
                      key={box.step}
                      className="relative p-4 rounded-xl bg-slate-900/90 border border-cyan-500/20 hover:border-cyan-400/40 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] text-cyan-400">STAGE {box.step}</span>
                        {idx < 3 && (
                          <span className="text-cyan-500/60 hidden sm:inline text-xs font-mono">→</span>
                        )}
                      </div>
                      <h4 className="text-white font-bold text-sm mb-0.5">{box.title}</h4>
                      <p className="text-slate-400 text-xs">{box.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. NEW – VIDEO TUTORIALS SECTION */}
      <section id="video-tutorials" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono tracking-[0.25em] text-cyan-400 uppercase">
                VIDEO TUTORIALS
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                FEAT. PROFESSOR GLITCH
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-display">
              Start watching — fundamentals first
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Master autonomous building through concise visual breakdowns, live terminal code walkthroughs, and architecture diagrams.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              Stream Type: <strong className="text-emerald-400 font-semibold">Free &amp; Pro Masterclasses</strong>
            </span>
          </div>
        </div>

        {/* Video Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <span className="text-xs font-mono uppercase text-slate-500 tracking-wider mr-2">
            Filter:
          </span>
          {[
            { id: 'All', label: 'All Streams', count: VIDEO_TUTORIALS.length },
            { id: 'Beginner', label: 'Free Beginner', count: VIDEO_TUTORIALS.filter((v) => v.level === 'Beginner').length },
            { id: 'Intermediate', label: 'Intermediate', count: VIDEO_TUTORIALS.filter((v) => v.level === 'Intermediate').length },
            { id: 'Advanced', label: 'Advanced', count: VIDEO_TUTORIALS.filter((v) => v.level === 'Advanced').length },
          ].map((tab) => {
            const isActive = videoFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setVideoFilter(tab.id as any)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.25)] font-semibold'
                    : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-cyan-400/20 text-cyan-200' : 'bg-slate-800 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Video Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(videoFilter === 'All' ? VIDEO_TUTORIALS : VIDEO_TUTORIALS.filter((v) => v.level === videoFilter)).map((video) => {
            const isBeginner = video.level === 'Beginner';
            return (
              <div
                key={video.id}
                onClick={() => handleVideoCardClick(video)}
                className="group cursor-pointer rounded-2xl coreiq-glass-card overflow-hidden border border-cyan-500/20 hover:border-cyan-400/60 hover:-translate-y-2 hover:shadow-[0_16px_36px_rgba(0,0,0,0.8),0_0_28px_rgba(34,211,238,0.2)] transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail Container */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent opacity-80" />

                    {/* Level Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                        isBeginner 
                          ? 'bg-emerald-500/90 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                          : video.level === 'Advanced'
                          ? 'bg-purple-500/90 text-slate-950 shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                          : 'bg-cyan-500/90 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                      }`}>
                        {video.level}
                      </span>
                    </div>

                    {/* Duration Badge */}
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-slate-200 text-[11px] font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>{video.duration}</span>
                    </div>

                    {/* Play / Lock Center Icon */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-300 ${
                        video.isGated
                          ? 'bg-slate-900/80 border-slate-700 group-hover:border-purple-400/60 group-hover:scale-110 shadow-lg'
                          : 'bg-cyan-500/80 border-cyan-300 text-slate-950 group-hover:scale-110 shadow-[0_0_24px_rgba(34,211,238,0.5)]'
                      }`}>
                        {video.isGated ? (
                          <Lock className="w-5 h-5 text-purple-300" />
                        ) : (
                          <Play className="w-5 h-5 text-slate-950 fill-slate-950 ml-0.5" />
                        )}
                      </div>
                    </div>

                    {/* Presenter Attribution */}
                    {video.presenter && (
                      <div className="absolute bottom-2 left-3 text-[10px] font-mono text-cyan-300/90 tracking-wide">
                        {video.presenter}
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-5 space-y-2">
                    <h3 className="text-white font-bold text-base group-hover:text-cyan-300 transition-colors line-clamp-2">
                      {video.title}
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
                      {video.description}
                    </p>
                  </div>
                </div>

                {/* Card Action Row */}
                <div className="p-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-500">
                    {isBeginner ? 'Free Instant Access' : 'Pro Membership Masterclass'}
                  </span>

                  {video.isGated ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMembershipModalItem({
                          title: video.title,
                          level: video.level,
                          type: 'video',
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 transition-all cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Unlock Masterclass</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveVideoModal(video);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Watch Now</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. TOPIC GRID (10 EDITORIAL TOPICS) */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60">
        <div className="mb-6">
          <span className="text-xs font-mono tracking-[0.25em] text-cyan-400 uppercase">
            EXPLORE BY TOPIC
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-display mt-1">
            Browse knowledge streams
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {EDITORIAL_TOPICS.map((topic) => (
            <div
              key={topic.num}
              onClick={() => onAsk(topic.query)}
              className="cursor-pointer rounded-xl border border-slate-800 hover:border-cyan-400/50 bg-slate-900/40 hover:bg-slate-900/70 p-4 flex items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.6)] group"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-slate-500 group-hover:text-cyan-400 transition-colors">
                  {topic.num}
                </span>
                <span className="text-sm font-semibold text-white group-hover:text-cyan-200 transition-colors">
                  {topic.label}
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all duration-300" />
            </div>
          ))}
        </div>
      </section>

      {/* 5. STRUCTURED PATHWAYS */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60">
        <div className="mb-8">
          <span className="text-xs font-mono tracking-[0.25em] text-cyan-400 uppercase">
            STRUCTURED PATHWAYS
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white font-display mt-1">
            Choose your direction
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Path 01: Free Beginner */}
          <div 
            onClick={() => onAsk('Start Path 01: Begin with the fundamentals of AI and work toward my first automation')}
            className="cursor-pointer rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-400/50 hover:-translate-y-2 hover:shadow-[0_16px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(16,185,129,0.2)] p-8 transition-all duration-300 group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-5xl font-mono text-slate-800 group-hover:text-emerald-500/40 transition-colors">
                  01
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Free · Beginner
                </span>
              </div>

              <span className="text-xs font-mono tracking-wider text-emerald-400 uppercase">
                FOUNDATIONS
              </span>
              <h3 className="text-2xl font-bold text-white mt-1 mb-3 group-hover:text-emerald-300 transition-colors font-display">
                Start Here
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                New to AI? Begin with the fundamentals and work toward your first production automation with 100% free lessons.
              </p>
            </div>
            <div className="flex items-center justify-between text-emerald-400 text-sm font-medium pt-4 border-t border-slate-800/80">
              <span>Begin free pathway</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
            </div>
          </div>

          {/* Path 02: Intermediate / Advanced with Soft Membership Cue */}
          <div 
            onClick={() => onAsk('Start Path 02: Deep dive into agents, workflows and real AI systems')}
            className="cursor-pointer rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 hover:-translate-y-2 hover:shadow-[0_16px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(34,211,238,0.2)] p-8 transition-all duration-300 group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-5xl font-mono text-slate-800 group-hover:text-cyan-500/40 transition-colors">
                  02
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    Intermediate · Advanced
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Pro</span>
                  </span>
                </div>
              </div>

              <span className="text-xs font-mono tracking-wider text-cyan-400 uppercase">
                ADVANCED SYSTEMS
              </span>
              <h3 className="text-2xl font-bold text-white mt-1 mb-3 group-hover:text-cyan-300 transition-colors font-display">
                Build With AI
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Already know the basics? Deep dive into autonomous swarms, persistent memory, and production orchestration models.
              </p>
            </div>
            <div className="flex items-center justify-between text-cyan-400 text-sm font-medium pt-4 border-t border-slate-800/80">
              <span className="flex items-center gap-1.5">
                <span>Explore masterclass path</span>
                <span className="text-xs font-mono text-slate-500">(Members &amp; Inquiries)</span>
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
            </div>
          </div>
        </div>
      </section>

      {/* 6. NEW – DOWNLOADABLE RESOURCES SECTION */}
      <section id="downloadable-resources" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-mono tracking-[0.25em] text-cyan-400 uppercase block mb-1">
              RESOURCE LIBRARY
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-display">
              Free tools to keep
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Tactical cheatsheets, system prompt audit checklists, and production boilerplate templates to accelerate your builds.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">
              Download formats: <strong className="text-slate-200">PDF · MD · TS</strong>
            </span>
          </div>
        </div>

        {/* Resources Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {DOWNLOADABLE_RESOURCES.map((resource) => {
            const isBeginner = resource.level === 'Beginner';
            return (
              <div
                key={resource.id}
                className="group p-6 rounded-2xl coreiq-glass-card border border-cyan-500/20 hover:border-cyan-400/50 hover:-translate-y-2 hover:shadow-[0_16px_36px_rgba(0,0,0,0.8),0_0_24px_rgba(34,211,238,0.18)] transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5" />
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                      isBeginner
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : resource.level === 'Advanced'
                        ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                        : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    }`}>
                      {resource.level}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-cyan-400/80 uppercase tracking-wider block mb-1">
                    {resource.fileType} · {resource.fileSize}
                  </span>

                  <h3 className="text-white font-bold text-base mb-2 group-hover:text-cyan-300 transition-colors">
                    {resource.title}
                  </h3>

                  <p className="text-slate-400 text-xs leading-relaxed">
                    {resource.description}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-800/80 mt-6">
                  {resource.isGated ? (
                    <button
                      type="button"
                      onClick={() => handleDownloadResource(resource)}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Unlock with Pro</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDownloadResource(resource)}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:shadow-[0_0_20px_rgba(34,211,238,0.35)]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Free</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. CURATED GUIDES CATALOGUE */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60">
        <div className="space-y-6 mb-10">
          <ScrollReveal>
            <div className="space-y-2">
              <span className="text-xs font-semibold tracking-[0.25em] text-cyan-400 uppercase">
                CURATED GUIDES
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white font-display">
                Deep dives for builders.
              </h2>
            </div>
          </ScrollReveal>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {LEARN_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-400 text-slate-950 font-semibold shadow-[0_0_20px_rgba(34,211,238,0.5)] scale-105'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80 hover:border-cyan-500/30'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Learning Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.map((topic) => {
            const isPublished = topic.status === 'PUBLISHED' && Boolean(topic.body);
            const targetSlug = topic.slug || topic.content_key.replace('learn.guide.', '');
            const level = getGuideLevel(topic);

            if (!isPublished) {
              return (
                <ContentPlaceholder
                  key={topic.content_key}
                  title={topic.title}
                  category={topic.category || 'Curated Guide'}
                  contentKey={topic.content_key}
                  slug={targetSlug}
                  level={level}
                  onClick={() => onNavigate(`learn/${targetSlug}` as NavRoute)}
                />
              );
            }

            return (
              <div
                key={topic.content_key}
                onClick={() => onNavigate(`learn/${targetSlug}` as NavRoute)}
                className="group cursor-pointer p-6 rounded-2xl coreiq-glass-card flex flex-col justify-between h-72 relative border border-cyan-500/20 hover:border-cyan-400/60 hover:-translate-y-2 hover:shadow-[0_16px_36px_rgba(0,0,0,0.8),0_0_28px_rgba(34,211,238,0.2)] transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 group-hover:border-cyan-400/60 transition-colors">
                      {topic.category || 'Curated Guide'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                        level === 'Beginner'
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : level === 'Advanced'
                          ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                          : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                      }`}>
                        {level}
                      </span>
                      <div className="flex items-center gap-1 text-slate-400 text-xs">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{topic.metadata?.readTime || '15 min'}</span>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-white font-bold text-lg mb-2 group-hover:text-cyan-300 transition-colors">
                    {topic.title}
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                    {topic.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-400 font-mono">
                    Level: <strong className={
                      level === 'Beginner' ? 'text-emerald-400' :
                      level === 'Advanced' ? 'text-purple-400' : 'text-cyan-300'
                    }>{level}</strong>
                  </span>
                  <div className="flex items-center gap-1.5 text-cyan-400 font-semibold group-hover:text-cyan-300">
                    <span>Read guide</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1.5 duration-300" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. FOUR PILLARS METHODOLOGY */}
      <section className="py-20 border-t border-slate-800/60 bg-[#03081c]/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-semibold tracking-[0.25em] text-cyan-400 uppercase">
              METHODOLOGY
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white font-display">
              Four pillars of <span className="gradient-text-primary">AI mastery.</span>
            </h2>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              We focus on practical capability rather than abstract theory. Master these four disciplines to build systems that endure.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FOUR_PILLARS.map((pillar) => {
              const Icon = 
                pillar.iconName === 'Compass' ? Compass :
                pillar.iconName === 'Wrench' ? Wrench :
                pillar.iconName === 'Hammer' ? Hammer : Target;

              return (
                <div 
                  key={pillar.title}
                  className="group p-6 rounded-2xl coreiq-glass-card space-y-4 border border-cyan-500/20 hover:border-cyan-400/50 hover:-translate-y-2 hover:shadow-[0_16px_36px_rgba(0,0,0,0.8),0_0_28px_rgba(34,211,238,0.2)] transition-all duration-300"
                >
                  <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center group-hover:scale-110 group-hover:shadow-[0_0_16px_rgba(34,211,238,0.3)] transition-all duration-300">
                    <Icon className="w-5 h-5 text-cyan-300 group-hover:rotate-6 transition-transform" />
                  </div>
                  <h3 className="text-white font-bold text-lg group-hover:text-cyan-300 transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. CLOSING COSMIC CTA BANNER / ASK SECTION */}
      <CosmicCTABanner
        eyebrow="GO FURTHER"
        headline="Keep learning. Keep building."
        subtext="The best creators never stop learning. Tell Core IQ what you want to understand, and we'll guide you to the right resource."
        inputPlaceholder="Ask CoreIQ anything..."
        onAsk={onAsk}
        secondaryAction={
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('downloadable-resources');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              } else {
                onAsk('How do I download the free CoreIQ Beginner pack?');
              }
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold border border-cyan-400/50 text-cyan-200 bg-cyan-950/40 hover:bg-cyan-500/15 hover:border-cyan-300 transition-all duration-200 shadow-[0_0_15px_rgba(34,211,238,0.15)] hover:shadow-[0_0_22px_rgba(34,211,238,0.3)] cursor-pointer"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Get the free Beginner pack</span>
          </button>
        }
      />

      {/* VIDEO MODAL FOR FREE BEGINNER VIDEOS */}
      {activeVideoModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in"
          onClick={() => setActiveVideoModal(null)}
        >
          <div 
            className="relative w-full max-w-3xl rounded-3xl bg-gradient-to-b from-[#0a1532] via-[#050b1e] to-[#020512] border border-cyan-500/40 p-6 sm:p-8 shadow-[0_24px_70px_rgba(0,0,0,0.95),0_0_50px_rgba(6,182,212,0.25)] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/15">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-semibold">
                    {activeVideoModal.level} · FREE STREAM
                  </span>
                  <span className="text-slate-500 text-xs font-mono">·</span>
                  <span className="text-slate-400 text-xs font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    {activeVideoModal.duration}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white font-display">
                  {activeVideoModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideoModal(null)}
                className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Close video"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player: Native HTML5 or Embed */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-cyan-500/30 shadow-2xl">
              {(() => {
                const embedUrl = activeVideoModal.embedUrl || getVideoEmbedUrl(activeVideoModal.videoUrl);
                if (embedUrl) {
                  return (
                    <iframe
                      src={embedUrl}
                      title={activeVideoModal.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  );
                }
                if (isDirectVideoFile(activeVideoModal.videoUrl)) {
                  return (
                    <video
                      key={activeVideoModal.id}
                      src={activeVideoModal.videoUrl}
                      poster={activeVideoModal.thumbnailUrl}
                      controls
                      autoPlay
                      playsInline
                      preload="auto"
                      className="w-full h-full object-contain bg-black"
                    >
                      <source src={activeVideoModal.videoUrl} type="video/mp4" />
                      <source src={activeVideoModal.videoUrl} type="video/webm" />
                      Your browser does not support HTML5 video playback.
                    </video>
                  );
                }
                return (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                    <Play className="w-12 h-12 text-cyan-400 mb-2" />
                    <p className="text-white font-semibold">Open tutorial stream</p>
                    <a
                      href={activeVideoModal.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-xs inline-flex items-center gap-2"
                    >
                      <span>Watch Stream</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                );
              })()}
            </div>

            {/* Video Details & Meta */}
            <div className="space-y-3 pt-1">
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                {activeVideoModal.description}
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                <span className="font-mono text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Presenter: {activeVideoModal.presenter || 'CoreIQ Engineering'}</span>
                </span>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const title = activeVideoModal.title;
                      setActiveVideoModal(null);
                      onAsk(`I have questions about the tutorial "${title}". Can you walk me through the architecture and best practices?`);
                    }}
                    className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors font-medium cursor-pointer"
                  >
                    <span>Ask CoreIQ about this</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {activeVideoModal.videoUrl.startsWith('http') && (
                    <a
                      href={activeVideoModal.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                    >
                      <span>External link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SOFT GATED MEMBERSHIP MODAL */}
      {membershipModalItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in"
          onClick={() => setMembershipModalItem(null)}
        >
          <div 
            className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#091533] via-[#050d24] to-[#020614] border border-cyan-500/35 p-6 sm:p-8 shadow-[0_24px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(168,85,247,0.2)] space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/15">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300">
                  <Lock className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-purple-400 uppercase font-semibold">
                    PRO ARCHITECT ACCESS
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    {membershipModalItem.level} Tier Content
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMembershipModalItem(null)}
                className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-white font-bold text-base leading-snug">
                {membershipModalItem.title}
              </h4>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Intermediate and Advanced materials feature deep architectural blueprints, production TypeScript repositories, and sovereign automation templates.
              </p>
            </div>

            {/* Membership Perks List */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Complete GitHub repository source code and config blueprints</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Private diagnostic swarm templates &amp; error recovery suites</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Direct Q&amp;A sessions with CoreIQ engineers and Professor Glitch</span>
              </div>
            </div>

            {/* Modal CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setMembershipModalItem(null);
                  onAsk(`Tell me about CoreIQ Pro Membership and how to access the ${membershipModalItem.level} guide: "${membershipModalItem.title}"`);
                }}
                className="w-full sm:w-auto flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Ask CoreIQ About Access</span>
              </button>
              <button
                type="button"
                onClick={() => setMembershipModalItem(null)}
                className="w-full sm:w-auto py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-colors cursor-pointer"
              >
                Browse Free Resources
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LearnPage;
