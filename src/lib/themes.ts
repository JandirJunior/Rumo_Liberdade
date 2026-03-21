export type ThemeType = 'FESTIM' | 'ARCANO' | 'CACHE' | 'EXODIA' | 'REAVER' | 'ORBITA' | 'PAPER' | 'default';

export interface ThemeColors {
  primary: string;
  accent: string;
  bgDark: string;
  bgPanel: string;
  border: string;
  textMain: string;
  textMuted: string;
  shadow: string;
}

export const THEMES: Record<ThemeType, ThemeColors> = {
  FESTIM: { 
    primary: '#F59E0B', 
    accent: '#FCD34D', 
    bgDark: '#1A1005', 
    bgPanel: '#2D1D0A', 
    border: '#78350F', 
    textMain: '#FFFBEB', 
    textMuted: '#FBBF24',
    shadow: 'rgba(245, 158, 11, 0.2)' 
  },
  ARCANO: { 
    primary: '#8B5CF6', 
    accent: '#C4B5FD', 
    bgDark: '#0F0720', 
    bgPanel: '#1E1035', 
    border: '#312E81', 
    textMain: '#F5F3FF', 
    textMuted: '#A78BFA',
    shadow: 'rgba(139, 92, 246, 0.2)' 
  },
  CACHE: { 
    primary: '#10B981', 
    accent: '#6EE7B7', 
    bgDark: '#061610', 
    bgPanel: '#0D2A1F', 
    border: '#065F46', 
    textMain: '#ECFDF5', 
    textMuted: '#34D399',
    shadow: 'rgba(16, 185, 129, 0.2)' 
  },
  EXODIA: { 
    primary: '#3B82F6', 
    accent: '#93C5FD', 
    bgDark: '#081225', 
    bgPanel: '#0F1F3D', 
    border: '#1E3A8A', 
    textMain: '#EFF6FF', 
    textMuted: '#60A5FA',
    shadow: 'rgba(59, 130, 246, 0.2)' 
  },
  REAVER: { 
    primary: '#D4AF37', 
    accent: '#F5DEB3', 
    bgDark: '#0B0B0B', 
    bgPanel: '#1A1A1A', 
    border: '#333333', 
    textMain: '#E5E7EB', 
    textMuted: '#9CA3AF',
    shadow: 'rgba(212, 175, 55, 0.2)' 
  },
  ORBITA: { 
    primary: '#EF4444', 
    accent: '#FCA5A5', 
    bgDark: '#110505', 
    bgPanel: '#1F0A0A', 
    border: '#7F1D1D', 
    textMain: '#FEF2F2', 
    textMuted: '#F87171',
    shadow: 'rgba(239, 68, 68, 0.2)' 
  },
  PAPER: { 
    primary: '#5D4037', 
    accent: '#8D6E63', 
    bgDark: '#F5F2ED', 
    bgPanel: '#FFFFFF', 
    border: '#D7CCC8', 
    textMain: '#3E2723', 
    textMuted: '#795548',
    shadow: 'rgba(93, 64, 55, 0.1)' 
  },
  default: { 
    primary: '#F59E0B', 
    accent: '#FCD34D', 
    bgDark: '#1A1005', 
    bgPanel: '#2D1D0A', 
    border: '#78350F', 
    textMain: '#FFFBEB', 
    textMuted: '#FBBF24',
    shadow: 'rgba(245, 158, 11, 0.2)' 
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
  root.style.setProperty('--color-primary', theme.primary);
  root.style.setProperty('--color-accent', theme.accent);
  root.style.setProperty('--color-bg-dark', theme.bgDark);
  root.style.setProperty('--color-bg-panel', theme.bgPanel);
  root.style.setProperty('--color-border', theme.border);
  root.style.setProperty('--color-text-main', theme.textMain);
  root.style.setProperty('--color-text-muted', theme.textMuted);
}
