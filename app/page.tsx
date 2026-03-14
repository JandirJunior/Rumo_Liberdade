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
import { auth } from '@/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useTheme } from '@/lib/ThemeContext';
import { userService } from '@/src/services/userService';

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
      console.error(err);
      setError('Falha ao autenticar. Tente novamente.');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#fdf5e6]">Carregando...</div>;
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-8 overflow-hidden bg-[#fdf5e6]">
      {/* Camada de Fundo: Imagem ilustrativa de aventura RPG com overlay de gradiente */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1920"
          alt="RPG Adventure Background"
          fill
          className="object-cover opacity-30"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#fdf5e6]/80 via-transparent to-[#fdf5e6]/80"></div>
      </div>

      {/* Container Principal Animado */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm md:max-w-md lg:max-w-lg z-10"
      >
        {/* Logotipo e Título do Aplicativo */}
        <div className="flex flex-col items-center mb-12">
          <div className="w-24 h-24 bg-[#d2b48c] rounded-[2rem] flex items-center justify-center shadow-2xl mb-6 rotate-3 border-4 border-[#f5deb3]">
            <Castle className="w-12 h-12 text-[#5d4037] -rotate-3" />
          </div>
          <h1 className="text-4xl font-display font-black text-[#5d4037] tracking-tighter text-center">RUMO A LIBERDADE</h1>
          <p className="text-[#8b7355] font-medium text-sm mt-1 lowercase tracking-widest">controle financeiro</p>
        </div>

        {/* Formulário de Login com efeito de Glassmorphism */}
        <form onSubmit={handleLogin} className="space-y-6 bg-white/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/60 shadow-xl flex flex-col items-center">
          {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
          
          <button
            type="submit"
            className="w-full py-4 bg-[#d2b48c] hover:bg-[#c19a6b] text-white font-black rounded-2xl shadow-lg shadow-[#d2b48c]/30 transition-all active:scale-95 uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <User className="w-5 h-5" />
            Entrar com Google
          </button>

          {/* Botão Secundário: Iniciar Gênese (Quiz de Arquétipo) */}
          <button
            type="button"
            onClick={() => router.push('/genesis')}
            className="w-full py-4 bg-white/60 border-2 border-[#d2b48c] text-[#5d4037] font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
          >
            <Sparkles className="w-5 h-5 text-[#d2b48c]" />
            Iniciar Gênese
          </button>
        </form>

        {/* Link para Cadastro */}
        <p className="mt-8 text-center text-[#8b7355] text-sm">
          Ainda não tem conta? <span className="text-[#5d4037] font-black cursor-pointer underline decoration-[#d2b48c] underline-offset-4">Cadastre-se</span>
        </p>
      </motion.div>
    </div>
  );
}
