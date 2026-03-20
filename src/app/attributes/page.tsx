'use client';

import { useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { formatCurrency, cn } from '@/lib/utils';
import { useTheme } from '@/lib/ThemeContext';
import { THEMES } from '@/lib/themes';
import { TrendingUp, TrendingDown, Settings2, X, Target } from 'lucide-react';
import { useKingdom } from '@/hooks/useKingdom';
import { useBudgets } from '@/hooks/useBudgets';
import { BudgetProgressPanel } from '@/components/ui/BudgetProgressPanel';
import { CategoryManagerPanel } from '@/components/ui/CategoryManagerPanel';
import { AnnualChartPanel } from '@/components/ui/AnnualChartPanel';
import { RecurringAccountsPanel } from '@/components/ui/RecurringAccountsPanel';

function AttributesContent() {
  const { theme } = useTheme();
  const colors = THEMES[theme] || THEMES.default;
  const { transactions } = useKingdom();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const { budgetProgress } = useBudgets(month, year);

  const cofreReino = budgetProgress
    .filter(b => b.rpg_group === '💎 Cofre do Reino (Receitas Fixas)')
    .reduce((acc, curr) => ({ orcado: acc.orcado + curr.orcado, realizado: acc.gasto_real + curr.gasto_real, previsto: acc.previsto + curr.previsto }), { orcado: 0, realizado: 0, previsto: 0 });
  const saquesMissoes = budgetProgress
    .filter(b => b.rpg_group === '⚡ Saque de Missões (Receitas Variáveis)')
    .reduce((acc, curr) => ({ orcado: acc.orcado + curr.orcado, realizado: acc.gasto_real + curr.gasto_real, previsto: acc.previsto + curr.previsto }), { orcado: 0, realizado: 0, previsto: 0 });
  const tributosReino = budgetProgress
    .filter(b => b.rpg_group === '🛡️ Tributos do Reino (Despesas Fixas)')
    .reduce((acc, curr) => ({ orcado: acc.orcado + curr.orcado, realizado: acc.gasto_real + curr.gasto_real, previsto: acc.previsto + curr.previsto }), { orcado: 0, realizado: 0, previsto: 0 });
  const aventurasHeroi = budgetProgress
    .filter(b => b.rpg_group === '⚔️ Aventuras do Herói (Despesas Variáveis)')
    .reduce((acc, curr) => ({ orcado: acc.orcado + curr.orcado, realizado: acc.gasto_real + curr.gasto_real, previsto: acc.previsto + curr.previsto }), { orcado: 0, realizado: 0, previsto: 0 });
  
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

        {/* Grid de receitas/despesas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Coluna de Receitas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-black text-gray-700 uppercase tracking-wider">
                Receitas
              </span>
            </div>
            
            <Link href="/transactions" className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer block">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">💎</span>
                <span className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
                  Cofre do Reino
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-2">Receitas Fixas</p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Realizado</p>
                  <p className="text-lg font-bold text-emerald-600">{formatCurrency(cofreReino.realizado)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Previsto</p>
                  <p className="text-sm font-medium text-gray-500">{formatCurrency(cofreReino.previsto)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Orçado</p>
                  <p className="text-sm font-medium text-gray-700">{formatCurrency(cofreReino.orcado)}</p>
                </div>
              </div>
            </Link>

            <Link href="/transactions" className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer block">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⚡</span>
                <span className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
                  Saque de Missões
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-2">Receitas Variáveis</p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Realizado</p>
                  <p className="text-lg font-bold text-emerald-600">{formatCurrency(saquesMissoes.realizado)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Previsto</p>
                  <p className="text-sm font-medium text-gray-500">{formatCurrency(saquesMissoes.previsto)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Orçado</p>
                  <p className="text-sm font-medium text-gray-700">{formatCurrency(saquesMissoes.orcado)}</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Coluna de Despesas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span className="text-xs font-black text-gray-700 uppercase tracking-wider">
                Despesas
              </span>
            </div>

            <Link href="/transactions" className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer block">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🛡️</span>
                <span className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
                  Tributos do Reino
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-2">Despesas Fixas</p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Realizado</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(tributosReino.realizado)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Previsto</p>
                  <p className="text-sm font-medium text-gray-500">{formatCurrency(tributosReino.previsto)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Orçado</p>
                  <p className="text-sm font-medium text-gray-700">{formatCurrency(tributosReino.orcado)}</p>
                </div>
              </div>
            </Link>

            <Link href="/transactions" className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer block">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⚔️</span>
                <span className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
                  Aventuras do Herói
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-2">Despesas Variáveis</p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Realizado</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(aventurasHeroi.realizado)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Previsto</p>
                  <p className="text-sm font-medium text-gray-500">{formatCurrency(aventurasHeroi.previsto)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Orçado</p>
                  <p className="text-sm font-medium text-gray-700">{formatCurrency(aventurasHeroi.orcado)}</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recurring Accounts Panel */}
        <section>
          <RecurringAccountsPanel />
        </section>

        {/* Annual Chart Section */}
        <section className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
          <header>
            <h3 className="text-xl font-display font-bold text-gray-900">Visão Mensal</h3>
            <p className="text-sm text-gray-500">Comparativo de Orçamento vs Realizado no mês atual.</p>
          </header>
          <AnnualChartPanel />
        </section>

        {/* Budget Progress Panel */}
        <section className="space-y-6">
          <BudgetProgressPanel month={today.getMonth() + 1} year={today.getFullYear()} hideSelectors={true} />
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

export default function Attributes() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
      <AttributesContent />
    </Suspense>
  );
}
