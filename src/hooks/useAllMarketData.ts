import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { MarketData } from '@/types';

export function useAllMarketData() {
  const [marketData, setMarketData] = useState<Record<string, MarketData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const colRef = collection(db, 'market_data');

    const unsubscribe = onSnapshot(colRef, 
      (snapshot) => {
        const data: Record<string, MarketData> = {};
        snapshot.forEach((doc) => {
          data[doc.id] = doc.data() as MarketData;
        });
        setMarketData(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching all market data:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { marketData, loading, error };
}
