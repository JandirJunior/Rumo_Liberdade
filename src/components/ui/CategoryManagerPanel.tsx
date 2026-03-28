'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Save, X, Target, Castle, Compass, FileUp, Info } from 'lucide-react';
import { RPG_GROUPS, getRpgGroupConfig } from '@/lib/rpgCategories';
import { useCategories } from '@/hooks/useCategories';
import { CategoryEntity } from '@/types';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/ThemeContext';
import { THEMES } from '@/lib/themes';
import { ImportModal } from './ImportModal';
import { auth } from '@/services/firebase';

export function CategoryManagerPanel() {
  const { categories, loading, addCategory, updateCategory, deleteCategory } = useCategories();
  const { theme, gameMode } = useTheme();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  const initialFormState: Partial<CategoryEntity> = {
    name: '',
    description: '',
    rpg_group: '💎 Cofre do Reino - Receitas Fixas',
    flow_type: 'income',
    group_type: 'fixed',
    allowed_profiles: ['MonoUsuario', 'MultiUsuario']
  };

  const [formData, setFormData] = useState<Partial<CategoryEntity>>(initialFormState);

  const getRpgGroupDetails = (rpgGroup: string) => {
    const config = getRpgGroupConfig(rpgGroup);
    const Icon = config.icon === 'Castle' ? Castle : (config.icon === 'Compass' ? Compass : Target);
    return { 
      icon: <Icon className="w-4 h-4" />, 
      color: config.color, 
      text: config.text 
    };
  };

  const handleImport = async (data: Record<string, string>[]) => {
    try {
      for (const row of data) {
        const category = row['Categoria'] || row['categoria'];
        const subcategory = row['Subcategoria'] || row['subcategoria'];
        const description = row['Descrição'] || row['descrição'] || row['Descricao'] || row['descricao'];
        const usuarios = row['Usuarios'] || row['usuarios'];

        if (!category || !subcategory) continue;

        let flow_type: 'income' | 'expense' = 'expense';
        let group_type: 'fixed' | 'variable' = 'variable';
        let icon = 'Target';
        let color = 'bg-[var(--color-primary)]';
        let rpgThemeName = category;

        if (category.includes('Cofre do Reino') && category.includes('Receitas Fixas')) {
          flow_type = 'income'; group_type = 'fixed'; icon = 'Castle'; color = 'bg-emerald-500'; rpgThemeName = 'Cofre do Reino';
        } else if (category.includes('Saque') && category.includes('Receitas Variáveis')) {
          flow_type = 'income'; group_type = 'variable'; icon = 'Target'; color = 'bg-amber-500'; rpgThemeName = 'Saques de Missões';
        } else if (category.includes('Tributo') && category.includes('Despesas Fixas')) {
          flow_type = 'expense'; group_type = 'fixed'; icon = 'Castle'; color = 'bg-indigo-500'; rpgThemeName = 'Tributos do Reino';
        } else if (category.includes('Aventura') && category.includes('Despesas Variáveis')) {
          flow_type = 'expense'; group_type = 'variable'; icon = 'Compass'; color = 'bg-rose-500'; rpgThemeName = 'Aventuras do Herói';
        }

        await addCategory({
          name: subcategory,
          description: description || '',
          rpg_group: category,
          flow_type,
          group_type,
          icon,
          color,
          rpg_theme_name: rpgThemeName,
          allowed_profiles: usuarios ? usuarios.split(',') : ['MonoUsuario', 'MultiUsuario'],
          is_active: true
        });
      }
      setIsImporting(false);
    } catch (error) {
      console.error('Erro ao importar categorias:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.rpg_group || !formData.flow_type || !formData.group_type) return;

    let icon = 'Target';
    let color = 'bg-[var(--color-primary)]';
    let rpgThemeName = formData.rpg_group;

    // Lógica de mapeamento de tema RPG
    if (formData.rpg_group === '💎 Cofre do Reino - Receitas Fixas') {
      icon = 'Castle'; color = 'bg-emerald-500'; rpgThemeName = 'Cofre do Reino';
    } else if (formData.rpg_group === '⚡ Saques de Missões - Receitas Variáveis') {
      icon = 'Target'; color = 'bg-amber-500'; rpgThemeName = 'Saques de Missões';
    } else if (formData.rpg_group === '🛡️ Tributos do Reino - Despesas Fixas') {
      icon = 'Castle'; color = 'bg-indigo-500'; rpgThemeName = 'Tributos do Reino';
    } else if (formData.rpg_group === '⚔️ Aventuras do Herói - Despesas Variáveis') {
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
    setFormData(initialFormState);
  };

  const handleEdit = (cat: CategoryEntity) => {
    let group = cat.rpg_group || 'Outros';
    if (group.includes('Cofre do Reino') && group.includes('Receitas Fixas')) group = '💎 Cofre do Reino - Receitas Fixas';
    else if (group.includes('Saque') && group.includes('Receitas Variáveis')) group = '⚡ Saque de Missões - Receitas Variáveis';
    else if (group.includes('Tributo') && group.includes('Despesas Fixas')) group = '🛡️ Tributos do Reino - Despesas Fixas';
    else if (group.includes('Aventura') && group.includes('Despesas Variáveis')) group = '⚔️ Aventuras do Herói - Despesas Variáveis';

    setFormData({
      name: cat.name,
      description: cat.description || '',
      rpg_group: group,
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
    setFormData(initialFormState);
  };

  if (loading) {
    return <div className="animate-pulse bg-[var(--color-bg-panel)] h-64 rounded-3xl medieval-border"></div>;
  }

  const profileType = gameMode === 'reino' ? 'MultiUsuario' : 'MonoUsuario';
  const filteredCategories = categories.filter(c => !c.allowed_profiles || c.allowed_profiles.includes(profileType));
  
  const groupedCategories = filteredCategories.reduce((acc, cat) => {
    let group = cat.rpg_group || 'Outros';
    
    // Normalize legacy or slightly different group names
    if (group.includes('Cofre do Reino') && group.includes('Receitas Fixas')) {
      group = '💎 Cofre do Reino - Receitas Fixas';
    } else if (group.includes('Saque') && group.includes('Receitas Variáveis')) {
      group = '⚡ Saque de Missões - Receitas Variáveis';
    } else if (group.includes('Tributo') && group.includes('Despesas Fixas')) {
      group = '🛡️ Tributos do Reino - Despesas Fixas';
    } else if (group.includes('Aventura') && group.includes('Despesas Variáveis')) {
      group = '⚔️ Aventuras do Herói - Despesas Variáveis';
    }

    if (!acc[group]) acc[group] = [];
    acc[group].push(cat);
    return acc;
  }, {} as Record<string, CategoryEntity[]>);

  const allGroups = Array.from(new Set([
    ...RPG_GROUPS,
    ...Object.keys(groupedCategories)
  ]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl medieval-title font-bold text-[var(--color-text-main)]">Categorias Financeiras</h3>
          <p className="text-sm text-[var(--color-text-muted)]">Gerencie seus agrupadores RPG e subcategorias.</p>
        </div>
        {!isAdding && !editingId && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsImporting(true)}
              title="Importar CSV"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] bg-[var(--color-bg-dark)] border border-[var(--color-border)] shadow-sm transition-transform active:scale-95"
            >
              <FileUp className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsAdding(true)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--color-bg-dark)] shadow-sm transition-transform active:scale-95 bg-[var(--color-primary)] medieval-glow"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <ImportModal
        isOpen={isImporting}
        onClose={() => setIsImporting(false)}
        onImport={handleImport}
        title="Importar Categorias"
        template={['Categoria', 'Subcategoria', 'Descrição', 'Usuarios']}
        separator=";"
        description="Importe um arquivo CSV com as colunas: Categoria; Subcategoria; Descrição; Usuarios."
      />

      {(isAdding || editingId) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--color-bg-dark)] p-5 rounded-3xl border border-[var(--color-border)] shadow-sm space-y-4 medieval-border"
        >
          <h4 className="text-sm font-bold text-[var(--color-text-main)] uppercase tracking-wider">
            {editingId ? 'Editar Categoria' : 'Nova Categoria'}
          </h4>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1 block">Nome da Subcategoria</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 bg-[var(--color-bg-panel)] border border-[var(--color-border)] text-[var(--color-text-main)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all text-sm"
                placeholder="Ex: Salário, Aluguel, Supermercado"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1 block">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 bg-[var(--color-bg-panel)] border border-[var(--color-border)] text-[var(--color-text-main)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all text-sm min-h-[80px]"
                placeholder="Descreva o propósito desta categoria"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1 block">Agrupador RPG</label>
              <select
                value={formData.rpg_group}
                onChange={(e) => {
                  const group = e.target.value;
                  let flow_type: 'income' | 'expense' = 'expense';
                  let group_type: 'fixed' | 'variable' = 'variable';
                  
                  if (group === '💎 Cofre do Reino - Receitas Fixas') { flow_type = 'income'; group_type = 'fixed'; }
                  else if (group === '⚡ Saques de Missões - Receitas Variáveis') { flow_type = 'income'; group_type = 'variable'; }
                  else if (group === '🛡️ Tributos do Reino - Despesas Fixas') { flow_type = 'expense'; group_type = 'fixed'; }
                  else if (group === '⚔️ Aventuras do Herói - Despesas Variáveis') { flow_type = 'expense'; group_type = 'variable'; }

                  setFormData({ ...formData, rpg_group: group, flow_type, group_type });
                }}
                className="w-full p-3 bg-[var(--color-bg-panel)] border border-[var(--color-border)] text-[var(--color-text-main)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all text-sm"
              >
                {allGroups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={!formData.name}
                className={cn(
                  "flex-1 py-3 rounded-xl text-[var(--color-bg-dark)] font-bold text-sm shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2",
                  !formData.name ? "opacity-50 cursor-not-allowed" : "bg-[var(--color-primary)] medieval-glow"
                )}
              >
                <Save className="w-4 h-4" /> Salvar
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-3 rounded-xl bg-[var(--color-bg-panel)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] border border-[var(--color-border)] font-bold text-sm transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-6">
        {allGroups.map(groupName => {
          const groupCats = groupedCategories[groupName] || [];
          const { icon, color, text } = getRpgGroupDetails(groupName);
          
          if (groupCats.length === 0) return null;

          return (
            <div key={groupName} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={cn("w-6 h-6 rounded-md flex items-center justify-center text-[var(--color-text-main)]", color)}>
                  {icon}
                </div>
                <h4 className={cn("text-sm font-bold uppercase tracking-wider", text)}>{groupName}</h4>
              </div>
              
              <div className="flex flex-col gap-3">
                {groupCats.map(cat => (
                  <div 
                    key={cat.id} 
                    title={cat.description}
                    className="bg-[var(--color-bg-panel)] p-4 rounded-2xl border border-[var(--color-border)] shadow-sm flex items-center justify-between group hover:border-[var(--color-primary)] transition-colors medieval-border relative"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-[var(--color-text-main)]">{cat.name}</p>
                        {cat.description && (
                          <div className="group/info relative">
                            <Info className="w-3 h-3 text-[var(--color-text-muted)] cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-lg text-[10px] text-[var(--color-text-main)] opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                              {cat.description}
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-[var(--color-text-muted)] font-medium uppercase tracking-wider">
                        {cat.flow_type === 'income' ? 'Receita' : 'Despesa'} • {cat.group_type === 'fixed' ? 'Fixa' : 'Variável'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(cat)}
                        className="p-2 text-[var(--color-text-muted)] hover:text-blue-400 transition-colors rounded-lg hover:bg-[var(--color-bg-dark)]"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteCategory(cat.id)}
                        className="p-2 text-[var(--color-text-muted)] hover:text-red-400 transition-colors rounded-lg hover:bg-[var(--color-bg-dark)]"
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