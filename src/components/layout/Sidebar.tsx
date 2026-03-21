'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { Home, Pickaxe, ScrollText, MessageSquare, BarChart3, Skull } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: 'Reino', href: '/dashboard' },
    { icon: BarChart3, label: 'Atributos', href: '/attributes' },
    { icon: Pickaxe, label: 'Inventário', href: '/investments' },
    { icon: ScrollText, label: 'Quests', href: '/transactions' },
    { icon: Skull, label: 'Masmorra', href: '/villains' },
    { icon: MessageSquare, label: 'Mentor', href: '/chat' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-20 h-screen fixed left-0 top-0 medieval-border z-40 items-center py-8 gap-8">
      <div className="w-12 h-12 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-bg-dark)] font-bold medieval-title text-xl shadow-lg shadow-[var(--color-primary)]/50">
        R
      </div>

      <nav className="flex flex-col gap-6 mt-8">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="relative group">
              <div className={cn(
                "p-3 rounded-xl transition-all duration-300",
                isActive ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)] medieval-glow" : "text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10"
              )}>
                <item.icon size={24} />
              </div>
              
              {/* Tooltip */}
              <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-[var(--color-bg-panel)] medieval-border text-[var(--color-text-main)] text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
