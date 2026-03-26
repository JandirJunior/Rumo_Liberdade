/**
 * Contexto do Reino (Multiplayer): Gerencia estado e operações relacionadas a reinos.
 * Fornece dados de reino atual, membros, convites, transações compartilhadas e permissões.
 * Implementa listeners em tempo real do Firestore para sincronização entre usuários.
 * Suporta funcionalidades de colaboração financeira em modo reino vs modo herói individual.
 */
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db, auth } from '@/services/firebase';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import {
  Kingdom,
  KingdomRole,
  Transaction,
  Asset,
  ActivityLog,
  ContributionPlanning,
  CategoryEntity,
  BudgetEntity,
  AccountPayable,
  AccountReceivable,
  CreditCardInvoice,
  BudgetProgress
} from '@/types';
import { getCollectionByKingdom, parseDate, handleFirestoreError, OperationType, cleanObject } from '@/services/firebaseUtils';
import { kingdomService } from '@/services/kingdomService';
import { financialEngine } from '@/lib/financialEngine';
import { useTheme } from '@/lib/ThemeContext';
import { 
  calculateXPFromInvestments, 
  calculateTotalXPFromAssets, 
  calculatePlayerLevel,
  calculateKingdomLevel,
  calculateXPFromAction,
  addXP
} from '@/lib/gameEngine';
import { logActivity } from '@/lib/auditLogger';

interface KingdomContextType {
  kingdoms: Kingdom[];
  selectKingdom: (kingdomId: string) => void;
  kingdom: Kingdom | null;
  kingdomId: string | null;
  role: KingdomRole | null;
  memberId: string | null;
  loading: boolean;

  // Data
  transactions: Transaction[];
  assets: Asset[];
  activityLogs: ActivityLog[];
  contributionPlanning: ContributionPlanning | null;
  categories: CategoryEntity[];
  budgets: BudgetEntity[];
  payables: AccountPayable[];
  receivables: AccountReceivable[];
  creditCards: any[];
  creditCardInvoices: CreditCardInvoice[];

  // Computed
  getBudgetProgress: (month: number, year: number) => BudgetProgress[];

  // Actions
  addTransaction: (data: Partial<Transaction>) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  addInvestment: (data: any) => Promise<void>;
  updateInvestment: (id: string, data: any) => Promise<void>;
  deleteInvestment: (ids: string | string[]) => Promise<void>;

  addEarning: (data: any) => Promise<void>;

  saveBudget: (category_id: string, amount: number, month?: number, year?: number) => Promise<void>;

  addCategory: (category: any) => Promise<void>;
  updateCategory: (id: string, category: any) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  addPayable: (payable: any) => Promise<void>;
  updatePayable: (id: string, payable: any) => Promise<void>;
  payPayable: (id: string, paidAt: string) => Promise<void>;
  deletePayable: (id: string) => Promise<void>;

  addReceivable: (receivable: any) => Promise<void>;
  updateReceivable: (id: string, receivable: any) => Promise<void>;
  receiveReceivable: (id: string, receivedAt: string) => Promise<void>;
  deleteReceivable: (id: string) => Promise<void>;

  addCreditCard: (card: any) => Promise<void>;
  updateCreditCard: (id: string, card: any) => Promise<void>;
  deleteCreditCard: (id: string) => Promise<void>;

  addCreditCardInvoice: (invoice: any) => Promise<void>;
  updateCreditCardInvoice: (id: string, invoice: any) => Promise<void>;
  payCreditCardInvoice: (id: string, paidAt: string) => Promise<void>;
  deleteCreditCardInvoice: (id: string) => Promise<void>;

  members: any[];
  userInvites: any[];
  kingdomInvites: any[];

  // XP & Levels
  kingdomLevel: number;
  kingdomXP: number;
  heroLevel: number;
  heroXP: number;

  updateContributionPlanning: (percentages: any) => Promise<void>;
  joinKingdomByCode: (code: string) => Promise<void>;
}

const KingdomContext = createContext<KingdomContextType | undefined>(undefined);

export function KingdomProvider({ children }: { children: ReactNode }) {
  const [kingdoms, setKingdoms] = useState<Kingdom[]>([]);
  const [kingdom, setKingdom] = useState<Kingdom | null>(null);
  const [role, setRole] = useState<KingdomRole | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [kingdomId, setKingdomId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selected_kingdom_id');
    }
    return null;
  });

  const selectKingdom = (id: string) => {
    setKingdomId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selected_kingdom_id', id);
    }
  };
  const { gameMode } = useTheme();

  // Data states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [contributionPlanning, setContributionPlanning] = useState<ContributionPlanning | null>(null);
  const [categories, setCategories] = useState<CategoryEntity[]>([]);
  const [budgets, setBudgets] = useState<BudgetEntity[]>([]);
  const [payables, setPayables] = useState<AccountPayable[]>([]);
  const [receivables, setReceivables] = useState<AccountReceivable[]>([]);
  const [creditCards, setCreditCards] = useState<any[]>([]);
  const [creditCardInvoices, setCreditCardInvoices] = useState<CreditCardInvoice[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [userInvites, setUserInvites] = useState<any[]>([]);
  const [kingdomInvites, setKingdomInvites] = useState<any[]>([]);

  // XP & Levels
  const [kingdomXP, setKingdomXP] = useState(0);
  const [kingdomLevel, setKingdomLevel] = useState(1);
  const [heroXP, setHeroXP] = useState(0);
  const [heroLevel, setHeroLevel] = useState(1);

  const { gameState, user } = useTheme();

  useEffect(() => {
    if (!assets || !transactions) return;

    // Kingdom XP: Global de todos os registros do reino (Apenas para exibição local)
    const kTransactionsXP = transactions.reduce((acc, t) => acc + calculateXPFromAction(Number(t.amount || 0)), 0);
    const kPayablesXP = payables.reduce((acc, p) => acc + calculateXPFromAction(Number(p.amount || 0)), 0);
    const kReceivablesXP = receivables.reduce((acc, r) => acc + calculateXPFromAction(Number(r.amount || 0)), 0);
    const kInvestmentXP = calculateTotalXPFromAssets(assets);
    
    const kXP = kTransactionsXP + kPayablesXP + kReceivablesXP + kInvestmentXP;
    const kState = calculateKingdomLevel(kXP);
    setKingdomXP(kXP);
    setKingdomLevel(kState.level);

    // Hero XP: Sincronizado via ThemeContext/gameState
    // Não recalculamos e sobrescrevemos mais o Firestore aqui para evitar loops e flickering.
    if (gameState) {
      setHeroXP(gameState.xp);
      setHeroLevel(gameState.level);
    }
  }, [assets, transactions, payables, receivables, gameState, user]);

  useEffect(() => {
    let unsubscribes: (() => void)[] = [];
    let isCancelled = false;

    const loadKingdomData = async () => {
      if (!user) {
        setKingdom(null);
        setRole(null);
        setMemberId(null);
        setTransactions([]);
        setAssets([]);
        setActivityLogs([]);
        setContributionPlanning(null);
        setCategories([]);
        setBudgets([]);
        setPayables([]);
        setReceivables([]);
        setCreditCards([]);
        setCreditCardInvoices([]);
        setMembers([]);
        setUserInvites([]);
        setKingdomInvites([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const kingdoms = await kingdomService.getUserKingdoms(user.uid);
        if (isCancelled) return;
        setKingdoms(kingdoms);

        let currentKingdom = kingdoms.find(k => k.id === kingdomId) || kingdoms[0];

        if (!currentKingdom) {
          currentKingdom = await kingdomService.createKingdom(
            `Reino de ${user.displayName || 'Herói'}`,
            user.uid
          );
        }

        if (isCancelled) return;
        setKingdom(currentKingdom);

        // Member listener
        const memberQuery = query(
          collection(db, 'kingdom_members'),
          where('kingdom_id', '==', currentKingdom.id),
          where('user_id', '==', user.uid)
        );

        const unsubscribeMember = onSnapshot(memberQuery, (snap) => {
          if (isCancelled) return;
          if (!snap.empty) {
            setRole(snap.docs[0].data().role);
            setMemberId(snap.docs[0].id);
          }
        });
        unsubscribes.push(unsubscribeMember);

        // Setup all other listeners
        const kId = currentKingdom.id;

        const unsubAssets = onSnapshot(getCollectionByKingdom('investments', kId), (snap) => {
          if (isCancelled) return;
          setAssets(snap.docs.map(d => ({ id: d.id, ...d.data() } as Asset)));
        });

        const unsubTransactions = onSnapshot(query(getCollectionByKingdom('transactions', kId), orderBy('created_at', 'desc')), (snap) => {
          if (isCancelled) return;
          setTransactions(snap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            date: parseDate(d.data().date),
            created_at: parseDate(d.data().created_at)
          } as unknown as Transaction)));
        });

        const unsubLogs = onSnapshot(query(getCollectionByKingdom('activity_logs', kId), orderBy('created_at', 'desc')), (snap) => {
          if (isCancelled) return;
          setActivityLogs(snap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            created_at: parseDate(d.data().created_at)
          } as unknown as ActivityLog)));
        });

        const unsubPlanning = onSnapshot(getCollectionByKingdom('contribution_planning', kId), (snap) => {
          if (isCancelled) return;
          if (!snap.empty) setContributionPlanning(snap.docs[0].data() as ContributionPlanning);
          else setContributionPlanning(null);
        });

        const unsubCategories = onSnapshot(getCollectionByKingdom('categories', kId), (snap) => {
          if (isCancelled) return;
          setCategories(snap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            created_at: d.data().created_at?.toDate?.() || new Date()
          } as CategoryEntity)));
        });

        const unsubBudgets = onSnapshot(getCollectionByKingdom('budgets', kId), (snap) => {
          if (isCancelled) return;
          setBudgets(snap.docs.map(d => ({ id: d.id, ...d.data() } as BudgetEntity)));
        });

        const unsubPayables = onSnapshot(getCollectionByKingdom('accounts_payable', kId), (snap) => {
          if (isCancelled) return;
          setPayables(snap.docs.map(d => ({ id: d.id, ...d.data() } as AccountPayable)));
        });

        const unsubReceivables = onSnapshot(getCollectionByKingdom('accounts_receivable', kId), (snap) => {
          if (isCancelled) return;
          setReceivables(snap.docs.map(d => ({ id: d.id, ...d.data() } as AccountReceivable)));
        });

        const unsubCreditCards = onSnapshot(getCollectionByKingdom('credit_cards', kId), (snap) => {
          if (isCancelled) return;
          setCreditCards(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubCreditCardInvoices = onSnapshot(getCollectionByKingdom('credit_card_invoices', kId), (snap) => {
          if (isCancelled) return;
          setCreditCardInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() } as CreditCardInvoice)));
        });

        const unsubMembers = onSnapshot(query(collection(db, 'kingdom_members'), where('kingdom_id', '==', kId)), (snap) => {
          if (isCancelled) return;
          setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubUserInvites = onSnapshot(query(collection(db, 'kingdom_invites'), where('email', '==', user.email), where('status', '==', 'pending')), (snap) => {
          if (isCancelled) return;
          setUserInvites(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubKingdomInvites = onSnapshot(query(collection(db, 'kingdom_invites'), where('kingdom_id', '==', kId)), (snap) => {
          if (isCancelled) return;
          setKingdomInvites(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        unsubscribes.push(
          unsubAssets, unsubTransactions, unsubLogs, unsubPlanning,
          unsubCategories, unsubBudgets, unsubPayables, unsubReceivables,
          unsubCreditCards, unsubCreditCardInvoices, unsubMembers, unsubUserInvites, unsubKingdomInvites
        );

      } catch (err) {
        if (!isCancelled) console.error(err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    loadKingdomData();

    return () => {
      isCancelled = true;
      unsubscribes.forEach(u => u && u());
    };
  }, [user]);

  // Actions
  const addTransaction = async (data: Partial<Transaction>) => {
    if (!auth.currentUser || !kingdom) return;
    const id = doc(collection(db, 'transactions')).id;
    const categoryName = categories.find(c => c.id === data.category_id)?.name || 'Categoria';
    const payload = cleanObject({
      id,
      user_id: auth.currentUser.uid,
      userName: auth.currentUser.displayName || 'Usuário',
      amount: data.amount,
      type: data.type,
      description: data.description,
      category_id: data.category_id,
      categoryName,
      date: new Date(data.date!),
      created_at: new Date(),
      kingdom_id: kingdom.id,
      created_by: auth.currentUser.uid,
      status: 'concluído'
    });
    await setDoc(doc(db, 'transactions', id), payload);
    await addXP(auth.currentUser.uid, calculateXPFromAction(Number(data.amount || 0)));
    await logActivity(kingdom.id, auth.currentUser.uid, 'CREATE_TRANSACTION', id);
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    if (!auth.currentUser || !kingdom) return;
    const updateData: any = cleanObject({ ...data });
    if (data.date) updateData.date = new Date(data.date);
    await updateDoc(doc(db, 'transactions', id), updateData);
    await logActivity(kingdom.id, auth.currentUser.uid, 'UPDATE_TRANSACTION', id);
  };

  const deleteTransaction = async (id: string) => {
    if (!auth.currentUser || !kingdom) return;
    await deleteDoc(doc(db, 'transactions', id));
  };

  const addInvestment = async (data: any) => {
    if (!auth.currentUser || !kingdom) return;
    const batch = writeBatch(db);
    const invId = doc(collection(db, 'investments')).id;
    const txId = doc(collection(db, 'transactions')).id;

    // Calcular investimento total = valor total informado
    const totalInvestedAmount = Number(data.value);
    // Calcular preço unitário = valor total / quantidade
    const unitPrice = Math.abs(Number(data.quantity)) > 0 ? totalInvestedAmount / Number(data.quantity) : 0;

    const isSale = totalInvestedAmount < 0;

    batch.set(doc(db, 'investments', invId), cleanObject({
      id: invId,
      ticker: data.ticker,
      quantity: data.quantity,
      price: unitPrice, // preço unitário calculado
      invested_value: totalInvestedAmount, // valor total investido
      type: data.type,
      faceroType: determineFaceroType(data.type),
      created_at: new Date(),
      kingdom_id: kingdom.id,
      created_by: auth.currentUser.uid,
      transaction_id: txId
    }));

    batch.set(doc(db, 'transactions', txId), cleanObject({
      id: txId,
      type: 'investment',
      amount: -totalInvestedAmount, // Invert sign: Buy is negative, Sale is positive
      category_id: 'investimentos',
      description: isSale ? `Venda de ${data.ticker}` : `Aporte em ${data.ticker}`,
      ticker: data.ticker,
      quantity: data.quantity,
      investment_category_id: data.investment_category_id,
      source: 'investimento',
      date: new Date(data.date),
      created_at: new Date(),
      user_id: auth.currentUser.uid,
      userName: auth.currentUser.displayName || 'Usuário',
      kingdom_id: kingdom.id,
      created_by: auth.currentUser.uid
    }));
    try {
      await batch.commit();
      await addXP(auth.currentUser.uid, calculateXPFromInvestments(totalInvestedAmount, Number(data.quantity || 0)));
      await logActivity(kingdom.id, auth.currentUser.uid, 'CREATE_INVESTMENT', invId);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'investments/transactions');
    }
  };

  const updateInvestment = async (id: string, data: any) => {
    if (!auth.currentUser || !kingdom) return;
    
    try {
      const updateData: any = cleanObject({ ...data });
      if (data.type) updateData.faceroType = determineFaceroType(data.type);
      
      if (data.value !== undefined && data.quantity !== undefined) {
        const totalInvestedAmount = Number(data.value);
        const unitPrice = Number(data.quantity) !== 0 ? totalInvestedAmount / Number(data.quantity) : 0;
        updateData.invested_value = totalInvestedAmount;
        updateData.price = unitPrice;
        delete updateData.value;
      }
      
      await updateDoc(doc(db, 'investments', id), {
        ...updateData,
        updated_at: new Date()
      });
      
      await logActivity(kingdom.id, auth.currentUser.uid, 'UPDATE_INVESTMENT', id);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `investments/${id}`);
    }
  };

  // Migração de dados legados: garante que todos os investimentos tenham invested_value
  const migrateInvestmentData = async (assetsData: Asset[], kingdomId: string) => {
    if (!auth.currentUser) return;

    const batch = writeBatch(db);
    let hasUpdates = false;

    for (const asset of assetsData) {
      if (!asset.id) continue;

      // Se não tem invested_value, precisa calcular
      if (!asset.invested_value || asset.invested_value === 0) {
        let calculatedValue = 0;

        // Tentar calcular invested_value baseado nos campos disponíveis
        if (asset.price && asset.quantity) {
          calculatedValue = Number(asset.price) * Number(asset.quantity);
        } else if (asset.value && asset.quantity) {
          calculatedValue = Number(asset.value) * Number(asset.quantity);
        } else if (asset.value) {
          // Fallback: usar value como is (pode ser total ou unitário)
          calculatedValue = Number(asset.value);
        }

        // Atualizar só se conseguir calcular um valor válido
        if (calculatedValue > 0) {
          batch.update(doc(db, 'investments', asset.id), {
            invested_value: calculatedValue
          });
          hasUpdates = true;
        }
      }
    }

    // Executar atualizações em batch apenas se houver mudanças
    if (hasUpdates && auth.currentUser.uid) {
      try {
        await batch.commit();
        console.log('✅ Migração de investimentos concluída');
      } catch (error) {
        console.error('Erro ao migrar dados de investimentos:', error);
      }
    }
  };

  const determineFaceroType = (investmentType: string): string => {
    const typeMap: Record<string, string> = {
      'fii': 'F',
      'stock': 'A',
      'crypto': 'C',
      'etf': 'E',
      'fixed_income': 'R',
      'other': 'O'
    };
    return typeMap[investmentType] || 'O';
  };

  const deleteInvestment = async (ids: string | string[]) => {
    if (!auth.currentUser || !kingdom) return;
    const idsArray = Array.isArray(ids) ? ids : [ids];
    const batch = writeBatch(db);
    
    try {
      for (const id of idsArray) {
        const invDoc = await getDoc(doc(db, 'investments', id));
        if (invDoc.exists()) {
          const invData = invDoc.data();
          batch.delete(doc(db, 'investments', id));
          if (invData.transaction_id) batch.delete(doc(db, 'transactions', invData.transaction_id));
        }
      }
      await batch.commit();
      await logActivity(kingdom.id, auth.currentUser.uid, 'DELETE_INVESTMENT', idsArray.join(', '));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'investments');
    }
  };

  const addEarning = async (data: any) => {
    if (!auth.currentUser || !kingdom) return;
    const id = doc(collection(db, 'transactions')).id;
    await setDoc(doc(db, 'transactions', id), cleanObject({
      id,
      type: 'earning',
      amount: data.amount,
      category_id: 'earning',
      description: `Provento de ${data.ticker} (${data.type})`,
      date: new Date(data.date),
      created_at: new Date(),
      user_id: auth.currentUser.uid,
      kingdom_id: kingdom.id
    }));
    await addXP(auth.currentUser.uid, calculateXPFromAction(Number(data.amount || 0)));
    await logActivity(kingdom.id, auth.currentUser.uid, 'CREATE_EARNING', id);
  };

  const saveBudget = async (category_id: string, amount: number, month?: number, year?: number) => {
    if (!auth.currentUser || !kingdom) return;
    
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();
    const monthStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
    
    const existingBudget = budgets.find(b => b.category_id === category_id && (b.mês === monthStr || b.month === monthStr));
    const budgetId = existingBudget ? existingBudget.id : `${kingdom.id}_${category_id}_${monthStr}`;
    
    await setDoc(doc(db, 'budgets', budgetId), cleanObject({
      id: budgetId,
      user_id: auth.currentUser.uid,
      category_id,
      budget_amount: amount,
      mês: monthStr,
      month: monthStr,
      kingdom_id: kingdom.id,
      created_by: auth.currentUser.uid,
      created_at: existingBudget?.created_at || new Date(),
      updated_at: new Date()
    }), { merge: true });
  };

  const addCategory = async (category: any) => {
    if (!auth.currentUser || !kingdom) return;
    const newId = doc(collection(db, 'categories')).id;
    await setDoc(doc(db, 'categories', newId), cleanObject({
      ...category,
      id: newId,
      user_id: auth.currentUser.uid,
      created_at: new Date(),
      kingdom_id: kingdom.id,
      created_by: auth.currentUser.uid
    }));
    await logActivity(kingdom.id, auth.currentUser.uid, 'CREATE_CATEGORY', newId, { name: category.name });
  };

  const updateCategory = async (id: string, category: any) => {
    await updateDoc(doc(db, 'categories', id), { ...category, updated_at: new Date() });
  };

  const deleteCategory = async (id: string) => {
    if (!auth.currentUser || !kingdom) return;
    await deleteDoc(doc(db, 'categories', id));
    await logActivity(kingdom.id, auth.currentUser.uid, 'DELETE_CATEGORY', id);
  };

  const addPayable = async (payable: any) => {
    if (!auth.currentUser || !kingdom) return;
    
    const categoryName = categories.find(c => c.id === payable.category_id)?.name || 'Categoria';
    const validStatus = ['pendente', 'pago', 'atrasado'].includes(payable.status) ? payable.status : 'pendente';
    const rawDueDate = payable.due_date || payable.dueDate || new Date().toISOString();
    
    if (payable.isRecurring && payable.dataFim) {
      const startDate = new Date(rawDueDate);
      const endDate = new Date(payable.dataFim);
      const recurrenceRule = payable.recurrenceRule || 'monthly';
      
      let currentDate = new Date(startDate);
      let count = 0;
      
      while (currentDate <= endDate && count < 120) { // Safety limit of 10 years
        const newId = doc(collection(db, 'accounts_payable')).id;
        const dueDateStr = currentDate.toISOString().split('T')[0];
        
        const newPayable = cleanObject({
          ...payable,
          isRecurring: false, // Pre-generated instances should not be picked up by the dynamic engine
          status: validStatus,
          id: newId,
          due_date: dueDateStr,
          dueDate: dueDateStr,
          userId: auth.currentUser.uid,
          userName: auth.currentUser.displayName || 'Usuário',
          categoryName,
          createdAt: new Date().toISOString(),
          kingdom_id: kingdom.id,
          created_by: auth.currentUser.uid
        });
        
        await setDoc(doc(db, 'accounts_payable', newId), newPayable);
        await logActivity(kingdom.id, auth.currentUser.uid, 'CREATE_TRANSACTION', newId, { type: 'payable', amount: payable.amount });
        
        // Increment date based on recurrence rule
        if (recurrenceRule === 'weekly') {
          currentDate.setDate(currentDate.getDate() + 7);
        } else if (recurrenceRule === 'monthly') {
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else if (recurrenceRule === 'quarterly') {
          currentDate.setMonth(currentDate.getMonth() + 3);
        } else if (recurrenceRule === 'yearly') {
          currentDate.setFullYear(currentDate.getFullYear() + 1);
        } else {
          break;
        }
        count++;
      }
    } else {
      const installments = payable.installments && payable.installments > 1 ? payable.installments : 1;
      const baseAmount = payable.amount / installments;

      for (let i = 0; i < installments; i++) {
        const newId = doc(collection(db, 'accounts_payable')).id;
        let dueDate = new Date(rawDueDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        const dueDateStr = dueDate.toISOString().split('T')[0];
        const newPayable = cleanObject({
          ...payable,
          isRecurring: installments > 1 ? false : payable.isRecurring, // Only set to false if it's a pre-generated installment
          status: validStatus,
          id: newId,
          amount: baseAmount,
          due_date: dueDateStr,
          dueDate: dueDateStr,
          installments: installments,
          currentInstallment: i + 1,
          userId: auth.currentUser.uid,
          userName: auth.currentUser.displayName || 'Usuário',
          categoryName,
          createdAt: new Date().toISOString(),
          kingdom_id: kingdom.id,
          created_by: auth.currentUser.uid
        });
        await setDoc(doc(db, 'accounts_payable', newId), newPayable);
        await logActivity(kingdom.id, auth.currentUser.uid, 'CREATE_TRANSACTION', newId, { type: 'payable', amount: baseAmount });
      }
    }
  };

  const updatePayable = async (id: string, payable: any) => {
    if (!auth.currentUser || !kingdom) return;
    
    // Garantir status válido se estiver sendo atualizado
    const updateData = cleanObject({ ...payable });
    if (updateData.status && !['pendente', 'pago', 'atrasado'].includes(updateData.status)) {
      updateData.status = 'pendente';
    }

    await setDoc(doc(db, 'accounts_payable', id), updateData, { merge: true });
    await logActivity(kingdom.id, auth.currentUser.uid, 'UPDATE_TRANSACTION', id, { type: 'payable' });
  };

  const payPayable = async (id: string, paidAt: string) => {
    if (!auth.currentUser || !kingdom) return;
    const payable = payables.find(p => p.id === id);
    await updateDoc(doc(db, 'accounts_payable', id), { status: 'pago', paidAt });
    if (payable) {
      await addXP(auth.currentUser.uid, calculateXPFromAction(Number(payable.amount || 0)));
    }
    await logActivity(kingdom.id, auth.currentUser.uid, 'UPDATE_TRANSACTION', id, { type: 'payable', status: 'paid' });
  };

  const deletePayable = async (id: string) => {
    if (!auth.currentUser || !kingdom) return;
    await deleteDoc(doc(db, 'accounts_payable', id));
    await logActivity(kingdom.id, auth.currentUser.uid, 'DELETE_TRANSACTION', id, { type: 'payable' });
  };

  const addReceivable = async (receivable: any) => {
    if (!auth.currentUser || !kingdom) return;
    
    const categoryName = categories.find(c => c.id === receivable.category_id)?.name || 'Categoria';
    const validStatus = ['pendente', 'recebido', 'atrasado', 'inadimplente'].includes(receivable.status) ? receivable.status : 'pendente';
    const rawDueDate = receivable.dueDate || receivable.due_date || new Date().toISOString().split('T')[0];

    if (receivable.isRecurring && receivable.dataFim) {
      const startDate = new Date(rawDueDate);
      const endDate = new Date(receivable.dataFim);
      const recurrenceRule = receivable.recurrenceRule || 'monthly';
      
      let currentDate = new Date(startDate);
      let count = 0;
      
      while (currentDate <= endDate && count < 120) {
        const newId = doc(collection(db, 'accounts_receivable')).id;
        const dueDateStr = currentDate.toISOString().split('T')[0];
        
        const newReceivable = cleanObject({
          ...receivable,
          isRecurring: false, // Pre-generated instances should not be picked up by the dynamic engine
          status: validStatus,
          dueDate: dueDateStr,
          due_date: dueDateStr,
          id: newId,
          userId: auth.currentUser.uid,
          userName: auth.currentUser.displayName || 'Usuário',
          categoryName,
          createdAt: new Date().toISOString(),
          kingdom_id: kingdom.id,
          created_by: auth.currentUser.uid
        });
        
        await setDoc(doc(db, 'accounts_receivable', newId), newReceivable);
        await logActivity(kingdom.id, auth.currentUser.uid, 'CREATE_TRANSACTION', newId, { type: 'receivable', amount: receivable.amount });
        
        if (recurrenceRule === 'weekly') {
          currentDate.setDate(currentDate.getDate() + 7);
        } else if (recurrenceRule === 'monthly') {
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else if (recurrenceRule === 'quarterly') {
          currentDate.setMonth(currentDate.getMonth() + 3);
        } else if (recurrenceRule === 'yearly') {
          currentDate.setFullYear(currentDate.getFullYear() + 1);
        } else {
          break;
        }
        count++;
      }
    } else {
      const newId = doc(collection(db, 'accounts_receivable')).id;
      const newReceivable = cleanObject({
        ...receivable,
        status: validStatus,
        dueDate: rawDueDate,
        due_date: rawDueDate,
        id: newId,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Usuário',
        categoryName,
        createdAt: new Date().toISOString(),
        kingdom_id: kingdom.id,
        created_by: auth.currentUser.uid
      });
      await setDoc(doc(db, 'accounts_receivable', newId), newReceivable);
      await logActivity(kingdom.id, auth.currentUser.uid, 'CREATE_TRANSACTION', newId, { type: 'receivable' });
    }
  };

  const updateReceivable = async (id: string, receivable: any) => {
    if (!auth.currentUser || !kingdom) return;
    
    // Garantir status válido se estiver sendo atualizado
    const updateData = cleanObject({ ...receivable });
    if (updateData.status && !['pendente', 'recebido', 'atrasado', 'inadimplente'].includes(updateData.status)) {
      updateData.status = 'pendente';
    }

    await setDoc(doc(db, 'accounts_receivable', id), updateData, { merge: true });
    await logActivity(kingdom.id, auth.currentUser.uid, 'UPDATE_TRANSACTION', id, { type: 'receivable' });
  };

  const receiveReceivable = async (id: string, receivedAt: string) => {
    if (!auth.currentUser || !kingdom) return;
    const receivable = receivables.find(r => r.id === id);
    await updateDoc(doc(db, 'accounts_receivable', id), { status: 'recebido', receivedAt });
    if (receivable) {
      await addXP(auth.currentUser.uid, calculateXPFromAction(Number(receivable.amount || 0)));
    }
    await logActivity(kingdom.id, auth.currentUser.uid, 'UPDATE_TRANSACTION', id, { type: 'receivable', status: 'received' });
  };

  const deleteReceivable = async (id: string) => {
    if (!auth.currentUser || !kingdom) return;
    await deleteDoc(doc(db, 'accounts_receivable', id));
    await logActivity(kingdom.id, auth.currentUser.uid, 'DELETE_TRANSACTION', id, { type: 'receivable' });
  };

  const addCreditCard = async (card: any) => {
    if (!auth.currentUser || !kingdom) return;
    const newId = doc(collection(db, 'credit_cards')).id;
    const newCard = cleanObject({
      ...card,
      id: newId,
      userId: auth.currentUser.uid,
      kingdom_id: kingdom.id,
      created_by: auth.currentUser.uid,
      created_at: new Date()
    });
    await setDoc(doc(db, 'credit_cards', newId), newCard);
    await logActivity(kingdom.id, auth.currentUser.uid, 'CREATE_TRANSACTION', newId, { type: 'credit_card', name: card.name });
  };

  const updateCreditCard = async (id: string, card: any) => {
    if (!auth.currentUser || !kingdom) return;
    await setDoc(doc(db, 'credit_cards', id), cleanObject(card), { merge: true });
    await logActivity(kingdom.id, auth.currentUser.uid, 'UPDATE_TRANSACTION', id, { type: 'credit_card', updates: card });
  };

  const deleteCreditCard = async (id: string) => {
    if (!auth.currentUser || !kingdom) return;
    await deleteDoc(doc(db, 'credit_cards', id));
    await logActivity(kingdom.id, auth.currentUser.uid, 'DELETE_TRANSACTION', id, { type: 'credit_card' });
  };

  const addCreditCardInvoice = async (invoice: any) => {
    if (!auth.currentUser || !kingdom) return;
    const newId = doc(collection(db, 'credit_card_invoices')).id;
    const newInvoice = cleanObject({
      ...invoice,
      id: newId,
      userId: auth.currentUser.uid,
      createdAt: new Date().toISOString(),
      kingdom_id: kingdom.id,
      created_by: auth.currentUser.uid
    });
    await setDoc(doc(db, 'credit_card_invoices', newId), newInvoice);
    await logActivity(kingdom.id, auth.currentUser.uid, 'CREATE_TRANSACTION', newId, { type: 'credit_card_invoice', amount: invoice.total_amount });
  };

  const updateCreditCardInvoice = async (id: string, invoice: any) => {
    if (!auth.currentUser || !kingdom) return;
    await setDoc(doc(db, 'credit_card_invoices', id), cleanObject(invoice), { merge: true });
    await logActivity(kingdom.id, auth.currentUser.uid, 'UPDATE_TRANSACTION', id, { type: 'credit_card_invoice', updates: invoice });
  };

  const payCreditCardInvoice = async (id: string, paidAt: string) => {
    if (!auth.currentUser || !kingdom) return;
    const docRef = doc(db, 'credit_card_invoices', id);
    let amount = 0;
    await runTransaction(db, async (transaction: any) => {
      const docSnap = await transaction.get(docRef);
      if (!docSnap.exists()) throw new Error('Fatura não encontrada.');
      const data = docSnap.data();
      if (data?.status === 'paid') throw new Error('Esta fatura já foi paga.');
      amount = Number(data?.total_amount || 0);
      transaction.update(docRef, { status: 'paid', paidAt });
    });
    await addXP(auth.currentUser.uid, calculateXPFromAction(amount));
    await logActivity(kingdom.id, auth.currentUser.uid, 'UPDATE_TRANSACTION', id, { type: 'credit_card_invoice', status: 'paid' });
  };

  const deleteCreditCardInvoice = async (id: string) => {
    if (!auth.currentUser || !kingdom) return;
    await deleteDoc(doc(db, 'credit_card_invoices', id));
    await logActivity(kingdom.id, auth.currentUser.uid, 'DELETE_TRANSACTION', id, { type: 'credit_card_invoice' });
  };

  const updateContributionPlanning = async (percentages: any) => {
    if (!auth.currentUser || !kingdom) return;
    const planningRef = contributionPlanning ? doc(db, 'contribution_planning', contributionPlanning.id) : doc(collection(db, 'contribution_planning'));
    await setDoc(planningRef, { 
      id: planningRef.id, 
      kingdom_id: kingdom.id, 
      percentages,
      created_at: contributionPlanning?.created_at || new Date(),
      updated_at: new Date()
    });
    await logActivity(kingdom.id, auth.currentUser.uid, 'UPDATE_CONTRIBUTION_PLANNING', planningRef.id);
  };

  const joinKingdomByCode = async (code: string) => {
    if (!auth.currentUser) return;
    const kingdom = await kingdomService.getKingdomByInviteCode(code);
    if (!kingdom) throw new Error('Invalid code');
    await kingdomService.addMember(kingdom.id, auth.currentUser.uid, 'member');
  };

  const getBudgetProgress = (month: number, year: number) => {
    const profileType = gameMode === 'reino' ? 'MultiUsuario' : 'MonoUsuario';
    const filteredCategories = categories.filter(c => !c.allowed_profiles || c.allowed_profiles.includes(profileType));
    return financialEngine.calculateBudgetProgressData(
      month, year, filteredCategories, budgets, transactions, payables, receivables, creditCardInvoices
    );
  };

  const contextValue = {
    kingdoms,
    selectKingdom,
    kingdom,
    kingdomId: kingdom?.id || null,
    role,
    memberId,
    loading,
    transactions,
    assets,
    activityLogs,
    contributionPlanning,
    categories,
    budgets,
    payables,
    receivables,
    creditCards,
    creditCardInvoices,
    getBudgetProgress,
    kingdomLevel,
    kingdomXP,
    heroLevel,
    heroXP,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    addEarning,
    saveBudget,
    addCategory,
    updateCategory,
    deleteCategory,
    addPayable,
    updatePayable,
    payPayable,
    deletePayable,
    addReceivable,
    updateReceivable,
    receiveReceivable,
    deleteReceivable,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    addCreditCardInvoice,
    updateCreditCardInvoice,
    payCreditCardInvoice,
    deleteCreditCardInvoice,
    members,
    userInvites,
    kingdomInvites,
    updateContributionPlanning,
    joinKingdomByCode
  };

  return (
    <KingdomContext.Provider value={contextValue}>
      {children}
    </KingdomContext.Provider>
  );
}

export function useKingdomData() {
  const context = useContext(KingdomContext);
  if (context === undefined) {
    throw new Error('useKingdomData must be used within a KingdomProvider');
  }
  return context;
}
