export const FINANCIAL_VILLAINS = [
  {
    id: 'goblin',
    name: 'Goblin do Impulso',
    title: 'O Pequeno Gastador',
    description: 'Um vilão que te tenta a gastar com pequenas coisas desnecessárias.',
    hp: 1000,
    rewardXP: 100,
    weakness: 'Planejamento',
    victoryCondition: 'Manter o orçamento'
  }
];

export function calculateVillainDamage(playerPower: number, index: number): number {
  return playerPower * 0.1 * index;
}
