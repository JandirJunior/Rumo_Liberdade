import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useKingdom } from '@/hooks/useKingdom';
import { formatCurrency, cn, getColorClass } from '@/lib/utils';
import { Plus, Trash2, Edit2, CreditCard, ArrowUpRight, ArrowDownRight, Calendar, User } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useActionContext } from '@/context/ActionContext';

export function RecurringAccountsPanel() {
  const { payables, receivables, creditCards, categories, deletePayable, deleteReceivable, deleteCreditCard } = useKingdom();
  const searchParams = useSearchParams();
  const { openAction } = useActionContext();
  const tabFromUrl = searchParams.get('tab');
  const initialTab = (tabFromUrl === 'payable' || tabFromUrl === 'receivable' || tabFromUrl === 'cards') ? tabFromUrl : 'payable';
  const [activeTab, setActiveTab] = useState<'payable' | 'receivable' | 'cards'>(initialTab);

  const getCategoryName = (item: any) => {
    if (item.categoryName) return item.categoryName;
    const cat = categories.find(c => c.id === item.category_id);
    return cat ? cat.name : (item.category_id || 'Categoria');
  };

  // Sincronizar aba com a URL durante a renderização (padrão recomendado pelo React para sincronização de estado)
  const tab = searchParams.get('tab');
  if ((tab === 'payable' || tab === 'receivable' || tab === 'cards') && tab !== activeTab) {
    setActiveTab(tab);
  }

  const handleAdd = () => {
    if (activeTab === 'payable') {
      openAction('contas_pagar');
    } else if (activeTab === 'receivable') {
      openAction('contas_receber');
    } else if (activeTab === 'cards') {
      openAction('fatura');
    }
  };

  const handleEditPayable = (item: any) => {
    openAction('contas_pagar', {
      id: item.id,
      descricao: item.description,
      valorTotal: Math.abs(item.amount),
      dataVencimento: item.dueDate,
      categoria: item.category_id,
      recorrente: item.isRecurring,
      tipoRecorrencia: item.recurrenceRule,
    });
  };

  const handleEditReceivable = (item: any) => {
    openAction('contas_receber', {
      id: item.id,
      descricao: item.description,
      valorTotal: Math.abs(item.amount),
      dataVencimento: item.dueDate,
      categoria: item.category_id,
      recorrente: item.isRecurring,
      tipoRecorrencia: item.recurrenceRule,
    });
  };

  const handleEditCard = (item: any) => {
    openAction('fatura', {
      id: item.id,
      descricao: item.name,
      limite: item.limit,
      diaFatura: item.closing_day,
      diaVencimento: item.due_day,
      categoria: item.category_id,
    });
  };

  return (
    <div className="bg-[var(--color-bg-dark)] rounded-3xl p-6 border border-[var(--color-border)] shadow-sm space-y-6 medieval-border">
      <header className="flex items-center justify-between">
        <div>
          <h3 className="text-xl medieval-title font-bold text-[var(--color-text-main)]">Obrigações e Cartões</h3>
          <p className="text-sm text-[var(--color-text-muted)]">Gerencie contas a pagar, a receber e cartões de crédito.</p>
        </div>
        <button
          onClick={handleAdd}
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
                  <span className="text-xs text-[var(--color-text-muted)]">• {getCategoryName(item)}</span>
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
              <button onClick={() => handleEditPayable(item)} className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
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
                  <span className="text-xs text-[var(--color-text-muted)]">• {getCategoryName(item)}</span>
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
              <button onClick={() => handleEditReceivable(item)} className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
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
                  <span className="text-xs text-[var(--color-text-muted)]">• {getCategoryName(item)}</span>
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 text-[var(--color-text-muted)]" />
                    <span className="text-xs text-[var(--color-text-muted)]">{item.userName || item.created_by || 'Desconhecido'}</span>
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
              <button onClick={() => handleEditCard(item)} className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => deleteCreditCard(item.id)} className="p-2 text-[var(--color-text-muted)] hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {((activeTab === 'payable' && payables.length === 0) || 
          (activeTab === 'receivable' && receivables.length === 0) || 
          (activeTab === 'cards' && creditCards.length === 0)) && (
          <div className="text-center py-8 text-[var(--color-text-muted)] text-sm">
            Nenhum registro encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
