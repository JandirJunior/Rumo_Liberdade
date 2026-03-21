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
  title: string;
}

export const TITLES = [
  { level: 1, title: 'Aprendiz das Moedas' },
  { level: 5, title: 'Mercador' },
  { level: 10, title: 'Mestre da Moeda' },
  { level: 20, title: 'Guardião do Tesouro' },
  { level: 50, title: 'Lenda Financeira' }
];

/**
 * 🧠 Calcula nível baseado no XP
 */
export function calculatePlayerLevel(xp: number): GameState {
  let level = 1;
  let xpRequired = 100;
  let remainingXp = xp;

  while (remainingXp >= xpRequired) {
    remainingXp -= xpRequired;
    level++;
    xpRequired = level * 100;
  }

  let title = TITLES[0].title;

  for (let i = TITLES.length - 1; i >= 0; i--) {
    if (level >= TITLES[i].level) {
      title = TITLES[i].title;
      break;
    }
  }

  return { level, xp, title };
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
 * ✔ PADRONIZADO: 10 XP a cada R$100
 */
export function calculateXPFromInvestments(amount: number): number {
  return Math.floor(amount / 100) * 10;
}

/**
 * 🔥 XP por consistência
 */
export function calculateXPFromConsistency(daysActive: number): number {
  return Math.max(0, daysActive * 5);
}