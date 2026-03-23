/**
 * Página de Login: Ponto de entrada do aplicativo "Rumo a Liberdade".
 * Apresenta uma interface temática de RPG para autenticação do usuário.
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Lock, User, Castle, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { auth } from '@/services/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useTheme } from '@/lib/ThemeContext';
import { userService } from '@/services/userService';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useTheme();
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Função para lidar com o envio do formulário de login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const loggedUser = result.user;

      // SaaS Onboarding Flow
      const existingUser = await userService.getUser(loggedUser.uid);
      if (!existingUser) {
        // Create the user
        await userService.createUser(
          loggedUser.uid,
          loggedUser.email || '',
          loggedUser.displayName || ''
        );
      }

      router.push('/dashboard');
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        console.error('Login error:', err);
      }
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        setError('O login foi cancelado. Por favor, tente novamente.');
      } else if (err?.code === 'auth/popup-blocked') {
        setError('O navegador bloqueou o popup de login. Por favor, permita popups.');
      } else {
        setError('Falha ao autenticar. Tente novamente.');
      }
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-dark)] text-[var(--color-text-main)] medieval-title">Carregando...</div>;
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-8 overflow-hidden bg-[var(--color-bg-dark)]">
      {/* Camada de Fundo: Imagem ilustrativa de aventura RPG com overlay de gradiente */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://ibb.co/23jJ57gK"
          alt="RPG Adventure Background"
          fill
          priority
          className="object-cover opacity-20 mix-blend-overlay"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-bg-dark)]/90 via-[var(--color-bg-dark)]/60 to-[var(--color-bg-dark)]/90"></div>
      </div>

      {/* Container Principal Animado */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm md:max-w-md lg:max-w-lg z-10"
      >
        {/* Logotipo e Título do Aplicativo */}
        <div className="flex flex-col items-center mb-12">
          <div className="w-24 h-24 bg-[var(--color-bg-panel)] rounded-[2rem] flex items-center justify-center shadow-2xl mb-6 rotate-3 border-2 border-[var(--color-border)] medieval-border medieval-glow">
            <Castle className="w-12 h-12 text-[var(--color-primary)] -rotate-3" />
          </div>
          <h1 className="text-4xl font-display font-black text-[var(--color-text-main)] tracking-tighter text-center medieval-title">RUMO A LIBERDADE</h1>
          <p className="text-[var(--color-text-muted)] font-medium text-sm mt-1 lowercase tracking-widest">controle financeiro</p>
        </div>

        {/* Formulário de Login com efeito de Glassmorphism */}
        <form onSubmit={handleLogin} className="space-y-6 bg-[var(--color-bg-panel)]/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-[var(--color-border)] shadow-xl flex flex-col items-center medieval-border">
          {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
          
          <button
            type="submit"
            className="w-full py-4 bg-[var(--color-primary)] hover:brightness-110 text-[var(--color-bg-dark)] font-black rounded-2xl shadow-lg transition-all active:scale-95 uppercase tracking-widest flex items-center justify-center gap-2 medieval-border medieval-glow"
          >
            <User className="w-5 h-5" />
            Entrar com Google
          </button>

          {/* Botão Secundário: Iniciar Gênese (Quiz de Arquétipo) */}
          <button
            type="button"
            onClick={() => router.push('/genesis')}
            className="w-full py-4 bg-transparent border-2 border-[var(--color-border)] text-[var(--color-text-main)] hover:bg-[var(--color-border)] font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-sm medieval-border"
          >
            <Sparkles className="w-5 h-5 text-[var(--color-primary)]" />
            Iniciar Gênese
          </button>
        </form>

        {/* Link para Cadastro */}
        <p className="mt-8 text-center text-[var(--color-text-muted)] text-sm">
          Ainda não tem conta? <span className="text-[var(--color-primary)] font-black cursor-pointer underline decoration-[var(--color-primary)] underline-offset-4">Cadastre-se</span>
        </p>
      </motion.div>
    </div>
  );
}
