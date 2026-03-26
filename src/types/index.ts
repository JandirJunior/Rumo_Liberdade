/**
 * Definições de Tipos: Centraliza todas as interfaces e tipos utilizados na aplicação.
 * Garante a consistência dos dados entre os componentes e a lógica de negócio.
 */

// Tipos de transações financeiras
export type TransactionType = "income" | "expense" | "investment" | "earning";

export interface CategoryGroup {
  id: string;
  name: string;
  type: "income" | "expense" | "investment";
  nature: "fixed" | "variable";
}

export interface Category {
  id: string;
  kingdom_id: string;
  name: string;
  group_id: string;
  created_at: string;
  is_active: boolean;
}

// --- KINGDOM INTERFACES ---

export type KingdomRole = "admin" | "member" | "viewer";

export interface Kingdom {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at?: string;
  invite_code?: string;
}

export interface KingdomMember {
  id: string;
  kingdom_id: string;
  user_id: string;
  role: KingdomRole;
  created_at?: string;
  joined_at: string;
  user_name?: string;
  user_email?: string;
}

export interface KingdomInvite {
  id: string;
  kingdom_id: string;
  email: string;
  role: KingdomRole;
  status: "pending" | "accepted" | "rejected";
  invited_by: string;
  created_at: string;
  kingdom_name?: string;
}

export interface ActivityLog {
  id: string;
  kingdom_id: string;
  user_id: string;
  action: string;
  entity: string;
  entity_id: string;
  created_at: string;
  // Legacy fields
  user_name?: string;
  entity_type?:
    | "transaction"
    | "payable"
    | "receivable"
    | "asset"
    | "member"
    | "kingdom";
  details?: any;
}

// Interface para uma transação financeira individual
export interface Transaction {
  id: string;
  kingdom_id?: string;
  user_id?: string;
  type: "income" | "expense" | "investment" | "earning";
  amount: number;
  description: string;
  category_id: string;
  investment_category_id?: string;
  date: string;
  created_at?: string;
  status?: "concluído" | "pendente";
  source?: "manual" | "importação" | "investimento";
  ticker?: string;
  quantity?: number;
  // Legacy fields
  category_name?: string;
  categoryName?: string;
  category_group?: string;
  userId?: string;
  userName?: string;
  organizationId?: string;
  created_by?: string;
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
  kingdom_id?: string;
  user_id?: string;
  ticker?: string;
  type: string;
  quantity?: number;
  price?: number;
  total?: number;
  investment_category_id?: string; // FACERO
  date?: string;
  created_at?: string;
  // Keep legacy fields for backward compatibility during transition
  segment?: string;
  value?: number;
  invested_value?: number;
  operation_date?: string;
  targetPercent?: number;
  faceroType?: "F" | "A" | "C" | "E" | "R" | "O";
  userId?: string;
  userName?: string;
  organizationId?: string;
  created_by?: string;
  average_cost?: number;
  categoryName?: string;
}

// --- SAAS INTERFACES ---

export type Role = "superadmin" | "admin" | "manager" | "user" | "viewer";

export interface Organization {
  orgId: string;
  name: string;
  plan: "basic" | "pro" | "business" | "enterprise";
  maxUsers: number;
  createdAt: string;
  status: "active" | "inactive" | "suspended";
}

export interface CategoryEntity {
  id: string;
  user_id: string;
  name: string;
  group_id: string;
  is_active: boolean;
  flow_type: 'income' | 'expense';
  group_type: 'fixed' | 'variable';
  rpg_group: string;
  allowed_profiles: string[];
  icon: string;
  color: string;
  rpg_theme_name: string;
  kingdom_id: string;
  created_by: string;
  created_at: Date | any;
  updated_at?: Date | any;
}

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  mentor_selected?: string;
  level: number;
  xp: number;
  title?: string;
  created_at: Date | any; // Using any for Firestore Timestamp compatibility
  avatarUrl?: string;
}

export interface AppUser {
  id: string;
  nome: string;
  email: string;
  created_at: string;
  // Legacy fields
  userId?: string;
  organizationId?: string;
  role?: Role;
  name?: string;
  avatarUrl?: string;
  createdAt?: string;
  status?: "active" | "inactive";
}

export interface Subscription {
  subscriptionId: string;
  organizationId: string;
  plan: "basic" | "pro" | "business" | "enterprise";
  billingCycle: "monthly" | "yearly";
  status: "active" | "trial" | "past_due" | "cancelled";
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
  type: "villain" | "boss";
  requiredInvestment: number;
  image: string;
  difficulty: "easy" | "medium" | "hard" | "epic" | "legendary";
  reward: string;
}

// --- FIM SAAS INTERFACES ---

export interface BudgetProgress {
  category_id: string;
  category_name: string;
  rpg_group: string;
  icon: string;
  color: string;
  rpg_theme_name: string;
  flow_type: 'income' | 'expense';
  orcado: number;
  gasto_real: number;
  previsto: number;
  progresso: number;
  status: 'controle mantido' | 'orçamento excedido';
  xp_reward: number;
  conquista: string | null;
}

// Interface para os atributos do sistema F.A.C.E.R.O.
export interface FaceroStats {
  F: number; // Festim  (Renda Passiva)
  A: number; // Arcano  (Ações/RV)
  C: number; // Cache   (Cripto/Opções)
  E: number; // Exodia  (Exterior)
  R: number; // Reaver  (Renda Fixa)
  O: number; // Órbit   (Oportunidades/Caixa)
}

// Arquétipos (Classes de Herói) disponíveis
export type Archetype =
  | "Paladino"
  | "Mago"
  | "Dwarf"
  | "Elfo"
  | "Ladino"
  | "Hobbit"
  | "Iniciante";

// Interface para o estado global do jogo do usuário
export interface UserGameState {
  level: number;
  xp: number;
  nextLevelXp: number;
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

export type AccountStatus = "pending" | "paid" | "overdue" | "cancelled";
export type ReceivableStatus =
  | "pending"
  | "received"
  | "defaulted"
  | "cancelled";
export type InvoiceStatus = "open" | "closed" | "paid" | "overdue";

export interface AccountPayable {
  id: string;
  kingdom_id?: string;
  type?: "payable" | "receivable";
  description: string;
  amount: number;
  category_id: string;
  due_date?: string;
  status?: "pendente" | "pago" | "atrasado";
  isRecurring?: boolean;
  recurrenceRule?: string;
  nextRecurrenceDate?: string;
  // Keep legacy fields for backward compatibility
  userId?: string;
  userName?: string;
  paymentMethod?: string;
  creditCardId?: string;
  installments?: number;
  currentInstallment?: number;
  createdAt?: string;
  paidAt?: string;
  transactionId?: string;
  created_by?: string;
  dueDate?: string; // Legacy
  categoryName?: string;
}

export interface AccountReceivable {
  id: string;
  kingdom_id?: string;
  type?: "payable" | "receivable";
  description: string;
  amount: number;
  category_id: string;
  due_date?: string;
  status?: "pendente" | "recebido" | "atrasado" | "inadimplente";
  isRecurring?: boolean;
  recurrenceRule?: string;
  nextRecurrenceDate?: string;
  // Keep legacy fields for backward compatibility
  userId?: string;
  userName?: string;
  payer?: string;
  createdAt?: string;
  receivedAt?: string;
  transactionId?: string;
  created_by?: string;
  dueDate?: string; // Legacy
  categoryName?: string;
}

export interface CreditCard {
  id: string;
  kingdom_id: string;
  name: string;
  closing_day: number;
  due_day: number;
  created_at: string;
  // Legacy fields
  userId?: string;
  limit?: number;
  category_id?: string;
  categoryName?: string;
  created_by?: string;
}

export interface CreditCardInvoice {
  id: string;
  kingdom_id: string;
  card_id: string;
  month: string; // YYYY-MM
  total_amount: number;
  status: "open" | "paid" | "overdue";
  // Legacy fields
  userId?: string;
  year?: number;
  closingDate?: string;
  dueDate?: string;
  createdAt?: string;
  paidAt?: string;
  transactionId?: string;
  created_by?: string;
}

// --- FIM NOVAS INTERFACES ---

export interface Budget {
  id: string;
  kingdom_id: string;
  category_id: string;
  quantidade?: number;
  mês?: string; // YYYY-MM
  budget_amount?: number;
  user_id?: string;
  created_by?: string;
  created_at?: any;
  updated_at?: any;
  // Legacy fields
  amount?: number;
  month?: string;
  categoryName?: string;
}

export type BudgetEntity = Budget;

export interface InvestmentCategory {
  id: string;
  name: string;
}

export interface ContributionPlanning {
  id: string;
  kingdom_id: string;
  percentages: {
    F: number;
    A: number;
    C: number;
    E: number;
    R: number;
    O: number;
  };
  created_at?: any;
  updated_at?: any;
}

export interface InvestmentProvent {
  id: string;
  kingdom_id: string;
  ticker: string;
  quantity: number;
  price: number;
  dy: number;
  yoc: number;
  date: string;
}

export interface Mentor {
  id: string;
  name: string;
  facero_id: string;
  theme_id: string;
  character_class: string;
  race: string;
  strategy: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
}

export interface Villain {
  id: string;
  name: string;
  related_group_id?: string;
  related_facero_id?: string;
  theme_id: string;
  difficulty: number;
  target_value: number;
  created_at: string;
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
