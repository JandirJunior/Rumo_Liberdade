'use client';

import React, { useState, useEffect } from 'react';
import { useActionContext } from '@/context/ActionContext';
import { actionsRegistry, ActionField } from '@/lib/actionsRegistry';
import { useKingdomData } from '@/contexts/KingdomContext';
import { useTheme } from '@/lib/ThemeContext';
import { X } from 'lucide-react';

export function FormEngine({ actionKey }: { actionKey: string }) {
  const { activeAction, actionData, closeAction } = useActionContext();
  const { categories, creditCards, addPayable, addReceivable, addCreditCard, updateCreditCard, addTransaction, addInvestment, addEarning, updateTransaction, updateInvestment, updatePayable, updateReceivable } = useKingdomData();
  const { gameMode } = useTheme();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const actionDef = actionsRegistry[actionKey];

  useEffect(() => {
    if (actionDef) {
      const initialData: Record<string, any> = {};
      actionDef.fields.forEach(field => {
        if (actionData && actionData[field.name] !== undefined) {
          initialData[field.name] = actionData[field.name];
        } else if (field.defaultValue !== undefined) {
          initialData[field.name] = field.defaultValue;
        }
      });
      setFormData(initialData);
    }
  }, [actionDef, actionData]);

  if (!actionDef) return null;

  const handleChange = (name: string, value: any, transform?: (v: any) => any) => {
    const finalValue = transform ? transform(value) : value;
    setFormData(prev => {
      const newData = { ...prev, [name]: finalValue };
      
      // Auto-calculate valorUnitario if valorTotal and quantidade are present
      if ((name === 'valorTotal' || name === 'quantidade') && newData.valorTotal && newData.quantidade) {
        const total = parseFloat(newData.valorTotal);
        const qty = parseFloat(newData.quantidade);
        if (qty > 0) {
          newData.valorUnitario = (total / qty).toFixed(6);
        }
      }
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Execute the corresponding action based on actionKey
      const isUpdate = !!(actionData && actionData.id);
      
      if (actionKey === 'contas_pagar') {
        const payload = {
          description: formData.descricao || '',
          amount: parseFloat(formData.valorTotal) || 0,
          due_date: formData.dataVencimento || new Date().toISOString().split('T')[0],
          category_id: formData.categoria || '',
          isRecurring: !!formData.recorrente,
          recurrenceRule: formData.recorrente ? (formData.tipoRecorrencia || null) : null,
          dataFim: formData.dataFim || null,
          status: 'pendente',
          installments: formData.vincularFatura ? parseInt(formData.parcelas) : 1,
          card_id: formData.vincularFatura ? formData.cartao : null,
        };
        if (isUpdate) {
          await updatePayable(actionData.id, payload);
        } else {
          await addPayable(payload);
        }
      } else if (actionKey === 'contas_receber') {
        const payload = {
          description: formData.descricao || '',
          amount: parseFloat(formData.valorTotal) || 0,
          dueDate: formData.dataVencimento || new Date().toISOString().split('T')[0],
          due_date: formData.dataVencimento || new Date().toISOString().split('T')[0],
          category_id: formData.categoria || '',
          isRecurring: !!formData.recorrente,
          recurrenceRule: formData.recorrente ? (formData.tipoRecorrencia || null) : null,
          dataFim: formData.dataFim || null,
          status: 'pendente',
        };
        if (isUpdate) {
          await updateReceivable(actionData.id, payload);
        } else {
          await addReceivable(payload);
        }
      } else if (actionKey === 'fatura') {
        const payload = {
          name: formData.descricao,
          limit: parseFloat(formData.limite),
          closing_day: parseInt(formData.diaFatura),
          due_day: parseInt(formData.diaVencimento),
          category_id: formData.categoria,
        };
        if (isUpdate) {
          await updateCreditCard(actionData.id, payload);
        } else {
          await addCreditCard(payload);
        }
      } else if (actionKey === 'receita' || actionKey === 'despesa') {
        const payload = {
          description: formData.descricao,
          amount: parseFloat(formData.valorTotal),
          type: actionKey === 'receita' ? 'income' : 'expense' as any,
          category_id: formData.categoria,
          date: formData.usarDataManual ? formData.dataRegistro : new Date().toISOString(),
        };
        if (isUpdate) {
          await updateTransaction(actionData.id, payload);
        } else {
          await addTransaction(payload);
        }
      } else if (actionKey === 'investimento_compra' || actionKey === 'investimento_venda') {
        const multiplier = actionKey === 'investimento_venda' ? -1 : 1;
        const payload = {
          type: formData.categoriaFinanceira,
          ticker: formData.descricao,
          value: parseFloat(formData.valorTotal) * multiplier,
          quantity: parseFloat(formData.quantidade) * multiplier,
          date: formData.usarDataManual ? formData.dataRegistro : new Date().toISOString()
        };
        if (isUpdate) {
          await updateInvestment(actionData.id, payload);
        } else {
          await addInvestment(payload);
        }
      } else if (actionKey === 'investimento_proventos') {
        // Update not supported yet
        await addEarning({
          ticker: formData.descricao,
          amount: parseFloat(formData.valorTotal),
          type: formData.tipoProvento || 'dividend',
          date: formData.usarDataManual ? formData.dataRegistro : new Date().toISOString()
        });
      } else if (actionKey === 'conta_bancaria') {
        // TODO: Implement addBankAccount in KingdomContext if needed, or handle here
        console.log('Bank account creation not fully implemented in backend yet');
      }

      closeAction();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: ActionField) => {
    if (field.condition && !field.condition(formData)) return null;

    const value = formData[field.name] ?? '';

    if (field.type === 'checkbox') {
      return (
        <div key={field.name} className="flex items-center gap-3 p-3 bg-[var(--color-bg-dark)] rounded-xl border border-[var(--color-border)] medieval-border">
          <input
            type="checkbox"
            id={field.name}
            checked={!!value}
            onChange={(e) => handleChange(field.name, e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
          <label htmlFor={field.name} className="flex-1 text-sm font-bold text-[var(--color-text-main)] cursor-pointer">
            {field.label}
          </label>
        </div>
      );
    }

    if (field.type === 'select') {
      let options = field.options || [];
      const isCategoryField = field.name === 'categoria';
      
      // Dynamic options based on field name
      if (isCategoryField) {
        const flowType = actionKey === 'receita' || actionKey === 'contas_receber' ? 'income' : 'expense';
        const profileType = gameMode === 'reino' ? 'MultiUsuario' : 'MonoUsuario';
        
        const filteredCategories = categories.filter(c => 
          c.flow_type === flowType && 
          (!c.allowed_profiles || c.allowed_profiles.includes(profileType))
        );

        // Group categories by rpg_group
        const groups: Record<string, any[]> = {};
        filteredCategories.forEach(c => {
          const groupName = c.rpg_group || 'Outros';
          if (!groups[groupName]) groups[groupName] = [];
          groups[groupName].push({ label: c.name, value: c.id });
        });

        return (
          <div key={field.name}>
            <label className="block text-sm font-bold text-[var(--color-text-main)] mb-2">{field.label}</label>
            <select
              value={value}
              onChange={(e) => handleChange(field.name, e.target.value, field.transform)}
              required={field.required}
              className="w-full px-4 py-2 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all medieval-border"
            >
              <option value="">Selecione...</option>
              {Object.entries(groups).map(([groupName, groupOptions]) => (
                <optgroup key={groupName} label={groupName} className="bg-[var(--color-bg-panel)] text-[var(--color-text-main)] font-bold">
                  {groupOptions.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-[var(--color-bg-dark)] text-[var(--color-text-main)]">
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        );
      } else if (field.name === 'cartao') {
        options = creditCards.map(c => ({ label: c.name, value: c.id }));
      }

      return (
        <div key={field.name}>
          <label className="block text-sm font-bold text-[var(--color-text-main)] mb-2">{field.label}</label>
          <select
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value, field.transform)}
            required={field.required}
            className="w-full px-4 py-2 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all medieval-border"
          >
            <option value="">Selecione...</option>
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div key={field.name}>
        <label className="block text-sm font-bold text-[var(--color-text-main)] mb-2">{field.label}</label>
        <input
          type={field.type}
          value={value}
          onChange={(e) => handleChange(field.name, e.target.value, field.transform)}
          required={field.required}
          step={field.step}
          placeholder={field.placeholder}
          className="w-full px-4 py-2 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all medieval-border"
        />
      </div>
    );
  };

  return (
    <div className="p-6 space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {actionDef.fields.map(renderField)}
        
        {/* Auto-calculated valorUnitario display */}
        {formData.valorUnitario && (
          <div className="p-3 bg-[var(--color-bg-dark)] rounded-xl border border-[var(--color-border)]">
            <span className="text-sm text-[var(--color-text-muted)]">Valor Unitário: </span>
            <span className="font-bold text-[var(--color-text-main)]">R$ {formData.valorUnitario}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-[var(--color-primary)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-bg-dark)] font-bold rounded-xl transition-all active:scale-95 medieval-border medieval-glow mt-4"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </div>
  );
}
