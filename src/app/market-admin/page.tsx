'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTheme } from '@/lib/ThemeContext';
import { THEMES } from '@/lib/themes';
import { Header } from '@/components/layout/Header';
import { useAllMarketData } from '@/hooks/useAllMarketData';
import { formatCurrency } from '@/lib/utils';
import { parseDate } from '@/services/firebaseUtils';
import { RefreshCw, Search, Database, ShieldAlert, Settings } from 'lucide-react';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { MarketConfig } from '@/types';

export default function MarketAdmin() {
  const { theme, user, loading: authLoading } = useTheme();
  const colors = THEMES[theme] || THEMES.ORBITA;
  const { marketData, loading: marketLoading } = useAllMarketData();
  const [searchTerm, setSearchTerm] = useState('');
  const [brapiToken, setBrapiToken] = useState('xWvYy544yZfE8Cj1z3FkQx'); // Hardcoded for now, as requested to have a field
  const [isUpdating, setIsUpdating] = useState(false);

  // Convert object to array and sort by ticker
  const marketDataArray = Object.values(marketData).sort((a, b) => a.ticker.localeCompare(b.ticker));
  
  const filteredData = marketDataArray.filter(item => 
    item.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.shortName && item.shortName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleManualUpdate = async () => {
    setIsUpdating(true);
    try {
      console.log('Starting manual update...');
      // 1. Get Market Config
      const configRef = doc(db, 'market_config', 'global');
      console.log('Fetching market_config...');
      const configSnap = await getDoc(configRef);
      
      let config = configSnap.data() as MarketConfig;
      if (!configSnap.exists()) {
        console.log('Creating default market_config...');
        config = {
          enabled: true,
          max_requests_per_day: 500,
          requests_today: 0,
          last_reset: serverTimestamp() as any,
        };
        await setDoc(configRef, config);
      } else {
        // Check if we need to reset the daily counter
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

      // 2. Get Unique Tickers
      console.log('Fetching investments...');
      const investmentsSnap = await getDocs(collection(db, 'investments'));
      const tickers = new Set<string>();
      investmentsSnap.forEach((doc) => {
        const data = doc.data();
        if (data.ticker && typeof data.ticker === 'string') {
          tickers.add(data.ticker.toUpperCase().trim());
        }
      });
      const uniqueTickers = Array.from(tickers);
      console.log('Tickers found:', uniqueTickers);

      let updatedCount = 0;
      let requestsMade = 0;

      // 3. Fetch and Update
      for (const ticker of uniqueTickers) {
        if (config.requests_today + requestsMade >= config.max_requests_per_day) {
          console.warn('Daily request limit reached');
          break;
        }

        // Check if needs update
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
          console.log(`Fetching price for ${ticker}...`);
          // Fetch from our API route to hide the token
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
        // Update config requests_today
        console.log('Updating config...');
        await updateDoc(configRef, {
          requests_today: increment(requestsMade),
        });

        // Log usage
        const todayString = new Date().toISOString().split('T')[0];
        const logRef = doc(db, 'market_usage_logs', todayString);
        console.log('Logging usage...');
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-dark)]">
        <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen transition-colors duration-500 bg-[var(--color-bg-dark)]">
      <Header />

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 pb-32 space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl medieval-title font-bold text-[var(--color-text-main)] flex items-center gap-3">
              <Database className="w-8 h-8 text-[var(--color-primary)]" />
              Market Data Engine (Admin)
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Gerenciamento global de cotações e integração com BRAPI
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleManualUpdate}
              disabled={isUpdating}
              className="px-4 h-10 rounded-xl flex items-center gap-2 bg-[var(--color-primary)] text-white shadow-sm font-bold text-sm transition-transform active:scale-95 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
              <span>Forçar Atualização</span>
            </button>
          </div>
        </header>

        {/* Configurações */}
        <section className="bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm medieval-border">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-5 h-5 text-[var(--color-text-muted)]" />
            <h3 className="text-lg font-bold text-[var(--color-text-main)]">Configurações do Motor</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                Token BRAPI
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={brapiToken}
                  onChange={(e) => setBrapiToken(e.target.value)}
                  className="w-full h-12 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl px-4 text-[var(--color-text-main)] font-mono text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                  placeholder="Insira o token da BRAPI"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2" title="Token hardcoded no backend atualmente">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                </div>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                Este token é utilizado pelo backend para buscar as cotações. (Atualmente configurado via variável de ambiente/código no backend).
              </p>
            </div>
            
            <div className="flex flex-col justify-center">
              <div className="bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-xl p-4">
                <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-bold mb-1">Status do Banco de Dados</p>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${marketLoading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                  <span className="text-sm font-bold text-[var(--color-text-main)]">
                    {marketLoading ? 'Sincronizando...' : `${marketDataArray.length} Tickers em Cache`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tabela de Dados */}
        <section className="bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-2xl overflow-hidden medieval-border shadow-sm">
          <div className="p-4 border-b border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--color-bg-dark)]">
            <h3 className="text-lg font-bold text-[var(--color-text-main)]">Dados Importados</h3>
            
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Buscar ticker..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-xl pl-9 pr-4 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-[var(--color-bg-panel)] border-b border-[var(--color-border)]">
                  <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">Ticker</th>
                  <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">Nome (Short)</th>
                  <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">Preço Atual</th>
                  <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">Variação Dia</th>
                  <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">Abertura</th>
                  <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">Mín/Máx Dia</th>
                  <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">Volume</th>
                  <th className="px-4 py-3 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-center">Última Atualização</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <tr key={item.ticker} className="hover:bg-[var(--color-bg-dark)]/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-[var(--color-text-main)]">
                        <div className="flex items-center gap-2">
                          {item.logourl && (
                            <div className="relative w-6 h-6 rounded-full bg-white overflow-hidden p-0.5">
                              <Image src={item.logourl} alt={item.ticker} fill className="object-contain" referrerPolicy="no-referrer" />
                            </div>
                          )}
                          {item.ticker}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--color-text-muted)] truncate max-w-[150px]" title={item.longName || item.shortName}>
                        {item.shortName || '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[var(--color-text-main)]">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-bold">
                        {item.regularMarketChangePercent !== undefined ? (
                          <span className={item.regularMarketChangePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                            {item.regularMarketChangePercent > 0 ? '+' : ''}{item.regularMarketChangePercent.toFixed(2)}%
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-[var(--color-text-muted)]">
                        {item.regularMarketOpen ? formatCurrency(item.regularMarketOpen) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-[var(--color-text-muted)]">
                        {item.regularMarketDayLow && item.regularMarketDayHigh 
                          ? `${formatCurrency(item.regularMarketDayLow)} - ${formatCurrency(item.regularMarketDayHigh)}`
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-[var(--color-text-muted)]">
                        {item.regularMarketVolume ? item.regularMarketVolume.toLocaleString('pt-BR') : '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-[var(--color-text-muted)]">
                        {item.last_updated ? parseDate(item.last_updated).toLocaleString('pt-BR') : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                      {marketLoading ? 'Carregando dados...' : 'Nenhum ticker encontrado no Market Data Engine.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
