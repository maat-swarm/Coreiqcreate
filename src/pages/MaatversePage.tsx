import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { PageBackground } from '../components/environment/PageBackground';
import { MaatverseButton, MaatverseDoor } from '../components/tools/maatverseButtons';
import { NavRoute } from '../types';

export interface MaatversePageProps {
  onNavigate: (route: NavRoute) => void;
}

const DOORS = [
  'The Builders',
  'The Lore',
  'Comics',
  'Downloads and Skins',
  'Videos',
];

export const MaatversePage: React.FC<MaatversePageProps> = ({ onNavigate }) => {
  // Set document title and noindex meta tag while this page is a shell
  /* Note: noindex must be removed when real content ships */
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Ma'atverse | CoreIQ Create";

    let metaTag = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    let created = false;
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.name = 'robots';
      metaTag.content = 'noindex';
      document.head.appendChild(metaTag);
      created = true;
    } else {
      metaTag.content = 'noindex';
    }

    return () => {
      document.title = previousTitle;
      if (created && metaTag && metaTag.parentNode) {
        metaTag.parentNode.removeChild(metaTag);
      } else if (metaTag) {
        metaTag.content = 'all';
      }
    };
  }, []);

  return (
    <div className="w-full relative min-h-screen flex flex-col justify-between">
      {/* Fixed Ma'atverse Background Portal */}
      <PageBackground slotKey="maatverse.page.background" variant="maatverse" />

      {/* Main Transparent Content Shell */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 space-y-12 sm:space-y-16">
        
        {/* Navigation back */}
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
            You have entered the universe behind CoreIQ.
          </p>
        </div>

        {/* 5 Inert Doors */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {DOORS.map((doorLabel) => (
              <MaatverseDoor key={doorLabel} label={doorLabel} />
            ))}
          </div>
        </div>

      </main>
    </div>
  );
};
