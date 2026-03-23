/**
 * Componente Modal Reutilizável: Base para diálogos, formulários e painéis flutuantes.
 * Implementa animações suaves com Framer Motion, overlay escuro, fechamento por clique fora
 * ou tecla ESC, e acessibilidade com foco automático. Utilizado em todo o app para
 * modais de ajuda, edição, importação e confirmações.
 */
'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-6 right-6 top-1/2 -translate-y-1/2 bg-[var(--color-bg-panel)] rounded-[2.5rem] shadow-2xl z-50 overflow-hidden max-w-lg mx-auto border border-[var(--color-border)] medieval-border"
          >
            <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-dark)]">
              <h3 className="text-xl font-bold text-[var(--color-text-main)] medieval-title">{title}</h3>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-[var(--color-bg-panel)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors border border-[var(--color-border)]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
