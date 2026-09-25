import React, { useState } from 'react';
import { CallReason } from '../types/restaurant';
import { generateWhatsAppCallUrl } from '../utils/whatsapp';
import { playChime } from '../utils/audio';
import { 
  BellRing, 
  Receipt, 
  Utensils, 
  GlassWater, 
  HelpCircle, 
  X, 
  CheckCircle2, 
  MessageCircle,
  ChevronRight
} from 'lucide-react';

interface ServerCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTable: number | null;
  onOpenTableSelect: () => void;
  onSendCall: (reason: CallReason) => Promise<void>;
}

export const ServerCallModal: React.FC<ServerCallModalProps> = ({
  isOpen,
  onClose,
  currentTable,
  onOpenTableSelect,
  onSendCall,
}) => {
  const [sentSuccess, setSentSuccess] = useState<CallReason | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const reasons: Array<{ id: CallReason; title: string; subtitle: string; icon: any }> = [
    {
      id: 'addition',
      title: "Demander l'Addition",
      subtitle: 'Règlement en espèces, Moov Money, MTN Momo ou Carte',
      icon: Receipt,
    },
    {
      id: 'eau_couverts',
      title: "De l'eau fraîche & Couverts",
      subtitle: 'Bouteille Possotomè fraîche, verres, serviettes ou rince-doigts',
      icon: GlassWater,
    },
    {
      id: 'boisson',
      title: 'Reprendre un Verre ou Bouteille',
      subtitle: 'Cocktail supplémentaire, bière locale glacée ou vin',
      icon: Utensils,
    },
    {
      id: 'assistance',
      title: 'Besoin d’Assistance',
      subtitle: 'Un membre de notre équipe vient immédiatement à votre table',
      icon: HelpCircle,
    },
  ];

  const handleCall = async (reason: CallReason) => {
    if (!currentTable) {
      onOpenTableSelect();
      return;
    }
    setLoading(true);
    try {
      playChime('bell');
      await onSendCall(reason);
      setSentSuccess(reason);
      setTimeout(() => {
        setSentSuccess(null);
        onClose();
      }, 2200);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppDirect = () => {
    if (!currentTable) {
      onOpenTableSelect();
      return;
    }
    const url = generateWhatsAppCallUrl(currentTable, "Assistance demandée à table");
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-md bg-[#14100d] border border-[#3d2e1f] p-6 text-[#ede4d8] shadow-2xl z-10">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1 text-[#867566] hover:text-white transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {sentSuccess ? (
          <div className="py-8 text-center flex flex-col items-center">
            <div className="w-14 h-14 bg-emerald-950/70 border border-emerald-500/50 flex items-center justify-center text-emerald-400 mb-3 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-heading font-extrabold text-xl text-emerald-300">
              Serveur notifié !
            </h4>
            <p className="text-xs text-[#b8a999] mt-1 max-w-xs">
              Votre appel pour la <strong>Table {currentTable}</strong> a été transmis à la console de service. Quelqu'un arrive aussitôt.
            </p>
          </div>
        ) : (
          <div>
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-[#201812] border border-[#ff6b57]/40 flex items-center justify-center mx-auto mb-3 text-[#ff7864]">
                <BellRing className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-extrabold text-xl text-[#f6efe4]">
                Appeler un Serveur
              </h3>
              <p className="text-xs text-[#9d8d7e] mt-1">
                {currentTable
                  ? `Service direct pour la Table ${currentTable} · Amazone Wis'art`
                  : "Sélectionnez votre table d'abord"}
              </p>
            </div>

            <div className="space-y-2">
              {reasons.map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.id}
                    disabled={loading}
                    onClick={() => handleCall(r.id)}
                    className="w-full text-left p-3 bg-[#19130f] hover:bg-[#231b14] border border-[#2d2218] hover:border-[#c29344] transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#221811] text-[#c29344] flex items-center justify-center shrink-0 border border-[#3b2d1e] group-hover:border-[#c29344]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-bold text-xs sm:text-sm text-[#f5ebd9] group-hover:text-[#c29344]">
                          {r.title}
                        </h5>
                        <p className="text-[11px] text-[#8e7d6d] leading-tight mt-0.5">
                          {r.subtitle}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#6e5d4e] group-hover:text-[#c29344] shrink-0" />
                  </button>
                );
              })}
            </div>

            {/* Emergency fallback */}
            <div className="mt-4 pt-3 border-t border-[#251d15]">
              <button
                onClick={handleWhatsAppDirect}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#162319] hover:bg-[#1d2f21] border border-[#23582e] text-[#86efac] text-xs font-semibold tracking-wide transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Option secours : Écrire au gérant par WhatsApp</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
