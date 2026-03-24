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
import { getCollectionByKingdom, parseDate, handleFirestoreError, OperationType } from '@/services/firebaseUtils';
import { kingdomService } from '@/services/kingdomService';
import { financialEngine } from '@/lib/financialEngine';
import { useTheme } from '@/lib/ThemeContext';
import { calculateXPFromInvestments, calculateTotalXPFromAssets, calculatePlayerLevel } from '@/lib/gameEngine';
import { logActivity } from '@/lib/auditLogger';

interface KingdomContextType {
  kingdom: Kingdom | null;
  kingdomId: string | null; // Added
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

  saveBudget: (category_id: string, amount: number) => Promise<void>;

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
  const [kingdom, setKingdom] = useState<Kingdom | null>(null);
  const [role, setRole] = useState<KingdomRole | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
    if (!assets) return;

    // Kingdom XP: Global de todos os registros do reino
    const kTransactionsXP = transactions.reduce((acc, t) => acc + 10 + Math.floor(Number(t.amount || 0) / 10), 0);
    const kPayablesXP = payables.reduce((acc, p) => acc + 10 + Math.floor(Number(p.amount || 0) / 10), 0);
    const kReceivablesXP = receivables.reduce((acc, r) => acc + 10 + Math.floor(Number(r.amount || 0) / 10), 0);
    const kInvestmentXP = calculateTotalXPFromAssets(assets);
    
    const kXP = kTransactionsXP + kPayablesXP + kReceivablesXP + kInvestmentXP;
    const kState = calculatePlayerLevel(kXP);
    setKingdomXP(kXP);
    setKingdomLevel(kState.level);

    // Hero XP: Apenas do usuário logado
    const myAssets = assets.filter(a => a.user_id === user?.uid || a.userId === user?.uid || a.created_by === user?.uid);
    const myInvestmentXP = calculateTotalXPFromAssets(myAssets);
    
    const myTransactions = transactions.filter(t => t.user_id === user?.uid || t.created_by === user?.uid);
    const myPayables = payables.filter(p => p.userId === user?.uid || p.created_by === user?.uid);
    const myReceivables = receivables.filter(r => r.userId === user?.uid || r.created_by === user?.uid);

    // 10 XP por cada registro + 1 XP a cada R$ 10
    const myTransactionsXP = myTransactions.reduce((acc, t) => acc + 10 + Math.floor(Number(t.amount || 0) / 10), 0);
    const myPayablesXP = myPayables.reduce((acc, p) => acc + 10 + Math.floor(Number(p.amount || 0) / 10), 0);
    const myReceivablesXP = myReceivables.reduce((acc, r) => acc + 10 + Math.floor(Number(r.amount || 0) / 10), 0);

    const baseXP = myTransactionsXP + myPayablesXP + myReceivablesXP;
    
    const totalHeroXP = baseXP + myInvestmentXP;
    const hState = calculatePlayerLevel(totalHeroXP);
    
    setHeroXP(totalHeroXP);
    setHeroLevel(hState.level);

    // Sincronizar com o banco de dados se houver diferença
    if (user && gameState.xp !== totalHeroXP) {
      const userRef = doc(db, 'users', user.uid);
      setDoc(userRef, {
        xp: totalHeroXP,
        level: hState.level,
        title: hState.title
      }, { merge: true }).catch(console.error);
    }
  }, [assets, transactions, payables, receivables, gameState.xp, user]);

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

        let currentKingdom = kingdoms[0];

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
    const payload = {
      id,
      user_id: auth.currentUser.uid,
      userName: auth.currentUser.displayName || 'Usuário',
      amount: data.amount,
      type: data.type,
      description: data.description,
      category_id: data.category_id,
      date: new Date(data.date!),
      created_at: new Date(),
      kingdom_id: kingdom.id,
      created_by: auth.currentUser.uid,
      status: 'concluído'
    };
    await setDoc(doc(db, 'transactions', id), payload);
    await logActivity(kingdom.id, auth.currentUser.uid, 'CREATE_TRANSACTION', id);
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    if (!auth.currentUser || !kingdom) return;
    const updateData: any = { ...data };
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
    const unitPrice = Number(data.quantity) > 0 ? totalInvestedAmount / Number(data.quantity) : 0;

    batch.set(doc(db, 'investments', invId), {
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
    });

    batch.set(doc(db, 'transactions', txId), {
      id: txId,
      type: 'investment',
      amount: totalInvestedAmount,
      category_id: 'investimentos',
      description: `Aporte em ${data.ticker}`,
      date: new Date(data.date),
      created_at: new Date(),
      user_id: auth.currentUser.uid,
      userName: auth.currentUser.displayName || 'Usuário',
      kingdom_id: kingdom.id,
      created_by: auth.currentUser.uid
    });
    try {
      await batch.commit();
      await logActivity(kingdom.id, auth.currentUser.uid, 'CREATE_INVESTMENT', invId);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'investments/transactions');
    }
  };

  const updateInvestment = async (id: string, data: any) => {
    if (!auth.currentUser || !kingdom) return;
    
    try {
      const updateData: any = { ...data };
      if (data.type) updateData.faceroType = determineFaceroType(data.type);
      
      // Remover campos undefined para evitar erro no Firestore
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
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
    await setDoc(doc(db, 'transactions', id), {
      id,
      type: 'earning',
      amount: data.amount,
      category_id: 'earning',
      description: `Provento de ${data.ticker} (${data.type})`,
      date: new Date(data.date),
      created_at: new Date(),
      user_id: auth.currentUser.uid,
      kingdom_id: kingdom.id
    });
    await logActivity(kingdom.id, auth.currentUser.uid, 'CREATE_EARNING', id);
  };

  const saveBudget = async (category_id: string, amount: number) => {
    if (!auth.currentUser || !kingdom) return;
    const existingBudget = budgets.find(b => b.category_id === category_id);
    const budgetId = existingBudget ? existingBudget.id : `${kingdom.id}_${category_id}`;
    await setDoc(doc(db, 'budgets', budgetId), {
      id: budgetId,
      user_id: auth.currentUser.uid,
      category_id,
      budget_amount: amount,
      kingdom_id: kingdom.id,
      created_by: auth.currentUser.uid,
      created_at: existingBudget?.created_at || new Date(),
      updated_at: new Date()
    }, { merge: true });
  };

  const addCategory = async (category: any) => {
    if (!auth.currentUser || !kingdom) return;
    const newId = doc(collection(db, 'categories')).id;
    await setDoc(doc(db, 'categories', newId), {
      ...category,
      id: newId,
      user_id: auth.currentUser.uid,
      created_at: new Date(),
      kingdom_id: kingdom.id,
      created_by: auth.currentUser.uid
    });
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
    const installments = payable.installments && payable.installments > 1 ? payable.installments : 1;
    const baseAmount = payable.amount / installments;
    
    // Garantir status válido
    const validStatus = ['pendente', 'pago', 'atrasado'].includes(payable.status) ? payable.status : 'pendente';

    for (let i = 0; i < installments; i++) {
      const newId = doc(collection(db, 'accounts_payable')).id;
      const rawDueDate = payable.due_date || payable.dueDate || new Date().toISOString();
      let dueDate = new Date(rawDueDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      const dueDateStr = dueDate.toISOString().split('T')[0];
      const newPayable = {
        ...payable,
        status: validStatus,
        id: newId,
        amount: baseAmount,
        due_date: dueDateStr,
        dueDate: dueDateStr,
        installments: installments,
        currentInstallment: i + 1,
        userId: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
        kingdom_id: kingdom.id,
        created_by: auth.currentUser.uid
      };
      await setDoc(doc(db, 'accounts_payable', newId), newPayable);
      await logActivity(kingdom.id, auth.currentUser.uid, 'CREATE_TRANSACTION', newId, { type: 'payable', amount: baseAmount });
    }
  };

  const updatePayable = async (id: string, payable: any) => {
    if (!auth.currentUser || !kingdom) return;
    
    // Garantir status válido se estiver sendo atualizado
    const updateData = { ...payable };
    if (updateData.status && !['pendente', 'pago', 'atrasado'].includes(updateData.status)) {
      updateData.status = 'pendente';
    }

    await setDoc(doc(db, 'accounts_payable', id), updateData, { merge: true });
    await logActivity(kingdom.id, auth.currentUser.uid, 'UPDATE_TRANSACTION', id, { type: 'payable' });
  };

  const payPayable = async (id: string, paidAt: string) => {
    if (!auth.currentUser || !kingdom) return;
    await updateDoc(doc(db, 'accounts_payable', id), { status: 'pago', paidAt });
    await logActivity(kingdom.id, auth.currentUser.uid, 'UPDATE_TRANSACTION', id, { type: 'payable', status: 'paid' });
  };

  const deletePayable = async (id: string) => {
    if (!auth.currentUser || !kingdom) return;
    await deleteDoc(doc(db, 'accounts_payable', id));
    await logActivity(kingdom.id, auth.currentUser.uid, 'DELETE_TRANSACTION', id, { type: 'payable' });
  };

  const addReceivable = async (receivable: any) => {
    if (!auth.currentUser || !kingdom) return;
    const newId = doc(collection(db, 'accounts_receivable')).id;
    
    // Garantir status válido e data
    const validStatus = ['pendente', 'recebido', 'atrasado', 'inadimplente'].includes(receivable.status) ? receivable.status : 'pendente';
    const dueDate = receivable.dueDate || receivable.due_date || new Date().toISOString().split('T')[0];

    const newReceivable = {
      ...receivable,
      status: validStatus,
      dueDate: dueDate,
      due_date: dueDate,
      id: newId,
      userId: auth.currentUser.uid,
      createdAt: new Date().toISOString(),
      kingdom_id: kingdom.id,
      created_by: auth.currentUser.uid
    };
    await setDoc(doc(db, 'accounts_receivable', newId), newReceivable);
    await logActivity(kingdom.id, auth.currentUser.uid, 'CREATE_TRANSACTION', newId, { type: 'receivable' });
  };

  const updateReceivable = async (id: string, receivable: any) => {
    if (!auth.currentUser || !kingdom) return;
    
    // Garantir status válido se estiver sendo atualizado
    const updateData = { ...receivable };
    if (updateData.status && !['pendente', 'recebido', 'atrasado', 'inadimplente'].includes(updateData.status)) {
      updateData.status = 'pendente';
    }

    await setDoc(doc(db, 'accounts_receivable', id), updateData, { merge: true });
    await logActivity(kingdom.id, auth.currentUser.uid, 'UPDATE_TRANSACTION', id, { type: 'receivable' });
  };

  const receiveReceivable = async (id: string, receivedAt: string) => {
    if (!auth.currentUser || !kingdom) return;
    await updateDoc(doc(db, 'accounts_receivable', id), { status: 'recebido', receivedAt });
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
    const newCard = {
      ...card,
      id: newId,
      userId: auth.currentUser.uid,
      kingdom_id: kingdom.id,
      created_by: auth.currentUser.uid,
      created_at: new Date()
    };
    await setDoc(doc(db, 'credit_cards', newId), newCard);
    await logActivity(kingdom.id, auth.currentUser.uid, 'CREATE_TRANSACTION', newId, { type: 'credit_card', name: card.name });
  };

  const updateCreditCard = async (id: string, card: any) => {
    if (!auth.currentUser || !kingdom) return;
    await setDoc(doc(db, 'credit_cards', id), card, { merge: true });
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
    const newInvoice = {
      ...invoice,
      id: newId,
      userId: auth.currentUser.uid,
      createdAt: new Date().toISOString(),
      kingdom_id: kingdom.id,
      created_by: auth.currentUser.uid
    };
    await setDoc(doc(db, 'credit_card_invoices', newId), newInvoice);
    await logActivity(kingdom.id, auth.currentUser.uid, 'CREATE_TRANSACTION', newId, { type: 'credit_card_invoice', amount: invoice.total_amount });
  };

  const updateCreditCardInvoice = async (id: string, invoice: any) => {
    if (!auth.currentUser || !kingdom) return;
    await setDoc(doc(db, 'credit_card_invoices', id), invoice, { merge: true });
    await logActivity(kingdom.id, auth.currentUser.uid, 'UPDATE_TRANSACTION', id, { type: 'credit_card_invoice', updates: invoice });
  };

  const payCreditCardInvoice = async (id: string, paidAt: string) => {
    if (!auth.currentUser || !kingdom) return;
    const docRef = doc(db, 'credit_card_invoices', id);
    await runTransaction(db, async (transaction: any) => {
      const docSnap = await transaction.get(docRef);
      if (!docSnap.exists()) throw new Error('Fatura não encontrada.');
      const data = docSnap.data();
      if (data?.status === 'paid') throw new Error('Esta fatura já foi paga.');
      transaction.update(docRef, { status: 'paid', paidAt });
    });
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
    kingdom, kingdomId: kingdom?.id || null, role, memberId, loading,
    transactions, assets, activityLogs, contributionPlanning, categories, budgets, payables, receivables, creditCards, creditCardInvoices,
    getBudgetProgress,
    kingdomLevel, kingdomXP, heroLevel, heroXP,
    addTransaction, updateTransaction, deleteTransaction,
    addInvestment, updateInvestment, deleteInvestment, addEarning,
    saveBudget, addCategory, updateCategory, deleteCategory,
    addPayable, updatePayable, payPayable, deletePayable,
    addReceivable, updateReceivable, receiveReceivable, deleteReceivable,
    addCreditCard, updateCreditCard, deleteCreditCard,
    addCreditCardInvoice, updateCreditCardInvoice, payCreditCardInvoice, deleteCreditCardInvoice,
    members, userInvites, kingdomInvites,
    updateContributionPlanning, joinKingdomByCode
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
