import React from 'react';
import { Order, OrderStatus } from '../types/restaurant';
import { formatPrice, formatPriceShort } from '../data/menuData';
import { generateWhatsAppShareOrderUrl } from '../utils/whatsapp';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Share2, 
  BellRing, 
  ShoppingBag,
  Sparkles,
  Utensils
} from 'lucide-react';

interface OrderTrackingViewProps {
  order: Order | null;
  onBackToMenu: () => void;
  onOpenCallModal: () => void;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  order,
  onBackToMenu,
  onOpenCallModal,
}) => {
  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-[#1a140f] border border-[#3c2f21] flex items-center justify-center mx-auto mb-4 text-[#c29344]">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="font-heading font-extrabold text-2xl text-[#f6efe4] mb-2">
          Aucune commande active
        </h2>
        <p className="text-xs sm:text-sm text-[#9b8b7b] max-w-md mx-auto mb-6">
          Vous n'avez pas encore validé de commande pour votre table. Parcourez la carte et commandez en direct.
        </p>
        <button
          onClick={onBackToMenu}
          className="px-5 py-2.5 bg-[#c29344] hover:bg-[#d8a74e] text-[#0d0b0a] font-heading font-extrabold text-xs uppercase tracking-wider transition-colors"
        >
          Consulter la carte
        </button>
      </div>
    );
  }

  // Step index from status
  const stepMap: Record<OrderStatus, number> = {
    en_attente: 1,
    en_preparation: 2,
    pret: 3,
    servi: 4,
    annule: 0,
  };

  const currentStep = stepMap[order.status] || 1;

  const statusTitles: Record<OrderStatus, { title: string; subtitle: string }> = {
    en_attente: {
      title: "Commande Reçue par l'Équipe",
      subtitle: "Votre commande est transmise en direct à la brigade de cuisine et au bar lounge."
    },
    en_preparation: {
      title: "En Préparation (Cuisine & Bar)",
      subtitle: "Vos grillades crépitent sur la braise et vos cocktails sont frappés minute."
    },
    pret: {
      title: "Plats Prêts à Servir",
      subtitle: "Le serveur dresse votre table et vous apporte les plats tout chauds."
    },
    servi: {
      title: "Bonne Dégustation !",
      subtitle: "Commande servie à table. N'hésitez pas à solliciter le serveur en cas de besoin."
    },
    annule: {
      title: "Commande Annulée",
      subtitle: "Cette commande a été annulée. Contactez le serveur pour toute question."
    }
  };

  const steps = [
    { num: 1, label: 'Reçue' },
    { num: 2, label: 'Cuisson / Bar' },
    { num: 3, label: 'Prête' },
    { num: 4, label: 'Servie' },
  ];

  const payLabels: Record<string, string> = {
    cash_table: "Espèces au serveur",
    mobile_money: "Mobile Money (MTN / Moov)",
    cashier: "En caisse"
  };

  const handleShareWhatsApp = () => {
    const url = generateWhatsAppShareOrderUrl(order);
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      {/* Top action header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <button
          onClick={onBackToMenu}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#a89786] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la carte</span>
        </button>

        <button
          onClick={onOpenCallModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#251b14] hover:bg-[#34261c] border border-[#433221] hover:border-[#c29344] text-[#e0d4c4] text-xs font-semibold tracking-wide transition-colors"
        >
          <BellRing className="w-3.5 h-3.5 text-[#ff7864]" />
          <span>Appeler le serveur</span>
        </button>
      </div>

      {/* Main Status Card */}
      <div className="bg-[#14100d] border border-[#2d2217] p-5 sm:p-7 mb-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#201811] border border-[#c29344]/30 text-[#e5b869] text-xs font-bold uppercase tracking-wider mb-2">
            <span>Table {order.tableNumber}</span>
            <span>·</span>
            <span>#{order.orderNumber}</span>
          </div>

          <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#f6efe4] mb-1.5">
            {statusTitles[order.status]?.title}
          </h2>
          <p className="text-xs sm:text-sm text-[#9b8b7b] max-w-lg mx-auto">
            {statusTitles[order.status]?.subtitle}
          </p>
        </div>

        {/* 4-Step Progress Bar (like reference) */}
        <div className="flex items-center justify-between mb-8 px-2 max-w-xl mx-auto">
          {steps.map((st, idx) => {
            const isCompleted = currentStep >= st.num;
            const isCurrent = currentStep === st.num;

            return (
              <React.Fragment key={st.num}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 border-2 flex items-center justify-center text-xs font-black transition-all ${
                      isCompleted
                        ? 'bg-[#c29344] border-[#c29344] text-[#0d0b0a] shadow-lg shadow-amber-950/40'
                        : 'bg-[#18120e] border-[#312519] text-[#716152]'
                    } ${isCurrent ? 'scale-110 ring-2 ring-[#c29344]/40' : ''}`}
                  >
                    {isCompleted ? st.num : st.num}
                  </div>
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider mt-2 whitespace-nowrap ${
                      isCompleted ? 'text-[#c29344]' : 'text-[#716152]'
                    }`}
                  >
                    {st.label}
                  </span>
                </div>

                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-[2px] mb-5 mx-2 transition-colors ${
                      currentStep > st.num ? 'bg-[#c29344]' : 'bg-[#291f16]'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Order Items Breakdown */}
        <div className="border-t border-[#261d15] pt-5 space-y-3">
          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-[#a89786] mb-3">
            Détail de votre commande ({order.items.length} produit{order.items.length > 1 ? 's' : ''})
          </h4>

          <div className="divide-y divide-[#211811]">
            {order.items.map((it, i) => (
              <div key={i} className="py-2.5 flex items-start justify-between gap-3 text-xs sm:text-sm">
                <div>
                  <div className="text-[#f5ebd9] font-medium">
                    <span className="font-mono-numbers font-bold text-[#e5b869] mr-2">
                      {it.quantity}×
                    </span>
                    <span>{it.name}</span>
                    {it.variantName && (
                      <span className="text-[11px] text-[#c29344] ml-1.5 font-bold">
                        ({it.variantName})
                      </span>
                    )}
                  </div>
                  {it.options && it.options.length > 0 && (
                    <p className="text-[11px] text-[#8e7e6e] mt-0.5 pl-6">
                      + {it.options.join(', ')}
                    </p>
                  )}
                  {it.notes && (
                    <p className="text-[11px] text-amber-300/80 italic mt-0.5 pl-6">
                      « {it.notes} »
                    </p>
                  )}
                </div>

                <span className="font-mono-numbers font-bold text-[#e5b869] shrink-0">
                  {formatPriceShort(it.totalPrice)}
                </span>
              </div>
            ))}
          </div>

          {order.notes && (
            <div className="p-3 bg-[#1a130e] border border-[#332517] text-xs text-[#a89786]">
              <strong className="text-[#c29344]">Note spéciale :</strong> {order.notes}
            </div>
          )}

          {/* Total & Payment method row */}
          <div className="border-t border-[#261d15] pt-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-[#877666] block">
                Total · {payLabels[order.paymentMethod] || 'Espèces'}
              </span>
              {order.customerName && (
                <span className="text-xs text-[#b8a795]">
                  Client : {order.customerName}
                </span>
              )}
            </div>
            <span className="font-heading font-black text-xl text-[#e5b869] font-mono-numbers">
              {formatPrice(order.totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={handleShareWhatsApp}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#17231a] hover:bg-[#1f3124] border border-[#23582e] text-[#86efac] text-xs font-bold uppercase tracking-wider transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span>Partager sur WhatsApp</span>
        </button>

        <button
          onClick={onBackToMenu}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#201811] hover:bg-[#2b2017] border border-[#3b2d1f] hover:border-[#c29344] text-[#ede4d8] text-xs font-bold uppercase tracking-wider transition-colors"
        >
          <Utensils className="w-4 h-4 text-[#c29344]" />
          <span>Commander d'autres plats</span>
        </button>
      </div>
    </div>
  );
};
