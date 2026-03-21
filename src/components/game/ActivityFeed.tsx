import { ActivityLog } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity, PlusCircle, Edit, Trash2, UserPlus, LogIn, LogOut, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityFeedProps {
  logs: ActivityLog[];
  colors: any;
}

export function ActivityFeed({ logs, colors }: ActivityFeedProps) {
  const getIcon = (action: string) => {
    if (action.includes('CREATE') || action.includes('ADD')) return <PlusCircle className="w-4 h-4 text-emerald-500" />;
    if (action.includes('EDIT') || action.includes('UPDATE')) return <Edit className="w-4 h-4 text-blue-500" />;
    if (action.includes('DELETE') || action.includes('REMOVE')) return <Trash2 className="w-4 h-4 text-red-500" />;
    if (action.includes('INVITE')) return <UserPlus className="w-4 h-4 text-indigo-500" />;
    if (action.includes('JOINED')) return <LogIn className="w-4 h-4 text-emerald-500" />;
    if (action.includes('LEFT')) return <LogOut className="w-4 h-4 text-red-500" />;
    if (action.includes('ROLE')) return <Shield className="w-4 h-4 text-amber-500" />;
    return <Activity className="w-4 h-4 text-[var(--color-text-muted)]" />;
  };

  const getMessage = (log: ActivityLog) => {
    const userName = log.user_name || 'Alguém';
    
    switch (log.action) {
      case 'CREATE_TRANSACTION':
        return `${userName} registrou uma nova transação.`;
      case 'UPDATE_TRANSACTION':
        return `${userName} atualizou uma transação.`;
      case 'DELETE_TRANSACTION':
        return `${userName} excluiu uma transação.`;
      case 'CREATE_CATEGORY':
        return `${userName} criou a categoria "${log.details?.name || ''}".`;
      case 'DELETE_CATEGORY':
        return `${userName} excluiu uma categoria.`;
      case 'CREATE_ASSET':
        return `${userName} adicionou o ativo "${log.details?.ticker || ''}".`;
      case 'UPDATE_ASSET':
        return `${userName} atualizou o ativo "${log.details?.ticker || ''}".`;
      case 'INVITE_SENT':
        return `${userName} enviou um convite para ${log.details?.email || ''}.`;
      case 'USER_JOINED':
        return `${userName} adicionou um novo membro ao Reino.`;
      case 'USER_LEFT':
        return `${userName} removeu um membro do Reino.`;
      case 'ROLE_UPDATED':
        return `${userName} alterou o cargo de um membro para ${log.details?.new_role || ''}.`;
      default:
        return `${userName} realizou uma ação: ${log.action}`;
    }
  };

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--color-text-muted)] text-sm">
        Nenhuma atividade recente no Reino.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.slice(0, 10).map((log) => (
        <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--color-bg-dark)] transition-colors border border-transparent hover:border-[var(--color-border)]">
          <div className="mt-0.5 p-2 bg-[var(--color-bg-panel)] rounded-full border border-[var(--color-border)] shadow-sm medieval-border">
            {getIcon(log.action)}
          </div>
          <div className="flex-1">
            <p className="text-sm text-[var(--color-text-main)]">{getMessage(log)}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
