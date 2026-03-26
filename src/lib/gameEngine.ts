/**
 * 🎮 gameEngine.ts
 *
 * RESPONSÁVEL:
 * - Cálculo de XP
 * - Progressão de nível
 * - Títulos RPG
 *
 * REGRAS:
 * ❗ Não duplicar lógica de XP fora deste arquivo
 * ❗ Sempre usar funções centralizadas
 */

import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';

export interface GameState {
  level: number;
  xp: number;
  nextLevelXp: number;
  title: string;
}

export const TITLES = [
  { level: 1, title: 'Aprendiz das Moedas' },
  { level: 3, title: 'Mercador' },
  { level: 5, title: 'Guardião do Tesouro' },
  { level: 10, title: 'Mestre da Moeda' },
  { level: 25, title: 'Lenda Financeira' }
];

/**
 * 🧠 Calcula nível baseado no XP (HERÓI - DIFÍCIL)
 * Progressão: cada nível exige (nível * 100.000) XP adicional acumulado
 * Ex: Nível 1: 0, Nível 2: 100.000, Nível 3: 300.000, Nível 4: 600.000, Nível 5: 1.000.000
 */
export function calculatePlayerLevel(xp: number): GameState {
  let level = 1;
  let totalXpForNextLevel = 100000000; // Nível 2 exige 100M XP (MUITO DIFÍCIL)

  while (xp >= totalXpForNextLevel) {
    level++;
    totalXpForNextLevel += level * 100000000; // Progressão geométrica extremamente difícil
  }

  let title = TITLES[0].title;

  for (let i = TITLES.length - 1; i >= 0; i--) {
    if (level >= TITLES[i].level) {
      title = TITLES[i].title;
      break;
    }
  }

  return { 
    level, 
    xp, 
    nextLevelXp: totalXpForNextLevel,
    title 
  };
}

/**
 * 🏰 Calcula nível do REINO (MAIS FÁCIL)
 * Progressão: cada nível exige (nível * 5000) XP adicional acumulado
 */
export function calculateKingdomLevel(xp: number): GameState {
  let level = 1;
  let totalXpForNextLevel = 50000000; // Nível 2 exige 50M XP

  while (xp >= totalXpForNextLevel) {
    level++;
    totalXpForNextLevel += level * 50000000;
  }

  return { 
    level, 
    xp, 
    nextLevelXp: totalXpForNextLevel,
    title: '' 
  };
}

/**
 * ⚡ Calcula XP de uma ação financeira (transação, pagamento, recebimento)
 * Padronizado: 10 XP base + 1 XP a cada R$ 10
 */
export function calculateXPFromAction(amount: number): number {
  return 10 + Math.floor(Math.abs(amount) / 10);
}

/**
 * ⚡ Adiciona XP com segurança (TRANSACTION)
 */
export async function addXP(userId: string, xpToAdd: number) {
  if (!userId || xpToAdd <= 0) return;

  const userRef = doc(db, 'users', userId);

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);

    if (!userSnap.exists()) {
      throw new Error('Usuário não encontrado ao adicionar XP');
    }

    const currentXp = userSnap.data().xp || 0;
    const newXp = currentXp + xpToAdd;

    const newState = calculatePlayerLevel(newXp);

    transaction.update(userRef, {
      xp: newXp,
      level: newState.level,
      title: newState.title,
      lastActivityDate: serverTimestamp()
    });
  });
}

/**
 * 💰 XP por controle de orçamento
 */
export function calculateXPFromBudgetControl(planned: number, actual: number): number {
  if (planned <= 0) return 0;

  if (actual <= planned) return 50;

  const overspendRatio = (actual - planned) / planned;

  if (overspendRatio < 0.1) return 25;
  if (overspendRatio < 0.2) return 10;

  return 0;
}

/**
 * 📈 XP por investimentos
 * ✔ PADRONIZADO: 1 XP por cada R$1 investido + 10 XP por cada unidade
 */
export function calculateXPFromInvestments(amount: number, quantity: number = 0): number {
  const xpFromAmount = Math.floor(amount * 1);
  const xpFromQuantity = Math.floor(quantity * 10);
  return xpFromAmount + xpFromQuantity;
}

/**
 * 🏰 Calcula XP total de uma lista de ativos
 */
export function calculateTotalXPFromAssets(assets: any[]): number {
  return assets.reduce((acc, asset) => {
    const amount = Number(asset.invested_value || asset.value || asset.total || 0);
    const quantity = Number(asset.quantity || 0);
    return acc + calculateXPFromInvestments(amount, quantity);
  }, 0);
}

/**
 * 🔥 XP por consistência
 */
export function calculateXPFromConsistency(daysActive: number): number {
  return Math.max(0, daysActive * 5);
}