
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
  Paladino:   'https://picsum.photos/seed/paladino/400/600',
  Mago:       'https://picsum.photos/seed/mago/400/600',
  Arqueiro:   'https://picsum.photos/seed/arqueiro/400/600',
  Guerreiro:  'https://picsum.photos/seed/guerreiro/400/600',
  Ladino:     'https://picsum.photos/seed/ladino/400/600',
  Dwarf:      'https://picsum.photos/seed/dwarf/400/600',
  Elfo:       'https://picsum.photos/seed/elfo/400/600',
  Hobbit:     'https://picsum.photos/seed/hobbit/400/600'
};

// =========================
// 👹 VILÕES
// =========================

export const VILLAIN_IMAGES: Record<string, string> = {
  default: 'https://picsum.photos/seed/villain/400/400'
};
