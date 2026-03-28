'use client';

import { useState, useEffect } from 'react';
import { kingdomService } from '@/services/kingdomService';
import { Kingdom } from '@/types';
import { Trash2, ShieldAlert, Lock, Search, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

import { AdminGuard } from '@/components/admin/AdminGuard';

export default function AdminPage() {
  const [kingdoms, setKingdoms] = useState<(Kingdom & { owner_name?: string; owner_email?: string; last_activity_at?: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadKingdoms();
  }, []);

  const loadKingdoms = async () => {
    setLoading(true);
    try {
      const allKingdoms = await kingdomService.getAllKingdoms();
      setKingdoms(allKingdoms);
    } catch (err) {
      console.error('Error loading kingdoms:', err);
      setError('Erro ao carregar reinos. Verifique suas permissões no Firebase.');
    } finally {
      setLoading(false);
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

  const handleDelete = async (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Destruir Reino',
      message: `TEM CERTEZA? Esta ação apagará o reino "${name}" permanentemente da base de dados!`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await kingdomService.deleteKingdom(id);
          setKingdoms(kingdoms.filter(k => k.id !== id));
        } catch (err) {
          console.error('Error deleting kingdom:', err);
        }
      }
    });
  };

  const filteredKingdoms = kingdoms.filter(k => 
    k.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.owner_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (k.owner_email && k.owner_email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AdminGuard 
      title="Gestão de Reinos" 
      description="Gerencie todos os reinos e usuários da plataforma."
    >
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome, ID ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-widest bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-300">
              {kingdoms.length} Reinos
            </span>
            <button 
              onClick={loadKingdoms}
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-slate-200 bg-white"
              title="Recarregar"
            >
              <LogOut size={18} className="rotate-180" />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm flex items-center gap-3">
            <ShieldAlert size={18} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Consultando Pergaminhos...</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-black text-slate-700 uppercase tracking-wider text-[11px]">Reino</th>
                    <th className="px-6 py-4 font-black text-slate-700 uppercase tracking-wider text-[11px]">Proprietário</th>
                    <th className="px-6 py-4 font-black text-slate-700 uppercase tracking-wider text-[11px]">ID Reino / Dono</th>
                    <th className="px-6 py-4 font-black text-slate-700 uppercase tracking-wider text-[11px]">Atividade</th>
                    <th className="px-6 py-4 font-black text-slate-700 uppercase tracking-wider text-[11px] text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredKingdoms.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                        Nenhum reino encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredKingdoms.map((k) => (
                      <tr key={k.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-black text-slate-900 text-base">{k.name}</div>
                          <div className="text-[11px] text-slate-600 uppercase font-bold mt-0.5">
                            Criado em {new Date(k.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{k.owner_name || 'Desconhecido'}</div>
                          <div className="text-xs text-slate-600 font-medium">{k.owner_email || 'Sem e-mail'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-black uppercase border border-slate-300">Reino</span>
                              <code className="text-[11px] text-slate-700 font-mono font-bold">{k.id}</code>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-black uppercase border border-blue-200">Dono</span>
                              <code className="text-[11px] text-slate-700 font-mono font-bold">{k.owner_id}</code>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {k.last_activity_at ? (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                              <span className="text-sm font-bold text-slate-800">
                                {new Date(k.last_activity_at).toLocaleDateString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-500 font-bold italic">Inativo</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleDelete(k.id, k.name)}
                            className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Apagar Reino"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl relative z-10 max-w-sm w-full"
            >
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <ShieldAlert className="text-red-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{confirmModal.title}</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">{confirmModal.message}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className="flex-1 py-3 rounded-2xl font-bold bg-red-600 text-white hover:bg-red-700 transition-colors text-sm shadow-lg shadow-red-600/20"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminGuard>
  );
}
