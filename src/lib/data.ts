
/**
 * 📦 data.ts
 * Centraliza dados mockados e constantes do sistema
 */


import { UserGameState } from '@/types';
export const MOCK_GAME_STATE: UserGameState = {
  level: 1,
  xp: 0,
  archetype: 'Iniciante',
  stats: { F: 1, A: 2, C: 3, E: 4, R: 5, O: 6 },
  completedQuests: [],
};

// =========================
// 🎯 GOALS (METAS)
// =========================

export const MOCK_GOALS = [
  {
    id: '1',
    title: 'Criar fundo de emergência',
    description: 'Guardar R$ 1.000',
    completed: false
  },
  {
    id: '2',
    title: 'Investir em ações',
    description: 'Fazer primeiro aporte',
    completed: false
  }
];

// =========================
// 🧙 ARCHETYPES (CLASSES RPG)
// =========================

export const ARCHETYPE_IMAGES: Record<string, string> = {
  Paladino:   '/assets/classes/paladino.webp',
  Mago:       '/assets/classes/mago.webp',
  Arqueiro:   '/assets/classes/arqueiro.webp',
  Guerreiro:  '/assets/classes/guerreiro.webp',
  Ladino:     '/assets/classes/ladino.webp'
};

// =========================
// 👹 VILÕES
// =========================

export const VILLAIN_IMAGES: Record<string, string> = {
  default: '/assets/villains/villain_001.webp'
};
