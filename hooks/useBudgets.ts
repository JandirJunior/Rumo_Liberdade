import { useState, useEffect } from 'react';
import { db, auth } from '@/firebase';
import { collection, onSnapshot, query, where, doc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { BudgetEntity, TransactionEntity, CategoryEntity } from '@/lib/financialEngine';
import { useCategories } from './useCategories';
import { useTheme } from '@/lib/ThemeContext';
import { addXP } from '@/lib/gameEngine';
import { useKingdom } from './useKingdom';
import { getCollectionByKingdom } from '@/lib/firebaseUtils';

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
  progresso: number;
  status: 'controle mantido' | 'orçamento excedido';
  xp_reward: number;
  conquista: string | null;
}

export function useBudgets(month: number, year: number) {
  const [budgets, setBudgets] = useState<BudgetEntity[]>([]);
  const [transactions, setTransactions] = useState<TransactionEntity[]>([]);
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

    const unsubscribeBudgets = onSnapshot(budgetsQuery, (snapshot) => {
      const loadedBudgets = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as BudgetEntity));
      // If there are multiple budgets for the same category (from previous version), take the first one
      const uniqueBudgets = loadedBudgets.reduce((acc, curr) => {
        if (!acc.find(b => b.category_id === curr.category_id)) {
          acc.push(curr);
        }
        return acc;
      }, [] as BudgetEntity[]);
      setBudgets(uniqueBudgets);
    });

    // Fetch Transactions for the specific month
    const transactionsQuery = getCollectionByKingdom('transactions', kingdom.id);

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
      setLoading(false);
    });

    return () => {
      unsubscribeBudgets();
      unsubscribeTransactions();
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
  );
  
  const budgetProgress: BudgetProgress[] = filteredCategories.map(cat => {
    const budget = budgets.find(b => b.category_id === cat.id);
    const orcado = budget ? budget.budget_amount : 0;
    
    // Sum transactions for this category in the given month/year
    const gasto_real = transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.type === cat.flow_type && 
               (t.category_id === cat.id || t.category === cat.name) && 
               d.getMonth() + 1 === month && 
               d.getFullYear() === year;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    let progresso = 0;
    let status: 'controle mantido' | 'orçamento excedido' = 'controle mantido';

    if (cat.flow_type === 'expense') {
      progresso = orcado > 0 ? Math.min(100, (gasto_real / orcado) * 100) : (gasto_real > 0 ? 100 : 0);
      status = gasto_real > orcado ? 'orçamento excedido' : 'controle mantido';
    } else {
      // For income, progress is how much of the expected income we've received
      progresso = orcado > 0 ? Math.min(100, (gasto_real / orcado) * 100) : (gasto_real > 0 ? 100 : 0);
      status = gasto_real < orcado ? 'orçamento excedido' : 'controle mantido'; // Reusing the type, but conceptually it means "below target" if exceeded is bad. Let's keep the type but maybe adjust the UI. Actually, if income is below target, it's bad. If above, it's good.
      // Let's just use the same logic for now, or add a new status.
      // The type is 'controle mantido' | 'orçamento excedido'.
      // For income: if real < orcado, it's "bad" (excedido? no, "abaixo da meta"). Let's just use 'controle mantido' if real >= orcado.
      status = gasto_real >= orcado ? 'controle mantido' : 'orçamento excedido';
    }

    return {
      category_id: cat.id,
      category_name: cat.name,
      rpg_group: cat.rpg_group,
      icon: cat.icon,
      color: cat.color,
      rpg_theme_name: cat.rpg_theme_name,
      flow_type: cat.flow_type,
      orcado,
      gasto_real,
      progresso,
      status,
      xp_reward: 50,
      conquista: null
    };
  });

  return { budgets, budgetProgress, loading: loading || categoriesLoading, saveBudget };
}
