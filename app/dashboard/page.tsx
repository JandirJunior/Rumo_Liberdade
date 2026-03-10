/**
 * Página do Dashboard (Herói): Central de comando do usuário.
 * Exibe o saldo total, o hexágono de atributos F.A.C.E.R.O., quests ativas e progresso de metas.
 */
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Target, ChevronRight, Bell, Trophy, Zap, Shield, Wand2, Pickaxe, Compass, VenetianMask, Home, Sparkles } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Header } from '@/components/Header';
import { MOCK_GOALS, MOCK_PROFILE, MOCK_TRANSACTIONS, MOCK_GAME_STATE } from '@/lib/data';
import { formatCurrency, cn } from '@/lib/utils';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis } from 'recharts';
import { useTheme } from '@/lib/ThemeContext';
import { THEMES } from '@/lib/themes';

export default function Dashboard() {
  // Acessa o estado global e o tema atual através do contexto
  const { gameState, theme } = useTheme();
  const colors = THEMES[theme] || THEMES.default;

  // Cálculos de resumo financeiro baseados em dados mockados
  const totalIncome = Object.values(MOCK_PROFILE.monthlyIncome).reduce((a, b) => a + b, 0);
  const totalExpenses = MOCK_TRANSACTIONS
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);
  
  // Identifica a próxima meta não concluída
  const nextGoal = MOCK_GOALS.find(g => !g.completed);

  // Dados para o gráfico de Radar (Hexágono F.A.C.E.R.O.)
  const radarData = [
    { subject: 'Festim', A: gameState.stats.F, fullMark: 10 },
    { subject: 'Arcano', A: gameState.stats.A, fullMark: 10 },
    { subject: 'Cache', A: gameState.stats.C, fullMark: 10 },
    { subject: 'Êxodo', A: gameState.stats.E, fullMark: 10 },
    { subject: 'Reaver', A: gameState.stats.R, fullMark: 10 },
    { subject: 'Órbit', A: gameState.stats.O, fullMark: 10 },
  ];

  // Lista de Quests (tarefas) financeiras para o usuário com estado local para interatividade
  const [quests, setQuests] = useState([
    { id: '1', title: 'O Dízimo do Herói', desc: 'Realizar aporte este mês', xp: 100, done: true },
    { id: '2', title: 'Arquiteto F.A.C.E.R.O.', desc: 'Aportar em 3 classes', xp: 250, done: false },
    { id: '3', title: 'Senhorio Real', desc: 'Aportar em Festim (FIIs)', xp: 150, done: false },
  ]);

  // Função para alternar o estado de conclusão de uma quest
  const toggleQuest = (id: string) => {
    setQuests(quests.map(q => q.id === id ? { ...q, done: !q.done } : q));
  };

  // Retorna o ícone correspondente ao arquétipo atual do herói
  const getArchetypeIcon = () => {
    switch(gameState.archetype) {
      case 'Paladino': return <Shield className="w-6 h-6" />;
      case 'Mago': return <Wand2 className="w-6 h-6" />;
      case 'Dwarf Minerador': return <Pickaxe className="w-6 h-6" />;
      case 'Elfo': return <Compass className="w-6 h-6" />;
      case 'Ladrão': return <VenetianMask className="w-6 h-6" />;
      case 'Hobbit': return <Home className="w-6 h-6" />;
      default: return <Trophy className="w-6 h-6" />;
    }
  };

  return (
    <div className={cn("min-h-screen transition-colors duration-500", colors.bg)}>
      {/* Cabeçalho superior */}
      <Header />
      
      <main className="p-6 space-y-8 pb-32 max-w-7xl mx-auto">
        {/* Título da Seção */}
        <header>
          <h2 className="text-2xl font-display font-bold text-gray-900">Herói</h2>
          <p className="text-sm text-gray-500">Seu centro de comando e progresso</p>
        </header>

        {/* Card Principal de Saldo (Poder de Investimento) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden", colors.primary, colors.shadow)}
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-white/60" />
              <p className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em]">Poder de Investimento</p>
            </div>
            <h3 className="text-4xl font-display font-bold mb-8">R$ {gameState.xp.toLocaleString('pt-BR')}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Resumo de Receitas */}
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-3 h-3 text-white/60" />
                  <span className="text-[9px] font-black text-white/80 uppercase tracking-wider">Receitas</span>
                </div>
                <p className="text-lg font-bold">{formatCurrency(totalIncome)}</p>
              </div>
              {/* Resumo de Despesas */}
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-3 h-3 text-red-300" />
                  <span className="text-[9px] font-black text-white/80 uppercase tracking-wider">Despesas</span>
                </div>
                <p className="text-lg font-bold">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Gráfico de Radar: Hexágono F.A.C.E.R.O. */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-display font-bold text-gray-900">Hexágono F.A.C.E.R.O.</h4>
            <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          </div>
          <div className="bg-white border border-gray-100 rounded-[2rem] p-4 shadow-sm h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#E5E7EB" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 'bold', fill: '#6B7280' }} />
                <Radar
                  name="Poder"
                  dataKey="A"
                  stroke={theme === 'default' ? '#059669' : '#4F46E5'}
                  fill={theme === 'default' ? '#10B981' : '#6366F1'}
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Lista de Quests Ativas */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-display font-bold text-gray-900">Quests Ativas</h4>
            <span className={cn("text-xs font-bold uppercase tracking-widest", colors.accent)}>3 Disponíveis</span>
          </div>
          <div className="space-y-3">
            {quests.map((q) => (
              <button 
                key={q.id} 
                onClick={() => toggleQuest(q.id)}
                className={cn(
                  "w-full p-4 rounded-2xl border flex items-center gap-4 transition-all text-left active:scale-[0.98]",
                  q.done ? cn(colors.secondary, colors.border) : "bg-white border-gray-100 hover:border-gray-200"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  q.done ? cn(colors.primary, "text-white") : "bg-gray-100 text-gray-400"
                )}>
                  {q.done ? <Trophy className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className={cn("text-sm font-bold", q.done ? colors.text : "text-gray-900")}>{q.title}</p>
                  <p className="text-[10px] text-gray-500 font-medium">{q.desc}</p>
                </div>
                <div className="text-right">
                  <p className={cn("text-xs font-black", colors.accent)}>+{q.xp} XP</p>
                  {q.done && <span className={cn("text-[8px] font-black uppercase", colors.accent)}>Concluída</span>}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Progresso da Próxima Meta (Masmorra) */}
        <section className="space-y-4">
          <h4 className="text-lg font-display font-bold text-gray-900">Próxima Masmorra</h4>
          <div className="bg-gray-900 rounded-3xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <Target className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold">{nextGoal?.title}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Ranking de Prestígio</p>
              </div>
            </div>
            <div className="space-y-2 relative z-10">
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[44%]"></div>
              </div>
              <div className="flex justify-between text-[9px] font-black text-gray-500 uppercase tracking-widest">
                <span>R$ {gameState.xp.toLocaleString()}</span>
                <span>R$ 250.000</span>
              </div>
            </div>
          </div>
        </section>

      </main>
      {/* Menu de navegação inferior */}
      <BottomNav />
    </div>
  );
}
