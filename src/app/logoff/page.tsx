'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/services/firebase';
import { signOut } from 'firebase/auth';

export default function LogoffPage() {
  const router = useRouter();

  useEffect(() => {
    const performLogoff = async () => {
      try {
        await signOut(auth);
        router.push('/');
      } catch (error) {
        console.error('Error signing out:', error);
        router.push('/');
      }
    };

    performLogoff();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Desconectando...</h1>
        <p className="text-gray-400">Aguarde enquanto salvamos seu progresso.</p>
      </div>
    </div>
  );
}
