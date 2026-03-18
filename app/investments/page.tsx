'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BottomNav } from '@/components/BottomNav';
import { Header } from '@/components/Header';
import { MOCK_ASSETS } from '@/lib/data';
import { formatCurrency, cn } from '@/lib/utils';
import { Info, TrendingUp, AlertCircle, Sparkles, Zap, Shield, Swords, Compass, Wand2, Plus, Upload } from 'lucide-react';

import { useTheme } from '@/lib/ThemeContext';
import { THEMES } from '@/lib/themes';
import { useReino } from '@/hooks/useReino';

import { Modal } from '@/components/Modal';
import { ImportModal } from '@/src/components/ImportModal';

import { financialEngine } from '@/lib/financialEngine';

export default function Investments() {
  const { theme } = useTheme();
  const colors = THEMES[theme] || THEMES.default;
  const { assets, loading, addInvestment } = useReino();
  
  const { totalValue, aggregated, tickerDetails } = useMemo(() => 
    financialEngine.calculateInvestmentPower(assets),
    [assets]
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [newInvestment, setNewInvestment] = useState({
    type: 'F',
    ticker: '',
    value: '',
    quantity: '',
    operation_date: new Date().toISOString().split('T')[0]
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
      operation_date: newInvestment.operation_date
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
        operation_date: item.date || new Date().toISOString().split('T')[0]
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
      <div className={cn("min-h-screen flex items-center justify-center", colors.bg)}>
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 font-medium">Carregando Inventário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen transition-colors duration-500", colors.bg)}>
      <Header />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 pb-32 space-y-8">
        {/* [RESPONSIVIDADE] Título da Seção */}
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900">Inventário</h2>
            <p className="text-sm text-gray-500">Onde seus rendimentos se transformam em poder</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 h-10 rounded-xl flex items-center gap-2 bg-white border border-gray-200 text-gray-700 shadow-sm font-bold text-sm transition-transform active:scale-95 hover:bg-gray-50"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Importar</span>
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className={cn("px-4 h-10 rounded-xl flex items-center gap-2 text-white shadow-sm font-bold text-sm transition-transform active:scale-95", colors.primary)}
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


      {/* [RESPONSIVIDADE] Buffs Section - Scroll horizontal no mobile, flex wrap no desktop */}
      <section className="space-y-4">
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Habilidades Passivas (Buffs)</h4>
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar md:flex-wrap">
          {BUFFS.map((buff, i) => (
            <div 
              key={i} 
              className={cn(
                "flex items-center gap-3 p-3 rounded-2xl border shrink-0 transition-all md:w-auto",
                buff.active ? "bg-white border-emerald-100 shadow-sm" : "bg-gray-50 border-gray-100 opacity-50"
              )}
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", buff.bg, buff.color)}>
                <buff.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 whitespace-nowrap">{buff.name}</p>
                <p className="text-[10px] text-gray-500 whitespace-nowrap">{buff.desc}</p>
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
          <section className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Equilíbrio F.A.C.E.R.O. (%)</h4>
            <div className="h-64 sm:h-80 w-full">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: -20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="atual" fill={theme === 'default' ? '#059669' : '#4F46E5'} radius={[0, 4, 4, 0]} name="Poder Atual %" />
                    <Bar dataKey="alvo" fill="#E5E7EB" radius={[0, 4, 4, 0]} name="Poder Alvo %" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* Rebalancing Tool */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className={cn("w-5 h-5", colors.accent)} />
              <h4 className="text-lg font-display font-bold text-gray-900">Quest de Aporte</h4>
            </div>
            
            <div className={cn("rounded-3xl p-6 text-white shadow-xl", colors.primary, colors.shadow)}>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0 backdrop-blur-md">
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
        </div>

      {/* [RESPONSIVIDADE] Coluna Direita (Ocupa 5 de 12 colunas no desktop) */}
        <div className="lg:col-span-5 space-y-8">
          {/* Asset List with Item Status */}
          <section className="space-y-4">
            <h4 className="text-lg font-display font-bold text-gray-900">Inventário de Ativos</h4>
            {/* [RESPONSIVIDADE] No mobile é 1 coluna, no tablet (sm) divide em 2 colunas, no desktop (lg) volta pra 1 coluna pois já está na coluna direita do grid principal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {tickerDetails?.map((asset: any, i: number) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                      {getFaceroIcon(asset.faceroType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{asset.ticker}</p>
                      <p className="text-xs text-gray-500 truncate">Qtd: {asset.totalQuantity.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(asset.totalValue)}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Custo Médio: {formatCurrency(asset.averageCost)}</p>
                    </div>
                  </div>
                </div>
              ))}
              {(!tickerDetails || tickerDetails.length === 0) && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Nenhum ativo no inventário.
                </div>
              )}
            </div>
          </section>
        </div>

      </div>
      </main>
      <BottomNav />

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
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Categoria F.A.C.E.R.O.</label>
            <select 
              value={newInvestment.type}
              onChange={(e) => setNewInvestment({...newInvestment, type: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-gray-900"
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
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Ativo / Ticker</label>
            <input 
              type="text"
              placeholder="Ex: MXRF11, PETR4, BTC"
              value={newInvestment.ticker}
              onChange={(e) => setNewInvestment({...newInvestment, ticker: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-gray-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Quantidade</label>
              <input 
                type="number"
                step="0.00000001"
                placeholder="0.00"
                value={newInvestment.quantity}
                onChange={(e) => setNewInvestment({...newInvestment, quantity: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-gray-900"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Data Operação</label>
              <input 
                type="date"
                value={newInvestment.operation_date}
                onChange={(e) => setNewInvestment({...newInvestment, operation_date: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Valor Total Investido</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
              <input 
                type="number"
                placeholder="0.00"
                value={newInvestment.value}
                onChange={(e) => setNewInvestment({...newInvestment, value: e.target.value})}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-gray-900"
              />
            </div>
          </div>

          <button 
            onClick={handleAddInvestment}
            disabled={!newInvestment.ticker || !newInvestment.value || !newInvestment.quantity}
            className={cn(
              "w-full py-4 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 mt-4",
              (!newInvestment.ticker || !newInvestment.value || !newInvestment.quantity) ? "bg-gray-300 cursor-not-allowed" : colors.primary
            )}
          >
            Adicionar Investimento
          </button>
        </div>
      </Modal>
    </div>
  );
}
