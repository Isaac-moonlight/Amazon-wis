import React from 'react';
import { MenuItem } from '../types/restaurant';
import { formatPriceShort } from '../data/menuData';
import { Flame, Plus, SlidersHorizontal, Sparkles } from 'lucide-react';

interface MenuItemCardProps {
  item: MenuItem;
  quantityInCart: number;
  onDirectAdd: (item: MenuItem) => void;
  onOpenChoice: (item: MenuItem) => void;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  quantityInCart,
  onDirectAdd,
  onOpenChoice,
}) => {
  const subIngredients = (item.ingredients || []).slice(0, 4).join(' / ');

  return (
    <article className="bg-[#14100d] border border-[#2a2016] hover:border-[#4d3a28] transition-all duration-200 flex flex-col group overflow-hidden">
      {/* Image container with badges and cart count */}
      <div 
        onClick={() => onOpenChoice(item)}
        className="relative aspect-square w-full bg-[#1b1510] overflow-hidden cursor-pointer"
      >
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14100d] via-transparent to-black/30" />

        {/* Badges top-left */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 pointer-events-none">
          {item.badge && (
            <span className="bg-[#c29344] text-[#0d0b0a] text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 shadow-md">
              {item.badge}
            </span>
          )}
          {item.isHouseSpecial && !item.badge && (
            <span className="bg-black/80 backdrop-blur-sm border border-[#c29344]/50 text-[#e5b869] text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5">
              Spécialité Maison
            </span>
          )}
        </div>

        {/* Spicy indicator */}
        {item.spicyLevel && item.spicyLevel > 0 && (
          <div className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-sm border border-red-500/30 px-1.5 py-0.5 flex items-center gap-0.5">
            {Array.from({ length: item.spicyLevel }).map((_, i) => (
              <Flame key={i} className="w-3 h-3 text-red-500 fill-red-500" />
            ))}
          </div>
        )}

        {/* Quantity in cart badge */}
        {quantityInCart > 0 && (
          <div className="absolute top-2.5 right-2.5 w-7 h-7 bg-[#c29344] text-[#0d0b0a] font-black text-xs flex items-center justify-center shadow-lg border border-[#0d0b0a]">
            {quantityInCart}
          </div>
        )}
      </div>

      {/* Info Content */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 
            onClick={() => onOpenChoice(item)}
            className="font-sans font-bold text-sm sm:text-base text-[#f5ebd9] leading-snug group-hover:text-[#c29344] transition-colors cursor-pointer"
          >
            {item.name}
          </h3>
          <span className="font-mono-numbers font-bold text-sm text-[#e5b869] shrink-0 whitespace-nowrap">
            {formatPriceShort(item.price)}
          </span>
        </div>

        {/* Ingredients preview (style inspired by reference) */}
        {subIngredients ? (
          <p className="text-[11px] text-[#8e7e6e] line-clamp-2 leading-relaxed">
            {subIngredients}
          </p>
        ) : (
          <p className="text-[11px] text-[#8e7e6e] line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Action Buttons: AJOUTER + CHOIX */}
        <div className="mt-auto pt-3 border-t border-[#231b14] flex items-center gap-2">
          {/* Direct Add Button */}
          <button
            onClick={() => onDirectAdd(item)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#c29344] hover:bg-[#d8a74e] active:scale-95 text-[#0d0b0a] text-xs font-extrabold uppercase tracking-wider transition-all"
            title="Ajouter directement avec le format standard"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Ajouter</span>
          </button>

          {/* Custom Choice Modal Trigger */}
          <button
            onClick={() => onOpenChoice(item)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-transparent hover:bg-[#201812] border border-[#3b2d1f] hover:border-[#c29344] text-[#ede4d8] hover:text-[#c29344] text-xs font-bold uppercase tracking-wider transition-all"
            title="Choisir le format, suppléments ou note de cuisson"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Choix</span>
          </button>
        </div>
      </div>
    </article>
  );
};
