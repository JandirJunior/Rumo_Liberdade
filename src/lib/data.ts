
/**
 * 📦 data.ts
 * Centraliza dados mockados e constantes do sistema
 */


import { UserGameState } from '@/types';
export const MOCK_GAME_STATE: UserGameState = {
  level: 1,
  xp: 0,
  nextLevelXp: 1000,
  archetype: 'Iniciante',
  stats: { F: 1, A: 2, C: 3, E: 4, R: 5, O: 6 },
  completedQuests: [],
};

export const EMPTY_GAME_STATE: UserGameState = {
  level: 0,
  xp: 0,
  nextLevelXp: 0,
  archetype: 'Iniciante',
  stats: { F: 0, A: 0, C: 0, E: 0, R: 0, O: 0 },
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

import { IMAGES } from '@/assets/images';

// ... (rest of the file)

export const ARCHETYPE_IMAGES: Record<string, string> = {
  Paladino:   IMAGES.FESTIN,
  Mago:       IMAGES.ARCANO,
  Dwarf:      IMAGES.CACHE,
  Elfo:       IMAGES.EXODIA,
  Ladino:     IMAGES.REAVER,
  Hobbit:     IMAGES.ORBITA,
  Iniciante:  IMAGES.LOGIN
};

// =========================
// 👹 VILÕES
// =========================

export const VILLAIN_IMAGES: Record<string, string> = {
  V000: IMAGES.VILLAINS.V000,
  V001: IMAGES.VILLAINS.V001,
  V002: IMAGES.VILLAINS.V002,
  V003: IMAGES.VILLAINS.V003,
  default: IMAGES.VILLAINS.V000
};
