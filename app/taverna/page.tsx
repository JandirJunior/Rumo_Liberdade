/**
 * Página da Taberna: Local onde o usuário escolhe sua classe (arquétipo) financeira.
 * Cada classe representa uma estratégia de investimento diferente.
 */
'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useTheme } from '@/lib/ThemeContext';
import { THEMES, ARCHETYPE_THEME_MAP } from '@/lib/themes';
import Image from 'next/image';
import { BottomNav } from '@/components/BottomNav';
import { Archetype } from '@/lib/types';
import { ARCHETYPE_IMAGES } from '@/lib/data';
import { Shield, Wand2, Pickaxe, Compass, VenetianMask, Home, Zap, Trophy, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/Header';

// Definição das classes disponíveis com seus nomes, descrições, ícones e imagens ilustrativas.
const ARCHETYPES: { type: Archetype; name: string; desc: string; icon: any; color: string; illustration: string }[] = [
  { 
    type: 'Paladino', 
    name: 'FESTIM', 
    desc: 'Foco em Fundos Imobiliários e Fundos de papeis e Fiagros viver de Rendimentos (Aluguéis).', 
    icon: Shield,
    color: 'bg-amber-600',
    illustration: '/Festin.png'
  },
  { 
    type: 'Mago', 
    name: 'ARCANO', 
    desc: 'Foco em Ações e viver de Dividendos (Cotas de Empresas).', 
    icon: Wand2,
    color: 'bg-purple-600',
    illustration: '/Arcano.png'
  },
  { 
    type: 'Dwarf Minerador', 
    name: 'CACHE', 
    desc: 'Foco em Cripto Ativos e Moedas Digitais.', 
    icon: Pickaxe,
    color: 'bg-emerald-600',
    illustration: '/Cache.png'
  },
  { 
    type: 'Elfo', 
    name: 'EXODO', 
    desc: 'Foco em Ações e Fundos e Variação Cambial, investimentos fora do Brasil.', 
    icon: Compass,
    color: 'bg-blue-600',
    illustration: '/Exodia.png'
  },
  { 
    type: 'Ladrão', 
    name: 'REAVER', 
    desc: 'Foco em CDBs e também em Previdencia privada VGBL e tesouro selic e tesouro direto.', 
    icon: VenetianMask,
    color: 'bg-slate-700',
    illustration: '/Reaver.png'
  },
  { 
    type: 'Hobbit', 
    name: 'ORBIT', 
    desc: 'Foco em todos os outros tipos de investimentos não citados acima.', 
    icon: Home,
    color: 'bg-rose-600',
    illustration: '/Orbit.png'
  }
];

export default function Tavern() {
  const { gameState, setGameState, theme } = useTheme();
  const colors = THEMES[theme] || THEMES.default;

  // Estados locais para as opções de customização
  const [notifications, setNotifications] = useState(true);
  const [immersiveMode, setImmersiveMode] = useState(true);
  const [rankingVisible, setRankingVisible] = useState(false);

  const handleArchetypeChange = (newArchetype: Archetype) => {
    const newState = { ...gameState, archetype: newArchetype };
    setGameState(newState);
    localStorage.setItem('facero_game_state', JSON.stringify(newState));
  };

  return (
    <div className={cn("min-h-screen transition-colors duration-500", colors.bg)}>
      <Header />
      
      <main className="p-6 space-y-8 pb-32 max-w-7xl mx-auto">
        <header>
          <h2 className="text-2xl font-display font-bold text-gray-900">A Taberna</h2>
          <p className="text-sm text-gray-500">Personalize seu herói financeiro</p>
        </header>

        {/* Character Preview */}
        <section className={cn("p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden", colors.primary)}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
          <div className="relative z-10 flex flex-col items-center text-center space-y-4">
            <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/20 overflow-hidden relative">
              <Image 
                src={ARCHETYPE_IMAGES[gameState.archetype] || '/Festin.png'} 
                alt="Avatar"
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h3 className="text-2xl font-display font-bold">{gameState.archetype}</h3>
              <p className="text-white/70 text-sm">Nível {gameState.level} • {gameState.xp.toLocaleString()} XP</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/10">
                Mestre da Estratégia
              </div>
              <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/10">
                Magnata dos Imóveis
              </div>
            </div>
          </div>
        </section>

        {/* Seleção de Classe: Exibe as opções de arquétipos com ilustrações */}
        <section className="space-y-4">
          <h4 className="text-lg font-display font-bold text-gray-900">Mudar de Classe</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ARCHETYPES.map((arch) => (
              <button
                key={arch.type}
                onClick={() => handleArchetypeChange(arch.type)}
                className={cn(
                  "p-0 rounded-3xl border text-left transition-all flex flex-col overflow-hidden group relative",
                  gameState.archetype === arch.type 
                    ? cn("bg-white border-2", colors.border, colors.shadow)
                    : "bg-white/50 border-gray-100 hover:bg-white hover:border-gray-200"
                )}
              >
                {/* Ilustração da Classe */}
                <div className="h-32 w-full relative">
                  <Image 
                    src={arch.illustration}
                    alt={arch.name}
                    fill
                    className="object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-3 left-4 flex items-center gap-2">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", arch.color)}>
                      <arch.icon className="w-4 h-4" />
                    </div>
                    <p className="text-white font-bold tracking-widest text-sm">{arch.name}</p>
                  </div>
                </div>

                {/* Descrição Técnica */}
                <div className="p-4">
                  <p className="text-xs text-gray-500 leading-tight">{arch.desc}</p>
                </div>

                {/* Selo de Selecionado */}
                {gameState.archetype === arch.type && (
                  <div className={cn("absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg z-20", colors.primary)}>
                    <Zap className="w-4 h-4 text-white fill-current" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

      {/* Opções de Customização Interativas */}
      <section className="space-y-4">
        <h4 className="text-lg font-display font-bold text-gray-900">Customização</h4>
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Notificações de Quest</span>
            <button 
              onClick={() => setNotifications(!notifications)}
              className={cn(
                "w-12 h-6 rounded-full relative transition-colors", 
                notifications ? colors.primary : "bg-gray-200"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                notifications ? "right-1" : "left-1"
              )}></div>
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Modo Imersivo (RPG)</span>
            <button 
              onClick={() => setImmersiveMode(!immersiveMode)}
              className={cn(
                "w-12 h-6 rounded-full relative transition-colors", 
                immersiveMode ? colors.primary : "bg-gray-200"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                immersiveMode ? "right-1" : "left-1"
              )}></div>
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Visibilidade do Ranking</span>
            <button 
              onClick={() => setRankingVisible(!rankingVisible)}
              className={cn(
                "w-12 h-6 rounded-full relative transition-colors", 
                rankingVisible ? colors.primary : "bg-gray-200"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                rankingVisible ? "right-1" : "left-1"
              )}></div>
            </button>
          </div>
        </div>
      </section>

      </main>
      <BottomNav />
    </div>
  );
}
