import { FACERO_TARGETS } from '@/lib/financialEngine';
import { Mentor } from '@/types';

export const GLOBAL_MENTORS: Record<string, Mentor> = {
  'F': { id: 'F', name: 'Festim', facero_id: 'F', theme_id: 'golden', character_class: 'Paladino', race: 'Humano', strategy: 'Foco em Fundos Imobiliários e Fundos de papeis e Fiagros viver de Rendimentos (Aluguéis)' },
  'A': { id: 'A', name: 'Arcano', facero_id: 'A', theme_id: 'navy', character_class: 'Mage', race: 'Humano', strategy: 'Foco em Ações e viver de Dividendos (Cotas de Empresas)' },
  'C': { id: 'C', name: 'Cache', facero_id: 'C', theme_id: 'brown', character_class: 'Dwarf', race: 'Anão', strategy: 'Foco em Cripto Ativos e Moedas Digitais' },
  'E': { id: 'E', name: 'Exodia', facero_id: 'E', theme_id: 'lightblue', character_class: 'Elf', race: 'Elfo', strategy: 'Foco em Ações e Fundos e Variação Cambial, investimentos fora do Brasil' },
  'R': { id: 'R', name: 'Reaver', facero_id: 'R', theme_id: 'darkgray', character_class: 'Ladino', race: 'Humano', strategy: 'Foco em CDBs e também em Previdencia privada VGBL e tesouro selic e tesouro direto' },
  'O': { id: 'O', name: 'Orbita', facero_id: 'O', theme_id: 'darkred', character_class: 'Hobbit', race: 'Hobbit', strategy: 'Foco em Oportunidade os outros tipos de investimentos não citados acima' },
};

export function getMentorByInvestment(investment_category_id: string): Mentor | undefined {
  return GLOBAL_MENTORS[investment_category_id];
}

export function getDominantMentor(assets: any[]): Mentor | undefined {
  if (!Array.isArray(assets) || assets.length === 0) return undefined;
  
  const aggregated = Object.keys(FACERO_TARGETS).map(key => {
    const typeAssets = assets.filter(a => a.faceroType === key || a.investment_category_id === key);
    const value = typeAssets.reduce((acc, curr) => acc + Number(curr.value || curr.current_value || 0), 0);
    return { key, value };
  });

  const dominant = aggregated.reduce((prev, current) => (prev.value > current.value) ? prev : current);
  return dominant.value > 0 ? GLOBAL_MENTORS[dominant.key] : undefined;
}
