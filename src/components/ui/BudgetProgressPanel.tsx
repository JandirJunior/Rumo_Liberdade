import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Target, AlertCircle, CheckCircle2, FlaskConical, Castle, Compass, Beer, Book, TrendingUp, TrendingDown } from 'lucide-react';
import { useBudgets } from '@/hooks/useBudgets';
import { formatCurrency, cn } from '@/lib/utils';
import { useTheme } from '@/lib/ThemeContext';
import { THEMES } from '@/lib/themes';

export function BudgetProgressPanel({ 
  month: initialMonth, 
  year: initialYear,
  hideSelectors = false,
  isPlanningMode = false
}: { 
  month?: number, 
  year?: number,
  hideSelectors?: boolean,
  isPlanningMode?: boolean
} = {}) {
  const { theme } = useTheme();
  const colors = THEMES[theme] || THEMES.default;
  
  const today = new Date();
  const [month, setMonth] = useState(initialMonth || today.getMonth() + 1);
  const [year, setYear] = useState(initialYear || today.getFullYear());
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense');
  
  const { budgetProgress, loading, saveBudget } = useBudgets(month, year);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');

  const handleEdit = (category_id: string, currentAmount: number) => {
    setEditingCategory(category_id);
    setEditAmount(currentAmount.toString());
  };

  const handleSave = async (category_id: string) => {
    const amount = parseFloat(editAmount);
    if (!isNaN(amount) && amount >= 0) {
      await saveBudget(category_id, amount);
    }
    setEditingCategory(null);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Target': return <Target className="w-5 h-5" />;
      case 'FlaskConical': return <FlaskConical className="w-5 h-5" />;
      case 'Castle': return <Castle className="w-5 h-5" />;
      case 'Compass': return <Compass className="w-5 h-5" />;
      case 'Beer': return <Beer className="w-5 h-5" />;
      case 'Book': return <Book className="w-5 h-5" />;
      default: return <Target className="w-5 h-5" />;
    }
  };

  const filteredProgress = useMemo(() => {
    return budgetProgress.filter(b => b.flow_type === activeTab);
  }, [budgetProgress, activeTab]);

  const groupedProgress = useMemo(() => {
    return filteredProgress.reduce((acc, item) => {
      if (!acc[item.rpg_group]) {
        acc[item.rpg_group] = [];
      }
      acc[item.rpg_group].push(item);
      return acc;
    }, {} as Record<string, typeof budgetProgress>);
  }, [filteredProgress]);

  if (loading) {
    return <div className="animate-pulse bg-[var(--color-bg-panel)] h-64 rounded-3xl medieval-border"></div>;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-[var(--color-bg-dark)] p-1 rounded-xl medieval-border">
          <button
            onClick={() => setActiveTab('income')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === 'income' ? "bg-[var(--color-bg-panel)] text-emerald-400 shadow-sm medieval-border" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
            )}
          >
            <TrendingUp className="w-4 h-4" />
            Receitas
          </button>
          <button
            onClick={() => setActiveTab('expense')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === 'expense' ? "bg-[var(--color-bg-panel)] text-red-400 shadow-sm medieval-border" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
            )}
          >
            <TrendingDown className="w-4 h-4" />
            Despesas
          </button>
        </div>
        {!hideSelectors && (
          <div className="flex items-center gap-2">
            <select 
              value={month} 
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="text-sm border-[var(--color-border)] rounded-xl bg-[var(--color-bg-panel)] text-[var(--color-text-main)] focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] p-2 shadow-sm medieval-border"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString('pt-BR', { month: 'long' }).charAt(0).toUpperCase() + new Date(2000, m - 1).toLocaleString('pt-BR', { month: 'long' }).slice(1)}
                </option>
              ))}
            </select>
            <select 
              value={year} 
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="text-sm border-[var(--color-border)] rounded-xl bg-[var(--color-bg-panel)] text-[var(--color-text-main)] focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] p-2 shadow-sm medieval-border"
            >
              {[year - 1, year, year + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {Object.entries(groupedProgress).map(([groupName, items]) => (
          <div key={groupName} className="space-y-4">
            <h4 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-widest px-2">{groupName}</h4>
            <div className={isPlanningMode ? "flex flex-col gap-2" : "flex flex-col gap-3"}>
              {items.map((item) => {
                if (isPlanningMode) {
                  return (
                    <div key={item.category_id} className="flex items-center justify-between p-3 bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-xl shadow-sm hover:border-[var(--color-primary)] transition-colors medieval-border">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-bg-dark)] shadow-sm", item.color || 'bg-[var(--color-primary)]')}>
                          {getIcon(item.icon || 'Target')}
                        </div>
                        <span className="text-sm font-bold text-[var(--color-text-main)]">{item.category_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--color-text-muted)]">R$</span>
                        <input 
                          type="number"
                          defaultValue={item.orcado || ''}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val >= 0 && val !== item.orcado) {
                              saveBudget(item.category_id, val);
                            } else if (e.target.value === '' && item.orcado !== 0) {
                              saveBudget(item.category_id, 0);
                            }
                          }}
                          className="w-24 px-2 py-1.5 text-sm font-bold text-[var(--color-text-main)] bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-right transition-all"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  );
                }

                const isExceeded = item.status === 'orçamento excedido';
                const isEditing = editingCategory === item.category_id;

                return (
                  <div key={item.category_id} className="bg-[var(--color-bg-panel)] rounded-3xl p-5 border border-[var(--color-border)] shadow-sm relative overflow-hidden medieval-border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-2xl flex items-center justify-center text-[var(--color-bg-dark)] shadow-sm",
                          isExceeded ? "bg-red-500" : (item.color || 'bg-[var(--color-primary)]')
                        )}>
                          {getIcon(item.icon || 'Target')}
                        </div>
                        <div>
                          <h5 className="text-sm font-bold text-[var(--color-text-main)]">{item.category_name}</h5>
                          <div className="flex items-center gap-1 mt-1">
                            {isExceeded ? (
                              <AlertCircle className="w-3 h-3 text-red-500" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            )}
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-wider",
                              isExceeded ? "text-red-500" : "text-emerald-500"
                            )}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              className="w-24 px-2 py-1 text-sm border-[var(--color-border)] bg-[var(--color-bg-dark)] text-[var(--color-text-main)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                              autoFocus
                            />
                            <button 
                              onClick={() => handleSave(item.category_id)}
                              className="text-xs bg-[var(--color-primary)] text-[var(--color-bg-dark)] px-2 py-1 rounded-lg font-bold"
                            >
                              Salvar
                            </button>
                          </div>
                        ) : (
                          <div 
                            className="cursor-pointer group text-right"
                            onClick={() => handleEdit(item.category_id, item.orcado)}
                          >
                            <p className="text-sm font-bold text-[var(--color-text-main)] group-hover:text-[var(--color-primary)] transition-colors">
                              {formatCurrency(item.gasto_real)} <span className="text-[var(--color-text-muted)] text-xs font-normal">/ {formatCurrency(item.orcado)}</span>
                            </p>
                            <p className="text-[10px] text-[var(--color-text-muted)] font-medium uppercase tracking-wider group-hover:underline">
                              Editar Orçamento
                            </p>
                          </div>
                        )}
                        <div className="flex items-center gap-1 mt-1 bg-[var(--color-bg-dark)] px-2 py-0.5 rounded-md border border-[var(--color-border)]">
                          <span className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-tighter">Previsto:</span>
                          <span className="text-[10px] font-bold text-[var(--color-text-main)]">{formatCurrency(item.previsto)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Barra de Progresso RPG */}
                    <div className="relative h-3 w-full bg-[var(--color-bg-dark)] rounded-full overflow-hidden shadow-inner mt-4 border border-[var(--color-border)]">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.progresso}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={cn(
                          "absolute top-0 left-0 h-full rounded-full medieval-glow",
                          isExceeded ? "bg-red-500" : (item.color || 'bg-[var(--color-primary)]')
                        )}
                      />
                      {/* Marcador de 100% se excedeu */}
                      {isExceeded && (
                        <div className="absolute top-0 left-0 h-full w-full border-r-2 border-red-700/50" style={{ width: '100%' }}></div>
                      )}
                    </div>
                    
                    <div className="flex justify-between mt-2">
                      <span className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">{item.progresso.toFixed(0)}%</span>
                      <span className="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-widest">+{item.xp_reward} XP</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {Object.keys(groupedProgress).length === 0 && (
          <div className="text-center py-12 bg-[var(--color-bg-panel)] rounded-3xl border border-[var(--color-border)] medieval-border">
            <Target className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4" />
            <p className="text-[var(--color-text-muted)] font-medium">Nenhuma categoria encontrada para este perfil.</p>
          </div>
        )}
      </div>
    </section>
  );
}
