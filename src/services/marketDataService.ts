import { db } from '@/services/firebase';
import { collection, doc, getDoc, getDocs, setDoc, Timestamp, query, where, writeBatch } from 'firebase/firestore';
import { MarketData } from '@/types';

const CACHE_DURATION_MS = 1000 * 60 * 60; // 1 hora

export const marketDataService = {
  /**
   * Obtém dados de mercado para uma lista de tickers.
   * Verifica o cache do Firestore primeiro. Se os dados estiverem desatualizados ou ausentes,
   * chama a API interna para buscar na BRAPI e atualizar o Firestore.
   */
  async getMarketDataForTickers(tickers: string[]): Promise<Record<string, MarketData>> {
    if (!tickers || tickers.length === 0) return {};

    const uniqueTickers = Array.from(new Set(tickers.map(t => t.toUpperCase())));
    const result: Record<string, MarketData> = {};
    const tickersToFetch: string[] = [];
    const now = Timestamp.now();

    // Dividir em lotes de 10 para a query 'in' do Firestore
    const batches = [];
    for (let i = 0; i < uniqueTickers.length; i += 10) {
      batches.push(uniqueTickers.slice(i, i + 10));
    }

    try {
      for (const batch of batches) {
        const q = query(collection(db, 'market_data'), where('ticker', 'in', batch));
        const snapshot = await getDocs(q);
        
        const foundTickers = new Set<string>();
        
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as MarketData;
          foundTickers.add(data.ticker);
          
          // Verificar se os dados estão atualizados
          const lastUpdated = data.last_updated?.toMillis() || 0;
          if (now.toMillis() - lastUpdated < CACHE_DURATION_MS) {
            result[data.ticker] = data;
          } else {
            tickersToFetch.push(data.ticker);
          }
        });

        // Adicionar tickers que não foram encontrados no Firestore
        batch.forEach(ticker => {
          if (!foundTickers.has(ticker)) {
            tickersToFetch.push(ticker);
          }
        });
      }

      // Buscar dados ausentes ou desatualizados via API interna
      if (tickersToFetch.length > 0) {
        const response = await fetch('/api/market/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tickers: tickersToFetch })
        });

        if (response.ok) {
          const updatedData: Record<string, MarketData> = await response.json();
          Object.assign(result, updatedData);
        } else {
          console.error('Falha ao buscar dados de mercado da API:', await response.text());
        }
      }
    } catch (error) {
      console.error('Erro no marketDataService:', error);
    }

    return result;
  }
};
