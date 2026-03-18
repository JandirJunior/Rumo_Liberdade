export const RPG_CATEGORIES_SCHEMA = {
  "financeiroRPG": {
    "receitas": {
      "fixas": {
        "titulo": "💎 Cofre do Reino (Receitas Fixas)",
        "subcategorias": [
          { "nome": "Salário principal", "usuarios": ["MonoUsuario", "MultiUsuario"] },
          { "nome": "Pensão/Aposentadoria", "usuarios": ["MonoUsuario", "MultiUsuario"] },
          { "nome": "Aluguel recebido", "usuarios": ["MonoUsuario", "MultiUsuario"] }
        ]
      },
      "variaveis": {
        "titulo": "⚡ Saque de Missões (Receitas Variáveis)",
        "subcategorias": [
          { "nome": "Freelances/Bicos", "usuarios": ["MonoUsuario", "MultiUsuario"] },
          { "nome": "Comissões", "usuarios": ["MonoUsuario", "MultiUsuario"] },
          { "nome": "Venda de bens", "usuarios": ["MonoUsuario", "MultiUsuario"] },
          { "nome": "Investimentos (juros/dividendos)", "usuarios": ["MonoUsuario", "MultiUsuario"] },
          { "nome": "Presentes/Doações recebidas", "usuarios": ["MonoUsuario", "MultiUsuario"] },
          { "nome": "Benefícios governamentais", "usuarios": ["MonoUsuario", "MultiUsuario"] }
        ]
      }
    },
    "despesas": {
      "fixas": {
        "titulo": "🛡️ Tributos do Reino (Despesas Fixas)",
        "subcategorias": [
          { "nome": "Aluguel/Financiamento", "usuarios": ["MonoUsuario", "MultiUsuario"] },
          { "nome": "Condomínio", "usuarios": ["MonoUsuario", "MultiUsuario"] },
          { "nome": "IPTU", "usuarios": ["MonoUsuario", "MultiUsuario"] },
          { "nome": "Plano de saúde", "usuarios": ["MonoUsuario", "MultiUsuario"] },
          { "nome": "Mensalidade escolar/faculdade", "usuarios": ["MultiUsuario"] },
          { "nome": "Seguros (vida, carro, saúde)", "usuarios": ["MonoUsuario", "MultiUsuario"] },
          { "nome": "Previdência privada", "usuarios": ["MonoUsuario", "MultiUsuario"] },
          { "nome": "Impostos e taxas", "usuarios": ["MonoUsuario", "MultiUsuario"] }
        ]
      },
      "variaveis": {
        "titulo": "⚔️ Aventuras do Herói (Despesas Variáveis)",
        "subcategorias": [
          { "nome": "Alimentação (supermercado)", "usuarios": ["MonoUsuario", "MultiUsuario"] },
          { "nome": "Restaurantes/Lanches/Delivery", "usuarios": ["MonoUsuario", "MultiUsuario"] },
          { "nome": "Transporte (combustível, transporte público)", "usuarios": ["MonoUsuario", "MultiUsuario"] },
          { "nome": "Manutenção de veículo", "usuarios": ["MonoUsuario", "MultiUsuario"] },
          { "nome": "Seguro de veículo", "usuarios": ["MonoUsuario", "MultiUsuario"] },
          { "nome": "Consultas médicas ocasionais", "usuarios": ["MonoUsuario", "MultiUsuario"] },
          { "nome": "Medicamentos", "usuarios": ["MonoUsuario", "MultiUsuario"] },
          { "nome": "Academia/Atividade física", "usuarios": ["MonoUsuario", "MultiUsuario"] },
          { "nome": "Cursos extracurriculares", "usuarios": ["MonoUsuario", "MultiUsuario"] },
          { "nome": "Livros/Workshops", "usuarios": ["MonoUsuario", "MultiUsuario"] },
          { "nome": "Cinema/Shows/Eventos", "usuarios": ["MonoUsuario", "MultiUsuario"] },
          { "nome": "Streaming (Netflix, Spotify, etc.)", "usuarios": ["MonoUsuario", "MultiUsuario"] },
          { "nome": "Viagens", "usuarios": ["MonoUsuario", "MultiUsuario"] },
          { "nome": "Roupas", "usuarios": ["MonoUsuario", "MultiUsuario"] },
          { "nome": "Beleza/Estética", "usuarios": ["MonoUsuario", "MultiUsuario"] },
          { "nome": "Hobbies", "usuarios": ["MonoUsuario", "MultiUsuario"] },
          { "nome": "Presentes/Comemorações", "usuarios": ["MonoUsuario", "MultiUsuario"] },
          { "nome": "Brinquedos/Itens para filhos", "usuarios": ["MultiUsuario"] },
          { "nome": "Material escolar", "usuarios": ["MultiUsuario"] }
        ]
      }
    }
  }
};
