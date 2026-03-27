import { useState } from 'react';
import { useKingdom } from '@/contexts/KingdomContext';
import { useRouter } from 'next/navigation';
import { Castle, ChevronRight, Sparkles, PlusCircle, LogOut, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { IMAGES } from '@/assets/images';
import { auth } from '@/services/firebase';
import { signOut } from 'firebase/auth';

export function KingdomSelector() {
  const { kingdoms, userInvites, selectKingdom, deleteKingdom, acceptInvite, rejectInvite, loading } = useKingdom();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handleAcceptInvite = async (id: string) => {
    setProcessingInviteId(id);
    try {
      await acceptInvite(id);
    } catch (error) {
      console.error('Error accepting invite:', error);
    } finally {
      setProcessingInviteId(null);
    }
  };

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const handleRejectInvite = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Recusar Convite',
      message: 'Deseja recusar este convite?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setProcessingInviteId(id);
        try {
          await rejectInvite(id);
        } catch (error) {
          console.error('Error rejecting invite:', error);
        } finally {
          setProcessingInviteId(null);
        }
      }
    });
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: 'Destruir Reino',
      message: `Tem certeza que deseja destruir o reino "${name}"? Esta ação é irreversível!`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setDeletingId(id);
        try {
          await deleteKingdom(id);
        } catch (error) {
          console.error('Error deleting kingdom:', error);
        } finally {
          setDeletingId(null);
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-dark)]">
        <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[var(--color-bg-dark)]">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={IMAGES.LOGIN}
          alt="Background"
          fill
          priority
          className="object-cover opacity-90"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--color-bg-dark)]/80 to-[var(--color-bg-dark)] opacity-70" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl z-10"
      >
        <div className="bg-[var(--color-bg-panel)]/90 border border-[var(--color-border)] rounded-3xl p-8 shadow-2xl backdrop-blur-md medieval-border relative">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2">
            <div className="w-24 h-24 bg-[var(--color-bg-panel)] rounded-2xl rotate-45 flex items-center justify-center border-2 border-[var(--color-primary)] shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.3)]">
              <div className="-rotate-45">
                <Castle className="w-12 h-12 text-[var(--color-primary)]" />
              </div>
            </div>
          </div>

          <div className="mt-12 text-center space-y-2 mb-8">
            <h1 className="text-3xl font-display font-bold text-[var(--color-text-main)] medieval-title">
              Escolha seu Reino
            </h1>
            <p className="text-[var(--color-text-muted)]">
              Para qual terra você deseja viajar hoje?
            </p>
          </div>

          <div className="grid gap-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
            {/* Invites Section */}
            {userInvites.length > 0 && (
              <div className="space-y-3 mb-4">
                <h2 className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-widest px-2">
                  Convites Pendentes
                </h2>
                {userInvites.map((invite) => (
                  <div 
                    key={invite.id} 
                    className="p-4 bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/30 rounded-2xl flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[var(--color-bg-panel)] rounded-lg flex items-center justify-center border border-[var(--color-primary)]/20">
                        <PlusCircle className="w-5 h-5 text-[var(--color-primary)]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--color-text-main)]">
                          {invite.kingdom_name || 'Novo Reino'}
                        </p>
                        <p className="text-[10px] text-[var(--color-text-muted)] uppercase">
                          Cargo: {invite.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptInvite(invite.id)}
                        disabled={!!processingInviteId}
                        className="px-3 py-1.5 bg-[var(--color-primary)] text-[var(--color-bg-dark)] text-xs font-bold rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                      >
                        Aceitar
                      </button>
                      <button
                        onClick={() => handleRejectInvite(invite.id)}
                        disabled={!!processingInviteId}
                        className="px-3 py-1.5 bg-red-500/10 text-red-500 text-xs font-bold rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-50"
                      >
                        Recusar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h2 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest px-2">
              Seus Reinos
            </h2>
            
            {kingdoms.map((kingdom) => (
              <div key={kingdom.id} className="relative group">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      selectKingdom(kingdom.id);
                      router.push('/dashboard');
                    }}
                    disabled={deletingId === kingdom.id}
                    className="flex-1 p-5 bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-2xl flex items-center justify-between hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-panel)] transition-all active:scale-[0.98] medieval-border disabled:opacity-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[var(--color-bg-panel)] rounded-xl flex items-center justify-center border border-[var(--color-border)] group-hover:border-[var(--color-primary)] transition-colors">
                        <Castle className="w-6 h-6 text-[var(--color-primary)]" />
                      </div>
                      <div className="text-left">
                        <span className="block font-bold text-[var(--color-text-main)] group-hover:text-[var(--color-primary)] transition-colors">
                          {kingdom.name}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-widest">
                          Reino Ativo
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all" />
                  </button>

                  {auth.currentUser?.uid === kingdom.owner_id && (
                    <button
                      onClick={(e) => handleDelete(e, kingdom.id, kingdom.name)}
                      disabled={deletingId === kingdom.id}
                      className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 hover:bg-red-500/20 hover:border-red-500/40 transition-all z-20 flex items-center justify-center"
                      title="Excluir Reino"
                    >
                      {deletingId === kingdom.id ? (
                        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={24} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Genesis Access - Create New Kingdom */}
            <div className="pt-4">
              <button
                onClick={() => router.push('/genesis')}
                className="w-full group p-5 bg-[var(--color-primary)] border-2 border-[var(--color-primary)] rounded-2xl flex items-center justify-between hover:bg-[var(--color-primary)]/90 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.3)]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[var(--color-bg-dark)]/20 rounded-xl flex items-center justify-center border border-white/20">
                    <Sparkles className="w-6 h-6 text-[var(--color-bg-dark)]" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-[var(--color-bg-dark)] text-lg">
                      Gênese
                    </span>
                    <span className="text-[10px] text-[var(--color-bg-dark)]/70 uppercase font-bold tracking-widest">
                      Criar Novo Reino
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-[var(--color-bg-dark)]/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ChevronRight className="w-6 h-6 text-[var(--color-bg-dark)]" />
                </div>
              </button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[var(--color-border)] flex justify-center">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-red-500 transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sair da Conta
            </button>
          </div>
        </div>
      </motion.div>

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-2xl p-6 shadow-2xl relative z-10 max-w-sm w-full medieval-border"
            >
              <h3 className="text-xl font-bold text-[var(--color-text-main)] mb-2">{confirmModal.title}</h3>
              <p className="text-[var(--color-text-muted)] mb-6">{confirmModal.message}</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl font-bold text-[var(--color-text-muted)] hover:bg-[var(--color-bg-dark)] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className="px-4 py-2 rounded-xl font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
