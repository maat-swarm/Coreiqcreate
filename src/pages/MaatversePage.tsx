import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, BookOpen, Film, Music, Image as ImageIcon, Sparkles, Clock, Calendar, AlertCircle } from 'lucide-react';
import { PageBackground } from '../components/environment/PageBackground';
import { MaatverseButton, MaatverseDoor } from '../components/tools/maatverseButtons';
import { NavRoute } from '../types';
import {
  usePublicMaatverseSections,
  fetchPublicMaatverseSection,
  fetchPublicMaatverseEntry,
} from '../services/maatversePublic';
import { MaatverseSectionItem, MaatverseEntryItem } from '../types/command';

export interface MaatversePageProps {
  subpath?: string;
  onNavigate: (route: string) => void;
}

export const MaatversePage: React.FC<MaatversePageProps> = ({ subpath: propSubpath, onNavigate }) => {
  // Parse subpath from props or window.location.pathname
  const currentPath = typeof window !== 'undefined' ? window.location.pathname.replace(/^\//, '') : '';
  const effectiveSubpath =
    propSubpath !== undefined
      ? propSubpath
      : currentPath.startsWith('maatverse/')
      ? currentPath.replace(/^maatverse\/?/, '')
      : '';

  const segments = effectiveSubpath.split('/').filter(Boolean);
  const sectionSlug = segments[0] || null;
  const entrySlug = segments[1] || null;

  // Sections hook for root view
  const { sections, loading: sectionsLoading, error: sectionsError, reload: reloadSections } = usePublicMaatverseSections();

  // State for single section view
  const [sectionData, setSectionData] = useState<{ section: MaatverseSectionItem; entries: MaatverseEntryItem[] } | null>(null);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [sectionError, setSectionError] = useState<string | null>(null);

  // State for single entry view
  const [entryData, setEntryData] = useState<MaatverseEntryItem | null>(null);
  const [entryLoading, setEntryLoading] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);

  // Load section and its entries when in section view
  useEffect(() => {
    if (!sectionSlug || entrySlug) {
      setSectionData(null);
      return;
    }

    let isMounted = true;
    setSectionLoading(true);
    setSectionError(null);

    fetchPublicMaatverseSection(sectionSlug)
      .then((data) => {
        if (isMounted) {
          setSectionData(data);
          setSectionLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setSectionError(err?.message || 'Section not found');
          setSectionLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [sectionSlug, entrySlug]);

  // Load entry detail when in entry view
  useEffect(() => {
    if (!sectionSlug || !entrySlug) {
      setEntryData(null);
      return;
    }

    let isMounted = true;
    setEntryLoading(true);
    setEntryError(null);

    fetchPublicMaatverseEntry(sectionSlug, entrySlug)
      .then((entry) => {
        if (isMounted) {
          setEntryData(entry);
          setEntryLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setEntryError(err?.message || 'Entry not found');
          setEntryLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [sectionSlug, entrySlug]);

  // Handle SEO Title & Noindex removal when real published content is loaded
  useEffect(() => {
    const previousTitle = document.title;

    if (entryData) {
      document.title = `${entryData.title} | Ma'atverse`;
    } else if (sectionData) {
      document.title = `${sectionData.section.title} | Ma'atverse`;
    } else {
      document.title = "The Ma'atverse | CoreIQ Create";
    }

    // Only keep noindex if there are zero published sections and not loading
    const hasRealContent = sections.length > 0;
    let metaTag = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;

    if (!hasRealContent && !sectionsLoading) {
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.name = 'robots';
        metaTag.content = 'noindex';
        document.head.appendChild(metaTag);
      } else {
        metaTag.content = 'noindex';
      }
    } else if (metaTag) {
      metaTag.content = 'all';
    }

    return () => {
      document.title = previousTitle;
    };
  }, [sections, sectionsLoading, sectionData, entryData]);

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Film className="w-4 h-4" />;
      case 'audio':
        return <Music className="w-4 h-4" />;
      case 'image':
      case 'comic':
        return <ImageIcon className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full relative min-h-screen flex flex-col justify-between">
      {/* Fixed Ma'atverse Background Portal */}
      <PageBackground slotKey="maatverse.page.background" variant="maatverse" />

      {/* Main Transparent Content Shell */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-24 space-y-10 sm:space-y-14">
        
        {/* VIEW 1: SINGLE ENTRY DETAIL */}
        {entrySlug && sectionSlug ? (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <MaatverseButton
                variant="secondary"
                onClick={() => onNavigate(`maatverse/${sectionSlug}`)}
                icon={<ArrowLeft className="w-4 h-4 stroke-[2.5]" />}
              >
                Back to Section
              </MaatverseButton>
            </div>

            {entryLoading ? (
              <div className="p-12 text-center text-slate-400 font-mono animate-pulse">
                Unfolding entry archives...
              </div>
            ) : entryError ? (
              <div className="rounded-2xl bg-red-950/20 border border-red-500/30 p-8 text-center space-y-4">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
                <h2 className="text-xl font-bold text-white">Entry Not Found</h2>
                <p className="text-sm text-slate-400">{entryError}</p>
                <MaatverseButton
                  variant="secondary"
                  onClick={() => onNavigate(`maatverse/${sectionSlug}`)}
                >
                  Return to Section
                </MaatverseButton>
              </div>
            ) : entryData ? (
              <article className="space-y-8 bg-[#070b18]/80 backdrop-blur-md rounded-3xl border border-blue-900/40 p-6 sm:p-10 shadow-2xl">
                {/* Meta Header */}
                <div className="space-y-4 border-b border-blue-900/40 pb-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className="text-xs font-mono tracking-[0.25em] uppercase font-bold px-3 py-1 rounded-full bg-[#C9A24B]/10 border border-[#C9A24B]/30"
                      style={{ color: '#C9A24B' }}
                    >
                      {(entryData.media_type || entryData.kind || 'text').toUpperCase()}
                    </span>
                    {entryData.featured && (
                      <span className="text-xs font-mono px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        Featured Archive
                      </span>
                    )}
                    <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5 ml-auto">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(entryData.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <h1
                    className="text-3xl sm:text-4xl lg:text-5xl font-normal text-white tracking-tight leading-tight"
                    style={{
                      fontFamily: 'ui-serif, Georgia, "Times New Roman", serif',
                      textShadow: '0 2px 20px rgba(0, 0, 0, 0.7)',
                    }}
                  >
                    {entryData.title}
                  </h1>

                  {(entryData.subtitle || entryData.summary) && (
                    <p className="text-lg sm:text-xl text-[#d0dcfa] font-light leading-relaxed">
                      {entryData.subtitle || entryData.summary}
                    </p>
                  )}
                </div>

                {/* Media Presentation */}
                {(entryData.media_url || entryData.image_url) && (
                  <div className="rounded-2xl overflow-hidden border border-blue-900/50 bg-black/40">
                    {(entryData.media_type || entryData.kind) === 'image' || (entryData.media_type || entryData.kind) === 'comic' ? (
                      <img
                        src={(entryData.media_url || entryData.image_url)!}
                        alt={entryData.title}
                        className="w-full max-h-[500px] object-cover mx-auto"
                        loading="lazy"
                      />
                    ) : (
                      <div className="p-8 text-center space-y-3">
                        <a
                          href={(entryData.media_url || entryData.image_url || entryData.external_url)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-[#C9A24B] text-slate-950 hover:brightness-110 transition-all"
                        >
                          View External Media Archive &rarr;
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Body Content */}
                <div className="prose prose-invert max-w-none text-[#e6edff]/90 text-base sm:text-lg leading-relaxed whitespace-pre-line font-light space-y-4">
                  {entryData.body || entryData.body_md}
                </div>
              </article>
            ) : null}
          </div>
        ) : sectionSlug ? (
          /* VIEW 2: SECTION LIST OF ENTRIES */
          <div className="space-y-8 animate-fadeIn">
            <div>
              <MaatverseButton
                variant="secondary"
                onClick={() => onNavigate('maatverse')}
                icon={<ArrowLeft className="w-4 h-4 stroke-[2.5]" />}
              >
                Back to Ma'atverse
              </MaatverseButton>
            </div>

            {sectionLoading ? (
              <div className="p-12 text-center text-slate-400 font-mono animate-pulse">
                Opening portal corridor...
              </div>
            ) : sectionError ? (
              <div className="rounded-2xl bg-red-950/20 border border-red-500/30 p-8 text-center space-y-4">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
                <h2 className="text-xl font-bold text-white">Section Not Found</h2>
                <p className="text-sm text-slate-400">{sectionError}</p>
                <MaatverseButton
                  variant="secondary"
                  onClick={() => onNavigate('maatverse')}
                >
                  Return to Ma'atverse
                </MaatverseButton>
              </div>
            ) : sectionData ? (
              <div className="space-y-10">
                {/* Section Masthead */}
                <div className="space-y-3 max-w-3xl">
                  <span
                    className="text-xs font-mono tracking-[0.3em] uppercase font-bold"
                    style={{ color: '#C9A24B' }}
                  >
                    MA'ATVERSE PORTAL
                  </span>

                  <h1
                    className="text-4xl sm:text-5xl lg:text-6xl font-normal text-white tracking-tight leading-[1.05]"
                    style={{
                      fontFamily: 'ui-serif, Georgia, "Times New Roman", serif',
                      textShadow: '0 2px 20px rgba(0, 0, 0, 0.7)',
                    }}
                  >
                    {sectionData.section.title}
                  </h1>

                  {(sectionData.section.description || sectionData.section.blurb) && (
                    <p className="text-base sm:text-lg text-[#e6edff]/90 leading-relaxed font-light">
                      {sectionData.section.description || sectionData.section.blurb}
                    </p>
                  )}
                </div>

                {/* Entry List or Empty State */}
                {sectionData.entries.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-blue-900/60 bg-[#060a18]/60 backdrop-blur-sm p-12 text-center space-y-4">
                    <BookOpen className="w-10 h-10 text-[#C9A24B]/70 mx-auto stroke-[1.5]" />
                    <h3 className="text-xl font-medium text-white">The Archive is Silent</h3>
                    <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                      No lore entries have crossed the threshold into this section yet. The builders are inscribing the next chapter.
                    </p>
                    <div className="pt-2">
                      <MaatverseButton
                        variant="secondary"
                        onClick={() => onNavigate('maatverse')}
                      >
                        Explore Other Portals
                      </MaatverseButton>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sectionData.entries.map((entry) => (
                      <div
                        key={entry.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => onNavigate(`maatverse/${sectionSlug}/${entry.slug}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onNavigate(`maatverse/${sectionSlug}/${entry.slug}`);
                          }
                        }}
                        className="group relative rounded-2xl bg-[#080b18]/90 border border-[rgba(120,160,255,0.25)] hover:border-[#C9A24B]/70 p-5 flex flex-col justify-between overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[0_0_25px_rgba(201,162,75,0.2)] hover:-translate-y-1 select-none"
                      >
                        {/* Cover image if available */}
                        {(entry.media_url || entry.image_url) && (
                          <div
                            className="absolute inset-0 bg-cover bg-center opacity-15 pointer-events-none group-hover:opacity-25 transition-opacity"
                            style={{ backgroundImage: `url(${entry.media_url || entry.image_url})` }}
                          />
                        )}

                        <div className="space-y-3 relative z-10">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="flex items-center gap-1.5 text-[#C9A24B] uppercase tracking-wider font-semibold">
                              {getMediaIcon(entry.media_type || entry.kind || 'text')}
                              {entry.media_type || entry.kind || 'text'}
                            </span>
                            {entry.featured && (
                              <span className="text-[10px] text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30">
                                Featured
                              </span>
                            )}
                          </div>

                          <h3
                            className="text-xl font-normal text-white group-hover:text-amber-200 transition-colors"
                            style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}
                          >
                            {entry.title}
                          </h3>

                          {(entry.subtitle || entry.summary) && (
                            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                              {entry.subtitle || entry.summary}
                            </p>
                          )}
                        </div>

                        <div className="pt-6 relative z-10 flex items-center justify-between border-t border-slate-800/80 mt-4 text-xs font-mono text-slate-400 group-hover:text-slate-200">
                          <span>Read Entry</span>
                          <span className="text-[#C9A24B] group-hover:translate-x-1 transition-transform">
                            &rarr;
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : (
          /* VIEW 3: ROOT MA'ATVERSE PORTAL (ALL SECTIONS) */
          <div className="space-y-12 sm:space-y-16 animate-fadeIn">
            {/* Navigation back to tools */}
            <div>
              <MaatverseButton
                variant="secondary"
                onClick={() => onNavigate('tools')}
                icon={<ArrowLeft className="w-4 h-4 stroke-[2.5]" />}
              >
                Back to Tools
              </MaatverseButton>
            </div>

            {/* Hero Header */}
            <div className="space-y-4 max-w-3xl">
              <span
                className="text-xs font-mono tracking-[0.3em] uppercase font-bold"
                style={{ color: '#C9A24B' }}
              >
                MA'ATVERSE
              </span>

              <h1
                className="text-5xl sm:text-6xl lg:text-7xl font-normal text-white tracking-tight leading-[1.05]"
                style={{
                  fontFamily: 'ui-serif, Georgia, "Times New Roman", serif',
                  textShadow: '0 2px 20px rgba(0, 0, 0, 0.7)',
                }}
              >
                The Ma'atverse
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-[#e6edff]/90 leading-relaxed font-light max-w-2xl">
                You have entered the universe behind CoreIQ. Choose a threshold below to explore lore, creations, and builders.
              </p>
            </div>

            {/* Portal Doors */}
            <div className="space-y-6">
              {sectionsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-pulse">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="rounded-2xl bg-[#080b18]/60 border border-slate-800 h-36 p-5 flex flex-col justify-between"
                    >
                      <div className="h-6 bg-slate-800/60 rounded w-2/3" />
                      <div className="h-4 bg-slate-800/40 rounded w-1/3" />
                    </div>
                  ))}
                </div>
              ) : sectionsError ? (
                <div className="rounded-2xl bg-red-950/20 border border-red-500/30 p-8 text-center space-y-4">
                  <p className="text-sm text-red-300">{sectionsError}</p>
                  <MaatverseButton variant="secondary" onClick={reloadSections}>
                    Retry
                  </MaatverseButton>
                </div>
              ) : sections.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-blue-900/60 p-12 text-center text-slate-400">
                  No published portals found.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {sections.map((section) => (
                    <MaatverseDoor
                      key={section.id}
                      label={section.title}
                      description={section.description || section.blurb}
                      coverUrl={section.cover_url || section.image_url}
                      entryCount={section.entry_count || 0}
                      isMock={section.is_mock}
                      onClick={() => onNavigate(`maatverse/${section.slug}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
