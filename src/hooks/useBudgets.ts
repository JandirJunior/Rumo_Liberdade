import { useState, useEffect } from 'react';
import { db, auth } from '@/services/firebase';
import { collection, onSnapshot, query, where, doc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { BudgetEntity, TransactionEntity, CategoryEntity, financialEngine } from '@/lib/financialEngine';
import { useCategories } from './useCategories';
import { useTheme } from '@/lib/ThemeContext';
import { addXP } from '@/lib/gameEngine';
import { useKingdom } from './useKingdom';
import { getCollectionByKingdom, handleFirestoreError, OperationType } from '@/services/firebaseUtils';
import { BudgetProgress } from '@/types';

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
  
  const budgetProgress: BudgetProgress[] = financialEngine.calculateBudgetProgressData(
    month,
    year,
    filteredCategories,
    budgets,
    transactions,
    payables,
    receivables,
    creditCards
  );

  return { budgets, budgetProgress, loading: loading || categoriesLoading, saveBudget };
}
