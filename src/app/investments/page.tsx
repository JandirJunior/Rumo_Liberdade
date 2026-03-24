'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
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

export default function Investments() {
  const { theme, user, loading: authLoading } = useTheme();
  const colors = THEMES[theme] || THEMES.ORBITA;

  const { assets, loading: kingdomLoading, transactions, addInvestment, updateInvestment, addEarning, deleteInvestment, contributionPlanning, updateContributionPlanning, addTransaction } = useKingdom();

  const { totalValue, aggregated, tickerDetails } = useMemo(() =>
    financialEngine.calculateInvestmentPower(assets, contributionPlanning?.percentages),
    [assets, contributionPlanning]
  );

  const historyAssets = useMemo(() => {
    return [...assets].sort((a, b) => {
      const dateA = new Date(a.date || a.operation_date || 0).getTime();
      const dateB = new Date(b.date || b.operation_date || 0).getTime();
      return dateB - dateA;
    });
  }, [assets]);

  const groupedConsolidated = useMemo(() => {
    const groups: Record<string, any[]> = {
      'F': [], 'A': [], 'C': [], 'E': [], 'R': [], 'O': []
    };
    (tickerDetails || []).forEach(item => {
      const fType = item.faceroType || 'O';
      if (!groups[fType]) groups[fType] = [];
      
      // Mock current price (using averageCost for now, to be updated by API later)
      const currentPrice = item.averageCost; 
      const correctedTotal = currentPrice * item.totalQuantity;
      const profitValue = correctedTotal - item.totalValue;
      const profitPercent = item.totalValue > 0 ? (profitValue / item.totalValue) * 100 : 0;

      groups[fType].push({
        ...item,
        currentPrice,
        correctedTotal,
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
                      formatter={(value: any) => [`${Number(value).toFixed(2)}%`, '']}
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
            {['F', 'A', 'C', 'E', 'R', 'O'].map((fType) => {
              const items = groupedConsolidated[fType];
              if (!items || items.length === 0) return null;
              
              const groupTotal = items.reduce((acc, item) => acc + item.totalValue, 0);
              const groupCorrected = items.reduce((acc, item) => acc + item.correctedTotal, 0);
              const groupProfit = groupCorrected - groupTotal;
              const groupProfitPercent = groupTotal > 0 ? (groupProfit / groupTotal) * 100 : 0;

              return (
                <div key={fType} className="bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-2xl overflow-hidden medieval-border shadow-sm">
                  <div className="bg-[var(--color-bg-dark)] p-4 border-b border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-panel)] flex items-center justify-center text-[var(--color-primary)] border border-[var(--color-border)] shadow-inner">
                        {getFaceroIcon(fType)}
                      </div>
                      <div>
                        <h5 className="text-sm font-black text-[var(--color-text-main)] uppercase tracking-widest">{getFaceroName(fType)}</h5>
                        <p className="text-xs text-[var(--color-text-muted)]">{items.length} ativo(s)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] text-[var(--color-text-muted)] uppercase font-bold">Total Investido</p>
                        <p className="text-sm font-bold text-[var(--color-text-main)]">{formatCurrency(groupTotal)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-[var(--color-text-muted)] uppercase font-bold">Lucro/Prejuízo</p>
                        <p className={cn("text-sm font-bold", getColorClass(groupProfit))}>
                          {groupProfit > 0 ? '+' : ''}{formatCurrency(groupProfit)} ({groupProfitPercent > 0 ? '+' : ''}{groupProfitPercent.toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                      <thead>
                        <tr className="bg-[var(--color-bg-panel)] border-b border-[var(--color-border)]">
                          <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">Ativo</th>
                          <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">Qtd</th>
                          <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">Preço Médio</th>
                          <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">Preço Atual</th>
                          <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">Total Investido</th>
                          <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">Total Corrigido</th>
                          <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">L/P (%)</th>
                          <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">L/P (R$)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)]">
                        {items.map((item) => (
                          <tr key={item.ticker} className="hover:bg-[var(--color-bg-dark)]/50 transition-colors">
                            <td className="px-4 py-3 font-bold text-[var(--color-text-main)]">{item.ticker}</td>
                            <td className="px-4 py-3 text-right text-xs text-[var(--color-text-main)]">{item.totalQuantity.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</td>
                            <td className="px-4 py-3 text-right text-xs text-[var(--color-text-muted)]">{formatCurrency(item.averageCost)}</td>
                            <td className="px-4 py-3 text-right text-xs text-[var(--color-text-main)]">{formatCurrency(item.currentPrice)}</td>
                            <td className="px-4 py-3 text-right text-xs font-bold text-[var(--color-text-main)]">{formatCurrency(item.totalValue)}</td>
                            <td className="px-4 py-3 text-right text-xs font-bold text-[var(--color-text-main)]">{formatCurrency(item.correctedTotal)}</td>
                            <td className="px-4 py-3 text-right text-xs font-bold">
                              <span className={getColorClass(item.profitPercent)}>{item.profitPercent > 0 ? '+' : ''}{item.profitPercent.toFixed(2)}%</span>
                            </td>
                            <td className="px-4 py-3 text-right text-xs font-bold">
                              <span className={getColorClass(item.profitValue)}>{item.profitValue > 0 ? '+' : ''}{formatCurrency(item.profitValue)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
            
            {tickerDetails?.length === 0 && (
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
                      <td className="px-4 py-3 text-right text-xs text-[var(--color-text-main)]">
                        {(asset.quantity || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-[var(--color-text-muted)]">
                        {formatCurrency(asset.price || 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-bold text-[var(--color-text-main)]">
                        {formatCurrency(asset.total || asset.invested_value || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingInvestment({
                                ...asset,
                                value: asset.invested_value || asset.total || ((asset.price || 0) * (asset.quantity || 0)) || 0,
                                type: asset.faceroType || 'O'
                              });
                              setIsEditModalOpen(true);
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
