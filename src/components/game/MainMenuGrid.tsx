'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Home, BarChart3, HandCoins, ScrollText, Skull, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const MODULES = [
  {
    id: 'dashboard',
    title: 'Reino',
    description: 'Visão geral do seu império financeiro',
    icon: Home,
    href: '/dashboard',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
  },
  {
    id: 'attributes',
    title: 'Atributos',
    description: 'Evolua suas estatísticas F.A.C.E.R.O.',
    icon: BarChart3,
    href: '/attributes',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    id: 'inventory',
    title: 'Inventário',
    description: 'Gerencie seus ativos e tesouros',
    icon: HandCoins,
    href: '/investments',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    id: 'quests',
    title: 'Quests',
    description: 'Missões financeiras e transações',
    icon: ScrollText,
    href: '/transactions',
    color: 'text-amber-600',
    bg: 'bg-amber-600/10',
  },
  {
    id: 'dungeons',
    title: 'Masmorras',
    description: 'Enfrente vilões financeiros',
    icon: Skull,
    href: '/villains',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
  {
    id: 'mentors',
    title: 'Mentores',
    description: 'Conselhos sábios para sua jornada',
    icon: MessageSquare,
    href: '/chat',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
];

export function MainMenuGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
      {MODULES.map((mod, index) => (
        <Link key={mod.id} href={mod.href}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="group relative overflow-hidden rounded-2xl medieval-border bg-[var(--color-bg-panel)] p-6 transition-all duration-300 hover:medieval-glow cursor-pointer h-full flex flex-col"
          >
            {/* Background Texture/Glow */}
            <div className={cn("absolute -right-12 -top-12 w-32 h-32 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40", mod.bg)} />
            
            <div className="relative z-10 flex items-start gap-4">
              <div className={cn("p-3 rounded-xl medieval-border bg-[var(--color-bg-dark)]", mod.color)}>
                <mod.icon size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold medieval-title text-[var(--color-text-main)] group-hover:text-[var(--color-primary)] transition-colors">
                  {mod.title}
                </h3>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  {mod.description}
                </p>
              </div>
            </div>
          </motion.div>
        </Link>
      ))}
    </div>
  );
}
