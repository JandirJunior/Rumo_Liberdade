'use client';

import { useState, Suspense } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { formatCurrency, cn, getColorClass } from '@/lib/utils';
import { useTheme } from '@/lib/ThemeContext';
import { THEMES } from '@/lib/themes';
import { TrendingUp, TrendingDown, Settings2, X, Target } from 'lucide-react';
import { useKingdom } from '@/hooks/useKingdom';
import { useBudgets } from '@/hooks/useBudgets';
import { BudgetProgressPanel } from '@/components/ui/BudgetProgressPanel';
import { CategoryManagerPanel } from '@/components/ui/CategoryManagerPanel';
import { AnnualChartPanel } from '@/components/ui/AnnualChartPanel';
import { RecurringAccountsPanel } from '@/components/ui/RecurringAccountsPanel';
import { OverviewListPanel } from '@/components/ui/OverviewListPanel';

function AttributesContent() {
  const { theme, user, loading: authLoading } = useTheme();
  const colors = THEMES[theme] || THEMES.ORBITA;

  const { transactions, payables, receivables, creditCards, deletePayable, deleteReceivable, deleteCreditCard } = useKingdom();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'Visão Geral' | 'Orçamento' | 'Recorrências'>('Visão Geral');

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const { budgetProgress } = useBudgets(month, year);

  const handleEdit = (item: any) => {
    console.log('Edit item:', item);
    // TODO: Implement edit modal
  };

  const handleDelete = (item: any) => {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      if (item.type === 'payable') deletePayable(item.id);
      else if (item.type === 'receivable') deleteReceivable(item.id);
      else if (item.type === 'card') deleteCreditCard(item.id);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-dark)]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[var(--color-text-muted)] font-medium">Consultando Atributos...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const cofreReino = budgetProgress
    .filter(b => b.rpg_group === '💎 Cofre do Reino (Receitas Fixas)')
    .reduce((acc, curr) => ({ orcado: acc.orcado + curr.orcado, realizado: acc.realizado + curr.gasto_real, previsto: acc.previsto + curr.previsto }), { orcado: 0, realizado: 0, previsto: 0 });
  const saquesMissoes = budgetProgress
    .filter(b => b.rpg_group === '⚡ Saque de Missões (Receitas Variáveis)')
    .reduce((acc, curr) => ({ orcado: acc.orcado + curr.orcado, realizado: acc.realizado + curr.gasto_real, previsto: acc.previsto + curr.previsto }), { orcado: 0, realizado: 0, previsto: 0 });
  const tributosReino = budgetProgress
    .filter(b => b.rpg_group === '🛡️ Tributos do Reino (Despesas Fixas)')
    .reduce((acc, curr) => ({ orcado: acc.orcado + curr.orcado, realizado: acc.realizado + curr.gasto_real, previsto: acc.previsto + curr.previsto }), { orcado: 0, realizado: 0, previsto: 0 });
  const aventurasHeroi = budgetProgress
    .filter(b => b.rpg_group === '⚔️ Aventuras do Herói (Despesas Variáveis)')
    .reduce((acc, curr) => ({ orcado: acc.orcado + curr.orcado, realizado: acc.realizado + curr.gasto_real, previsto: acc.previsto + curr.previsto }), { orcado: 0, realizado: 0, previsto: 0 });
  
  // Filter out the specified expense categories from the progress panel
  const expenseCategoriesToRemove = ['Previdência privada', 'Seguros', 'Aluguel/Financiamento', 'Impostos e taxas'];
  const filteredBudgetProgress = budgetProgress.filter(b => !expenseCategoriesToRemove.includes(b.category_name));
  
  return (
    <div className={cn("min-h-screen transition-colors duration-500 bg-[var(--color-bg-dark)] relative overflow-hidden")}>
      {/* Imagem de Fundo Sugestiva */}
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none">
        <Image
          src="https://ibb.co/0yYwRDgp"
          alt="Attributes Background"
          fill
          priority
          className="object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      <Header />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-32 relative z-10">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl medieval-title font-bold text-[var(--color-text-main)]">Atributos</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Orçado vs Realizado</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBudgetModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-xl text-sm font-bold text-[var(--color-text-main)] shadow-sm hover:bg-[var(--color-bg-dark)] transition-colors medieval-border"
            >
              <Target className="w-4 h-4" />
              <span>Planejamento de Orçamento</span>
            </button>
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-xl text-sm font-bold text-[var(--color-text-main)] shadow-sm hover:bg-[var(--color-bg-dark)] transition-colors medieval-border"
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
            
            <Link href="/transactions?search=Cofre do Reino" className="bg-[var(--color-bg-panel)] rounded-2xl p-4 border border-[var(--color-border)] shadow-sm hover:bg-[var(--color-bg-dark)] transition-colors cursor-pointer block medieval-border">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">💎</span>
                <span className="text-[10px] font-black text-[var(--color-text-main)] uppercase tracking-wider">
                  Cofre do Reino
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mb-2">Receitas Fixas</p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider">Realizado</p>
                  <p className={cn(
                    "text-lg font-bold",
                    getColorClass(cofreReino.realizado || 0)
                  )}>
                    {formatCurrency(cofreReino.realizado || 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider">Previsto</p>
                  <p className="text-sm font-medium text-[var(--color-text-muted)]">{formatCurrency(cofreReino.previsto)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider">Orçado</p>
                  <p className="text-sm font-medium text-[var(--color-text-main)]">{formatCurrency(cofreReino.orcado)}</p>
                </div>
              </div>
            </Link>

            <Link href="/transactions?search=Saque de Missões" className="bg-[var(--color-bg-panel)] rounded-2xl p-4 border border-[var(--color-border)] shadow-sm hover:bg-[var(--color-bg-dark)] transition-colors cursor-pointer block medieval-border">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⚡</span>
                <span className="text-[10px] font-black text-[var(--color-text-main)] uppercase tracking-wider">
                  Saque de Missões
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mb-2">Receitas Variáveis</p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider">Realizado</p>
                  <p className={cn(
                    "text-lg font-bold",
                    getColorClass(saquesMissoes.realizado || 0)
                  )}>
                    {formatCurrency(saquesMissoes.realizado || 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider">Previsto</p>
                  <p className="text-sm font-medium text-[var(--color-text-muted)]">{formatCurrency(saquesMissoes.previsto)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider">Orçado</p>
                  <p className="text-sm font-medium text-[var(--color-text-main)]">{formatCurrency(saquesMissoes.orcado)}</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Coluna de Despesas */}
          <div className="space-y-4">
            
            <Link href="/transactions?search=Tributos do Reino" className="bg-[var(--color-bg-panel)] rounded-2xl p-4 border border-[var(--color-border)] shadow-sm hover:bg-[var(--color-bg-dark)] transition-colors cursor-pointer block medieval-border">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🛡️</span>
                <span className="text-[10px] font-black text-[var(--color-text-main)] uppercase tracking-wider">
                  Tributos do Reino
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mb-2">Despesas Fixas</p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider">Realizado</p>
                  <p className={cn(
                    "text-lg font-bold",
                    getColorClass(-(tributosReino.realizado || 0))
                  )}>
                    {formatCurrency(tributosReino.realizado || 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider">Previsto</p>
                  <p className="text-sm font-medium text-[var(--color-text-muted)]">{formatCurrency(tributosReino.previsto)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider">Orçado</p>
                  <p className="text-sm font-medium text-[var(--color-text-main)]">{formatCurrency(tributosReino.orcado)}</p>
                </div>
              </div>
            </Link>

            <Link href="/transactions?search=Aventuras do Herói" className="bg-[var(--color-bg-panel)] rounded-2xl p-4 border border-[var(--color-border)] shadow-sm hover:bg-[var(--color-bg-dark)] transition-colors cursor-pointer block medieval-border">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⚔️</span>
                <span className="text-[10px] font-black text-[var(--color-text-main)] uppercase tracking-wider">
                  Aventuras do Herói
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mb-2">Despesas Variáveis</p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider">Realizado</p>
                  <p className={cn(
                    "text-lg font-bold",
                    getColorClass(-(aventurasHeroi.realizado || 0))
                  )}>
                    {formatCurrency(aventurasHeroi.realizado || 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider">Previsto</p>
                  <p className="text-sm font-medium text-[var(--color-text-muted)]">{formatCurrency(aventurasHeroi.previsto)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider">Orçado</p>
                  <p className="text-sm font-medium text-[var(--color-text-main)]">{formatCurrency(aventurasHeroi.orcado)}</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Painéis de Detalhe com Abas */}
        <section className="bg-[var(--color-bg-panel)] rounded-2xl border border-[var(--color-border)] shadow-sm medieval-border overflow-hidden">
          <div className="flex border-b border-[var(--color-border)]">
            {['Visão Geral', 'Recorrências', 'Orçamento'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "px-6 py-4 text-sm font-bold transition-colors border-b-2",
                  activeTab === tab 
                    ? "border-[var(--color-primary)] text-[var(--color-text-main)]" 
                    : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div className="p-6">
            {activeTab === 'Visão Geral' && <OverviewListPanel payables={payables} receivables={receivables} creditCards={creditCards} onEdit={handleEdit} onDelete={handleDelete} />}
            {activeTab === 'Orçamento' && (
              <BudgetProgressPanel 
                month={today.getMonth() + 1} 
                year={today.getFullYear()} 
                hideSelectors={true} 
              />
            )}
            {activeTab === 'Recorrências' && <RecurringAccountsPanel />}
          </div>
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
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-[var(--color-bg-panel)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] medieval-border"
            >
              <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
                <div>
                  <h3 className="text-xl medieval-title font-bold text-[var(--color-text-main)]">Planejamento de Orçamento</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">Defina seus limites de gastos e metas de receitas globais.</p>
                </div>
                <button
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-dark)] rounded-full transition-colors"
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
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[var(--color-bg-panel)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] medieval-border"
            >
              <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
                <div>
                  <h3 className="text-xl medieval-title font-bold text-[var(--color-text-main)]">Gerenciar Categorias</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">Crie ou edite suas subcategorias RPG</p>
                </div>
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-dark)] rounded-full transition-colors"
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
