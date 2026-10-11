import React from 'react';
import { NormalizedNewsItem } from './newsAdapter';
import { NewsImage } from './NewsImage';

interface NewsAlsoThisWeekProps {
  stories: NormalizedNewsItem[];
  mascotUrl?: string | null;
  sectionTitle?: string;
}

export const NewsAlsoThisWeek: React.FC<NewsAlsoThisWeekProps> = ({
  stories,
  mascotUrl,
  sectionTitle,
}) => {
  if (stories.length === 0) {
    return null;
  }

  const label = sectionTitle || `ALSO THIS WEEK . ${stories.length}`;

  return (
    <section aria-labelledby="also-this-week-heading" className="w-full pt-6 pb-8">
      {/* Section Label & 1px rule */}
      <div className="border-b border-white/[0.14] pb-2 mb-2">
        <h2
          id="also-this-week-heading"
          className="news-mono text-[#f4f1ea] text-[11px] font-semibold"
        >
          {label}
        </h2>
      </div>

      {/* Numbered List of Stories */}
      <ol className="divide-y divide-white/[0.14]">
        {stories.map((story, index) => {
          const numeral = String(index + 1).padStart(2, '0');
          const hasLink = story.hasOutboundLink;

          const content = (
            <div className="flex items-start justify-between gap-4 py-4 group">
              {/* Left Column: Number + Headline + Dek + Byline */}
              <div className="flex items-start gap-4 flex-1 min-w-0">
                {/* 01, 02... Numeral in mono muted */}
                <span
                  className="news-mono text-[#9aa3b2] text-[13px] pt-0.5 select-none shrink-0"
                  aria-hidden="true"
                >
                  {numeral}
                </span>

                <div className="flex-1 min-w-0">
                  {/* Category marker & Kicker for filtered items */}
                  <div className="flex items-center gap-1.5 news-mono text-[#9aa3b2] text-[10px] mb-1">
                    <span
                      className="w-1.5 h-1.5 shrink-0 rounded-[1px]"
                      style={{ backgroundColor: story.categoryColor }}
                      aria-hidden="true"
                    />
                    <span>{story.categoryLabel.toUpperCase()}</span>
                  </div>

                  {/* Headline */}
                  <h3 className="news-serif text-[19px] leading-snug text-[#f4f1ea] font-normal group-hover:text-[#19d9ff] transition-none">
                    {story.title}
                  </h3>

                  {/* Dek: hidden on mobile, 2 lines on tablet and up */}
                  {story.summary && (
                    <p className="hidden sm:block text-[14px] leading-normal text-[#9aa3b2] line-clamp-2 mt-1 font-sans">
                      {story.summary}
                    </p>
                  )}

                  {/* Byline in mono */}
                  <div className="news-mono text-[#9aa3b2] text-[10px] sm:text-[11px] mt-2">
                    <span>{story.sourceName.toUpperCase()}</span>
                    {story.sourceDomain && (
                      <>
                        <span className="mx-1.5 text-white/30">.</span>
                        <span>{story.sourceDomain.toUpperCase()}</span>
                      </>
                    )}
                    {story.relativeTime && (
                      <>
                        <span className="mx-1.5 text-white/30">.</span>
                        <time dateTime={story.publishedAt}>{story.relativeTime.toUpperCase()}</time>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: 72x72 Thumbnail */}
              <div className="w-[72px] h-[72px] shrink-0 rounded-[4px] overflow-hidden bg-[#0d1220] border border-white/10">
                <NewsImage
                  src={story.imageUrl}
                  alt={story.title}
                  mascotUrl={mascotUrl}
                  width={72}
                  height={72}
                  className="w-[72px] h-[72px] object-cover"
                />
              </div>
            </div>
          );

          return (
            <li key={story.id}>
              {hasLink ? (
                <a
                  href={story.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block news-focus cursor-pointer"
                  aria-label={`${story.title} (opens source link)`}
                >
                  {content}
                </a>
              ) : (
                content
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
};
