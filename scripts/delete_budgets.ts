import { initializeApp } from 'firebase/app';
import { getFirestore, doc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const idsToDelete = [
  '1dFGsJK8RaBha2GlJ4BQ',
  '4wq7GjKNp2ex4wIu7zhV',
  'C9ULrtbwwp5ydgbiZzRr',
  'DWlfvZNQHwLQU7jKfUZO',
  'Ffd6P0NcS2IghOSbgHEA',
  'GI3QXhGGh00uFIBYSKYz',
  'K4xqhSt5R9Gr2j93JrNP',
  'TvccSXidPCzVCf9XoTYV',
  'YL2gS', // Wait, the user gave YL2gS, nPe1f, sA9jz. Maybe they are truncated?
  'nPe1f',
  'sA9jz'
];

async function deleteBudgets() {
  for (const id of idsToDelete) {
    try {
      await deleteDoc(doc(db, 'budgets', id));
      console.log(`Deleted budget ${id}`);
    } catch (e) {
      console.error(`Error deleting budget ${id}:`, e);
    }
  }
}

deleteBudgets();
