'use client';
import { useState, useEffect, useCallback } from 'react';
import { db } from '@/services/firebase';
import { collection, getDocs, deleteDoc, doc, query, where, writeBatch } from 'firebase/firestore';
import { useKingdomData } from '@/contexts/KingdomContext';

export default function CleanupPage() {
  const { kingdomId } = useKingdomData();
  const [selectedTable, setSelectedTable] = useState('accounts_payable');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadAllItems = useCallback(async () => {
    if (!kingdomId) return;
    const collections = [
      'accounts_payable', 
      'accounts_receivable', 
      'transactions', 
      'investments',
      'budgets',
      'credit_cards',
      'credit_card_invoices',
      'contribution_planning',
      'categories'
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
  }, [kingdomId]);

  useEffect(() => {
    loadAllItems();
  }, [loadAllItems]);

  const performCleanup = async () => {
    if (!kingdomId || !startDate || !endDate) return;
    setLoading(true);
    setMessage('Processando...');

    try {
      const colRef = collection(db, selectedTable);
      const q = query(colRef, where('kingdom_id', '==', kingdomId));
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      let count = 0;
      const start = new Date(startDate);
      const end = new Date(endDate);
      // Ensure end date includes the whole day
      end.setHours(23, 59, 59, 999);

      for (const d of snapshot.docs) {
        const data = d.data();
        // Check multiple possible date fields
        const dateField = data.dueDate || data.due_date || data.date || data.created_at || data.createdAt || data.closingDate || data.closing_date || data.paidAt || data.paid_at || data.received_at || data.receivedAt;
        
        let itemDate: Date | null = null;

        if (dateField) {
          itemDate = new Date(dateField instanceof Date ? dateField : dateField.toDate ? dateField.toDate() : dateField);
        } else if (data.month !== undefined && data.year !== undefined) {
          // Special handling for budgets
          itemDate = new Date(data.year, data.month - 1, 1);
        }
        
        if (itemDate && itemDate >= start && itemDate <= end) {
          batch.delete(doc(db, selectedTable, d.id));
          count++;
        }
      }

      if (count > 0) {
        await batch.commit();
        setMessage(`Sucesso! ${count} registros removidos da tabela ${selectedTable}.`);
        loadAllItems();
      } else {
        setMessage('Nenhum registro encontrado para este intervalo.');
      }
    } catch (e) {
      setMessage('Erro: ' + e);
    } finally {
      setLoading(false);
    }
  };

  if (!kingdomId) return <div className="p-10">Loading or no kingdom selected...</div>;

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Database Cleanup Avançado</h1>
      
      <div className="space-y-4 p-4 bg-gray-50 rounded">
        <div>
          <label className="block font-semibold">Tabela para Eliminação:</label>
          <select value={selectedTable} onChange={(e) => setSelectedTable(e.target.value)} className="w-full p-2 border rounded">
            <option value="accounts_payable">Contas a Pagar</option>
            <option value="accounts_receivable">Contas a Receber</option>
            <option value="transactions">Transações</option>
            <option value="investments">Investimentos</option>
            <option value="budgets">Orçamentos (Budgets)</option>
            <option value="credit_cards">Cartões de Crédito</option>
            <option value="credit_card_invoices">Faturas de Cartão</option>
            <option value="contribution_planning">Planejamento de Aportes</option>
            <option value="categories">Categorias</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold">Data Inicial:</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block font-semibold">Data Final:</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2 border rounded" />
          </div>
        </div>

        <button 
          onClick={performCleanup} 
          disabled={loading}
          className="w-full bg-red-600 text-white p-3 rounded font-bold hover:bg-red-700 disabled:bg-gray-400"
        >
          {loading ? 'Processando...' : 'Eliminar Registros no Período'}
        </button>
      </div>

      {message && <p className="mt-6 p-4 bg-gray-100 rounded">{message}</p>}

      <h2 className="text-xl font-bold mt-10 mb-4">Todos os Registros ({items.length})</h2>
      <div className="border rounded max-h-96 overflow-y-auto">
        {items.map(item => {
          const dateField = item.dueDate || item.due_date || item.date || item.created_at || item.createdAt || item.closingDate || item.closing_date || item.paidAt || item.paid_at || item.received_at || item.receivedAt;
          let dateStr = '';
          if (dateField) {
            const d = new Date(dateField instanceof Date ? dateField : dateField.toDate ? dateField.toDate() : dateField);
            dateStr = d.toLocaleDateString();
          } else if (item.month !== undefined && item.year !== undefined) {
            dateStr = `${item.month}/${item.year}`;
          }

          return (
            <div key={item.id} className="flex justify-between p-2 border-b text-sm hover:bg-gray-50">
              <span className="font-mono text-xs text-gray-500 w-32 truncate">{item.col}</span>
              <span className="flex-1 px-2 truncate">{item.description || item.name || item.ticker || item.category_id || 'Sem descrição'}</span>
              <span className="w-24 text-right">{dateStr}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
