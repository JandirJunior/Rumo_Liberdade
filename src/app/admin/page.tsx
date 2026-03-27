'use client';

import { useState, useEffect } from 'react';
import { kingdomService } from '@/services/kingdomService';
import { Kingdom } from '@/types';
import { Trash2, ShieldAlert, Lock, Search, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [kingdoms, setKingdoms] = useState<(Kingdom & { owner_name?: string; owner_email?: string; last_activity_at?: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const ADMIN_PASSWORD = 'J@nd1rjun10r';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthorized(true);
      loadKingdoms();
    } else {
      setError('Senha incorreta.');
    }
  };

  const loadKingdoms = async () => {
    setLoading(true);
    try {
      const allKingdoms = await kingdomService.getAllKingdoms();
      setKingdoms(allKingdoms);
    } catch (err) {
      console.error('Error loading kingdoms:', err);
      setError('Erro ao carregar reinos.');
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
    k.owner_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-zinc-900 border border-red-900/50 rounded-3xl p-8 shadow-2xl"
        >
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center border border-red-900/50">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white uppercase tracking-widest">Área Restrita</h1>
            <p className="text-zinc-500 text-sm text-center">Acesso exclusivo para administradores supremos.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-red-500 transition-all"
                placeholder="Senha de Acesso"
              />
            </div>
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            <button
              type="submit"
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all active:scale-95"
            >
              Autenticar
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-tighter flex items-center gap-3">
              <ShieldAlert className="text-red-500" />
              Gestão de Reinos
            </h1>
            <p className="text-zinc-500">Total de reinos na base: {kingdoms.length}</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all text-sm"
            >
              Voltar ao App
            </button>
            <button 
              onClick={() => setIsAuthorized(false)}
              className="p-2 text-zinc-500 hover:text-white transition-all"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <div className="mb-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por nome ou ID do dono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-red-500 transition-all"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto bg-zinc-900 border border-zinc-800 rounded-3xl">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-950/50 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Nome Reino</th>
                  <th className="px-6 py-4 font-medium">ID Reino</th>
                  <th className="px-6 py-4 font-medium">Nome Dono</th>
                  <th className="px-6 py-4 font-medium">E-Mail Dono</th>
                  <th className="px-6 py-4 font-medium">Id Dono</th>
                  <th className="px-6 py-4 font-medium">Criado em</th>
                  <th className="px-6 py-4 font-medium">Ultima Movimentação</th>
                  <th className="px-6 py-4 font-medium text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredKingdoms.map((k) => (
                  <tr key={k.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-white whitespace-nowrap">{k.name}</td>
                    <td className="px-6 py-4 font-mono text-xs">{k.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{k.owner_name || 'Desconhecido'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{k.owner_email || 'Desconhecido'}</td>
                    <td className="px-6 py-4 font-mono text-xs">{k.owner_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(k.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-zinc-500 italic whitespace-nowrap">
                      {k.last_activity_at ? new Date(k.last_activity_at).toLocaleDateString() : 'Sem atividade'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDelete(k.id, k.name)}
                        className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                        title="Apagar Reino"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative z-10 max-w-sm w-full"
            >
              <h3 className="text-xl font-bold text-white mb-2">{confirmModal.title}</h3>
              <p className="text-zinc-400 mb-6">{confirmModal.message}</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl font-bold text-zinc-400 hover:bg-zinc-800 transition-colors"
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
