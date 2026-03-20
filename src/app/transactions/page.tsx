/**
 * Página de Transações (Quests): Exibe o histórico de receitas, despesas e investimentos.
 * Permite filtrar por tipo e adicionar novas transações.
 * No modo Reino (multiplayer), exibe o nome do usuário que realizou a transação.
 */
'use client';

import { Suspense, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useSearchParams } from 'next/navigation';
import { Search, Filter, ArrowUpRight, ArrowDownLeft, Wallet, Plus, Sparkles, Edit2, Trash2, Upload } from 'lucide-react';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { Modal } from '@/components/ui/Modal';
import { ImportModal } from '@/components/ui/ImportModal';
import { formatCurrency, cn } from '@/lib/utils';
import { Transaction } from '@/types';

import { useTheme } from '@/lib/ThemeContext';
import { THEMES } from '@/lib/themes';
import { useKingdom } from '@/hooks/useKingdom';
import { useCategories } from '@/hooks/useCategories';
import { GoogleGenAI, Type } from '@google/genai';
import { financialEngine } from '@/lib/financialEngine';

function TransactionsContent() {
  const { theme, user, gameMode } = useTheme();
  const colors = THEMES[theme] || THEMES.default;
  const { transactions, addTransaction, updateTransaction, deleteTransaction, addInvestment, loading: transactionsLoading } = useKingdom();
  const { categories, loading: categoriesLoading } = useCategories();
  
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const [filter, setFilter] = useState<'all' | 'income' | 'expense' | 'investment'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const search = searchParams.get('search');
    if (search) {
      setSearchTerm(search);
    }
    const openModal = searchParams.get('openModal');
    if (openModal === 'true') {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

  // Estado para o formulário de nova transação
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense' | 'investment',
    category_id: '',
    faceroType: 'F',
    ticker: '',
    quantity: '',
    operation_date: new Date().toISOString().split('T')[0]
  });

  if (transactionsLoading || categoriesLoading) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", colors.bg)}>
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 font-medium">Carregando Quests...</p>
        </div>
      </div>
    );
  }

  const handleEditTransaction = (t: Transaction) => {
    setEditingTransactionId(t.id);
    setNewTransaction({
      description: t.description || '',
      amount: t.amount.toString(),
      type: t.type,
      category_id: t.category_id || '',
      faceroType: t.investment_category_id || 'F',
      ticker: '',
      quantity: '',
      operation_date: t.date ? t.date.split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
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
    if (!newTransaction.amount || !user) return;

    if (newTransaction.type === 'investment') {
      if (!newTransaction.ticker || !newTransaction.quantity || !newTransaction.faceroType) return;
      
      try {
        await addInvestment({
          type: newTransaction.faceroType,
          ticker: newTransaction.ticker,
          value: parseFloat(newTransaction.amount),
          quantity: parseFloat(newTransaction.quantity),
          operation_date: newTransaction.operation_date
        });
        setIsModalOpen(false);
        setEditingTransactionId(null);
        setNewTransaction({ description: '', amount: '', type: 'expense', category_id: '', faceroType: 'F', ticker: '', quantity: '', operation_date: new Date().toISOString().split('T')[0] });
      } catch (error) {
        console.error("Error saving investment: ", error);
      }
      return;
    }

    if (!newTransaction.description || !newTransaction.category_id) return;

    const dateStr = new Date().toISOString(); // Pass full ISO string to keep time

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
      setNewTransaction({ description: '', amount: '', type: 'expense', category_id: '', faceroType: 'F', ticker: '', quantity: '', operation_date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      console.error("Error saving transaction: ", error);
    }
  };

  const handleImportTransactions = async (data: any[]) => {
    for (const item of data) {
      // expected headers: type, amount, description, category_id, date
      await addTransaction({
        type: item.type.toLowerCase() as any,
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

  // Group categories by rpg_group for the select dropdown
  const profileType = gameMode === 'reino' ? 'MultiUsuario' : 'MonoUsuario';
  const categoriesByType = categories.filter(c => 
    (c.flow_type === newTransaction.type || newTransaction.type === 'investment') &&
    (!c.allowed_profiles || c.allowed_profiles.includes(profileType))
  );
  const groupedCategories = categoriesByType.reduce((acc, cat) => {
    const group = cat.rpg_group || 'Outros';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(cat);
    return acc;
  }, {} as Record<string, typeof categories>);

  const { income: totalActualIncome, expense: totalActualExpenses, investment: totalActualInvestments } = financialEngine.calculateMonthlySummary(transactions as any, month, year);
  
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
    <div className={cn("min-h-screen transition-colors duration-500", colors.bg)}>
      <Header />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-32">
        <header className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900">Quests</h2>
              <p className="text-sm text-gray-500">Suas missões e histórico de transações</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsImportModalOpen(true)}
                className="px-4 h-10 rounded-xl flex items-center gap-2 bg-white border border-gray-200 text-gray-700 shadow-sm font-bold text-sm transition-transform active:scale-95 hover:bg-gray-50"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Importar</span>
              </button>
              <button 
                onClick={() => setIsModalOpen(true)}
                className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform active:scale-95", colors.primary)}
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Month/Year Filter */}
          <div className="flex items-center justify-between bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
            <button onClick={handlePrevMonth} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
              <ArrowDownLeft className="w-5 h-5 rotate-45" />
            </button>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-900">{monthNames[month - 1]}</p>
              <p className="text-xs text-gray-500">{year}</p>
            </div>
            <button onClick={handleNextMonth} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
              <ArrowUpRight className="w-5 h-5 rotate-45" />
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
              <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Saldo para o Inventário</p>
              <h3 className="text-3xl font-display font-bold">{formatCurrency(surplus)}</h3>
            </div>
            <p className="text-white/60 text-xs max-w-[200px]">
              Este é o valor disponível para ser investido no Inventário este mês.
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
              let categoryName = categoryObj ? categoryObj.name : 'Sem Categoria';
              
              if (t.type === 'investment' && t.category_id === 'investment') {
                categoryName = 'Aporte em Investimento';
              }
              
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
                      {categoryName} • {new Date((t as any).created_at || t.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {` • Por: ${userName}`}
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
          setNewTransaction({ description: '', amount: '', type: 'expense', category_id: '', faceroType: 'F', ticker: '', quantity: '', operation_date: new Date().toISOString().split('T')[0] });
        }} 
        title={editingTransactionId ? "Editar Transação" : "Nova Transação"}
      >
        <div className="space-y-4">
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

          {newTransaction.type === 'investment' ? (
            <>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Categoria F.A.C.E.R.O.</label>
                <select 
                  value={newTransaction.faceroType}
                  onChange={(e) => setNewTransaction({...newTransaction, faceroType: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                >
                  <option value="F">Fundo Imobiliário</option>
                  <option value="A">Ações</option>
                  <option value="C">Cripto</option>
                  <option value="E">Exterior / ETFs</option>
                  <option value="R">Renda Fixa</option>
                  <option value="O">Outros investimentos / Oportunidades</option>
                </select>
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Ativo / Ticker</label>
                <input 
                  type="text"
                  placeholder="Ex: MXRF11, PETR4, BTC"
                  value={newTransaction.ticker}
                  onChange={(e) => setNewTransaction({...newTransaction, ticker: e.target.value})}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Quantidade</label>
                  <input 
                    type="number"
                    step="0.00000001"
                    placeholder="0.00"
                    value={newTransaction.quantity}
                    onChange={(e) => setNewTransaction({...newTransaction, quantity: e.target.value})}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Data Operação</label>
                  <input 
                    type="date"
                    value={newTransaction.operation_date}
                    onChange={(e) => setNewTransaction({...newTransaction, operation_date: e.target.value})}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Valor Total (R$)</label>
            <input 
              type="number"
              placeholder="0,00"
              value={newTransaction.amount}
              onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          <button 
            onClick={handleAddTransaction}
            disabled={
              newTransaction.type === 'investment' 
                ? (!newTransaction.ticker || !newTransaction.quantity || !newTransaction.amount)
                : (!newTransaction.description || !newTransaction.amount || !newTransaction.category_id)
            }
            className={cn(
              "w-full py-4 rounded-2xl text-white font-bold shadow-lg transition-all active:scale-95 mt-4", 
              (newTransaction.type === 'investment' 
                ? (!newTransaction.ticker || !newTransaction.quantity || !newTransaction.amount)
                : (!newTransaction.description || !newTransaction.amount || !newTransaction.category_id)) 
                ? "opacity-50 cursor-not-allowed" : colors.primary
            )}
          >
            Confirmar Transação
          </button>
        </div>
      </Modal>

      <ImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportTransactions}
        title="Importar Transações"
        template={['type', 'amount', 'description', 'category_id', 'date']}
      />
      
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-200 mt-[400px] pointer-events-auto max-w-md">
            <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Instruções de Importação:</p>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              O arquivo deve ser um CSV com os seguintes cabeçalhos: <strong>type</strong> (income/expense), <strong>amount</strong> (valor), <strong>description</strong> (descrição), <strong>category_id</strong> (ID da categoria) e <strong>date</strong> (YYYY-MM-DD).
            </p>
          </div>
        </div>
      )}

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Excluir Transação">
        <div className="space-y-6">
          <p className="text-gray-600 text-sm">Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.</p>
          <div className="flex gap-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-700 font-bold transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDeleteTransaction}
              className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-bold transition-all active:scale-95"
            >
              Excluir
            </button>
          </div>
        </div>
      </Modal>

      </main>
      <BottomNav />
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
