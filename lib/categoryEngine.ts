import { Category, CategoryGroup, Transaction } from './types';

export const CATEGORIES: Record<string, Category> = {
  // Receitas Fixas (Cofre)
  'salary': { id: 'salary', name: 'Salário', type: 'income', group: 'cofre' },
  'rent_income': { id: 'rent_income', name: 'Aluguel (Recebimento)', type: 'income', group: 'cofre' },
  
  // Receitas Variáveis (Missões)
  'freelance': { id: 'freelance', name: 'Freelance', type: 'income', group: 'missoes' },
  'bonus': { id: 'bonus', name: 'Bônus', type: 'income', group: 'missoes' },
  
  // Despesas Fixas (Tributos)
  'rent': { id: 'rent', name: 'Aluguel', type: 'expense', group: 'tributos' },
  'utilities': { id: 'utilities', name: 'Contas (Água, Luz, etc)', type: 'expense', group: 'tributos' },
  'internet': { id: 'internet', name: 'Internet', type: 'expense', group: 'tributos' },
  'insurance': { id: 'insurance', name: 'Seguros', type: 'expense', group: 'tributos' },
  
  // Despesas Variáveis (Aventuras)
  'food': { id: 'food', name: 'Alimentação', type: 'expense', group: 'aventuras' },
  'transport': { id: 'transport', name: 'Transporte', type: 'expense', group: 'aventuras' },
  'entertainment': { id: 'entertainment', name: 'Lazer', type: 'expense', group: 'aventuras' },
  'health': { id: 'health', name: 'Saúde', type: 'expense', group: 'aventuras' },
  'education': { id: 'education', name: 'Educação', type: 'expense', group: 'aventuras' },
  'shopping': { id: 'shopping', name: 'Compras', type: 'expense', group: 'aventuras' },
  
  // Investimentos
  'investment': { id: 'investment', name: 'Investimento', type: 'investment', group: 'investimentos' },
};

// Fallback mapping for old categories
const CATEGORY_FALLBACK_MAP: Record<string, string> = {
  'Fixed': 'rent',
  'Lifestyle': 'entertainment',
  'Emergency': 'health',
  'Investment': 'investment',
  'Aluguel': 'rent',
  'Salário': 'salary',
  'Freelance': 'freelance',
  'Alimentação': 'food',
  'Transporte': 'transport',
};

export const categoryEngine = {
  getCategoryById(id: string): Category | undefined {
    return CATEGORIES[id];
  },

  getAllCategories(): Category[] {
    return Object.values(CATEGORIES);
  },

  getCategoriesByGroup(group: CategoryGroup): Category[] {
    return Object.values(CATEGORIES).filter(c => c.group === group);
  },

  getCategoriesByType(type: 'income' | 'expense' | 'investment'): Category[] {
    return Object.values(CATEGORIES).filter(c => c.type === type);
  },

  // Fallback function to convert old transaction format to new format
  normalizeTransactionCategory(transaction: any): Transaction {
    let category_id = transaction.category_id;
    let category_name = transaction.category_name;
    let category_group = transaction.category_group;

    if (!category_id && transaction.category) {
      // Try to find a fallback
      const oldCategory = transaction.category as string;
      category_id = CATEGORY_FALLBACK_MAP[oldCategory] || 'food'; // default fallback
    }

    if (!category_id) {
      // Default fallback based on type
      if (transaction.type === 'income') category_id = 'salary';
      else if (transaction.type === 'expense') category_id = 'food';
      else category_id = 'investment';
    }

    const category = CATEGORIES[category_id];
    if (category) {
      category_name = category.name;
      category_group = category.group;
    }

    // Remove old category field if present to avoid confusion, but we are returning a new object
    const { category: oldCat, ...rest } = transaction;

    return {
      ...rest,
      category_id,
      category_name,
      category_group,
    } as Transaction;
  },
  
  getGroupName(group: CategoryGroup | string | undefined): string {
    switch (group) {
      case 'cofre': return '💎 Cofre do Reino (Receitas Fixas)';
      case 'missoes': return '⚡ Saque de Missões (Receitas Variáveis)';
      case 'tributos': return '🛡️ Tributos do Reino (Despesas Fixas)';
      case 'aventuras': return '⚔️ Aventuras do Herói (Despesas Variáveis)';
      case 'investimentos': return '💰 Investimentos';
      default: return 'Outros';
    }
  }
};
