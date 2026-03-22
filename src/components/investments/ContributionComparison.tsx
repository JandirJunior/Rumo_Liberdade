'use client';

import { ContributionPlanning, Asset } from '@/types';
import { financialEngine } from '@/lib/financialEngine';
import { useMemo } from 'react';

interface ContributionComparisonProps {
  planning: ContributionPlanning | null;
  assets: Asset[];
}

export function ContributionComparison({ planning, assets }: ContributionComparisonProps) {
  const { aggregated } = useMemo(() => financialEngine.calculateInvestmentPower(assets || []), [assets]);

  if (!planning) return null;

  const currentAllocation = aggregated.reduce((acc, asset) => {
    const type = asset.faceroType as keyof typeof planning.percentages;
    if (type && planning.percentages[type] !== undefined) {
      acc[type] = (acc[type] || 0) + (asset.currentPercent * 100);
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-[var(--color-bg-panel)] p-6 rounded-3xl border border-[var(--color-border)] shadow-md space-y-4">
      <h3 className="text-xl font-bold text-[var(--color-text-main)]">Comparação FACERO</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(planning.percentages).map(([key, planned]) => (
          <div key={key} className="bg-[var(--color-bg-dark)] p-4 rounded-xl border border-[var(--color-border)]">
            <div className="text-sm text-[var(--color-text-muted)]">{key}</div>
            <div className="text-2xl font-bold text-[var(--color-primary)]">{planned}%</div>
            <div className="text-xs text-[var(--color-text-muted)]">Atual: {(currentAllocation[key] || 0).toFixed(1)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
