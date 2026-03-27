/**
 * Componente Header: Cabeçalho superior fixo presente na maioria das páginas.
 * Exibe o logotipo, busca, notificações e o avatar do herói com acesso à Taberna.
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Search, X } from 'lucide-react';
import { UserAvatar } from '@/components/game/UserAvatar';
import { useTheme } from '@/lib/ThemeContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';

import { useKingdom } from '@/hooks/useKingdom';

export function Header() {
  const { gameState } = useTheme();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const { userData } = useUser();
  const { kingdom, kingdomLevel } = useKingdom();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/transactions?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const showNotificationDot = mounted && typeof window !== 'undefined' && 
    (!window.notificationPermission || window.notificationPermission === 'default');

  return (
    <header className="bg-[var(--color-bg-panel)]/80 backdrop-blur-md border-b border-[var(--color-border)] sticky top-0 z-30 px-3 sm:px-6 lg:px-8 py-2 transition-all">
      <div className="w-full flex items-center justify-between">
        {/* Lado Esquerdo: Logotipo (Mobile) e Nome do App */}
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--color-primary)] text-[var(--color-bg-dark)] font-bold medieval-title text-sm">
              R
            </div>
          </Link>
          <div className="flex flex-col">
            <span className="font-bold text-[var(--color-text-main)] hidden sm:block medieval-title text-lg tracking-wider">Rumo à Liberdade</span>
            {kingdom && (
              <Link href="/kingdom-selector" className="flex items-center gap-1 hover:brightness-125 transition-all group">
                <span className="text-[11px] font-black text-[var(--color-primary)] uppercase tracking-[0.15em] truncate max-w-[150px] group-hover:underline underline-offset-2">{kingdom.name}</span>
                <span className="text-[10px] font-bold text-[var(--color-text-muted)]">Nv. {kingdomLevel}</span>
              </Link>
            )}
          </div>
        </div>

        {/* Lado Direito: Ações e Perfil */}
        <div className="flex items-center gap-4">
          {/* Botão de Busca */}
          <div className="relative flex items-center">
            <AnimatePresence>
              {isSearchOpen && (
                <motion.form
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 200, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  onSubmit={handleSearch}
                  className="absolute right-10"
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar transações..."
                    className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-full px-4 py-1.5 text-sm text-[var(--color-text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    autoFocus
                    onBlur={() => {
                      setTimeout(() => setIsSearchOpen(false), 200);
                    }}
                  />
                </motion.form>
              )}
            </AnimatePresence>
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] rounded-full transition-colors z-10"
            >
              <Search size={20} />
            </button>
          </div>
          {/* Botão de Notificações com indicador de novidade */}
          <button 
            onClick={() => {
              if (typeof window !== 'undefined' && window.requestNotificationPermission) {
                window.requestNotificationPermission();
              } else {
                triggerToast('Nenhuma nova notificação.');
              }
            }}
            className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] rounded-full transition-colors relative"
          >
            <Bell size={20} />
            {showNotificationDot && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[var(--color-bg-panel)]"></span>
            )}
          </button>
          
          {/* Link para a Taverna (Perfil do Herói) */}
          <Link href="/tavern">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 pl-4 border-l border-[var(--color-border)] ml-2"
            >
              {/* Informações resumidas do Herói */}
              <div className="hidden md:block text-right">
                <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Lvl {gameState.level}</p>
                <p className="text-sm font-bold text-[var(--color-primary)] medieval-title">{gameState.title || gameState.archetype}</p>
              </div>
              {/* Avatar do Usuário */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 border-[var(--color-primary)] medieval-glow transition-colors relative">
                <UserAvatar src={userData?.avatarUrl} size={40} />
              </div>
            </motion.div>
          </Link>
        </div>
      </div>

      {/* Toast de Notificação Simples */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 bg-[var(--color-bg-dark)] text-[var(--color-text-main)] px-6 py-3 rounded-2xl shadow-2xl z-[100] flex items-center gap-3 min-w-[280px] medieval-border"
          >
            <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></div>
            <p className="text-sm font-bold flex-1">{toastMessage}</p>
            <button onClick={() => setShowToast(false)}>
              <X size={14} className="text-[var(--color-text-muted)]" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
