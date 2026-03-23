'use client';

import { useMemo } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useBudgets } from '@/hooks/useBudgets';
import { useKingdom } from '@/hooks/useKingdom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { useTheme } from '@/lib/ThemeContext';

export function AnnualChartPanel() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const { categories } = useCategories();
  const { budgets } = useBudgets(currentMonth, currentYear);
  const { transactions } = useKingdom();
  const { gameMode } = useTheme();

  const chartData = useMemo(() => {
    const profileType = gameMode === 'reino' ? 'MultiUsuario' : 'MonoUsuario';

    // Filter categories by game mode
    const filteredCategories = categories.filter(c =>
      !c.allowed_profiles || c.allowed_profiles.includes(profileType)
    );

    const data = filteredCategories.map(cat => {
      const budget = budgets.find(b => b.category_id === cat.id);
      const orcado = budget ? (budget.quantidade || budget.amount || 0) : 0;

      const catTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === currentYear &&
          d.getMonth() + 1 === currentMonth &&
          (t.category_id === cat.id || (t as Transaction & { category?: string }).category === cat.name);
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
      <div className="h-64 flex items-center justify-center bg-[var(--color-bg-panel)] rounded-2xl border border-[var(--color-border)] medieval-border">
        <p className="text-[var(--color-text-muted)] text-sm font-medium">Nenhum dado disponível para o mês atual.</p>
      </div>
    );
  }

  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
            tickFormatter={(value) => value.length > 12 ? `${value.substring(0, 12)}...` : value}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
            tickFormatter={(value) => `R$ ${value >= 1000 ? value / 1000 + 'k' : value}`}
          />
          <Tooltip
            formatter={(value: any) => formatCurrency(Number(value) || 0)}
            cursor={{ fill: 'var(--color-bg-dark)' }}
            contentStyle={{ borderRadius: '16px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-panel)', color: 'var(--color-text-main)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar dataKey="Orçado" fill="var(--color-border)" radius={[6, 6, 0, 0]} maxBarSize={32} />
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
