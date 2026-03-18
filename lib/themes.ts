/**
 * Configuração de Temas: Define as paletas de cores para cada arquétipo de herói.
 * Utiliza classes do Tailwind CSS para facilitar a aplicação dinâmica de estilos.
 */

// Tipos de temas disponíveis
export type ThemeType = 'festim' | 'arcano' | 'cache' | 'exodia' | 'reaver' | 'orbit' | 'default';

// Interface que define as propriedades de cor de cada tema
export interface ThemeColors {
  primary: string;   // Cor principal (botões, destaques fortes)
  secondary: string; // Cor secundária (fundos de balões, badges)
  accent: string;    // Cor de destaque (texto colorido, ícones ativos)
  bg: string;        // Cor de fundo da página
  text: string;      // Cor do texto principal
  card: string;      // Cor de fundo dos cartões
  border: string;    // Cor das bordas
  shadow: string;    // Cor das sombras
}

// Definição das paletas de cores para cada tema
export const THEMES: Record<ThemeType, ThemeColors> = {
  festim: {
    primary: 'bg-amber-600',
    secondary: 'bg-amber-50',
    accent: 'text-amber-600',
    bg: 'bg-amber-50/30',
    text: 'text-amber-900',
    card: 'bg-white',
    border: 'border-amber-100',
    shadow: 'shadow-amber-100',
  },
  arcano: {
    primary: 'bg-purple-600',
    secondary: 'bg-purple-50',
    accent: 'text-purple-600',
    bg: 'bg-purple-50/30',
    text: 'text-purple-900',
    card: 'bg-white',
    border: 'border-purple-100',
    shadow: 'shadow-purple-100',
  },
  cache: {
    primary: 'bg-emerald-600',
    secondary: 'bg-emerald-50',
    accent: 'text-emerald-600',
    bg: 'bg-emerald-50/30',
    text: 'text-emerald-900',
    card: 'bg-white',
    border: 'border-emerald-100',
    shadow: 'shadow-emerald-100',
  },
  exodia: {
    primary: 'bg-blue-600',
    secondary: 'bg-blue-50',
    accent: 'text-blue-600',
    bg: 'bg-blue-50/30',
    text: 'text-blue-900',
    card: 'bg-white',
    border: 'border-blue-100',
    shadow: 'shadow-blue-100',
  },
  reaver: {
    primary: 'bg-slate-700',
    secondary: 'bg-slate-50',
    accent: 'text-slate-700',
    bg: 'bg-slate-50/30',
    text: 'text-slate-900',
    card: 'bg-white',
    border: 'border-slate-200',
    shadow: 'shadow-slate-100',
  },
  orbit: {
    primary: 'bg-rose-600',
    secondary: 'bg-rose-50',
    accent: 'text-rose-600',
    bg: 'bg-rose-50/30',
    text: 'text-rose-900',
    card: 'bg-white',
    border: 'border-rose-100',
    shadow: 'shadow-rose-100',
  },
  default: {
    primary: 'bg-emerald-600',
    secondary: 'bg-emerald-50',
    accent: 'text-emerald-600',
    bg: 'bg-gray-50',
    text: 'text-gray-900',
    card: 'bg-white',
    border: 'border-gray-100',
    shadow: 'shadow-gray-100',
  }
};

// Mapeamento entre o nome do arquétipo (classe RPG) e a chave do tema
export const ARCHETYPE_THEME_MAP: Record<string, ThemeType> = {
  'Paladino': 'festim',
  'Mago': 'arcano',
  'Dwarf': 'cache',
  'Elfo': 'exodia',
  'Ladino': 'reaver',
  'Hobbit': 'orbit',
  'Iniciante': 'default'
};
