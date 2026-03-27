import { NextResponse } from 'next/server';
import { db } from '@/services/firebase';
import { doc, writeBatch, Timestamp, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { MarketData, MarketConfig } from '@/types';

const BRAPI_TOKEN = process.env.NEXT_PUBLIC_BRAPI_TOKEN; // Idealmente deveria ser uma variável de ambiente privada (sem NEXT_PUBLIC_)

export async function POST(request: Request) {
  try {
    const { tickers } = await request.json();

    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json({ error: 'Tickers inválidos' }, { status: 400 });
    }

    if (!BRAPI_TOKEN) {
      console.error('BRAPI_TOKEN não configurado');
      return NextResponse.json({ error: 'Configuração de API ausente' }, { status: 500 });
    }

    // 1. Verificar limites no market_config
    const configRef = doc(db, 'market_config', 'global');
    const configSnap = await getDoc(configRef);
    
    let config = configSnap.data() as MarketConfig;
    const now = new Date();

    if (!configSnap.exists()) {
      config = {
        enabled: true,
        max_requests_per_day: 500,
        requests_today: 0,
        last_reset: Timestamp.fromDate(now) as any,
      };
      await setDoc(configRef, config);
    } else {
      // Verificar se precisamos resetar o contador diário
      const lastReset = config.last_reset ? (config.last_reset as any).toDate() : new Date(0);
      if (lastReset.getDate() !== now.getDate() || lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
        config.requests_today = 0;
        config.last_reset = Timestamp.fromDate(now) as any;
        await updateDoc(configRef, {
          requests_today: 0,
          last_reset: Timestamp.fromDate(now),
        });
      }
    }

    if (!config.enabled) {
      return NextResponse.json({ error: 'Market data engine is disabled' }, { status: 403 });
    }

    const uniqueTickers = Array.from(new Set(tickers.map(t => t.toUpperCase())));
    
    // Cada chamada à BRAPI com múltiplos tickers conta como 1 requisição?
    // A documentação da BRAPI diz que sim, mas vamos ser conservadores e contar como 1 requisição por chamada em lote.
    if (config.requests_today >= config.max_requests_per_day) {
      return NextResponse.json({ error: 'Daily request limit reached' }, { status: 429 });
    }

    const result: Record<string, MarketData> = {};

    // A BRAPI permite buscar múltiplos tickers separados por vírgula
    const tickersString = uniqueTickers.join(',');
    const url = `https://brapi.dev/api/quote/${tickersString}?token=${BRAPI_TOKEN}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro na BRAPI: ${response.statusText}`);
    }

    const data = await response.json();
    const timestampNow = Timestamp.now();

    // Atualizar o Firestore em lote
    const batch = writeBatch(db);

    if (data.results && Array.isArray(data.results)) {
      data.results.forEach((item: any) => {
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

        result[ticker] = marketData;
        const docRef = doc(db, 'market_data', ticker);
        batch.set(docRef, marketData, { merge: true });
      });

      await batch.commit();

      // Atualizar o contador de requisições
      await updateDoc(configRef, {
        requests_today: increment(1),
      });

      // Registrar uso
      const todayString = now.toISOString().split('T')[0];
      const logRef = doc(db, 'market_usage_logs', todayString);
      await setDoc(logRef, {
        date: todayString,
        total_requests: increment(1),
        total_tickers: increment(uniqueTickers.length),
        last_updated: timestampNow,
      }, { merge: true });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao atualizar dados de mercado:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
