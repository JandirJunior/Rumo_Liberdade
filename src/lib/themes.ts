export type ThemeType = 'FESTIM' | 'ARCANO' | 'CACHE' | 'EXODIA' | 'REAVER' | 'ORBITA' | 'default';

export const THEMES: Record<ThemeType, any> = {
  FESTIM: { primary: '#D4AF37', accent: '#F5DEB3', bg: 'bg-[#0B0B0B]', shadow: 'shadow-[#D4AF37]/20', border: 'border-[#D4AF37]' },
  ARCANO: { primary: '#5B21B6', accent: '#1E3A8A', bg: 'bg-[#0B0B0B]', shadow: 'shadow-[#5B21B6]/20', border: 'border-[#5B21B6]' },
  CACHE: { primary: '#3A5A40', accent: '#6B4F3A', bg: 'bg-[#0B0B0B]', shadow: 'shadow-[#3A5A40]/20', border: 'border-[#3A5A40]' },
  EXODIA: { primary: '#60A5FA', accent: '#E5E7EB', bg: 'bg-[#0B0B0B]', shadow: 'shadow-[#60A5FA]/20', border: 'border-[#60A5FA]' },
  REAVER: { primary: '#0B0B0B', accent: '#1F2937', bg: 'bg-[#0B0B0B]', shadow: 'shadow-[#1F2937]/20', border: 'border-[#1F2937]' },
  ORBITA: { primary: '#7F1D1D', accent: '#581C1C', bg: 'bg-[#0B0B0B]', shadow: 'shadow-[#7F1D1D]/20', border: 'border-[#7F1D1D]' },
  default: { primary: '#D4AF37', accent: '#F5DEB3', bg: 'bg-[#0B0B0B]', shadow: 'shadow-[#D4AF37]/20', border: 'border-[#D4AF37]' },
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
  document.documentElement.style.setProperty('--color-primary', theme.primary);
  document.documentElement.style.setProperty('--color-accent', theme.accent);
}
