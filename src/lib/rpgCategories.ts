export const RPG_CATEGORIES_SCHEMA = {
  financeiroRPG: {
    receitas: {
      fixas: {
        titulo: '💎 Cofre do Reino (Receitas Fixas)',
        subcategorias: [
          { nome: 'Salário', usuarios: ['MonoUsuario', 'MultiUsuario'] },
          { nome: 'Renda Passiva', usuarios: ['MonoUsuario', 'MultiUsuario'] },
          { nome: 'Pró-labore', usuarios: ['MonoUsuario', 'MultiUsuario'] },
          { nome: 'Aposentadoria', usuarios: ['MonoUsuario', 'MultiUsuario'] }
        ]
      },
      variaveis: {
        titulo: '⚡ Saques de Missões (Receitas Variáveis)',
        subcategorias: [
          { nome: 'Freelance', usuarios: ['MonoUsuario', 'MultiUsuario'] },
          { nome: 'Bônus', usuarios: ['MonoUsuario', 'MultiUsuario'] },
          { nome: 'Presentes', usuarios: ['MonoUsuario', 'MultiUsuario'] },
          { nome: 'Vendas', usuarios: ['MonoUsuario', 'MultiUsuario'] }
        ]
      }
    },
    despesas: {
      fixas: {
        titulo: '🛡️ Tributos do Reino (Despesas Fixas)',
        subcategorias: [
          { nome: 'Aluguel/Moradia', usuarios: ['MonoUsuario', 'MultiUsuario'] },
          { nome: 'Educação', usuarios: ['MonoUsuario', 'MultiUsuario'] },
          { nome: 'Assinaturas', usuarios: ['MonoUsuario', 'MultiUsuario'] },
          { nome: 'Seguros', usuarios: ['MonoUsuario', 'MultiUsuario'] },
          { nome: 'Internet/Celular', usuarios: ['MonoUsuario', 'MultiUsuario'] }
        ]
      },
      variaveis: {
        titulo: '⚔️ Aventuras do Herói (Despesas Variáveis)',
        subcategorias: [
          { nome: 'Alimentação', usuarios: ['MonoUsuario', 'MultiUsuario'] },
          { nome: 'Transporte', usuarios: ['MonoUsuario', 'MultiUsuario'] },
          { nome: 'Lazer', usuarios: ['MonoUsuario', 'MultiUsuario'] },
          { nome: 'Saúde', usuarios: ['MonoUsuario', 'MultiUsuario'] },
          { nome: 'Vestuário', usuarios: ['MonoUsuario', 'MultiUsuario'] },
          { nome: 'Mercado', usuarios: ['MonoUsuario', 'MultiUsuario'] }
        ]
      }
    }
  }
};
