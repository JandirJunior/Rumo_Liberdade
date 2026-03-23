'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ArrowUpRight, ArrowDownRight, CreditCard, Wallet, TrendingUp, X, Calendar, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/ThemeContext';
import { THEMES } from '@/lib/themes';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { useAccountsPayable } from '@/hooks/useAccountsPayable';
import { useAccountsReceivable } from '@/hooks/useAccountsReceivable';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useCategories } from '@/hooks/useCategories';
import { useKingdom } from '@/hooks/useKingdom';
import { formatCurrency } from '@/lib/utils';

export function SpeedDial() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();
  const { userData, loading } = useUser();
  const router = useRouter();
  const colors = THEMES[theme] || THEMES.ORBITA;

  // Modal states
  const [activeModal, setActiveModal] = useState<'payable' | 'receivable' | 'cards' | 'transaction' | 'investment' | null>(null);

  // Hooks
  const { addPayable } = useAccountsPayable();
  const { addReceivable } = useAccountsReceivable();
  const { addCreditCard } = useCreditCards();
  const { categories } = useCategories();
  const { user: authUser, addTransaction, addInvestment } = useKingdom();

  // Form states - Contas a Pagar/Receber
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category_id, setCategoryId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState('monthly');

  // Form states - Cartão
  const [cardName, setCardName] = useState('');
  const [cardLimit, setCardLimit] = useState('');
  const [closingDay, setClosingDay] = useState('');
  const [dueDay, setDueDay] = useState('');

  // Form states - Transação
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [transactionDescription, setTransactionDescription] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionCategory, setTransactionCategory] = useState('');

  // Form states - Investimento
  const [investmentType, setInvestmentType] = useState('F');
  const [investmentTicker, setInvestmentTicker] = useState('');
  const [investmentValue, setInvestmentValue] = useState('');
  const [investmentQuantity, setInvestmentQuantity] = useState('');
  const [investmentDate, setInvestmentDate] = useState(new Date().toISOString().split('T')[0]);

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setDueDate('');
    setCategoryId('');
    setIsRecurring(false);
    setRecurrenceRule('monthly');
    setCardName('');
    setCardLimit('');
    setClosingDay('');
    setDueDay('');
    setTransactionType('expense');
    setTransactionDescription('');
    setTransactionAmount('');
    setTransactionCategory('');
    setInvestmentType('F');
    setInvestmentTicker('');
    setInvestmentValue('');
    setInvestmentQuantity('');
    setInvestmentDate(new Date().toISOString().split('T')[0]);
  };

  const handleAddPayable = async () => {
    if (!description || !amount || !dueDate) return;
    try {
      await addPayable({
        description,
        amount: parseFloat(amount),
        due_date: dueDate,
        category_id: category_id || undefined,
        isRecurring,
        recurrenceRule: isRecurring ? recurrenceRule : undefined,
        status: 'pendente',
      });
      resetForm();
      setActiveModal(null);
    } catch (error) {
      console.error('Error adding payable:', error);
    }
  };

  const handleAddReceivable = async () => {
    if (!description || !amount || !dueDate) return;
    try {
      await addReceivable({
        description,
        amount: parseFloat(amount),
        due_date: dueDate,
        category_id: category_id || undefined,
        isRecurring,
        recurrenceRule: isRecurring ? recurrenceRule : undefined,
        status: 'pendente',
      });
      resetForm();
      setActiveModal(null);
    } catch (error) {
      console.error('Error adding receivable:', error);
    }
  };

  const handleAddCard = async () => {
    if (!cardName || !cardLimit || !closingDay || !dueDay) return;
    try {
      await addCreditCard({
        name: cardName,
        limit: parseFloat(cardLimit),
        closing_day: parseInt(closingDay),
        due_day: parseInt(dueDay),
      });
      resetForm();
      setActiveModal(null);
    } catch (error) {
      console.error('Error adding card:', error);
    }
  };

  const handleAddTransaction = async () => {
    if (!transactionAmount || !transactionCategory) return;
    try {
      const transactionData = {
        description: transactionDescription,
        amount: parseFloat(transactionAmount),
        type: transactionType,
        category_id: transactionCategory,
        date: new Date().toISOString(),
      };

      await addTransaction(transactionData);
      resetForm();
      setActiveModal(null);
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const handleAddInvestment = async () => {
    if (!investmentTicker || !investmentValue || !investmentQuantity) return;
    try {
      const typeMap: Record<string, string> = {
        'F': 'fii',
        'A': 'stock',
        'C': 'crypto',
        'E': 'etf',
        'R': 'fixed_income',
        'O': 'other'
      };

      await addInvestment({
        type: typeMap[investmentType],
        ticker: investmentTicker.toUpperCase(),
        value: parseFloat(investmentValue),
        quantity: parseFloat(investmentQuantity),
        date: investmentDate
      });
      resetForm();
      setActiveModal(null);
    } catch (error) {
      console.error('Error adding investment:', error);
    }
  };

  if (loading || !userData) return null;

  const actions = [
    {
      icon: ArrowUpRight,
      label: 'A Pagar',
      color: 'bg-red-500',
      action: () => {
        setActiveModal('payable');
        setIsOpen(false);
      }
    },
    {
      icon: ArrowDownRight,
      label: 'A Receber',
      color: 'bg-emerald-500',
      action: () => {
        setActiveModal('receivable');
        setIsOpen(false);
      }
    },
    {
      icon: CreditCard,
      label: 'Cartão',
      color: 'bg-purple-500',
      action: () => {
        setActiveModal('cards');
        setIsOpen(false);
      }
    },
    {
      icon: TrendingUp,
      label: 'Investir',
      color: 'bg-blue-500',
      action: () => {
        setActiveModal('investment');
        setIsOpen(false);
      }
    },
    {
      icon: Wallet,
      label: 'Transação',
      color: 'bg-amber-500',
      action: () => {
        setActiveModal('transaction');
        setIsOpen(false);
      }
    },
  ];

  return (
    <>
      <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-4">
        <AnimatePresence>
          {isOpen && (
            <div className="flex flex-col items-end gap-3 mb-2">
              {actions.map((action, i) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, scale: 0, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0, y: 20 }}
                  transition={{ delay: (actions.length - i) * 0.05 }}
                  onClick={() => action.action()}
                  className="flex items-center gap-3 group"
                >
                  <span className="px-3 py-1 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-lg text-xs font-bold text-[var(--color-text-main)] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity medieval-border">
                    {action.label}
                  </span>
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-[var(--color-bg-dark)] shadow-lg transition-transform active:scale-95 medieval-glow", action.color)}>
                    <action.icon className="w-6 h-6" />
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-14 h-14 rounded-[2rem] flex items-center justify-center text-[var(--color-bg-dark)] shadow-2xl transition-all active:scale-95 medieval-glow",
            isOpen ? "bg-[var(--color-bg-panel)] text-[var(--color-text-main)] rotate-45 border border-[var(--color-border)]" : "bg-[var(--color-primary)]"
          )}
        >
          {isOpen ? <X className="w-8 h-8 -rotate-45" /> : <Plus className="w-8 h-8" />}
        </button>
      </div>

      {/* MODAL: Contas a Pagar */}
      <AnimatePresence>
        {activeModal === 'payable' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setActiveModal(null);
                resetForm();
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[var(--color-bg-panel)] rounded-2xl shadow-2xl overflow-hidden medieval-border"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
                <div>
                  <h3 className="text-xl medieval-title font-bold text-[var(--color-text-main)]">Conta a Pagar</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">Registre uma nova obrigação de pagamento</p>
                </div>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    resetForm();
                  }}
                  className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-dark)] rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--color-text-main)] mb-2">Descrição</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Aluguel, Fornecedor..."
                    className="w-full px-4 py-2 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all medieval-border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--color-text-main)] mb-2">Valor (R$)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    step="0.01"
                    className="w-full px-4 py-2 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all medieval-border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--color-text-main)] mb-2">Data de Vencimento</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all medieval-border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--color-text-main)] mb-2">Categoria</label>
                  <select
                    value={category_id}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-2 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all medieval-border"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories
                      .filter(c => c.flow_type === 'expense')
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 p-3 bg-[var(--color-bg-dark)] rounded-xl border border-[var(--color-border)] medieval-border">
                  <input
                    type="checkbox"
                    id="recurring-payable"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="recurring-payable" className="flex-1 text-sm font-bold text-[var(--color-text-main)] cursor-pointer">
                    É recorrente?
                  </label>
                </div>

                {isRecurring && (
                  <div>
                    <label className="block text-sm font-bold text-[var(--color-text-main)] mb-2">Frequência</label>
                    <select
                      value={recurrenceRule}
                      onChange={(e) => setRecurrenceRule(e.target.value)}
                      className="w-full px-4 py-2 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all medieval-border"
                    >
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensal</option>
                      <option value="quarterly">Trimestral</option>
                      <option value="yearly">Anual</option>
                    </select>
                  </div>
                )}

                <button
                  onClick={handleAddPayable}
                  disabled={!description || !amount || !dueDate}
                  className="w-full py-3 bg-[var(--color-primary)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-bg-dark)] font-bold rounded-xl transition-all active:scale-95 medieval-border medieval-glow"
                >
                  Registrar Obrigação
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Contas a Receber */}
      <AnimatePresence>
        {activeModal === 'receivable' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setActiveModal(null);
                resetForm();
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[var(--color-bg-panel)] rounded-2xl shadow-2xl overflow-hidden medieval-border"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
                <div>
                  <h3 className="text-xl medieval-title font-bold text-[var(--color-text-main)]">Conta a Receber</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">Registre uma nova fonte de receita</p>
                </div>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    resetForm();
                  }}
                  className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-dark)] rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--color-text-main)] mb-2">Descrição</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Freelance, Venda..."
                    className="w-full px-4 py-2 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all medieval-border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--color-text-main)] mb-2">Valor (R$)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    step="0.01"
                    className="w-full px-4 py-2 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all medieval-border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--color-text-main)] mb-2">Data de Vencimento</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all medieval-border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--color-text-main)] mb-2">Categoria</label>
                  <select
                    value={category_id}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-2 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all medieval-border"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories
                      .filter(c => c.flow_type === 'income')
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 p-3 bg-[var(--color-bg-dark)] rounded-xl border border-[var(--color-border)] medieval-border">
                  <input
                    type="checkbox"
                    id="recurring-receivable"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="recurring-receivable" className="flex-1 text-sm font-bold text-[var(--color-text-main)] cursor-pointer">
                    É recorrente?
                  </label>
                </div>

                {isRecurring && (
                  <div>
                    <label className="block text-sm font-bold text-[var(--color-text-main)] mb-2">Frequência</label>
                    <select
                      value={recurrenceRule}
                      onChange={(e) => setRecurrenceRule(e.target.value)}
                      className="w-full px-4 py-2 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all medieval-border"
                    >
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensal</option>
                      <option value="quarterly">Trimestral</option>
                      <option value="yearly">Anual</option>
                    </select>
                  </div>
                )}

                <button
                  onClick={handleAddReceivable}
                  disabled={!description || !amount || !dueDate}
                  className="w-full py-3 bg-emerald-500 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all active:scale-95 medieval-border medieval-glow"
                >
                  Registrar Receita
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Cartões de Crédito */}
      <AnimatePresence>
        {activeModal === 'cards' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setActiveModal(null);
                resetForm();
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[var(--color-bg-panel)] rounded-2xl shadow-2xl overflow-hidden medieval-border"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
                <div>
                  <h3 className="text-xl medieval-title font-bold text-[var(--color-text-main)]">Novo Cartão</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">Registre um cartão de crédito</p>
                </div>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    resetForm();
                  }}
                  className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-dark)] rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--color-text-main)] mb-2">Nome do Cartão</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Ex: Nubank, Itaú..."
                    className="w-full px-4 py-2 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all medieval-border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--color-text-main)] mb-2">Limite (R$)</label>
                  <input
                    type="number"
                    value={cardLimit}
                    onChange={(e) => setCardLimit(e.target.value)}
                    placeholder="0,00"
                    step="0.01"
                    className="w-full px-4 py-2 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all medieval-border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--color-text-main)] mb-2">Dia da Fatura</label>
                  <input
                    type="number"
                    value={closingDay}
                    onChange={(e) => setClosingDay(e.target.value)}
                    placeholder="Ex: 10"
                    min="1"
                    max="31"
                    className="w-full px-4 py-2 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all medieval-border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--color-text-main)] mb-2">Dia do Vencimento</label>
                  <input
                    type="number"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    placeholder="Ex: 20"
                    min="1"
                    max="31"
                    className="w-full px-4 py-2 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all medieval-border"
                  />
                </div>

                <button
                  onClick={handleAddCard}
                  disabled={!cardName || !cardLimit || !closingDay || !dueDay}
                  className="w-full py-3 bg-purple-500 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all active:scale-95 medieval-border medieval-glow"
                >
                  Criar Cartão
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Transação */}
      <AnimatePresence>
        {activeModal === 'transaction' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setActiveModal(null);
                resetForm();
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[var(--color-bg-panel)] rounded-2xl shadow-2xl overflow-hidden medieval-border"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
                <div>
                  <h3 className="text-xl medieval-title font-bold text-[var(--color-text-main)]">Nova Transação</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">Registre uma receita ou despesa</p>
                </div>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    resetForm();
                  }}
                  className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-dark)] rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <div className="p-6 space-y-4">
                <div className="flex gap-2">
                  {['income', 'expense'].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setTransactionType(type as 'income' | 'expense');
                        setTransactionCategory('');
                      }}
                      className={`flex-1 py-2 px-4 rounded-lg font-bold transition-all text-sm medieval-border ${transactionType === type
                          ? type === 'income'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-red-500 text-white'
                          : 'bg-[var(--color-bg-dark)] text-[var(--color-text-main)] border border-[var(--color-border)]'
                        }`}
                    >
                      {type === 'income' ? 'Receita' : 'Despesa'}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--color-text-main)] mb-2">Descrição</label>
                  <input
                    type="text"
                    value={transactionDescription}
                    onChange={(e) => setTransactionDescription(e.target.value)}
                    placeholder="Ex: Venda, Pagamento..."
                    className="w-full px-4 py-2 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all medieval-border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--color-text-main)] mb-2">Categoria</label>
                  <select
                    value={transactionCategory}
                    onChange={(e) => setTransactionCategory(e.target.value)}
                    className="w-full px-4 py-2 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all medieval-border"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories
                      .filter(c => c.flow_type === transactionType)
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--color-text-main)] mb-2">Valor (R$)</label>
                  <input
                    type="number"
                    value={transactionAmount}
                    onChange={(e) => setTransactionAmount(e.target.value)}
                    placeholder="0,00"
                    step="0.01"
                    className="w-full px-4 py-2 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all medieval-border"
                  />
                </div>

                <button
                  onClick={handleAddTransaction}
                  disabled={!transactionAmount || !transactionCategory}
                  className="w-full py-3 bg-[var(--color-primary)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-bg-dark)] font-bold rounded-xl transition-all active:scale-95 medieval-border medieval-glow"
                >
                  Registrar Transação
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Investimento */}
      <AnimatePresence>
        {activeModal === 'investment' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setActiveModal(null);
                resetForm();
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[var(--color-bg-panel)] rounded-2xl shadow-2xl overflow-hidden medieval-border"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
                <div>
                  <h3 className="text-xl medieval-title font-bold text-[var(--color-text-main)]">Novo Investimento</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">Registre uma compra de investimento</p>
                </div>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    resetForm();
                  }}
                  className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-dark)] rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--color-text-main)] mb-2">Tipo FACERO</label>
                  <select
                    value={investmentType}
                    onChange={(e) => setInvestmentType(e.target.value)}
                    className="w-full px-4 py-2 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all medieval-border"
                  >
                    <option value="F">F - Fundos Imobiliários</option>
                    <option value="A">A - Ações</option>
                    <option value="C">C - Criptomoedas</option>
                    <option value="E">E - Exterior</option>
                    <option value="R">R - Renda Fixa</option>
                    <option value="O">O - Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--color-text-main)] mb-2">Ticker/Símbolo</label>
                  <input
                    type="text"
                    value={investmentTicker}
                    onChange={(e) => setInvestmentTicker(e.target.value)}
                    placeholder="Ex: HGLG11, PETR4..."
                    className="w-full px-4 py-2 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all medieval-border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--color-text-main)] mb-2">Valor Unitário (R$)</label>
                  <input
                    type="number"
                    value={investmentValue}
                    onChange={(e) => setInvestmentValue(e.target.value)}
                    placeholder="0,00"
                    step="0.01"
                    className="w-full px-4 py-2 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all medieval-border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--color-text-main)] mb-2">Quantidade</label>
                  <input
                    type="number"
                    value={investmentQuantity}
                    onChange={(e) => setInvestmentQuantity(e.target.value)}
                    placeholder="0"
                    step="0.01"
                    className="w-full px-4 py-2 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all medieval-border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--color-text-main)] mb-2">Data da Compra</label>
                  <input
                    type="date"
                    value={investmentDate}
                    onChange={(e) => setInvestmentDate(e.target.value)}
                    className="w-full px-4 py-2 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all medieval-border"
                  />
                </div>

                <button
                  onClick={handleAddInvestment}
                  disabled={!investmentTicker || !investmentValue || !investmentQuantity}
                  className="w-full py-3 bg-blue-500 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all active:scale-95 medieval-border medieval-glow"
                >
                  Registrar Investimento
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
