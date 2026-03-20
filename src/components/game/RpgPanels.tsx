import { motion } from 'motion/react';
import { Trophy, Crown, Users, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useTheme } from '@/lib/ThemeContext';
import { THEMES } from '@/lib/themes';

interface KingdomStats {
  level: number;
  xp: number;
  nextLevelXp: number;
  totalWealth: number;
  activeQuestsCount: number;
  completedQuestsCount: number;
  members: {
    id: string;
    name: string;
    role: string;
    wealth: number;
    xp: number;
  }[];
}

export function KingdomLevelPanel({ stats }: { stats: KingdomStats }) {
  const { theme } = useTheme();
  const colors = THEMES[theme] || THEMES.default;
  const progress = (stats.xp / stats.nextLevelXp) * 100;

  return (
    <div className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 blur-2xl opacity-50"></div>
      
      <div className="flex items-center gap-4 mb-6 relative z-10">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg", colors.primary)}>
          <Crown className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Nível do Reino</h3>
          <p className="text-3xl font-display font-bold text-gray-900">Nível {stats.level}</p>
        </div>
      </div>

      <div className="space-y-2 relative z-10">
        <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
          <span>XP: {stats.xp.toLocaleString()}</span>
          <span>Próximo Nível: {stats.nextLevelXp.toLocaleString()}</span>
        </div>
        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className={cn("h-full rounded-full", colors.primary)}
          />
        </div>
      </div>
    </div>
  );
}

export function TotalWealthPanel({ total }: { total: number }) {
  return (
    <div className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
          <Trophy className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-gray-900">Patrimônio Total</h3>
      </div>
      <p className="text-3xl font-display font-bold text-gray-900">{formatCurrency(total)}</p>
      <div className="flex items-center gap-1 mt-2 text-emerald-600">
        <TrendingUp className="w-3 h-3" />
        <span className="text-[10px] font-bold uppercase tracking-wider">+12.5% este mês</span>
      </div>
    </div>
  );
}

export function QuestProgressPanel({ active, completed }: { active: number, completed: number }) {
  const total = active + completed;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-gray-900">Progresso de Quests</h3>
        <div className="flex gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] font-bold text-gray-500 uppercase">{completed}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <span className="text-[10px] font-bold text-gray-500 uppercase">{active}</span>
          </div>
        </div>
      </div>

      <div className="relative h-20 w-20 mx-auto mb-4">
        <svg className="w-full h-full" viewBox="0 0 36 36">
          <path
            className="text-gray-100 stroke-current"
            strokeWidth="3"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="text-emerald-500 stroke-current"
            strokeWidth="3"
            strokeDasharray={`${progress}, 100`}
            strokeLinecap="round"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <text x="18" y="20.35" className="text-[8px] font-bold text-gray-900" textAnchor="middle" fill="currentColor">
            {progress.toFixed(0)}%
          </text>
        </svg>
      </div>
      <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Eficiência do Reino</p>
    </div>
  );
}

export function MemberRankingPanel({ members }: { members: KingdomStats['members'] }) {
  return (
    <div className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Ranking de Heróis</h3>
        <Users className="w-4 h-4 text-gray-400" />
      </div>
      
      <div className="space-y-3">
        {members.sort((a, b) => b.xp - a.xp).map((member, index) => (
          <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                index === 0 ? "bg-amber-100 text-amber-700" : 
                index === 1 ? "bg-slate-100 text-slate-700" :
                "bg-orange-100 text-orange-700"
              )}>
                {index + 1}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">{member.name}</p>
                <p className="text-[9px] text-gray-500 font-medium uppercase tracking-wider">{member.role}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-emerald-600">{formatCurrency(member.wealth)}</p>
              <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">{member.xp} XP</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
