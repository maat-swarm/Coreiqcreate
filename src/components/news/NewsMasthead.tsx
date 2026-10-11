import React from 'react';
import { useMediaSlot } from '../../services/mediaSlots';
import { NewsroomIcon } from './NewsIcons';
import { NewsIssueSummary } from './newsAdapter';

interface NewsMastheadProps {
  currentIssue: NewsIssueSummary | null;
  allIssues: NewsIssueSummary[];
  selectedIssueDate: string;
  onSelectIssue: (date: string) => void;
}

export const NewsMasthead: React.FC<NewsMastheadProps> = ({
  currentIssue,
  allIssues,
  selectedIssueDate,
  onSelectIssue,
}) => {
  const { items: mascotItems } = useMediaSlot('news.mascot');
  const mascotUrl = mascotItems?.[0]?.url || null;

  return (
    <header className="w-full pt-6 pb-4 sm:pt-10 sm:pb-6">
      {/* Top 3px solid rule */}
      <div className="w-full border-t-[3px] border-[#f4f1ea] mb-4 sm:mb-6" />

      {/* Title & Mascot Row */}
      <div className="flex items-center justify-between gap-4 pb-4 sm:pb-6">
        <div className="flex-1 min-w-0">
          <h1
            className="news-serif text-[#f4f1ea] font-normal tracking-tight uppercase leading-[0.95] select-none"
            style={{ fontSize: 'clamp(32px, 9vw, 64px)' }}
          >
            The CoreIQ Weekly
          </h1>
          <p className="news-mono text-[#9aa3b2] mt-2 tracking-widest text-[10px] sm:text-[11px]">
            ARCHITECTURAL SIGNALS · FRONTIER AI RELEASES · OPEN PROTOCOLS
          </p>
        </div>

        {/* Mascot / Newsroom Icon at the right */}
        <div className="shrink-0 flex items-center justify-center">
          {mascotUrl ? (
            <img
              src={mascotUrl}
              alt="The CoreIQ Weekly"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="w-[72px] h-[72px] md:w-[96px] md:h-[96px] object-contain rounded-[2px]"
            />
          ) : (
            <div className="w-[72px] h-[72px] md:w-[96px] md:h-[96px] flex items-center justify-center bg-[#0d1220] border border-white/10 rounded-[2px]">
              <NewsroomIcon className="w-9 h-9 md:w-12 md:h-12 text-[#9aa3b2]" />
            </div>
          )}
        </div>
      </div>

      {/* Dateline & Issue Selector Bar */}
      <div className="border-t border-b border-white/[0.14] py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[#9aa3b2]">
        {/* Dateline mono text */}
        <div className="news-mono text-[#f4f1ea] text-[11px]">
          {currentIssue ? (
            <span>
              ISSUE No. {currentIssue.issueNumber} . {currentIssue.formattedDate} . {currentIssue.count}{' '}
              {currentIssue.count === 1 ? 'STORY' : 'STORIES'}
            </span>
          ) : (
            <span>THE COREIQ WEEKLY · INTELLIGENCE DESK</span>
          )}
        </div>

        {/* Issue picker with visible label */}
        {allIssues.length > 0 && (
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <label
              htmlFor="news-issue-select"
              className="news-mono text-[#9aa3b2] text-[10px] sm:text-[11px] whitespace-nowrap cursor-pointer"
            >
              ARCHIVE:
            </label>
            <select
              id="news-issue-select"
              value={selectedIssueDate}
              onChange={(e) => onSelectIssue(e.target.value)}
              className="news-mono bg-[#0d1220] text-[#f4f1ea] border border-white/[0.14] rounded-[2px] px-2.5 py-1.5 text-[11px] news-focus cursor-pointer hover:border-white/30"
            >
              {allIssues.map((issue) => (
                <option key={issue.date} value={issue.date} className="bg-[#06080d] text-[#f4f1ea]">
                  Issue #{issue.issueNumber} ({issue.date}) — {issue.count} stories
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </header>
  );
};
