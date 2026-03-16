import { collection, doc, getDocs, query, where, setDoc, addDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/firebase';

// ==========================================
// MODELO DE DADOS (Tipos)
// ==========================================

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  mentor_selected?: string;
  level: number;
  xp: number;
  created_at: Date;
  avatarUrl?: string;
}

export interface CategoryEntity {
  id: string;
  user_id: string;
  name: string;
  group_type: 'fixed' | 'variable';
  flow_type: 'income' | 'expense';
  rpg_group: string;
  allowed_profiles: ('MonoUsuario' | 'MultiUsuario')[];
  icon: string;
  color: string;
  rpg_theme_name: string;
  created_at: Date;
}

export type AccountType = 'checking' | 'credit_card' | 'wallet' | 'digital_account';

export interface AccountEntity {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  current_balance: number;
  created_at: Date;
}

export type TransactionType = 'income' | 'expense' | 'transfer' | 'investment';

export interface TransactionEntity {
  id: string;
  user_id: string;
  account_id: string;
  type: TransactionType;
  category_id: string; // Changed from category to category_id
  category?: string; // Kept for backward compatibility temporarily
  amount: number;
  description: string;
  date: Date;
  created_at: Date;
}

export interface BudgetEntity {
  id: string;
  user_id: string;
  category_id: string; // Changed from category to category_id
  category?: string; // Kept for backward compatibility temporarily
  budget_amount: number;
  month: number;
  year: number;
}

export type InvestmentType = 'stock' | 'fii' | 'crypto' | 'etf' | 'fixed_income';

export interface InvestmentEntity {
  id: string;
  user_id: string;
  type: InvestmentType;
  ticker: string;
  quantity: number;
  average_price: number;
  invested_value: number;
  current_value: number;
  earnings: number;
}

// ==========================================
// REGRAS DE NEGÓCIO (Cálculos)
// ==========================================

/**
 * Calcula o saldo total do usuário somando o saldo atual de todas as contas.
 * saldo_total = soma(accounts.current_balance)
 */
export function calculateTotalBalance(accounts: AccountEntity[]): number {
  return accounts.reduce((total, account) => total + account.current_balance, 0);
}

/**
 * Calcula a receita mensal somando todas as transações do tipo 'income'.
 * receita_mensal = soma(transactions.type = income)
 */
export function calculateMonthlyIncome(transactions: TransactionEntity[], month: number, year: number): number {
  return transactions
    .filter(t => t.type === 'income' && t.date.getMonth() + 1 === month && t.date.getFullYear() === year)
    .reduce((total, t) => total + t.amount, 0);
}

/**
 * Calcula a despesa mensal somando todas as transações do tipo 'expense'.
 * despesa_mensal = soma(transactions.type = expense)
 */
export function calculateMonthlyExpense(transactions: TransactionEntity[], month: number, year: number): number {
  return transactions
    .filter(t => t.type === 'expense' && t.date.getMonth() + 1 === month && t.date.getFullYear() === year)
    .reduce((total, t) => total + t.amount, 0);
}

/**
 * Calcula o patrimônio total somando o saldo total e o valor atual dos investimentos.
 * patrimonio_total = saldo_total + soma(investments.current_value)
 */
export function calculateTotalWealth(accounts: AccountEntity[], investments: InvestmentEntity[]): number {
  const totalBalance = calculateTotalBalance(accounts);
  const totalInvestments = investments.reduce((total, inv) => total + inv.current_value, 0);
  return totalBalance + totalInvestments;
}

/**
 * Calcula os rendimentos de um investimento.
 * rendimentos = current_value - invested_value
 */
export function calculateEarnings(investment: InvestmentEntity): number {
  return investment.current_value - investment.invested_value;
}

/**
 * Calcula os rendimentos totais de todos os investimentos.
 */
export function calculateTotalEarnings(investments: InvestmentEntity[]): number {
  return investments.reduce((total, inv) => total + calculateEarnings(inv), 0);
}

// ==========================================
// FUNÇÕES DE ACESSO A DADOS (Firestore)
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
  'F': 'Fundo Imobiliário',
  'A': 'Ações',
  'C': 'Cripto',
  'E': 'Exterior / ETFs',
  'R': 'Renda Fixa',
  'O': 'Outros',
};

export function calculateInvestmentPower(assets: any[]) {
  const totalValue = assets.reduce((acc, curr) => acc + curr.value, 0);
  
  const aggregated = Object.keys(FACERO_TARGETS).map(key => {
    const typeAssets = assets.filter(a => a.faceroType === key);
    const value = typeAssets.reduce((acc, curr) => acc + curr.value, 0);
    const targetPercent = FACERO_TARGETS[key];
    const currentPercent = totalValue > 0 ? value / totalValue : 0;
    
    return {
      faceroType: key as 'F' | 'A' | 'C' | 'E' | 'R' | 'O',
      name: FACERO_LABELS[key],
      value,
      targetPercent,
      currentPercent,
      deficit: targetPercent - currentPercent > 0 ? targetPercent - currentPercent : 0
    };
  });

  return {
    totalValue,
    aggregated
  };
}

export const financialEngine = {
  // Cálculos
  calculateTotalBalance,
  calculateMonthlyIncome,
  calculateMonthlyExpense,
  calculateTotalWealth,
  calculateEarnings,
  calculateTotalEarnings,
  calculateInvestmentPower,

  // Buscas
  async getUserAccounts(userId: string): Promise<AccountEntity[]> {
    const q = query(collection(db, 'accounts'), where('user_id', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        created_at: data.created_at?.toDate() || new Date(),
      } as AccountEntity;
    });
  },

  async getUserTransactions(userId: string): Promise<TransactionEntity[]> {
    const q = query(collection(db, 'transactions'), where('user_id', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        date: data.date?.toDate() || new Date(),
        created_at: data.created_at?.toDate() || new Date(),
      } as TransactionEntity;
    });
  },

  async getUserBudgets(userId: string): Promise<BudgetEntity[]> {
    const q = query(collection(db, 'budgets'), where('user_id', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as BudgetEntity));
  },

  async getUserInvestments(userId: string): Promise<InvestmentEntity[]> {
    const q = query(collection(db, 'investments'), where('user_id', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as InvestmentEntity));
  }
};
