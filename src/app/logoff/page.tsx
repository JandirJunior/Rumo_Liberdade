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
        window.location.href = '/login';
      } catch (error) {
        console.error('Error signing out:', error);
        window.location.href = '/login';
      }
    };

    performLogoff();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Desconectando...</h1>
        <p className="text-gray-400">Aguarde enquanto salvamos seu progresso.</p>
      </div>
    </div>
  );
}
