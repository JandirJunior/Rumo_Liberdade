import { useState } from 'react';
import { motion } from 'motion/react';
import { Target, AlertCircle, CheckCircle2, FlaskConical, Castle, Compass, Beer, Book } from 'lucide-react';
import { useBudgets } from '@/hooks/useBudgets';
import { formatCurrency, cn } from '@/lib/utils';
import { useTheme } from '@/lib/ThemeContext';
import { THEMES } from '@/lib/themes';

export function BudgetProgressPanel() {
  const { theme } = useTheme();
  const colors = THEMES[theme] || THEMES.default;
  
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  
  const { budgetProgress, loading, saveBudget } = useBudgets(month, year);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');

  const handleEdit = (categoryId: string, currentAmount: number) => {
    setEditingCategory(categoryId);
    setEditAmount(currentAmount.toString());
  };

  const handleSave = async (categoryId: string) => {
    const amount = parseFloat(editAmount);
    if (!isNaN(amount) && amount >= 0) {
      await saveBudget(categoryId, amount);
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

  if (loading) {
    return <div className="animate-pulse bg-gray-100 h-64 rounded-3xl"></div>;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-display font-bold text-gray-900">Atributos Financeiros</h4>
        <div className="flex items-center gap-2">
          <select 
            value={month} 
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="text-xs border-gray-200 rounded-lg bg-white text-gray-700 focus:ring-emerald-500 focus:border-emerald-500"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>
                {new Date(2000, m - 1).toLocaleString('pt-BR', { month: 'short' }).toUpperCase()}
              </option>
            ))}
          </select>
          <select 
            value={year} 
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="text-xs border-gray-200 rounded-lg bg-white text-gray-700 focus:ring-emerald-500 focus:border-emerald-500"
          >
            {[year - 1, year, year + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {budgetProgress.map((item) => {
          const isExceeded = item.status === 'orçamento excedido';
          const isEditing = editingCategory === item.category_id;

          return (
            <div key={item.category_id} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm",
                    isExceeded ? "bg-red-500" : (item.color || 'bg-gray-500')
                  )}>
                    {getIcon(item.icon || 'Target')}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-gray-900">{item.category_name}</h5>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.rpg_theme_name || item.rpg_group}</p>
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

                <div className="text-right">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="w-24 px-2 py-1 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        autoFocus
                      />
                      <button 
                        onClick={() => handleSave(item.category_id)}
                        className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-bold"
                      >
                        Salvar
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="cursor-pointer group"
                      onClick={() => handleEdit(item.category_id, item.orcado)}
                    >
                      <p className="text-sm font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                        {formatCurrency(item.gasto_real)} <span className="text-gray-400 text-xs font-normal">/ {formatCurrency(item.orcado)}</span>
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider group-hover:underline">
                        Editar Orçamento
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Barra de Progresso RPG */}
              <div className="relative h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner mt-4">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${item.progresso}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={cn(
                    "absolute top-0 left-0 h-full rounded-full",
                    isExceeded ? "bg-red-500" : (item.color || 'bg-gray-500')
                  )}
                />
                {/* Marcador de 100% se excedeu */}
                {isExceeded && (
                  <div className="absolute top-0 left-0 h-full w-full border-r-2 border-red-700/50" style={{ width: '100%' }}></div>
                )}
              </div>
              
              <div className="flex justify-between mt-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.progresso.toFixed(0)}%</span>
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">+{item.xp_reward} XP</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
