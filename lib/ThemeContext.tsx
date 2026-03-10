/**
 * Contexto de Tema e Estado do Jogo: Gerencia o estado global do usuário e a aparência do app.
 * Sincroniza o arquétipo do herói com o esquema de cores (tema) correspondente.
 */
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeType, THEMES, ARCHETYPE_THEME_MAP } from './themes';
import { MOCK_GAME_STATE } from './data';
import { UserGameState } from './types';

// Definição da interface do contexto
interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  gameState: UserGameState;
  setGameState: (state: UserGameState) => void;
}

// Criação do contexto
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provedor do Contexto que envolve a aplicação
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Estado global do jogo (nível, XP, arquétipo, atributos)
  const [gameState, setGameState] = useState<UserGameState>(MOCK_GAME_STATE);
  // Estado do tema visual atual
  const [theme, setTheme] = useState<ThemeType>('default');

  // Efeito inicial para carregar dados salvos do navegador (localStorage)
  useEffect(() => {
    const saved = localStorage.getItem('facero_game_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGameState(parsed);
      // Define o tema baseado no arquétipo recuperado
      setTheme(ARCHETYPE_THEME_MAP[parsed.archetype] || 'default');
    }
  }, []);

  // Efeito para atualizar o tema sempre que o arquétipo do herói mudar
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(ARCHETYPE_THEME_MAP[gameState.archetype] || 'default');
  }, [gameState.archetype]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, gameState, setGameState }}>
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
