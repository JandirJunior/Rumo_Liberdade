import { motion } from 'motion/react';
import { useAccountsPayable } from '@/hooks/useAccountsPayable';
import { useAccountsReceivable } from '@/hooks/useAccountsReceivable';
import { useCreditCardInvoices } from '@/hooks/useCreditCardInvoices';
import { useReino } from '@/hooks/useReino';
import { formatCurrency, cn } from '@/lib/utils';
import { Calendar, ArrowUpRight, ArrowDownRight, CreditCard, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface QuestItem {
  id: string;
  type: 'payable' | 'receivable' | 'invoice';
  title: string;
  amount: number;
  dueDate: string;
  status: string;
  originalData: any;
}

export function ActiveQuestsBoard() {
  const { payables, updatePayable } = useAccountsPayable();
  const { receivables, updateReceivable } = useAccountsReceivable();
  const { invoices, updateInvoice } = useCreditCardInvoices();
  const { addTransaction } = useReino();
  const [isCompleting, setIsCompleting] = useState<string | null>(null);

  // Combine and sort all active quests
  const activeQuests: QuestItem[] = [
    ...payables
      .filter(p => p.status === 'pending' || p.status === 'overdue')
      .map(p => ({
        id: `p_${p.id}`,
        type: 'payable' as const,
        title: p.description,
        amount: p.amount,
        dueDate: p.dueDate,
        status: p.status,
        originalData: p
      })),
    ...receivables
      .filter(r => r.status === 'pending' || r.status === 'defaulted')
      .map(r => ({
        id: `r_${r.id}`,
        type: 'receivable' as const,
        title: r.description,
        amount: r.amount,
        dueDate: r.dueDate,
        status: r.status,
        originalData: r
      })),
    ...invoices
      .filter(i => i.status === 'open' || i.status === 'overdue')
      .map(i => ({
        id: `i_${i.id}`,
        type: 'invoice' as const,
        title: `Fatura Cartão`, // Could be improved if we fetch card name
        amount: i.totalAmount,
        dueDate: i.dueDate,
        status: i.status,
        originalData: i
      }))
  ].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
   .slice(0, 10);

  const handleCompleteQuest = async (quest: QuestItem) => {
    setIsCompleting(quest.id);
    try {
      const now = new Date().toISOString();
      if (quest.type === 'payable') {
        await updatePayable(quest.originalData.id, { status: 'paid', paidAt: now });
        await addTransaction({
          userId: quest.originalData.userId,
          amount: quest.amount,
          type: 'expense',
          title: quest.title,
          description: quest.title,
          category: quest.originalData.categoryId || 'Outros',
          category_id: quest.originalData.categoryId || '',
          date: now,
          createdAt: now
        });
      } else if (quest.type === 'receivable') {
        await updateReceivable(quest.originalData.id, { status: 'received', receivedAt: now });
        await addTransaction({
          userId: quest.originalData.userId,
          amount: quest.amount,
          type: 'income',
          title: quest.title,
          description: quest.title,
          category: quest.originalData.categoryId || 'Outros',
          category_id: quest.originalData.categoryId || '',
          date: now,
          createdAt: now
        });
      } else if (quest.type === 'invoice') {
        await updateInvoice(quest.originalData.id, { status: 'paid', paidAt: now });
        await addTransaction({
          userId: quest.originalData.userId,
          amount: quest.amount,
          type: 'expense',
          title: quest.title,
          description: quest.title,
          category: 'Cartão de Crédito',
          category_id: 'credit_card',
          date: now,
          createdAt: now
        });
      }
    } catch (error) {
      console.error("Error completing quest:", error);
    } finally {
      setIsCompleting(null);
    }
  };

  const getDaysRemaining = (dueDate: string) => {
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
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm text-center">
        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Todas as Quests Concluídas!</h3>
        <p className="text-sm text-gray-500">Você não tem obrigações financeiras próximas.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚔️</span>
          <h3 className="text-xl font-display font-bold text-gray-900">Quests Ativas</h3>
        </div>
        <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
          Top {activeQuests.length}
        </span>
      </header>

      <div className="space-y-3">
        {activeQuests.map((quest, index) => {
          const isOverdue = quest.status === 'overdue' || quest.status === 'defaulted';
          const isReceivable = quest.type === 'receivable';
          
          return (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex items-center justify-between p-4 rounded-2xl border transition-all",
                isOverdue ? "bg-red-50/50 border-red-100" : "bg-gray-50/50 border-gray-100 hover:border-gray-200"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  isReceivable ? "bg-emerald-100 text-emerald-600" : 
                  quest.type === 'invoice' ? "bg-purple-100 text-purple-600" :
                  "bg-red-100 text-red-600"
                )}>
                  {isReceivable ? <ArrowDownRight className="w-5 h-5" /> : 
                   quest.type === 'invoice' ? <CreditCard className="w-5 h-5" /> :
                   <ArrowUpRight className="w-5 h-5" />}
                </div>
                
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{quest.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className={cn("w-3 h-3", isOverdue ? "text-red-500" : "text-gray-400")} />
                    <span className={cn(
                      "text-xs font-medium",
                      isOverdue ? "text-red-600" : "text-gray-500"
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
                    isReceivable ? "text-emerald-600" : "text-gray-900"
                  )}>
                    {isReceivable ? '+' : '-'}{formatCurrency(quest.amount)}
                  </p>
                </div>
                
                <button
                  onClick={() => handleCompleteQuest(quest)}
                  disabled={isCompleting === quest.id}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0",
                    isCompleting === quest.id ? "opacity-50 cursor-not-allowed" : "",
                    isReceivable 
                      ? "bg-emerald-100 hover:bg-emerald-200 text-emerald-700" 
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
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
