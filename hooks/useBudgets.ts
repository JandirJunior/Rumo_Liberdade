import { useState, useEffect } from 'react';
import { db, auth } from '@/firebase';
import { collection, onSnapshot, query, where, doc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { BudgetEntity, TransactionEntity, CategoryEntity } from '@/lib/financialEngine';
import { useCategories } from './useCategories';
import { useTheme } from '@/lib/ThemeContext';
import { addXP } from '@/lib/gameEngine';
import { useKingdom } from './useKingdom';
import { getCollectionByKingdom, handleFirestoreError, OperationType } from '@/lib/firebaseUtils';

export interface BudgetProgress {
  category_id: string;
  category_name: string;
  rpg_group: string;
  icon: string;
  color: string;
  rpg_theme_name: string;
  flow_type: 'income' | 'expense';
  orcado: number;
  gasto_real: number;
  previsto: number;
  progresso: number;
  status: 'controle mantido' | 'orçamento excedido';
  xp_reward: number;
  conquista: string | null;
}

export function useBudgets(month: number, year: number) {
  const [budgets, setBudgets] = useState<BudgetEntity[]>([]);
  const [transactions, setTransactions] = useState<TransactionEntity[]>([]);
  const [payables, setPayables] = useState<any[]>([]);
  const [receivables, setReceivables] = useState<any[]>([]);
  const [creditCards, setCreditCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { categories, loading: categoriesLoading } = useCategories();
  const { gameMode } = useTheme();
  const { kingdom, loading: kingdomLoading } = useKingdom();

  useEffect(() => {
    if (kingdomLoading) return;

    if (!kingdom || !auth.currentUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBudgets([]);
      setTransactions([]);
      setLoading(false);
      return;
    }

    const userId = auth.currentUser.uid;

    // Fetch Budgets (Global, not per month/year)
    const budgetsQuery = getCollectionByKingdom('budgets', kingdom.id);
    const transactionsQuery = getCollectionByKingdom('transactions', kingdom.id);
    const payablesQuery = getCollectionByKingdom('accounts_payable', kingdom.id);
    const receivablesQuery = getCollectionByKingdom('accounts_receivable', kingdom.id);
    const creditCardsQuery = getCollectionByKingdom('credit_card_invoices', kingdom.id);

    const unsubscribeBudgets = onSnapshot(budgetsQuery, (snapshot) => {
      const loadedBudgets = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as BudgetEntity));
      const uniqueBudgets = loadedBudgets.reduce((acc, curr) => {
        if (!acc.find(b => b.category_id === curr.category_id)) {
          acc.push(curr);
        }
        return acc;
      }, [] as BudgetEntity[]);
      setBudgets(uniqueBudgets);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'budgets');
    });

    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const loadedTransactions = snapshot.docs.map(doc => {
        const data = doc.data();
        let date = new Date();
        if (data.date) {
          if (typeof data.date.toDate === 'function') {
            date = data.date.toDate();
          } else {
            date = new Date(data.date);
          }
        }
        
        let createdAt = new Date();
        if (data.created_at) {
          if (typeof data.created_at.toDate === 'function') {
            createdAt = data.created_at.toDate();
          } else {
            createdAt = new Date(data.created_at);
          }
        }

        return {
          ...data,
          id: doc.id,
          date,
          created_at: createdAt,
        } as TransactionEntity;
      });
      setTransactions(loadedTransactions);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'transactions');
    });

    const unsubscribePayables = onSnapshot(payablesQuery, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setPayables(loaded);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'accounts_payable');
    });

    const unsubscribeReceivables = onSnapshot(receivablesQuery, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setReceivables(loaded);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'accounts_receivable');
    });

    const unsubscribeCreditCards = onSnapshot(creditCardsQuery, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setCreditCards(loaded);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'credit_card_invoices');
    });

    return () => {
      unsubscribeBudgets();
      unsubscribeTransactions();
      unsubscribePayables();
      unsubscribeReceivables();
      unsubscribeCreditCards();
    };
  }, [month, year, kingdom, kingdomLoading]);

  const saveBudget = async (category_id: string, amount: number) => {
    if (!auth.currentUser || !kingdom) return;
    
    // Find if budget already exists for this category_id
    const existingBudget = budgets.find(b => b.category_id === category_id);
    
    const budgetId = existingBudget ? existingBudget.id : `${kingdom.id}_${category_id}`;
    
    const budgetData: Partial<BudgetEntity> = {
      id: budgetId,
      user_id: auth.currentUser.uid,
      category_id,
      budget_amount: amount,
      kingdom_id: kingdom.id,
      created_by: auth.currentUser.uid
    };

    await setDoc(doc(db, 'budgets', budgetId), budgetData, { merge: true });
    
    // Add XP for setting a budget
    await addXP(auth.currentUser.uid, 20);
  };

  // Calculate progress
  const profileType = gameMode === 'reino' ? 'MultiUsuario' : 'MonoUsuario';
  const filteredCategories = categories.filter(c => 
    (!c.allowed_profiles || c.allowed_profiles.includes(profileType))
  ).reduce((acc, curr) => {
    // Deduplicate by name and rpg_group
    if (!acc.find(c => c.name === curr.name && c.rpg_group === curr.rpg_group)) {
      acc.push(curr);
    }
    return acc;
  }, [] as CategoryEntity[]);
  
  const budgetProgress: BudgetProgress[] = filteredCategories.map(cat => {
    const budget = budgets.find(b => b.category_id === cat.id);
    const orcado = budget ? budget.budget_amount : 0;
    
    // Sum transactions for this category in the given month/year
    const gasto_real = transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.type === cat.flow_type && 
               (t.category_id === cat.id) && 
               d.getMonth() + 1 === month && 
               d.getFullYear() === year;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate Previsto (Predicted)
    let previsto = 0;
    if (cat.flow_type === 'expense') {
      // From payables
      const payablesAmount = payables
        .filter(p => {
          const d = p.dueDate ? new Date(p.dueDate) : (p.due_date ? (typeof p.due_date.toDate === 'function' ? p.due_date.toDate() : new Date(p.due_date)) : null);
          return d && p.category_id === cat.id && 
                 d.getMonth() + 1 === month && 
                 d.getFullYear() === year &&
                 p.status !== 'paid';
        })
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
      
      // From credit cards
      const creditCardAmount = creditCards
        .filter(cc => {
          const d = cc.dueDate ? new Date(cc.dueDate) : (cc.due_date ? (typeof cc.due_date.toDate === 'function' ? cc.due_date.toDate() : new Date(cc.due_date)) : null);
          return d && cat.name.toLowerCase().includes('cartão') && 
                 d.getMonth() + 1 === month && 
                 d.getFullYear() === year &&
                 cc.status !== 'paid';
        })
        .reduce((sum, cc) => sum + Number(cc.total_amount || 0), 0);

      previsto = payablesAmount + creditCardAmount + gasto_real;
    } else {
      // From receivables
      const receivablesAmount = receivables
        .filter(r => {
          const d = r.dueDate ? new Date(r.dueDate) : (r.due_date ? (typeof r.due_date.toDate === 'function' ? r.due_date.toDate() : new Date(r.due_date)) : null);
          return d && r.category_id === cat.id && 
                 d.getMonth() + 1 === month && 
                 d.getFullYear() === year &&
                 r.status !== 'received';
        })
        .reduce((sum, r) => sum + Number(r.amount || 0), 0);
      
      previsto = receivablesAmount + gasto_real;
    }

    let progresso = 0;
    let status: 'controle mantido' | 'orçamento excedido' = 'controle mantido';

    if (cat.flow_type === 'expense') {
      progresso = orcado > 0 ? Math.min(100, (gasto_real / orcado) * 100) : (gasto_real > 0 ? 100 : 0);
      status = gasto_real > orcado ? 'orçamento excedido' : 'controle mantido';
    } else {
      progresso = orcado > 0 ? Math.min(100, (gasto_real / orcado) * 100) : (gasto_real > 0 ? 100 : 0);
      status = gasto_real >= orcado ? 'controle mantido' : 'orçamento excedido';
    }

    return {
      category_id: cat.id,
      category_name: cat.name,
      rpg_group: cat.rpg_group || 'Outros',
      icon: cat.icon || 'HelpCircle',
      color: cat.color || '#94a3b8',
      rpg_theme_name: cat.rpg_theme_name || 'Geral',
      flow_type: cat.flow_type || 'expense',
      orcado,
      gasto_real,
      previsto,
      progresso,
      status,
      xp_reward: 50,
      conquista: null
    };
  });

  return { budgets, budgetProgress, loading: loading || categoriesLoading, saveBudget };
}
