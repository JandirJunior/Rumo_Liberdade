/**
 * 🔧 Utils globais
 */

// merge de classes
export function cn(...classes: (string | undefined | null | false)[]) {
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
 * Safely stringifies an object by removing circular references and handling DOM elements.
 */
export function safeStringify(obj: any): string {
  const cache = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      // Handle DOM elements which often cause circular reference errors in React
      if (typeof window !== 'undefined' && value instanceof Node) {
        return `[DOM ${value.nodeName}]`;
      }

      if (cache.has(value)) {
        return '[Circular]'; // Return a placeholder instead of undefined for better debugging
      }
      cache.add(value);
    }
    return value;
  });
}
