/**
 * Contexto de Tema e Estado do Jogo: Gerencia estado global do usuário, autenticação e aparência.
 * Sincroniza arquétipo do herói com esquema de cores (tema), gerencia estado de jogo (XP, stats),
 * implementa listeners de autenticação Firebase e sincronização com Firestore.
 * Responsável por onboarding de novos usuários, aplicação de temas e modo herói/reino.
 */
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeType, ARCHETYPE_THEME_MAP, applyTheme } from './themes';
import { MOCK_GAME_STATE, EMPTY_GAME_STATE } from './data';
import { UserGameState } from '@/types';
import { auth, db } from '@/services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { calculatePlayerLevel } from './gameEngine';

// =========================
// TIPAGEM DO CONTEXTO
// =========================
interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;

  gameState: UserGameState;
  setGameState: (state: UserGameState) => void;

  user: User | null;
  userData: any | null;
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
  const [theme, setThemeState] = useState<ThemeType>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('app_theme') as ThemeType) || 'ORBITA';
    }
    return 'ORBITA';
  });

  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const [gameMode, setGameMode] = useState<'heroi' | 'reino'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('app_game_mode') as 'heroi' | 'reino') || 'heroi';
    }
    return 'heroi';
  });

  // =========================
  // PERSISTÊNCIA DE PREFERÊNCIAS LOCAIS
  // =========================
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_game_mode', gameMode);
    }
  }, [gameMode]);

  // =========================
  // AUTH & FIRESTORE LISTENER
  // =========================
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        let isFirstSnapshot = true;

        // Configura o listener em tempo real SEM bloquear a thread com getDoc
        unsubscribeSnapshot = onSnapshot(
          userRef,
          async (docSnap) => {
            if (!docSnap.exists()) {
              if (isFirstSnapshot) {
                // Usuário não existe, cria no Firestore
                try {
                  const newState = { ...MOCK_GAME_STATE };
                  const newTheme = ARCHETYPE_THEME_MAP[newState.archetype] || 'ORBITA';

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
                } catch (error) {
                  console.error('Erro ao criar usuário:', error);
                }
              }
              // Libera o loading mesmo se o usuário estiver sendo criado
              setLoading(false);
              return;
            }

            const data = docSnap.data();
            setUserData(data);
            const newState = calculatePlayerLevel(data.xp || 0);

            setGameState({
              ...newState,
              archetype: data.archetype,
              stats: data.stats,
              completedQuests: data.completedQuests || [],
            });

            const resolvedTheme =
              data.theme ||
              ARCHETYPE_THEME_MAP[data.archetype] ||
              'ORBITA';

            setThemeState(resolvedTheme);
            
            // Libera a tela de loading no primeiro retorno bem-sucedido
            if (isFirstSnapshot) {
              isFirstSnapshot = false;
              setLoading(false);
            }
          },
          (error) => {
            console.error('Erro no onSnapshot do usuário:', error);
            setLoading(false); // Garante que não fique travado em caso de erro de permissão
          }
        );
      } else {
        setGameState(EMPTY_GAME_STATE);
        setThemeState('ORBITA');
        setUserData(null);
        setGameMode('heroi');
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
          unsubscribeSnapshot = undefined;
        }
        setLoading(false); // Libera o loading se não houver usuário logado
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  // =========================
  // APLICAÇÃO DO TEMA
  // =========================
  useEffect(() => {
    if (loading) return; // Aguarda o carregamento do usuário para aplicar o tema correto

    applyTheme(theme);

    // 🔥 Classe global no body (IMPORTANTE pro layout medieval)
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('app_theme', theme);
  }, [theme, loading]);

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
    const resolvedTheme =
      ARCHETYPE_THEME_MAP[newState.archetype] || 'ORBITA';

    setGameState(newState);
    setThemeState(resolvedTheme);

    if (user) {
      const userRef = doc(db, 'users', user.uid);

      await setDoc(
        userRef,
        {
          archetype: newState.archetype,
          xp: newState.xp,
          stats: newState.stats,
          theme: resolvedTheme,
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
        userData,
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