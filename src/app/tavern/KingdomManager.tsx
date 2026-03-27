'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useKingdom, useKingdomMembers, useUserInvites } from '@/hooks/useKingdom';
import { kingdomService } from '@/services/kingdomService';
import { auth, db } from '@/services/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { Users, UserPlus, Shield, User, Eye, Check, X, Copy, Activity, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KingdomRole } from '@/types';
import { ActivityFeed } from '@/components/game/ActivityFeed';


export function KingdomManager({ colors }: { colors: any }) {
  const { kingdom, role, loading: kingdomLoading, activityLogs } = useKingdom();
  const { members, loading: membersLoading } = useKingdomMembers();
  const { invites, loading: invitesLoading } = useUserInvites();

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<KingdomRole>('member');
  const [isInviting, setIsInviting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [newKingdomName, setNewKingdomName] = useState(kingdom?.name || '');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const { joinKingdomByCode, memberId: myMemberId } = useKingdom();

  if (kingdomLoading || membersLoading || invitesLoading) {
    return <div className="text-center py-8 text-gray-500">Carregando dados do Reino...</div>;
  }

  const showStatus = (type: 'success' | 'error', message: string) => {
    setStatus({ type, message });
    setTimeout(() => setStatus(null), 3000);
  };

  const handleUpdateKingdomName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kingdom || !newKingdomName || role !== 'admin') return;
    setIsUpdatingName(true);
    try {
      await updateDoc(doc(db, 'kingdoms', kingdom.id), { name: newKingdomName });
      showStatus('success', 'Nome do Reino atualizado!');
    } catch (error) {
      console.error('Erro ao atualizar nome:', error);
      showStatus('error', 'Erro ao atualizar nome.');
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleLeaveKingdom = async () => {
    if (!myMemberId) return;
    if (role === 'admin' && members.length > 1) {
      showStatus('error', 'Transfira a liderança antes de sair ou remova todos os membros.');
      return;
    }
    
    try {
      await kingdomService.removeMember(myMemberId);
      window.location.reload(); // Reload to trigger kingdom creation or join
    } catch (error) {
      console.error('Erro ao sair do reino:', error);
      showStatus('error', 'Erro ao sair do reino.');
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kingdom || !auth.currentUser || !inviteEmail) return;
    
    setIsInviting(true);
    try {
      await kingdomService.createInvite(kingdom.id, inviteEmail, inviteRole, auth.currentUser.uid);
      setInviteEmail('');
      showStatus('success', 'Convite enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      showStatus('error', 'Erro ao enviar convite.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleAcceptInvite = async (inviteId: string) => {
    if (!auth.currentUser) return;
    try {
      await kingdomService.acceptInvite(inviteId, auth.currentUser.uid);
      showStatus('success', 'Convite aceito! Bem-vindo ao novo Reino.');
      window.location.reload();
    } catch (error) {
      console.error('Erro ao aceitar convite:', error);
      showStatus('error', 'Erro ao aceitar convite.');
    }
  };

  const handleRejectInvite = async (inviteId: string) => {
    try {
      await kingdomService.rejectInvite(inviteId);
      showStatus('success', 'Convite recusado.');
    } catch (error) {
      console.error('Erro ao recusar convite:', error);
      showStatus('error', 'Erro ao recusar convite.');
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: KingdomRole) => {
    try {
      await kingdomService.updateMemberRole(memberId, newRole);
      showStatus('success', 'Cargo atualizado com sucesso.');
    } catch (error) {
      console.error('Erro ao atualizar cargo:', error);
      showStatus('error', 'Erro ao atualizar cargo.');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await kingdomService.removeMember(memberId);
      showStatus('success', 'Membro removido com sucesso.');
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      showStatus('error', 'Erro ao remover membro.');
    }
  };

  const copyInviteCode = () => {
    if (kingdom?.invite_code) {
      navigator.clipboard.writeText(kingdom.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode) return;
    setIsJoining(true);
    try {
      await joinKingdomByCode(joinCode);
      alert('Você entrou no Reino com sucesso!');
      setJoinCode('');
      window.location.reload();
    } catch (error: any) {
      console.error('Erro ao entrar no reino:', error);
      alert(error.message || 'Erro ao entrar no reino. Verifique o código.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Status Messages */}
      {status && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 rounded-2xl text-sm font-bold shadow-sm flex items-center gap-2",
            status.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
          )}
        >
          {status.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {status.message}
        </motion.div>
      )}

      {/* Informações do Reino */}
      <section className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            {role === 'admin' ? (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Nome do Reino</label>
                <form onSubmit={handleUpdateKingdomName} className="flex items-center gap-2 group">
                  <input
                    type="text"
                    value={newKingdomName}
                    onChange={(e) => setNewKingdomName(e.target.value)}
                    className="text-2xl font-display font-bold text-gray-900 bg-gray-50/50 border-b-2 border-transparent focus:border-indigo-500 outline-none transition-all px-2 py-1 rounded-t-lg w-full max-w-md"
                  />
                  <button type="submit" disabled={isUpdatingName} className="p-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-sm active:scale-95">
                    <Check className="w-5 h-5" />
                  </button>
                </form>
              </div>
            ) : (
              <h3 className="text-2xl font-display font-bold text-gray-900">{kingdom?.name || 'Seu Reino'}</h3>
            )}
            <p className="text-sm text-gray-500 mt-1">Gerencie os heróis que compartilham este reino.</p>
          </div>
          <div className={cn("px-4 py-2 rounded-xl text-sm font-bold text-white shrink-0", colors.primary)}>
            Seu Cargo: {role === 'admin' ? 'Administrador' : role === 'member' ? 'Membro' : 'Observador'}
          </div>
          <button
            onClick={handleLeaveKingdom}
            className="ml-4 p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
            title="Sair do Reino"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {role === 'admin' && kingdom?.invite_code && (
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-6">
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Código de Convite do Reino</p>
              <p className="text-lg font-mono font-bold text-gray-900">{kingdom.invite_code}</p>
            </div>
            <button 
              onClick={copyInviteCode}
              className="p-2 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
              title="Copiar Código"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-gray-500" />}
            </button>
          </div>
        )}

        {/* Lista de Membros */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4" /> Heróis do Reino ({members.length})
          </h4>
          <div className="divide-y divide-gray-100">
            {members.map((member) => (
              <div key={member.id} className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-bold", colors.primary)}>
                    {(member.user_name || member.user_email || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{member.user_name || 'Usuário'}</p>
                    <p className="text-xs text-gray-500">{member.user_email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {role === 'admin' && member.user_id !== auth.currentUser?.uid ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.id, e.target.value as KingdomRole)}
                      className="text-xs border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Membro</option>
                      <option value="viewer">Observador</option>
                    </select>
                  ) : (
                    <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                      {member.role === 'admin' && <Shield className="w-3 h-3" />}
                      {member.role === 'member' && <User className="w-3 h-3" />}
                      {member.role === 'viewer' && <Eye className="w-3 h-3" />}
                      {member.role}
                    </span>
                  )}

                  {role === 'admin' && member.user_id !== auth.currentUser?.uid && (
                    <button 
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remover Membro"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feed de Atividades */}
      <section className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4" /> Atividades Recentes do Reino
        </h4>
        <ActivityFeed logs={activityLogs} colors={colors} />
      </section>

      {/* Entrar em um Reino por Código */}
      <section className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4" /> Entrar em um Reino
        </h4>
        <form onSubmit={handleJoinByCode} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Código do Reino (ex: KNG-1234)"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            className="flex-1 rounded-xl border-gray-200 focus:ring-indigo-500 focus:border-indigo-500 uppercase"
            required
          />
          <button
            type="submit"
            disabled={isJoining || !joinCode}
            className={cn(
              "px-6 py-2 rounded-xl text-white font-bold transition-all disabled:opacity-50",
              colors.primary
            )}
          >
            {isJoining ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </section>

      {/* Convidar Novo Herói (Apenas Admin) */}
      {role === 'admin' && (
        <section className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
            <UserPlus className="w-4 h-4" /> Convidar Novo Herói
          </h4>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="E-mail do herói"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 rounded-xl border-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as KingdomRole)}
              className="rounded-xl border-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="member">Membro</option>
              <option value="viewer">Observador</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              disabled={isInviting || !inviteEmail}
              className={cn(
                "px-6 py-2 rounded-xl text-white font-bold transition-all disabled:opacity-50",
                colors.primary
              )}
            >
              {isInviting ? 'Enviando...' : 'Convidar'}
            </button>
          </form>
        </section>
      )}

      {/* Convites Pendentes Recebidos */}
      {invites.length > 0 && (
        <section className="bg-amber-50 rounded-3xl p-6 border border-amber-100 shadow-sm">
          <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2 mb-4">
            Convites Recebidos ({invites.length})
          </h4>
          <div className="space-y-3">
            {invites.map((invite) => (
              <div key={invite.id} className="bg-white p-4 rounded-2xl border border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900">Convite para Reino</p>
                  <p className="text-xs text-gray-500">Cargo oferecido: {invite.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAcceptInvite(invite.id)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-colors"
                  >
                    Aceitar
                  </button>
                  <button
                    onClick={() => handleRejectInvite(invite.id)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-colors"
                  >
                    Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
