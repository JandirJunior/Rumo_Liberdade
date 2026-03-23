/**
 * 🔧 Utils globais
 */

// merge de classes
export function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// formatador de moeda
export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function getColorClass(value: number) {
  if (value < 0) return 'text-red-500';
  if (value > 0) return 'text-green-500';
  return 'text-[var(--color-text-main)]';
}
