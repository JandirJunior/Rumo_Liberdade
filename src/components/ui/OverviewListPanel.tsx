import { useState } from 'react';
import { formatCurrency, cn, getColorClass } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, CreditCard, Calendar, ChevronLeft, ChevronRight, Edit2, Trash2, User } from 'lucide-react';

export function OverviewListPanel({ 
  payables, 
  receivables, 
  creditCards,
  onEdit,
  onDelete
}: { 
  payables: any[], 
  receivables: any[], 
  creditCards: any[],
  onEdit: (item: any) => void,
  onDelete: (item: any) => void
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  const allItems = [
    ...payables.map(p => ({ ...p, type: 'payable', date: new Date(p.createdAt || p.created_at || 0), userName: p.userName || 'Desconhecido' })),
    ...receivables.map(r => ({ ...r, type: 'receivable', date: new Date(r.createdAt || r.created_at || 0), userName: r.userName || 'Desconhecido' })),
    ...creditCards.map(c => ({ ...c, type: 'card', date: new Date(c.created_at || 0), userName: c.userName || 'Desconhecido' }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const pageCount = Math.ceil(allItems.length / pageSize);
  const paginatedItems = allItems.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  return (
    <div className="space-y-3">
      {paginatedItems.map(item => (
        <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] hover:border-[var(--color-primary)] transition-colors">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center border",
              item.type === 'payable' ? "bg-red-950/30 text-red-500 border-red-900/50" :
              item.type === 'receivable' ? "bg-emerald-950/30 text-emerald-500 border-emerald-900/50" :
              "bg-purple-950/30 text-purple-500 border-purple-900/50"
            )}>
              {item.type === 'payable' ? <ArrowUpRight className="w-5 h-5" /> :
               item.type === 'receivable' ? <ArrowDownRight className="w-5 h-5" /> :
               <CreditCard className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="text-sm font-bold text-[var(--color-text-main)]">{item.description || item.name}</h4>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[var(--color-text-muted)]" />
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {item.date.toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <span className="text-xs text-[var(--color-text-muted)]">• {item.category_id || 'Categoria'}</span>
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 text-[var(--color-text-muted)]" />
                  <span className="text-xs text-[var(--color-text-muted)]">{item.userName}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <p className={cn(
              "text-sm font-bold",
              getColorClass(item.type === 'payable' ? -(item.amount || 0) : (item.amount || item.limit || 0))
            )}>
              {item.type === 'payable' ? `-${formatCurrency(item.amount || 0)}` :
               item.type === 'receivable' ? `+${formatCurrency(item.amount || 0)}` :
               formatCurrency(item.limit || 0)}
            </p>
            <button onClick={() => onEdit(item)} className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(item)} className="p-2 text-[var(--color-text-muted)] hover:text-red-500 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
      
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <button 
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="p-2 rounded-xl border border-[var(--color-border)] disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-[var(--color-text-muted)]">Página {currentPage + 1} de {pageCount}</span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(pageCount - 1, p + 1))}
            disabled={currentPage === pageCount - 1}
            className="p-2 rounded-xl border border-[var(--color-border)] disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {allItems.length === 0 && (
        <div className="text-center py-8 text-[var(--color-text-muted)] text-sm">
          Nenhum registro encontrado.
        </div>
      )}
    </div>
  );
}
