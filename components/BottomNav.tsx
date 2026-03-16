/**
 * Componente BottomNav: Menu de navegação inferior fixo.
 * Permite a navegação rápida entre as principais seções do aplicativo.
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Pickaxe, ScrollText, MessageSquare, BarChart3, Skull } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/ThemeContext';
import { THEMES } from '@/lib/themes';

export function BottomNav() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const colors = THEMES[theme] || THEMES.default;

  // Definição dos itens de navegação com seus ícones, rótulos e rotas
  const navItems = [
    { icon: Home, label: 'Reino', href: '/dashboard' },
    { icon: BarChart3, label: 'Atributos', href: '/attributes' },
    { icon: Pickaxe, label: 'Caverna', href: '/investments' },
    { icon: ScrollText, label: 'Quests', href: '/transactions' },
    { icon: Skull, label: 'Vilões', href: '/bosses' },
    { icon: MessageSquare, label: 'Mentor', href: '/chat' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-gray-100 px-6 py-3 flex items-center justify-around z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:hidden">
      {navItems.map((item, index) => {
        // Verifica se a rota atual corresponde ao item para aplicar o estilo ativo
        const isActive = pathname === item.href;

        return (
          <Link
            key={index}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              isActive ? colors.accent : "text-gray-400"
            )}
          >
            {/* Ícone do item com efeito de preenchimento se ativo */}
            <item.icon className={cn("w-6 h-6", isActive && "fill-current opacity-10")} />
            {/* Rótulo do item em caixa alta para manter o estilo RPG */}
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
