import { useState, useEffect } from 'react';
import { MarketData } from '@/types';
import { marketDataService } from '@/services/marketDataService';

export function useMarketData(tickers: string[]) {
  const [marketData, setMarketData] = useState<Record<string, MarketData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const tickersString = tickers.join(',');

  useEffect(() => {
    let isMounted = true;

    const fetchMarketData = async () => {
      const currentTickers = tickersString ? tickersString.split(',') : [];
      if (currentTickers.length === 0) {
        if (isMounted) {
          setMarketData({});
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const data = await marketDataService.getMarketDataForTickers(currentTickers);
        if (isMounted) {
          setMarketData(data);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching market data:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMarketData();

    return () => {
      isMounted = false;
    };
  }, [tickersString]); // Re-fetch when the list of tickers changes

  return { marketData, loading, error };
}
