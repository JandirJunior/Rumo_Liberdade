/**
 * Página do Dashboard (Herói/Reino): Central de comando do usuário.
 * Exibe o saldo total, o hexágono de atributos F.A.C.E.R.O., quests ativas e progresso de metas.
 */
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp, TrendingDown, Target, ChevronRight, Bell, Trophy, Zap, Shield, Wand2, Pickaxe, Compass, VenetianMask, Home, Sparkles, MessageSquare, User } from 'lucide-react';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { MOCK_GOALS, MOCK_PROFILE, MOCK_TRANSACTIONS, MOCK_GAME_STATE, MOCK_ASSETS } from '@/lib/data';
import { formatCurrency, cn } from '@/lib/utils';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis } from 'recharts';
import { useTheme } from '@/lib/ThemeContext';
import { THEMES } from '@/lib/themes';
import { KingdomLevelPanel, TotalWealthPanel, QuestProgressPanel, MemberRankingPanel } from '@/components/game/RpgPanels';
import { useAccountsPayable } from '@/hooks/useAccountsPayable';
import { useAccountsReceivable } from '@/hooks/useAccountsReceivable';
import { useCreditCardInvoices } from '@/hooks/useCreditCardInvoices';
import { useKingdom, useKingdomMembers } from '@/hooks/useKingdom';
import { useCategories } from '@/hooks/useCategories';
import { useBudgets } from '@/hooks/useBudgets';
import { getNextCharacter, STATIC_CHARACTERS } from '@/lib/characters';
import { ActiveQuestsBoard } from '@/components/game/ActiveQuestsBoard';
import { generateRecurringQuests } from '@/lib/recurringTasks';
import { financialEngine } from '@/lib/financialEngine';
import { getDominantMentor } from '@/services/mentorService';

import { auth } from '@/services/firebase';

export default function Dashboard() {
  // Acessa o estado global e o tema atual através do contexto
  const { gameState, theme, gameMode } = useTheme();
  const colors = THEMES[theme] || THEMES.default;
  const { assets, transactions, loading, kingdom } = useKingdom();
  const { categories } = useCategories();

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const { budgetProgress } = useBudgets(month, year);

  const { members } = useKingdomMembers(kingdom?.id);
  const { payables } = useAccountsPayable();
  const { receivables } = useAccountsReceivable();
  const { invoices } = useCreditCardInvoices();

  useEffect(() => {
    // Generate recurring quests when dashboard loads
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && kingdom?.id) {
        generateRecurringQuests(kingdom.id);
      }
    });
    return () => unsubscribe();
  }, [kingdom?.id]);

  const cofreReino = budgetProgress
    .filter(b => b.rpg_group === '💎 Cofre do Reino (Receitas Fixas)')
    .reduce((acc, curr) => ({ orcado: acc.orcado + curr.orcado, realizado: acc.gasto_real + curr.gasto_real }), { orcado: 0, realizado: 0 });
  const saquesMissoes = budgetProgress
    .filter(b => b.rpg_group === '⚡ Saques de Missões (Receitas Variáveis)')
    .reduce((acc, curr) => ({ orcado: acc.orcado + curr.orcado, realizado: acc.gasto_real + curr.gasto_real }), { orcado: 0, realizado: 0 });
  const tributosReino = budgetProgress
    .filter(b => b.rpg_group === '🛡️ Tributos do Reino (Despesas Fixas)')
    .reduce((acc, curr) => ({ orcado: acc.orcado + curr.orcado, realizado: acc.gasto_real + curr.gasto_real }), { orcado: 0, realizado: 0 });
  const aventurasHeroi = budgetProgress
    .filter(b => b.rpg_group === '⚔️ Aventuras do Herói (Despesas Variáveis)')
    .reduce((acc, curr) => ({ orcado: acc.orcado + curr.orcado, realizado: acc.gasto_real + curr.gasto_real }), { orcado: 0, realizado: 0 });

  // Total investido no Inventário
  const { totalValue: totalInvested } = financialEngine.calculateInvestmentPower(assets);
  const totalYields = totalInvested * 0.15; // Mock de rendimentos (15%)
  const totalPower = totalInvested + totalYields;

  // Cálculos individuais do Herói
  const myAssets = assets.filter(a => a.userId === auth.currentUser?.uid);
  const { totalValue: myInvested } = financialEngine.calculateInvestmentPower(myAssets);
  
  // Use financialEngine for transactions
  const myTransactions = transactions.filter(t => t.userId === auth.currentUser?.uid);
  const { income: myIncome, expense: myExpenses } = financialEngine.calculateMonthlySummary(myTransactions as any, month, year);

  const dominantMentor = getDominantMentor(assets);

  // Lógica da Próxima Masmorra (a cada R$ 10.000)
  const nextCharacter = getNextCharacter(totalPower) || STATIC_CHARACTERS[STATIC_CHARACTERS.length - 1];
  const currentMasmorraGoal = nextCharacter.requiredInvestment;
  const currentMasmorraStart = currentMasmorraGoal - 10000;
  // Garante que o progresso não seja negativo
  const masmorraProgress = Math.max(0, ((totalPower - currentMasmorraStart) / 10000) * 100);

  // Identifica a próxima meta não concluída
  const nextGoal = MOCK_GOALS.find(g => !g.completed);

  // Função para calcular o percentual de cada atributo F.A.C.E.R.O.
  const getFaceroPercent = (type: string) => {
    const asset = assets.find(a => a.faceroType === type);
    return totalInvested > 0 ? (((asset?.value || 0)) / totalInvested) * 100 : 0;
  };

  // Dados para o gráfico de Radar (Hexágono F.A.C.E.R.O.)
  // Agora os valores são percentuais (0 a 100) baseados nos investimentos
  const radarData = [
    { subject: 'Festim', A: getFaceroPercent('F'), fullMark: 100 },
    { subject: 'Arcano', A: getFaceroPercent('A'), fullMark: 100 },
    { subject: 'Cache', A: getFaceroPercent('C'), fullMark: 100 },
    { subject: 'Exodia', A: getFaceroPercent('E'), fullMark: 100 },
    { subject: 'Reaver', A: getFaceroPercent('R'), fullMark: 100 },
    { subject: 'Órbit', A: getFaceroPercent('O'), fullMark: 100 },
  ];

  // Estado para garantir que o gráfico só seja renderizado no cliente (evita erro de SSR do Recharts)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Retorna o ícone correspondente ao arquétipo atual do herói
  const getArchetypeIcon = () => {
    switch(gameState.archetype) {
      case 'Paladino': return <Shield className="w-6 h-6" />;
      case 'Mago': return <Wand2 className="w-6 h-6" />;
      case 'Dwarf': return <Pickaxe className="w-6 h-6" />;
      case 'Elfo': return <Compass className="w-6 h-6" />;
      case 'Ladino': return <VenetianMask className="w-6 h-6" />;
      case 'Hobbit': return <Home className="w-6 h-6" />;
      default: return <Trophy className="w-6 h-6" />;
    }
  };

  // Cálculos para os Painéis RPG
  const activeQuestsCount = [
    ...payables.filter(p => p.status === 'pendente' || p.status === 'atrasado'),
    ...receivables.filter(r => r.status === 'pendente' || r.status === 'atrasado' || r.status === 'inadimplente'),
    ...invoices.filter(i => i.status === 'open')
  ].length;

  const completedQuestsCount = [
    ...payables.filter(p => p.status === 'pago'),
    ...receivables.filter(r => r.status === 'recebido'),
    ...invoices.filter(i => i.status === 'paid')
  ].length;

  const kingdomStats = {
    level: gameState.level,
    xp: gameState.xp,
    nextLevelXp: (gameState.level + 1) * 100,
    totalWealth: totalInvested,
    activeQuestsCount,
    completedQuestsCount,
    members: members.map(m => ({
      id: m.user_id,
      name: m.user_name || 'Herói',
      role: m.role,
      wealth: 0, // Poderíamos calcular o patrimônio de cada membro se tivéssemos os dados filtrados por usuário
      xp: 0 // Precisaríamos do XP de cada usuário
    }))
  };

  return (
    <div className={cn("min-h-screen transition-colors duration-500", colors.bg)}>
      {/* Cabeçalho superior */}
      <Header />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 pb-32">
        {/* [RESPONSIVIDADE] Título da Seção com margem inferior ajustada */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900">Reino</h2>
            <p className="text-sm text-gray-500">Seu centro de comando e progresso</p>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={month} 
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="text-sm border-gray-200 rounded-xl bg-white text-gray-700 focus:ring-emerald-500 focus:border-emerald-500 p-2 shadow-sm"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString('pt-BR', { month: 'long' }).charAt(0).toUpperCase() + new Date(2000, m - 1).toLocaleString('pt-BR', { month: 'long' }).slice(1)}
                </option>
              ))}
            </select>
            <select 
              value={year} 
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="text-sm border-gray-200 rounded-xl bg-white text-gray-700 focus:ring-emerald-500 focus:border-emerald-500 p-2 shadow-sm"
            >
              {[year - 1, year, year + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </header>

        {/* [RESPONSIVIDADE] Container principal usando CSS Grid. 
            No mobile (padrão) é 1 coluna (flex-col ou grid-cols-1).
            No desktop (lg) divide em 12 colunas para melhor aproveitamento do espaço. */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* [RESPONSIVIDADE] Coluna Esquerda no Desktop (Ocupa 7 de 12 colunas) */}
          <div className="lg:col-span-7 space-y-8">
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
                  <p className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em]">
                    {gameMode === 'reino' ? 'Poder do Reino' : 'Poder de Investimento'}
                  </p>
                </div>
                {/* [RESPONSIVIDADE] Texto responsivo: menor em telas muito pequenas, grande em telas normais */}
                <h3 className="text-3xl sm:text-4xl font-display font-bold mb-8">R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                
                {gameMode === 'reino' && (
                  <div className="mb-8 p-4 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-white/60" />
                      <p className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em]">Seu Poder (Herói)</p>
                    </div>
                    <h4 className="text-2xl font-display font-bold mb-4">R$ {myInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
                  </div>
                )}

                {/* [RESPONSIVIDADE] Grid de receitas/despesas removido para a página de Atributos */}
              </div>
            </motion.div>

            {/* Botão Poder dos Investimentos */}
            <Link href="/investments" className={cn("w-full p-4 rounded-2xl border flex items-center justify-between transition-all hover:scale-[1.02] bg-white border-gray-100 shadow-sm block")}>
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm", colors.primary)}>
                  <Zap className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900">Poder dos Investimentos</p>
                  <p className="text-[10px] text-gray-500 font-medium">Visualizar detalhes no Inventário</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>

            {/* Acesso Rápido */}
            {/* [RESPONSIVIDADE] 2 colunas no mobile, 2 colunas no desktop (já que está dentro da coluna esquerda) */}
            <section className="grid grid-cols-2 gap-4">
              <Link href="/chat" className={cn("p-4 rounded-[2rem] border flex flex-col items-center justify-center gap-3 transition-all hover:scale-105", colors.bg, colors.border)}>
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg", colors.primary)}>
                  <MessageSquare className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-gray-900">Mentor</span>
              </Link>
              <Link href="/investments" className={cn("p-4 rounded-[2rem] border flex flex-col items-center justify-center gap-3 transition-all hover:scale-105", colors.bg, colors.border)}>
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg", colors.primary)}>
                  <Pickaxe className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-gray-900">Inventário</span>
              </Link>
            </section>

            {/* Painéis RPG Secundários */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <KingdomLevelPanel stats={kingdomStats} />
              <TotalWealthPanel total={totalInvested} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <QuestProgressPanel active={activeQuestsCount} completed={completedQuestsCount} />
              {gameMode === 'reino' && <MemberRankingPanel members={kingdomStats.members} />}
            </div>

            {/* Status do Reino e Mentor Dominante */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  <h4 className="text-sm font-bold text-gray-900">Status do Reino</h4>
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-gray-900">{kingdom?.name || 'Meu Reino'}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {myIncome > myExpenses ? 'Superávit Saudável' : 'Atenção aos Gastos'}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-4">
                  <Wand2 className="w-5 h-5 text-purple-500" />
                  <h4 className="text-sm font-bold text-gray-900">Mentor Dominante</h4>
                </div>
                <div>
                  {dominantMentor ? (
                    <>
                      <p className="text-2xl font-display font-bold text-gray-900">{dominantMentor.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{dominantMentor.strategy}</p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Nenhum mentor dominante ainda. Invista para atrair um mentor.</p>
                  )}
                </div>
              </div>
            </section>

            {/* Progresso da Próxima Meta (Masmorra) */}
            <section className="space-y-4">
              <h4 className="text-lg font-display font-bold text-gray-900">Próxima Masmorra</h4>
              {/* Fundo em tom pastel claro (bg-slate-50) com texto escuro para contraste */}
              <div className="bg-[#fdf5e6] rounded-3xl p-6 text-gray-900 relative overflow-hidden shadow-xl border border-[#d2b48c]/30">
                {/* Imagem de Fundo do Vilão com opacidade reduzida e blend-mode para ficar clara/pastel */}
                <div className="absolute inset-0 opacity-60">
                  <Image 
                    src={nextCharacter.image} 
                    alt="Vilão da Masmorra" 
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#fdf5e6] via-[#fdf5e6]/70 to-transparent"></div>
                </div>

                <div className="absolute top-0 right-0 w-24 h-24 bg-[#d2b48c]/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
                <div className="flex items-center gap-4 mb-4 relative z-10">
                  <div className="w-12 h-12 bg-white/70 rounded-2xl flex items-center justify-center backdrop-blur-md border border-[#d2b48c]/50 shadow-sm shrink-0">
                    <Target className="w-6 h-6 text-[#8b7355]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#5d4037]">Derrotar o {nextCharacter.name}</p>
                    <p className="text-[10px] text-[#8b7355] font-bold uppercase tracking-widest">Objetivo: R$ {currentMasmorraGoal.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
                <div className="space-y-2 relative z-10">
                  <div className="h-2 w-full bg-white/60 rounded-full overflow-hidden backdrop-blur-sm shadow-inner border border-[#D4AF37]/30">
                    <div 
                      className="h-full bg-[#D4AF37] transition-all duration-1000" 
                      style={{ width: `${Math.min(100, masmorraProgress)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[9px] font-black text-gray-500 uppercase tracking-widest">
                    <span>R$ {totalPower.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span>R$ {currentMasmorraGoal.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            </section>


          </div>

          {/* [RESPONSIVIDADE] Coluna Direita no Desktop (Ocupa 5 de 12 colunas) */}
          <div className="lg:col-span-5 space-y-8">
            {/* Gráfico de Radar: Hexágono F.A.C.E.R.O. */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-display font-bold text-gray-900">Hexágono F.A.C.E.R.O.</h4>
                <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              </div>
              <div className="bg-white border border-gray-100 rounded-[2rem] p-4 shadow-sm h-64 flex items-center justify-center">
                {mounted && (
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
                )}
              </div>
            </section>

            {/* Lista de Quests Ativas */}
            <ActiveQuestsBoard />
          </div>

        </div>
      </main>
      {/* Menu de navegação inferior */}
      <BottomNav />
    </div>
  );
}
