/**
 * Página de Gênese (Quiz): Define o arquétipo inicial do usuário através de um quiz temático de RPG.
 * As respostas do usuário moldam seus atributos F.A.C.E.R.O. iniciais.
 */
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/Avatar';
import { Sparkles, Shield, Swords, Compass, Wand2, ChevronRight, Trophy } from 'lucide-react';
import { FaceroStats, Archetype } from '@/lib/types';
import { ARCHETYPE_IMAGES } from '@/lib/data';

// Banco de questões do quiz com pontuação para cada atributo F.A.C.E.R.O.
const QUESTIONS = [
  {
    id: 1,
    text: "Em uma masmorra escura, você encontra um altar que oferece 5% de mana garantida ou um portal que pode dobrar sua mana ou drená-la totalmente. Qual o seu movimento?",
    options: [
      { text: "Seguro o que tenho", points: { R: 3 } },
      { text: "Arrisco o portal", points: { C: 3, O: 1 } }
    ]
  },
  {
    id: 2,
    text: "Para derrotar o Dragão do Inflacionário, você prefere forjar uma espada lenta que nunca quebra ou usar pergaminhos de ataque rápido que expiram em 24h?",
    options: [
      { text: "Espada indestrutível", points: { F: 2, A: 2 } },
      { text: "Pergaminhos rápidos", points: { O: 3, C: 1 } }
    ]
  },
  {
    id: 3,
    text: "Ao abrir um baú de tesouro, como você divide as moedas?",
    options: [
      { text: "Compro terras e estalagens para renda passiva", points: { F: 4 } },
      { text: "Invisto em expedições para além-mar", points: { E: 4 } }
    ]
  },
  {
    id: 4,
    text: "Você prefere estudar grimórios de alquimia complexa (Criptos/Opções) ou investir em guildas de mercadores já estabelecidas (Ações)?",
    options: [
      { text: "Guildas consolidadas", points: { A: 4 } },
      { text: "Grimórios arcanos", points: { C: 3, O: 2 } }
    ]
  },
  {
    id: 5,
    text: "Se o valor das suas joias cair pela metade em um dia, você...",
    options: [
      { text: "Vende o que sobrou para proteger o estoque", points: { R: 3 } },
      { text: "Comprou mais joias na promoção", points: { A: 2, C: 2 } }
    ]
  }
];

export default function GenesisQuiz() {
  // Estados para controle do progresso do quiz e pontuação acumulada
  const [step, setStep] = useState(0);
  const [stats, setStats] = useState<FaceroStats>({ F: 0, A: 0, C: 0, E: 0, R: 0, O: 0 });
  const [finished, setFinished] = useState(false);
  const router = useRouter();

  // Processa a resposta do usuário e avança para a próxima pergunta
  const handleAnswer = (points: Partial<FaceroStats>) => {
    setStats(prev => ({
      ...prev,
      F: prev.F + (points.F || 0),
      A: prev.A + (points.A || 0),
      C: prev.C + (points.C || 0),
      E: prev.E + (points.E || 0),
      R: prev.R + (points.R || 0),
      O: prev.O + (points.O || 0),
    }));

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setFinished(true);
    }
  };

  // Determina o arquétipo final baseado no atributo com maior pontuação
  const getArchetype = (): Archetype => {
    const maxStat = Object.entries(stats).reduce((a, b) => a[1] > b[1] ? a : b);
    const mapping: Record<string, Archetype> = {
      F: 'Paladino',
      A: 'Mago',
      C: 'Dwarf Minerador',
      E: 'Elfo',
      R: 'Ladrão',
      O: 'Hobbit'
    };
    return mapping[maxStat[0]] || 'Iniciante';
  };

  const archetype = getArchetype();

  // Finaliza a gênese, salva o estado inicial do jogo e redireciona para o dashboard
  const finalize = () => {
    const gameState = {
      level: 1,
      xp: 0,
      archetype,
      stats,
      completedQuests: []
    };
    localStorage.setItem('facero_game_state', JSON.stringify(gameState));
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-emerald-950 text-white p-8 flex flex-col items-center justify-center overflow-y-auto">
      <AnimatePresence mode="wait">
        {!finished ? (
          /* Interface das Perguntas */
          <motion.div
            key="quiz"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md md:max-w-lg lg:max-w-xl space-y-8"
          >
            {/* Barra de Progresso */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Prova {step + 1} de 5</span>
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="h-1 w-full bg-emerald-900 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-emerald-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${((step + 1) / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* Texto da Pergunta */}
            <h2 className="text-2xl font-display font-bold leading-tight">
              {QUESTIONS[step].text}
            </h2>

            {/* Opções de Resposta */}
            <div className="space-y-4">
              {QUESTIONS[step].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt.points)}
                  className="w-full p-6 bg-emerald-900/50 border border-emerald-800 rounded-2xl text-left hover:bg-emerald-800 transition-all group flex items-center justify-between"
                >
                  <span className="font-medium">{opt.text}</span>
                  <ChevronRight className="w-5 h-5 text-emerald-600 group-hover:text-emerald-400 transition-colors" />
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          /* Interface de Resultado Final */
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md md:max-w-lg lg:max-w-xl text-center space-y-8"
          >
            {/* Avatar do Arquétipo Conquistado */}
            <div className="relative inline-block">
              <div className="w-32 h-32 bg-emerald-500 rounded-3xl rotate-12 flex items-center justify-center shadow-2xl shadow-emerald-500/20 overflow-hidden relative">
                <div className="-rotate-12 w-full h-full flex items-center justify-center">
                  <Avatar character={ARCHETYPE_IMAGES[archetype] || ARCHETYPE_IMAGES['Iniciante']} size={128} />
                </div>
              </div>
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center"
              >
                <Sparkles className="w-5 h-5 text-emerald-900" />
              </motion.div>
            </div>

            {/* Título e Descrição do Resultado */}
            <div className="space-y-2">
              <p className="text-emerald-400 font-bold uppercase tracking-[0.2em] text-sm">Gênese Concluída</p>
              <h1 className="text-4xl font-display font-bold">Você é um {archetype}!</h1>
              <p className="text-emerald-200/60 text-sm px-8">
                Sua jornada no universo F.A.C.E.R.O. começa agora. Seus atributos iniciais foram forjados.
              </p>
            </div>

            {/* Resumo dos Atributos F.A.C.E.R.O. */}
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(stats).map(([key, val]) => (
                <div key={key} className="bg-emerald-900/40 p-3 rounded-xl border border-emerald-800">
                  <p className="text-[10px] font-bold text-emerald-500 uppercase">{key}</p>
                  <p className="text-lg font-bold">{val}</p>
                </div>
              ))}
            </div>

            {/* Botão para entrar no dashboard */}
            <button
              onClick={finalize}
              className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95"
            >
              Iniciar Jornada
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
