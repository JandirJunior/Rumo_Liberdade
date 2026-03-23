'use client';

import { useEffect, useState, useCallback } from 'react';
import { useKingdom } from '@/hooks/useKingdom';
import { Bell, BellOff, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function NotificationManager() {
  const { payables, receivables } = useKingdom();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPermission(Notification.permission);
      if (Notification.permission === 'default') {
        // Show prompt after a delay to not annoy the user immediately
        const timer = setTimeout(() => setShowPrompt(true), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      setShowPrompt(false);

      if (result === 'granted') {
        new Notification('Mensageiro do Reino', {
          body: 'Saudações, herói! Agora você receberá avisos sobre suas quests.',
          icon: 'https://picsum.photos/seed/liberdade-icon-192/192/192'
        });
      }
    }
  };

  const triggerNotification = useCallback((title: string, body: string) => {
    if (permission === 'granted') {
      // Use service worker if available for better PWA support
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, {
            body,
            icon: 'https://picsum.photos/seed/liberdade-icon-192/192/192',
            badge: 'https://picsum.photos/seed/liberdade-icon-192/192/192',
            tag: `quest-${title}-${body}` // Avoid duplicate notifications
          });
        });
      } else {
        new Notification(title, { body });
      }
    }
  }, [permission]);

  // Check for quests due soon
  useEffect(() => {
    if (permission !== 'granted') return;

    const checkQuests = () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const todayStr = today.toISOString().split('T')[0];
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const pendingQuests = [
        ...payables.filter(p => p.status === 'pendente'),
        ...receivables.filter(r => r.status === 'pendente')
      ];

      pendingQuests.forEach(quest => {
        const dueDate = quest.due_date || quest.dueDate;
        if (dueDate === todayStr) {
          triggerNotification(
            'Quest Vencendo Hoje!',
            `Herói, a quest "${quest.description}" vence hoje! Não deixe o reino na mão.`
          );
        } else if (dueDate === tomorrowStr) {
          triggerNotification(
            'Quest Próxima do Vencimento',
            `Atenção! A quest "${quest.description}" vence amanhã.`
          );
        }
      });
    };

    // Check every 6 hours
    const interval = setInterval(checkQuests, 6 * 60 * 60 * 1000);
    checkQuests(); // Initial check

    return () => clearInterval(interval);
  }, [permission, payables, receivables, triggerNotification]);

  return (
    <>
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 right-4 z-[100] max-w-sm"
          >
            <div className="bg-[var(--color-bg-panel)] medieval-border p-4 shadow-2xl flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0 animate-bounce">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-[var(--color-text-main)] medieval-title">Mensageiro do Reino</h4>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  Deseja receber avisos sobre suas quests e obrigações financeiras diretamente no seu dispositivo?
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={requestPermission}
                    className="text-xs px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-lg font-bold hover:opacity-90 transition-opacity"
                  >
                    Sim, Mensageiro!
                  </button>
                  <button
                    onClick={() => setShowPrompt(false)}
                    className="text-xs px-3 py-1.5 bg-transparent text-[var(--color-text-muted)] rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Agora não
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button to toggle notifications in settings or similar */}
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => permission === 'default' ? requestPermission() : setShowPrompt(true)}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg medieval-border",
            permission === 'granted' ? "bg-emerald-500/20 text-emerald-500" : "bg-orange-500/20 text-orange-500"
          )}
          title="Mensageiro do Reino"
        >
          {permission === 'granted' ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
        </button>
      </div>
    </>
  );
}
