'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Header } from '@/components/layout/Header';
import { formatCurrency, cn, getColorClass } from '@/lib/utils';
import { Info, TrendingUp, AlertCircle, Sparkles, Zap, Shield, Swords, Compass, Wand2, Plus, Upload, Target, Package, DollarSign, TrendingDown, Edit2, Trash2 } from 'lucide-react';
import { PlanningModal } from '@/components/investments/PlanningModal';
import { ContributionComparison } from '@/components/investments/ContributionComparison';

import { useTheme } from '@/lib/ThemeContext';
import { THEMES } from '@/lib/themes';
import { useKingdom } from '@/hooks/useKingdom';

import { Modal } from '@/components/ui/Modal';
import { ImportModal } from '@/components/ui/ImportModal';

import { financialEngine } from '@/lib/financialEngine';
import { parseDate } from '@/services/firebaseUtils';

export default function Investments() {
  const { theme } = useTheme();
  const colors = THEMES[theme] || THEMES.ORBITA;
  const { assets, loading: kingdomLoading, transactions, addInvestment, updateInvestment, addEarning, deleteInvestment, contributionPlanning, updateContributionPlanning, addTransaction } = useKingdom();

  const { totalValue, aggregated, tickerDetails } = useMemo(() =>
    financialEngine.calculateInvestmentPower(assets, contributionPlanning?.percentages),
    [assets, contributionPlanning]
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<any>(null);
  const [isEarningModalOpen, setIsEarningModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean, ids: string[] | null }>({ isOpen: false, ids: null });
  const [newInvestment, setNewInvestment] = useState({
    type: 'F',
    ticker: '',
    value: '',
    quantity: '',
    operation_date: new Date().toISOString().split('T')[0]
  });

  const [newEarning, setNewEarning] = useState({
    ticker: '',
    amount: '',
    type: 'dividend' as 'dividend' | 'jcp' | 'rent' | 'other',
    date: new Date().toISOString().split('T')[0]
  });

  const handleAddInvestment = async () => {
    if (!newInvestment.ticker || !newInvestment.value || !newInvestment.quantity) return;

    const typeMap: Record<string, string> = {
      'F': 'fii',
      'A': 'stock',
      'C': 'crypto',
      'E': 'etf',
      'R': 'fixed_income',
      'O': 'other'
    };

    const investmentData = {
      type: typeMap[newInvestment.type],
      ticker: newInvestment.ticker.toUpperCase(),
      value: parseFloat(newInvestment.value),
      quantity: parseFloat(newInvestment.quantity),
      date: newInvestment.operation_date
    };

    await addInvestment(investmentData);

    setIsModalOpen(false);
    setNewInvestment({
      type: 'F',
      ticker: '',
      value: '',
      quantity: '',
      operation_date: new Date().toISOString().split('T')[0]
    });
  };
  
  const handleUpdateInvestment = async () => {
    if (!editingInvestment || !editingInvestment.ticker || !editingInvestment.value || !editingInvestment.quantity) return;

    const typeMap: Record<string, string> = {
      'F': 'fii',
      'A': 'stock',
      'C': 'crypto',
      'E': 'etf',
      'R': 'fixed_income',
      'O': 'other'
    };

    const investmentData = {
      type: typeMap[editingInvestment.type] || editingInvestment.type,
      ticker: editingInvestment.ticker.toUpperCase(),
      invested_value: parseFloat(editingInvestment.value),
      quantity: parseFloat(editingInvestment.quantity),
      price: parseFloat(editingInvestment.value) / parseFloat(editingInvestment.quantity),
      date: editingInvestment.operation_date || editingInvestment.date || new Date().toISOString()
    };

    await updateInvestment(editingInvestment.id, investmentData);

    setIsEditModalOpen(false);
    setEditingInvestment(null);
  };

  const handleAddEarning = async () => {
    if (!newEarning.ticker || !newEarning.amount) return;

    await addEarning({
      ticker: newEarning.ticker.toUpperCase(),
      amount: parseFloat(newEarning.amount),
      type: newEarning.type,
      date: newEarning.date
    });

    setIsEarningModalOpen(false);
    setNewEarning({
      ticker: '',
      amount: '',
      type: 'dividend',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleImportInvestments = async (data: { type?: string; ticker: string; value: string; quantity: string; operation_date?: string }[]) => {
    for (const item of data) {
      // expected headers: type, ticker, value, quantity, date
      const typeMap: Record<string, string> = {
        'fii': 'fii',
        'acao': 'stock',
        'stock': 'stock',
        'crypto': 'crypto',
        'etf': 'etf',
        'rf': 'fixed_income',
        'outro': 'other'
      };

      await addInvestment({
        type: typeMap[(item.type || '').toLowerCase()] || 'other',
        ticker: item.ticker.toUpperCase(),
        value: parseFloat(item.value),
        quantity: parseFloat(item.quantity),
        operation_date: item.operation_date || new Date().toISOString().split('T')[0]
      });
    }
  };

  // Estado para garantir que o gráfico só seja renderizado no cliente (evita erro de SSR do Recharts)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const chartData = aggregated.map(asset => ({
    name: asset.name,
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

  const BUFFS = [
    {
      name: 'Banquete Perpétuo',
      desc: 'YoC > 0.8% a.m.',
      active: true,
      icon: Sparkles,
      color: 'text-yellow-500',
      bg: 'bg-yellow-50'
    },
    {
      name: 'Ponte de Bifröst',
      desc: 'Exterior > 10%',
      active: false,
      icon: Compass,
      color: 'text-blue-500',
      bg: 'bg-blue-50'
    },
    {
      name: 'Escudo de Ferro',
      desc: 'Reserva > 6 meses',
      active: true,
      icon: Shield,
      color: 'text-gray-500',
      bg: 'bg-gray-50'
    }
  ];

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
          src="https://picsum.photos/seed/investments/1920/1080"
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
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl medieval-title font-bold text-[var(--color-text-main)]">Inventário</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Onde seus rendimentos se transformam em poder</p>
          </div>
          <div className="flex items-center gap-2">
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
              onClick={() => setIsEarningModalOpen(true)}
              className="px-4 h-10 rounded-xl flex items-center gap-2 bg-amber-900/20 border border-amber-700/50 text-amber-500 shadow-sm font-bold text-sm transition-transform active:scale-95 hover:bg-amber-900/40 medieval-border"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Proventos</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className={cn("px-4 h-10 rounded-xl flex items-center gap-2 text-[var(--color-bg-dark)] shadow-sm font-bold text-sm transition-transform active:scale-95 medieval-border medieval-glow", "bg-[var(--color-primary)]")}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Investir</span>
            </button>
          </div>
        </header>

        {/* ... rest of the component ... */}

        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportInvestments}
          title="Importar Investimentos"
          template={['type', 'ticker', 'value', 'quantity', 'date']}
        />

        <PlanningModal
          isOpen={isPlanningModalOpen}
          onClose={() => setIsPlanningModalOpen(false)}
          onSave={updateContributionPlanning}
          initialPlanning={contributionPlanning}
        />

        <ContributionComparison
          planning={contributionPlanning}
          assets={assets}
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


        {/* [RESPONSIVIDADE] Buffs Section - Scroll horizontal no mobile, flex wrap no desktop */}
        <section className="space-y-4">
          <h4 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Habilidades Passivas (Buffs)</h4>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar md:flex-wrap">
            {BUFFS.map((buff, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-2xl border shrink-0 transition-all md:w-auto medieval-border",
                  buff.active ? "bg-[var(--color-bg-panel)] border-[var(--color-border)] shadow-sm" : "bg-[var(--color-bg-dark)] border-[var(--color-border)] opacity-50"
                )}
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", buff.active ? "bg-amber-900/20 text-amber-500" : "bg-gray-800 text-gray-500")}>
                  <buff.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--color-text-main)] whitespace-nowrap">{buff.name}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)] whitespace-nowrap">{buff.desc}</p>
                </div>
                {buff.active && <div className={cn("w-2 h-2 rounded-full animate-pulse shrink-0", colors.primary)}></div>}
              </div>
            ))}
          </div>
        </section>

        {/* Seção de Resumo por Ticker */}
        <section className="bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm medieval-border space-y-6">
          <h4 className="text-lg medieval-title font-bold text-[var(--color-text-main)]">Resumo por Ticker</h4>
          <div className="overflow-x-auto">
            {summaryArray.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4" />
                <p className="text-[var(--color-text-muted)]">Nenhum investimento encontrado</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--color-bg-dark)] border-b border-[var(--color-border)]">
                    <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">Ticker</th>
                    <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">Tipo</th>
                    <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">Qtd Total</th>
                    <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">Preço Médio</th>
                    <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">Valor Unitário</th>
                    <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">Valor Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {summaryArray.map((item) => (
                    <tr key={item.ticker} className="hover:bg-[var(--color-bg-dark)]/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-[var(--color-text-main)]">{item.ticker}</td>
                      <td className="px-4 py-3 text-xs text-[var(--color-text-muted)] capitalize">{item.type.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-right text-xs text-[var(--color-text-main)]">{item.totalQuantity.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-xs">
                        <span className={getColorClass(item.averagePrice)}>{formatCurrency(item.averagePrice)}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs">
                        <span className={getColorClass(item.unitPrice)}>{formatCurrency(item.unitPrice)}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-bold">
                        <span className={getColorClass(item.totalValue)}>{formatCurrency(item.totalValue)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>


        {/* [RESPONSIVIDADE] Grid principal: 1 coluna no mobile, 2 colunas no desktop (lg) */}
        <div className="grid grid-cols-1 gap-8">

          {/* Painel de Poder F.A.C.E.R.O. */}
          <section className="bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm medieval-border space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg medieval-title font-bold text-[var(--color-text-main)]">Painel de Poder F.A.C.E.R.O.</h4>
              <div className="p-3 bg-[var(--color-bg-dark)] rounded-xl border border-[var(--color-border)]">
                <p className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-widest mb-0.5">Sugestão de Aporte (5%)</p>
                <p className="text-lg font-display font-bold text-[var(--color-text-main)]">
                  <span className={getColorClass(totalValue * 0.05)}>{formatCurrency(totalValue * 0.05)}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Equilíbrio Chart */}
              <div className="h-64 w-full bg-[var(--color-bg-dark)] rounded-xl p-4 border border-[var(--color-border)]">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={30} tick={{ fontSize: 12, fontWeight: 'bold', fill: 'var(--color-text-muted)' }} />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-panel)', color: 'var(--color-text-main)' }}
                      />
                      <Bar dataKey="atual" fill="var(--color-primary)" radius={[0, 4, 4, 0]} name="Poder Atual %" />
                      <Bar dataKey="alvo" fill="var(--color-text-muted)" radius={[0, 4, 4, 0]} opacity={0.3} name="Poder Alvo %" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Lista FACERO Detalhada */}
              <div className="space-y-3">
                {aggregated.map((asset, i) => {
                  const suggestedAmount = (totalValue * 0.05) * asset.targetPercent;
                  const isSelected = selectedCategory === asset.faceroType;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedCategory(isSelected ? null : asset.faceroType)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left",
                        isSelected 
                          ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/5" 
                          : "bg-[var(--color-bg-dark)] border-[var(--color-border)] hover:border-[var(--color-primary)]/50"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center shadow-sm border",
                          isSelected ? "bg-[var(--color-primary)] text-white border-white/20" : "bg-[var(--color-bg-panel)] text-[var(--color-text-muted)] border-[var(--color-border)]"
                        )}>
                          {getFaceroIcon(asset.faceroType)}
                        </div>
                        <div>
                          <p className="text-xs font-black text-[var(--color-text-muted)] uppercase tracking-tighter mb-0.5">
                            {getFaceroName(asset.faceroType)}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[var(--color-text-main)]">
                              {(asset.currentPercent * 100).toFixed(1)}%
                            </span>
                            <span className="text-[10px] text-[var(--color-text-muted)]">
                              alvo: {(asset.targetPercent * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[var(--color-primary)]">
                          {formatCurrency(suggestedAmount)}
                        </p>
                        <p className="text-[10px] text-[var(--color-text-muted)] uppercase font-bold">Sugestão Aporte</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Inventário de Ativos */}
          <section className="space-y-4">
            <h4 className="text-lg medieval-title font-bold text-[var(--color-text-main)]">Inventário de Ativos</h4>
            <div className="bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-2xl overflow-hidden medieval-border shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[var(--color-bg-dark)] border-b border-[var(--color-border)]">
                      <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">Ativo</th>
                      <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">Tipo</th>
                      <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">Qtd</th>
                      <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">Preço</th>
                      <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">Total</th>
                      <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-center">Data Mov.</th>
                      <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {assets
                      .filter(asset => !selectedCategory || asset.faceroType === selectedCategory)
                      .map((asset) => (
                        <tr key={asset.id} className="hover:bg-[var(--color-bg-dark)]/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-[var(--color-bg-dark)] rounded flex items-center justify-center text-[var(--color-primary)] border border-[var(--color-border)]">
                                {getFaceroIcon(asset.faceroType || '')}
                              </div>
                              <span className="text-xs font-bold text-[var(--color-text-main)]">{asset.ticker}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] text-[var(--color-text-muted)] uppercase">{asset.type?.replace('_', ' ')}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-[var(--color-text-main)]">
                            {(asset.quantity || 0).toLocaleString('pt-BR')}
                          </td>
                          <td className="px-4 py-3 text-right text-xs">
                            <span className={getColorClass(asset.price || 0)}>{formatCurrency(asset.price || 0)}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-bold">
                            <span className={getColorClass(asset.total || asset.invested_value || 0)}>{formatCurrency(asset.total || asset.invested_value || 0)}</span>
                          </td>
                          <td className="px-4 py-3 text-center text-[10px] text-[var(--color-text-muted)]">
                            {parseDate(asset.date || asset.operation_date).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingInvestment({
                                    ...asset,
                                    value: asset.invested_value || asset.total || ((asset.price || 0) * (asset.quantity || 0)) || 0,
                                    type: asset.type === 'fii' ? 'F' : 
                                          asset.type === 'stock' ? 'A' :
                                          asset.type === 'crypto' ? 'C' :
                                          asset.type === 'etf' ? 'E' :
                                          asset.type === 'fixed_income' ? 'R' : 'O'
                                  });
                                  setIsEditModalOpen(true);
                                }}
                                className="p-1.5 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded transition-colors"
                                title="Editar"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmation({ isOpen: true, ids: [asset.id] })}
                                className="p-1.5 text-red-500 hover:bg-red-900/10 rounded transition-colors"
                                title="Excluir"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {assets.length === 0 && (
                  <div className="text-center py-12 text-[var(--color-text-muted)]">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Nenhum ativo no inventário.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Modal para Adicionar Proventos */}
      <Modal
        isOpen={isEarningModalOpen}
        onClose={() => setIsEarningModalOpen(false)}
        title="Registrar Proventos"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest block mb-2">Ativo / Ticker</label>
            <select
              value={newEarning.ticker}
              onChange={(e) => setNewEarning({ ...newEarning, ticker: e.target.value })}
              className="w-full px-4 py-3 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all font-medium text-[var(--color-text-main)]"
            >
              <option value="">Selecione um ativo</option>
              {Array.from(new Set(assets.map(a => a.ticker))).map(ticker => (
                <option key={ticker} value={ticker}>{ticker}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest block mb-2">Tipo de Provento</label>
            <select
              value={newEarning.type}
              onChange={(e) => setNewEarning({ ...newEarning, type: e.target.value as 'dividend' | 'jcp' | 'rent' | 'other' })}
              className="w-full px-4 py-3 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all font-medium text-[var(--color-text-main)]"
            >
              <option value="dividend">Dividendo</option>
              <option value="jcp">JCP</option>
              <option value="rent">Aluguel (FII)</option>
              <option value="other">Outros</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest block mb-2">Valor Recebido</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] font-bold">R$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newEarning.amount}
                  onChange={(e) => setNewEarning({ ...newEarning, amount: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all font-bold text-[var(--color-text-main)]"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest block mb-2">Data</label>
              <input
                type="date"
                value={newEarning.date}
                onChange={(e) => setNewEarning({ ...newEarning, date: e.target.value })}
                className="w-full px-4 py-3 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all font-medium text-[var(--color-text-main)]"
              />
            </div>
          </div>

          <button
            onClick={handleAddEarning}
            disabled={!newEarning.ticker || !newEarning.amount}
            className={cn(
              "w-full py-4 rounded-xl font-bold text-[var(--color-bg-dark)] shadow-lg transition-transform active:scale-95 mt-4 medieval-border medieval-glow",
              (!newEarning.ticker || !newEarning.amount) ? "bg-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed" : "bg-amber-500 hover:brightness-110"
            )}
          >
            Registrar Provento
          </button>
        </div>
      </Modal>

      {/* Modal para Editar Investimento */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingInvestment(null);
        }}
        title="Editar Investimento"
      >
        {editingInvestment && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest block mb-2">Categoria F.A.C.E.R.O.</label>
              <select
                value={editingInvestment.type}
                onChange={(e) => setEditingInvestment({ ...editingInvestment, type: e.target.value })}
                className="w-full px-4 py-3 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all font-medium text-[var(--color-text-main)]"
              >
                <option value="F">FUNDOS IMOBILIÁRIOS</option>
                <option value="A">AÇÕES</option>
                <option value="C">CRIPTO ATIVOS</option>
                <option value="E">EXTERIOR ETF</option>
                <option value="R">RENDA FIXA</option>
                <option value="O">OPORTUNIDADES OUTROS INVESTIMENTS</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest block mb-2">Ativo / Ticker</label>
              <input
                type="text"
                placeholder="Ex: MXRF11, PETR4, BTC"
                value={editingInvestment.ticker}
                onChange={(e) => setEditingInvestment({ ...editingInvestment, ticker: e.target.value.toUpperCase() })}
                className="w-full px-4 py-3 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all font-medium text-[var(--color-text-main)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest block mb-2">Quantidade</label>
                <input
                  type="number"
                  step="0.00000001"
                  placeholder="0.00"
                  value={editingInvestment.quantity}
                  onChange={(e) => setEditingInvestment({ ...editingInvestment, quantity: e.target.value })}
                  className="w-full px-4 py-3 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all font-medium text-[var(--color-text-main)]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest block mb-2">Data Operação</label>
                <input
                  type="date"
                  value={editingInvestment.operation_date || (editingInvestment.date ? parseDate(editingInvestment.date).toISOString().split('T')[0] : '')}
                  onChange={(e) => setEditingInvestment({ ...editingInvestment, operation_date: e.target.value })}
                  className="w-full px-4 py-3 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all font-medium text-[var(--color-text-main)]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest block mb-2">Valor Total Investido</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] font-bold">R$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={editingInvestment.value}
                  onChange={(e) => setEditingInvestment({ ...editingInvestment, value: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all font-bold text-[var(--color-text-main)]"
                />
              </div>
            </div>

            <button
              onClick={handleUpdateInvestment}
              disabled={!editingInvestment.ticker || !editingInvestment.value || !editingInvestment.quantity}
              className={cn(
                "w-full py-4 rounded-xl font-bold text-[var(--color-bg-dark)] shadow-lg transition-transform active:scale-95 mt-4 medieval-border medieval-glow",
                (!editingInvestment.ticker || !editingInvestment.value || !editingInvestment.quantity) ? "bg-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed" : "bg-[var(--color-primary)] hover:brightness-110"
              )}
            >
              Salvar Alterações
            </button>
          </div>
        )}
      </Modal>

      {/* Modal para Adicionar Investimento */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setNewInvestment({
            type: 'F',
            ticker: '',
            value: '',
            quantity: '',
            operation_date: new Date().toISOString().split('T')[0]
          });
        }}
        title="Novo Investimento"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest block mb-2">Categoria F.A.C.E.R.O.</label>
            <select
              value={newInvestment.type}
              onChange={(e) => setNewInvestment({ ...newInvestment, type: e.target.value })}
              className="w-full px-4 py-3 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all font-medium text-[var(--color-text-main)]"
            >
              <option value="F">FUNDOS IMOBILIÁRIOS</option>
              <option value="A">AÇÕES</option>
              <option value="C">CRIPTO ATIVOS</option>
              <option value="E">EXTERIOR ETF</option>
              <option value="R">RENDA FIXA</option>
              <option value="O">OPORTUNIDADES OUTROS INVESTIMENTS</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest block mb-2">Ativo / Ticker</label>
            <input
              type="text"
              placeholder="Ex: MXRF11, PETR4, BTC"
              value={newInvestment.ticker}
              onChange={(e) => setNewInvestment({ ...newInvestment, ticker: e.target.value.toUpperCase() })}
              className="w-full px-4 py-3 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all font-medium text-[var(--color-text-main)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest block mb-2">Quantidade</label>
              <input
                type="number"
                step="0.00000001"
                placeholder="0.00"
                value={newInvestment.quantity}
                onChange={(e) => setNewInvestment({ ...newInvestment, quantity: e.target.value })}
                className="w-full px-4 py-3 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all font-medium text-[var(--color-text-main)]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest block mb-2">Data Operação</label>
              <input
                type="date"
                value={newInvestment.operation_date}
                onChange={(e) => setNewInvestment({ ...newInvestment, operation_date: e.target.value })}
                className="w-full px-4 py-3 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all font-medium text-[var(--color-text-main)]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest block mb-2">Valor Total Investido</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] font-bold">R$</span>
              <input
                type="number"
                placeholder="0.00"
                value={newInvestment.value}
                onChange={(e) => setNewInvestment({ ...newInvestment, value: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all font-bold text-[var(--color-text-main)]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest block mb-2">Preço Médio (Calculado)</label>
            <div className="px-4 py-3 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl font-bold text-[var(--color-text-main)]">
              {newInvestment.quantity && newInvestment.value && parseFloat(newInvestment.quantity) !== 0 ? formatCurrency(parseFloat(newInvestment.value) / parseFloat(newInvestment.quantity)) : formatCurrency(0)}
            </div>
          </div>

          <button
            onClick={handleAddInvestment}
            disabled={!newInvestment.ticker || !newInvestment.value || !newInvestment.quantity}
            className={cn(
              "w-full py-4 rounded-xl font-bold text-[var(--color-bg-dark)] shadow-lg transition-transform active:scale-95 mt-4 medieval-border medieval-glow",
              (!newInvestment.ticker || !newInvestment.value || !newInvestment.quantity) ? "bg-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed" : "bg-[var(--color-primary)] hover:brightness-110"
            )}
          >
            Adicionar Investimento
          </button>
        </div>
      </Modal>
    </div>
  );
}
