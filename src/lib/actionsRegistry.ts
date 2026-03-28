import { z } from 'zod';

export type ActionFieldType = 'text' | 'number' | 'date' | 'select' | 'checkbox';

export interface ActionField {
  name: string;
  label: string;
  type: ActionFieldType;
  required?: boolean;
  options?: { label: string; value: string }[];
  dependsOn?: string;
  condition?: (values: any) => boolean;
  defaultValue?: any;
  placeholder?: string;
  transform?: (value: any) => any;
  step?: string;
}

export interface ActionDefinition {
  id: string;
  label: string;
  originRoute: string;
  fields: ActionField[];
  validationSchema?: z.ZodSchema<any>;
}

export const actionsRegistry: Record<string, ActionDefinition> = {
  investimento_compra: {
    id: 'investimento_compra',
    label: 'Comprar Investimento',
    originRoute: '/investments',
    fields: [
      { name: 'date', label: 'Data da Operação', type: 'date', required: true, defaultValue: new Date().toISOString().split('T')[0] },
      { name: 'categoriaFinanceira', label: 'Categoria', type: 'select', required: true, options: [
        { label: 'FII', value: 'fii' },
        { label: 'Ação', value: 'stock' },
        { label: 'Cripto', value: 'crypto' },
        { label: 'ETF', value: 'etf' },
        { label: 'Renda Fixa', value: 'fixed_income' },
        { label: 'Outros', value: 'other' }
      ]},
      { name: 'descricao', label: 'Descrição (Ticker)', type: 'text', required: true, transform: (v) => v?.toUpperCase(), placeholder: 'Ex: PETR4, AAPL, BTC' },
      { name: 'quantidade', label: 'Quantidade', type: 'number', required: true, step: '0.000001', placeholder: 'Ex: 10' },
      { name: 'valorTotal', label: 'Valor Total (R$)', type: 'number', required: true, step: '0.01', placeholder: 'Ex: 150.00' },
    ]
  },
  investimento_venda: {
    id: 'investimento_venda',
    label: 'Vender Investimento',
    originRoute: '/investments',
    fields: [
      { name: 'date', label: 'Data da Operação', type: 'date', required: true, defaultValue: new Date().toISOString().split('T')[0] },
      { name: 'categoriaFinanceira', label: 'Categoria', type: 'select', required: true, options: [
        { label: 'FII', value: 'fii' },
        { label: 'Ação', value: 'stock' },
        { label: 'Cripto', value: 'crypto' },
        { label: 'ETF', value: 'etf' },
        { label: 'Renda Fixa', value: 'fixed_income' },
        { label: 'Outros', value: 'other' }
      ]},
      { name: 'descricao', label: 'Descrição (Ticker)', type: 'text', required: true, transform: (v) => v?.toUpperCase(), placeholder: 'Ex: PETR4, AAPL, BTC' },
      { name: 'quantidade', label: 'Quantidade', type: 'number', required: true, step: '0.000001', placeholder: 'Ex: 10' },
      { name: 'valorTotal', label: 'Valor Total (R$)', type: 'number', required: true, step: '0.01', placeholder: 'Ex: 150.00' },
    ]
  },
  investimento_proventos: {
    id: 'investimento_proventos',
    label: 'Proventos',
    originRoute: '/investments',
    fields: [
      { name: 'date', label: 'Data da Operação', type: 'date', required: true, defaultValue: new Date().toISOString().split('T')[0] },
      { name: 'tipoProvento', label: 'Tipo de Provento', type: 'select', required: true, options: [
        { label: 'Dividendo', value: 'dividend' },
        { label: 'JCP', value: 'jcp' },
        { label: 'Aluguel (FII)', value: 'rent' },
        { label: 'Outros', value: 'other' }
      ]},
      { name: 'descricao', label: 'Ativo / Ticker', type: 'text', required: true, transform: (v) => v?.toUpperCase(), placeholder: 'Ex: PETR4, AAPL' },
      { name: 'valorTotal', label: 'Valor Recebido (R$)', type: 'number', required: true, step: '0.01', placeholder: 'Ex: 50.00' },
    ]
  },
  receita: {
    id: 'receita',
    label: 'Nova Receita',
    originRoute: '/transactions',
    fields: [
      { name: 'date', label: 'Data da Operação', type: 'date', required: true, defaultValue: new Date().toISOString().split('T')[0] },
      { name: 'categoria', label: 'Categoria', type: 'select', required: true },
      { name: 'descricao', label: 'Descrição', type: 'text', required: true, transform: (v) => v?.toUpperCase(), placeholder: 'Ex: Salário, Venda' },
      { name: 'valorTotal', label: 'Valor Total (R$)', type: 'number', required: true, step: '0.01', placeholder: '0.00' },
      { name: 'recorrente', label: 'É recorrente?', type: 'checkbox', defaultValue: false },
      { name: 'tipoRecorrencia', label: 'Frequência', type: 'select', condition: (v) => v?.recorrente, options: [
        { label: 'Semanal', value: 'weekly' },
        { label: 'Mensal', value: 'monthly' },
        { label: 'Trimestral', value: 'quarterly' },
        { label: 'Anual', value: 'yearly' }
      ]},
      { name: 'diaExecucao', label: 'Dia de Execução', type: 'number', condition: (v) => v?.recorrente, placeholder: 'Ex: 05' },
      { name: 'dataFim', label: 'Data Fim', type: 'date', condition: (v) => v?.recorrente },
    ]
  },
  despesa: {
    id: 'despesa',
    label: 'Nova Despesa',
    originRoute: '/transactions',
    fields: [
      { name: 'date', label: 'Data da Operação', type: 'date', required: true, defaultValue: new Date().toISOString().split('T')[0] },
      { name: 'categoria', label: 'Categoria', type: 'select', required: true },
      { name: 'descricao', label: 'Descrição', type: 'text', required: true, transform: (v) => v?.toUpperCase(), placeholder: 'Ex: Supermercado, Lazer' },
      { name: 'valorTotal', label: 'Valor Total (R$)', type: 'number', required: true, step: '0.01', placeholder: '0.00' },
      { name: 'recorrente', label: 'É recorrente?', type: 'checkbox', defaultValue: false },
      { name: 'tipoRecorrencia', label: 'Frequência', type: 'select', condition: (v) => v?.recorrente, options: [
        { label: 'Semanal', value: 'weekly' },
        { label: 'Mensal', value: 'monthly' },
        { label: 'Trimestral', value: 'quarterly' },
        { label: 'Anual', value: 'yearly' }
      ]},
      { name: 'diaExecucao', label: 'Dia de Execução', type: 'number', condition: (v) => v?.recorrente, placeholder: 'Ex: 10' },
      { name: 'dataFim', label: 'Data Fim', type: 'date', condition: (v) => v?.recorrente },
    ]
  },
  contas_pagar: {
    id: 'contas_pagar',
    label: 'Conta a Pagar',
    originRoute: '/attributes',
    fields: [
      { name: 'dataVencimento', label: 'Data de Vencimento', type: 'date', required: true },
      { name: 'recorrente', label: 'É recorrente?', type: 'checkbox', defaultValue: false },
      { name: 'tipoRecorrencia', label: 'Frequência', type: 'select', condition: (v) => v?.recorrente, options: [
        { label: 'Semanal', value: 'weekly' },
        { label: 'Mensal', value: 'monthly' },
        { label: 'Trimestral', value: 'quarterly' },
        { label: 'Anual', value: 'yearly' }
      ]},
      { name: 'diaExecucao', label: 'Dia de Execução', type: 'number', condition: (v) => v?.recorrente, placeholder: 'Ex: 15' },
      { name: 'dataFim', label: 'Data Fim', type: 'date', condition: (v) => v?.recorrente },
      { name: 'vincularFatura', label: 'Vincular a Fatura?', type: 'checkbox', defaultValue: false },
      { name: 'contaBancaria', label: 'Conta Bancária', type: 'select', condition: (v) => v?.vincularFatura },
      { name: 'parcelas', label: 'Parcelas', type: 'number', condition: (v) => v?.vincularFatura, placeholder: 'Ex: 12' },
      { name: 'cartao', label: 'Cartão', type: 'select', condition: (v) => v?.vincularFatura },
      { name: 'categoria', label: 'Categoria', type: 'select', required: true },
      { name: 'descricao', label: 'Descrição', type: 'text', required: true, transform: (v) => v?.toUpperCase(), placeholder: 'Ex: Aluguel, Luz, Internet' },
      { name: 'valorTotal', label: 'Valor Total (R$)', type: 'number', required: true, step: '0.01', placeholder: '0.00' },
    ]
  },
  contas_receber: {
    id: 'contas_receber',
    label: 'Conta a Receber',
    originRoute: '/attributes',
    fields: [
      { name: 'dataVencimento', label: 'Data de Vencimento', type: 'date', required: true },
      { name: 'recorrente', label: 'É recorrente?', type: 'checkbox', defaultValue: false },
      { name: 'tipoRecorrencia', label: 'Frequência', type: 'select', condition: (v) => v?.recorrente, options: [
        { label: 'Semanal', value: 'weekly' },
        { label: 'Mensal', value: 'monthly' },
        { label: 'Trimestral', value: 'quarterly' },
        { label: 'Anual', value: 'yearly' }
      ]},
      { name: 'diaExecucao', label: 'Dia de Execução', type: 'number', condition: (v) => v?.recorrente, placeholder: 'Ex: 20' },
      { name: 'dataFim', label: 'Data Fim', type: 'date', condition: (v) => v?.recorrente },
      { name: 'categoria', label: 'Categoria', type: 'select', required: true },
      { name: 'descricao', label: 'Descrição', type: 'text', required: true, transform: (v) => v?.toUpperCase(), placeholder: 'Ex: Salário, Freelance, Venda' },
      { name: 'valorTotal', label: 'Valor Total (R$)', type: 'number', required: true, step: '0.01', placeholder: '0.00' },
    ]
  },
  fatura: {
    id: 'fatura',
    label: 'Novo Cartão de Crédito',
    originRoute: '/attributes',
    fields: [
      { name: 'descricao', label: 'Nome do Cartão', type: 'text', required: true, transform: (v) => v?.toUpperCase(), placeholder: 'Ex: Nubank, Inter' },
      { name: 'limite', label: 'Limite (R$)', type: 'number', required: true, step: '0.01', placeholder: '0.00' },
      { name: 'diaFatura', label: 'Dia Fechamento Fatura', type: 'number', required: true, placeholder: 'Ex: 10' },
      { name: 'diaVencimento', label: 'Dia Vencimento', type: 'number', required: true, placeholder: 'Ex: 15' },
      { name: 'categoria', label: 'Categoria Padrão', type: 'select', required: true },
    ]
  },
  conta_bancaria: {
    id: 'conta_bancaria',
    label: 'Nova Conta Bancária',
    originRoute: '/bankAccounts',
    fields: [
      { name: 'nome', label: 'Nome da Conta', type: 'text', required: true, transform: (v) => v?.toUpperCase(), placeholder: 'Ex: Conta Corrente, Poupança' },
      { name: 'limite', label: 'Limite (R$)', type: 'number', required: true, step: '0.01', placeholder: '0.00' },
      { name: 'diaFatura', label: 'Dia Fechamento', type: 'number', required: true, placeholder: 'Ex: 10' },
      { name: 'diaVencimento', label: 'Dia Vencimento', type: 'number', required: true, placeholder: 'Ex: 15' },
    ]
  }
};
