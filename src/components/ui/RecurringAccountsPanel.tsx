import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAccountsPayable } from '@/hooks/useAccountsPayable';
import { useAccountsReceivable } from '@/hooks/useAccountsReceivable';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useCategories } from '@/hooks/useCategories';
import { formatCurrency, cn } from '@/lib/utils';
import { Plus, Trash2, Edit2, CreditCard, ArrowUpRight, ArrowDownRight, Calendar, Sparkles } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { useSearchParams } from 'next/navigation';

export function RecurringAccountsPanel() {
  const { payables, addPayable, deletePayable } = useAccountsPayable();
  const { receivables, addReceivable, deleteReceivable } = useAccountsReceivable();
  const { creditCards, addCreditCard, deleteCreditCard } = useCreditCards();
  const { categories } = useCategories();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<'payable' | 'receivable' | 'cards'>('payable');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'payable' || tab === 'receivable' || tab === 'cards') {
      setActiveTab(tab);
    }
  }, [searchParams]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Form states
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category_id, setCategoryId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState('monthly');
  const [cardLimit, setCardLimit] = useState('');
  const [closingDay, setClosingDay] = useState('');
  const [dueDay, setDueDay] = useState('');

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setDueDate('');
    setCategoryId('');
    setIsRecurring(false);
    setRecurrenceRule('monthly');
    setCardLimit('');
    setClosingDay('');
    setDueDay('');
    setIsAdding(false);
  };

  const handleSuggestCategory = async () => {
    if (!description) return;
    setIsSuggesting(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      
      const flowType = activeTab === 'payable' ? 'expense' : activeTab === 'receivable' ? 'income' : 'expense';
      const filteredCategories = categories.filter(c => c.flow_type === flowType);
      const categoryList = filteredCategories.map(c => `${c.id}: ${c.name}`).join('\n');
      
      const prompt = `
        Eu tenho um registro financeiro do tipo "${activeTab === 'payable' ? 'Conta a Pagar' : activeTab === 'receivable' ? 'Conta a Receber' : 'Cartão de Crédito'}" com a descrição: "${description}".
        O valor é: ${amount || cardLimit || 'desconhecido'}.
        
        Aqui está a lista de categorias disponíveis no meu sistema para este fluxo (${flowType}):
        ${categoryList}
        
        Com base na descrição, sugira o ID da categoria mais apropriada.
        Retorne APENAS um JSON com o formato: {"category_id": "ID_AQUI"}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category_id: { type: Type.STRING }
            },
            required: ["category_id"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      if (result.category_id) {
        setCategoryId(result.category_id);
      }
    } catch (error) {
      console.error("Error suggesting category:", error);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category_id) {
      alert("Por favor, selecione uma categoria.");
      return;
    }
    try {
      if (activeTab === 'payable') {
        await addPayable({
          description,
          amount: parseFloat(amount),
          dueDate,
          category_id: category_id,
          status: 'pendente',
          isRecurring,
          recurrenceRule: isRecurring ? recurrenceRule : undefined,
        });
      } else if (activeTab === 'receivable') {
        await addReceivable({
          description,
          amount: parseFloat(amount),
          dueDate,
          category_id: category_id,
          status: 'pendente',
          isRecurring,
          recurrenceRule: isRecurring ? recurrenceRule : undefined,
        });
      } else if (activeTab === 'cards') {
        await addCreditCard({
          name: description,
          limit: parseFloat(cardLimit),
          closing_day: parseInt(closingDay),
          due_day: parseInt(dueDay),
          category_id: category_id,
          kingdom_id: 'placeholder',
          created_at: new Date().toISOString(),
        });
      }
      resetForm();
    } catch (error) {
      console.error("Error adding item:", error);
      alert(error instanceof Error ? error.message : "Erro ao adicionar item.");
    }
  };

  // Group categories by rpg_group
  const flowType = activeTab === 'payable' ? 'expense' : activeTab === 'receivable' ? 'income' : 'expense';
  const filteredCategories = categories.filter(c => c.flow_type === flowType);
  const groupedCategories = filteredCategories.reduce((acc, cat) => {
    const group = cat.rpg_group || 'Outros';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(cat);
    return acc;
  }, {} as Record<string, typeof categories>);

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-display font-bold text-gray-900">Obrigações e Cartões</h3>
          <p className="text-sm text-gray-500">Gerencie contas a pagar, a receber e cartões de crédito.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-emerald-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar</span>
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100/50 rounded-2xl">
        <button
          onClick={() => setActiveTab('payable')}
          className={cn(
            "flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
            activeTab === 'payable' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <ArrowUpRight className="w-4 h-4" />
          A Pagar
        </button>
        <button
          onClick={() => setActiveTab('receivable')}
          className={cn(
            "flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
            activeTab === 'receivable' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <ArrowDownRight className="w-4 h-4" />
          A Receber
        </button>
        <button
          onClick={() => setActiveTab('cards')}
          className={cn(
            "flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
            activeTab === 'cards' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <CreditCard className="w-4 h-4" />
          Cartões
        </button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAdd}
            className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-4 overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {activeTab === 'cards' ? 'Nome do Cartão' : 'Descrição'}
                  </label>
                  <button
                    type="button"
                    onClick={handleSuggestCategory}
                    disabled={!description || isSuggesting}
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 px-2 py-1 rounded-lg transition-all",
                      (!description || isSuggesting) ? "text-gray-400 bg-gray-50 cursor-not-allowed" : "text-purple-600 bg-purple-50 hover:bg-purple-100"
                    )}
                  >
                    <Sparkles className="w-3 h-3" />
                    {isSuggesting ? '...' : 'Sugerir'}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder={activeTab === 'cards' ? 'Ex: Nubank' : 'Ex: Aluguel'}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Categoria RPG</label>
                <select
                  required
                  value={category_id}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="" disabled>Selecione...</option>
                  {Object.entries(groupedCategories).map(([groupName, cats]) => (
                    <optgroup key={groupName} label={groupName}>
                      {cats.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {activeTab !== 'cards' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Valor</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="0.00"
                  />
                </div>
              )}

              {activeTab !== 'cards' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Data de Vencimento</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              )}

              {activeTab === 'cards' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Limite</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={cardLimit}
                      onChange={(e) => setCardLimit(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Dia de Fechamento</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="31"
                      value={closingDay}
                      onChange={(e) => setClosingDay(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Ex: 5"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Dia de Vencimento</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="31"
                      value={dueDay}
                      onChange={(e) => setDueDay(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Ex: 12"
                    />
                  </div>
                </>
              )}

              {activeTab !== 'cards' && (
                <div className="sm:col-span-2 flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="rounded text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-gray-700">É recorrente?</span>
                  </label>
                  
                  {isRecurring && (
                    <select
                      value={recurrenceRule}
                      onChange={(e) => setRecurrenceRule(e.target.value)}
                      className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="monthly">Mensal</option>
                      <option value="weekly">Semanal</option>
                      <option value="yearly">Anual</option>
                    </select>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-colors"
              >
                Salvar
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Lists */}
      <div className="space-y-3">
        {activeTab === 'payable' && payables.map(item => (
          <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">{item.description}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">Vence: {item.dueDate ? new Date(item.dueDate).toLocaleDateString('pt-BR') : 'Sem data'}</span>
                  {item.isRecurring && <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full uppercase font-bold">{item.recurrenceRule}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm font-bold text-gray-900">{formatCurrency(item.amount)}</p>
              <button onClick={() => deletePayable(item.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {activeTab === 'receivable' && receivables.map(item => (
          <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">{item.description}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">Vence: {item.dueDate ? new Date(item.dueDate).toLocaleDateString('pt-BR') : 'Sem data'}</span>
                  {item.isRecurring && <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full uppercase font-bold">{item.recurrenceRule}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm font-bold text-emerald-600">+{formatCurrency(item.amount)}</p>
              <button onClick={() => deleteReceivable(item.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {activeTab === 'cards' && creditCards.map(item => (
          <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">{item.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">Vence dia {item.due_day} | Fecha dia {item.closing_day}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Limite</p>
                <p className="text-sm font-bold text-gray-900">{formatCurrency(item.limit || 0)}</p>
              </div>
              <button onClick={() => deleteCreditCard(item.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {((activeTab === 'payable' && payables.length === 0) || 
          (activeTab === 'receivable' && receivables.length === 0) || 
          (activeTab === 'cards' && creditCards.length === 0)) && !isAdding && (
          <div className="text-center py-8 text-gray-500 text-sm">
            Nenhum registro encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
