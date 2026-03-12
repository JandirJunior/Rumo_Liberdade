'use client';

import { motion } from 'motion/react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { MOCK_BUDGET } from '@/lib/data';
import { BudgetItem } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { useTheme } from '@/lib/ThemeContext';
import { THEMES } from '@/lib/themes';
import { TrendingUp, TrendingDown, Wallet, Target, ArrowRight } from 'lucide-react';
import { useReino } from '@/hooks/useReino';

export default function Attributes() {
  const { theme } = useTheme();
  const colors = THEMES[theme] || THEMES.default;
  const { transactions } = useReino();

  const totalPlannedIncome = MOCK_BUDGET.income.reduce((acc: number, curr: BudgetItem) => acc + curr.planned, 0);
  const totalActualIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  
  const totalPlannedExpenses = MOCK_BUDGET.expenses.reduce((acc: number, curr: BudgetItem) => acc + curr.planned, 0);
  const totalActualExpenses = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);

  const incomeDiff = totalActualIncome - totalPlannedIncome;
  const expenseDiff = totalActualExpenses - totalPlannedExpenses;
  
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
                <span className="text-sm font-bold text-gray-900">Receitas</span>
              </div>
              <span className={cn("text-xs font-bold px-2 py-1 rounded-full", incomeDiff >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                {incomeDiff >= 0 ? '+' : ''}{formatCurrency(incomeDiff)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Previsto</p>
                <p className="text-lg font-display font-bold text-gray-900">{formatCurrency(totalPlannedIncome)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Realizado</p>
                <p className="text-lg font-display font-bold text-emerald-600">{formatCurrency(totalActualIncome)}</p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-gray-900">Despesas</span>
              </div>
              <span className={cn("text-xs font-bold px-2 py-1 rounded-full", expenseDiff <= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                {expenseDiff > 0 ? '+' : ''}{formatCurrency(expenseDiff)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Previsto</p>
                <p className="text-lg font-display font-bold text-gray-900">{formatCurrency(totalPlannedExpenses)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Realizado</p>
                <p className="text-lg font-display font-bold text-red-600">{formatCurrency(totalActualExpenses)}</p>
              </div>
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

        {/* Detailed List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="space-y-4">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Detalhamento de Receitas</h4>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              {MOCK_BUDGET.income.map((item: BudgetItem, i: number) => (
                <div key={i} className="p-4 border-b border-gray-50 last:border-0 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{item.name}</p>
                    <p className="text-[10px] text-gray-400">Previsto: {formatCurrency(item.planned)}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-sm font-bold", item.actual >= item.planned ? "text-emerald-600" : "text-gray-900")}>
                      {formatCurrency(item.actual)}
                    </p>
                    <p className={cn("text-[10px] font-bold", item.actual >= item.planned ? "text-emerald-500" : "text-red-500")}>
                      {((item.actual / item.planned) * 100).toFixed(0)}% do plano
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Detalhamento de Despesas</h4>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              {MOCK_BUDGET.expenses.map((item: BudgetItem, i: number) => (
                <div key={i} className="p-4 border-b border-gray-50 last:border-0 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{item.name}</p>
                    <p className="text-[10px] text-gray-400">Previsto: {formatCurrency(item.planned)}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-sm font-bold", item.actual <= item.planned ? "text-emerald-600" : "text-red-600")}>
                      {formatCurrency(item.actual)}
                    </p>
                    <p className={cn("text-[10px] font-bold", item.actual <= item.planned ? "text-emerald-500" : "text-red-500")}>
                      {((item.actual / item.planned) * 100).toFixed(0)}% do plano
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}
