import React, { useState } from 'react';
import { CartItem, PaymentMethod } from '../types/restaurant';
import { formatPrice, formatPriceShort } from '../data/menuData';
import { generateWhatsAppOrderUrl } from '../utils/whatsapp';
import { 
  ShoppingBag, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  MessageCircle, 
  AlertCircle,
  Coins,
  Smartphone,
  CreditCard
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  currentTable: number | null;
  onOpenTableSelect: () => void;
  onSubmitOrder: (data: { customerName?: string; notes?: string; paymentMethod: PaymentMethod }) => Promise<void>;
  isSubmitting: boolean;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  currentTable,
  onOpenTableSelect,
  onSubmitOrder,
  isSubmitting,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_table');

  if (!isOpen) return null;

  const totalAmount = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleDirectSubmit = async () => {
    if (!currentTable) {
      onOpenTableSelect();
      return;
    }
    await onSubmitOrder({
      customerName: customerName.trim() || (currentTable ? `Client Table ${currentTable}` : 'Client'),
      notes: generalNotes.trim() || undefined,
      paymentMethod,
    });
    setGeneralNotes('');
  };

  const handleWhatsAppOrder = () => {
    if (!currentTable) {
      onOpenTableSelect();
      return;
    }
    const name = customerName.trim() || `Client Table ${currentTable}`;
    const url = generateWhatsAppOrderUrl(currentTable, cartItems, totalAmount, name, paymentMethod, generalNotes);
    window.open(url, '_blank');
  };

  const paymentOptions: Array<{ id: PaymentMethod; label: string; desc: string; icon: any }> = [
    {
      id: 'cash_table',
      label: 'Espèces au serveur',
      desc: 'Paiement direct à table en FCFA',
      icon: Coins,
    },
    {
      id: 'mobile_money',
      label: 'Mobile Money Bénin',
      desc: 'MTN Mobile Money ou Moov Money Flooz',
      icon: Smartphone,
    },
    {
      id: 'cashier',
      label: 'En caisse / Carte bancaire',
      desc: 'Paiement au comptoir du lounge',
      icon: CreditCard,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-[#13100e] border-l border-[#2e2319] text-[#ece4d8] flex flex-col h-full shadow-2xl z-10">
        {/* Header */}
        <div className="p-4 border-b border-[#292017] flex items-center justify-between bg-[#18130f]">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#c29344]" />
            <div>
              <h2 className="font-heading font-extrabold text-base text-[#f5ebd9]">
                Votre Commande
              </h2>
              <p className="text-xs text-[#9a8978]">
                {currentTable ? `Table N° ${currentTable} · Amazone Wis'art` : "Table non définie"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cartItems.length > 0 && (
              <button
                onClick={onClearCart}
                className="text-[11px] text-[#8e7e6e] hover:text-[#c29344] uppercase tracking-wider font-semibold transition-colors px-1.5 py-0.5"
              >
                Vider
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-[#887869] hover:text-white transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-[#1e1711] border border-[#3b2d1e] flex items-center justify-center mb-3 text-[#6d5b4a]">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <p className="font-heading font-extrabold text-lg text-[#f0e7dc] mb-1">
              Votre panier est vide
            </p>
            <p className="text-xs text-[#8c7b6c] max-w-xs mb-6 leading-relaxed">
              Sélectionnez des cocktails signatures, grillades au feu de bois ou spécialités de Cotonou pour commander.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#251d15] border border-[#443527] hover:border-[#c29344] text-[#c29344] text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Consulter la carte
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 thin-scroll">
            {/* Table alert if not chosen */}
            {!currentTable && (
              <div 
                onClick={onOpenTableSelect}
                className="p-3 bg-amber-950/40 border border-amber-600/40 flex items-center justify-between cursor-pointer hover:bg-amber-950/60 transition-colors"
              >
                <div className="flex items-center gap-2 text-amber-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Veuillez sélectionner votre table avant de valider.</span>
                </div>
                <span className="text-[11px] underline font-bold text-amber-200 uppercase">
                  Choisir
                </span>
              </div>
            )}

            {/* Items list */}
            <div className="space-y-3">
              {cartItems.map((ci) => (
                <div 
                  key={ci.cartItemId} 
                  className="p-3 bg-[#19130f] border border-[#2c2117] flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-[#f5ebd9]">
                        {ci.item.name}
                      </h4>
                      {ci.variantName && (
                        <p className="text-[11px] text-[#c29344] font-bold mt-0.5">
                          Format : {ci.variantName}
                        </p>
                      )}
                      {ci.selectedOptions && ci.selectedOptions.length > 0 && (
                        <p className="text-[11px] text-[#8e7e6e] mt-0.5">
                          + {ci.selectedOptions.join(', ')}
                        </p>
                      )}
                      {ci.notes && (
                        <p className="text-[11px] text-amber-300/80 italic mt-0.5">
                          « {ci.notes} »
                        </p>
                      )}
                    </div>

                    <span className="font-mono-numbers font-bold text-sm text-[#e5b869] whitespace-nowrap">
                      {formatPriceShort(ci.totalPrice)}
                    </span>
                  </div>

                  {/* Quantity bar + remove */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#231b14]">
                    <div className="flex items-center bg-[#201812] border border-[#3b2d1f]">
                      <button
                        onClick={() => onUpdateQuantity(ci.cartItemId, -1)}
                        className="p-1 text-[#8e7e6e] hover:text-white"
                        aria-label="Moins"
                      >
                        {ci.quantity <= 1 ? (
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        ) : (
                          <Minus className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span className="px-2.5 text-xs font-mono-numbers font-bold text-[#f5ebd9]">
                        {ci.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(ci.cartItemId, 1)}
                        className="p-1 bg-[#c29344] text-[#0d0b0a] hover:bg-[#d8a74e]"
                        aria-label="Plus"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(ci.cartItemId)}
                      className="text-[11px] text-[#8e7e6e] hover:text-red-400 transition-colors uppercase tracking-wider"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Inputs: Customer Name + General Notes */}
            <div className="pt-2 space-y-3 border-t border-[#261d15]">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#a89786] block mb-1.5">
                  Nom ou prénom (pour vous servir)
                </label>
                <input
                  type="text"
                  placeholder={`Ex: Isaac (Table ${currentTable || '...'})`}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-[#17110d] border border-[#2d2218] text-[#ede4d8] placeholder-[#6d5b4a] focus:outline-none focus:border-[#c29344]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#a89786] block mb-1.5">
                  Instructions générales pour la commande
                </label>
                <textarea
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  placeholder="Ex: Servir les boissons bien fraîches avant les grillades..."
                  rows={2}
                  className="w-full text-xs p-2.5 bg-[#17110d] border border-[#2d2218] text-[#ede4d8] placeholder-[#6d5b4a] focus:outline-none focus:border-[#c29344] resize-none"
                />
              </div>

              {/* Mode de règlement */}
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#a89786] block mb-2">
                  Mode de règlement prévu
                </label>
                <div className="space-y-1.5">
                  {paymentOptions.map((opt) => {
                    const isSelected = paymentMethod === opt.id;
                    const Icon = opt.icon;
                    return (
                      <label
                        key={opt.id}
                        onClick={() => setPaymentMethod(opt.id)}
                        className={`p-2.5 flex items-center justify-between border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#c29344] bg-[#221811] text-[#f5ebd9]'
                            : 'border-[#2d2218] bg-[#17110d] text-[#8e7e6e] hover:border-[#423324]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-[#c29344]' : 'text-[#6e5d4e]'}`} />
                          <div>
                            <span className="text-xs font-bold block leading-tight">
                              {opt.label}
                            </span>
                            <span className="text-[10px] text-[#817161]">
                              {opt.desc}
                            </span>
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={isSelected}
                          onChange={() => setPaymentMethod(opt.id)}
                          className="accent-[#c29344]"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Summary & CTAs */}
        {cartItems.length > 0 && (
          <div className="p-4 bg-[#17120e] border-t border-[#292017] space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9d8d7e] uppercase tracking-wider font-semibold">
                Total à régler ({totalCount} plat{totalCount > 1 ? 's' : ''})
              </span>
              <span className="font-heading font-black text-xl text-[#e5b869] font-mono-numbers">
                {formatPrice(totalAmount)}
              </span>
            </div>

            {/* Direct Firestore Submit Button */}
            <button
              onClick={handleDirectSubmit}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#c29344] hover:bg-[#d8a74e] active:scale-[0.99] text-[#0d0b0a] font-heading font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-amber-950/40"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 stroke-[2.5]" />
                  <span>Valider la commande en direct</span>
                </>
              )}
            </button>

            {/* WhatsApp Fallback Option */}
            <button
              onClick={handleWhatsAppOrder}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#19271c] hover:bg-[#203425] text-[#86efac] border border-[#276735] text-xs font-semibold tracking-wide transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#4ade80]" />
              <span>Option secours : Envoyer par WhatsApp</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
