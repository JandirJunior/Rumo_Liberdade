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

/**
 * Safely stringifies an object by removing circular references.
 */
export function safeStringify(obj: any): string {
  const cache = new Set();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) {
        return; // Circular reference found, discard key
      }
      cache.add(value);
    }
    return value;
  });
}
