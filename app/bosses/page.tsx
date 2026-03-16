'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Sword, Skull, Trophy, Flame } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Header } from '@/components/Header';
import { cn, formatCurrency } from '@/lib/utils';
import { useTheme } from '@/lib/ThemeContext';
import { THEMES } from '@/lib/themes';
import { FINANCIAL_BOSSES, calculateBossDamage } from '@/lib/financialBosses';
import { financialEngine } from '@/lib/financialEngine';
import { useReino } from '@/hooks/useReino';

export default function Bosses() {
  const { theme } = useTheme();
  const colors = THEMES[theme] || THEMES.default;
  const { transactions, assets, loading } = useReino();

  const [playerPower, setPlayerPower] = useState(0);

  useEffect(() => {
    if (loading) return;

    // Calculate player power based on financial data
    const netWorth = financialEngine.calculateNetWorth(transactions as any, assets as any);
    const totalInvested = assets.reduce((acc, curr) => acc + Number(curr.value || 0), 0);
    
    // Mock scores for budget control and consistency for now
    const budgetControlScore = 1000;
    const consistencyScore = 500;

    const power = financialEngine.calculatePlayerPower(netWorth, totalInvested, budgetControlScore, consistencyScore);
    setPlayerPower(power);
  }, [transactions, assets, loading]);

  return (
    <div className={cn("min-h-screen transition-colors duration-500", colors.bg)}>
      <Header />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-32">
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", colors.primary)}>
              <Skull className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900">Caverna dos Vilões</h2>
              <p className="text-sm text-gray-500">Derrote seus inimigos financeiros com disciplina</p>
            </div>
          </div>
        </header>

        {/* Player Power Status */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Poder de Combate</p>
              <h3 className="text-2xl font-display font-bold text-gray-900">{formatCurrency(playerPower)}</h3>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Dano Automático</p>
            <p className="text-sm font-bold text-emerald-600">Baseado no seu patrimônio</p>
          </div>
        </section>

        {/* Bosses List */}
        <section className="space-y-6">
          {FINANCIAL_BOSSES.map((boss, index) => {
            // Mock damage calculation for demonstration
            const damage = calculateBossDamage(playerPower, index + 1);
            const currentHp = Math.max(0, boss.hp - damage);
            const hpPercentage = Math.max(0, Math.min(100, (currentHp / boss.hp) * 100));
            const isDefeated = currentHp <= 0;

            return (
              <motion.div 
                key={boss.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "bg-white rounded-[2rem] p-6 shadow-sm border transition-all",
                  isDefeated ? "border-emerald-200 bg-emerald-50/30" : "border-gray-100"
                )}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                      isDefeated ? "bg-emerald-100 text-emerald-600" : "bg-red-50 text-red-500"
                    )}>
                      {isDefeated ? <Trophy className="w-8 h-8" /> : <Skull className="w-8 h-8" />}
                    </div>
                    <div>
                      <h4 className="text-xl font-display font-bold text-gray-900">{boss.name}</h4>
                      <p className="text-sm font-bold text-gray-500">{boss.title}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recompensa</p>
                    <p className="text-sm font-bold text-emerald-600">+{boss.rewardXP} XP</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-6">{boss.description}</p>

                {/* HP Bar */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-xs font-bold">
                    <span className={isDefeated ? "text-emerald-600" : "text-red-500"}>
                      {isDefeated ? 'Derrotado!' : 'HP do Vilão'}
                    </span>
                    <span className="text-gray-500">{formatCurrency(currentHp)} / {formatCurrency(boss.hp)}</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: '100%' }}
                      animate={{ width: `${hpPercentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={cn(
                        "h-full rounded-full",
                        isDefeated ? "bg-emerald-500" : "bg-red-500"
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Sword className="w-3 h-3" /> Fraqueza
                    </p>
                    <p className="text-sm font-medium text-gray-900">{boss.weakness}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Condição de Vitória
                    </p>
                    <p className="text-sm font-medium text-gray-900">{boss.victoryCondition}</p>
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
