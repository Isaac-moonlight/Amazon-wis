import React, { useState, useEffect } from 'react';
import { MenuItem, ItemVariant, ItemOption } from '../types/restaurant';
import { formatPriceShort, formatPrice } from '../data/menuData';
import { X, Plus, Minus, Check, Clock, Flame, Utensils } from 'lucide-react';

interface ItemDetailModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onConfirmAdd: (payload: {
    item: MenuItem;
    variant?: ItemVariant;
    selectedOptions: string[];
    optionsPrice: number;
    quantity: number;
    specialInstructions?: string;
    totalPrice: number;
  }) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  onClose,
  onConfirmAdd,
}) => {
  const [selectedVariant, setSelectedVariant] = useState<ItemVariant | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [instructions, setInstructions] = useState<string>('');

  useEffect(() => {
    if (item) {
      // Default to first variant if exists
      if (item.variants && item.variants.length > 0) {
        setSelectedVariant(item.variants[0]);
      } else {
        setSelectedVariant(null);
      }
      setSelectedOptions([]);
      setQuantity(1);
      setInstructions('');
    }
  }, [item]);

  if (!item) return null;

  const basePrice = selectedVariant ? selectedVariant.price : item.price;
  const optionsPrice = (item.availableOptions || [])
    .filter(opt => selectedOptions.includes(opt.name))
    .reduce((sum, opt) => sum + opt.price, 0);

  const unitTotal = basePrice + optionsPrice;
  const grandTotal = unitTotal * quantity;

  const toggleOption = (optName: string) => {
    setSelectedOptions(prev => 
      prev.includes(optName) ? prev.filter(o => o !== optName) : [...prev, optName]
    );
  };

  const handleAdd = () => {
    onConfirmAdd({
      item,
      variant: selectedVariant || undefined,
      selectedOptions,
      optionsPrice,
      quantity,
      specialInstructions: instructions.trim() || undefined,
      totalPrice: grandTotal,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-sm"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-[#14100d] border border-[#3d2f21] overflow-hidden text-[#ede4d8] shadow-2xl z-10 flex flex-col max-h-[92vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 bg-black/75 hover:bg-[#251d16] text-[#bcaea0] hover:text-white flex items-center justify-center border border-[#3d2e20] transition-colors"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Hero Image */}
        <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-[#1b1511] overflow-hidden shrink-0">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#14100d] via-transparent to-black/30" />

          {item.badge && (
            <div className="absolute top-3 left-3 bg-[#c29344] text-[#0d0b0a] text-xs font-black uppercase tracking-wider px-2.5 py-1 shadow-md">
              {item.badge}
            </div>
          )}

          {item.preparationTimeMinutes && (
            <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm border border-[#3e3022] text-[#d6c9ba] text-xs px-2.5 py-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#c29344]" />
              <span>~{item.preparationTimeMinutes} min de préparation</span>
            </div>
          )}
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* Header Title & Base Price */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#f6efe4] leading-snug">
                {item.name}
              </h2>
              {item.spicyLevel && item.spicyLevel > 0 && (
                <div className="flex items-center gap-1 text-red-400 text-xs mt-1">
                  <Flame className="w-3.5 h-3.5 fill-red-400" />
                  <span>Relevé au piment ({item.spicyLevel}/3)</span>
                </div>
              )}
            </div>
            <span className="font-mono-numbers font-bold text-lg text-[#e5b869] whitespace-nowrap">
              {formatPriceShort(basePrice)}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[#a89786] leading-relaxed">
            {item.description}
          </p>

          {/* Ingredients list */}
          {item.ingredients && item.ingredients.length > 0 && (
            <div className="p-2.5 bg-[#19130f] border border-[#2e2318] text-[11px] text-[#9a8978]">
              <span className="font-bold text-[#c29344] uppercase tracking-wider block mb-1">
                Ingrédients & Épices :
              </span>
              <span>{item.ingredients.join(' · ')}</span>
            </div>
          )}

          {/* Variants / Formats Selection */}
          {item.variants && item.variants.length > 0 && (
            <div>
              <label className="text-xs uppercase font-extrabold tracking-widest text-[#a89786] block mb-2">
                1. Choisissez le format
              </label>
              <div className="grid grid-cols-2 gap-2">
                {item.variants.map((v) => {
                  const isSelected = selectedVariant?.name === v.name;
                  return (
                    <button
                      key={v.name}
                      onClick={() => setSelectedVariant(v)}
                      className={`p-3 text-left border transition-all ${
                        isSelected
                          ? 'border-[#c29344] bg-[#241a12] text-[#f5ebd9] shadow-md'
                          : 'border-[#2d2218] bg-[#17110d] text-[#a59585] hover:border-[#4d3a28]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{v.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#c29344]" />}
                      </div>
                      <div className="text-xs font-mono-numbers font-bold text-[#e5b869] mt-1">
                        {formatPriceShort(v.price)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Options / Extras */}
          {item.availableOptions && item.availableOptions.length > 0 && (
            <div>
              <label className="text-xs uppercase font-extrabold tracking-widest text-[#a89786] block mb-2">
                2. Accompagnements & Suppléments (Optionnel)
              </label>
              <div className="space-y-1.5">
                {item.availableOptions.map((opt) => {
                  const isChecked = selectedOptions.includes(opt.name);
                  return (
                    <button
                      key={opt.name}
                      onClick={() => toggleOption(opt.name)}
                      className={`w-full p-2.5 flex items-center justify-between border text-left transition-all ${
                        isChecked
                          ? 'border-[#c29344] bg-[#241a12] text-[#f5ebd9]'
                          : 'border-[#2d2218] bg-[#17110d] text-[#a59585] hover:border-[#4d3a28]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 border flex items-center justify-center ${
                          isChecked ? 'bg-[#c29344] border-[#c29344]' : 'border-[#473626]'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 text-black stroke-[3]" />}
                        </div>
                        <span className="text-xs font-medium text-[#ede4d8]">
                          {opt.name}
                        </span>
                      </div>
                      <span className="text-xs font-mono-numbers font-bold text-[#e5b869]">
                        +{formatPriceShort(opt.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Kitchen Instructions */}
          <div>
            <label className="text-xs uppercase font-extrabold tracking-widest text-[#a89786] block mb-1.5">
              3. Note pour le Chef ou le Barman (Optionnel)
            </label>
            <input
              type="text"
              placeholder="Ex: sans piment, cuisson à point, sans oignon..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-[#17110d] border border-[#2d2218] text-[#ede4d8] placeholder-[#6d5b4a] focus:outline-none focus:border-[#c29344]"
            />
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 bg-[#18120e] border-t border-[#2d2218] flex items-center gap-3 shrink-0">
          {/* Quantity Controls */}
          <div className="flex items-center bg-[#1e1712] border border-[#3b2d1f]">
            <button
              onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
              className="p-2 text-[#9a8979] hover:text-white"
              aria-label="Diminuer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-3 text-xs font-mono-numbers font-bold text-[#f5ebd9]">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(prev => prev + 1)}
              className="p-2 text-[#9a8979] hover:text-white"
              aria-label="Augmenter"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add to Cart CTA */}
          <button
            onClick={handleAdd}
            className="flex-1 flex items-center justify-between px-4 py-2.5 bg-[#c29344] hover:bg-[#d8a74e] active:scale-[0.99] text-[#0d0b0a] font-heading font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-950/40"
          >
            <span>Ajouter au panier</span>
            <span className="font-mono-numbers text-sm font-black">
              {formatPriceShort(grandTotal)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
