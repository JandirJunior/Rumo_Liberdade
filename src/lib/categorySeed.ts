/**
 * 🧠 categorySeed.ts
 * -------------------------------------------------------
 * Responsável por criar as categorias padrão do sistema RPG
 * no Firestore, de forma CONTROLADA e SEGURA.
 *
 * ✅ OBJETIVO:
 * - Criar categorias iniciais para um novo REINO (kingdom)
 * - Utilizar o schema RPG (RPG_CATEGORIES_SCHEMA)
 * - Garantir que isso aconteça APENAS UMA VEZ
 *
 * ❌ PROBLEMA ANTERIOR (CORRIGIDO):
 * Antes, a criação de categorias acontecia dentro do hook React (useCategories),
 * causando:
 * - deleção em massa de categorias
 * - recriação contínua
 * - duplicidade
 * - quebra de category_id nas transações
 *
 * ✅ SOLUÇÃO ATUAL:
 * - Este arquivo centraliza a criação inicial
 * - Executa SOMENTE se não existir nenhuma categoria no reino
 *
 * 🚨 REGRAS IMPORTANTES:
 * - NUNCA deletar categorias existentes automaticamente
 * - NUNCA recriar categorias se já existirem
 * - Executar este seed apenas no login/criação do reino
 *
 * 📍 LOCAL DE USO:
 * Deve ser chamado após:
 * - login do usuário
 * - criação do reino
 *
 * Exemplo:
 * await seedCategoriesIfNeeded(kingdom.id, user.uid)
 */

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  writeBatch
} from 'firebase/firestore';

import { db } from '@/services/firebase';
import { RPG_CATEGORIES_SCHEMA } from '@/lib/rpgCategories';

export async function seedCategoriesIfNeeded(
  kingdomId: string,
  userId: string
) {
  try {
    /**
     * 🔍 Verifica se já existem categorias para o reino
     */
    const q = query(
      collection(db, 'categories'),
      where('kingdom_id', '==', kingdomId)
    );

    const snapshot = await getDocs(q);

    /**
     * ✅ REGRA PRINCIPAL:
     * Se já existir qualquer categoria → NÃO FAZER NADA
     */
    if (!snapshot.empty) {
      console.log('ℹ️ Categorias já existem, seed ignorado.');
      return;
    }

    console.log('🚀 Iniciando seed de categorias...');

    /**
     * 🧱 Batch para inserção em massa (mais performático)
     */
    const batch = writeBatch(db);

    /**
     * 📦 Função auxiliar para criar categorias
     */
    const createCategoriesFromSchema = (
      flowType: 'income' | 'expense',
      groupType: 'fixed' | 'variable',
      schemaPart: any
    ) => {
      const groupId = `${flowType}_${groupType}`;

      /**
       * 🎨 Definição visual (ícones e cores)
       * Mantém identidade RPG
       */
      let icon = 'Target';
      let color = 'bg-gray-500';
      let rpgThemeName = schemaPart.titulo;

      if (schemaPart.titulo.includes('Cofre do Reino')) {
        icon = 'Castle';
        color = 'bg-emerald-500';
        rpgThemeName = 'Cofre do Reino';
      } else if (schemaPart.titulo.includes('Saques de Missões')) {
        icon = 'Zap';
        color = 'bg-amber-500';
        rpgThemeName = 'Saques de Missões';
      } else if (schemaPart.titulo.includes('Tributos do Reino')) {
        icon = 'Shield';
        color = 'bg-indigo-500';
        rpgThemeName = 'Tributos do Reino';
      } else if (schemaPart.titulo.includes('Aventuras do Herói')) {
        icon = 'Compass';
        color = 'bg-rose-500';
        rpgThemeName = 'Aventuras do Herói';
      }

      /**
       * 🧾 Criação das subcategorias
       */
      schemaPart.subcategorias.forEach((sub: any) => {
        const newRef = doc(collection(db, 'categories'));

        batch.set(newRef, {
          id: newRef.id,
          name: sub.nome,

          // 🔑 Estrutura padronizada
          group_id: groupId,
          flow_type: flowType,
          group_type: groupType,

          // 🎮 RPG
          rpg_group: schemaPart.titulo,
          rpg_theme_name: rpgThemeName,

          // 👥 Perfil de uso
          allowed_profiles: sub.usuarios || ['MonoUsuario', 'MultiUsuario'],

          // 🎨 UI
          icon,
          color,

          // 📊 Controle
          is_active: true,

          // 🏰 Multiusuário
          kingdom_id: kingdomId,
          created_by: userId,
          user_id: userId,

          // ⏱️ Datas
          created_at: new Date()
        });
      });
    };

    /**
     * 📚 Carrega schema RPG
     */
    const schema = RPG_CATEGORIES_SCHEMA.financeiroRPG;

    /**
     * 🏗️ Criação estruturada
     */
    createCategoriesFromSchema('income', 'fixed', schema.receitas.fixas);
    createCategoriesFromSchema('income', 'variable', schema.receitas.variaveis);
    createCategoriesFromSchema('expense', 'fixed', schema.despesas.fixas);
    createCategoriesFromSchema('expense', 'variable', schema.despesas.variaveis);

    /**
     * 💾 Commit no Firestore
     */
    await batch.commit();

    console.log('✅ Seed de categorias concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar seed de categorias:', error);
  }
}