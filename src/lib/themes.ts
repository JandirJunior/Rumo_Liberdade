/**
 * 🎨 Sistema de Temas Medieval (Diablo Style)
 */

export type ThemeType =
  | 'FESTIM'
  | 'ARCANO'
  | 'CACHE'
  | 'EXODIA'
  | 'REAVER'
  | 'ORBITA'
  | 'PAPER'
  | 'default';

export interface ThemeColors {
  primary: string;
  accent: string;

  bgDark: string;
  bgPanel: string;
  bgOverlay: string;

  border: string;

  textMain: string;
  textMuted: string;

  shadow: string;
  glow: string;

  texture?: string;
}

export const THEMES: Record<ThemeType, ThemeColors> = {
  FESTIM: {
    primary: '#D4AF37',
    accent: '#F5DEB3',
    bgDark: '#1A1005',
    bgPanel: '#2D1D0A',
    bgOverlay: 'rgba(0,0,0,0.6)',
    border: '#78350F',
    textMain: '#FFFBEB',
    textMuted: '#FBBF24',
    shadow: 'rgba(212,175,55,0.25)',
    glow: '0 0 20px rgba(212,175,55,0.6)',
    texture: '/textures/parchment.webp',
  },

  ARCANO: {
    primary: '#7C3AED',
    accent: '#C4B5FD',
    bgDark: '#0F0720',
    bgPanel: '#1E1035',
    bgOverlay: 'rgba(0,0,0,0.7)',
    border: '#312E81',
    textMain: '#F5F3FF',
    textMuted: '#A78BFA',
    shadow: 'rgba(124,58,237,0.3)',
    glow: '0 0 20px rgba(124,58,237,0.6)',
  },

  CACHE: {
    primary: '#065F46',
    accent: '#34D399',
    bgDark: '#061610',
    bgPanel: '#0D2A1F',
    bgOverlay: 'rgba(0,0,0,0.7)',
    border: '#064E3B',
    textMain: '#ECFDF5',
    textMuted: '#6EE7B7',
    shadow: 'rgba(6,95,70,0.3)',
    glow: '0 0 15px rgba(16,185,129,0.5)',
  },

  EXODIA: {
    primary: '#3B82F6',
    accent: '#93C5FD',
    bgDark: '#081225',
    bgPanel: '#0F1F3D',
    bgOverlay: 'rgba(0,0,0,0.5)',
    border: '#1E3A8A',
    textMain: '#EFF6FF',
    textMuted: '#60A5FA',
    shadow: 'rgba(59,130,246,0.3)',
    glow: '0 0 15px rgba(59,130,246,0.5)',
  },

  REAVER: {
    primary: '#991B1B',
    accent: '#DC2626',
    bgDark: '#050505',
    bgPanel: '#111111',
    bgOverlay: 'rgba(0,0,0,0.8)',
    border: '#2A2A2A',
    textMain: '#E5E7EB',
    textMuted: '#9CA3AF',
    shadow: 'rgba(0,0,0,0.6)',
    glow: '0 0 15px rgba(220,38,38,0.5)',
  },

  ORBITA: {
    primary: '#7F1D1D',
    accent: '#F87171',
    bgDark: '#110505',
    bgPanel: '#1F0A0A',
    bgOverlay: 'rgba(0,0,0,0.6)',
    border: '#7F1D1D',
    textMain: '#FEF2F2',
    textMuted: '#FCA5A5',
    shadow: 'rgba(127,29,29,0.4)',
    glow: '0 0 15px rgba(239,68,68,0.5)',
  },

  PAPER: {
    primary: '#5D4037',
    accent: '#8D6E63',
    bgDark: '#F5F2ED',
    bgPanel: '#FFFFFF',
    bgOverlay: 'rgba(255,255,255,0.5)',
    border: '#D7CCC8',
    textMain: '#3E2723',
    textMuted: '#795548',
    shadow: 'rgba(93,64,55,0.1)',
    glow: 'none',
    texture: '/textures/paper.webp',
  },

  default: {
    primary: '#F59E0B',
    accent: '#FCD34D',
    bgDark: '#1A1005',
    bgPanel: '#2D1D0A',
    bgOverlay: 'rgba(0,0,0,0.6)',
    border: '#78350F',
    textMain: '#FFFBEB',
    textMuted: '#FBBF24',
    shadow: 'rgba(245,158,11,0.2)',
    glow: '0 0 20px rgba(245,158,11,0.6)',
  },
};

export const ARCHETYPE_THEME_MAP: Record<string, ThemeType> = {
  Paladino: 'FESTIM',
  Mago: 'ARCANO',
  Dwarf: 'CACHE',
  Elfo: 'EXODIA',
  Ladino: 'REAVER',
  Hobbit: 'ORBITA',
  Iniciante: 'default',
};

export function applyTheme(themeName: ThemeType) {
  if (typeof document === 'undefined') return;

  const theme = THEMES[themeName] || THEMES.default;
  const root = document.documentElement;

  Object.entries(theme).forEach(([key, value]) => {
    if (!value) return;
    root.style.setProperty(`--color-${key}`, value);
  });

  if (theme.texture) {
    root.style.setProperty('--bg-texture', `url(${theme.texture})`);
  }
}
