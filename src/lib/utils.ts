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