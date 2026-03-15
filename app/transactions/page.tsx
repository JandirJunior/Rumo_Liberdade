/**
 * Página de Transações (Quests): Exibe o histórico de receitas, despesas e investimentos.
 * Permite filtrar por tipo e adicionar novas transações.
 * No modo Reino (multiplayer), exibe o nome do usuário que realizou a transação.
 */
'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, ArrowUpRight, ArrowDownLeft, Wallet, Plus, Sparkles, Edit2, Trash2 } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Header } from '@/components/Header';
import { Modal } from '@/components/Modal';
import { formatCurrency, cn } from '@/lib/utils';
import { Transaction } from '@/lib/types';

import { useTheme } from '@/lib/ThemeContext';
import { THEMES } from '@/lib/themes';
import { useReino } from '@/hooks/useReino';
import { useCategories } from '@/hooks/useCategories';
import { GoogleGenAI, Type } from '@google/genai';

export default function Transactions() {
  const { theme, user, gameMode } = useTheme();
  const colors = THEMES[theme] || THEMES.default;
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useReino();
  const { categories } = useCategories();
  
  const [filter, setFilter] = useState<'all' | 'income' | 'expense' | 'investment'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

  // Estado para o formulário de nova transação
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense' | 'investment',
    category_id: ''
  });

  const handleEditTransaction = (t: Transaction) => {
    setEditingTransactionId(t.id);
    setNewTransaction({
      description: t.description || t.title || '',
      amount: t.amount.toString(),
      type: t.type,
      category_id: t.category_id || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      await deleteTransaction(id);
    }
  };

  const handleSuggestCategory = async () => {
    if (!newTransaction.description) return;
    setIsSuggesting(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      
      const categoryList = categories.map(c => `${c.id}: ${c.name} (${c.flow_type === 'income' ? 'Receita' : 'Despesa'})`).join('\n');
      
      const prompt = `
        Eu tenho uma transação com a seguinte descrição: "${newTransaction.description}".
        O valor é: ${newTransaction.amount || 'desconhecido'}.
        
        Aqui está a lista de categorias disponíveis no meu sistema:
        ${categoryList}
        
        Com base na descrição, sugira o ID da categoria mais apropriada e o tipo da transação (income, expense, ou investment).
        Retorne APENAS um JSON com o formato: {"category_id": "ID_AQUI", "type": "TIPO_AQUI"}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category_id: { type: Type.STRING },
              type: { type: Type.STRING }
            },
            required: ["category_id", "type"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      if (result.category_id && result.type) {
        setNewTransaction(prev => ({
          ...prev,
          category_id: result.category_id,
          type: result.type as any
        }));
      }
    } catch (error) {
      console.error("Error suggesting category:", error);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleAddTransaction = async () => {
    if (!newTransaction.description || !newTransaction.amount || !user || !newTransaction.category_id) return;

    const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const transactionData = {
      description: newTransaction.description,
      amount: parseFloat(newTransaction.amount),
      type: newTransaction.type,
      category_id: newTransaction.category_id,
      date: dateStr,
    };

    try {
      if (editingTransactionId) {
        await updateTransaction(editingTransactionId, transactionData);
      } else {
        await addTransaction(transactionData);
      }
      setIsModalOpen(false);
      setEditingTransactionId(null);
      setNewTransaction({ description: '', amount: '', type: 'expense', category_id: '' });
    } catch (error) {
      console.error("Error saving transaction: ", error);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesFilter = filter === 'all' || t.type === filter;
    const matchesSearch = (t.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Group categories by rpg_group for the select dropdown
  const profileType = gameMode === 'reino' ? 'MultiUsuario' : 'MonoUsuario';
  const categoriesByType = categories.filter(c => 
    (c.flow_type === newTransaction.type || newTransaction.type === 'investment') &&
    (!c.allowed_profiles || c.allowed_profiles.includes(profileType))
  );
  const groupedCategories = categoriesByType.reduce((acc, cat) => {
    if (!acc[cat.rpg_group]) {
      acc[cat.rpg_group] = [];
    }
    acc[cat.rpg_group].push(cat);
    return acc;
  }, {} as Record<string, typeof categories>);

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
              const categoryObj = categories.find(c => c.id === t.category_id);
              const categoryName = categoryObj ? categoryObj.name : t.category || 'Sem Categoria';
              
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 p-4 bg-white border border-gray-50 rounded-2xl shadow-sm hover:shadow-md transition-shadow group"
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
                      {categoryName} • {t.date}
                      {gameMode === 'reino' && ` • Por: ${userName}`}
                    </p>
                  </div>
                  
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className={cn(
                      "text-sm font-bold",
                      t.type === 'income' ? "text-emerald-600" : "text-gray-900"
                    )}>
                      {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                    </p>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditTransaction(t)} className="text-gray-400 hover:text-blue-500 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteTransaction(t.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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

      {/* Modal para Adicionar/Editar Transação */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransactionId(null);
          setNewTransaction({ description: '', amount: '', type: 'expense', category_id: '' });
        }} 
        title={editingTransactionId ? "Editar Transação" : "Nova Transação"}
      >
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Descrição</label>
              <button
                onClick={handleSuggestCategory}
                disabled={!newTransaction.description || isSuggesting}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 px-2 py-1 rounded-lg transition-all",
                  (!newTransaction.description || isSuggesting) ? "text-gray-400 bg-gray-50 cursor-not-allowed" : "text-purple-600 bg-purple-50 hover:bg-purple-100"
                )}
              >
                <Sparkles className="w-3 h-3" />
                {isSuggesting ? 'Analisando...' : 'Sugerir Categoria'}
              </button>
            </div>
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
                  onClick={() => setNewTransaction({...newTransaction, type, category_id: ''})}
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
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Categoria RPG</label>
            <select
              value={newTransaction.category_id}
              onChange={(e) => setNewTransaction({...newTransaction, category_id: e.target.value})}
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
            >
              <option value="" disabled>Selecione uma categoria...</option>
              {Object.entries(groupedCategories).map(([groupName, cats]) => (
                <optgroup key={groupName} label={groupName}>
                  {cats.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <button 
            onClick={handleAddTransaction}
            disabled={!newTransaction.description || !newTransaction.amount || !newTransaction.category_id}
            className={cn(
              "w-full py-4 rounded-2xl text-white font-bold shadow-lg transition-all active:scale-95 mt-4", 
              (!newTransaction.description || !newTransaction.amount || !newTransaction.category_id) ? "opacity-50 cursor-not-allowed" : colors.primary
            )}
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
