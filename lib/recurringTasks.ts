import { db, auth } from '@/firebase';
import { collection, query, where, getDocs, setDoc, doc, updateDoc } from 'firebase/firestore';
import { AccountPayable, AccountReceivable } from './types';

// Helper to add months to a date string (YYYY-MM-DD)
function addMonths(dateStr: string, months: number): string {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
}

export async function generateRecurringQuests(kingdomId?: string) {
  if (!auth.currentUser || !kingdomId) return;
  const today = new Date().toISOString().split('T')[0];

  try {
    // 1. Process Accounts Payable
    const payablesRef = collection(db, 'accounts_payable');
    const payablesQuery = query(
      payablesRef, 
      where('kingdom_id', '==', kingdomId),
      where('isRecurring', '==', true)
    );
    
    const payablesSnapshot = await getDocs(payablesQuery);
    
    for (const document of payablesSnapshot.docs) {
      const payable = document.data() as AccountPayable;
      
      // If it's recurring and the next recurrence date is not set, or it's in the past/today
      if (payable.recurrenceRule && (!payable.nextRecurrenceDate || payable.nextRecurrenceDate <= today)) {
        // We need to generate the next instance
        
        let nextDate = payable.nextRecurrenceDate || payable.dueDate;
        
        // Calculate the next due date based on the rule
        if (payable.recurrenceRule === 'monthly') {
          nextDate = addMonths(nextDate, 1);
        } else if (payable.recurrenceRule === 'yearly') {
          nextDate = addMonths(nextDate, 12);
        } else if (payable.recurrenceRule === 'weekly') {
          const d = new Date(nextDate);
          d.setDate(d.getDate() + 7);
          nextDate = d.toISOString().split('T')[0];
        }

        // Create the new instance
        const newId = doc(collection(db, 'accounts_payable')).id;
        const newPayable: AccountPayable = {
          ...payable,
          id: newId,
          dueDate: nextDate,
          status: 'pending',
          paidAt: undefined,
          nextRecurrenceDate: undefined, // The new instance doesn't have a next recurrence date yet until it's processed
          createdAt: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'accounts_payable', newId), newPayable);
        
        // Update the original document to point to the next recurrence date and disable its recurrence
        await updateDoc(doc(db, 'accounts_payable', document.id), {
          nextRecurrenceDate: nextDate,
          isRecurring: false // The new instance will handle the next recurrence
        });
      }
    }

    // 2. Process Accounts Receivable (similar logic)
    const receivablesRef = collection(db, 'accounts_receivable');
    const receivablesQuery = query(
      receivablesRef, 
      where('kingdom_id', '==', kingdomId),
      where('isRecurring', '==', true)
    );
    
    const receivablesSnapshot = await getDocs(receivablesQuery);
    
    for (const document of receivablesSnapshot.docs) {
      const receivable = document.data() as AccountReceivable;
      
      if (receivable.recurrenceRule && (!receivable.nextRecurrenceDate || receivable.nextRecurrenceDate <= today)) {
        let nextDate = receivable.nextRecurrenceDate || receivable.dueDate;
        
        if (receivable.recurrenceRule === 'monthly') {
          nextDate = addMonths(nextDate, 1);
        } else if (receivable.recurrenceRule === 'yearly') {
          nextDate = addMonths(nextDate, 12);
        } else if (receivable.recurrenceRule === 'weekly') {
          const d = new Date(nextDate);
          d.setDate(d.getDate() + 7);
          nextDate = d.toISOString().split('T')[0];
        }

        const newId = doc(collection(db, 'accounts_receivable')).id;
        const newReceivable: AccountReceivable = {
          ...receivable,
          id: newId,
          dueDate: nextDate,
          status: 'pending',
          receivedAt: undefined,
          nextRecurrenceDate: undefined,
          createdAt: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'accounts_receivable', newId), newReceivable);
        
        await updateDoc(doc(db, 'accounts_receivable', document.id), {
          nextRecurrenceDate: nextDate,
          isRecurring: false // The new instance will handle the next recurrence
        });
      }
    }
  } catch (error) {
    console.error("Error generating recurring quests:", error);
  }
}
