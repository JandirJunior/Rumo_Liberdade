'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Edit2, Trash2, Save, X, Target, Castle, Compass } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { CategoryEntity } from '@/lib/financialEngine';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/ThemeContext';
import { THEMES } from '@/lib/themes';

export function CategoryManagerPanel() {
  const { categories, loading, addCategory, updateCategory, deleteCategory } = useCategories();
  const { theme, gameMode } = useTheme();
  const colors = THEMES[theme] || THEMES.default;

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CategoryEntity>>({
    name: '',
    rpg_group: '💎 Cofre do Reino (Receitas Fixas)',
    flow_type: 'income',
    group_type: 'fixed',
    allowed_profiles: ['MonoUsuario', 'MultiUsuario']
  });

  const rpgGroups = [
    '💎 Cofre do Reino (Receitas Fixas)',
    '⚡ Saques de Misssões (Receitas Variáveis)',
    '🛡️ Tributos do Reino (Despesas Fixas)',
    '⚔️ Aventuras do Herói (Despesas Variáveis)'
  ];

  const getRpgGroupDetails = (rpgGroup: string) => {
    switch (rpgGroup) {
      case '💎 Cofre do Reino (Receitas Fixas)': return { icon: <Castle className="w-4 h-4" />, color: 'bg-emerald-500', text: 'text-emerald-500' };
      case '⚡ Saques de Misssões (Receitas Variáveis)': return { icon: <Target className="w-4 h-4" />, color: 'bg-amber-500', text: 'text-amber-500' };
      case '🛡️ Tributos do Reino (Despesas Fixas)': return { icon: <Castle className="w-4 h-4" />, color: 'bg-indigo-500', text: 'text-indigo-500' };
      case '⚔️ Aventuras do Herói (Despesas Variáveis)': return { icon: <Compass className="w-4 h-4" />, color: 'bg-rose-500', text: 'text-rose-500' };
      default: return { icon: <Target className="w-4 h-4" />, color: 'bg-gray-500', text: 'text-gray-500' };
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.rpg_group || !formData.flow_type || !formData.group_type) return;

    let icon = 'Target';
    let color = 'bg-gray-500';
    let rpgThemeName = formData.rpg_group;

    if (formData.rpg_group === '💎 Cofre do Reino (Receitas Fixas)') {
      icon = 'Castle'; color = 'bg-emerald-500'; rpgThemeName = 'Cofre do Reino';
    } else if (formData.rpg_group === '⚡ Saques de Misssões (Receitas Variáveis)') {
      icon = 'Target'; color = 'bg-amber-500'; rpgThemeName = 'Saques de Missões';
    } else if (formData.rpg_group === '🛡️ Tributos do Reino (Despesas Fixas)') {
      icon = 'Castle'; color = 'bg-indigo-500'; rpgThemeName = 'Tributos do Reino';
    } else if (formData.rpg_group === '⚔️ Aventuras do Herói (Despesas Variáveis)') {
      icon = 'Compass'; color = 'bg-rose-500'; rpgThemeName = 'Aventuras do Herói';
    }

    const categoryDataToSave = {
      ...formData,
      icon,
      color,
      rpg_theme_name: rpgThemeName
    };

    if (editingId) {
      await updateCategory(editingId, categoryDataToSave);
      setEditingId(null);
    } else {
      await addCategory(categoryDataToSave as Omit<CategoryEntity, 'id' | 'user_id' | 'created_at' | 'updated_at'>);
      setIsAdding(false);
    }
    setFormData({
      name: '',
      rpg_group: '💎 Cofre do Reino (Receitas Fixas)',
      flow_type: 'income',
      group_type: 'fixed',
      allowed_profiles: ['MonoUsuario', 'MultiUsuario']
    });
  };

  const handleEdit = (cat: CategoryEntity) => {
    setFormData({
      name: cat.name,
      rpg_group: cat.rpg_group,
      flow_type: cat.flow_type,
      group_type: cat.group_type,
      allowed_profiles: cat.allowed_profiles
    });
    setEditingId(cat.id);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      name: '',
      rpg_group: '💎 Cofre do Reino (Receitas Fixas)',
      flow_type: 'income',
      group_type: 'fixed',
      allowed_profiles: ['MonoUsuario', 'MultiUsuario']
    });
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-100 h-64 rounded-3xl"></div>;
  }

  // Agrupar categorias
  const profileType = gameMode === 'reino' ? 'MultiUsuario' : 'MonoUsuario';
  const filteredCategories = categories.filter(c => !c.allowed_profiles || c.allowed_profiles.includes(profileType));
  
  const groupedCategories = filteredCategories.reduce((acc, cat) => {
    if (!acc[cat.rpg_group]) {
      acc[cat.rpg_group] = [];
    }
    acc[cat.rpg_group].push(cat);
    return acc;
  }, {} as Record<string, CategoryEntity[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-display font-bold text-gray-900">Categorias Financeiras</h3>
          <p className="text-sm text-gray-500">Gerencie seus agrupadores RPG e subcategorias.</p>
        </div>
        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform active:scale-95", colors.primary)}
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4"
        >
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            {editingId ? 'Editar Categoria' : 'Nova Categoria'}
          </h4>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Nome da Subcategoria</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                placeholder="Ex: Salário, Aluguel, Supermercado"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Agrupador RPG</label>
              <select
                value={formData.rpg_group}
                onChange={(e) => {
                  const group = e.target.value;
                  let flow_type: 'income' | 'expense' = 'expense';
                  let group_type: 'fixed' | 'variable' = 'variable';
                  
                  if (group === '💎 Cofre do Reino (Receitas Fixas)') { flow_type = 'income'; group_type = 'fixed'; }
                  else if (group === '⚡ Saques de Misssões (Receitas Variáveis)') { flow_type = 'income'; group_type = 'variable'; }
                  else if (group === '🛡️ Tributos do Reino (Despesas Fixas)') { flow_type = 'expense'; group_type = 'fixed'; }
                  else if (group === '⚔️ Aventuras do Herói (Despesas Variáveis)') { flow_type = 'expense'; group_type = 'variable'; }

                  setFormData({ ...formData, rpg_group: group, flow_type, group_type });
                }}
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
              >
                {rpgGroups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={!formData.name}
                className={cn("flex-1 py-3 rounded-xl text-white font-bold text-sm shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2", !formData.name ? "opacity-50 cursor-not-allowed" : colors.primary)}
              >
                <Save className="w-4 h-4" /> Salvar
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-6">
        {rpgGroups.map(groupName => {
          const groupCats = groupedCategories[groupName] || [];
          const { icon, color, text } = getRpgGroupDetails(groupName);
          
          if (groupCats.length === 0) return null;

          return (
            <div key={groupName} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={cn("w-6 h-6 rounded-md flex items-center justify-center text-white", color)}>
                  {icon}
                </div>
                <h4 className={cn("text-sm font-bold uppercase tracking-wider", text)}>{groupName}</h4>
              </div>
              
              <div className="flex flex-col gap-3">
                {groupCats.map(cat => (
                  <div key={cat.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-emerald-100 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{cat.name}</p>
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                        {cat.flow_type === 'income' ? 'Receita' : 'Despesa'} • {cat.group_type === 'fixed' ? 'Fixa' : 'Variável'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(cat)}
                        className="p-2 text-gray-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-blue-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteCategory(cat.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
