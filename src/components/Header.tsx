import React, { useRef } from 'react';
import { 
  Sparkles, 
  MapPin, 
  ShoppingBag, 
  Search, 
  BellRing, 
  ChevronDown, 
  UtensilsCrossed, 
  Clock, 
  Wifi, 
  WifiOff,
  ShieldAlert
} from 'lucide-react';
import { RESTAURANT_CONFIG } from '../data/menuData';

interface HeaderProps {
  currentTable: number | null;
  tableConfirmed: boolean;
  onOpenTableSelect: () => void;
  onOpenKitchenPin: () => void;
  onOpenCallModal: () => void;
  onOpenCart: () => void;
  onOpenSearch: () => void;
  cartCount: number;
  currentView: 'menu' | 'tracking' | 'kitchen';
  onNavigate: (view: 'menu' | 'tracking') => void;
  hasActiveOrder: boolean;
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTable,
  tableConfirmed,
  onOpenTableSelect,
  onOpenKitchenPin,
  onOpenCallModal,
  onOpenCart,
  onOpenSearch,
  cartCount,
  currentView,
  onNavigate,
  hasActiveOrder,
  isOnline,
}) => {
  const clickCountRef = useRef<number>(0);
  const clickTimerRef = useRef<any>(null);

  // Triple-click handler on the logo for kitchen access
  const handleLogoClick = () => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      onOpenKitchenPin();
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
        if (currentView !== 'menu') {
          onNavigate('menu');
        }
      }, 500);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0e0c0b]/95 backdrop-blur-md border-b border-[#282018]">
      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-amber-950/90 text-amber-200 text-xs py-1 px-4 flex items-center justify-between border-b border-amber-800/40">
          <div className="flex items-center gap-2">
            <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="font-medium text-[11px] sm:text-xs">
              Mode Hors-Ligne actif · Vos commandes sont enregistrées localement et synchronisées automatiquement.
            </span>
          </div>
          <span className="text-[10px] tracking-wider uppercase font-bold text-amber-400">
            LOCAL SYNC
          </span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand Logo with Triple Click */}
        <div 
          onClick={handleLogoClick}
          className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
          title="Triple-cliquez pour la console cuisine / bar"
        >
          {/* Emblem with Danxomè shield homage */}
          <div className="w-10 h-10 bg-gradient-to-br from-[#c29344] via-[#8c6527] to-[#3a250e] p-[1.5px] shadow-lg shadow-amber-950/40">
            <div className="w-full h-full bg-[#120e0b] flex items-center justify-center border border-[#e5b869]/30">
              <span className="font-heading font-black text-base text-[#e5b869] tracking-tighter">
                AW
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-extrabold text-base sm:text-lg tracking-wider text-[#f5ebd9] group-hover:text-[#c29344] transition-colors leading-none">
                AMAZONE WIS'ART
              </span>
              <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.5 bg-[#241a12] text-[#c29344] border border-[#c29344]/30 uppercase font-semibold">
                Cotonou
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-[#938272] tracking-wide mt-0.5 hidden xs:block">
              Lounge Bar · Grillades · Art Béninois
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Desktop / Tablet) */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => onNavigate('menu')}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              currentView === 'menu'
                ? 'text-[#c29344] border-b-2 border-[#c29344]'
                : 'text-[#9c8b7c] hover:text-[#f4efe8]'
            }`}
          >
            Menu Carte
          </button>
          <button
            onClick={() => onNavigate('tracking')}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
              currentView === 'tracking'
                ? 'text-[#c29344] border-b-2 border-[#c29344]'
                : 'text-[#9c8b7c] hover:text-[#f4efe8]'
            }`}
          >
            <span>Suivi Direct</span>
            {hasActiveOrder && (
              <span className="w-2 h-2 rounded-full bg-[#c29344] animate-ping" />
            )}
          </button>
          <button
            onClick={onOpenCallModal}
            className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#9c8b7c] hover:text-[#f4efe8] transition-colors"
          >
            Serveur
          </button>
        </nav>

        {/* Right Actions Bar */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="w-9 h-9 bg-[#17120e] hover:bg-[#221a14] border border-[#30251a] hover:border-[#4f3c2a] text-[#b8a795] hover:text-white flex items-center justify-center transition-colors"
            title="Rechercher un plat ou une boisson"
            aria-label="Recherche"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Prominent Table Button (Inspired by El Maestro reference) */}
          <button
            onClick={onOpenTableSelect}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold uppercase tracking-wider transition-all select-none border ${
              !tableConfirmed
                ? 'bg-[#c29344] hover:bg-[#d8a74e] text-[#0d0b0a] border-[#c29344] table-btn-unconfirmed shadow-lg shadow-amber-950/40'
                : 'bg-[#1e1711] hover:bg-[#291f17] text-[#e8ded0] border-[#3f2f1f] hover:border-[#c29344]'
            }`}
            title="Sélectionnez ou modifiez votre table"
          >
            <MapPin className={`w-3.5 h-3.5 ${!tableConfirmed ? 'text-black' : 'text-[#c29344]'}`} />
            <span>
              {tableConfirmed && currentTable ? `Table ${currentTable}` : "Choisir Table"}
            </span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {/* Cart Icon Button */}
          <button
            onClick={onOpenCart}
            className="relative w-9 h-9 bg-[#17120e] hover:bg-[#221a14] border border-[#30251a] hover:border-[#c29344] text-[#ede4d8] flex items-center justify-center transition-colors"
            title="Ouvrir le panier de commande"
            aria-label="Panier"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-[#c29344] text-[#0d0b0a] text-[10px] font-black flex items-center justify-center rounded-none shadow-md border border-[#0d0b0a]">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Sub-bar on Mobile for quick links */}
      <div className="md:hidden border-t border-[#221a14] px-4 py-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('menu')}
            className={`py-1 font-bold uppercase tracking-wider text-[11px] ${
              currentView === 'menu' ? 'text-[#c29344]' : 'text-[#877666]'
            }`}
          >
            Carte Menu
          </button>
          <span className="text-[#3b2e21]">·</span>
          <button
            onClick={() => onNavigate('tracking')}
            className={`py-1 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1 ${
              currentView === 'tracking' ? 'text-[#c29344]' : 'text-[#877666]'
            }`}
          >
            <span>Suivi</span>
            {hasActiveOrder && <span className="w-1.5 h-1.5 rounded-full bg-[#c29344]" />}
          </button>
        </div>

        <button
          onClick={onOpenCallModal}
          className="flex items-center gap-1 text-[11px] text-[#ff7864] font-semibold hover:underline"
        >
          <BellRing className="w-3 h-3" />
          <span>Appel Serveur</span>
        </button>
      </div>
    </header>
  );
};
