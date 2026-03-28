'use client';
import { useState, useEffect, useCallback } from 'react';
import { db } from '@/services/firebase';
import { collection, getDocs, doc, query, where, writeBatch } from 'firebase/firestore';
import { useKingdomData } from '@/contexts/KingdomContext';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trash2, 
  Database, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Search,
  ChevronRight,
  Filter,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';

export default function CleanupPage() {
  const { kingdomId, loading: contextLoading } = useKingdomData();
  const [selectedTable, setSelectedTable] = useState('accounts_payable');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [items, setItems] = useState<Record<string, any>[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' | null }>({ text: '', type: null });
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, count: 0 });

  const parseItemDate = (data: Record<string, any>): Date | null => {
    if (data.month !== undefined && data.year !== undefined) {
      const m = Number(data.month);
      const y = Number(data.year);
      if (!isNaN(m) && !isNaN(y)) {
        return new Date(y, m - 1, 1);
      }
    }

    const dateValue = data.dueDate || data.due_date || data.date || data.created_at || data.createdAt || 
                     data.closingDate || data.closing_date || data.paidAt || data.paid_at || 
                     data.received_at || data.receivedAt || data.mês || data.timestamp;
    
    if (dateValue) {
      if (typeof dateValue === 'string' && /^\d{4}-\d{2}$/.test(dateValue)) {
        const [year, month] = dateValue.split('-').map(Number);
        return new Date(year, month - 1, 1);
      }
      const d = new Date(dateValue instanceof Date ? dateValue : (dateValue as any).toDate ? (dateValue as any).toDate() : dateValue as string | number | Date);
      if (!isNaN(d.getTime())) return d;
    }

    if (data.year && data.month) {
      return new Date(Number(data.year), Number(data.month) - 1, 1);
    }

    return new Date(0);
  };

  const loadAllItems = useCallback(async (showFeedback = false) => {
    if (!kingdomId) return;
    if (showFeedback) setIsRefreshing(true);
    
    const collections = [
      'accounts_payable', 
      'accounts_receivable', 
      'transactions', 
      'investments',
      'budgets',
      'credit_cards',
      'credit_card_invoices',
      'contribution_planning',
      'categories',
      'activity_logs'
    ];
    
    const allItems: any[] = [];
    for (const colName of collections) {
      try {
        const q = query(collection(db, colName), where('kingdom_id', '==', kingdomId));
        const snapshot = await getDocs(q);
        snapshot.docs.forEach(d => allItems.push({ id: d.id, col: colName, ...d.data() }));
      } catch (err) {
        console.error(`Error loading ${colName}:`, err);
      }
    }
    setItems(allItems);
    if (showFeedback) setIsRefreshing(false);
  }, [kingdomId]);

  useEffect(() => {
    loadAllItems();
  }, [loadAllItems]);

  const handleCleanupClick = () => {
    if (!kingdomId) return;
    setConfirmModal({ isOpen: true, count: items.filter(i => i.col === selectedTable).length });
  };

  const performCleanup = async () => {
    setConfirmModal({ isOpen: false, count: 0 });
    setLoading(true);
    setMessage({ text: 'Processando limpeza...', type: 'info' });

    try {
      const colRef = collection(db, selectedTable);
      const q = query(colRef, where('kingdom_id', '==', kingdomId));
      const snapshot = await getDocs(q);
      
      let start: Date | null = null;
      let end: Date | null = null;

      if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      }

      const docsToDelete = snapshot.docs.filter(d => {
        const itemDate = parseItemDate(d.data());
        if (itemDate && itemDate.getTime() === 0) return true;
        if (start && end) {
          return itemDate && itemDate >= start && itemDate <= end;
        }
        return false;
      });

      if (docsToDelete.length === 0) {
        setMessage({ text: 'Nenhum registro encontrado para este intervalo.', type: 'info' });
        setLoading(false);
        return;
      }

      let count = 0;
      for (let i = 0; i < docsToDelete.length; i += 500) {
        const batch = writeBatch(db);
        const chunk = docsToDelete.slice(i, i + 500);
        chunk.forEach(d => {
          batch.delete(doc(db, selectedTable, d.id));
          count++;
        });
        await batch.commit();
      }

      setMessage({ text: `Sucesso! ${count} registros removidos da tabela ${selectedTable}.`, type: 'success' });
      loadAllItems();
    } catch (e) {
      console.error('Erro no cleanup:', e);
      setMessage({ text: 'Erro: ' + (e instanceof Error ? e.message : String(e)), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const tableLabels: Record<string, string> = {
    accounts_payable: 'Contas a Pagar',
    accounts_receivable: 'Contas a Receber',
    transactions: 'Transações',
    investments: 'Investimentos',
    budgets: 'Orçamentos',
    credit_cards: 'Cartões de Crédito',
    credit_card_invoices: 'Faturas de Cartão',
    contribution_planning: 'Planejamento de Aportes',
    categories: 'Categorias',
    activity_logs: 'Logs de Atividade'
  };

  return (
    <AdminGuard title="Database Cleanup" description="Gerenciamento e limpeza avançada de dados do reino">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Database className="text-red-600" size={32} />
              Database Cleanup
            </h1>
            <p className="text-slate-600 font-bold mt-1 uppercase text-[10px] tracking-widest">
              Gerenciamento e limpeza avançada de dados do reino
            </p>
          </div>
          <button 
            onClick={() => loadAllItems(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-800 font-black hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 border-b-4 active:border-b-0 active:translate-y-1"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            Atualizar Dados
          </button>
        </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cleanup Controls */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <Filter size={20} className="text-red-600" />
                  Configurações de Limpeza
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-600 uppercase tracking-wider ml-1">Tabela Alvo</label>
                    <select 
                      value={selectedTable} 
                      onChange={(e) => setSelectedTable(e.target.value)} 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-black focus:ring-2 focus:ring-red-500/20 outline-none transition-all appearance-none cursor-pointer"
                    >
                      {Object.entries(tableLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-600 uppercase tracking-wider ml-1">Data Inicial</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                          type="date" 
                          value={startDate} 
                          onChange={(e) => setStartDate(e.target.value)} 
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-black focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-600 uppercase tracking-wider ml-1">Data Final</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                          type="date" 
                          value={endDate} 
                          onChange={(e) => setEndDate(e.target.value)} 
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-black focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                  <div className="flex gap-3">
                    <AlertTriangle className="text-red-600 shrink-0" size={20} />
                    <p className="text-xs text-red-800 font-medium leading-relaxed">
                      Esta ação é irreversível. Se nenhuma data for selecionada, apenas registros sem data válida serão removidos.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={handleCleanupClick} 
                  disabled={loading || contextLoading}
                  className="w-full bg-red-600 text-white p-4 rounded-2xl font-black hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
                >
                  <Trash2 size={20} />
                  {loading ? 'Processando...' : 'Executar Limpeza'}
                </button>
              </div>

              {message.text && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-2xl border flex items-start gap-3 ${
                    message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                    message.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' :
                    'bg-blue-50 border-blue-100 text-blue-800'
                  }`}
                >
                  {message.type === 'success' ? <CheckCircle2 size={20} className="shrink-0" /> : <AlertTriangle size={20} className="shrink-0" />}
                  <p className="text-sm font-bold">{message.text}</p>
                </motion.div>
              )}
            </div>

            {/* Data Preview */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col h-[600px]">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                      <Search size={20} className="text-slate-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Registros Atuais</h2>
                      <p className="text-xs text-slate-600 font-black uppercase tracking-wider">{items.length} itens encontrados</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                  <div className="space-y-1">
                    {items.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Database size={48} strokeWidth={1} className="mb-4 opacity-20" />
                        <p className="font-bold">Nenhum registro encontrado</p>
                      </div>
                    ) : (
                      items.map((item, idx) => {
                        const itemDate = parseItemDate(item);
                        const dateStr = (itemDate && itemDate.getTime() !== 0) ? itemDate.toLocaleDateString('pt-BR') : 'Sem data';
                        
                        return (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                            key={item.id} 
                            className="group flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-white transition-colors">
                                <ChevronRight size={14} className="text-slate-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-black text-slate-900 truncate">
                                  {item.description || item.name || item.ticker || item.category_id || 'Sem descrição'}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest bg-slate-200 px-1.5 py-0.5 rounded border border-slate-300">
                                    {tableLabels[item.col] || item.col}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-500 font-bold">ID: {item.id.slice(0, 8)}...</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={`text-xs font-black ${dateStr === 'Sem data' ? 'text-red-600' : 'text-slate-700'}`}>
                                {dateStr}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        <AnimatePresence>
          {confirmModal.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setConfirmModal({ isOpen: false, count: 0 })}
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
                <h3 className="text-xl font-bold text-slate-900 mb-2">Confirmar Limpeza</h3>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                  Você está prestes a remover registros da tabela <span className="font-bold text-slate-900">{tableLabels[selectedTable]}</span>. 
                  Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmModal({ isOpen: false, count: 0 })}
                    className="flex-1 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={performCleanup}
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
