import { IMAGES } from '@/assets/images';

/**
 * 🎨 Sistema de Temas Medieval (Diablo Style)
 */

export type ThemeType =
  | 'FESTIM'
  | 'ARCANO'
  | 'CACHE'
  | 'EXODIA'
  | 'REAVER'
  | 'ORBITA';

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
    primary: '#D4AF37', // Dourado
    accent: '#F5DEB3', // Trigo
    bgDark: '#F5F2ED', // Papel Envelhecido
    bgPanel: '#FFFFFF',
    bgOverlay: 'rgba(255,255,255,0.6)',
    border: '#D4AF37',
    textMain: '#1A1005',
    textMuted: '#78350F',
    shadow: 'rgba(212,175,55,0.1)',
    glow: '0 0 10px rgba(212,175,55,0.3)',
    texture: IMAGES.TEXTURE_PARCHMENT,
  },

  ARCANO: {
    primary: '#7C3AED', // Roxo
    accent: '#3B82F6', // Azul Chamativo
    bgDark: '#050510', // Azul Escuro Quase Preto
    bgPanel: '#0F0F25',
    bgOverlay: 'rgba(0,0,0,0.7)',
    border: '#312E81',
    textMain: '#F5F3FF',
    textMuted: '#A78BFA',
    shadow: 'rgba(124,58,237,0.3)',
    glow: '0 0 20px rgba(124,58,237,0.6)',
    // sem textura: fundo escuro liso
  },

  CACHE: {
    primary: '#065F46', // Verde Musgo
    accent: '#3E2723', // Café
    bgDark: '#1B1B05', // Terra / Dark
    bgPanel: '#2D2D0A',
    bgOverlay: 'rgba(0,0,0,0.7)',
    border: '#064E3B',
    textMain: '#ECFDF5',
    textMuted: '#6EE7B7',
    shadow: 'rgba(6,95,70,0.3)',
    glow: '0 0 15px rgba(16,185,129,0.5)',
  },

  EXODIA: {
    primary: '#3B82F6', // Azul Claro
    accent: '#94A3B8', // Cinza Metálico
    bgDark: '#F8FAFC', // Branco / Claro
    bgPanel: '#FFFFFF',
    bgOverlay: 'rgba(255,255,255,0.5)',
    border: '#3B82F6',
    textMain: '#0F172A',
    textMuted: '#64748B',
    shadow: 'rgba(59,130,246,0.1)',
    glow: '0 0 10px rgba(59,130,246,0.3)',
  },

  REAVER: {
    primary: '#991B1B', // Vermelho
    accent: '#4B5563', // Cinza Escuro
    bgDark: '#050505', // Preto
    bgPanel: '#111111',
    bgOverlay: 'rgba(0,0,0,0.8)',
    border: '#2A2A2A',
    textMain: '#E5E7EB',
    textMuted: '#9CA3AF',
    shadow: 'rgba(0,0,0,0.6)',
    glow: '0 0 15px rgba(220,38,38,0.5)',
  },

  ORBITA: {
    primary: '#7F1D1D', // Vermelho
    accent: '#065F46', // Verde
    bgDark: '#F5F2ED', // Papel Envelhecido
    bgPanel: '#FFFFFF',
    bgOverlay: 'rgba(255,255,255,0.6)',
    border: '#7F1D1D',
    textMain: '#1A1005',
    textMuted: '#7F1D1D',
    shadow: 'rgba(127,29,29,0.1)',
    glow: '0 0 10px rgba(127,29,29,0.3)',
    texture: IMAGES.TEXTURE_PARCHMENT,
  },

};

export const ARCHETYPE_THEME_MAP: Record<string, ThemeType> = {
  Paladino: 'FESTIM',
  Mago: 'ARCANO',
  Dwarf: 'CACHE',
  Elfo: 'EXODIA',
  Ladino: 'REAVER',
  Hobbit: 'ORBITA',
  Iniciante: 'ORBITA',
};

export function applyTheme(themeName: ThemeType) {
  if (typeof document === 'undefined') return;

  const theme = THEMES[themeName] || THEMES.ORBITA;
  const root = document.documentElement;

  Object.entries(theme).forEach(([key, value]) => {
    if (key === 'texture') {
      if (!value || value === 'none') {
        root.style.setProperty('--bg-texture', 'none');
      } else {
        root.style.setProperty('--bg-texture', `url(${value})`);
      }
      return;
    }

    if (value === undefined || value === null) return;

    // Converte camelCase para kebab-case (ex: bgDark -> bg-dark)
    const cssVarName = key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    root.style.setProperty(`--color-${cssVarName}`, value);
  });

  // Caso a propriedade texture não exista no tema, garanta reset para evitar traces de tema anterior
  if (theme.texture === undefined) {
    root.style.setProperty('--bg-texture', 'none');
  }
}
