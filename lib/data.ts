/**
 * Dados Mockados: Fornece dados de exemplo para popular a interface durante o desenvolvimento.
 * Inclui metas, perfil financeiro, ativos, estado do jogo, orçamento e transações.
 * Também define as imagens dos monstros e dos arquétipos.
 */
import { Transaction, Goal, Asset, FinancialProfile, UserGameState, MonthlyBudget } from './types';
import { IMAGES, ImageKey } from '@/src/assets/images';

// Lista de metas financeiras progressivas (Quests de Investimento)
export const MOCK_GOALS: Goal[] = [
  { id: 1, title: '5000 Investidos', target: 5000, completed: true },
  { id: 2, title: '10000 Investidos', target: 10000, completed: true },
  { id: 3, title: '15000 Investidos', target: 15000, completed: true },
  { id: 4, title: '25000 Investidos', target: 25000, completed: true },
  { id: 5, title: '50000 Investidos', target: 50000, completed: true },
  { id: 6, title: '100000 Investidos', target: 100000, completed: true },
  { id: 7, title: '250000 Investidos', target: 250000, completed: false },
  { id: 8, title: '500000 Investidos', target: 500000, completed: false },
  { id: 9, title: '750000 Investidos', target: 750000, completed: false },
  { id: 10, title: '1000000 Investidos', target: 1000000, completed: false },
];

// Perfil financeiro base do usuário
export const MOCK_PROFILE: FinancialProfile = {
  monthlyIncome: {
    salario: 6000,
    mei: 6300,
    extras: 0,
    outros: 2000,
  },
  distributionRules: {
    fixed: 0.5,
    lifestyle: 0.25,
    investment: 0.2,
    emergency: 0.05,
  },
};

// Carteira de ativos (Investimentos Atuais) mapeados para o sistema F.A.C.E.R.O.
export const MOCK_ASSETS: Asset[] = [
  { id: '1', type: 'FIIs', segment: 'Tijolo', value: 45000, targetPercent: 0.45, faceroType: 'F', organizationId: 'mock_org' },
  { id: '2', type: 'Ações', segment: 'Dividendos', value: 30000, targetPercent: 0.30, faceroType: 'A', organizationId: 'mock_org' },
  { id: '3', type: 'Cripto', segment: 'BTC/ETH', value: 3000, targetPercent: 0.03, faceroType: 'C', organizationId: 'mock_org' },
  { id: '4', type: 'ETFs', segment: 'Global', value: 5000, targetPercent: 0.05, faceroType: 'E', organizationId: 'mock_org' },
  { id: '5', type: 'Renda Fixa', segment: 'CDI', value: 15000, targetPercent: 0.15, faceroType: 'R', organizationId: 'mock_org' },
  { id: '6', type: 'Outros', segment: 'Geral', value: 2000, targetPercent: 0.02, faceroType: 'O', organizationId: 'mock_org' },
];

// Estado inicial do jogo (Progresso do Herói)
export const MOCK_GAME_STATE: UserGameState = {
  level: 12,
  xp: 110000,
  archetype: 'Paladino',
  stats: {
    F: 8,
    A: 7,
    C: 3,
    E: 4,
    R: 9,
    O: 2
  },
  completedQuests: ['Dízimo do Herói']
};

// Orçamento mensal (Planejamento vs Realidade)
export const MOCK_BUDGET: MonthlyBudget = {
  income: [
    { name: 'Salário', planned: 6000, actual: 6000 },
    { name: 'MEI Serviços', planned: 5000, actual: 6300 },
    { name: 'Rendimentos', planned: 500, actual: 550 },
    { name: 'Outros', planned: 1000, actual: 2000 },
  ],
  expenses: [
    { name: 'Aluguel', planned: 2000, actual: 2000 },
    { name: 'Alimentação', planned: 2500, actual: 3000 },
    { name: 'Transporte', planned: 800, actual: 750 },
    { name: 'Lazer', planned: 1000, actual: 1200 },
    { name: 'Saúde', planned: 500, actual: 400 },
  ]
};

// Histórico de transações recentes
export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', description: 'Salário Mensal', amount: 6000, type: 'income', category: 'Fixed', date: '2024-03-01', organizationId: 'mock_org' },
  { id: '2', description: 'MEI Serviços', amount: 6300, type: 'income', category: 'Fixed', date: '2024-03-05', organizationId: 'mock_org' },
  { id: '3', description: 'Aluguel', amount: 2000, type: 'expense', category: 'Lifestyle', date: '2024-03-02', organizationId: 'mock_org' },
  { id: '4', description: 'Alimentação', amount: 3000, type: 'expense', category: 'Lifestyle', date: '2024-03-10', organizationId: 'mock_org' },
  { id: '5', description: 'Financiamento Imob.', amount: 1960, type: 'expense', category: 'Fixed', date: '2024-03-15', organizationId: 'mock_org' },
  { id: '6', description: 'Aporte FIIs', amount: 2000, type: 'investment', category: 'Investment', date: '2024-03-20', organizationId: 'mock_org' },
];

// Mapeamento de imagens personalizadas para cada arquétipo
export const ARCHETYPE_IMAGES: Record<string, ImageKey> = {
  'Paladino': 'FESTIN',
  'Mago': 'ARCANO',
  'Dwarf Minerador': 'CACHE',
  'Elfo': 'EXODIA',
  'Ladrão': 'REAVER',
  'Hobbit': 'ORBIT',
  'Iniciante': 'FESTIN'
};
