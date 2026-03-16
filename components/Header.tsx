/**
 * Componente Header: Cabeçalho superior fixo presente na maioria das páginas.
 * Exibe o logotipo, busca, notificações e o avatar do herói com acesso à Taberna.
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Bell, Search, X, Home, Pickaxe, ScrollText, MessageSquare, BarChart3, Skull } from 'lucide-react';
import { UserAvatar } from '@/src/components/UserAvatar';
import { useTheme } from '@/lib/ThemeContext';
import { THEMES } from '@/lib/themes';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';

export function Header() {
  // Acessa o tema e o estado do jogo para personalizar as cores e o avatar
  const { theme, gameState } = useTheme();
  const pathname = usePathname();
  const colors = THEMES[theme] || THEMES.default;
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const { userData } = useUser();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

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

  const navItems = [
    { icon: Home, label: 'Reino', href: '/dashboard' },
    { icon: BarChart3, label: 'Atributos', href: '/attributes' },
    { icon: Pickaxe, label: 'Caverna', href: '/investments' },
    { icon: ScrollText, label: 'Quests', href: '/transactions' },
    { icon: Skull, label: 'Vilões', href: '/bosses' },
    { icon: MessageSquare, label: 'Mentor', href: '/chat' },
  ];

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 px-4 sm:px-6 lg:px-8 py-3">
      <div className="w-full flex items-center justify-between">
        {/* Lado Esquerdo: Logotipo e Nome do App */}
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold", colors.primary)}>
              R
            </div>
            <span className="font-bold text-gray-900 hidden sm:block">Rumo à Liberdade</span>
          </Link>
        </div>

        {/* Centro: Navegação Desktop */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 transition-colors font-bold text-sm",
                  isActive ? colors.accent : "text-gray-500 hover:text-gray-900"
                )}
              >
                <item.icon className={cn("w-4 h-4", isActive && "fill-current opacity-20")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Lado Direito: Ações e Perfil */}
        <div className="flex items-center gap-3">
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
                    className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                    onBlur={() => {
                      // Delay to allow click on search button to register
                      setTimeout(() => setIsSearchOpen(false), 200);
                    }}
                  />
                </motion.form>
              )}
            </AnimatePresence>
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors z-10 bg-white"
            >
              <Search size={20} />
            </button>
          </div>
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
              {/* Avatar do Usuário */}
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 transition-colors relative", colors.border)}>
                <UserAvatar src={userData?.avatarUrl} size={40} />
              </div>
              {/* Informações resumidas do Herói */}
              <div className="hidden md:block text-left">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Lvl {userData?.level || 1}</p>
                <p className="text-sm font-bold text-gray-900">{userData?.title || gameState.archetype}</p>
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
