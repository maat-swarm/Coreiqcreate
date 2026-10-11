import React, { useEffect } from 'react';
import { NavRoute } from '../types';
import '../components/news/news.css';
import { useNews } from '../components/news/useNews';
import { NewsMasthead } from '../components/news/NewsMasthead';
import { NewsCategoryTabs } from '../components/news/NewsCategoryTabs';
import { NewsTopStory } from '../components/news/NewsTopStory';
import { NewsAlsoThisWeek } from '../components/news/NewsAlsoThisWeek';
import { NewsSidebar } from '../components/news/NewsSidebar';
import { NewsClosingStrip } from '../components/news/NewsClosingStrip';
import { NewsroomIcon } from '../components/news/NewsIcons';
import { useMediaSlot } from '../services/mediaSlots';
import { CATEGORIES, NewsCategorySlug } from '../components/news/newsAdapter';

interface NewsPageProps {
  onNavigate: (route: NavRoute) => void;
  onAsk: (query: string) => void;
}

export const NewsPage: React.FC<NewsPageProps> = ({ onNavigate, onAsk }) => {
  const {
    state,
    items,
    allIssueItems,
    selectedCategory,
    selectedIssueDate,
    currentIssueSummary,
    issueSummaries,
    leadStory,
    alsoThisWeekStories,
    setSelectedCategory,
    setSelectedIssueDate,
    refetch,
  } = useNews();

  const { items: mascotItems } = useMediaSlot('news.mascot');
  const mascotUrl = mascotItems?.[0]?.url || null;

  // SEO & Head Metadata per Section 8
  useEffect(() => {
    document.title = 'AI News - The CoreIQ Weekly';
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', 'A weekly digest of the AI stories that matter, with sources.');
  }, []);

  const isAllCategory = !selectedCategory || selectedCategory === 'all';
  const categoryMeta = !isAllCategory ? CATEGORIES[selectedCategory as NewsCategorySlug] : null;

  return (
    <div className="news-root w-full min-h-screen relative z-20">
      {/* Maximum container 1120px, centered */}
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* MASTHEAD (Section 5A) */}
        <NewsMasthead
          currentIssue={currentIssueSummary}
          allIssues={issueSummaries}
          selectedIssueDate={selectedIssueDate}
          onSelectIssue={setSelectedIssueDate}
        />

        {/* LOADING STATE: Static grey skeleton rows (no shimmer), masthead + 5 rows */}
        {state === 'loading' && (
          <div className="w-full pt-4 space-y-6">
            <div className="h-10 bg-[#0d1220] border border-white/10 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4">
              <div className="md:col-span-7 h-64 bg-[#0d1220] border border-white/10" />
              <div className="md:col-span-5 space-y-4">
                <div className="h-4 bg-[#141a29] w-1/3" />
                <div className="h-8 bg-[#141a29] w-full" />
                <div className="h-16 bg-[#141a29] w-full" />
                <div className="h-4 bg-[#141a29] w-1/2" />
              </div>
            </div>
            <div className="pt-6 space-y-4 border-t border-white/[0.14]">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className="h-20 bg-[#0d1220] border border-white/10 flex items-center justify-between p-4"
                >
                  <div className="space-y-2 flex-1 mr-4">
                    <div className="h-4 bg-[#141a29] w-3/4" />
                    <div className="h-3 bg-[#141a29] w-1/3" />
                  </div>
                  <div className="w-[72px] h-[72px] bg-[#141a29] shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ERROR STATE: Couldn't load the latest issue + retry button + empty block */}
        {state === 'error' && (
          <div className="w-full pt-6">
            <div className="p-3 border border-white/[0.14] bg-[#0d1220] text-[#f4f1ea] text-xs flex items-center justify-between mb-8 rounded-[2px]">
              <span className="news-mono">Couldn't load the latest issue.</span>
              <button
                onClick={refetch}
                className="px-3 py-1 bg-[#19d9ff] text-[#06080d] news-mono text-[10px] font-bold rounded-[2px] news-focus cursor-pointer"
              >
                RETRY
              </button>
            </div>
            <div className="py-24 flex flex-col items-center justify-center text-center">
              {mascotUrl ? (
                <img
                  src={mascotUrl}
                  alt="The CoreIQ Weekly"
                  className="w-16 h-16 object-contain opacity-70 mb-4"
                />
              ) : (
                <NewsroomIcon className="w-16 h-16 text-[#9aa3b2] opacity-70 mb-4" />
              )}
              <p className="news-serif text-2xl text-[#f4f1ea] font-normal">
                The first issue lands Friday.
              </p>
            </div>
          </div>
        )}

        {/* EMPTY STATE: No published items */}
        {state === 'empty' && (
          <div className="w-full py-24 flex flex-col items-center justify-center text-center">
            {mascotUrl ? (
              <img
                src={mascotUrl}
                alt="The CoreIQ Weekly"
                className="w-16 h-16 object-contain opacity-70 mb-4"
              />
            ) : (
              <NewsroomIcon className="w-16 h-16 text-[#9aa3b2] opacity-70 mb-4" />
            )}
            <p className="news-serif text-2xl text-[#f4f1ea] font-normal">
              The first issue lands Friday.
            </p>
          </div>
        )}

        {/* READY STATE */}
        {state === 'ready' && (
          <>
            {/* CATEGORY TABS (Section 5B) */}
            <div className="mt-2">
              <NewsCategoryTabs
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </div>

            {/* MAIN EDITORIAL BODY + SIDEBAR (Section 5C, 5D, 5E) */}
            <div className="w-full flex flex-col lg:flex-row items-start justify-between gap-8 pt-2">
              {/* Main Content Column */}
              <div className="flex-1 w-full min-w-0">
                {/* When Category is All: Top story + Also this week */}
                {isAllCategory ? (
                  <>
                    {leadStory && (
                      <NewsTopStory
                        story={leadStory}
                        mascotUrl={mascotUrl}
                        onAsk={onAsk}
                      />
                    )}

                    <NewsAlsoThisWeek
                      stories={alsoThisWeekStories}
                      mascotUrl={mascotUrl}
                    />
                  </>
                ) : (
                  /* When Category is filtered: Lead block hidden, all matching items in list */
                  <div>
                    {items.length === 0 ? (
                      <div className="py-16 text-center text-[#9aa3b2] news-serif text-lg border-b border-white/[0.14]">
                        No stories in this category this week.
                      </div>
                    ) : (
                      <NewsAlsoThisWeek
                        stories={items}
                        mascotUrl={mascotUrl}
                        sectionTitle={`${categoryMeta?.label.toUpperCase() || 'CATEGORY'} . ${items.length}`}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Sidebar Column (Section 5E): Previous Issues + Newsletter */}
              <NewsSidebar
                allIssues={issueSummaries}
                selectedIssueDate={selectedIssueDate}
                onSelectIssue={setSelectedIssueDate}
              />
            </div>

            {/* CLOSING STRIP (Section 5F) */}
            <NewsClosingStrip onNavigate={onNavigate} />
          </>
        )}
      </div>
    </div>
  );
};
