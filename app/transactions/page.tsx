/**
 * Página de Transações (Quests): Exibe o histórico de receitas, despesas e investimentos.
 * Permite filtrar por tipo e adicionar novas transações.
 * No modo Reino (multiplayer), exibe o nome do usuário que realizou a transação.
 */
'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, ArrowUpRight, ArrowDownLeft, Wallet, Plus } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Header } from '@/components/Header';
import { Modal } from '@/components/Modal';
import { formatCurrency, cn } from '@/lib/utils';
import { Transaction } from '@/lib/types';

import { useTheme } from '@/lib/ThemeContext';
import { THEMES } from '@/lib/themes';
import { useReino } from '@/hooks/useReino';

export default function Transactions() {
  const { theme, user, gameMode } = useTheme();
  const colors = THEMES[theme] || THEMES.default;
  const { transactions, addTransaction } = useReino();
  const [filter, setFilter] = useState<'all' | 'income' | 'expense' | 'investment'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estado para o formulário de nova transação
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense' | 'investment',
    category: 'Fixed' as 'Fixed' | 'Lifestyle' | 'Investment' | 'Emergency'
  });

  const handleAddTransaction = async () => {
    if (!newTransaction.description || !newTransaction.amount || !user) return;

    const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const transactionData = {
      userId: user.uid, // <-- CORREÇÃO APLICADA AQUI
      description: newTransaction.description,
      amount: parseFloat(newTransaction.amount),
      type: newTransaction.type,
      category: newTransaction.category,
      date: dateStr,
    };

    try {
      await addTransaction(transactionData);
      setIsModalOpen(false);
      setNewTransaction({ description: '', amount: '', type: 'expense', category: 'Fixed' });
    } catch (error) {
      console.error("Error adding transaction: ", error);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesFilter = filter === 'all' || t.type === filter;
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className={cn("min-h-screen transition-colors duration-500", colors.bg)}>
      <Header />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-32">
        <header className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900">Quests</h2>
              <p className="text-sm text-gray-500">Suas missões e histórico de transações</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform active:scale-95", colors.primary)}
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        
        {/* Search and Filter */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar transação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {['all', 'income', 'expense', 'investment'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={cn(
                  "px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border",
                  filter === f 
                    ? cn(colors.primary, "text-white border-transparent shadow-lg", colors.shadow) 
                    : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"
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
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Transações</h4>
          <Filter className="w-4 h-4 text-gray-400" />
        </div>
        
        <div className="space-y-4">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((t, i) => {
              const userName = (t as any).userName || 'Herói Desconhecido';
              
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 p-4 bg-white border border-gray-50 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                    t.type === 'income' ? "bg-emerald-50 text-emerald-600" : 
                    t.type === 'expense' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                  )}>
                    {t.type === 'income' ? <ArrowUpRight className="w-6 h-6" /> : 
                     t.type === 'expense' ? <ArrowDownLeft className="w-6 h-6" /> : <Wallet className="w-6 h-6" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{t.description}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {t.category} • {t.date}
                      {gameMode === 'reino' && ` • Por: ${userName}`}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-bold",
                      t.type === 'income' ? "text-emerald-600" : "text-gray-900"
                    )}>
                      {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium">Confirmado</p>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">Nenhuma transação encontrada.</p>
            </div>
          )}
        </div>
      </section>

      {/* Modal para Adicionar Transação */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Nova Transação"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Descrição</label>
            <input 
              type="text"
              placeholder="Ex: Almoço, Salário, Aporte FII"
              value={newTransaction.description}
              onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Valor (R$)</label>
            <input 
              type="number"
              placeholder="0,00"
              value={newTransaction.amount}
              onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Tipo</label>
            <div className="grid grid-cols-3 gap-2">
              {(['income', 'expense', 'investment'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setNewTransaction({...newTransaction, type})}
                  className={cn(
                    "py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all",
                    newTransaction.type === type 
                      ? cn(colors.primary, "text-white border-transparent") 
                      : "bg-gray-50 text-gray-500 border-gray-100"
                  )}
                >
                  {type === 'income' ? 'Receita' : type === 'expense' ? 'Despesa' : 'Aporte'}
                </button>
              ))}
            </div>
          </div>
          <button 
            onClick={handleAddTransaction}
            className={cn("w-full py-4 rounded-2xl text-white font-bold shadow-lg transition-all active:scale-95 mt-4", colors.primary)}
          >
            Confirmar Transação
          </button>
        </div>
      </Modal>

      </main>
      <BottomNav />
    </div>
  );
}
