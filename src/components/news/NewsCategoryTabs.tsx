import React from 'react';
import { CATEGORIES, NewsCategorySlug } from './newsAdapter';

interface NewsCategoryTabsProps {
  selectedCategory: string; // 'all' | NewsCategorySlug
  onSelectCategory: (cat: string) => void;
}

interface TabItem {
  id: string;
  label: string;
  color?: string;
}

const TABS: TabItem[] = [
  { id: 'all', label: 'All' },
  { id: 'models-releases', label: CATEGORIES['models-releases'].label, color: CATEGORIES['models-releases'].color },
  { id: 'tools-launches', label: CATEGORIES['tools-launches'].label, color: CATEGORIES['tools-launches'].color },
  { id: 'business-policy', label: CATEGORIES['business-policy'].label, color: CATEGORIES['business-policy'].color },
];

export const NewsCategoryTabs: React.FC<NewsCategoryTabsProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const currentTab = selectedCategory || 'all';

  return (
    <nav
      className="w-full border-b border-white/[0.14] overflow-x-auto news-no-scrollbar"
      role="tablist"
      aria-label="News Categories"
    >
      <div className="flex items-stretch gap-6 min-w-max">
        {TABS.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-controls={`panel-${tab.id}`}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onSelectCategory(tab.id)}
              className={`h-[44px] min-h-[44px] px-1 flex items-center gap-2 text-sm font-medium transition-colors news-focus relative cursor-pointer border-b-2 -mb-[1px] select-none ${
                isActive
                  ? 'border-[#19d9ff] text-[#f4f1ea]'
                  : 'border-transparent text-[#9aa3b2] hover:text-[#f4f1ea]'
              }`}
            >
              {tab.color && (
                <span
                  className="w-2 h-2 shrink-0 rounded-[1px]"
                  style={{ backgroundColor: tab.color }}
                  aria-hidden="true"
                />
              )}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
