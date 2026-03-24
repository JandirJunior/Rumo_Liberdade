'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ContributionPlanning } from '@/types';

interface PlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (percentages: { F: number; A: number; C: number; E: number; R: number; O: number }) => void;
  initialPlanning: ContributionPlanning | null;
}

export function PlanningModal({ isOpen, onClose, onSave, initialPlanning }: PlanningModalProps) {
  const [percentages, setPercentages] = useState(initialPlanning?.percentages || { F: 0, A: 0, C: 0, E: 0, R: 0, O: 0 });

  useEffect(() => {
    if (initialPlanning?.percentages) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPercentages(initialPlanning.percentages);
    }
  }, [initialPlanning]);

  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    const total = Object.values(percentages).reduce((a, b) => a + b, 0);
    if (total !== 100) {
      setError('A soma das porcentagens deve ser exatamente 100%.');
      return;
    }
    setError(null);
    onSave(percentages);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Planejamento de Aporte">
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-900/20 border border-red-900/50 text-red-400 text-xs font-bold rounded-xl">
            {error}
          </div>
        )}
        {Object.entries(percentages).map(([key, value]) => {
          const labels = {
            F: 'FUNDOS IMOBILIÁRIOS',
            A: 'AÇÕES',
            C: 'CRIPTO ATIVOS',
            E: 'EXTERIOR ETF',
            R: 'RENDA FIXA',
            O: 'OPORTUNIDADES OUTROS INVESTIMENTOS'
          };
          return (
            <div key={key} className="flex items-center gap-4">
              <label className="w-40 font-bold text-[var(--color-text-main)] text-sm">{labels[key as keyof typeof labels]}</label>
              <input
                type="number"
                value={value}
                onChange={(e) => setPercentages({ ...percentages, [key]: parseFloat(e.target.value) })}
                className="flex-1 px-4 py-2 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all font-medium text-[var(--color-text-main)]"
              />
              <span className="text-[var(--color-text-muted)]">%</span>
            </div>
          );
        })}
        <button
          onClick={handleSave}
          className="w-full py-3 bg-[var(--color-primary)] text-[var(--color-bg-dark)] font-bold rounded-xl shadow-lg hover:brightness-110 transition-all"
        >
          Salvar Planejamento
        </button>
      </div>
    </Modal>
  );
}
