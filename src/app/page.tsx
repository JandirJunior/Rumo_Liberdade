'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/ThemeContext';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useTheme();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-dark)] text-[var(--color-text-main)] medieval-title">
      Carregando Reino...
    </div>
  );
}
