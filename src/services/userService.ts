/**
 * Serviço de Usuários: Gerencia dados e operações de usuários individuais.
 * Responsabilidades:
 * - Criar novos usuários (getUser, createUser)
 * - Atualizar perfis de usuários (updateUser)
 * - Gerenciar estado de gamificação (level, XP, título)
 * - Sincronizar dados de usuários com Firestore
 * Integração:
 * - Usa Firestore collection 'users' indexada por userId
 * - Interage com Firebase Auth para autenticação
 * - Trabalha com tipo UserEntity
 * Contexto: Suporta onboarding e gerenciamento de perfis de usuários.
 */
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { UserEntity } from '@/types';

export const userService = {
  async createUser(userId: string, email: string, name?: string): Promise<UserEntity> {
    const userRef = doc(db, 'users', userId);
    const newUser: UserEntity = {
      id: userId,
      email,
      name: name || '',
      level: 1,
      xp: 0,
      title: 'Aprendiz das Moedas',
      created_at: new Date()
    };

    await setDoc(userRef, {
      ...newUser,
      created_at: serverTimestamp()
    });

    return newUser;
  },

  async getUser(userId: string): Promise<UserEntity | null> {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserEntity;
    }
    return null;
  }
};
