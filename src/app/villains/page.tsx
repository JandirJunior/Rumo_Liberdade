'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Shield, Sword, Skull, Trophy, Flame } from 'lucide-react';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { cn, formatCurrency, getColorClass } from '@/lib/utils';
import { useTheme } from '@/lib/ThemeContext';
import { THEMES } from '@/lib/themes';
import { FINANCIAL_VILLAINS, calculateVillainDamage } from '@/lib/financialVillains';
import { financialEngine } from '@/lib/financialEngine';
import { useKingdom } from '@/hooks/useKingdom';
import { PAGE_BACKGROUNDS } from '@/constants/images';

export default function Villains() {
  const { theme, user, loading: authLoading } = useTheme();
  const colors = THEMES[theme] || THEMES.ORBITA;

  const { assets, loading } = useKingdom();

  const playerPower = useMemo(() => {
    if (loading) return 0;

    // O Poder de Combate é baseado diretamente no valor total investido
    const { totalValue: totalInvested } = financialEngine.calculateInvestmentPower(assets);
    return totalInvested;
  }, [assets, loading]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-dark)]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[var(--color-text-muted)] font-medium">Entrando na Masmorra...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--color-bg-dark)] text-[var(--color-text-main)] transition-colors duration-500 pb-32 relative overflow-hidden">
      {/* Imagem de Fundo Sugestiva */}
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none">
        <Image
          src={PAGE_BACKGROUNDS.VILLAINS}
          alt="Villains Background"
          fill
          priority
          className="object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      <Header />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 relative z-10">
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[var(--color-bg-dark)] shadow-lg bg-[var(--color-primary)] medieval-border medieval-glow">
              <Skull className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-[var(--color-primary)] medieval-title">Masmorra</h2>
              <p className="text-sm text-[var(--color-text-muted)]">Derrote seus inimigos financeiros com disciplina</p>
            </div>
          </div>
        </header>

        {/* Player Power Status */}
        <section className="bg-[var(--color-bg-panel)] rounded-3xl p-6 shadow-sm medieval-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-950/30 rounded-2xl flex items-center justify-center medieval-border">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Poder de Combate</p>
              <h3 className={cn("text-2xl font-display font-bold", getColorClass(playerPower))}>{formatCurrency(playerPower)}</h3>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--color-text-muted)]">Dano Automático</p>
            <p className="text-sm font-bold text-emerald-500">Baseado no seu patrimônio</p>
          </div>
        </section>

        {/* Villains List */}
        <section className="space-y-6">
          {FINANCIAL_VILLAINS.map((villain, index) => {
            // Mock damage calculation for demonstration
            const damage = calculateVillainDamage(playerPower, index + 1);
            const currentHp = Math.max(0, villain.hp - damage);
            const hpPercentage = Math.max(0, Math.min(100, (currentHp / villain.hp) * 100));
            const isDefeated = currentHp <= 0;

            return (
              <motion.div
                key={villain.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "bg-[var(--color-bg-panel)] rounded-[2rem] p-6 shadow-sm transition-all medieval-border",
                  isDefeated ? "border-emerald-900/50 bg-emerald-950/10" : ""
                )}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-inner medieval-border",
                      isDefeated ? "bg-emerald-950/30 text-emerald-500" : "bg-red-950/30 text-red-500"
                    )}>
                      {isDefeated ? <Trophy className="w-8 h-8" /> : <Skull className="w-8 h-8" />}
                    </div>
                    <div>
                      <h4 className="text-xl font-display font-bold text-[var(--color-text-main)] medieval-title">{villain.name}</h4>
                      <p className="text-sm font-bold text-[var(--color-text-muted)]">{villain.title}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Recompensa</p>
                    <p className="text-sm font-bold text-emerald-500">+{villain.rewardXP} XP</p>
                  </div>
                </div>

                <p className="text-sm text-[var(--color-text-muted)] mb-6">{villain.description}</p>

                {/* HP Bar */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-xs font-bold">
                    <span className={isDefeated ? "text-emerald-500" : "text-red-500"}>
                      {isDefeated ? 'Derrotado!' : 'HP do Vilão'}
                    </span>
                    <span className="text-[var(--color-text-muted)]">
                      <span className={getColorClass(currentHp)}>{formatCurrency(currentHp)}</span> / {formatCurrency(villain.hp)}
                    </span>
                  </div>
                  <div className="h-3 bg-[var(--color-bg-dark)] rounded-full overflow-hidden medieval-border">
                    <motion.div
                      initial={{ width: '100%' }}
                      animate={{ width: `${hpPercentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={cn(
                        "h-full rounded-full",
                        isDefeated ? "bg-emerald-600" : "bg-red-600"
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[var(--color-border)]">
                  <div>
                    <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Sword className="w-3 h-3" /> Fraqueza
                    </p>
                    <p className="text-sm font-medium text-[var(--color-text-main)]">{villain.weakness}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Condição de Vitória
                    </p>
                    <p className="text-sm font-medium text-[var(--color-text-main)]">{villain.victoryCondition}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
