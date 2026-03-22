import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

// Teste de conexão
if (typeof window !== 'undefined') {
  const testConnection = async () => {
    try {
      // Tenta buscar um documento no path permitido para teste
      await getDocFromServer(doc(db, '_connection_test', 'ping'));
      console.log('🔥 Firestore conectado com sucesso!');
    } catch (error) {
      // Se o erro for de permissão, ainda assim indica que houve conexão com o servidor
      if (error instanceof Error && (error.message.includes('permission') || error.message.includes('insufficient'))) {
        console.log('🔥 Firestore conectado (servidor alcançado).');
      } else if (error instanceof Error && error.message.includes('offline')) {
        console.error('❌ Firestore está offline. Verifique a configuração no firebase-applet-config.json.');
      } else {
        console.error('❌ Erro na conexão com Firestore:', error);
      }
    }
  };
  testConnection();
}
