export const FINANCIAL_VILLAINS = [
  {
    id: 'goblin',
    name: 'Goblin do Impulso',
    title: 'O Pequeno Gastador',
    description: 'Um vilão que te tenta a gastar com pequenas coisas desnecessárias. Ele se alimenta de gastos impulsivos.',
    hp: 1000,
    rewardXP: 100,
    weakness: 'Planejamento',
    victoryCondition: 'Manter o orçamento controlado'
  },
  {
    id: 'orc',
    name: 'Orc da Inflação',
    title: 'O Devorador de Poder de Compra',
    description: 'Este monstro reduz o valor do seu ouro. Para derrotá-lo, você precisa de investimentos que superem a inflação.',
    hp: 5000,
    rewardXP: 500,
    weakness: 'Ações e FIIs',
    victoryCondition: 'Ter mais de R$ 5.000,00 investidos'
  },
  {
    id: 'dragon',
    name: 'Dragão do Consumo',
    title: 'O Acumulador de Dívidas',
    description: 'Um dragão colossal que guarda montanhas de dívidas. Ele só pode ser ferido por um patrimônio líquido robusto.',
    hp: 25000,
    rewardXP: 2500,
    weakness: 'Patrimônio Líquido',
    victoryCondition: 'Patrimônio Líquido acima de R$ 25.000,00'
  },
  {
    id: 'lich',
    name: 'Lich dos Juros Compostos (Negativos)',
    title: 'O Mestre das Parcelas Infinitas',
    description: 'Um morto-vivo que drena sua mana através de juros de cartão de crédito e empréstimos.',
    hp: 100000,
    rewardXP: 10000,
    weakness: 'Liberdade Financeira',
    victoryCondition: 'Renda passiva mensal superior aos gastos'
  }
];

export function calculateVillainDamage(playerPower: number, index: number): number {
  // O dano aumenta com o poder do jogador, mas os vilões mais fortes exigem mais esforço
  const baseDamage = playerPower * 0.1;
  const difficultyMultiplier = 1 / (index + 1);
  return baseDamage * difficultyMultiplier * 10;
}
