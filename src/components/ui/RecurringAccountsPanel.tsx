import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAccountsPayable } from '@/hooks/useAccountsPayable';
import { useAccountsReceivable } from '@/hooks/useAccountsReceivable';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useCategories } from '@/hooks/useCategories';
import { formatCurrency, cn, getColorClass } from '@/lib/utils';
import { Plus, Trash2, Edit2, CreditCard, ArrowUpRight, ArrowDownRight, Calendar, Sparkles, User } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { useSearchParams } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';

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
    <div className="bg-[var(--color-bg-dark)] rounded-3xl p-6 border border-[var(--color-border)] shadow-sm space-y-6 medieval-border">
      <header className="flex items-center justify-between">
        <div>
          <h3 className="text-xl medieval-title font-bold text-[var(--color-text-main)]">Obrigações e Cartões</h3>
          <p className="text-sm text-[var(--color-text-muted)]">Gerencie contas a pagar, a receber e cartões de crédito.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-[var(--color-bg-dark)] rounded-xl text-sm font-bold shadow-sm hover:brightness-110 transition-colors medieval-glow"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar</span>
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-[var(--color-bg-panel)] rounded-2xl border border-[var(--color-border)]">
        <button
          onClick={() => setActiveTab('payable')}
          className={cn(
            "flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
            activeTab === 'payable' ? "bg-[var(--color-bg-dark)] text-[var(--color-text-main)] shadow-sm border border-[var(--color-border)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
          )}
        >
          <ArrowUpRight className="w-4 h-4" />
          A Pagar
        </button>
        <button
          onClick={() => setActiveTab('receivable')}
          className={cn(
            "flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
            activeTab === 'receivable' ? "bg-[var(--color-bg-dark)] text-[var(--color-text-main)] shadow-sm border border-[var(--color-border)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
          )}
        >
          <ArrowDownRight className="w-4 h-4" />
          A Receber
        </button>
        <button
          onClick={() => setActiveTab('cards')}
          className={cn(
            "flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
            activeTab === 'cards' ? "bg-[var(--color-bg-dark)] text-[var(--color-text-main)] shadow-sm border border-[var(--color-border)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
          )}
        >
          <CreditCard className="w-4 h-4" />
          Cartões
        </button>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={isAdding}
        onClose={resetForm}
        title={`Adicionar ${activeTab === 'payable' ? 'Conta a Pagar' : activeTab === 'receivable' ? 'Conta a Receber' : 'Cartão de Crédito'}`}
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                  {activeTab === 'cards' ? 'Nome do Cartão' : 'Descrição'}
                </label>
                <button
                  type="button"
                  onClick={handleSuggestCategory}
                  disabled={!description || isSuggesting}
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 px-2 py-1 rounded-lg transition-all border",
                    (!description || isSuggesting) ? "text-[var(--color-text-muted)] bg-[var(--color-bg-dark)] border-[var(--color-border)] cursor-not-allowed" : "text-[var(--color-accent)] bg-[var(--color-bg-dark)] border-[var(--color-accent)] hover:brightness-110"
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
                onChange={(e) => setDescription(e.target.value.toUpperCase())}
                className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] text-[var(--color-text-main)] rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] uppercase"
                placeholder={activeTab === 'cards' ? 'Ex: Nubank' : 'Ex: Aluguel'}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Categoria RPG</label>
              <select
                required
                value={category_id}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] text-[var(--color-text-main)] rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
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
                <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Valor</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] text-[var(--color-text-main)] rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                  placeholder="0.00"
                />
              </div>
            )}

            {activeTab !== 'cards' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Data de Vencimento</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] text-[var(--color-text-main)] rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                />
              </div>
            )}

            {activeTab === 'cards' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Limite</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={cardLimit}
                    onChange={(e) => setCardLimit(e.target.value)}
                    className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] text-[var(--color-text-main)] rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Dia de Fechamento</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="31"
                    value={closingDay}
                    onChange={(e) => setClosingDay(e.target.value)}
                    className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] text-[var(--color-text-main)] rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                    placeholder="Ex: 5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Dia de Vencimento</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] text-[var(--color-text-main)] rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
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
                    className="rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] bg-[var(--color-bg-dark)] border-[var(--color-border)]"
                  />
                  <span className="text-sm font-medium text-[var(--color-text-main)]">É recorrente?</span>
                </label>
                
                {isRecurring && (
                  <select
                    value={recurrenceRule}
                    onChange={(e) => setRecurrenceRule(e.target.value)}
                    className="bg-[var(--color-bg-dark)] border border-[var(--color-border)] text-[var(--color-text-main)] rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
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
              className="px-4 py-2 text-sm font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-dark)] border border-transparent hover:border-[var(--color-border)] rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--color-primary)] text-[var(--color-bg-dark)] text-sm font-bold rounded-xl hover:brightness-110 transition-colors medieval-glow"
            >
              Salvar
            </button>
          </div>
        </form>
      </Modal>

      {/* Lists */}
      <div className="space-y-3">
        {activeTab === 'payable' && [...payables].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 10).map(item => (
          <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] hover:border-[var(--color-primary)] transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-950/30 text-red-500 border border-red-900/50 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--color-text-main)]">{item.description}</h4>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[var(--color-text-muted)]" />
                    <span className="text-xs text-[var(--color-text-muted)]">Vence: {item.dueDate ? new Date(item.dueDate).toLocaleDateString('pt-BR') : 'Sem data'}</span>
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)]">• {item.category_id || 'Categoria'}</span>
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 text-[var(--color-text-muted)]" />
                    <span className="text-xs text-[var(--color-text-muted)]">{item.userName || 'Desconhecido'}</span>
                  </div>
                  {item.isRecurring && <span className="text-[10px] bg-[var(--color-bg-dark)] border border-[var(--color-border)] text-[var(--color-text-muted)] px-2 py-0.5 rounded-full uppercase font-bold">{item.recurrenceRule}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className={cn("text-sm font-bold", getColorClass(-item.amount))}>
                -{formatCurrency(item.amount)}
              </p>
              <button onClick={() => deletePayable(item.id)} className="p-2 text-[var(--color-text-muted)] hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {activeTab === 'receivable' && [...receivables].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 10).map(item => (
          <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] hover:border-[var(--color-primary)] transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/30 text-emerald-500 border border-emerald-900/50 flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--color-text-main)]">{item.description}</h4>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[var(--color-text-muted)]" />
                    <span className="text-xs text-[var(--color-text-muted)]">Vence: {item.dueDate ? new Date(item.dueDate).toLocaleDateString('pt-BR') : 'Sem data'}</span>
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)]">• {item.category_id || 'Categoria'}</span>
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 text-[var(--color-text-muted)]" />
                    <span className="text-xs text-[var(--color-text-muted)]">{item.userName || 'Desconhecido'}</span>
                  </div>
                  {item.isRecurring && <span className="text-[10px] bg-[var(--color-bg-dark)] border border-[var(--color-border)] text-[var(--color-text-muted)] px-2 py-0.5 rounded-full uppercase font-bold">{item.recurrenceRule}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className={cn("text-sm font-bold", getColorClass(item.amount))}>
                +{formatCurrency(item.amount)}
              </p>
              <button onClick={() => deleteReceivable(item.id)} className="p-2 text-[var(--color-text-muted)] hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {activeTab === 'cards' && [...creditCards].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10).map(item => (
          <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] hover:border-[var(--color-primary)] transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-950/30 text-purple-500 border border-purple-900/50 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--color-text-main)]">{item.name}</h4>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                  <span className="text-xs text-[var(--color-text-muted)]">Vence dia {item.due_day} | Fecha dia {item.closing_day}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">• {item.category_id || 'Categoria'}</span>
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 text-[var(--color-text-muted)]" />
                    <span className="text-xs text-[var(--color-text-muted)]">{item.created_by || 'Desconhecido'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Limite</p>
                <p className={cn("text-sm font-bold", getColorClass(item.limit || 0))}>
                  {formatCurrency(item.limit || 0)}
                </p>
              </div>
              <button onClick={() => deleteCreditCard(item.id)} className="p-2 text-[var(--color-text-muted)] hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {((activeTab === 'payable' && payables.length === 0) || 
          (activeTab === 'receivable' && receivables.length === 0) || 
          (activeTab === 'cards' && creditCards.length === 0)) && !isAdding && (
          <div className="text-center py-8 text-[var(--color-text-muted)] text-sm">
            Nenhum registro encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
