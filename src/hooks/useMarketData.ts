import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { MarketData } from '@/types';

export function useMarketData(ticker: string | undefined) {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ticker) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMarketData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const normalizedTicker = ticker.toUpperCase().trim();
    const docRef = doc(db, 'market_data', normalizedTicker);

    const unsubscribe = onSnapshot(docRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          setMarketData(snapshot.data() as MarketData);
        } else {
          setMarketData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error(`Error fetching market data for ${normalizedTicker}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ticker]);

  return { marketData, loading, error };
}
