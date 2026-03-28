'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo, Fragment } from 'react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Header } from '@/components/layout/Header';
import { formatCurrency, cn, getColorClass } from '@/lib/utils';
import { Info, TrendingUp, AlertCircle, Sparkles, Zap, Shield, Swords, Compass, Wand2, Plus, Upload, Target, Package, DollarSign, TrendingDown, Edit2, Trash2 } from 'lucide-react';
import { PlanningModal } from '@/components/investments/PlanningModal';

import { useTheme } from '@/lib/ThemeContext';
import { THEMES } from '@/lib/themes';
import { useKingdom } from '@/hooks/useKingdom';
import { IMAGES } from '@/assets/images';

import { Modal } from '@/components/ui/Modal';
import { ImportModal } from '@/components/ui/ImportModal';

import { financialEngine } from '@/lib/financialEngine';
import { parseDate } from '@/services/firebaseUtils';
import { useActionContext } from '@/context/ActionContext';
import { useMarketData } from '@/hooks/useMarketData';

export default function Investments() {
  const { theme, user, loading: authLoading } = useTheme();
  const colors = THEMES[theme] || THEMES.ORBITA;
  const { openAction } = useActionContext();

  const { assets, loading: kingdomLoading, transactions, addInvestment, deleteInvestment, contributionPlanning, updateContributionPlanning } = useKingdom();

  const uniqueTickers = useMemo(() => {
    const tickers = new Set<string>();
    assets.forEach(asset => {
      if (asset.ticker) tickers.add(asset.ticker.toUpperCase());
    });
    return Array.from(tickers);
  }, [assets]);

  const { marketData } = useMarketData(uniqueTickers);

  const { totalValue, aggregated, tickerDetails } = useMemo(() =>
    financialEngine.calculateInvestmentPower(assets, contributionPlanning?.percentages, marketData),
    [assets, contributionPlanning, marketData]
  );

  const historyAssets = useMemo(() => {
    return [...assets].sort((a, b) => {
      const dateA = new Date(a.date || a.operation_date || 0).getTime();
      const dateB = new Date(b.date || b.operation_date || 0).getTime();
      return dateB - dateA;
    });
  }, [assets]);

  const groupedConsolidated = useMemo(() => {
    const groups: Record<string, (typeof tickerDetails[0] & { profitValue: number; profitPercent: number })[]> = {
      'F': [], 'A': [], 'C': [], 'E': [], 'R': [], 'O': []
    };
    (tickerDetails || []).forEach(item => {
      const fType = item.faceroType || 'O';
      if (!groups[fType]) groups[fType] = [];
      
      const profitValue = item.correctedTotal - item.totalValue;
      const profitPercent = item.totalValue > 0 ? (profitValue / item.totalValue) * 100 : 0;

      groups[fType].push({
        ...item,
        profitValue,
        profitPercent
      });
    });
    return groups;
  }, [tickerDetails]);

  const highestDeficit = useMemo(() => {
    if (!aggregated || aggregated.length === 0) return null;
    return aggregated.reduce((prev, current) => (prev.deficit > current.deficit) ? prev : current);
  }, [aggregated]);

  const dominantCategory = useMemo(() => {
    if (!aggregated || aggregated.length === 0) return null;
    return aggregated.reduce((prev, current) => (prev.currentPercent > current.currentPercent) ? prev : current);
  }, [aggregated]);

  const totalTickers = tickerDetails?.length || 0;

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean, ids: string[] | null }>({ isOpen: false, ids: null });

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-dark)]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[var(--color-text-muted)] font-medium">Carregando Inventário...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleImportInvestments = async (data: { operacao: string; categoria: string; ativo: string; valor: string; quantidade: string; data: string }[]) => {
    for (const item of data) {
      // expected headers: data, operacao, categoria, ativo, quantidade, valor
      
      const categoryMap: Record<string, string> = {
        'ação': 'stock',
        'acao': 'stock',
        'fii': 'fii',
        'cripto': 'crypto',
        'etf': 'etf',
        'renda fixa': 'fixed_income',
        'renda_fixa': 'fixed_income'
      };

      const operacao = (item.operacao || '').toLowerCase();
      const isSale = operacao === 'venda';
      
      const rawValue = parseFloat((item.valor || '0').replace(/\./g, '').replace(',', '.'));
      const rawQuantity = parseFloat((item.quantidade || '0').replace(/\./g, '').replace(',', '.'));

      const finalValue = isSale ? -Math.abs(rawValue) : Math.abs(rawValue);
      const finalQuantity = isSale ? -Math.abs(rawQuantity) : Math.abs(rawQuantity);
      
      const categoryKey = (item.categoria || '').toLowerCase();
      const investmentType = categoryMap[categoryKey] || 'other';

      // Handle date format DD/MM/YYYY
      const dateParts = item.data.split('/');
      const formattedDate = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : new Date().toISOString().split('T')[0];

      await addInvestment({
        type: investmentType,
        ticker: item.ativo.toUpperCase(),
        value: finalValue,
        quantity: finalQuantity,
        operation_date: formattedDate
      });
    }
  };

  // Estado para garantir que o gráfico só seja renderizado no cliente (evita erro de SSR do Recharts)
  const chartData = aggregated.map(asset => ({
    name: asset.name,
    shortName: asset.shortName,
    atual: asset.currentPercent * 100,
    alvo: asset.targetPercent * 100,
    valor: asset.value,
    type: asset.faceroType,
  }));

  const filteredTickerDetails = selectedCategory
    ? tickerDetails?.filter(asset => asset.faceroType === selectedCategory)
    : tickerDetails;

  const filteredAggregated = selectedCategory
    ? aggregated.filter(asset => asset.faceroType === selectedCategory)
    : aggregated;

  const summaryArray = (tickerDetails || []).map(item => ({
    ticker: item.ticker,
    totalValue: item.totalValue,
    totalQuantity: item.totalQuantity,
    averagePrice: item.averageCost,
    unitPrice: item.unitPrice,
    type: item.type
  }));

  const getFaceroIcon = (type: string) => {
    switch (type) {
      case 'F': return <Swords className="w-4 h-4" />;
      case 'A': return <Wand2 className="w-4 h-4" />;
      case 'C': return <Zap className="w-4 h-4" />;
      case 'E': return <Compass className="w-4 h-4" />;
      case 'R': return <Shield className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getFaceroName = (type: string) => {
    switch (type) {
      case 'F': return 'FUNDOS IMOBILIÁRIOS';
      case 'A': return 'AÇÕES';
      case 'C': return 'CRIPTO ATIVOS';
      case 'E': return 'EXTERIOR/ETF';
      case 'R': return 'RENDA FIXA';
      case 'O': return 'OPORTUNIDADES/OUTROS INVESTIMENTOS';
      default: return 'OUTROS';
    }
  };

  if (kingdomLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-dark)]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[var(--color-text-muted)] font-medium">Carregando Inventário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-500 bg-[var(--color-bg-dark)] relative overflow-hidden">
      {/* Imagem de Fundo Sugestiva */}
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none">
        <Image
          src={IMAGES.INVESTMENTS}
          alt="Investments Background"
          fill
          priority
          className="object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      <Header />

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 pb-32 space-y-8 relative z-10">
        {/* [RESPONSIVIDADE] Título da Seção */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl medieval-title font-bold text-[var(--color-text-main)]">Tesouro Real</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Gerencie seus ativos e expanda seu domínio financeiro</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsPlanningModalOpen(true)}
              className="px-4 h-10 rounded-xl flex items-center gap-2 bg-[var(--color-bg-panel)] border border-[var(--color-border)] text-[var(--color-text-main)] shadow-sm font-bold text-sm transition-transform active:scale-95 hover:bg-[var(--color-bg-dark)] medieval-border"
            >
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Planejamento</span>
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 h-10 rounded-xl flex items-center gap-2 bg-[var(--color-bg-panel)] border border-[var(--color-border)] text-[var(--color-text-main)] shadow-sm font-bold text-sm transition-transform active:scale-95 hover:bg-[var(--color-bg-dark)] medieval-border"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Importar</span>
            </button>
            <button
              onClick={() => openAction('investimento_proventos')}
              className="px-4 h-10 rounded-xl flex items-center gap-2 bg-amber-900/20 border border-amber-700/50 text-amber-500 shadow-sm font-bold text-sm transition-transform active:scale-95 hover:bg-amber-900/40 medieval-border"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Proventos</span>
            </button>
            <button
              onClick={() => openAction('investimento_venda')}
              className="px-4 h-10 rounded-xl flex items-center gap-2 bg-red-900/20 border border-red-700/50 text-red-500 shadow-sm font-bold text-sm transition-transform active:scale-95 hover:bg-red-900/40 medieval-border"
            >
              <TrendingDown className="w-4 h-4" />
              <span className="hidden sm:inline">Vender</span>
            </button>
            <button
              onClick={() => openAction('investimento_compra')}
              className="px-4 h-10 rounded-xl flex items-center gap-2 bg-emerald-900/20 border border-emerald-700/50 text-emerald-500 shadow-sm font-bold text-sm transition-transform active:scale-95 hover:bg-emerald-900/40 medieval-border"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Comprar</span>
            </button>
          </div>
        </header>

        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportInvestments}
          title="Importar Investimentos"
          template={['Data', 'Operacao', 'Categoria', 'Ativo', 'Quantidade', 'Valor']}
          separator=";"
          description="O arquivo deve ser um CSV (separado por ;) com os seguintes cabeçalhos: Data, Operacao, Categoria, Ativo, Quantidade, Valor."
        />

        <PlanningModal
          isOpen={isPlanningModalOpen}
          onClose={() => setIsPlanningModalOpen(false)}
          onSave={updateContributionPlanning}
          initialPlanning={contributionPlanning}
        />

        {/* Modal de Confirmação de Exclusão */}
        <Modal
          isOpen={deleteConfirmation.isOpen}
          onClose={() => setDeleteConfirmation({ isOpen: false, ids: null })}
          title="Confirmar Exclusão"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-red-950/20 border border-red-900/30 rounded-2xl">
              <AlertCircle className="w-8 h-8 text-red-500 shrink-0" />
              <p className="text-sm text-red-200">
                Tem certeza que deseja excluir este investimento? Esta ação também removerá a transação financeira associada e não pode ser desfeita.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmation({ isOpen: false, ids: null })}
                className="flex-1 px-4 py-3 bg-[var(--color-bg-dark)] text-[var(--color-text-main)] rounded-xl font-bold border border-[var(--color-border)] hover:bg-[var(--color-bg-panel)] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (deleteConfirmation.ids) {
                    await deleteInvestment(deleteConfirmation.ids);
                    setDeleteConfirmation({ isOpen: false, ids: null });
                  }
                }}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-900/20 hover:bg-red-700 transition-all"
              >
                Excluir Agora
              </button>
            </div>
          </div>
        </Modal>

        {/* Gráfico Comparativo (Alinhamento Estratégico) */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm medieval-border space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xl medieval-title font-bold text-[var(--color-text-main)]">Alinhamento Estratégico F.A.C.E.R.O.</h4>
                <p className="text-sm text-[var(--color-text-muted)]">Comparativo entre o percentual investido e o percentual planejado</p>
              </div>
              <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[var(--color-primary)]"></div>
                  <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase">Investido</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[var(--color-text-muted)] opacity-50"></div>
                  <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase">Planejado</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full bg-[var(--color-bg-dark)] rounded-xl p-4 border border-[var(--color-border)]">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <BarChart data={chartData} margin={{ left: 0, right: 0, top: 20, bottom: 5 }}>
                    <XAxis dataKey="shortName" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: 'var(--color-text-muted)' }} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} width={40} tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-panel)', color: 'var(--color-text-main)' }}
                      formatter={(value: number | string) => [`${Number(value).toFixed(2)}%`, '']}
                    />
                    <Bar dataKey="atual" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="Investido (%)" />
                    <Bar dataKey="alvo" fill="var(--color-text-muted)" radius={[4, 4, 0, 0]} opacity={0.3} name="Planejado (%)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm medieval-border flex flex-col justify-between">
            <div>
              <h4 className="text-xl medieval-title font-bold text-[var(--color-text-main)] mb-6">Resumo do Reino</h4>
              
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-[var(--color-text-muted)]">Patrimônio Total</p>
                  <p className="text-3xl font-bold text-[var(--color-text-main)]">{formatCurrency(totalValue)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[var(--color-bg-dark)] rounded-xl border border-[var(--color-border)]">
                    <p className="text-xs text-[var(--color-text-muted)] mb-1">Maior Defasagem</p>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-500" />
                      <span className="font-bold text-[var(--color-text-main)] truncate" title={highestDeficit?.name || '-'}>{highestDeficit?.name || '-'}</span>
                    </div>
                    <p className="text-xs text-red-500 mt-1">Falta {((highestDeficit?.deficit || 0) * 100).toFixed(1)}%</p>
                  </div>

                  <div className="p-4 bg-[var(--color-bg-dark)] rounded-xl border border-[var(--color-border)]">
                    <p className="text-xs text-[var(--color-text-muted)] mb-1">Classe Dominante</p>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className="font-bold text-[var(--color-text-main)] truncate" title={dominantCategory?.name || '-'}>{dominantCategory?.name || '-'}</span>
                    </div>
                    <p className="text-xs text-emerald-500 mt-1">{((dominantCategory?.currentPercent || 0) * 100).toFixed(1)}% da carteira</p>
                  </div>
                </div>

                <div className="p-4 bg-[var(--color-bg-dark)] rounded-xl border border-[var(--color-border)] flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] mb-1">Ativos na Carteira</p>
                    <p className="font-bold text-[var(--color-text-main)] text-xl">{totalTickers}</p>
                  </div>
                  <Package className="w-8 h-8 text-[var(--color-text-muted)] opacity-50" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Lista Consolidada de Investimentos (Agrupada por FACERO) */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-xl medieval-title font-bold text-[var(--color-text-main)]">Grimório de Ativos (Posição Consolidada)</h4>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--color-primary)]" />
              <span className="text-sm font-bold text-[var(--color-text-muted)] hidden sm:inline">ROI e Preço Atual</span>
            </div>
          </div>
          
          <div className="space-y-6">
            {tickerDetails?.length > 0 ? (
              <div className="bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-2xl overflow-hidden medieval-border shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-[var(--color-bg-dark)] border-b border-[var(--color-border)]">
                        <th className="px-4 py-3 text-xs font-black text-[var(--color-text-muted)] uppercase tracking-widest">Ativo</th>
                        <th className="px-4 py-3 text-xs font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">Qtd</th>
                        <th className="px-4 py-3 text-xs font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">Preço Médio</th>
                        <th className="px-4 py-3 text-xs font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">Preço Atual</th>
                        <th className="px-4 py-3 text-xs font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">Total Investido</th>
                        <th className="px-4 py-3 text-xs font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">Total Corrigido</th>
                        <th className="px-4 py-3 text-xs font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">L/P (%)</th>
                        <th className="px-4 py-3 text-xs font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">L/P (R$)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {['F', 'A', 'C', 'E', 'R', 'O'].map((fType) => {
                        const items = groupedConsolidated[fType];
                        if (!items || items.length === 0) return null;
                        
                        return (
                          <Fragment key={fType}>
                            <tr className="bg-[var(--color-bg-dark)]/50">
                              <td colSpan={8} className="px-4 py-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-md bg-[var(--color-bg-panel)] flex items-center justify-center text-[var(--color-primary)] border border-[var(--color-border)]">
                                    {getFaceroIcon(fType)}
                                  </div>
                                  <span className="text-xs font-black text-[var(--color-text-main)] uppercase tracking-widest">{getFaceroName(fType)}</span>
                                </div>
                              </td>
                            </tr>
                            {items.map((item) => (
                              <tr key={item.ticker} className="hover:bg-[var(--color-bg-dark)]/50 transition-colors">
                                <td className="px-4 py-3 font-bold text-[var(--color-text-main)] text-sm">{item.ticker}</td>
                                <td className="px-4 py-3 text-right text-sm text-[var(--color-text-main)]">{item.totalQuantity.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</td>
                                <td className="px-4 py-3 text-right text-sm text-[var(--color-text-muted)]">{formatCurrency(item.averageCost)}</td>
                                <td className="px-4 py-3 text-right text-sm text-[var(--color-text-main)] font-medium">{formatCurrency(item.currentPrice)}</td>
                                <td className="px-4 py-3 text-right text-sm text-[var(--color-text-muted)]">{formatCurrency(item.totalValue)}</td>
                                <td className="px-4 py-3 text-right text-sm text-[var(--color-text-main)] font-bold">{formatCurrency(item.correctedTotal)}</td>
                                <td className="px-4 py-3 text-right text-sm font-bold">
                                  <span className={getColorClass(item.profitPercent)}>{item.profitPercent > 0 ? '+' : ''}{item.profitPercent.toFixed(2)}%</span>
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-bold">
                                  <span className={getColorClass(item.profitValue)}>{item.profitValue > 0 ? '+' : ''}{formatCurrency(item.profitValue)}</span>
                                </td>
                              </tr>
                            ))}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-2xl medieval-border">
                <TrendingUp className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4 opacity-20" />
                <p className="text-[var(--color-text-muted)] font-bold">Nenhum investimento consolidado encontrado</p>
              </div>
            )}
          </div>
        </section>

        {/* Histórico de Investimentos */}
        <section className="space-y-6">
          <h4 className="text-xl medieval-title font-bold text-[var(--color-text-main)]">Pergaminho de Transações (Histórico)</h4>
          <div className="bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-2xl overflow-hidden medieval-border shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-[var(--color-bg-dark)] border-b border-[var(--color-border)]">
                    <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-center">Data Mov.</th>
                    <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">Ativo</th>
                    <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">Tipo de Investimento</th>
                    <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-center">Operação</th>
                    <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">Qtd</th>
                    <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">Preço</th>
                    <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">Total</th>
                    <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {historyAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-[var(--color-bg-dark)]/50 transition-colors">
                      <td className="px-4 py-3 text-center text-xs text-[var(--color-text-muted)] font-medium">
                        {parseDate(asset.date || asset.operation_date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-[var(--color-bg-dark)] rounded flex items-center justify-center text-[var(--color-primary)] border border-[var(--color-border)]">
                            {getFaceroIcon(asset.faceroType || '')}
                          </div>
                          <span className="text-xs font-bold text-[var(--color-text-main)]">{asset.ticker}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">{getFaceroName(asset.faceroType || '')}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider",
                          (asset.invested_value || asset.total || 0) < 0 
                            ? "bg-red-900/20 text-red-500" 
                            : "bg-emerald-900/20 text-emerald-500"
                        )}>
                          {(asset.invested_value || asset.total || 0) < 0 ? 'Venda' : 'Compra'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-[var(--color-text-main)]">
                        {(Math.abs(asset.quantity || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-[var(--color-text-muted)]">
                        <span className="font-bold text-[var(--color-text-main)]">{formatCurrency(asset.price || 0)}</span>
                        <span className="opacity-50">/{(Math.abs(asset.quantity || 0)).toLocaleString('pt-BR')}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-bold text-[var(--color-text-main)]">
                        {formatCurrency(Math.abs(asset.total || asset.invested_value || 0))}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              const typeMapReverse: Record<string, string> = {
                                'F': 'fii',
                                'A': 'stock',
                                'C': 'crypto',
                                'E': 'etf',
                                'R': 'fixed_income',
                                'O': 'other'
                              };
                              const assetType = asset.type || typeMapReverse[asset.faceroType || 'O'] || 'other';
                              const assetValue = asset.invested_value || asset.total || ((asset.price || 0) * (asset.quantity || 0)) || 0;
                              const isSale = assetValue < 0;
                              
                              openAction(isSale ? 'investimento_venda' : 'investimento_compra', {
                                id: asset.id,
                                categoriaFinanceira: assetType,
                                descricao: asset.ticker,
                                valorTotal: Math.abs(assetValue),
                                quantidade: Math.abs(asset.quantity || 0),
                                usarDataManual: true,
                                dataRegistro: (asset.operation_date || asset.date || new Date().toISOString()).split('T')[0]
                              });
                            }}
                            className="p-1.5 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmation({ isOpen: true, ids: [asset.id] })}
                            className="p-1.5 text-red-500 hover:bg-red-900/10 rounded transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {historyAssets.length === 0 && (
                <div className="text-center py-12 text-[var(--color-text-muted)]">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-bold">Nenhum ativo no histórico.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
