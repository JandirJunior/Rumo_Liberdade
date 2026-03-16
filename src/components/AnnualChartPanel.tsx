'use client';

import { useMemo } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useBudgets } from '@/hooks/useBudgets';
import { useReino } from '@/hooks/useReino';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { useTheme } from '@/lib/ThemeContext';

export function AnnualChartPanel() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const { categories } = useCategories();
  const { budgets } = useBudgets(currentMonth, currentYear);
  const { transactions } = useReino();
  const { gameMode } = useTheme();

  const chartData = useMemo(() => {
    const profileType = gameMode === 'reino' ? 'MultiUsuario' : 'MonoUsuario';

    // Filter categories by game mode
    const filteredCategories = categories.filter(c => 
      !c.allowed_profiles || c.allowed_profiles.includes(profileType)
    );

    const data = filteredCategories.map(cat => {
      const budget = budgets.find(b => b.category_id === cat.id);
      const orcado = budget ? (budget.budget_amount || 0) : 0;

      const catTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === currentYear && 
               d.getMonth() + 1 === currentMonth &&
               (t.category_id === cat.id || t.category === cat.name);
      });
      const realizado = catTransactions.reduce((sum, t) => sum + t.amount, 0);

      return {
        name: cat.name,
        Orçado: orcado,
        Realizado: realizado,
        flowType: cat.flow_type
      };
    }).filter(item => item.Orçado > 0 || item.Realizado > 0);

    return data;
  }, [categories, budgets, transactions, gameMode, currentMonth, currentYear]);

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-100">
        <p className="text-gray-400 text-sm font-medium">Nenhum dado disponível para o mês atual.</p>
      </div>
    );
  }

  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            tickFormatter={(value) => value.length > 12 ? `${value.substring(0, 12)}...` : value}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            tickFormatter={(value) => `R$ ${value >= 1000 ? value / 1000 + 'k' : value}`}
          />
          <Tooltip 
            formatter={(value: number) => formatCurrency(value)}
            cursor={{ fill: '#f9fafb' }}
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar dataKey="Orçado" fill="#e5e7eb" radius={[6, 6, 0, 0]} maxBarSize={32} />
          <Bar dataKey="Realizado" radius={[6, 6, 0, 0]} maxBarSize={32}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.flowType === 'income' ? '#10b981' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
