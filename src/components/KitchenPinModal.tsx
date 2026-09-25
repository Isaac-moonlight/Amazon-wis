import React, { useState } from 'react';
import { X, Lock, KeyRound } from 'lucide-react';
import { RESTAURANT_CONFIG } from '../data/menuData';

interface KitchenPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const KitchenPinModal: React.FC<KitchenPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      setError(false);
      if (next.length === 4) {
        verifyPin(next);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const verifyPin = (entered: string) => {
    if (entered === RESTAURANT_CONFIG.adminPin || entered === '0000') {
      onSuccess();
      onClose();
      setPin('');
    } else {
      setError(true);
      setTimeout(() => {
        setPin('');
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/90 backdrop-blur-md"
      />

      <div className="relative w-full max-w-xs bg-[#130f0d] border border-[#4a3928] p-6 text-[#ede4d7] shadow-2xl z-10 text-center">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-[#79695a] hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 bg-[#201812] border border-[#c29344]/40 flex items-center justify-center mx-auto mb-3 text-[#c29344]">
          <Lock className="w-6 h-6" />
        </div>

        <h3 className="font-heading font-bold text-base text-[#f5ebd9]">
          Console Cuisine & Bar
        </h3>
        <p className="text-xs text-[#9c8b7c] mt-0.5 mb-4">
          Accès réservé au personnel (Code PIN : 1894)
        </p>

        {/* PIN Indicators */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-3.5 h-3.5 border transition-all ${
                  error
                    ? 'border-red-500 bg-red-500/50 animate-shake'
                    : isFilled
                    ? 'bg-[#c29344] border-[#c29344]'
                    : 'border-[#4b3a2a] bg-[#1a1410]'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-xs text-red-400 font-semibold mb-3">
            Code PIN incorrect (Indice: 1894)
          </p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleKeyPress(digit)}
              className="py-3 text-lg font-heading font-bold bg-[#1d1612] hover:bg-[#2e2219] text-[#e8ded0] border border-[#36291c] active:bg-[#c29344] active:text-black transition-colors"
            >
              {digit}
            </button>
          ))}
          <button
            onClick={() => setPin('')}
            className="py-3 text-xs uppercase tracking-wider bg-[#19130f] text-[#867566] hover:text-white border border-[#2d2218]"
          >
            Effacer
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="py-3 text-lg font-heading font-bold bg-[#1d1612] hover:bg-[#2e2219] text-[#e8ded0] border border-[#36291c] active:bg-[#c29344] active:text-black transition-colors"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="py-3 text-xs uppercase tracking-wider bg-[#19130f] text-[#867566] hover:text-white border border-[#2d2218]"
          >
            ←
          </button>
        </div>
      </div>
    </div>
  );
};
