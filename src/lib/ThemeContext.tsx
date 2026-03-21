/**
 * Contexto de Tema e Estado do Jogo: Gerencia o estado global do usuário e a aparência do app.
 * Sincroniza o arquétipo do herói com o esquema de cores (tema) correspondente.
 */
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeType, THEMES, ARCHETYPE_THEME_MAP, applyTheme } from './themes';
import { MOCK_GAME_STATE } from './data';
import { UserGameState } from '@/types';
import { auth, db } from '@/services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '@/services/firebaseUtils';

// Definição da interface do contexto
interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  gameState: UserGameState;
  setGameState: (state: UserGameState) => void;
  user: User | null;
  loading: boolean;
  gameMode: 'heroi' | 'reino';
  setGameMode: (mode: 'heroi' | 'reino') => void;
}

// Criação do contexto
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provedor do Contexto que envolve a aplicação
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Estado global do jogo (nível, XP, arquétipo, atributos)
  const [gameState, setGameState] = useState<UserGameState>(MOCK_GAME_STATE);
  // Estado do tema visual atual
  const [theme, setTheme] = useState<ThemeType>('default');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameMode, setGameMode] = useState<'heroi' | 'reino'>('heroi');

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check if user exists in Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          const loadedState: UserGameState = {
            level: Math.floor(data.xp / 1000) + 1,
            xp: data.xp,
            archetype: data.archetype,
            stats: data.stats,
            completedQuests: data.completedQuests || [],
          };
          setGameState(loadedState);
          setTheme(data.theme || ARCHETYPE_THEME_MAP[data.archetype] || 'default');
        } else {
          // Create new user in Firestore
          const newState = { ...MOCK_GAME_STATE };
          const newTheme = ARCHETYPE_THEME_MAP[newState.archetype] || 'default';
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            name: currentUser.displayName || 'Herói',
            archetype: newState.archetype,
            xp: newState.xp,
            stats: newState.stats,
            theme: newTheme,
            createdAt: new Date().toISOString()
          });
          setGameState(newState);
          setTheme(newTheme);
        }
      } else {
        // Reset to mock state if logged out
        setGameState(MOCK_GAME_STATE);
        setTheme('default');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to Firestore changes for the current user
  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGameState({
          level: Math.floor(data.xp / 1000) + 1,
          xp: data.xp,
          archetype: data.archetype,
          stats: data.stats,
          completedQuests: data.completedQuests || [],
        });
        setTheme(data.theme || ARCHETYPE_THEME_MAP[data.archetype] || 'default');
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Sync gameState changes back to Firestore
  const updateGameState = async (newState: UserGameState) => {
    setGameState(newState);
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        archetype: newState.archetype,
        xp: newState.xp,
        stats: newState.stats,
        theme: ARCHETYPE_THEME_MAP[newState.archetype] || 'default'
      }, { merge: true });
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, gameState, setGameState: updateGameState, user, loading, gameMode, setGameMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook personalizado para facilitar o uso do contexto em outros componentes
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
