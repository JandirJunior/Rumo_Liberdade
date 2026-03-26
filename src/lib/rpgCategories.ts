/**
 * CHAVES DE GRUPOS (Identifiers)
 * Usamos chaves constantes para garantir que a lógica visual (cores/ícones) 
 * não quebre se o nome exibido ao usuário mudar.
 */
export const RPG_GROUP_TYPES = {
  RECEITA_FIXA: 'RECEITA_FIXA',
  RECEITA_VAR: 'RECEITA_VAR',
  DESPESA_FIXA: 'DESPESA_FIXA',
  DESPESA_VAR: 'DESPESA_VAR',
} as const;

/**
 * CONFIGURAÇÃO VISUAL
 * Mapeia cada tipo de grupo aos seus respectivos estilos e emojis.
 */
const GROUP_VISUAL_CONFIG: Record<string, { icon: string; color: string; text: string; emoji: string; label: string }> = {
  [RPG_GROUP_TYPES.RECEITA_FIXA]: { 
    label: '💎 Cofre do Reino - Receitas Fixas', 
    icon: 'Castle', color: 'bg-emerald-500', text: 'text-emerald-500', emoji: '💎' 
  },
  [RPG_GROUP_TYPES.RECEITA_VAR]: { 
    label: '⚡ Saque de Missões - Receitas Variáveis', 
    icon: 'Target', color: 'bg-amber-500', text: 'text-amber-500', emoji: '⚡' 
  },
  [RPG_GROUP_TYPES.DESPESA_FIXA]: { 
    label: '🛡️ Tributos do Reino - Despesas Fixas', 
    icon: 'Castle', color: 'bg-indigo-500', text: 'text-indigo-500', emoji: '🛡️' 
  },
  [RPG_GROUP_TYPES.DESPESA_VAR]: { 
    label: '⚔️ Aventuras do Herói - Despesas Variáveis', 
    icon: 'Compass', color: 'bg-rose-500', text: 'text-rose-500', emoji: '⚔️' 
  },
};

/**
 * Função para obter a configuração com base no nome ou tipo do grupo.
 * Agora ela tenta encontrar pelo nome (vinda do DB) ou retorna um padrão seguro.
 */
export const getRpgGroupConfig = (groupName: string) => {
  // Busca no mapeamento se o nome incluir as palavras-chave principais
  if (groupName.includes('Cofre')) return GROUP_VISUAL_CONFIG[RPG_GROUP_TYPES.RECEITA_FIXA];
  if (groupName.includes('Saque')) return GROUP_VISUAL_CONFIG[RPG_GROUP_TYPES.RECEITA_VAR];
  if (groupName.includes('Tributo')) return GROUP_VISUAL_CONFIG[RPG_GROUP_TYPES.DESPESA_FIXA];
  if (groupName.includes('Aventura')) return GROUP_VISUAL_CONFIG[RPG_GROUP_TYPES.DESPESA_VAR];

  // Fallback para grupos customizados criados pelo usuário
  return { icon: 'Package', color: 'bg-gray-500', text: 'text-gray-500', emoji: '📦' };
};

/**
 * INTERFACE DE TIPAGEM (TypeScript)
 * Define como uma subcategoria deve ser estruturada ao vir do banco.
 */
export interface RpgSubcategory {
  nome: string;
  usuarios: string[];
}

/**
 * SCHEMA DINÂMICO
 * Removi as subcategorias fixas. Agora este objeto serve como um 
 * "Container" que você deve preencher com os dados vindo da sua API.
 */
export const RPG_CATEGORIES_SCHEMA = {
  financeiroRPG: {
    receitas: {
      fixas: { titulo: GROUP_VISUAL_CONFIG[RPG_GROUP_TYPES.RECEITA_FIXA].label, subcategorias: [] as RpgSubcategory[] },
      variaveis: { titulo: GROUP_VISUAL_CONFIG[RPG_GROUP_TYPES.RECEITA_VAR].label, subcategorias: [] as RpgSubcategory[] }
    },
    despesas: {
      fixas: { titulo: GROUP_VISUAL_CONFIG[RPG_GROUP_TYPES.DESPESA_FIXA].label, subcategorias: [] as RpgSubcategory[] },
      variaveis: { titulo: GROUP_VISUAL_CONFIG[RPG_GROUP_TYPES.DESPESA_VAR].label, subcategorias: [] as RpgSubcategory[] }
    }
  }
};

/**
 * Exporta a lista de nomes de grupos (para uso em Selects/Dropdowns)
 */
export const RPG_GROUPS = Object.values(GROUP_VISUAL_CONFIG).map(config => config.label);