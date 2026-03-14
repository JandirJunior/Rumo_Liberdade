import { useState, useEffect } from 'react';
import { db, auth } from '@/firebase';
import { collection, onSnapshot, query, where, doc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { BudgetEntity, TransactionEntity, CategoryEntity } from '@/lib/financialEngine';
import { useCategories } from './useCategories';
import { useTheme } from '@/lib/ThemeContext';

export interface BudgetProgress {
  category_id: string;
  category_name: string;
  rpg_group: string;
  icon: string;
  color: string;
  rpg_theme_name: string;
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

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setBudgets([]);
        setTransactions([]);
        setLoading(false);
        return;
      }

      const userId = user.uid;

      // Fetch Budgets
      const budgetsRef = collection(db, 'budgets');
      const budgetsQuery = query(
        budgetsRef,
        where('user_id', '==', userId),
        where('month', '==', month),
        where('year', '==', year)
      );

      const unsubscribeBudgets = onSnapshot(budgetsQuery, (snapshot) => {
        const loadedBudgets = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as BudgetEntity));
        setBudgets(loadedBudgets);
      });

      // Fetch Transactions for the specific month
      const transactionsRef = collection(db, 'transactions');
      const transactionsQuery = query(transactionsRef, where('user_id', '==', userId));

      const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
        const loadedTransactions = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            date: data.date?.toDate() || new Date(),
            created_at: data.created_at?.toDate() || new Date(),
          } as TransactionEntity;
        });
        setTransactions(loadedTransactions);
        setLoading(false);
      });

      return () => {
        unsubscribeBudgets();
        unsubscribeTransactions();
      };
    });

    return () => unsubscribeAuth();
  }, [month, year]);

  const saveBudget = async (category_id: string, amount: number) => {
    if (!auth.currentUser) return;
    
    // Find if budget already exists for this category_id, month, year
    const existingBudget = budgets.find(b => b.category_id === category_id);
    
    const budgetId = existingBudget ? existingBudget.id : doc(collection(db, 'budgets')).id;
    
    const budgetData: BudgetEntity = {
      id: budgetId,
      user_id: auth.currentUser.uid,
      category_id,
      budget_amount: amount,
      month,
      year
    };

    await setDoc(doc(db, 'budgets', budgetId), budgetData);
  };

  // Calculate progress
  const profileType = gameMode === 'reino' ? 'MultiUsuario' : 'MonoUsuario';
  const expenseCategories = categories.filter(c => 
    c.flow_type === 'expense' && 
    (!c.allowed_profiles || c.allowed_profiles.includes(profileType))
  );
  
  const budgetProgress: BudgetProgress[] = expenseCategories.map(cat => {
    const budget = budgets.find(b => b.category_id === cat.id);
    const orcado = budget ? budget.budget_amount : 0;
    
    // Sum expenses for this category in the given month/year
    const gasto_real = transactions
      .filter(t => 
        t.type === 'expense' && 
        (t.category_id === cat.id || t.category === cat.name) && 
        t.date.getMonth() + 1 === month && 
        t.date.getFullYear() === year
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const progresso = orcado > 0 ? Math.min(100, (gasto_real / orcado) * 100) : (gasto_real > 0 ? 100 : 0);
    const status = gasto_real > orcado ? 'orçamento excedido' : 'controle mantido';

    return {
      category_id: cat.id,
      category_name: cat.name,
      rpg_group: cat.rpg_group,
      icon: cat.icon,
      color: cat.color,
      rpg_theme_name: cat.rpg_theme_name,
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
