import React, { useState, useEffect } from 'react';
import { db, collection, query, orderBy, onSnapshot } from '../services/firebase';
import { syncManager } from '../services/syncManager';
import { Order, TableCall, OrderStatus } from '../types/restaurant';
import { formatPrice, formatPriceShort } from '../data/menuData';
import { playChime } from '../utils/audio';
import { 
  ArrowLeft, 
  Flame, 
  Clock, 
  CheckCircle2, 
  BellRing, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Volume2, 
  VolumeX, 
  CookingPot, 
  Check, 
  CreditCard,
  Coins,
  Smartphone
} from 'lucide-react';

interface KitchenDashboardProps {
  onBackToMenu: () => void;
  isOnline: boolean;
}

export const KitchenDashboard: React.FC<KitchenDashboardProps> = ({
  onBackToMenu,
  isOnline,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [calls, setCalls] = useState<TableCall[]>([]);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'active' | 'all'>('active');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastOrderTimestamp, setLastOrderTimestamp] = useState<number>(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Subscribe to real-time Firestore orders & calls
  useEffect(() => {
    let unsubscribeOrders = () => {};
    let unsubscribeCalls = () => {};

    try {
      const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
        const firestoreList: Order[] = [];
        let hasNew = false;
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Order;
          firestoreList.push({ ...data, id: docSnap.id });
          if (data.createdAt > lastOrderTimestamp) {
            hasNew = true;
          }
        });

        if (hasNew && soundEnabled) {
          playChime('bell');
          setLastOrderTimestamp(Date.now());
        }

        // Merge with local orders to ensure instantaneous feedback
        const local = syncManager.getLocalOrders();
        const map = new Map<string, Order>();
        local.forEach(o => map.set(o.id, o));
        firestoreList.forEach(o => map.set(o.id, o));
        const combined = Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);

        setOrders(combined);
      }, (err) => {
        console.warn('Orders snapshot fallback to local', err);
        setOrders(syncManager.getLocalOrders());
      });

      const callsQuery = query(collection(db, 'calls'), orderBy('createdAt', 'desc'));
      unsubscribeCalls = onSnapshot(callsQuery, (snapshot) => {
        const list: TableCall[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id } as TableCall);
        });
        setCalls(list.filter(c => !c.resolved));
      }, (err) => {
        console.warn('Calls snapshot fallback', err);
      });
    } catch (e) {
      console.error('Firestore listener error:', e);
      setOrders(syncManager.getLocalOrders());
    }

    return () => {
      unsubscribeOrders();
      unsubscribeCalls();
    };
  }, [soundEnabled, lastOrderTimestamp]);

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    await syncManager.updateOrderStatus(orderId, nextStatus);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus, updatedAt: Date.now() } : o));
    playChime('add');
  };

  const handleResolveCall = async (callId: string) => {
    await syncManager.resolveCall(callId);
    setCalls(prev => prev.filter(c => c.id !== callId));
    playChime('add');
  };

  const handleManualSync = async () => {
    setIsRefreshing(true);
    await syncManager.triggerSync();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === 'active') {
      return order.status === 'en_attente' || order.status === 'en_preparation';
    }
    if (filterStatus === 'all') return true;
    return order.status === filterStatus;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'en_attente':
        return <span className="px-2 py-0.5 bg-red-950 text-red-300 border border-red-700/60 text-[10px] font-black uppercase tracking-wider">À Préparer</span>;
      case 'en_preparation':
        return <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-700/60 text-[10px] font-black uppercase tracking-wider animate-pulse">En Cuisine</span>;
      case 'pret':
        return <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700/60 text-[10px] font-black uppercase tracking-wider">Prêt</span>;
      case 'servi':
        return <span className="px-2 py-0.5 bg-zinc-900 text-zinc-400 border border-zinc-700 text-[10px] uppercase font-bold">Servi</span>;
      case 'annule':
        return <span className="px-2 py-0.5 bg-zinc-900 text-zinc-500 border border-zinc-800 text-[10px] line-through">Annulé</span>;
    }
  };

  const getTimeElapsed = (timestamp: number) => {
    const diffMin = Math.floor((Date.now() - timestamp) / 60000);
    if (diffMin < 1) return "À l'instant";
    if (diffMin === 1) return "Il y a 1 min";
    return `Il y a ${diffMin} min`;
  };

  return (
    <div className="min-h-screen bg-[#0b0a09] text-[#f1ebe1] flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-[#130f0c] border-b border-[#292017] px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToMenu}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#201812] hover:bg-[#2d2219] text-[#c29344] border border-[#3e2e1f] text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Menu Carte</span>
          </button>

          <div className="border-l border-[#312519] pl-3">
            <h1 className="font-heading font-black text-sm sm:text-base text-[#f5ebd9] tracking-wider flex items-center gap-2">
              <span>CONSOLE SERVICE & CUISINE</span>
              <span className="text-[10px] px-2 py-0.5 bg-[#c29344] text-black font-black">
                EN DIRECT
              </span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-[#938272]">
              Synchronisation temps réel · Amazone Wis'art Cotonou
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Online badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 text-xs border ${
            isOnline ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40' : 'bg-amber-950/40 text-amber-300 border-amber-800/40'
          }`}>
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-amber-400" />}
            <span className="hidden sm:inline font-semibold">{isOnline ? 'Connecté' : 'Mode Local'}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 border transition-colors ${
              soundEnabled ? 'bg-[#221a14] border-[#c29344] text-[#c29344]' : 'bg-[#181310] border-[#31261d] text-[#6b5c4f]'
            }`}
            title={soundEnabled ? 'Sonnerie active' : 'Sonnerie coupée'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Manual Refresh / Sync */}
          <button
            onClick={handleManualSync}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1d1612] hover:bg-[#281f18] text-[#e0d4c5] border border-[#3b2e21] text-xs font-semibold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#c29344]' : ''}`} />
            <span className="hidden md:inline">Actualiser</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl w-full mx-auto p-4 flex-1 flex flex-col lg:flex-row gap-6">
        {/* Left: Orders list */}
        <div className="flex-1 flex flex-col">
          {/* Filter Tabs */}
          <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-[#292017]">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {[
                { id: 'active', label: 'En cours', count: orders.filter(o => o.status === 'en_attente' || o.status === 'en_preparation').length },
                { id: 'en_attente', label: 'À préparer', count: orders.filter(o => o.status === 'en_attente').length },
                { id: 'en_preparation', label: 'En cuisine', count: orders.filter(o => o.status === 'en_preparation').length },
                { id: 'pret', label: 'Prêtes', count: orders.filter(o => o.status === 'pret').length },
                { id: 'all', label: 'Toutes', count: orders.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id as any)}
                  className={`px-3 py-1.5 text-xs uppercase tracking-wider font-extrabold border transition-all ${
                    filterStatus === tab.id
                      ? 'bg-[#c29344] text-[#0d0b0a] border-[#c29344]'
                      : 'bg-[#18120e] text-[#9a8979] border-[#2e2319] hover:text-white'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            <span className="text-xs text-[#877565] font-mono-numbers hidden sm:inline">
              Total : {orders.length}
            </span>
          </div>

          {/* Orders Grid */}
          {filteredOrders.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center border border-dashed border-[#2b2118] bg-[#120e0c]/50">
              <CookingPot className="w-12 h-12 text-[#5a4a3b] mb-3" />
              <h3 className="font-heading font-extrabold text-lg text-[#dad0c2]">
                Aucune commande dans cet état
              </h3>
              <p className="text-xs text-[#827161] max-w-sm mt-1">
                Les commandes passées par les clients depuis leurs tables apparaîtront instantanément ici.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOrders.map((order) => {
                const isPending = order.status === 'en_attente';
                const isCooking = order.status === 'en_preparation';
                const isReady = order.status === 'pret';
                const isDone = order.status === 'servi';

                return (
                  <div
                    key={order.id}
                    className={`flex flex-col justify-between border transition-all p-4 ${
                      isPending
                        ? 'bg-[#1c120e] border-red-700/60 shadow-lg shadow-red-950/20'
                        : isCooking
                        ? 'bg-[#19140f] border-amber-600/50 shadow-lg shadow-amber-950/20'
                        : isReady
                        ? 'bg-[#121914] border-emerald-600/50 shadow-lg shadow-emerald-950/20'
                        : 'bg-[#14100e] border-[#292017] opacity-80'
                    }`}
                  >
                    <div>
                      {/* Top Order header */}
                      <div className="flex items-start justify-between border-b border-[#2d2218] pb-2.5 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="bg-[#241a12] border border-[#c29344] px-2.5 py-1 text-center">
                            <span className="text-[9px] text-[#9a8673] uppercase tracking-wider block leading-none">Table</span>
                            <span className="font-heading font-black text-xl text-[#f5ebd9] leading-tight">
                              {order.tableNumber}
                            </span>
                          </div>

                          <div>
                            <span className="text-[11px] text-[#867566] font-mono-numbers block font-bold">
                              #{order.orderNumber || order.id.slice(-5)}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Clock className="w-3 h-3 text-[#c29344]" />
                              <span className="text-xs text-[#c9b7a4] font-medium">
                                {getTimeElapsed(order.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          {getStatusBadge(order.status)}
                          {order.customerName && (
                            <span className="text-[11px] text-[#8e7e6e] block mt-1">
                              {order.customerName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-2 mb-4">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex items-start justify-between text-xs sm:text-sm py-1 border-b border-[#201912] last:border-0">
                            <div>
                              <span className="font-mono-numbers font-black text-[#e5b869] mr-2">
                                {it.quantity}×
                              </span>
                              <span className="text-[#ece3d6] font-bold">
                                {it.name}
                              </span>
                              {it.variantName && (
                                <span className="text-[11px] text-[#c29344] ml-1 font-semibold">
                                  ({it.variantName})
                                </span>
                              )}
                              {it.options && it.options.length > 0 && (
                                <p className="text-[11px] text-[#8e7e6e] pl-5 mt-0.5">
                                  + {it.options.join(', ')}
                                </p>
                              )}
                              {it.notes && (
                                <p className="text-[11px] text-amber-300/80 italic pl-5 mt-0.5">
                                  ↳ Note: {it.notes}
                                </p>
                              )}
                            </div>
                            <span className="text-xs font-mono-numbers text-[#9c8b7b] shrink-0 font-medium">
                              {formatPriceShort(it.totalPrice)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.notes && (
                        <div className="mb-3 p-2 bg-[#201812] border border-[#3e2e1e] text-xs text-amber-200/90">
                          <span className="font-bold text-[#c29344] block">Remarque client :</span>
                          {order.notes}
                        </div>
                      )}
                    </div>

                    {/* Footer Controls */}
                    <div className="pt-3 border-t border-[#292017]">
                      <div className="flex items-center justify-between text-xs mb-3">
                        <span className="text-[#887768]">
                          {order.paymentMethod === 'mobile_money' ? 'Paiement Mobile Money' : order.paymentMethod === 'cashier' ? 'Paiement en caisse' : 'Espèces au serveur'}
                        </span>
                        <span className="font-mono-numbers font-bold text-base text-[#e5b869]">
                          {formatPrice(order.totalAmount)}
                        </span>
                      </div>

                      {/* Transition Action Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        {isPending && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'en_preparation')}
                            className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-black font-extrabold text-xs uppercase tracking-wider transition-colors col-span-2 flex items-center justify-center gap-1.5"
                          >
                            <Flame className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Lancer la préparation</span>
                          </button>
                        )}

                        {isCooking && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'pret')}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold text-xs uppercase tracking-wider transition-colors col-span-2 flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Marquer Prêt à Servir</span>
                          </button>
                        )}

                        {isReady && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'servi')}
                            className="w-full py-2 bg-[#2d2218] hover:bg-[#3d2e20] text-[#ded3c4] font-extrabold text-xs uppercase tracking-wider transition-colors col-span-2 flex items-center justify-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                            <span>Marquer Servi à Table</span>
                          </button>
                        )}

                        {isDone && (
                          <div className="col-span-2 text-center text-xs text-[#716152] py-1 font-bold">
                            ✓ Commande complétée et servie
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar: Waiter Calls & Table Grid */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          {/* Active waiter calls */}
          <div className="bg-[#140f0c] border border-[#2e2319] p-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#292017] mb-3">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-[#ff7864]" />
                <h3 className="font-heading font-black text-sm text-[#f5ebd9]">
                  Appels Serveur Actifs
                </h3>
              </div>
              <span className={`text-xs px-2 py-0.5 font-bold ${
                calls.length > 0 ? 'bg-red-900/60 text-red-200 border border-red-700/60 animate-pulse' : 'bg-[#1c1510] text-[#7d6c5d]'
              }`}>
                {calls.length}
              </span>
            </div>

            {calls.length === 0 ? (
              <p className="text-xs text-[#7d6c5d] text-center py-6">
                Aucun appel serveur en attente.
              </p>
            ) : (
              <div className="space-y-2.5">
                {calls.map((call) => (
                  <div
                    key={call.id}
                    className="p-3 bg-red-950/30 border border-red-700/50 flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-heading font-black text-base text-[#ff8e7d]">
                          TABLE {call.tableNumber}
                        </span>
                        <p className="text-xs text-[#f2e6d8] font-medium capitalize mt-0.5">
                          {call.reason === 'addition' ? "Demande d'Addition" :
                           call.reason === 'eau_couverts' ? "Eau fraîche & Couverts" :
                           call.reason === 'boisson' ? "Recharge Boisson" : "Assistance Serveur"}
                        </p>
                      </div>
                      <span className="text-[10px] text-[#9c8c7c]">
                        {getTimeElapsed(call.createdAt)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleResolveCall(call.id)}
                      className="w-full py-1.5 bg-[#2a1c13] hover:bg-emerald-950 hover:border-emerald-600 hover:text-emerald-200 text-[#d8cab9] border border-[#483323] text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Traité / Acquitter</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick 25-Tables Grid Map */}
          <div className="bg-[#140f0c] border border-[#2e2319] p-4 flex-1">
            <h4 className="font-heading font-extrabold text-xs uppercase tracking-wider text-[#9a8979] mb-3">
              Plan des Tables (1 à 25)
            </h4>
            <div className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: 25 }, (_, i) => i + 1).map((tNum) => {
                const hasPending = orders.some(o => o.tableNumber === tNum && (o.status === 'en_attente' || o.status === 'en_preparation'));
                const hasCall = calls.some(c => c.tableNumber === tNum);

                let bg = 'bg-[#1a1410] text-[#716152] border-[#292018]';
                if (hasCall) {
                  bg = 'bg-red-900 text-white border-red-500 animate-pulse font-bold';
                } else if (hasPending) {
                  bg = 'bg-amber-950 text-amber-200 border-amber-600 font-bold';
                }

                return (
                  <div
                    key={tNum}
                    className={`py-2 text-center text-xs font-mono-numbers border ${bg}`}
                  >
                    T{tNum}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
