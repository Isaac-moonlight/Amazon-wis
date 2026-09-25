import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  RESTAURANT_CONFIG, 
  CATEGORIES, 
  MENU_ITEMS, 
  formatPrice,
  formatPriceShort
} from './data/menuData';
import { 
  MenuItem, 
  MenuCategory, 
  CartItem, 
  CallReason, 
  Order,
  PaymentMethod,
  ItemVariant
} from './types/restaurant';
import { syncManager } from './services/syncManager';
import { playChime } from './utils/audio';
import { db, doc, onSnapshot } from './services/firebase';

// Components
import { Header } from './components/Header';
import { CategoryFilter } from './components/CategoryFilter';
import { MenuItemCard } from './components/MenuItemCard';
import { ItemDetailModal } from './components/ItemDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { OrderTrackingView } from './components/OrderTrackingView';
import { TableSelectorModal } from './components/TableSelectorModal';
import { ServerCallModal } from './components/ServerCallModal';
import { KitchenPinModal } from './components/KitchenPinModal';
import { KitchenDashboard } from './components/KitchenDashboard';

import { 
  ShoppingBag, 
  Search, 
  Sparkles, 
  Clock, 
  MapPin, 
  Phone, 
  UtensilsCrossed, 
  Flame, 
  CheckCircle2, 
  ArrowRight,
  SlidersHorizontal
} from 'lucide-react';

export default function App() {
  // Navigation
  const [currentView, setCurrentView] = useState<'menu' | 'tracking' | 'kitchen'>('menu');
  
  // Table state
  const [currentTable, setCurrentTable] = useState<number | null>(null);
  const [tableConfirmed, setTableConfirmed] = useState<boolean>(false);

  // Filters & Search
  const [activeCategory, setActiveCategory] = useState<MenuCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('amazone_cart_cache');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active order state for tracking
  const [activeOrder, setActiveOrder] = useState<Order | null>(() => {
    try {
      const saved = localStorage.getItem('amazone_active_order');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [selectedChoiceItem, setSelectedChoiceItem] = useState<MenuItem | null>(null);

  // Network & Sync
  const [isOnline, setIsOnline] = useState(syncManager.getOnlineStatus());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Initialize table from URL query (?table=X) or localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tableParam = params.get('table') || params.get('t');
      if (tableParam) {
        const parsed = parseInt(tableParam.replace(/\D/g, ''), 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= RESTAURANT_CONFIG.maxTables) {
          setCurrentTable(parsed);
          setTableConfirmed(true);
          localStorage.setItem('amazone_table_num', parsed.toString());
          localStorage.setItem('amazone_table_confirmed', 'true');
        }
      } else {
        const saved = localStorage.getItem('amazone_table_num');
        const confirmed = localStorage.getItem('amazone_table_confirmed') === 'true';
        if (saved) {
          const parsed = parseInt(saved, 10);
          if (!isNaN(parsed)) {
            setCurrentTable(parsed);
            setTableConfirmed(confirmed);
          }
        }
      }

      if (params.get('view') === 'kitchen') {
        setCurrentView('kitchen');
      }
    }
  }, []);

  // 2. Subscribe to online status
  useEffect(() => {
    const unsub = syncManager.subscribeOnlineStatus((online) => {
      setIsOnline(online);
    });
    return unsub;
  }, []);

  // 3. Persist cart
  useEffect(() => {
    try {
      localStorage.setItem('amazone_cart_cache', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  // 4. Persist and live-sync active order
  useEffect(() => {
    try {
      if (activeOrder) {
        localStorage.setItem('amazone_active_order', JSON.stringify(activeOrder));
      } else {
        localStorage.removeItem('amazone_active_order');
      }
    } catch (e) {
      console.error(e);
    }

    if (!activeOrder?.id) return;

    // Listen to real-time status changes from Kitchen
    const unsub = onSnapshot(doc(db, 'orders', activeOrder.id), (docSnap) => {
      if (docSnap.exists()) {
        const liveData = docSnap.data() as Order;
        setActiveOrder((prev) => {
          if (!prev) return liveData;
          if (prev.status !== liveData.status) {
            playChime('bell');
          }
          return { ...prev, ...liveData };
        });
      }
    }, (err) => {
      console.warn('Live activeOrder tracking fallback to local', err);
    });

    return () => unsub();
  }, [activeOrder?.id]);

  // Check table before adding to cart
  const requireTable = (): boolean => {
    if (tableConfirmed && currentTable) return true;
    setIsTableModalOpen(true);
    return false;
  };

  const handleSelectTable = (num: number) => {
    setCurrentTable(num);
    setTableConfirmed(true);
    localStorage.setItem('amazone_table_num', num.toString());
    localStorage.setItem('amazone_table_confirmed', 'true');

    // Update URL parameter without reload
    const url = new URL(window.location.href);
    url.searchParams.set('table', num.toString());
    window.history.replaceState({}, '', url.toString());

    playChime('table');
    setIsTableModalOpen(false);
  };

  // Direct 1-tap Add to Cart (with default variant)
  const handleDirectAdd = (item: MenuItem) => {
    if (!requireTable()) return;

    const defaultVariant = (item.variants && item.variants.length > 0) ? item.variants[0] : undefined;
    const unitPrice = defaultVariant ? defaultVariant.price : item.price;
    const key = `${item.id}-${defaultVariant ? defaultVariant.name : 'base'}`;

    setCartItems((prev) => {
      const existing = prev.find((ci) => ci.cartItemId === key);
      if (existing) {
        return prev.map((ci) => {
          if (ci.cartItemId === key) {
            const nextQty = ci.quantity + 1;
            return {
              ...ci,
              quantity: nextQty,
              totalPrice: nextQty * unitPrice,
            };
          }
          return ci;
        });
      }
      return [
        ...prev,
        {
          cartItemId: key,
          item,
          quantity: 1,
          variantName: defaultVariant ? defaultVariant.name : undefined,
          unitPrice,
          optionsPrice: 0,
          totalPrice: unitPrice,
        },
      ];
    });

    playChime('add');
  };

  // Open Choice modal
  const handleOpenChoice = (item: MenuItem) => {
    if (!requireTable()) return;
    setSelectedChoiceItem(item);
  };

  // Confirm custom addition from ItemDetailModal
  const handleConfirmChoice = (payload: {
    item: MenuItem;
    variant?: ItemVariant;
    selectedOptions: string[];
    optionsPrice: number;
    quantity: number;
    specialInstructions?: string;
    totalPrice: number;
  }) => {
    const key = `${payload.item.id}-${payload.variant?.name || 'base'}-${payload.selectedOptions.sort().join('_')}-${payload.specialInstructions || ''}`;
    const unitPrice = payload.variant ? payload.variant.price : payload.item.price;

    setCartItems((prev) => {
      const existing = prev.find((ci) => ci.cartItemId === key);
      if (existing) {
        return prev.map((ci) => {
          if (ci.cartItemId === key) {
            const nextQty = ci.quantity + payload.quantity;
            return {
              ...ci,
              quantity: nextQty,
              totalPrice: nextQty * (unitPrice + payload.optionsPrice),
            };
          }
          return ci;
        });
      }
      return [
        ...prev,
        {
          cartItemId: key,
          item: payload.item,
          quantity: payload.quantity,
          variantName: payload.variant?.name,
          unitPrice,
          selectedOptions: payload.selectedOptions.length > 0 ? payload.selectedOptions : undefined,
          optionsPrice: payload.optionsPrice,
          notes: payload.specialInstructions,
          totalPrice: payload.totalPrice,
        },
      ];
    });

    playChime('add');
  };

  // Quantity adjustments
  const handleUpdateQuantity = (cartItemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((ci) => {
          if (ci.cartItemId === cartItemId) {
            const nextQty = ci.quantity + delta;
            if (nextQty <= 0) return null;
            const singleUnit = ci.unitPrice + (ci.optionsPrice || 0);
            return {
              ...ci,
              quantity: nextQty,
              totalPrice: nextQty * singleUnit,
            };
          }
          return ci;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((ci) => ci.cartItemId !== cartItemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Submit Order to Firestore
  const handleSubmitOrder = async (data: {
    customerName?: string;
    notes?: string;
    paymentMethod: PaymentMethod;
  }) => {
    if (!requireTable() || !currentTable || cartItems.length === 0) return;

    setIsSubmitting(true);
    try {
      const totalAmount = cartItems.reduce((sum, ci) => sum + ci.totalPrice, 0);

      const createdOrder = await syncManager.submitOrder({
        tableNumber: currentTable,
        customerName: data.customerName,
        paymentMethod: data.paymentMethod,
        items: cartItems.map((ci) => ({
          id: ci.item.id,
          name: ci.item.name,
          variantName: ci.variantName,
          unitPrice: ci.unitPrice,
          quantity: ci.quantity,
          options: ci.selectedOptions,
          totalPrice: ci.totalPrice,
          category: ci.item.category,
          notes: ci.notes,
        })),
        totalAmount,
        status: 'en_attente',
        notes: data.notes,
        source: isOnline ? 'direct' : 'offline_synced',
      });

      // Celebration
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#c29344', '#f0a500', '#ede7dd'],
        });
      } catch {}

      playChime('success');
      setCartItems([]);
      setIsCartOpen(false);
      setActiveOrder(createdOrder);
      setCurrentView('tracking');
    } catch (e) {
      console.error('Order submission error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send Waiter Call
  const handleSendCall = async (reason: CallReason) => {
    if (!currentTable) return;
    await syncManager.callServer(currentTable, reason);
  };

  // Filtered menu items
  const filteredMenuItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return MENU_ITEMS.filter((item) => {
      const matchesCategory =
        activeCategory === 'all' || item.category === activeCategory;
      if (!matchesCategory) return false;
      if (q) {
        const inName = item.name.toLowerCase().includes(q);
        const inDesc = item.description.toLowerCase().includes(q);
        const inIng = (item.ingredients || []).some((ing) =>
          ing.toLowerCase().includes(q)
        );
        return inName || inDesc || inIng;
      }
      return true;
    });
  }, [activeCategory, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    MENU_ITEMS.forEach((it) => {
      counts[it.category] = (counts[it.category] || 0) + 1;
    });
    return counts;
  }, []);

  const totalCartCount = cartItems.reduce((acc, ci) => acc + ci.quantity, 0);
  const totalCartAmount = cartItems.reduce((acc, ci) => acc + ci.totalPrice, 0);

  // If in Kitchen Dashboard View
  if (currentView === 'kitchen') {
    return (
      <KitchenDashboard
        onBackToMenu={() => setCurrentView('menu')}
        isOnline={isOnline}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0a09] text-[#ede7dd] pb-24 selection:bg-[#c29344] selection:text-[#0b0a09]">
      {/* Header with Table button & triple-click logo */}
      <Header
        currentTable={currentTable}
        tableConfirmed={tableConfirmed}
        onOpenTableSelect={() => setIsTableModalOpen(true)}
        onOpenKitchenPin={() => setIsPinModalOpen(true)}
        onOpenCallModal={() => setIsCallModalOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenSearch={() => {
          if (searchInputRef.current) {
            searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => searchInputRef.current?.focus(), 250);
          }
        }}
        cartCount={totalCartCount}
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        hasActiveOrder={Boolean(activeOrder)}
        isOnline={isOnline}
      />

      {/* VIEW: ORDER TRACKING */}
      {currentView === 'tracking' && (
        <OrderTrackingView
          order={activeOrder}
          onBackToMenu={() => setCurrentView('menu')}
          onOpenCallModal={() => setIsCallModalOpen(true)}
        />
      )}

      {/* VIEW: MENU CATALOG */}
      {currentView === 'menu' && (
        <>
          {/* Hero Banner: Amazone Wis'art Luxury Lounge Homage */}
          <div className="relative border-b border-[#282018] bg-gradient-to-b from-[#18130f] via-[#120e0b] to-[#0b0a09] overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#c29344_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10 relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#221710] border border-[#c29344]/40 text-[#e5b869] text-xs font-bold uppercase tracking-widest mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-[#c29344]" />
                    <span>Cotonou · Bénin · Lounge & Grillades</span>
                  </div>

                  <h1 className="font-heading font-black text-2xl sm:text-4xl lg:text-5xl text-[#f6efe4] tracking-tight leading-tight">
                    L’Art Culinaire & la Vaillance des{' '}
                    <span className="text-[#c29344] underline decoration-[#c29344]/40 underline-offset-4">
                      Amazones
                    </span>
                  </h1>

                  <p className="mt-3 text-xs sm:text-sm text-[#a89785] leading-relaxed max-w-xl">
                    Commandez directement à table en 1 clic. Cocktails infusés aux épices de Danxomè, grillades braisées au feu de bois et spécialités béninoises servies à la minute.
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={() => setIsTableModalOpen(true)}
                      className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all border ${
                        !tableConfirmed
                          ? 'bg-[#c29344] text-[#0d0b0a] border-[#c29344] table-btn-unconfirmed'
                          : 'bg-[#221811] hover:bg-[#2e2017] border-[#443324] text-[#ede4d8]'
                      }`}
                    >
                      <MapPin className="w-4 h-4 text-[#c29344]" />
                      <span>
                        {tableConfirmed && currentTable
                          ? `Installé à la Table ${currentTable}`
                          : 'Indiquer votre table'}
                      </span>
                    </button>

                    <button
                      onClick={() => setIsCallModalOpen(true)}
                      className="flex items-center gap-2 px-3.5 py-2 bg-[#1b140f] hover:bg-[#251b14] border border-[#382a1d] text-[#c29344] text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      <UtensilsCrossed className="w-4 h-4" />
                      <span>Appeler un serveur</span>
                    </button>
                  </div>
                </div>

                {/* Quick Info Box */}
                <div className="p-4 bg-[#14100d] border border-[#2d2218] text-xs text-[#a2907f] space-y-2 max-w-xs shrink-0">
                  <div className="flex items-center gap-2 text-[#e0d4c3]">
                    <Clock className="w-3.5 h-3.5 text-[#c29344]" />
                    <span className="font-semibold">{RESTAURANT_CONFIG.hours}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#a2907f]">
                    <MapPin className="w-3.5 h-3.5 text-[#c29344]" />
                    <span>{RESTAURANT_CONFIG.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#a2907f]">
                    <Phone className="w-3.5 h-3.5 text-[#c29344]" />
                    <span>WhatsApp : {RESTAURANT_CONFIG.whatsappDisplay}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category Tabs Strip */}
          <CategoryFilter
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            itemCounts={categoryCounts}
            totalCount={MENU_ITEMS.length}
          />

          {/* Search Bar & Dish Counter */}
          <div className="max-w-7xl mx-auto px-4 pt-6 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading font-black text-xl sm:text-2xl text-[#f6efe4]">
                  {activeCategory === 'all'
                    ? 'Notre Carte Complète'
                    : CATEGORIES.find((c) => c.id === activeCategory)?.name}
                </h2>
                <p className="text-xs text-[#8e7e6e] mt-0.5">
                  {filteredMenuItems.length} plat{filteredMenuItems.length > 1 ? 's' : ''} et boisson{filteredMenuItems.length > 1 ? 's' : ''} disponibles · Service à table
                </p>
              </div>

              {/* Search Field */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7e6d5e]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Rechercher capitaine, cocktail, igname..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#14100d] border border-[#2d2218] pl-10 pr-8 py-2 text-xs text-[#ede4d8] placeholder-[#6e5d4e] focus:outline-none focus:border-[#c29344] transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8c7b6c] hover:text-white"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Dishes Grid */}
          <main className="max-w-7xl mx-auto px-4 py-6">
            {filteredMenuItems.length === 0 ? (
              <div className="p-12 text-center border border-[#2b2016] bg-[#14100d]/40 my-6">
                <UtensilsCrossed className="w-10 h-10 text-[#5f4e3f] mx-auto mb-3" />
                <p className="font-heading font-bold text-lg text-[#ded5c7]">
                  Aucun résultat ne correspond à votre recherche
                </p>
                <p className="text-xs text-[#877565] mt-1">
                  Essayez un autre mot-clé ou réinitialisez la sélection.
                </p>
                <button
                  onClick={() => {
                    setActiveCategory('all');
                    setSearchQuery('');
                  }}
                  className="mt-4 px-4 py-2 bg-[#251d15] border border-[#3e2e1f] text-[#c29344] text-xs font-bold uppercase tracking-wider"
                >
                  Voir toute la carte
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {filteredMenuItems.map((item) => {
                  const qtyInCart = cartItems
                    .filter((ci) => ci.item.id === item.id)
                    .reduce((sum, ci) => sum + ci.quantity, 0);

                  return (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      quantityInCart={qtyInCart}
                      onDirectAdd={handleDirectAdd}
                      onOpenChoice={handleOpenChoice}
                    />
                  );
                })}
              </div>
            )}
          </main>
        </>
      )}

      {/* Floating Bottom Cart for Mobile (inspired by reference float-cart) */}
      {totalCartCount > 0 && currentView === 'menu' && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 sm:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-3 px-5 py-3 bg-[#c29344] hover:bg-[#d8a74e] active:scale-95 text-[#0d0b0a] font-extrabold text-xs uppercase tracking-wider shadow-2xl shadow-amber-950/60 transition-transform"
          >
            <span className="w-5 h-5 bg-black/20 text-[#0d0b0a] flex items-center justify-center font-black text-[10px]">
              {totalCartCount}
            </span>
            <span>Voir la commande</span>
            <span className="font-mono-numbers font-black">
              {formatPriceShort(totalCartAmount)}
            </span>
          </button>
        </div>
      )}

      {/* Modals */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        currentTable={currentTable}
        onOpenTableSelect={() => setIsTableModalOpen(true)}
        onSubmitOrder={handleSubmitOrder}
        isSubmitting={isSubmitting}
      />

      <ItemDetailModal
        item={selectedChoiceItem}
        onClose={() => setSelectedChoiceItem(null)}
        onConfirmAdd={handleConfirmChoice}
      />

      <TableSelectorModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        selectedTable={currentTable}
        tableConfirmed={tableConfirmed}
        onSelectTable={handleSelectTable}
      />

      <ServerCallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        currentTable={currentTable}
        onOpenTableSelect={() => setIsTableModalOpen(true)}
        onSendCall={handleSendCall}
      />

      <KitchenPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => setCurrentView('kitchen')}
      />

      {/* Footer */}
      <footer className="border-t border-[#261d15] mt-12 bg-[#0d0b0a]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-heading font-black text-base text-[#f5ebd9] tracking-wider">
                {RESTAURANT_CONFIG.name}
              </div>
              <p className="text-xs text-[#8c7b6c] mt-0.5">
                {RESTAURANT_CONFIG.tagline}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-[#8c7b6c]">
              <span>{RESTAURANT_CONFIG.address}</span>
              <a
                href={`tel:${RESTAURANT_CONFIG.whatsappNumber}`}
                className="hover:text-[#c29344] transition-colors"
              >
                {RESTAURANT_CONFIG.phone}
              </a>
              <span>{RESTAURANT_CONFIG.hours}</span>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-[#1f1711] flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-[#716152] uppercase tracking-widest font-bold">
            <span>Menu Digital & Commande en Salle · Cotonou, Bénin</span>
            <div className="flex items-center gap-3">
              <span className={isOnline ? 'text-emerald-500' : 'text-amber-500'}>
                ● {isOnline ? 'Firestore Synchronisé' : 'Mode Hors-Ligne'}
              </span>
              <button
                onClick={() => setIsPinModalOpen(true)}
                className="hover:text-[#c29344] transition-colors"
              >
                Accès Cuisine
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
