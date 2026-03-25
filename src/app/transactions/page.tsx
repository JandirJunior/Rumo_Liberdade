/**
 * Página de Transações (Quests): Exibe o histórico de receitas, despesas e investimentos.
 * Permite filtrar por tipo e adicionar novas transações.
 * No modo Reino (multiplayer), exibe o nome do usuário que realizou a transação.
 */
'use client';

import { Suspense, useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { useSearchParams } from 'next/navigation';
import { Search, Filter, ArrowUpRight, ArrowDownLeft, Wallet, Plus, Sparkles, Edit2, Trash2, Upload, TrendingUp } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Modal } from '@/components/ui/Modal';
import { ImportModal } from '@/components/ui/ImportModal';
import { formatCurrency, cn, getColorClass } from '@/lib/utils';
import { Transaction, TransactionType } from '@/types';

import { useTheme } from '@/lib/ThemeContext';
import { IMAGES } from '@/assets/images';
import { THEMES } from '@/lib/themes';
import { useKingdom } from '@/hooks/useKingdom';
import { useCategories } from '@/hooks/useCategories';
import { GoogleGenAI, Type } from '@google/genai';
import { financialEngine } from '@/lib/financialEngine';

import { useActionContext } from '@/context/ActionContext';

function TransactionsContent() {
  const { theme, user, gameMode, loading: authLoading } = useTheme();
  const colors = THEMES[theme] || THEMES.ORBITA;

  const { transactions, addTransaction, updateTransaction, deleteTransaction, addInvestment, loading: transactionsLoading } = useKingdom();
  const { categories, loading: categoriesLoading } = useCategories();
  const { openAction } = useActionContext();

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const [filter, setFilter] = useState<'all' | 'income' | 'expense' | 'investment'>('all');
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  // Sincronizar busca com a URL durante a renderização
  const searchFromUrl = searchParams.get('search');
  if (searchFromUrl !== null && searchFromUrl !== searchTerm) {
    setSearchTerm(searchFromUrl);
  }

  useEffect(() => {
    const openModal = searchParams.get('openModal');
    if (openModal === 'true') {
      openAction('despesa');
    }
  }, [searchParams, openAction]);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-dark)]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[var(--color-text-muted)] font-medium">Carregando Quests...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (transactionsLoading || categoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-dark)]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[var(--color-text-muted)] font-medium">Carregando Quests...</p>
        </div>
      </div>
    );
  }

  const handleEditTransaction = (t: Transaction) => {
    if (t.type === 'investment') {
      openAction('investimento_compra', {
        id: t.id,
        descricao: t.ticker,
        valorTotal: t.amount,
        quantidade: t.quantity,
        categoriaFinanceira: t.investment_category_id,
        usarDataManual: true,
        dataRegistro: t.date ? t.date.split('T')[0] : new Date().toISOString().split('T')[0]
      });
    } else {
      openAction(t.type === 'income' ? 'receita' : 'despesa', {
        id: t.id,
        descricao: t.description,
        valorTotal: t.amount,
        categoria: t.category_id,
        usarDataManual: true,
        dataRegistro: t.date ? t.date.split('T')[0] : new Date().toISOString().split('T')[0]
      });
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    setTransactionToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteTransaction = async () => {
    if (transactionToDelete) {
      await deleteTransaction(transactionToDelete);
      setIsDeleteModalOpen(false);
      setTransactionToDelete(null);
    }
  };

  const handleImportTransactions = async (data: { type: string; amount: string; description: string; category_id: string; date?: string }[]) => {
    for (const item of data) {
      // expected headers: type, amount, description, category_id, date
      await addTransaction({
        type: item.type.toLowerCase() as TransactionType,
        amount: parseFloat(item.amount),
        description: item.description,
        category_id: item.category_id,
        date: item.date || new Date().toISOString().split('T')[0]
      });
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    const matchesMonth = d.getMonth() + 1 === month;
    const matchesYear = d.getFullYear() === year;
    const matchesFilter = filter === 'all' || t.type === filter;
    const matchesSearch = (t.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesMonth && matchesYear && matchesFilter && matchesSearch;
  });

  const { income: totalActualIncome, expense: totalActualExpenses, investment: totalActualInvestments } = financialEngine.calculateMonthlySummary(transactions, month, year);

  const surplus = totalActualIncome - totalActualExpenses - totalActualInvestments;

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  };

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  return (
    <div className="min-h-screen transition-colors duration-500 bg-[var(--color-bg-dark)] relative overflow-hidden">
      {/* Imagem de Fundo Sugestiva */}
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none">
        <Image
          src={IMAGES.QUESTS}
          alt="Transactions Background"
          fill
          priority
          className="object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      <Header />

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-32 relative z-10">
        <header className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl medieval-title font-bold text-[var(--color-text-main)]">Quests</h2>
              <p className="text-sm text-[var(--color-text-muted)]">Suas missões e histórico de transações</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-4 h-10 rounded-xl flex items-center gap-2 bg-[var(--color-bg-panel)] border border-[var(--color-border)] text-[var(--color-text-main)] shadow-sm font-bold text-sm transition-transform active:scale-95 hover:bg-[var(--color-bg-dark)] medieval-border"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Importar</span>
              </button>
              <button
                onClick={() => openAction('receita')}
                className="px-4 h-10 rounded-xl flex items-center gap-2 bg-emerald-900/20 border border-emerald-700/50 text-emerald-500 shadow-sm font-bold text-sm transition-transform active:scale-95 hover:bg-emerald-900/40 medieval-border"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span className="hidden sm:inline">Receita</span>
              </button>
              <button
                onClick={() => openAction('despesa')}
                className="px-4 h-10 rounded-xl flex items-center gap-2 bg-red-900/20 border border-red-700/50 text-red-500 shadow-sm font-bold text-sm transition-transform active:scale-95 hover:bg-red-900/40 medieval-border"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Despesa</span>
              </button>
            </div>
          </div>

          {/* Month/Year Filter */}
          <div className="flex items-center justify-between bg-[var(--color-bg-panel)] rounded-2xl p-2 shadow-sm border border-[var(--color-border)] medieval-border">
            <button onClick={handlePrevMonth} className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors">
              <ArrowDownLeft className="w-5 h-5 rotate-45" />
            </button>
            <div className="text-center">
              <p className="text-sm font-bold text-[var(--color-text-main)]">{monthNames[month - 1]}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{year}</p>
            </div>
            <button onClick={handleNextMonth} className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors">
              <ArrowUpRight className="w-5 h-5 rotate-45" />
            </button>
          </div>

          {/* Surplus Card */}
          <section className={cn("p-8 rounded-2xl text-white shadow-xl relative overflow-hidden medieval-border medieval-glow", colors.primary)}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-black/30 rounded-full -mr-24 -mt-24 blur-3xl"></div>
            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-black/30 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                <Wallet className="w-8 h-8" />
              </div>
              <div>
                <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Saldo para o Inventário</p>
                <h3 className={cn("text-3xl font-display font-bold", getColorClass(surplus))}>{formatCurrency(surplus)}</h3>
              </div>
              <p className="text-white/60 text-xs max-w-[200px]">
                Este é o valor disponível para ser investido no Inventário este mês.
              </p>
            </div>
          </section>

          {/* Search and Filter */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Buscar transação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
                className="w-full pl-12 pr-4 py-4 bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-2xl shadow-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all text-[var(--color-text-main)] medieval-border uppercase"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {['all', 'income', 'expense', 'investment'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as 'all' | 'income' | 'expense' | 'investment')}
                  className={cn(
                    "px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border medieval-border",
                    filter === f
                      ? cn(colors.primary, "text-white border-transparent shadow-lg", colors.shadow)
                      : "bg-[var(--color-bg-panel)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-[var(--color-primary)]"
                  )}
                >
                  {f === 'all' ? 'Tudo' : f === 'income' ? 'Receitas' : f === 'expense' ? 'Despesas' : 'Investimentos'}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Transaction List */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Transações</h4>
            <Filter className="w-4 h-4 text-[var(--color-text-muted)]" />
          </div>

          <div className="space-y-4">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((t, i) => {
                const userName = t.userName || 'Herói Desconhecido';
                const categoryObj = categories.find(c => c.id === t.category_id);
                let categoryName = t.categoryName || (categoryObj ? categoryObj.name : 'Sem Categoria');

                if (t.type === 'investment' && (t.category_id === 'investment' || t.category_id === 'investimentos')) {
                  categoryName = 'Aporte em Investimento';
                }

                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 p-4 bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-shadow group medieval-border"
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-[var(--color-border)]",
                      t.type === 'income' || t.type === 'earning' ? "bg-emerald-900/20 text-emerald-500" :
                        t.type === 'expense' ? "bg-red-900/20 text-red-500" : 
                        t.type === 'investment' ? "bg-emerald-900/20 text-emerald-500" : // Ambas verdes conforme solicitado
                        "bg-blue-900/20 text-blue-500"
                    )}>
                      {t.type === 'income' || t.type === 'earning' ? <ArrowUpRight className="w-6 h-6" /> :
                        t.type === 'expense' ? <ArrowDownLeft className="w-6 h-6" /> : 
                        t.type === 'investment' ? (t.amount > 0 ? <ArrowUpRight className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />) :
                        <Wallet className="w-6 h-6" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--color-text-main)] truncate">{t.description}</p>
                      <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                        {categoryName} • {new Date(t.created_at || t.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {` • Por: ${userName}`}
                      </p>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1">
                      <p className={cn(
                        "text-sm font-bold",
                        t.type === 'income' || t.type === 'earning' ? "text-green-500" :
                        t.type === 'expense' ? "text-red-500" :
                        t.amount > 0 ? "text-green-500" : "text-red-500" // Venda verde, Compra vermelha (ou verde se o usuário preferir, mas ele disse negativo)
                      )}>
                        {t.type === 'income' || t.type === 'earning' || (t.type === 'investment' && t.amount > 0) ? '+' : '-'} {formatCurrency(Math.abs(t.amount))}
                      </p>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditTransaction(t)} className="text-[var(--color-text-muted)] hover:text-blue-500 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteTransaction(t.id)} className="text-[var(--color-text-muted)] hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[var(--color-bg-dark)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--color-border)]">
                  <Search className="w-8 h-8 text-[var(--color-text-muted)]" />
                </div>
                <p className="text-[var(--color-text-muted)] font-medium">Nenhuma transação encontrada.</p>
              </div>
            )}
          </div>
        </section>

        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportTransactions}
          title="Importar Transações"
          template={['type', 'amount', 'description', 'category_id', 'date']}
        />

        {isImportModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-[var(--color-bg-panel)] p-4 rounded-xl shadow-xl border border-[var(--color-border)] mt-[400px] pointer-events-auto max-w-md medieval-border">
              <p className="text-xs font-bold text-[var(--color-text-main)] mb-2 uppercase tracking-wider">Instruções de Importação:</p>
              <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">
                O arquivo deve ser um CSV com os seguintes cabeçalhos: <strong>type</strong> (income/expense), <strong>amount</strong> (valor), <strong>description</strong> (descrição), <strong>category_id</strong> (ID da categoria) e <strong>date</strong> (YYYY-MM-DD).
              </p>
            </div>
          </div>
        )}

        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Excluir Transação">
          <div className="space-y-6">
            <p className="text-[var(--color-text-muted)] text-sm">Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-4 rounded-2xl bg-[var(--color-bg-dark)] border border-[var(--color-border)] text-[var(--color-text-main)] font-bold transition-all active:scale-95 medieval-border"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteTransaction}
                className="flex-1 py-4 rounded-2xl bg-red-900/50 border border-red-700/50 text-red-500 font-bold transition-all active:scale-95 medieval-border hover:bg-red-900/80"
              >
                Excluir
              </button>
            </div>
          </div>
        </Modal>

      </main>
    </div>
  );
}

export default function Transactions() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
      <TransactionsContent />
    </Suspense>
  );
}
