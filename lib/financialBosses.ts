export interface FinancialBoss {
  id: string;
  name: string;
  title: string;
  description: string;
  hp: number;
  weakness: string;
  victoryCondition: string;
  rewardXP: number;
}

export const FINANCIAL_BOSSES: FinancialBoss[] = [
  {
    id: 'goblin_impulso',
    name: 'Goblin do Impulso',
    title: 'O Ladrão de Trocados',
    description: 'Representa compras impulsivas e pequenos gastos não planejados que corroem o orçamento.',
    hp: 1000,
    weakness: 'Planejamento e disciplina',
    victoryCondition: '3 meses consecutivos dentro do orçamento.',
    rewardXP: 500
  },
  {
    id: 'dragao_consumo',
    name: 'Dragão do Consumo',
    title: 'O Devorador de Renda',
    description: 'Representa gastos excessivos e estilo de vida inflacionado.',
    hp: 5000,
    weakness: 'Taxa de poupança alta',
    victoryCondition: 'Taxa de poupança acima de 20% por 3 meses.',
    rewardXP: 1500
  },
  {
    id: 'kraken_emergencia',
    name: 'Kraken da Emergência',
    title: 'O Terror dos Imprevistos',
    description: 'Representa a ausência de reserva de emergência, deixando o herói vulnerável a qualquer imprevisto.',
    hp: 10000,
    weakness: 'Reserva de Emergência',
    victoryCondition: 'Reserva equivalente a 6 meses de despesas.',
    rewardXP: 3000
  },
  {
    id: 'lich_dividas',
    name: 'Lich das Dívidas',
    title: 'O Sugador de Almas',
    description: 'Representa dívidas acumuladas e juros compostos negativos.',
    hp: 20000,
    weakness: 'Amortização agressiva',
    victoryCondition: 'Eliminação total das dívidas.',
    rewardXP: 5000
  },
  {
    id: 'tita_dependencia',
    name: 'Titã da Dependência',
    title: 'O Escravizador do Tempo',
    description: 'Representa dependência exclusiva do salário para sobreviver.',
    hp: 50000,
    weakness: 'Renda Passiva',
    victoryCondition: 'Renda passiva cobrindo ao menos 50% das despesas.',
    rewardXP: 10000
  }
];

export function calculateBossDamage(playerPower: number, bossDifficulty: number = 1): number {
  return playerPower / bossDifficulty;
}
