import React from 'react';
import { X, Check, MapPin } from 'lucide-react';
import { RESTAURANT_CONFIG } from '../data/menuData';

interface TableSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTable: number | null;
  tableConfirmed: boolean;
  onSelectTable: (tableNum: number) => void;
}

export const TableSelectorModal: React.FC<TableSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedTable,
  tableConfirmed,
  onSelectTable,
}) => {
  if (!isOpen) return null;

  const tables = Array.from({ length: RESTAURANT_CONFIG.maxTables }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-sm"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-[#13100d] border border-[#3f3123] p-6 text-[#ede4d8] shadow-2xl z-10 flex flex-col max-h-[90vh]">
        {/* Close Button if already confirmed */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1 text-[#8c7b6d] hover:text-white transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon + Title */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-[#201812] border border-[#c29344]/50 flex items-center justify-center mx-auto mb-3 text-[#c29344]">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-extrabold text-xl text-[#f6efe4]">
            Indiquez votre Table
          </h3>
          <p className="text-xs text-[#9d8d7e] mt-1 max-w-xs mx-auto">
            Sélectionnez le numéro inscrit sur le chevalet ou le sticker de votre table (1 à 25).
          </p>
        </div>

        {/* 4x Grid of Tables (inspired by reference grid) */}
        <div className="grid grid-cols-5 gap-2 overflow-y-auto p-1 max-h-[46vh] thin-scroll">
          {tables.map((num) => {
            const isSelected = selectedTable === num;
            return (
              <button
                key={num}
                onClick={() => onSelectTable(num)}
                className={`py-3 px-2 flex flex-col items-center justify-center border transition-all ${
                  isSelected
                    ? 'bg-[#c29344] text-[#0d0b0a] border-[#c29344] font-black shadow-lg shadow-amber-950/50 scale-105'
                    : 'bg-[#18120e] text-[#d6caba] border-[#2c2117] hover:border-[#634e38] hover:bg-[#201811]'
                }`}
              >
                <span className={`text-[9px] uppercase tracking-widest ${isSelected ? 'text-black/70' : 'text-[#7e6d5e]'}`}>
                  N°
                </span>
                <span className="text-base font-extrabold font-mono-numbers">
                  {num}
                </span>
                {isSelected && <Check className="w-3 h-3 stroke-[3] mt-0.5" />}
              </button>
            );
          })}
        </div>

        {/* Footer Hint */}
        <div className="mt-5 pt-3 border-t border-[#251d15] text-center">
          <button
            onClick={onClose}
            className="text-xs text-[#8c7a69] hover:text-[#ede4d8] uppercase tracking-wider font-semibold transition-colors"
          >
            {tableConfirmed ? "Conserver cette table" : "Continuer à consulter"}
          </button>
        </div>
      </div>
    </div>
  );
};
