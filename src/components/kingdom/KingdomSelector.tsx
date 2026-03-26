'use client';

import { useState, useEffect } from 'react';
import { useKingdom } from '@/contexts/KingdomContext';
import { useRouter } from 'next/navigation';
import { Castle, ChevronRight } from 'lucide-react';

export function KingdomSelector() {
  const { kingdoms, selectKingdom, loading } = useKingdom();
  const router = useRouter();

  if (loading) return <div>Carregando reinos...</div>;

  return (
    <div className="p-8 space-y-6">
      <h2 className="text-2xl font-bold">Escolha seu Reino</h2>
      <div className="grid gap-4">
        {kingdoms.map((kingdom) => (
          <button
            key={kingdom.id}
            onClick={() => {
              selectKingdom(kingdom.id);
              router.push('/dashboard');
            }}
            className="p-4 bg-panel rounded-xl border flex items-center justify-between hover:bg-border transition-all"
          >
            <div className="flex items-center gap-4">
              <Castle className="w-8 h-8 text-primary" />
              <span className="font-bold">{kingdom.name}</span>
            </div>
            <ChevronRight className="w-5 h-5" />
          </button>
        ))}
      </div>
    </div>
  );
}
