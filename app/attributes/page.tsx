'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { formatCurrency, cn } from '@/lib/utils';
import { useTheme } from '@/lib/ThemeContext';
import { THEMES } from '@/lib/themes';
import { TrendingUp, TrendingDown, Settings2, X, Target } from 'lucide-react';
import { useReino } from '@/hooks/useReino';
import { BudgetProgressPanel } from '@/src/components/BudgetProgressPanel';
import { CategoryManagerPanel } from '@/src/components/CategoryManagerPanel';
import { AnnualChartPanel } from '@/src/components/AnnualChartPanel';

export default function Attributes() {
  const { theme } = useTheme();
  const colors = THEMES[theme] || THEMES.default;
  const { transactions } = useReino();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  // For now, we'll just calculate actuals from transactions for the summary cards.
  const today = new Date();
  const currentMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });

  const totalActualIncome = currentMonthTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalActualExpenses = currentMonthTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  
  return (
    <div className={cn("min-h-screen transition-colors duration-500", colors.bg)}>
      <Header />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-32">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900">Atributos</h2>
            <p className="text-sm text-gray-500">Orçado vs Realizado</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBudgetModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              <Target className="w-4 h-4" />
              <span>Planejamento de Orçamento</span>
            </button>
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              <Settings2 className="w-4 h-4" />
              <span>Gerenciar Categorias</span>
            </button>
          </div>
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

        {/* Annual Chart Section */}
        <section className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
          <header>
            <h3 className="text-xl font-display font-bold text-gray-900">Visão Mensal</h3>
            <p className="text-sm text-gray-500">Comparativo de Orçamento vs Realizado no mês atual.</p>
          </header>
          <AnnualChartPanel />
        </section>

      </main>

      {/* Budget Planning Modal */}
      <AnimatePresence>
        {isBudgetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBudgetModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                  <h3 className="text-xl font-display font-bold text-gray-900">Planejamento de Orçamento</h3>
                  <p className="text-sm text-gray-500">Defina seus limites de gastos e metas de receitas globais.</p>
                </div>
                <button
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                <BudgetProgressPanel hideSelectors={true} isPlanningMode={true} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Manager Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                  <h3 className="text-xl font-display font-bold text-gray-900">Gerenciar Categorias</h3>
                  <p className="text-sm text-gray-500">Crie ou edite suas subcategorias RPG</p>
                </div>
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                <CategoryManagerPanel />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <BottomNav />
    </div>
  );
}
