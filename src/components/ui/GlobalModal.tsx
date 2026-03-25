'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useActionContext } from '@/context/ActionContext';
import { actionsRegistry } from '@/lib/actionsRegistry';
import { FormEngine } from '@/components/forms/FormEngine';
import { X } from 'lucide-react';

export function GlobalModal() {
  const { activeAction, closeAction } = useActionContext();
  const [activeTab, setActiveTab] = useState(0);

  // Reset tab when action changes
  // Removed useEffect that was causing cascading renders.
  // We will use the 'key' prop on FormEngine to force re-render when activeAction changes.

  if (!activeAction) return null;

  const actionDef = actionsRegistry[activeAction];
  if (!actionDef) return null;

  const getTabs = () => {
    if (activeAction === 'investimento_compra' || activeAction === 'investimento_venda') {
      return [
        { label: 'Comprar', action: 'investimento_compra' },
        { label: 'Vender', action: 'investimento_venda' }
      ];
    }
    if (activeAction === 'receita' || activeAction === 'despesa') {
      return [
        { label: 'Despesas', action: 'despesa' },
        { label: 'Receitas', action: 'receita' }
      ];
    }
    return null;
  };

  const tabs = getTabs();
  const currentActionKey = tabs ? tabs[activeTab].action : activeAction;
  const currentActionDef = actionsRegistry[currentActionKey!];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAction}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-[var(--color-bg-panel)] rounded-2xl shadow-2xl medieval-border"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-[var(--color-bg-panel)] p-6 border-b border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl medieval-title font-bold text-[var(--color-text-main)]">{currentActionDef.label}</h3>
              <button
                onClick={closeAction}
                className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-dark)] rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {tabs && (
              <div className="flex p-1 bg-[var(--color-bg-dark)] rounded-lg border border-[var(--color-border)]">
                {tabs.map((tab, index) => (
                  <button
                    key={tab.label}
                    onClick={() => setActiveTab(index)}
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${
                      activeTab === index
                        ? 'bg-[var(--color-primary)] text-[var(--color-bg-dark)]'
                        : 'text-[var(--color-text-main)] hover:bg-[var(--color-bg-panel)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Form Engine */}
          <FormEngine key={activeAction} actionKey={currentActionKey!} />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
