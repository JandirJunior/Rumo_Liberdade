/**
 * Contexto de Tema e Estado do Jogo: Gerencia o estado global do usuário e a aparência do app.
 * Sincroniza o arquétipo do herói com o esquema de cores (tema) correspondente.
 */

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeType, ARCHETYPE_THEME_MAP, applyTheme } from './themes';
import { MOCK_GAME_STATE } from './data';
import { UserGameState } from '@/types';
import { auth, db } from '@/services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '@/services/firebaseUtils';

// =========================
// TIPAGEM DO CONTEXTO
// =========================
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

// =========================
// CONTEXTO
// =========================
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// =========================
// PROVIDER
// =========================
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<UserGameState>(MOCK_GAME_STATE);
  const [theme, setThemeState] = useState<ThemeType>('default');

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [gameMode, setGameMode] = useState<'heroi' | 'reino'>('heroi');

  // =========================
  // AUTH LISTENER
  // =========================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
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

          const resolvedTheme =
            data.theme ||
            ARCHETYPE_THEME_MAP[data.archetype] ||
            'default';

          setThemeState(resolvedTheme);
        } else {
          // NOVO USUÁRIO
          const newState = { ...MOCK_GAME_STATE };

          const newTheme =
            ARCHETYPE_THEME_MAP[newState.archetype] || 'default';

          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            name: currentUser.displayName || 'Herói',
            archetype: newState.archetype,
            xp: newState.xp,
            stats: newState.stats,
            theme: newTheme,
            createdAt: new Date().toISOString(),
          });

          setGameState(newState);
          setThemeState(newTheme);
        }
      } else {
        setGameState(MOCK_GAME_STATE);
        setThemeState('default');
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // =========================
  // LISTENER REALTIME FIRESTORE
  // =========================
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(
      userRef,
      (docSnap) => {
        if (!docSnap.exists()) return;

        const data = docSnap.data();

        setGameState({
          level: Math.floor(data.xp / 1000) + 1,
          xp: data.xp,
          archetype: data.archetype,
          stats: data.stats,
          completedQuests: data.completedQuests || [],
        });

        const resolvedTheme =
          data.theme ||
          ARCHETYPE_THEME_MAP[data.archetype] ||
          'default';

        setThemeState(resolvedTheme);
      },
      (error) => {
        handleFirestoreError(
          error,
          OperationType.GET,
          `users/${user.uid}`
        );
      }
    );

    return () => unsubscribe();
  }, [user]);

  // =========================
  // APLICAÇÃO DO TEMA
  // =========================
  useEffect(() => {
    applyTheme(theme);

    // 🔥 Classe global no body (IMPORTANTE pro layout medieval)
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // =========================
  // ALTERAÇÃO DE TEMA (COM FIRESTORE)
  // =========================
  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);

    if (user) {
      const userRef = doc(db, 'users', user.uid);

      await setDoc(
        userRef,
        { theme: newTheme },
        { merge: true }
      );
    }
  };

  // =========================
  // UPDATE GAME STATE
  // =========================
  const updateGameState = async (newState: UserGameState) => {
    setGameState(newState);

    if (user) {
      const userRef = doc(db, 'users', user.uid);

      await setDoc(
        userRef,
        {
          archetype: newState.archetype,
          xp: newState.xp,
          stats: newState.stats,
          theme:
            ARCHETYPE_THEME_MAP[newState.archetype] ||
            'default',
        },
        { merge: true }
      );
    }
  };

  // =========================
  // PROVIDER
  // =========================
  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        gameState,
        setGameState: updateGameState,
        user,
        loading,
        gameMode,
        setGameMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// =========================
// HOOK
// =========================
export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useTheme must be used within a ThemeProvider'
    );
  }

  return context;
}