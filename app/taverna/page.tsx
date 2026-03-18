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
import { Avatar } from '@/components/Avatar';
import { BottomNav } from '@/components/BottomNav';
import { Archetype } from '@/lib/types';
import { ARCHETYPE_IMAGES } from '@/lib/data';
import { STATIC_CHARACTERS } from '@/lib/characters';
import { Shield, Wand2, Pickaxe, Compass, VenetianMask, Home, Zap, Trophy, User, Sparkles, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/Header';
import { useReino } from '@/hooks/useReino';
import { KingdomManager } from './KingdomManager';

import { ImageKey } from '@/src/assets/images';

import { financialEngine } from '@/lib/financialEngine';

// Definição das classes disponíveis com seus nomes, descrições, ícones e imagens ilustrativas.
const ARCHETYPES: { type: Archetype; name: string; desc: string; icon: any; color: string; illustration: ImageKey }[] = [
  { 
    type: 'Paladino', 
    name: 'FESTIM', 
    desc: 'Foco em Fundos Imobiliários e Fundos de papeis e Fiagros viver de Rendimentos (Aluguéis).', 
    icon: Shield,
    color: 'bg-amber-600',
    illustration: ARCHETYPE_IMAGES['Paladino']
  },
  { 
    type: 'Mago', 
    name: 'ARCANO', 
    desc: 'Foco em Ações e viver de Dividendos (Cotas de Empresas).', 
    icon: Wand2,
    color: 'bg-purple-600',
    illustration: ARCHETYPE_IMAGES['Mago']
  },
  { 
    type: 'Dwarf', 
    name: 'CACHE', 
    desc: 'Foco em Cripto Ativos e Moedas Digitais.', 
    icon: Pickaxe,
    color: 'bg-emerald-600',
    illustration: ARCHETYPE_IMAGES['Dwarf']
  },
  { 
    type: 'Elfo', 
    name: 'EXODIA', 
    desc: 'Foco em Ações e Fundos e Variação Cambial, investimentos fora do Brasil.', 
    icon: Compass,
    color: 'bg-blue-600',
    illustration: ARCHETYPE_IMAGES['Elfo']
  },
  { 
    type: 'Ladino', 
    name: 'REAVER', 
    desc: 'Foco em CDBs e também em Previdencia privada VGBL e tesouro selic e tesouro direto.', 
    icon: VenetianMask,
    color: 'bg-slate-700',
    illustration: ARCHETYPE_IMAGES['Ladino']
  },
  { 
    type: 'Hobbit', 
    name: 'ORBIT', 
    desc: 'Foco em todos os outros tipos de investimentos não citados acima.', 
    icon: Home,
    color: 'bg-rose-600',
    illustration: ARCHETYPE_IMAGES['Hobbit']
  }
];

export default function Tavern() {
  const { gameState, setGameState, theme, gameMode, setGameMode } = useTheme();
  const colors = THEMES[theme] || THEMES.default;
  const { assets } = useReino();

  const { totalValue: totalInvested } = financialEngine.calculateInvestmentPower(assets);
  const totalYields = totalInvested * 0.15; // Mock de rendimentos (15%)
  const totalPower = totalInvested + totalYields;

  // Cores específicas para cada classe no portfólio de skills
  const FACERO_COLORS: Record<string, string> = {
    'F': 'bg-emerald-500', // Paladino/Festim
    'A': 'bg-indigo-500',  // Mago/Arcano
    'C': 'bg-amber-500',   // Dwarf/Cache
    'E': 'bg-teal-500',    // Elfo/Exodia
    'R': 'bg-rose-500',    // Ladino/Reaver
    'O': 'bg-orange-500',  // Hobbit/Orbit
  };

  // Estados locais para as opções de customização da interface
  // Estes estados controlam as preferências visuais e de notificação do usuário na Taberna.
  const [notifications, setNotifications] = useState(true);
  const [immersiveMode, setImmersiveMode] = useState(true);
  const [rankingVisible, setRankingVisible] = useState(false);

  /**
   * Função responsável por atualizar a classe (arquétipo) do herói.
   * Quando o usuário clica em uma nova classe, o estado global do jogo é atualizado.
   * Isso também pode disparar mudanças de tema (cores) dependendo da implementação do ThemeContext.
   * 
   * @param newArchetype - O novo arquétipo selecionado pelo usuário.
   */
  const handleArchetypeChange = (newArchetype: Archetype) => {
    const newState = { ...gameState, archetype: newArchetype };
    setGameState(newState);
  };

  // Busca os dados completos do arquétipo atualmente selecionado para exibir informações detalhadas (como o nome do Mentor).
  const currentArchetypeData = ARCHETYPES.find(a => a.type === gameState.archetype);

  return (
    <div className={cn("min-h-screen transition-colors duration-500", colors.bg)}>
      <Header />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 pb-32 space-y-8">
        {/* [RESPONSIVIDADE] Título da Seção */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900">A Taberna</h2>
            <p className="text-sm text-gray-500">Personalize seu herói financeiro</p>
          </div>
          
          {/* Toggle Modo de Jogo */}
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 self-start">
            <button 
              onClick={() => setGameMode('heroi')}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                gameMode === 'heroi' ? "bg-indigo-100 text-indigo-700" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              Herói (Solo)
            </button>
            <button 
              onClick={() => setGameMode('reino')}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                gameMode === 'reino' ? "bg-amber-100 text-amber-700" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              Reino (Multi)
            </button>
          </div>
        </header>

        {/* 
          [RESPONSIVIDADE] Character Preview (Perfil do Herói)
          No mobile é uma coluna centralizada. No desktop (md) vira uma linha (row) com a imagem à esquerda e os dados à direita.
        */}
        <section className={cn("p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden", colors.primary)}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 md:gap-8">
            <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border-4 border-white/40 overflow-hidden relative shadow-2xl shrink-0">
              <Avatar character={ARCHETYPE_IMAGES[gameState.archetype] || ARCHETYPE_IMAGES['Iniciante']} size={128} />
            </div>
            <button 
              onClick={() => {
                import('firebase/auth').then(({ signOut }) => {
                  import('@/firebase').then(({ auth }) => {
                    signOut(auth);
                  });
                });
              }}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors"
            >
              Sair do Sistema
            </button>
            <div className="flex-1">
              <h3 className="text-3xl md:text-4xl font-display font-bold">{gameState.archetype}</h3>
              <p className="text-white/90 text-sm font-medium mt-1">Nível {gameState.level} • {gameState.xp.toLocaleString()} XP</p>
              <div className="mt-4 inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl backdrop-blur-md border border-white/30">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span className="text-sm font-bold text-white">Mentor: {currentArchetypeData?.name}</span>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                <div className="px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/30 backdrop-blur-sm">
                  F.A.C.E.R.O: {Object.values(gameState.stats).reduce((a, b) => a + b, 0)} pts
                </div>
                <div className="px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/30 backdrop-blur-sm">
                  {currentArchetypeData?.desc.split(' ')[0]} {currentArchetypeData?.desc.split(' ')[1]} {currentArchetypeData?.desc.split(' ')[2]}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 
          [RESPONSIVIDADE] Portfólio de Skills (Habilidades F.A.C.E.R.O)
          No mobile é 1 coluna. No desktop (md) divide em 2 colunas para aproveitar o espaço horizontal.
        */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-display font-bold text-gray-900">Portfólio de Skills</h4>
            <Wand2 className={cn("w-5 h-5", colors.text)} />
          </div>
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {['F', 'A', 'C', 'E', 'R', 'O'].map((stat) => {
                const asset = assets.find(a => a.faceroType === stat);
                const investedValue = asset ? asset.value : 0;
                const percent = totalInvested > 0 ? (investedValue / totalInvested) * 100 : 0;
                const barColor = FACERO_COLORS[stat] || colors.primary;

                return (
                  <div key={stat} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-gray-700">
                        {stat === 'F' ? 'Fundos Imobiliários' : 
                         stat === 'A' ? 'Ações' : 
                         stat === 'C' ? 'Criptomoedas' : 
                         stat === 'E' ? 'Exterior' : 
                         stat === 'R' ? 'Renda Fixa' : 'Outros'}
                      </span>
                      <span className="font-bold text-gray-900">{percent.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all duration-1000", barColor)} 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">
              A distribuição das suas skills reflete exatamente a alocação dos seus investimentos no Inventário.
            </p>
          </div>
        </section>

        {/* 
          [RESPONSIVIDADE] Mural de Troféus (Achievements)
          No mobile muito pequeno: 2 colunas. No mobile normal: 3 colunas. No desktop (md): 6 colunas.
        */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-display font-bold text-gray-900">Mural de Troféus (Masmorras)</h4>
            <Trophy className={cn("w-5 h-5", colors.text)} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {STATIC_CHARACTERS.slice(0, 6).map((character) => {
              const unlocked = totalPower >= character.requiredInvestment;
              return (
                <div 
                  key={character.id}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-3xl border text-center transition-all relative overflow-hidden",
                    unlocked 
                      ? cn("bg-white border-2", colors.border, colors.shadow) 
                      : "bg-gray-50 border-gray-100 opacity-50 grayscale"
                  )}
                >
                  <div className="absolute inset-0 opacity-10">
                    <Image src={character.image} alt={character.name} fill className="object-cover" unoptimized />
                  </div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="text-3xl mb-2">🏆</div>
                    <p className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">{character.requiredInvestment / 1000}k</p>
                    <p className="text-[8px] text-gray-500 truncate w-full">{character.name}</p>
                    {!unlocked && <Lock className="w-3 h-3 text-gray-400 mt-1" />}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 text-center">
            Mostrando as 6 primeiras masmorras. Derrote monstros acumulando mais poder!
          </p>
        </section>

        {/* 
          [RESPONSIVIDADE] Seleção de Classe (Arquétipos)
          No mobile: 1 coluna. No tablet (sm): 2 colunas. No desktop (lg): 3 colunas.
        */}
        <section className="space-y-4">
          <h4 className="text-lg font-display font-bold text-gray-900">Mudar de Classe</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <div className="h-32 w-full relative bg-gray-900 overflow-hidden flex items-center justify-center">
                  <Avatar character={arch.illustration} size={256} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                  <div className="absolute bottom-3 left-3 flex flex-col gap-1">
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-lg backdrop-blur-sm", arch.color)}>
                      <arch.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-white font-black tracking-widest text-sm drop-shadow-md">{arch.name}</p>
                    </div>
                  </div>
                </div>

                {/* Descrição Técnica */}
                <div className="p-3 bg-white flex-1">
                  <p className="text-[10px] text-gray-600 leading-relaxed line-clamp-3">{arch.desc}</p>
                </div>

                {/* Selo de Selecionado */}
                {gameState.archetype === arch.type && (
                  <div className={cn("absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg z-20", colors.primary)}>
                    <Zap className="w-3 h-3 text-white fill-current" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* 
          [RESPONSIVIDADE] Opções de Customização Interativas
          No desktop (md), os itens podem se alinhar em um grid ou manter a lista.
          Mantivemos como lista pois são poucos itens, mas com padding responsivo.
        */}
        <section className="space-y-4">
          <h4 className="text-lg font-display font-bold text-gray-900">Customização</h4>
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between md:flex-col md:items-start md:gap-4">
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
            <div className="flex items-center justify-between md:flex-col md:items-start md:gap-4">
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
            <div className="flex items-center justify-between md:flex-col md:items-start md:gap-4">
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

        {/* Gerenciamento do Reino (Aparece apenas quando o modo Reino está ativo) */}
        {gameMode === 'reino' && (
          <section className="space-y-4 mt-8">
            <h4 className="text-lg font-display font-bold text-gray-900">Gestão do Reino</h4>
            <KingdomManager colors={colors} />
          </section>
        )}

      </main>
      <BottomNav />
    </div>
  );
}
