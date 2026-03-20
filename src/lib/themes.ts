export type ThemeType = 'default' | 'dark' | 'light';
export const THEMES: Record<ThemeType, any> = {
  default: { bg: 'bg-gray-100', primary: 'bg-indigo-600', shadow: 'shadow-indigo-500/20' },
  dark: { bg: 'bg-gray-900', primary: 'bg-indigo-500', shadow: 'shadow-indigo-500/20' },
  light: { bg: 'bg-white', primary: 'bg-indigo-600', shadow: 'shadow-indigo-500/20' },
};
export const ARCHETYPE_THEME_MAP: Record<string, ThemeType> = {
  Paladino: 'default',
  Mago: 'dark',
  Dwarf: 'default',
  Elfo: 'light',
  Ladino: 'default',
  Hobbit: 'light',
  Iniciante: 'default',
};
