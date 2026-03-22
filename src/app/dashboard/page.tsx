/**
 * Página do Dashboard (Herói/Reino): Central de comando do usuário.
 * Exibe o saldo total, o hexágono de atributos F.A.C.E.R.O., quests ativas e progresso de metas.
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp, TrendingDown, Target, ChevronRight, Bell, Trophy, Zap, Shield, Wand2, HandCoins, Compass, VenetianMask, Home, Sparkles, MessageSquare, User } from 'lucide-react';
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

import { MainMenuGrid } from '@/components/game/MainMenuGrid';

export default function Dashboard() {
  const router = useRouter();
  // Acessa o estado global e o tema atual através do contexto
  const { gameState, theme, gameMode, user, loading: authLoading } = useTheme();
  const colors = THEMES[theme] || THEMES.default;
  const { assets, transactions, loading: kingdomLoading, kingdom } = useKingdom();
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
    if (!authLoading && !user) {
      router.push('/logon');
    }
  }, [user, authLoading, router]);

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
  const nextGoal = MOCK_GOALS?.find(g => !g.completed);
  
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
    { subject: 'Cache',  A: getFaceroPercent('C'), fullMark: 100 },
    { subject: 'Exodia', A: getFaceroPercent('E'), fullMark: 100 },
    { subject: 'Reaver', A: getFaceroPercent('R'), fullMark: 100 },
    { subject: 'Órbit',  A: getFaceroPercent('O'), fullMark: 100 },
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
      case 'Dwarf': return <HandCoins className="w-6 h-6" />;
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
    <div className={cn("min-h-screen transition-colors duration-500 bg-[var(--color-bg-dark)] relative overflow-hidden")}>
      {/* Imagem de Fundo Sugestiva */}
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none">
        <Image
          src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=1920"
          alt="Dashboard Background"
          fill
          className="object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Cabeçalho superior */}
      <Header />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 pb-32 relative z-10">
        {/* [RESPONSIVIDADE] Título da Seção com margem inferior ajustada */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl medieval-title font-bold text-[var(--color-text-main)]">Reino</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Seu centro de comando e progresso</p>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={month} 
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="text-sm border-[var(--color-border)] rounded-xl bg-[var(--color-bg-panel)] text-[var(--color-text-main)] focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] p-2 shadow-sm medieval-border"
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
              className="text-sm border-[var(--color-border)] rounded-xl bg-[var(--color-bg-panel)] text-[var(--color-text-main)] focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] p-2 shadow-sm medieval-border"
            >
              {[year - 1, year, year + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </header>

        {/* [RESPONSIVIDADE] Container principal usando CSS Grid. */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* [RESPONSIVIDADE] Coluna Esquerda no Desktop (Ocupa 7 de 12 colunas) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Card Principal de Saldo (Poder de Investimento) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("rounded-2xl p-8 text-[var(--color-bg-dark)] shadow-2xl relative overflow-hidden medieval-border bg-[var(--color-primary)]")}
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-[var(--color-bg-dark)]/60" />
                  <p className="text-[var(--color-bg-dark)]/80 text-[10px] font-black uppercase tracking-[0.2em]">
                    {gameMode === 'reino' ? 'Poder do Reino' : 'Poder de Investimento'}
                  </p>
                </div>
                {/* [RESPONSIVIDADE] Texto responsivo: menor em telas muito pequenas, grande em telas normais */}
                <h3 className="text-3xl sm:text-4xl medieval-title font-bold mb-8">R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                
                {gameMode === 'reino' && (
                  <div className="mb-8 p-4 bg-black/10 rounded-2xl border border-black/20 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-[var(--color-bg-dark)]/60" />
                      <p className="text-[var(--color-bg-dark)]/80 text-[10px] font-black uppercase tracking-[0.2em]">Seu Poder (Herói)</p>
                    </div>
                    <h4 className="text-2xl medieval-title font-bold mb-4">R$ {myInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
                  </div>
                )}

                {/* [RESPONSIVIDADE] Grid de receitas/despesas removido para a página de Atributos */}
              </div>
            </motion.div>

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
              <div className="bg-[var(--color-bg-panel)] rounded-2xl p-6 medieval-border shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  <h4 className="text-sm font-bold text-[var(--color-text-main)]">Status do Reino</h4>
                </div>
                <div>
                  <p className="text-2xl medieval-title font-bold text-[var(--color-text-main)]">{kingdom?.name || 'Meu Reino'}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    {myIncome > myExpenses ? 'Superávit Saudável' : 'Atenção aos Gastos'}
                  </p>
                </div>
              </div>

              <div className="bg-[var(--color-bg-panel)] rounded-2xl p-6 medieval-border shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-4">
                  <Wand2 className="w-5 h-5 text-purple-500" />
                  <h4 className="text-sm font-bold text-[var(--color-text-main)]">Mentor Dominante</h4>
                </div>
                <div>
                  {dominantMentor ? (
                    <>
                      <p className="text-2xl medieval-title font-bold text-[var(--color-text-main)]">{dominantMentor.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">{dominantMentor.strategy}</p>
                    </>
                  ) : (
                    <p className="text-sm text-[var(--color-text-muted)]">Nenhum mentor dominante ainda. Invista para atrair um mentor.</p>
                  )}
                </div>
              </div>
            </section>

            {/* Progresso da Próxima Meta (Masmorra) */}
            <section className="space-y-4">
              <h4 className="text-lg medieval-title font-bold text-[var(--color-text-main)]">Próxima Masmorra</h4>
              {/* Fundo em tom pastel claro (bg-slate-50) com texto escuro para contraste */}
              <div className="bg-[var(--color-bg-panel)] rounded-2xl p-6 text-[var(--color-text-main)] relative overflow-hidden shadow-xl medieval-border">
                {/* Imagem de Fundo do Vilão com opacidade reduzida e blend-mode para ficar clara/pastel */}
                <div className="absolute inset-0 opacity-30">
                  <Image 
                    src={nextCharacter.image} 
                    alt="Vilão da Masmorra" 
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-bg-panel)] via-[var(--color-bg-panel)]/70 to-transparent"></div>
                </div>

                <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-primary)]/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
                <div className="flex items-center gap-4 mb-4 relative z-10">
                  <div className="w-12 h-12 bg-[var(--color-bg-dark)]/70 rounded-2xl flex items-center justify-center backdrop-blur-md border border-[var(--color-border)] shadow-sm shrink-0">
                    <Target className="w-6 h-6 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--color-text-main)]">Derrotar o {nextCharacter.name}</p>
                    <p className="text-[10px] text-[var(--color-primary)] font-bold uppercase tracking-widest">Objetivo: R$ {currentMasmorraGoal.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
                <div className="space-y-2 relative z-10">
                  <div className="h-2 w-full bg-[var(--color-bg-dark)]/60 rounded-full overflow-hidden backdrop-blur-sm shadow-inner border border-[var(--color-border)]">
                    <div 
                      className="h-full bg-[var(--color-primary)] transition-all duration-1000 medieval-glow" 
                      style={{ width: `${Math.min(100, masmorraProgress)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">
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
                <h4 className="text-lg medieval-title font-bold text-[var(--color-text-main)]">Hexágono F.A.C.E.R.O.</h4>
                <Zap className="w-5 h-5 text-[var(--color-primary)] fill-[var(--color-primary)]" />
              </div>
              <Link href="/investments" className="bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-2xl p-4 shadow-sm h-72 flex items-center justify-center medieval-border relative overflow-hidden block hover:bg-[var(--color-bg-dark)] transition-colors cursor-pointer">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-primary)_0%,transparent_70%)] opacity-5"></div>
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                      <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ 
                          fontSize: 10, 
                          fontWeight: 'bold', 
                          fill: 'var(--color-text-muted)',
                          fontFamily: 'var(--font-sans)'
                        }} 
                      />
                      <Radar
                        name="Poder"
                        dataKey="A"
                        stroke="var(--color-primary)"
                        fill="var(--color-primary)"
                        fillOpacity={0.5}
                        strokeWidth={2}
                        dot={{ r: 3, fill: 'var(--color-primary)', strokeWidth: 1, stroke: 'var(--color-bg-panel)' }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </Link>
            </section>

            {/* Lista de Quests Ativas */}
            <ActiveQuestsBoard />
          </div>

        </div>
      </main>
    </div>
  );
}
