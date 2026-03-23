import { motion } from 'motion/react';
import { useAccountsPayable } from '@/hooks/useAccountsPayable';
import { useAccountsReceivable } from '@/hooks/useAccountsReceivable';
import { useCreditCardInvoices } from '@/hooks/useCreditCardInvoices';
import { useKingdom } from '@/hooks/useKingdom';
import { formatCurrency, cn, getColorClass } from '@/lib/utils';
import { Calendar, ArrowUpRight, ArrowDownRight, CreditCard, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

import Link from 'next/link';

interface QuestItem {
  id: string;
  type: 'payable' | 'receivable' | 'invoice';
  title: string;
  amount: number;
  dueDate?: string;
  status?: string;
  originalData: any;
}

export function ActiveQuestsBoard() {
  const { payables, payPayable } = useAccountsPayable();
  const { receivables, receiveReceivable } = useAccountsReceivable();
  const { invoices, payInvoice } = useCreditCardInvoices();
  const { addTransaction } = useKingdom();

  const [activeTab, setActiveTab] = useState<'all' | 'payable' | 'receivable' | 'invoice'>('all');
  const [isCompleting, setIsCompleting] = useState<string | null>(null);

  // Combine and sort all active quests
  const allQuests: QuestItem[] = [
    ...payables
      .filter(p => p.status === 'pendente' || p.status === 'atrasado')
      .map(p => ({
        id: `p_${p.id}`,
        type: 'payable' as const,
        title: p.description,
        amount: p.amount,
        dueDate: p.due_date || p.dueDate,
        status: p.status || 'pendente',
        originalData: p
      })),
    ...receivables
      .filter(r => r.status === 'pendente' || r.status === 'inadimplente' || r.status === 'atrasado')
      .map(r => ({
        id: `r_${r.id}`,
        type: 'receivable' as const,
        title: r.description,
        amount: r.amount,
        dueDate: r.due_date || r.dueDate,
        status: r.status || 'pendente',
        originalData: r
      })),
    ...invoices
      .filter(i => i.status === 'open' || i.status === 'overdue')
      .map(i => ({
        id: `i_${i.id}`,
        type: 'invoice' as const,
        title: `Fatura Cartão`,
        amount: i.total_amount,
        dueDate: i.dueDate,
        status: i.status === 'overdue' ? 'atrasado' : (i.status || 'open'),
        originalData: i
      }))
  ].sort((a, b) => {
    const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return dateA - dateB;
  });

  const filteredQuests = allQuests.filter(q => activeTab === 'all' || q.type === activeTab);
  const activeQuests = filteredQuests.slice(0, 10);

  const handleCompleteQuest = async (quest: QuestItem) => {
    if (isCompleting || quest.status === 'completed') return;
    setIsCompleting(quest.id);
    try {
      const now = new Date().toISOString();
      if (quest.type === 'payable') {
        await payPayable(quest.originalData.id, now);
        await addTransaction({
          userId: quest.originalData.userId,
          amount: quest.amount,
          type: 'expense',
          description: quest.title,
          category_id: quest.originalData.category_id || '',
          date: now
        });
      } else if (quest.type === 'receivable') {
        await receiveReceivable(quest.originalData.id, now);
        await addTransaction({
          userId: quest.originalData.userId,
          amount: quest.amount,
          type: 'income',
          description: quest.title,
          category_id: quest.originalData.category_id || '',
          date: now
        });
      } else if (quest.type === 'invoice') {
        await payInvoice(quest.originalData.id, now);
        await addTransaction({
          userId: quest.originalData.userId,
          amount: quest.amount,
          type: 'expense',
          description: quest.title,
          category_id: 'credit_card',
          date: now
        });
      }
    } catch (error: any) {
      console.error("Error completing quest:", error);
      alert(error.message || "Erro ao concluir quest.");
    } finally {
      setIsCompleting(null);
    }
  };

  const getDaysRemaining = (dueDate?: string) => {
    if (!dueDate) return 'Sem data';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `Atrasado há ${Math.abs(diffDays)} dias`;
    if (diffDays === 0) return 'Vence hoje';
    if (diffDays === 1) return 'Vence amanhã';
    return `Vence em ${diffDays} dias`;
  };

  if (activeQuests.length === 0) {
    return (
      <Link href="/attributes" className="block group">
        <div className="bg-[var(--color-bg-panel)] rounded-2xl p-6 border border-[var(--color-border)] shadow-sm text-center medieval-border group-hover:border-[var(--color-primary)] transition-all">
          <div className="w-12 h-12 bg-[var(--color-bg-dark)] rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <h3 className="text-lg medieval-title font-bold text-[var(--color-text-main)] mb-1">Todas as Quests Concluídas!</h3>
          <p className="text-sm text-[var(--color-text-muted)]">Você não tem obrigações financeiras próximas.</p>
          <p className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-widest mt-4 opacity-0 group-hover:opacity-100 transition-opacity">Gerenciar Recorrências →</p>
        </div>
      </Link>
    );
  }

  return (
    <div className="bg-[var(--color-bg-panel)] rounded-2xl p-6 border border-[var(--color-border)] shadow-sm space-y-6 medieval-border">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚔️</span>
            <h3 className="text-xl medieval-title font-bold text-[var(--color-text-main)]">Quests Ativas</h3>
          </div>
          <span className="text-xs font-medium bg-[var(--color-bg-dark)] text-[var(--color-text-muted)] px-2 py-1 rounded-full border border-[var(--color-border)]">
            {activeTab === 'all' ? 'Top 10' : `${activeQuests.length} filtradas`}
          </span>
        </div>

        {/* Tabs de Filtro */}
        <div className="flex bg-[var(--color-bg-dark)] p-1 rounded-xl overflow-x-auto no-scrollbar border border-[var(--color-border)]">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              "flex-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
              activeTab === 'all' ? "bg-[var(--color-bg-panel)] text-[var(--color-text-main)] shadow-sm border border-[var(--color-border)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
            )}
          >
            Todas
          </button>
          <button
            onClick={() => setActiveTab('payable')}
            className={cn(
              "flex-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
              activeTab === 'payable' ? "bg-[var(--color-bg-panel)] text-red-400 shadow-sm border border-[var(--color-border)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
            )}
          >
            Pagar
          </button>
          <button
            onClick={() => setActiveTab('receivable')}
            className={cn(
              "flex-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
              activeTab === 'receivable' ? "bg-[var(--color-bg-panel)] text-emerald-400 shadow-sm border border-[var(--color-border)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
            )}
          >
            Receber
          </button>
          <button
            onClick={() => setActiveTab('invoice')}
            className={cn(
              "flex-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
              activeTab === 'invoice' ? "bg-[var(--color-bg-panel)] text-purple-400 shadow-sm border border-[var(--color-border)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
            )}
          >
            Faturas
          </button>
        </div>
      </header>

      <div className="space-y-3">
        {activeQuests.map((quest, index) => {
          const isOverdue = quest.status === 'atrasado' || quest.status === 'inadimplente';
          const isReceivable = quest.type === 'receivable';
          
          return (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex items-center justify-between p-4 rounded-2xl border transition-all",
                isOverdue ? "bg-red-900/20 border-red-900/50" : "bg-[var(--color-bg-dark)]/50 border-[var(--color-border)] hover:border-[var(--color-primary)]"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-[var(--color-border)]",
                  isReceivable ? "bg-emerald-900/30 text-emerald-400" : 
                  quest.type === 'invoice' ? "bg-purple-900/30 text-purple-400" :
                  "bg-red-900/30 text-red-400"
                )}>
                  {isReceivable ? <ArrowDownRight className="w-5 h-5" /> : 
                   quest.type === 'invoice' ? <CreditCard className="w-5 h-5" /> :
                   <ArrowUpRight className="w-5 h-5" />}
                </div>
                
                <div>
                  <h4 className="text-sm font-bold text-[var(--color-text-main)]">{quest.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className={cn("w-3 h-3", isOverdue ? "text-red-400" : "text-[var(--color-text-muted)]")} />
                    <span className={cn(
                      "text-xs font-medium",
                      isOverdue ? "text-red-400" : "text-[var(--color-text-muted)]"
                    )}>
                      {getDaysRemaining(quest.dueDate)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-bold",
                    getColorClass(isReceivable ? quest.amount : -quest.amount)
                  )}>
                    {isReceivable ? '+' : '-'}{formatCurrency(quest.amount)}
                  </p>
                </div>
                
                <button
                  onClick={() => handleCompleteQuest(quest)}
                  disabled={isCompleting === quest.id}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 border border-[var(--color-border)]",
                    isCompleting === quest.id ? "opacity-50 cursor-not-allowed" : "",
                    isReceivable 
                      ? "bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-400" 
                      : "bg-[var(--color-bg-dark)] hover:bg-[var(--color-border)] text-[var(--color-text-main)]"
                  )}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
