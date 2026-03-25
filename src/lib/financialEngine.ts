/**
 * Engine Financeira: Núcleo de cálculos e lógica de negócio financeira.
 * Implementa funções para análise de transações, cálculo de patrimônio líquido,
 * poder de investimento, resumos mensais, validações e métricas gamificadas.
 * Utiliza dados de transações, ativos e orçamentos para gerar insights e progresso.
 * Integrado com sistema de XP e atributos F.A.C.E.R.O. para gamificação financeira.
 */
import { collection, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/services/firebase';
import {
  BudgetProgress,
  CategoryEntity,
  UserEntity,
  Transaction,
  Asset,
  AccountPayable,
  AccountReceivable,
  CreditCardInvoice
} from '@/types';

// ==========================================
// REGRAS DE NEGÓCIO (Cálculos)
// ==========================================

export const FACERO_TARGETS: Record<string, number> = {
  'F': 0.40, // 40% Fundo Imobiliário
  'A': 0.30, // 30% Ações
  'C': 0.05, // 5% Cripto
  'E': 0.10, // 10% Exterior / ETFs
  'R': 0.10, // 10% Renda Fixa
  'O': 0.05, // 5% Outros
};

export const FACERO_LABELS: Record<string, string> = {
  'F': 'FUNDOS IMOBILIÁRIOS',
  'A': 'AÇÕES',
  'C': 'CRIPTO ATIVOS',
  'E': 'EXTERIOR ETF',
  'R': 'RENDA FIXA',
  'O': 'OPORTUNIDADES OUTROS INVESTIMENTS',
};

export function parseDate(date: any): Date {
  if (date instanceof Date) return date;
  if (date && typeof date === 'object' && 'seconds' in date) {
    return new Date(date.seconds * 1000);
  }
  if (typeof date === 'string') {
    return new Date(date);
  }
  return new Date();
}

export function calculateInvestmentPower(assets: Asset[], planning?: { F: number; A: number; C: number; E: number; R: number; O: number }) {
  if (!Array.isArray(assets)) return { totalValue: 0, aggregated: [], tickerDetails: [] };
  const totalValue = assets.reduce((acc, curr) => acc + Number(curr.invested_value || curr.value || curr.total || 0), 0);

  const getFaceroType = (asset: any) => {
    if (asset.faceroType) return asset.faceroType;
    if (asset.investment_category_id) return asset.investment_category_id;
    const typeToFacero: Record<string, string> = {
      'fii': 'F',
      'stock': 'A',
      'crypto': 'C',
      'etf': 'E',
      'fixed_income': 'R',
      'other': 'O'
    };
    return typeToFacero[asset.type] || 'O';
  };

  const aggregated = Object.keys(FACERO_TARGETS).map(key => {
    const typeAssets = assets.filter(a => getFaceroType(a) === key);
    const value = typeAssets.reduce((acc, curr) => acc + Number(curr.invested_value || curr.value || curr.total || 0), 0);
    const targetPercent = planning ? planning[key as keyof typeof planning] / 100 : FACERO_TARGETS[key];
    const currentPercent = totalValue > 0 ? value / totalValue : 0;

    return {
      faceroType: key as 'F' | 'A' | 'C' | 'E' | 'R' | 'O',
      name: FACERO_LABELS[key],
      shortName: key,
      value,
      targetPercent,
      currentPercent,
      deficit: targetPercent - currentPercent > 0 ? targetPercent - currentPercent : 0
    };
  });

  const tickerGroups: Record<string, { totalValue: number, totalQuantity: number, type: string, faceroType: string, ids: string[] }> = {};

  assets.forEach(asset => {
    if (!asset) return;
    const ticker = asset.ticker || asset.segment || 'OUTROS';
    if (!tickerGroups[ticker]) {
      tickerGroups[ticker] = {
        totalValue: 0,
        totalQuantity: 0,
        type: asset.type || 'other',
        faceroType: getFaceroType(asset),
        ids: []
      };
    }

    // Calcular o valor total investido
    let totalInvestedValue = 0;
    const quantity = Number(asset.quantity || 0);

    if (asset.invested_value) {
      // Novos dados têm invested_value (valor total já calculado)
      totalInvestedValue = Number(asset.invested_value);
    } else if (asset.price && quantity > 0) {
      // Compatibilidade: se tem price e quantity, calcular total
      totalInvestedValue = Number(asset.price) * quantity;
    } else if (asset.value && quantity > 0) {
      // Compatibilidade com dados antigos: value era o preço unitário
      totalInvestedValue = Number(asset.value) * quantity;
    } else if (asset.value) {
      // Fallback para value se não houver quantity
      totalInvestedValue = Number(asset.value);
    } else if (asset.total) {
      // Fallback final
      totalInvestedValue = Number(asset.total);
    }

    tickerGroups[ticker].totalValue += totalInvestedValue;
    tickerGroups[ticker].totalQuantity += quantity;

    if (asset.id) {
      tickerGroups[ticker].ids.push(asset.id);
    }
  });

  const tickerDetails = Object.entries(tickerGroups).map(([ticker, data]) => ({
    ticker,
    totalValue: data.totalValue,
    totalQuantity: data.totalQuantity,
    averageCost: data.totalQuantity > 0 ? data.totalValue / data.totalQuantity : 0,
    unitPrice: data.totalQuantity > 0 ? data.totalValue / data.totalQuantity : 0,
    type: data.type,
    faceroType: data.faceroType,
    ids: data.ids
  }));

  return { totalValue, aggregated, tickerDetails };
}

export function calculateUserBalance(transactions: Transaction[]): number {
  return transactions.reduce((acc, t) => {
    const amount = Number(t.amount || 0);
    if (t.type === 'income' || t.type === 'earning') return acc + amount;
    if (t.type === 'expense') return acc - amount;
    if (t.type === 'investment') return acc + amount; // Investment: Buy is negative, Sale is positive
    return acc;
  }, 0);
}

export function calculateMonthlySummary(transactions: Transaction[], month: number, year: number) {
  const monthly = transactions.filter(t => {
    const d = parseDate(t.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });

  return {
    income: monthly.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount || 0), 0),
    expense: monthly.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount || 0), 0),
    investment: monthly.filter(t => t.type === 'investment').reduce((acc, t) => acc + Number(t.amount || 0), 0)
  };
}

export function calculateNetWorth(transactions: Transaction[], assets: Asset[]): number {
  const balance = calculateUserBalance(transactions);
  const totalAssets = assets.reduce((acc, a) => acc + Number(a.value || a.total || 0), 0);
  return balance + totalAssets;
}

export function calculateBudgetProgressData(
  month: number,
  year: number,
  categories: CategoryEntity[],
  budgets: any[],
  transactions: Transaction[],
  payables: AccountPayable[],
  receivables: AccountReceivable[],
  creditCards: CreditCardInvoice[]
): BudgetProgress[] {
  return categories.map(cat => {
    const targetMonthStr = `${year}-${String(month).padStart(2, '0')}`;
    
    // Sort budgets for this category by date descending
    const categoryBudgets = budgets
      .filter(b => b.category_id === cat.id)
      .sort((a, b) => {
        const yearA = a.year || 0;
        const monthA = a.month || 0;
        const yearB = b.year || 0;
        const monthB = b.month || 0;
        
        if (yearA !== yearB) return yearB - yearA;
        return monthB - monthA;
      });

    // Find the first budget that is <= targetMonth and targetYear
    const budget = categoryBudgets.find(b => {
      const bYear = b.year || 0;
      const bMonth = b.month || 0;
      if (bYear < year) return true;
      if (bYear === year && bMonth <= month) return true;
      return false;
    });

    const orcado = budget ? (budget.budget_amount || budget.quantidade || 0) : 0;

    const gasto_real = transactions
      .filter(t => {
        const d = parseDate(t.date);
        return t.type === cat.flow_type &&
          t.category_id === cat.id &&
          d.getMonth() + 1 === month &&
          d.getFullYear() === year;
      })
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    let previsto = 0;
    if (cat.flow_type === 'expense') {
      const payablesAmount = payables
        .filter(p => {
          const d = parseDate(p.due_date || p.dueDate);
          return p.category_id === cat.id &&
            d.getMonth() + 1 === month &&
            d.getFullYear() === year &&
            p.status !== 'pago';
        })
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      const creditCardAmount = creditCards
        .filter(cc => {
          const d = parseDate(cc.dueDate || cc.month + '-01');
          return cat.name.toLowerCase().includes('cartão') &&
            d.getMonth() + 1 === month &&
            d.getFullYear() === year &&
            cc.status !== 'paid';
        })
        .reduce((sum, cc) => sum + Number(cc.total_amount || 0), 0);

      previsto = payablesAmount + creditCardAmount;
    } else {
      const receivablesAmount = receivables
        .filter(r => {
          const d = parseDate(r.due_date || r.dueDate);
          return r.category_id === cat.id &&
            d.getMonth() + 1 === month &&
            d.getFullYear() === year &&
            r.status !== 'recebido';
        })
        .reduce((sum, r) => sum + Number(r.amount || 0), 0);

      previsto = receivablesAmount;
    }

    const progresso = orcado > 0 ? Math.min(100, (gasto_real / orcado) * 100) : (gasto_real > 0 ? 100 : 0);
    const status = cat.flow_type === 'expense'
      ? (gasto_real > orcado ? 'orçamento excedido' : 'controle mantido')
      : (gasto_real >= orcado ? 'controle mantido' : 'orçamento excedido');

    return {
      category_id: cat.id,
      category_name: cat.name,
      rpg_group: cat.rpg_group || 'Outros',
      icon: cat.icon || 'HelpCircle',
      color: cat.color || '#3b82f6', // Changed from #94a3b8 to a vibrant blue
      rpg_theme_name: cat.rpg_theme_name || 'Geral',
      flow_type: cat.flow_type || 'expense',
      orcado,
      gasto_real,
      previsto,
      progresso,
      status,
      xp_reward: 50,
      conquista: null
    };
  });
}

export function calculateCategoryFinancials(
  categoryId: string,
  budgets: any[],
  transactions: Transaction[],
  payables: AccountPayable[],
  month: number,
  year: number
) {
  const targetMonthStr = `${year}-${String(month).padStart(2, '0')}`;
  
  const categoryBudgets = budgets
    .filter(b => b.category_id === categoryId)
    .sort((a, b) => {
      const yearA = a.year || 0;
      const monthA = a.month || 0;
      const yearB = b.year || 0;
      const monthB = b.month || 0;
      
      if (yearA !== yearB) return yearB - yearA;
      return monthB - monthA;
    });

  const budget = categoryBudgets.find(b => {
    const bYear = b.year || 0;
    const bMonth = b.month || 0;
    if (bYear < year) return true;
    if (bYear === year && bMonth <= month) return true;
    return false;
  });

  const budgeted = budget ? (budget.budget_amount || budget.quantidade || 0) : 0;

  const realized = transactions
    .filter(t => t.category_id === categoryId && parseDate(t.date).getMonth() + 1 === month && parseDate(t.date).getFullYear() === year)
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const predicted = payables
    .filter(p => p.category_id === categoryId && parseDate(p.due_date || p.dueDate).getMonth() + 1 === month && parseDate(p.due_date || p.dueDate).getFullYear() === year)
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  return { budgeted, predicted, realized };
}

export function calculatePlayerPower(netWorth: number, totalInvested: number, budgetControlScore: number, consistencyScore: number): number {
  return (netWorth * 0.4) + (totalInvested * 0.3) + (budgetControlScore * 0.2) + (consistencyScore * 0.1);
}

export const financialEngine = {
  calculateInvestmentPower,
  calculateUserBalance,
  calculateMonthlySummary,
  calculateNetWorth,
  calculateCategoryFinancials,
  calculatePlayerPower,
  calculateBudgetProgressData,

  async getUserAccounts(userId: string) {
    const q = query(collection(db, 'accounts'), where('user_id', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  },

  async getUserTransactions(userId: string) {
    const q = query(collection(db, 'transactions'), where('user_id', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  }
};
