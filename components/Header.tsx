/**
 * Componente Header: Cabeçalho superior fixo presente na maioria das páginas.
 * Exibe o logotipo, busca, notificações e o avatar do herói com acesso à Taberna.
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Bell, Search, X } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from '@/lib/ThemeContext';
import { THEMES } from '@/lib/themes';
import { ARCHETYPE_IMAGES } from '@/lib/data';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function Header() {
  // Acessa o tema e o estado do jogo para personalizar as cores e o avatar
  const { theme, gameState } = useTheme();
  const colors = THEMES[theme] || THEMES.default;
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Lado Esquerdo: Logotipo e Nome do App */}
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold", colors.primary)}>
              R
            </div>
            <span className="font-bold text-gray-900 hidden sm:block">Rumo à Liberdade</span>
          </Link>
        </div>

        {/* Lado Direito: Ações e Perfil */}
        <div className="flex items-center gap-3">
          {/* Botão de Busca */}
          <button 
            onClick={() => triggerToast('Busca em desenvolvimento...')}
            className="p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors"
          >
            <Search size={20} />
          </button>
          {/* Botão de Notificações com indicador de novidade */}
          <button 
            onClick={() => triggerToast('Nenhuma nova notificação.')}
            className="p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors relative"
          >
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          
          {/* Link para a Taberna (Perfil do Herói) */}
          <Link href="/taverna">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 pl-2 border-l border-gray-100 ml-2"
            >
              {/* Avatar Dinâmico baseado no Arquétipo */}
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 transition-colors relative", colors.border)}>
                <Image 
                  src={ARCHETYPE_IMAGES[gameState.archetype] || '/Festin.png'} 
                  alt="Avatar"
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              {/* Informações resumidas do Herói */}
              <div className="hidden md:block text-left">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Taverna</p>
                <p className="text-sm font-bold text-gray-900">{gameState.archetype}</p>
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
            className="fixed top-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl z-[100] flex items-center gap-3 min-w-[280px]"
          >
            <div className={cn("w-2 h-2 rounded-full", colors.primary)}></div>
            <p className="text-sm font-bold flex-1">{toastMessage}</p>
            <button onClick={() => setShowToast(false)}>
              <X size={14} className="text-gray-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
