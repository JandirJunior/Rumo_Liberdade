/**
 * Página de Login: Ponto de entrada do aplicativo "Rumo a Liberdade".
 * Apresenta uma interface temática de RPG para autenticação do usuário.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Lock, User, Castle, Sparkles } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  // Estados para armazenar as credenciais de login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  // Função para lidar com o envio do formulário de login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulação de login: redireciona para o dashboard se os campos estiverem preenchidos
    if (email && password) {
      router.push('/dashboard');
    }
  };

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
        <form onSubmit={handleLogin} className="space-y-6 bg-white/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/60 shadow-xl">
          {/* Campo de Email */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#5d4037] uppercase tracking-widest ml-1">Email</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b7355]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/80 border border-[#f5deb3] rounded-2xl focus:ring-2 focus:ring-[#d2b48c] focus:border-transparent transition-all outline-none shadow-sm text-[#5d4037]"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          {/* Campo de Senha */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#5d4037] uppercase tracking-widest ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b7355]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/80 border border-[#f5deb3] rounded-2xl focus:ring-2 focus:ring-[#d2b48c] focus:border-transparent transition-all outline-none shadow-sm text-[#5d4037]"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Botão de Ação Principal: Entrar */}
          <button
            type="submit"
            className="w-full py-4 bg-[#d2b48c] hover:bg-[#c19a6b] text-white font-black rounded-2xl shadow-lg shadow-[#d2b48c]/30 transition-all active:scale-95 uppercase tracking-widest"
          >
            Entrar no Reino
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
