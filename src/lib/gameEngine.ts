// lib/gameEngine.ts

import { doc, getDoc, updateDoc } from 'firebase/firestore';
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

export function calculatePlayerLevel(xp: number): GameState {
  // Base formula: Level = sqrt(XP / 100)
  // Or simpler: each level requires level * 100 XP
  // Let's use a simple progressive scale
  let level = 1;
  let xpRequired = 100;
  let currentXp = xp;

  while (currentXp >= xpRequired) {
    currentXp -= xpRequired;
    level++;
    xpRequired = level * 100;
  }

  // Find the appropriate title
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
    title
  };
}

export async function addXP(userId: string, xpToAdd: number) {
  if (xpToAdd <= 0) return;
  
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const userData = userSnap.data();
    const currentXp = userData.xp || 0;
    const newXp = currentXp + xpToAdd;
    const newState = calculatePlayerLevel(newXp);
    
    await updateDoc(userRef, {
      xp: newXp,
      level: newState.level,
      title: newState.title,
      lastActivityDate: new Date()
    });
  }
}

export function calculateXPFromBudgetControl(planned: number, actual: number): number {
  if (planned === 0) return 0;
  
  // Se gastou menos ou igual ao planejado, ganha XP
  if (actual <= planned) {
    return 50; // Bônus por cumprir o orçamento
  }
  
  // Se gastou mais, ganha menos XP ou zero
  const overspendRatio = (actual - planned) / planned;
  if (overspendRatio < 0.1) return 25; // Passou um pouco
  if (overspendRatio < 0.2) return 10; // Passou moderadamente
  return 0; // Estourou muito o orçamento
}

export function calculateXPFromInvestments(amount: number): number {
  // Ganha XP proporcional ao valor investido (ex: 1 XP a cada R$ 100)
  return Math.floor(amount / 100) * 10; // 10 XP a cada R$ 100
}

export function calculateXPFromConsistency(daysActive: number): number {
  // Bônus por dias seguidos usando o app
  return daysActive * 5;
}
