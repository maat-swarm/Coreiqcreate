import React from 'react';
import { NewsIssueSummary } from './newsAdapter';
import { NewsNewsletter } from './NewsNewsletter';

interface NewsSidebarProps {
  allIssues: NewsIssueSummary[];
  selectedIssueDate: string;
  onSelectIssue: (date: string) => void;
}

export const NewsSidebar: React.FC<NewsSidebarProps> = ({
  allIssues,
  selectedIssueDate,
  onSelectIssue,
}) => {
  // Show up to 8 recent issues
  const recentIssues = allIssues.slice(0, 8);

  return (
    <aside
      aria-label="Sidebar Archive & Newsletter"
      className="w-full lg:w-[320px] shrink-0 space-y-8 pt-6 lg:pt-0"
    >
      {/* PREVIOUS ISSUES Section */}
      {recentIssues.length > 0 && (
        <section aria-labelledby="previous-issues-heading">
          <div className="border-b border-white/[0.14] pb-2 mb-3">
            <h3
              id="previous-issues-heading"
              className="news-mono text-[#f4f1ea] text-[11px] font-semibold"
            >
              PREVIOUS ISSUES
            </h3>
          </div>

          <ul className="divide-y divide-white/[0.08]">
            {recentIssues.map((issue) => {
              const isSelected = issue.date === selectedIssueDate;
              return (
                <li key={issue.date}>
                  <button
                    onClick={() => onSelectIssue(issue.date)}
                    className={`w-full py-2.5 px-1 flex items-center justify-between text-left news-focus cursor-pointer transition-none ${
                      isSelected
                        ? 'text-[#19d9ff]'
                        : 'text-[#9aa3b2] hover:text-[#f4f1ea]'
                    }`}
                  >
                    <span className="news-mono text-[11px]">
                      {isSelected && <span className="mr-1.5 font-bold">●</span>}
                      {issue.formattedDate || issue.date}
                    </span>
                    <span className="news-mono text-[10px] opacity-70">
                      {issue.count} {issue.count === 1 ? 'STORY' : 'STORIES'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Newsletter Signup in flat 1px-bordered box */}
      <section aria-label="Newsletter Subscription">
        <NewsNewsletter />
      </section>
    </aside>
  );
};
