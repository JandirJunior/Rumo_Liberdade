import { db } from '@/services/firebase';
import { collection, doc, getDoc, getDocs, setDoc, Timestamp, query, where, writeBatch, updateDoc, increment } from 'firebase/firestore';
import { MarketData, MarketConfig } from '@/types';

const CACHE_DURATION_MS = 1000 * 60 * 30; // 30 minutos

export interface BrapiResult {
  symbol: string;
  regularMarketPrice?: number;
  shortName?: string;
  longName?: string;
  currency?: string;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketTime?: string;
  regularMarketVolume?: number;
  marketCap?: number;
  regularMarketPreviousClose?: number;
  regularMarketOpen?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  fiftyTwoWeekLow?: number;
  fiftyTwoWeekHigh?: number;
  priceEarnings?: number;
  earningsPerShare?: number;
  logourl?: string;
}

export const marketDataService = {
  /**
   * Busca todos os investimentos de todos os reinos, extrai os tickers e remove duplicados.
   */
  async getUniqueTickers(): Promise<string[]> {
    try {
      const investmentsRef = collection(db, 'investments');
      const snapshot = await getDocs(investmentsRef);
      const tickers = new Set<string>();
      
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.ticker) {
          tickers.add(data.ticker.toUpperCase());
        }
      });
      
      return Array.from(tickers);
    } catch (error) {
      console.error('Erro ao buscar tickers únicos:', error);
      return [];
    }
  },

  /**
   * Verifica se um ticker precisa ser atualizado (se não existe ou se passou de 30 minutos).
   */
  async shouldUpdateTicker(ticker: string): Promise<boolean> {
    try {
      const docRef = doc(db, 'market_data', ticker);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) return true;
      
      const data = docSnap.data() as MarketData;
      const lastUpdated = data.last_updated?.toMillis() || 0;
      const now = Timestamp.now().toMillis();
      
      return (now - lastUpdated) > CACHE_DURATION_MS;
    } catch (error) {
      console.error(`Erro ao verificar status do ticker ${ticker}:`, error);
      return true; // Em caso de erro, tenta atualizar
    }
  },

  /**
   * Consome a BRAPI para buscar o preço de um ou mais tickers.
   */
  async fetchTickerPrice(tickers: string[]): Promise<BrapiResult[]> {
    if (!tickers || tickers.length === 0) return [];
    
    const BRAPI_TOKEN = process.env.NEXT_PUBLIC_BRAPI_TOKEN;
    if (!BRAPI_TOKEN) {
      console.error('BRAPI_TOKEN não configurado');
      return [];
    }

    const tickersString = tickers.join(',');
    const url = `https://brapi.dev/api/quote/${tickersString}?token=${BRAPI_TOKEN}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erro na BRAPI: ${response.statusText}`);
      }
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Erro ao buscar preço na BRAPI:', error);
      return [];
    }
  },

  /**
   * Busca dados de mercado para uma lista de tickers no Firestore.
   */
  async getMarketDataForTickers(tickers: string[]): Promise<Record<string, MarketData>> {
    const results: Record<string, MarketData> = {};
    if (!tickers || tickers.length === 0) return results;

    try {
      // O Firestore permite no máximo 30 elementos em um 'in' query.
      // Vamos dividir em lotes de 30.
      const batchSize = 30;
      for (let i = 0; i < tickers.length; i += batchSize) {
        const batch = tickers.slice(i, i + batchSize);
        const q = query(collection(db, 'market_data'), where('ticker', 'in', batch));
        const snapshot = await getDocs(q);
        
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as MarketData;
          results[data.ticker] = data;
        });
      }
      return results;
    } catch (error) {
      console.error('Erro ao buscar dados de mercado para tickers:', error);
      return results;
    }
  },

  /**
   * Fluxo principal de atualização de dados de mercado.
   */
  async updateMarketData(): Promise<{ success: boolean; message: string; updatedCount: number }> {
    try {
      // 1. Validar config (enabled)
      const configRef = doc(db, 'market_config', 'global');
      const configSnap = await getDoc(configRef);
      
      let config = configSnap.data() as MarketConfig;
      const now = new Date();
      const timestampNow = Timestamp.fromDate(now);

      if (!configSnap.exists()) {
        config = {
          enabled: true,
          max_requests_per_day: 500,
          requests_today: 0,
          last_reset: timestampNow as any,
        };
        await setDoc(configRef, config);
      } else {
        // 2. Resetar contador diário se necessário
        const lastReset = config.last_reset ? (config.last_reset as any).toDate() : new Date(0);
        if (lastReset.getDate() !== now.getDate() || lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
          config.requests_today = 0;
          config.last_reset = timestampNow as any;
          await updateDoc(configRef, {
            requests_today: 0,
            last_reset: timestampNow,
          });
        }
      }

      if (!config.enabled) {
        return { success: false, message: 'Market data engine is disabled', updatedCount: 0 };
      }

      // 3. Verificar limite de requisições
      if (config.requests_today >= config.max_requests_per_day) {
        return { success: false, message: 'Daily request limit reached', updatedCount: 0 };
      }

      // 4. Buscar tickers únicos
      const uniqueTickers = await this.getUniqueTickers();
      if (uniqueTickers.length === 0) {
        return { success: true, message: 'Nenhum ticker encontrado nos investimentos', updatedCount: 0 };
      }

      // 5. Filtrar os que precisam atualização
      const tickersToUpdate: string[] = [];
      for (const ticker of uniqueTickers) {
        if (await this.shouldUpdateTicker(ticker)) {
          tickersToUpdate.push(ticker);
        }
      }

      if (tickersToUpdate.length === 0) {
        return { success: true, message: 'Nenhum ticker precisa de atualização no momento', updatedCount: 0 };
      }

      // 6. Fazer chamadas API (em lotes para não estourar a URL)
      const batchSize = 20;
      let totalUpdated = 0;
      
      for (let i = 0; i < tickersToUpdate.length; i += batchSize) {
        const batchTickers = tickersToUpdate.slice(i, i + batchSize);
        const results = await this.fetchTickerPrice(batchTickers);
        
        if (results && results.length > 0) {
          // 7. Salvar em /market_data
          const firestoreBatch = writeBatch(db);
          
          results.forEach((item: BrapiResult) => {
            const ticker = item.symbol;
            const marketData: MarketData = {
              ticker,
              price: item.regularMarketPrice || 0,
              last_updated: timestampNow,
              shortName: item.shortName,
              longName: item.longName,
              currency: item.currency,
              regularMarketChange: item.regularMarketChange,
              regularMarketChangePercent: item.regularMarketChangePercent,
              regularMarketTime: item.regularMarketTime,
              regularMarketVolume: item.regularMarketVolume,
              marketCap: item.marketCap,
              regularMarketPreviousClose: item.regularMarketPreviousClose,
              regularMarketOpen: item.regularMarketOpen,
              regularMarketDayHigh: item.regularMarketDayHigh,
              regularMarketDayLow: item.regularMarketDayLow,
              fiftyTwoWeekLow: item.fiftyTwoWeekLow,
              fiftyTwoWeekHigh: item.fiftyTwoWeekHigh,
              priceEarnings: item.priceEarnings,
              earningsPerShare: item.earningsPerShare,
              logourl: item.logourl
            };

            const docRef = doc(db, 'market_data', ticker);
            firestoreBatch.set(docRef, marketData, { merge: true });
            totalUpdated++;
          });

          await firestoreBatch.commit();

          // 8. Atualizar contador
          await updateDoc(configRef, {
            requests_today: increment(1),
          });

          // 9. Criar log
          const todayString = now.toISOString().split('T')[0];
          const logRef = doc(db, 'market_usage_logs', todayString);
          await setDoc(logRef, {
            date: todayString,
            total_requests: increment(1),
            total_tickers: increment(results.length),
            last_updated: timestampNow,
          }, { merge: true });
        }
      }

      return { success: true, message: 'Market data atualizado com sucesso', updatedCount: totalUpdated };
    } catch (error) {
      console.error('Erro no updateMarketData:', error);
      return { success: false, message: 'Erro interno ao atualizar market data', updatedCount: 0 };
    }
  }
};
