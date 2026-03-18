'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ArrowUpRight, ArrowDownRight, CreditCard, Wallet, TrendingUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/ThemeContext';
import { THEMES } from '@/lib/themes';
import { Modal } from './Modal';
import { RecurringAccountsPanel } from './RecurringAccountsPanel';

export function SpeedDial() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();
  const colors = THEMES[theme] || THEMES.default;

  const actions = [
    { icon: ArrowUpRight, label: 'A Pagar', color: 'bg-red-500', action: () => console.log('A Pagar') },
    { icon: ArrowDownRight, label: 'A Receber', color: 'bg-emerald-500', action: () => console.log('A Receber') },
    { icon: CreditCard, label: 'Cartão', color: 'bg-purple-500', action: () => console.log('Cartão') },
    { icon: TrendingUp, label: 'Investir', color: 'bg-blue-500', action: () => console.log('Investir') },
    { icon: Wallet, label: 'Transação', color: 'bg-amber-500', action: () => console.log('Transação') },
  ];

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col items-end gap-3 mb-2">
            {actions.map((action, i) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0, y: 20 }}
                transition={{ delay: (actions.length - i) * 0.05 }}
                onClick={() => {
                  action.action();
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 group"
              >
                <span className="px-3 py-1 bg-white border border-gray-100 rounded-lg text-xs font-bold text-gray-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  {action.label}
                </span>
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform active:scale-95", action.color)}>
                  <action.icon className="w-6 h-6" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-[2rem] flex items-center justify-center text-white shadow-2xl transition-all active:scale-95",
          isOpen ? "bg-gray-900 rotate-45" : colors.primary
        )}
      >
        {isOpen ? <X className="w-8 h-8 -rotate-45" /> : <Plus className="w-8 h-8" />}
      </button>
    </div>
  );
}
