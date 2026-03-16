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
  description: string;
  amount: number;
  type: TransactionType;
  category?: Category | string;
  category_id?: string;
  date: string;
  userId?: string;
  userName?: string;
  organizationId: string; // SaaS: Identificador do tenant
}

// Interface para metas financeiras (Objetivos)
export interface Goal {
  id: number;
  title: string;
  target: number;
  completed: boolean;
  organizationId?: string;
}

// Interface para ativos de investimento
export interface Asset {
  id: string;
  type: string;
  segment: string;
  value: number;
  targetPercent: number;
  faceroType: 'F' | 'A' | 'C' | 'E' | 'R' | 'O'; // Mapeamento para o atributo F.A.C.E.R.O.
  userId?: string;
  userName?: string;
  organizationId: string; // SaaS: Identificador do tenant
}

// --- SAAS INTERFACES ---

export type Role = 'superadmin' | 'admin' | 'manager' | 'user' | 'viewer';

export interface Organization {
  orgId: string;
  name: string;
  plan: 'basic' | 'pro' | 'business' | 'enterprise';
  maxUsers: number;
  createdAt: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface AppUser {
  userId: string;
  organizationId: string;
  role: Role;
  email: string;
  name?: string;
  avatarUrl?: string;
  createdAt: string;
  status: 'active' | 'inactive';
}

export interface Subscription {
  subscriptionId: string;
  organizationId: string;
  plan: 'basic' | 'pro' | 'business' | 'enterprise';
  billingCycle: 'monthly' | 'yearly';
  status: 'active' | 'trial' | 'past_due' | 'cancelled';
  nextBillingDate: string;
}

export interface Log {
  logId: string;
  organizationId: string;
  userId: string;
  action: string;
  metadata?: any;
  timestamp: string;
}

export interface Character {
  id: number;
  name: string;
  type: 'villain' | 'boss';
  requiredInvestment: number;
  image: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'epic' | 'legendary';
  reward: string;
}

// --- FIM SAAS INTERFACES ---

// Interface para os atributos do sistema F.A.C.E.R.O.
export interface FaceroStats {
  F: number; // Festim (Renda Passiva)
  A: number; // Arcano (Ações/RV)
  C: number; // Cache (Cripto/Opções)
  E: number; // Exodia (Exterior)
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

// --- NOVAS INTERFACES DE CONTAS E CARTÕES ---

export type AccountStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type ReceivableStatus = 'pending' | 'received' | 'defaulted' | 'cancelled';
export type InvoiceStatus = 'open' | 'closed' | 'paid' | 'overdue';

export interface AccountPayable {
  id: string;
  userId: string;
  description: string;
  amount: number;
  category?: string;
  dueDate: string;
  status: AccountStatus;
  paymentMethod?: string;
  creditCardId?: string;
  installments?: number;
  currentInstallment?: number;
  isRecurring?: boolean;
  recurrenceRule?: string;
  nextRecurrenceDate?: string;
  createdAt: string;
  paidAt?: string;
  transactionId?: string;
}

export interface AccountReceivable {
  id: string;
  userId: string;
  description: string;
  amount: number;
  category?: string;
  dueDate: string;
  payer?: string;
  status: ReceivableStatus;
  isRecurring?: boolean;
  recurrenceRule?: string;
  nextRecurrenceDate?: string;
  createdAt: string;
  receivedAt?: string;
  transactionId?: string;
}

export interface CreditCard {
  id: string;
  userId: string;
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
}

export interface CreditCardInvoice {
  id: string;
  cardId: string;
  userId: string;
  month: number;
  year: number;
  closingDate: string;
  dueDate: string;
  totalAmount: number;
  status: InvoiceStatus;
  createdAt: string;
  paidAt?: string;
  transactionId?: string;
}

// --- FIM NOVAS INTERFACES ---

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
