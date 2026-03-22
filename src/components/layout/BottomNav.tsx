'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, HandCoins, ScrollText, MessageSquare, BarChart3, Skull } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: 'Reino', href: '/dashboard' },
    { icon: BarChart3, label: 'Atributos', href: '/attributes' },
    { icon: HandCoins, label: 'Inventário', href: '/investments' },
    { icon: ScrollText, label: 'Quests', href: '/transactions' },
    { icon: Skull, label: 'Masmorra', href: '/villains' },
    { icon: MessageSquare, label: 'Mentor', href: '/chat' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-bg-panel)]/90 backdrop-blur-lg border-t border-[var(--color-border)] z-50 px-2 py-3">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={cn(
                "flex flex-col items-center gap-1 transition-all duration-300",
                isActive ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"
              )}
            >
              <item.icon size={20} className={cn(isActive && "medieval-glow")} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
