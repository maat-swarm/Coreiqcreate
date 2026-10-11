import React from 'react';
import { ArrowRightIcon } from './NewsIcons';
import { NavRoute } from '../../types';

interface NewsClosingStripProps {
  onNavigate?: (route: NavRoute) => void;
}

export const NewsClosingStrip: React.FC<NewsClosingStripProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full border-t border-white/[0.14] py-8 mt-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <a
          href="/ask"
          onClick={(e) => {
            if (onNavigate) {
              e.preventDefault();
              onNavigate('ask');
            }
          }}
          className="news-mono text-xs sm:text-[13px] text-[#f4f1ea] hover:text-[#19d9ff] inline-flex items-center gap-2 news-focus cursor-pointer transition-none group"
        >
          <span>Want this kind of intelligence working inside your business? Talk to CoreIQ</span>
          <span className="text-[#19d9ff] group-hover:translate-x-0.5 transition-none">
            <ArrowRightIcon className="w-4 h-4" />
          </span>
        </a>

        <span className="news-mono text-[10px] text-[#9aa3b2]/60">
          COREIQ DISPATCH · VERIFIED SOURCES ONLY
        </span>
      </div>
    </footer>
  );
};
