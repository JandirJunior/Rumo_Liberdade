'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Header } from '@/components/layout/Header';
import { formatCurrency, cn } from '@/lib/utils';
import { Info, TrendingUp, AlertCircle, Sparkles, Zap, Shield, Swords, Compass, Wand2, Plus, Upload, Target } from 'lucide-react';
import { PlanningModal } from '@/components/investments/PlanningModal';
import { ContributionComparison } from '@/components/investments/ContributionComparison';

import { useTheme } from '@/lib/ThemeContext';
import { THEMES } from '@/lib/themes';
import { useKingdom } from '@/hooks/useKingdom';

import { Modal } from '@/components/ui/Modal';
import { ImportModal } from '@/components/ui/ImportModal';

import { financialEngine } from '@/lib/financialEngine';

export default function Investments() {
  const { theme } = useTheme();
  const colors = THEMES[theme] || THEMES.default;
  const { assets, loading, addInvestment, addEarning, deleteInvestment, contributionPlanning, updateContributionPlanning } = useKingdom();
  
  const { totalValue, aggregated, tickerDetails } = useMemo(() => 
    financialEngine.calculateInvestmentPower(assets),
    [assets]
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEarningModalOpen, setIsEarningModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false);
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

    await addInvestment({
      type: typeMap[newInvestment.type],
      ticker: newInvestment.ticker.toUpperCase(),
      value: parseFloat(newInvestment.value),
      quantity: parseFloat(newInvestment.quantity),
      date: newInvestment.operation_date
    });
    
    setIsModalOpen(false);
    setNewInvestment({ 
      type: 'F', 
      ticker: '', 
      value: '', 
      quantity: '', 
      operation_date: new Date().toISOString().split('T')[0] 
    });
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

  const handleImportInvestments = async (data: any[]) => {
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
        type: typeMap[item.type.toLowerCase()] || 'other',
        ticker: item.ticker.toUpperCase(),
        value: parseFloat(item.value),
        quantity: parseFloat(item.quantity),
        date: item.date || new Date().toISOString().split('T')[0]
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
    switch(type) {
      case 'F': return <Swords className="w-4 h-4" />;
      case 'A': return <Wand2 className="w-4 h-4" />;
      case 'C': return <Zap className="w-4 h-4" />;
      case 'E': return <Compass className="w-4 h-4" />;
      case 'R': return <Shield className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  if (loading) {
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
          src="/assets/background/investments.jpg"
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

      {/* [RESPONSIVIDADE] Grid principal: 1 coluna no mobile, 2 colunas no desktop (lg) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* [RESPONSIVIDADE] Coluna Esquerda (Ocupa 7 de 12 colunas no desktop) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Allocation Chart */}
          <section className="bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm medieval-border">
            <h4 className="text-xs font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-6">Equilíbrio F.A.C.E.R.O. (%)</h4>
            <div className="h-64 sm:h-80 w-full">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <BarChart data={chartData} layout="vertical" margin={{ left: -20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: 'var(--color-text-muted)' }} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-panel)', color: 'var(--color-text-main)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                    />
                    <Bar dataKey="atual" fill="var(--color-primary)" radius={[0, 4, 4, 0]} name="Poder Atual %" />
                    <Bar dataKey="alvo" fill="var(--color-border)" radius={[0, 4, 4, 0]} name="Poder Alvo %" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* Rebalancing Tool */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className={cn("w-5 h-5", colors.accent)} />
              <h4 className="text-lg medieval-title font-bold text-[var(--color-text-main)]">Quest de Aporte</h4>
            </div>
            
            <div className={cn("rounded-2xl p-6 text-white shadow-xl medieval-border medieval-glow", colors.primary, colors.shadow)}>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 bg-black/30 rounded-xl flex items-center justify-center shrink-0 backdrop-blur-md">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold">Onde forjar mais poder?</p>
                  <p className="text-xs text-white/70">Ativos abaixo do nível de alocação alvo.</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {aggregated.filter(a => a.deficit > 0).map((asset, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                        {getFaceroIcon(asset.faceroType)}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{asset.name}</p>
                        <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider">Déficit de Poder</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-white">Aportar</p>
                      <p className="text-[10px] text-white/60">-{((asset.deficit) * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Planning Section */}
          <section className="bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm medieval-border">
            <div className="flex items-center gap-2 mb-6">
              <Compass className="w-5 h-5 text-[var(--color-primary)]" />
              <h4 className="text-lg medieval-title font-bold text-[var(--color-text-main)]">Planejamento de Próximo Aporte</h4>
            </div>
            
            <div className="space-y-6">
              <div className="p-4 bg-[var(--color-bg-dark)] rounded-2xl border border-[var(--color-border)]">
                <p className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-widest mb-1">Valor Disponível</p>
                <p className="text-2xl font-display font-bold text-[var(--color-text-main)]">{formatCurrency(totalValue * 0.05)}</p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-1 italic">* Sugestão baseada em 5% do patrimônio atual</p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Distribuição Sugerida (FACERO)</p>
                {aggregated.map((asset, i) => {
                  const suggestedAmount = (totalValue * 0.05) * asset.targetPercent;
                  return (
                    <div key={i} className="flex items-center justify-between p-3 bg-[var(--color-bg-dark)] rounded-xl border border-[var(--color-border)]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[var(--color-bg-panel)] rounded-lg flex items-center justify-center text-[var(--color-text-muted)] shadow-sm border border-[var(--color-border)]">
                          {getFaceroIcon(asset.faceroType)}
                        </div>
                        <span className="text-sm font-medium text-[var(--color-text-main)]">{asset.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[var(--color-text-main)]">{formatCurrency(suggestedAmount)}</p>
                        <p className="text-[10px] text-[var(--color-text-muted)]">{(asset.targetPercent * 100).toFixed(0)}% do aporte</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

      {/* [RESPONSIVIDADE] Coluna Direita (Ocupa 5 de 12 colunas no desktop) */}
        <div className="lg:col-span-5 space-y-8">
          {/* Asset List with Item Status */}
          <section className="space-y-4">
            <h4 className="text-lg medieval-title font-bold text-[var(--color-text-main)]">Inventário de Ativos</h4>
            {/* [RESPONSIVIDADE] No mobile é 1 coluna, no tablet (sm) divide em 2 colunas, no desktop (lg) volta pra 1 coluna pois já está na coluna direita do grid principal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {tickerDetails?.map((asset: any, i: number) => (
                <div key={i} className="bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-2xl p-4 shadow-sm flex flex-col justify-between medieval-border">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-[var(--color-bg-dark)] rounded-2xl flex items-center justify-center text-[var(--color-primary)] shrink-0 border border-[var(--color-border)]">
                      {getFaceroIcon(asset.faceroType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--color-text-main)] truncate">{asset.ticker}</p>
                      <p className="text-xs text-[var(--color-text-muted)] truncate">Qtd: {asset.totalQuantity.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-[var(--color-text-main)]">{formatCurrency(asset.totalValue)}</p>
                      <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Custo Médio: {formatCurrency(asset.averageCost)}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setDeleteConfirmation({ isOpen: true, ids: asset.ids })}
                    className="mt-2 text-xs text-red-500 hover:text-red-700 font-bold"
                  >
                    Excluir
                  </button>
                </div>
              ))}
              {(!tickerDetails || tickerDetails.length === 0) && (
                <div className="text-center py-8 text-[var(--color-text-muted)] text-sm">
                  Nenhum ativo no inventário.
                </div>
              )}
            </div>
          </section>
        </div>

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
              onChange={(e) => setNewEarning({...newEarning, ticker: e.target.value})}
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
              onChange={(e) => setNewEarning({...newEarning, type: e.target.value as any})}
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
                  onChange={(e) => setNewEarning({...newEarning, amount: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all font-bold text-[var(--color-text-main)]"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest block mb-2">Data</label>
              <input 
                type="date"
                value={newEarning.date}
                onChange={(e) => setNewEarning({...newEarning, date: e.target.value})}
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
              onChange={(e) => setNewInvestment({...newInvestment, type: e.target.value})}
              className="w-full px-4 py-3 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all font-medium text-[var(--color-text-main)]"
            >
              <option value="F">Fundo Imobiliário</option>
              <option value="A">Ações</option>
              <option value="C">Cripto</option>
              <option value="E">Exterior / ETFs</option>
              <option value="R">Renda Fixa</option>
              <option value="O">Outros investimentos / Oportunidades</option>
            </select>
          </div>
          
          <div>
            <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest block mb-2">Ativo / Ticker</label>
            <input 
              type="text"
              placeholder="Ex: MXRF11, PETR4, BTC"
              value={newInvestment.ticker}
              onChange={(e) => setNewInvestment({...newInvestment, ticker: e.target.value})}
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
                onChange={(e) => setNewInvestment({...newInvestment, quantity: e.target.value})}
                className="w-full px-4 py-3 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all font-medium text-[var(--color-text-main)]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest block mb-2">Data Operação</label>
              <input 
                type="date"
                value={newInvestment.operation_date}
                onChange={(e) => setNewInvestment({...newInvestment, operation_date: e.target.value})}
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
                onChange={(e) => setNewInvestment({...newInvestment, value: e.target.value})}
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
