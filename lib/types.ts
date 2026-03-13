/**
 * Definições de Tipos: Centraliza todas as interfaces e tipos utilizados na aplicação.
 * Garante a consistência dos dados entre os componentes e a lógica de negócio.
 */

// Tipos de transações financeiras
export type TransactionType = 'income' | 'expense' | 'investment';

// Categorias de gastos e investimentos
export type Category = 'Fixed' | 'Lifestyle' | 'Investment' | 'Emergency';

// Interface para uma transação financeira individual
export interface Transaction {
  id: string;
  userId: string; // Adicionado para rastrear o dono da transação
  description: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: string;
}

// Interface para metas financeiras (Objetivos)
export interface Goal {
  id: number;
  title: string;
  target: number;
  completed: boolean;
}

// Interface para ativos de investimento
export interface Asset {
  id: string;
  userId: string; // Adicionado para rastrear o dono do ativo
  type: string;
  segment: string;
  value: number;
  targetPercent: number;
  faceroType: 'F' | 'A' | 'C' | 'E' | 'R' | 'O'; // Mapeamento para o atributo F.A.C.E.R.O.
}

// Interface para os atributos do sistema F.A.C.E.R.O.
export interface FaceroStats {
  F: number; // Festim (Renda Passiva)
  A: number; // Arcano (Ações/RV)
  C: number; // Cache (Cripto/Opções)
  E: number; // Êxodo (Exterior)
  R: number; // Reaver (Renda Fixa)
  O: number; // Órbit (Oportunidades/Caixa)
}

// Arquétipos (Classes de Herói) disponíveis
export type Archetype = 'Paladino' | 'Mago' | 'Dwarf' | 'Elfo' | 'Ladrão' | 'Hobbit' | 'Iniciante';

// Interface para o estado global do jogo do usuário
export interface UserGameState {
  level: number;
  xp: number;
  archetype: Archetype;
  stats: FaceroStats;
  completedQuests: string[];
}

// Interface para itens de orçamento (planejado vs real)
export interface BudgetItem {
  name: string;
  planned: number;
  actual: number;
}

// Interface para o orçamento mensal completo
export interface MonthlyBudget {
  income: BudgetItem[];
  expenses: BudgetItem[];
}

// Interface para o perfil financeiro detalhado do usuário
export interface FinancialProfile {
  monthlyIncome: {
    salario: number;
    mei: number;
    extras: number;
    outros: number;
  };
  distributionRules: {
    fixed: number;
    lifestyle: number;
    investment: number;
    emergency: number;
  };
}
