'use client';

import { motion } from 'motion/react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { formatCurrency, cn } from '@/lib/utils';
import { useTheme } from '@/lib/ThemeContext';
import { THEMES } from '@/lib/themes';
import { TrendingUp, TrendingDown, Wallet, Target, ArrowRight } from 'lucide-react';
import { useReino } from '@/hooks/useReino';
import { BudgetProgressPanel } from '@/src/components/BudgetProgressPanel';
import { CategoryManagerPanel } from '@/src/components/CategoryManagerPanel';

export default function Attributes() {
  const { theme } = useTheme();
  const colors = THEMES[theme] || THEMES.default;
  const { transactions } = useReino();

  // For now, we'll just calculate actuals from transactions for the summary cards.
  // The detailed budget planning is handled by BudgetProgressPanel.
  const today = new Date();
  const currentMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });

  const totalActualIncome = currentMonthTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalActualExpenses = currentMonthTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  
  const surplus = totalActualIncome - totalActualExpenses;

  return (
    <div className={cn("min-h-screen transition-colors duration-500", colors.bg)}>
      <Header />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-32">
        <header>
          <h2 className="text-2xl font-display font-bold text-gray-900">Atributos</h2>
          <p className="text-sm text-gray-500">Orçado vs Realizado</p>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-gray-900">Receitas (Realizado)</span>
              </div>
            </div>
            <div className="pt-2">
              <p className="text-2xl font-display font-bold text-emerald-600">{formatCurrency(totalActualIncome)}</p>
            </div>
          </section>

          <section className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-gray-900">Despesas (Realizado)</span>
              </div>
            </div>
            <div className="pt-2">
              <p className="text-2xl font-display font-bold text-red-600">{formatCurrency(totalActualExpenses)}</p>
            </div>
          </section>
        </div>

        {/* Surplus Card */}
        <section className={cn("p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden", colors.primary)}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
          <div className="relative z-10 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
              <Wallet className="w-8 h-8" />
            </div>
            <div>
              <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Saldo para a Caverna</p>
              <h3 className="text-3xl font-display font-bold">{formatCurrency(surplus)}</h3>
            </div>
            <p className="text-white/60 text-xs max-w-[200px]">
              Este é o valor disponível para ser investido na Caverna este mês.
            </p>
          </div>
        </section>

        {/* Budget Planning Section */}
        <section className="space-y-4">
          <header>
            <h3 className="text-xl font-display font-bold text-gray-900">Planejamento (Orçados)</h3>
            <p className="text-sm text-gray-500">Defina seus limites de gastos para cada atributo.</p>
          </header>
          
          <BudgetProgressPanel />
        </section>

        {/* Categories Manager Section */}
        <section className="space-y-4 pt-4 border-t border-gray-100">
          <CategoryManagerPanel />
        </section>
      </main>
      
      <BottomNav />
    </div>
  );
}
