import React from 'react';
import { MenuCategory } from '../types/restaurant';
import { CATEGORIES } from '../data/menuData';

interface CategoryFilterProps {
  activeCategory: MenuCategory | 'all';
  onSelectCategory: (category: MenuCategory | 'all') => void;
  itemCounts: Record<string, number>;
  totalCount: number;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  activeCategory,
  onSelectCategory,
  itemCounts,
  totalCount,
}) => {
  return (
    <div className="sticky top-[58px] md:top-[65px] z-30 bg-[#0d0b0a]/95 backdrop-blur-md border-b border-[#282018]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
          {/* All tab */}
          <button
            onClick={() => onSelectCategory('all')}
            className={`shrink-0 px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeCategory === 'all'
                ? 'text-[#c29344] border-[#c29344] bg-[#1a140f]'
                : 'text-[#8f7e6e] border-transparent hover:text-[#ede4d8] hover:bg-[#15100c]'
            }`}
          >
            <span>Toute la Carte</span>
            <span className="ml-1.5 text-[10px] opacity-70 font-mono-numbers">
              ({totalCount})
            </span>
          </button>

          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`shrink-0 px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                  isActive
                    ? 'text-[#c29344] border-[#c29344] bg-[#1a140f]'
                    : 'text-[#8f7e6e] border-transparent hover:text-[#ede4d8] hover:bg-[#15100c]'
                }`}
              >
                <span>{cat.name}</span>
                <span className="ml-1.5 text-[10px] opacity-70 font-mono-numbers">
                  ({itemCounts[cat.id] || 0})
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
