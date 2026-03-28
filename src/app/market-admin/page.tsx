'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAllMarketData } from '@/hooks/useAllMarketData';
import { formatCurrency } from '@/lib/utils';
import { parseDate } from '@/services/firebaseUtils';
import { RefreshCw, Search, Database, ShieldAlert, Settings, TrendingUp, TrendingDown, Globe, BarChart3, ChevronRight } from 'lucide-react';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { MarketConfig } from '@/types';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { motion, AnimatePresence } from 'motion/react';

export default function MarketAdmin() {
  const { marketData, loading: marketLoading } = useAllMarketData();
  const [searchTerm, setSearchTerm] = useState('');
  const [brapiToken, setBrapiToken] = useState('xWvYy544yZfE8Cj1z3FkQx');
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });

  const marketDataArray = Object.values(marketData).sort((a, b) => a.ticker.localeCompare(b.ticker));
  
  const filteredData = marketDataArray.filter(item => 
    item.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.shortName && item.shortName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleManualUpdate = async () => {
    setConfirmModal({ isOpen: false });
    setIsUpdating(true);
    try {
      const configRef = doc(db, 'market_config', 'global');
      const configSnap = await getDoc(configRef);
      
      let config = configSnap.data() as MarketConfig;
      if (!configSnap.exists()) {
        config = {
          enabled: true,
          max_requests_per_day: 500,
          requests_today: 0,
          last_reset: serverTimestamp() as any,
        };
        await setDoc(configRef, config);
      } else {
        const lastReset = config.last_reset ? config.last_reset.toDate() : new Date(0);
        const now = new Date();
        if (lastReset.getDate() !== now.getDate() || lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
          config.requests_today = 0;
          config.last_reset = serverTimestamp() as any;
          await updateDoc(configRef, {
            requests_today: 0,
            last_reset: serverTimestamp(),
          });
        }
      }

      if (!config.enabled) {
        alert('Market data engine is disabled');
        setIsUpdating(false);
        return;
      }

      const investmentsSnap = await getDocs(collection(db, 'investments'));
      const tickers = new Set<string>();
      investmentsSnap.forEach((doc) => {
        const data = doc.data();
        if (data.ticker && typeof data.ticker === 'string') {
          tickers.add(data.ticker.toUpperCase().trim());
        }
      });
      const uniqueTickers = Array.from(tickers);

      let updatedCount = 0;
      let requestsMade = 0;

      for (const ticker of uniqueTickers) {
        if (config.requests_today + requestsMade >= config.max_requests_per_day) {
          break;
        }

        const marketDocRef = doc(db, 'market_data', ticker);
        const marketDocSnap = await getDoc(marketDocRef);
        let needsUpdate = true;

        if (marketDocSnap.exists()) {
          const data = marketDocSnap.data();
          if (data.last_updated) {
            const lastUpdated = data.last_updated.toDate();
            const now = new Date();
            const diffInMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
            if (diffInMinutes <= 30) {
              needsUpdate = false;
            }
          }
        }

        if (needsUpdate) {
          const res = await fetch(`/api/market/fetch?ticker=${ticker}`);
          if (res.ok) {
            const tickerData = await res.json();
            requestsMade++;

            if (tickerData && tickerData.regularMarketPrice) {
              const marketData = {
                ...tickerData,
                ticker: ticker,
                price: tickerData.regularMarketPrice,
                last_updated: serverTimestamp(),
              };

              await setDoc(marketDocRef, marketData, { merge: true });
              updatedCount++;
            }
          }
        }
      }

      if (requestsMade > 0) {
        await updateDoc(configRef, {
          requests_today: increment(requestsMade),
        });

        const todayString = new Date().toISOString().split('T')[0];
        const logRef = doc(db, 'market_usage_logs', todayString);
        await setDoc(logRef, {
          date: todayString,
          total_requests: increment(requestsMade),
          total_tickers: uniqueTickers.length,
          created_at: serverTimestamp(),
        }, { merge: true });
      }

      alert(`Atualização concluída. Tickers atualizados: ${updatedCount}`);
    } catch (error) {
      console.error('Error triggering update:', error);
      alert(`Erro ao acionar atualização manual: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AdminGuard title="Market Data Engine" description="Gerenciamento global de cotações e integração com BRAPI">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Globe className="text-blue-600" size={32} />
              Market Data Engine
            </h1>
            <p className="text-slate-600 font-bold mt-1 uppercase text-[10px] tracking-widest">
              Gerenciamento global de cotações e integração com BRAPI
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setConfirmModal({ isOpen: true })}
              disabled={isUpdating}
              className="px-6 h-12 rounded-2xl flex items-center gap-2 bg-blue-600 text-white shadow-lg shadow-blue-600/20 font-black text-sm transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1"
            >
              <RefreshCw className={`w-5 h-5 ${isUpdating ? 'animate-spin' : ''}`} />
              <span>Forçar Atualização</span>
            </button>
          </div>
        </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Stats & Config */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <Settings size={20} className="text-blue-600" />
                  Configurações
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-600 uppercase tracking-wider ml-1">Token BRAPI</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={brapiToken}
                        onChange={(e) => setBrapiToken(e.target.value)}
                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-slate-900 font-mono text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        placeholder="Token BRAPI"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <ShieldAlert className="w-4 h-4 text-amber-500" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl space-y-3">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status do Cache</p>
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${marketLoading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
                        <span className="text-sm font-black text-slate-900">
                          {marketLoading ? 'Sincronizando...' : `${marketDataArray.length} Tickers`}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Última Varredura</p>
                      <p className="text-sm font-black text-slate-900">
                        {marketDataArray.length > 0 && marketDataArray[0].last_updated 
                          ? parseDate(marketDataArray[0].last_updated).toLocaleDateString('pt-BR') 
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-blue-600/20">
                <BarChart3 className="mb-4 opacity-50" size={32} />
                <h3 className="text-lg font-bold mb-1">Monitoramento</h3>
                <p className="text-blue-100 text-sm leading-relaxed">
                  O motor de mercado atualiza automaticamente os preços a cada 30 minutos quando requisitado pelos usuários.
                </p>
              </div>
            </div>

            {/* Market Data Table */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col h-[700px]">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Base de Cotações</h2>
                    <p className="text-xs text-slate-600 font-black uppercase tracking-wider">Dados em tempo real via BRAPI</p>
                  </div>
                  <div className="relative w-full md:w-72">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por ticker ou nome..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full h-11 bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 text-sm text-slate-900 font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr className="border-b border-slate-100">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-700 uppercase tracking-widest">Ativo</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">Preço</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">Variação</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">Mín/Máx</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-700 uppercase tracking-widest text-center">Atualização</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredData.length > 0 ? (
                        filteredData.map((item, idx) => (
                          <motion.tr 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(idx * 0.01, 0.3) }}
                            key={item.ticker} 
                            className="group hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {item.logourl ? (
                                  <div className="relative w-8 h-8 rounded-xl bg-white border border-slate-100 overflow-hidden p-1 shadow-sm">
                                    <Image src={item.logourl} alt={item.ticker} fill className="object-contain" referrerPolicy="no-referrer" />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                                    {item.ticker.slice(0, 2)}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.ticker}</p>
                                  <p className="text-[10px] font-black text-slate-600 truncate max-w-[120px]">{item.shortName || '-'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <p className="text-sm font-black text-slate-900">{formatCurrency(item.price)}</p>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {item.regularMarketChangePercent !== undefined ? (
                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black ${
                                  item.regularMarketChangePercent >= 0 
                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                    : 'bg-red-100 text-red-700 border border-red-200'
                                }`}>
                                  {item.regularMarketChangePercent >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                  {Math.abs(item.regularMarketChangePercent).toFixed(2)}%
                                </div>
                              ) : '-'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <p className="text-[10px] font-black text-slate-700">
                                {item.regularMarketDayLow && item.regularMarketDayHigh 
                                  ? `${formatCurrency(item.regularMarketDayLow)} - ${formatCurrency(item.regularMarketDayHigh)}`
                                  : '-'}
                              </p>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <p className="text-[10px] font-black text-slate-700">
                                {item.last_updated ? parseDate(item.last_updated).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                              </p>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-20 text-center">
                            <div className="flex flex-col items-center justify-center text-slate-400">
                              <Database size={48} strokeWidth={1} className="mb-4 opacity-20" />
                              <p className="font-bold">{marketLoading ? 'Carregando dados...' : 'Nenhum ticker encontrado'}</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        <AnimatePresence>
          {confirmModal.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setConfirmModal({ isOpen: false })}
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl relative z-10 max-w-sm w-full"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <RefreshCw className="text-blue-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Forçar Atualização</h3>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                  Isso irá consumir créditos da API BRAPI para todos os tickers ativos no sistema. Deseja continuar?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmModal({ isOpen: false })}
                    className="flex-1 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleManualUpdate}
                    className="flex-1 py-3 rounded-2xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm shadow-lg shadow-blue-600/20"
                  >
                    Confirmar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
    </AdminGuard>
  );
}
