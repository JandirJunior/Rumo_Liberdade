import { db } from '@/services/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { CategoryEntity } from '@/types';

export const DEFAULT_CATEGORIES = [
  { category: "💎 Cofre do Reino - Receitas Fixas", subcategory: "Salário", description: "Remuneração principal de contrato ou cargo", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "💎 Cofre do Reino - Receitas Fixas", subcategory: "Pró-labore", description: "Retirada mensal de sócios de empresa", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "💎 Cofre do Reino - Receitas Fixas", subcategory: "Aluguel Recebido", description: "Renda de locação de imóveis próprios", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "💎 Cofre do Reino - Receitas Fixas", subcategory: "Aposentadoria", description: "Benefício previdenciário mensal", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "💎 Cofre do Reino - Receitas Fixas", subcategory: "Pensão Alimentícia", description: "Recebimento de pensão judicial", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "💎 Cofre do Reino - Receitas Fixas", subcategory: "Mesada", description: "Recebimento fixo de familiares", usuarios: "MonoUsuario" },
  { category: "💎 Cofre do Reino - Receitas Fixas", subcategory: "Arrendamento", description: "Renda fixa por uso de bens ou terras", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "💎 Cofre do Reino - Receitas Fixas", subcategory: "Benefício Social", description: "Auxílios governamentais recorrentes", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "⚡ Saques de Missões - Receitas Variáveis", subcategory: "Comissões", description: "Ganhos variáveis por vendas ou metas", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "⚡ Saques de Missões - Receitas Variáveis", subcategory: "Bônus/PLR", description: "Participação nos lucros ou premiações", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "⚡ Saques de Missões - Receitas Variáveis", subcategory: "Freelance", description: "Trabalhos extras e projetos pontuais", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "⚡ Saques de Missões - Receitas Variáveis", subcategory: "Venda de Bens", description: "Receita pela venda de itens usados", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "⚡ Saques de Missões - Receitas Variáveis", subcategory: "Restituição IR", description: "Devolução de imposto de renda", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "⚡ Saques de Missões - Receitas Variáveis", subcategory: "Presentes", description: "Valores recebidos em datas especiais", usuarios: "MonoUsuario" },
  { category: "⚡ Saques de Missões - Receitas Variáveis", subcategory: "Reembolsos", description: "Devolução de valores gastos", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "🛡️ Tributos do Reino - Despesas Fixas", subcategory: "Aluguel/Condomínio", description: "Custo fixo de moradia", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "🛡️ Tributos do Reino - Despesas Fixas", subcategory: "Energia Elétrica", description: "Conta mensal de luz", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "🛡️ Tributos do Reino - Despesas Fixas", subcategory: "Água e Saneamento", description: "Conta mensal de água", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "🛡️ Tributos do Reino - Despesas Fixas", subcategory: "Internet/TV", description: "Assinatura de conectividade", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "🛡️ Tributos do Reino - Despesas Fixas", subcategory: "Plano de Saúde", description: "Mensalidade de assistência médica", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "🛡️ Tributos do Reino - Despesas Fixas", subcategory: "Educação", description: "Escola, faculdade ou cursos fixos", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "🛡️ Tributos do Reino - Despesas Fixas", subcategory: "Seguros", description: "Seguro auto, vida ou residencial", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "🛡️ Tributos do Reino - Despesas Fixas", subcategory: "Assinaturas/SaaS", description: "Netflix, Spotify, iCloud, etc.", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "🛡️ Tributos do Reino - Despesas Fixas", subcategory: "Empréstimos", description: "Parcelas de dívidas bancárias", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "🛡️ Tributos do Reino - Despesas Fixas", subcategory: "Impostos (IPTU/IPVA)", description: "Tributos anuais obrigatórios", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "⚔️ Aventuras do Herói - Despesas Variáveis", subcategory: "Supermercado", description: "Compras de mantimentos e higiene", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "⚔️ Aventuras do Herói - Despesas Variáveis", subcategory: "Restaurantes/Ifood", description: "Alimentação fora de casa", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "⚔️ Aventuras do Herói - Despesas Variáveis", subcategory: "Transporte/Uber", description: "Combustível ou aplicativos", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "⚔️ Aventuras do Herói - Despesas Variáveis", subcategory: "Lazer/Cinema", description: "Entretenimento e saídas", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "⚔️ Aventuras do Herói - Despesas Variáveis", subcategory: "Farmácia/Saúde", description: "Medicamentos e consultas eventuais", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "⚔️ Aventuras do Herói - Despesas Variáveis", subcategory: "Vestuário", description: "Roupas, calçados e acessórios", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "⚔️ Aventuras do Herói - Despesas Variáveis", subcategory: "Cuidados Pessoais", description: "Salão, barbearia, cosméticos", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "⚔️ Aventuras do Herói - Despesas Variáveis", subcategory: "Manutenção Lar", description: "Reparos e itens de casa", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "⚔️ Aventuras do Herói - Despesas Variáveis", subcategory: "Viagens", description: "Passagens e hospedagens", usuarios: "MonoUsuario,MultiUsuario" },
  { category: "⚔️ Aventuras do Herói - Despesas Variáveis", subcategory: "Presentes Doados", description: "Compras para terceiros", usuarios: "MonoUsuario" }
];

export async function seedKingdomCategories(kingdomId: string, userId: string) {
  const batch = writeBatch(db);
  const categoriesRef = collection(db, 'categories');

  for (const item of DEFAULT_CATEGORIES) {
    const newId = doc(categoriesRef).id;
    
    let flow_type: 'income' | 'expense' = 'expense';
    let group_type: 'fixed' | 'variable' = 'variable';
    let icon = 'Target';
    let color = 'bg-[var(--color-primary)]';
    let rpgThemeName = item.category;

    if (item.category === '💎 Cofre do Reino - Receitas Fixas') {
      flow_type = 'income'; group_type = 'fixed'; icon = 'Castle'; color = 'bg-emerald-500'; rpgThemeName = 'Cofre do Reino';
    } else if (item.category === '⚡ Saques de Missões - Receitas Variáveis') {
      flow_type = 'income'; group_type = 'variable'; icon = 'Target'; color = 'bg-amber-500'; rpgThemeName = 'Saques de Missões';
    } else if (item.category === '🛡️ Tributos do Reino - Despesas Fixas') {
      flow_type = 'expense'; group_type = 'fixed'; icon = 'Castle'; color = 'bg-indigo-500'; rpgThemeName = 'Tributos do Reino';
    } else if (item.category === '⚔️ Aventuras do Herói - Despesas Variáveis') {
      flow_type = 'expense'; group_type = 'variable'; icon = 'Compass'; color = 'bg-rose-500'; rpgThemeName = 'Aventuras do Herói';
    }

    const categoryData: Omit<CategoryEntity, 'id'> = {
      name: item.subcategory,
      description: item.description,
      rpg_group: item.category,
      flow_type,
      group_type,
      icon,
      color,
      rpg_theme_name: rpgThemeName,
      allowed_profiles: item.usuarios.split(','),
      kingdom_id: kingdomId,
      user_id: userId,
      created_by: userId,
      is_active: true,
      created_at: new Date()
    };

    batch.set(doc(categoriesRef, newId), { id: newId, ...categoryData });
  }

  await batch.commit();
}
