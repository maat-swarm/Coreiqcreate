import React from 'react';
import { NormalizedNewsItem } from './newsAdapter';
import { NewsImage } from './NewsImage';
import { ExternalLinkIcon } from './NewsIcons';

interface NewsTopStoryProps {
  story: NormalizedNewsItem;
  mascotUrl?: string | null;
  onAsk: (query: string) => void;
}

export const NewsTopStory: React.FC<NewsTopStoryProps> = ({
  story,
  mascotUrl,
  onAsk,
}) => {
  const askQuery = `Explain this AI news: ${story.title}`;

  return (
    <article
      aria-label="Top Story"
      className="w-full py-6 sm:py-8 border-b border-white/[0.14]"
    >
      <div
        className="pl-3 sm:pl-5"
        style={{ borderLeft: `3px solid ${story.categoryColor}` }}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Image Column: Edge-to-edge 16:9 on mobile, 60% on tablet & desktop */}
          <div className="md:col-span-7 w-full">
            <NewsImage
              src={story.imageUrl}
              alt={story.title}
              mascotUrl={mascotUrl}
              aspectRatio="16 / 9"
              className="w-full rounded-[2px]"
            />
          </div>

          {/* Text Column: 40% on tablet & desktop */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-4">
            {/* Kicker with Category color square */}
            <div className="flex items-center gap-2 news-mono text-[#9aa3b2]">
              <span
                className="w-2 h-2 shrink-0 rounded-[1px]"
                style={{ backgroundColor: story.categoryColor }}
                aria-hidden="true"
              />
              <span>
                TOP STORY . {story.categoryLabel.toUpperCase()}
              </span>
            </div>

            {/* Headline */}
            <h2 className="news-serif text-[28px] md:text-[40px] leading-[1.1] text-[#f4f1ea] font-normal tracking-tight">
              {story.hasOutboundLink ? (
                <a
                  href={story.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#19d9ff] transition-colors news-focus"
                >
                  {story.title}
                </a>
              ) : (
                story.title
              )}
            </h2>

            {/* Dek (summary): 16px/1.5 muted, max 3 lines on mobile */}
            {story.summary && (
              <p className="text-[16px] leading-[1.5] text-[#9aa3b2] line-clamp-3 md:line-clamp-none font-sans">
                {story.summary}
              </p>
            )}

            {/* Byline (mono): {SOURCE NAME} . {domain} . {relative time} */}
            <div className="news-mono text-[#9aa3b2] text-[11px] pt-1">
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

            {/* Actions: Solid primary button + Ask CoreIQ text link */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              {story.hasOutboundLink && (
                <a
                  href={story.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-[44px] min-h-[44px] px-5 bg-[#19d9ff] hover:bg-[#5ce1e6] active:bg-[#19d9ff] text-[#06080d] font-semibold text-xs tracking-wider uppercase inline-flex items-center gap-1.5 rounded-[2px] news-focus transition-none cursor-pointer"
                >
                  <span>Read at {story.sourceName}</span>
                  <ExternalLinkIcon />
                </a>
              )}

              <a
                href={`/ask?q=${encodeURIComponent(askQuery)}`}
                onClick={(e) => {
                  e.preventDefault();
                  onAsk(askQuery);
                }}
                className="news-mono text-[#19d9ff] hover:underline underline-offset-4 py-2 text-[11px] news-focus cursor-pointer"
              >
                Ask CoreIQ about this
              </a>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
