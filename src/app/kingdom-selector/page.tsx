'use client';

import { KingdomSelector } from '@/components/kingdom/KingdomSelector';

export default function KingdomSelectorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-dark)]">
      <KingdomSelector />
    </div>
  );
}
