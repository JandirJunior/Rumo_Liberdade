'use client';

import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BottomNav } from '@/components/BottomNav';
import { Header } from '@/components/Header';
import { MOCK_ASSETS } from '@/lib/data';
import { formatCurrency, cn } from '@/lib/utils';
import { Info, TrendingUp, AlertCircle, Sparkles, Zap, Shield, Swords, Compass, Wand2 } from 'lucide-react';

import { useTheme } from '@/lib/ThemeContext';
import { THEMES } from '@/lib/themes';

export default function Investments() {
  const { theme } = useTheme();
  const colors = THEMES[theme] || THEMES.default;
  const totalValue = MOCK_ASSETS.reduce((acc, curr) => acc + curr.value, 0);

  const chartData = MOCK_ASSETS.map(asset => ({
    name: asset.type,
    atual: (asset.value / totalValue) * 100,
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

  return (
    <div className={cn("min-h-screen transition-colors duration-500", colors.bg)}>
      <Header />
      
      <main className="p-6 space-y-8 pb-32 max-w-7xl mx-auto">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900">Caverna</h2>
            <p className="text-sm text-gray-500">Onde seus rendimentos se transformam em poder</p>
          </div>
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
            <Info className={cn("w-5 h-5", colors.accent)} />
          </div>
        </header>

      {/* Buffs Section */}
      <section className="space-y-4">
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Habilidades Passivas (Buffs)</h4>
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {BUFFS.map((buff, i) => (
            <div 
              key={i} 
              className={cn(
                "flex items-center gap-3 p-3 rounded-2xl border shrink-0 transition-all",
                buff.active ? "bg-white border-emerald-100 shadow-sm" : "bg-gray-50 border-gray-100 opacity-50"
              )}
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", buff.bg, buff.color)}>
                <buff.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">{buff.name}</p>
                <p className="text-[10px] text-gray-500">{buff.desc}</p>
              </div>
              {buff.active && <div className={cn("w-2 h-2 rounded-full animate-pulse", colors.primary)}></div>}
            </div>
          ))}
        </div>
      </section>

      {/* Allocation Chart */}
      <section className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm">
        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Equilíbrio F.A.C.E.R.O. (%)</h4>
        <div className="h-64 w-full">
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
            {MOCK_ASSETS.filter(a => (a.value / totalValue) < a.targetPercent).map((asset, i) => (
              <div key={i} className="flex items-center justify-between bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    {getFaceroIcon(asset.faceroType)}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{asset.type}</p>
                    <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider">Déficit de Poder</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-white">Aportar</p>
                  <p className="text-[10px] text-white/60">-{((asset.targetPercent - (asset.value / totalValue)) * 100).toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Asset List with Item Status */}
      <section className="space-y-4">
        <h4 className="text-lg font-display font-bold text-gray-900">Inventário de Ativos</h4>
        <div className="space-y-3">
          {MOCK_ASSETS.map((asset, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-emerald-600">
                  {getFaceroIcon(asset.faceroType)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">{asset.type}</p>
                  <p className="text-xs text-gray-500">{asset.segment}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(asset.value)}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{((asset.value / totalValue) * 100).toFixed(1)}%</p>
                </div>
              </div>
              
              {/* Item Status (P/VP, etc) */}
              <div className="flex gap-2 border-t border-gray-50 pt-3">
                <div className="flex-1 bg-gray-50 rounded-xl p-2 text-center">
                  <p className="text-[8px] font-black text-gray-400 uppercase">P/VP</p>
                  <p className="text-xs font-bold text-emerald-600">0.92</p>
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl p-2 text-center">
                  <p className="text-[8px] font-black text-gray-400 uppercase">DY</p>
                  <p className="text-xs font-bold text-emerald-600">10.5%</p>
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl p-2 text-center">
                  <p className="text-[8px] font-black text-gray-400 uppercase">Status</p>
                  <p className="text-[10px] font-bold text-emerald-500">BARATO</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      </main>
      <BottomNav />
    </div>
  );
}
