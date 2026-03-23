/**
 * Página Inicial (Home): Ponto de entrada principal da aplicação "Rumo a Liberdade".
 * Responsável por redirecionar usuários autenticados para o dashboard ou para o login.
 * Implementa lógica de roteamento condicional baseada no estado de autenticação do usuário.
 * Utiliza o contexto de tema para verificar se o usuário está logado e se os dados estão carregando.
 */
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
        router.push('/logon');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-dark)] text-[var(--color-text-main)] medieval-title">
      Carregando Reino...
    </div>
  );
}
