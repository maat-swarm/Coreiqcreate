import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Search, 
  Clock, 
  ArrowRight, 
  Share2, 
  Bookmark, 
  Check, 
  Flame, 
  ChevronRight, 
  X, 
  Send, 
  Layers, 
  Tag, 
  Radio
} from 'lucide-react';
import { AskCoreIQBar } from '../components/common/AskCoreIQBar';
import { CoreIQSentinel } from '../components/common/CoreIQSentinel';
import { CosmicCTABanner } from '../components/common/CosmicCTABanner';
import { ScrollReveal } from '../components/common/ScrollReveal';
import { NavRoute } from '../types';
import { 
  NEWS_ARTICLES, 
  NEWS_CATEGORIES, 
  TRENDING_TOPICS, 
  NewsArticle 
} from '../data/newsData';

interface NewsPageProps {
  onNavigate: (route: NavRoute) => void;
  onAsk: (query: string) => void;
}

export const NewsPage: React.FC<NewsPageProps> = ({ onNavigate, onAsk }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [emailSubscribed, setEmailSubscribed] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const newsPills = [
    { label: 'Gemini 3.0', query: 'What are the key technical upgrades in Gemini 3.0 reasoning?' },
    { label: 'MCP Protocol', query: 'Explain how Model Context Protocol works for agent tooling' },
    { label: 'Coding Swarms', query: 'How do multi-agent coding swarms compare to single prompts?' },
    { label: 'Edge AI', query: 'Can small language models run offline on edge hardware?' },
  ];

  const featuredArticle = useMemo(() => {
    return NEWS_ARTICLES.find((a) => a.featured) || NEWS_ARTICLES[0];
  }, []);

  const filteredArticles = useMemo(() => {
    return NEWS_ARTICLES.filter((article) => {
      const matchesCategory =
        selectedCategory === 'All' || article.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleShare = (article: NewsArticle, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/news#${article.slug}`);
      setCopiedId(article.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setEmailSubscribed(true);
      setNewsletterEmail('');
    }
  };

  return (
    <div className="w-full relative">
      {/* 1. HERO SECTION */}
      <section className="relative pt-8 pb-8 lg:pt-14 lg:pb-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Main Content */}
            <div className="lg:col-span-8 space-y-6 z-10">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/[0.08] backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
                <span className="text-xs font-mono font-semibold tracking-widest text-cyan-300 uppercase">
                  AI NEWS // FRONTIER INTELLIGENCE
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl xl:text-7xl font-bold tracking-tight text-white font-display leading-[1.05]">
                Signals from the frontier, <br />
                <span className="gradient-text-phoenix">decoded daily.</span>
              </h1>

              <p className="text-slate-300 text-base sm:text-lg lg:text-xl max-w-2xl leading-relaxed">
                Autonomous agent architectures, frontier model breakthroughs, protocol standards, and enterprise AI benchmarks curated for engineers and decision-makers.
              </p>

              <div className="pt-2">
                <AskCoreIQBar
                  placeholder="Ask CoreIQ about any AI breakthrough or model..."
                  pills={newsPills}
                  onAsk={onAsk}
                  size="large"
                />
              </div>

              {/* Sentinel moved to be directly below AskCoreIQ */}
              <div className="pt-2">
                <CoreIQSentinel
                  page="news"
                  onAsk={onAsk}
                  onNavigate={onNavigate}
                />
              </div>
            </div>

            {/* Live Signal Ticker (Right) */}
            <div className="lg:col-span-4 hidden lg:flex flex-col gap-3 p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="text-xs font-mono uppercase tracking-wider text-white font-semibold">Live Signals</span>
                </div>
                <span className="text-[11px] font-mono text-cyan-400">OCTOBER 2026</span>
              </div>
              <div className="space-y-2.5 text-xs">
                {TRENDING_TOPICS.slice(0, 4).map((topic) => (
                  <div
                    key={topic.tag}
                    onClick={() => setSearchQuery(topic.tag)}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/60 hover:border-cyan-500/30 cursor-pointer transition-all duration-200"
                  >
                    <span className="text-slate-300 font-medium">#{topic.tag}</span>
                    <span className="font-mono text-slate-500 text-[11px]">{topic.count}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. BREAKING / FEATURED LEAD STORY */}
      {featuredArticle && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <ScrollReveal>
            <div 
              onClick={() => setSelectedArticle(featuredArticle)}
              className="group cursor-pointer rounded-3xl bg-gradient-to-br from-[#060e26] via-slate-900/90 to-[#030718] border border-cyan-500/30 hover:border-cyan-400/60 p-6 sm:p-10 lg:p-12 relative overflow-hidden backdrop-blur-xl shadow-[0_0_60px_rgba(6,182,212,0.12)] transition-all duration-300 hover:shadow-[0_0_80px_rgba(6,182,212,0.22)]"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-[90px] pointer-events-none" />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                      {featuredArticle.badge}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20">
                      {featuredArticle.category}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {featuredArticle.date} · {featuredArticle.readTime}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white font-display leading-[1.15] group-hover:text-cyan-300 transition-colors">
                    {featuredArticle.title}
                  </h2>

                  <p className="text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-3xl">
                    {featuredArticle.summary}
                  </p>

                  {/* Key Takeaways Preview */}
                  <div className="pt-2 space-y-2">
                    <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block font-semibold">
                      Key Architectural Signals:
                    </span>
                    <ul className="space-y-1.5">
                      {featuredArticle.takeaways.map((takeaway, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-300">
                          <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                          <span>{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 flex flex-wrap items-center gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedArticle(featuredArticle);
                      }}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all duration-200 cursor-pointer"
                    >
                      <span>Read Deep Dive</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAsk(`Analyze the technical implications of: ${featuredArticle.title}`);
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-cyan-300 bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>Ask CoreIQ to Break This Down</span>
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-4 flex flex-col justify-between h-full space-y-6">
                  <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/90 space-y-3">
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                      Source / Verified By
                    </span>
                    <p className="text-sm font-semibold text-white">{featuredArticle.source}</p>
                    <p className="text-xs text-slate-400">By {featuredArticle.author}</p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {featuredArticle.tags.map((tag) => (
                      <span key={tag} className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-slate-800/80 text-slate-300 border border-slate-700/60">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* 4. FILTER TABS & SEARCH CONTROLS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {NEWS_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : 'bg-slate-900/50 hover:bg-slate-800/70 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search AI news, models, tools..."
              className="w-full pl-9 pr-8 py-2 rounded-full bg-slate-900/80 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 5. NEWS ARTICLE GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        {filteredArticles.length === 0 ? (
          <div className="p-16 rounded-3xl bg-slate-900/30 border border-slate-800 text-center space-y-4">
            <p className="text-slate-400 text-base">No intelligence reports matching your search.</p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="px-5 py-2 rounded-full text-xs font-semibold text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/10 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredArticles.map((article) => (
              <ScrollReveal key={article.id}>
                <div
                  onClick={() => setSelectedArticle(article)}
                  className="group h-full flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-[#050a1c]/80 hover:bg-[#07112d] border border-slate-800/90 hover:border-cyan-500/40 backdrop-blur-md shadow-lg hover:shadow-[0_12px_36px_rgba(0,0,0,0.6)] hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                        {article.category}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{article.readTime}</span>
                      </div>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-white font-display group-hover:text-cyan-300 transition-colors leading-snug">
                      {article.title}
                    </h3>

                    <p className="text-slate-400 text-xs sm:text-sm leading-relaxed line-clamp-3">
                      {article.summary}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-500 text-[11px]">{article.date}</span>
                    <div className="flex items-center gap-2 text-cyan-400 font-semibold group-hover:translate-x-1 transition-transform">
                      <span>Read Story</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}
      </section>

      {/* 6. NEWSLETTER / DAILY DISPATCH CAPTURE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="rounded-3xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-purple-950/30 border border-cyan-500/30 p-8 sm:p-12 relative overflow-hidden backdrop-blur-xl">
          <div className="max-w-2xl space-y-4 relative z-10">
            <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase font-semibold">
              COREIQ INTELLIGENCE DISPATCH
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-display">
              Get the signals before they become consensus.
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Every Sunday: 5 high-signal architectural breakdowns, benchmark stress tests, and open-source models ready to deploy. No hype. No sponsored filler.
            </p>

            {emailSubscribed ? (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>You're registered for the next CoreIQ Dispatch. Welcome to the frontier.</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 pt-2">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="flex-1 px-5 py-3 rounded-full bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm"
                />
                <button
                  type="submit"
                  className="px-7 py-3 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-sm shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all shrink-0 cursor-pointer"
                >
                  Subscribe Free
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 7. ARTICLE DEEP-DIVE MODAL */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl my-8 rounded-3xl bg-[#060b22] border border-cyan-500/30 p-6 sm:p-10 shadow-2xl space-y-6 text-slate-200"
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedArticle(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="space-y-3 pr-10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  {selectedArticle.category}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {selectedArticle.date} · {selectedArticle.readTime}
                </span>
                <span className="text-xs font-mono text-slate-500">By {selectedArticle.author}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-display leading-snug">
                {selectedArticle.title}
              </h2>
            </div>

            {/* Key Takeaways Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold">
                Executive Takeaways:
              </span>
              <ul className="space-y-1.5">
                {selectedArticle.takeaways.map((takeaway, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-300">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Article Content */}
            <div className="prose prose-invert max-w-none text-slate-300 text-sm sm:text-base leading-relaxed space-y-4">
              {selectedArticle.body.split('\n\n').map((paragraph, idx) => {
                if (paragraph.startsWith('### ')) {
                  return (
                    <h3 key={idx} className="text-xl font-bold text-white font-display pt-2">
                      {paragraph.replace('### ', '')}
                    </h3>
                  );
                }
                if (paragraph.startsWith('1. ') || paragraph.startsWith('- ')) {
                  return (
                    <div key={idx} className="pl-4 border-l-2 border-cyan-500/30 space-y-1 text-slate-300">
                      {paragraph.split('\n').map((line, lidx) => (
                        <p key={lidx} className="text-sm">{line}</p>
                      ))}
                    </div>
                  );
                }
                return <p key={idx}>{paragraph}</p>;
              })}
            </div>

            {/* Tags & Action Row */}
            <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex flex-wrap gap-1.5">
                {selectedArticle.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-slate-900 text-slate-400 border border-slate-800">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => handleShare(selectedArticle, e)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedId === selectedArticle.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied Link</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    const q = `Analyze the technical impact of: ${selectedArticle.title}`;
                    setSelectedArticle(null);
                    onAsk(q);
                  }}
                  className="px-5 py-2 rounded-full text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ask CoreIQ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. BOTTOM COSMIC CTA */}
      <CosmicCTABanner
        eyebrow="STAY AT THE FRONTIER"
        headline="Turn AI signals into working systems."
        subtext="Don't just track the breakthroughs — build with them. Describe your objective and let CoreIQ construct your system."
        inputPlaceholder="Ask CoreIQ how to build with today's frontier models..."
        onAsk={onAsk}
      />
    </div>
  );
};
