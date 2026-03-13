/**
 * Página do Mentor (Chat IA): Interface de conversação com um mentor financeiro personalizado.
 * Utiliza a API do Gemini para gerar respostas baseadas no arquétipo do usuário.
 */
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Sparkles, ChevronLeft } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import Image from 'next/image';
import { BottomNav } from '@/components/BottomNav';
import { Header } from '@/components/Header';
import { MOCK_PROFILE, MOCK_ASSETS, MOCK_TRANSACTIONS, MOCK_GAME_STATE, ARCHETYPE_IMAGES } from '@/lib/data';
import { UserGameState } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

import { useTheme } from '@/lib/ThemeContext';
import { THEMES } from '@/lib/themes';

export default function AIChat() {
  // Acessa o estado global e o tema atual através do contexto
  const { gameState, theme } = useTheme();
  const colors = THEMES[theme] || THEMES.default;

  // Mapeamento de nomes de mentores baseados no arquétipo do usuário
  const MENTOR_NAMES: Record<string, string> = {
    'Paladino': 'Festim',
    'Mago': 'Arcano',
    'Dwarf': 'Cache',
    'Elfo': 'Êxodo',
    'Ladrão': 'Reaver',
    'Hobbit': 'Órbit',
    'Iniciante': 'Guia'
  };

  const mentorName = MENTOR_NAMES[gameState.archetype] || 'Mentor';

  // Estado para armazenar o histórico de mensagens
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: `Olá, herói! Eu sou ${mentorName}, seu mentor financeiro. Como posso guiar seus passos rumo à liberdade financeira hoje?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Efeito para rolar o chat para o final sempre que uma nova mensagem for adicionada
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Função para enviar a mensagem do usuário e obter resposta da IA
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      // Inicializa o cliente do Gemini
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
      
      // Definição do contexto (System Instruction) para a IA
      const getPersonality = (archetype: string) => {
        switch (archetype) {
          case 'Mago': return 'Você é extremamente analítico, focado em dados, gráficos e projeções de longo prazo. Fala sobre "magia dos juros compostos" e "feitiços de dividendos".';
          case 'Ladrão': return 'Você é focado em proteção de patrimônio, oportunidades ocultas e acumulação de tesouros. Fala sobre "esconderijos seguros" (CDBs/Tesouro) e "evitar armadilhas do mercado".';
          case 'Paladino': return 'Você é focado em fundações sólidas, tijolos e aluguéis. Fala sobre "construir fortalezas" (FIIs) e "escudos contra a inflação".';
          case 'Dwarf': return 'Você é focado em garimpar valor, criptomoedas e tecnologia. Fala sobre "minerar ouro digital", "blocos inquebráveis" e "volatilidade das cavernas".';
          case 'Elfo': return 'Você é focado em visão global, exterior e diversificação além-mar. Fala sobre "terras distantes", "moedas élficas fortes" (Dólar) e "agilidade no mercado internacional".';
          case 'Hobbit': return 'Você é focado em conforto, segurança e investimentos alternativos. Fala sobre "despensa cheia", "tranquilidade no Condado" e "colheitas fartas".';
          default: return 'Você é um guia sábio e equilibrado.';
        }
      };

      const context = `
        Você é o mentor financeiro ${mentorName} no universo F.A.C.E.R.O.
        Sua personalidade é baseada no arquétipo: ${gameState.archetype}.
        ${getPersonality(gameState.archetype)}
        
        Dados do usuário:
        - Arquétipo: ${gameState.archetype}
        - Nível: ${gameState.level}
        - Atributos F.A.C.E.R.O.: F:${gameState.stats.F}, A:${gameState.stats.A}, C:${gameState.stats.C}, E:${gameState.stats.E}, R:${gameState.stats.R}, O:${gameState.stats.O}
        - XP Total: ${gameState.xp}
        
        Responda como o mentor ${mentorName}, usando termos de RPG quando apropriado (mana, quests, buffs, masmorras), de forma motivadora, técnica e direta em português do Brasil. 
        Mantenha-se fiel à sua classe (${gameState.archetype}) e à sua personalidade específica.
        Use emojis e formatação clara.
      `;

      // Chamada para geração de conteúdo
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          { role: 'user', parts: [{ text: context }] },
          { role: 'user', parts: [{ text: userMessage }] }
        ],
      });

      const botText = response.text || 'Desculpe, tive um problema ao processar sua solicitação.';
      setMessages(prev => [...prev, { role: 'bot', text: botText }]);
    } catch (error) {
      console.error('Gemini Error:', error);
      setMessages(prev => [...prev, { role: 'bot', text: 'Ops! Ocorreu um erro ao conectar com minha inteligência. Tente novamente em instantes.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col h-screen transition-colors duration-500", colors.bg)}>
      {/* Cabeçalho superior */}
      <Header />
      
      {/* Área de Chat com rolagem */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-48 w-full"
      >
        {/* Identificação do Mentor no topo do chat */}
        <div className="flex flex-col items-center justify-center py-4 space-y-2">
          <div className={cn("w-16 h-16 rounded-full border-2 overflow-hidden relative", colors.border)}>
            <Image 
              src={ARCHETYPE_IMAGES[gameState.archetype] || ARCHETYPE_IMAGES['Iniciante']} 
              alt="Mentor Avatar"
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
              unoptimized
            />
          </div>
          <h2 className="text-xl font-display font-bold text-gray-900">{mentorName}</h2>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">{gameState.archetype}</p>
        </div>

        {/* Lista de Mensagens com animações */}
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar do remetente */}
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden relative",
                  msg.role === 'user' ? "bg-gray-200" : colors.secondary
                )}>
                  {msg.role === 'user' ? (
                    <User className="w-5 h-5 text-gray-600" />
                  ) : (
                    <Image 
                      src={ARCHETYPE_IMAGES[gameState.archetype] || ARCHETYPE_IMAGES['Iniciante']} 
                      alt="Mentor"
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                      unoptimized
                    />
                  )}
                </div>
                {/* Balão de Mensagem */}
                <div className={cn(
                  "p-4 rounded-2xl shadow-sm text-sm leading-relaxed",
                  msg.role === 'user' 
                    ? cn(colors.primary, "text-white rounded-tr-none") 
                    : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                )}>
                  {msg.text}
                </div>
              </div>
            </motion.div>
          ))}
          {/* Indicador de carregamento (IA digitando) */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-2">
                <span className={cn("w-2 h-2 rounded-full animate-bounce", colors.primary)}></span>
                <span className={cn("w-2 h-2 rounded-full animate-bounce delay-75", colors.primary)}></span>
                <span className={cn("w-2 h-2 rounded-full animate-bounce delay-150", colors.primary)}></span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Área de Entrada de Texto fixa na parte inferior */}
      <div className="fixed bottom-24 md:bottom-4 left-0 right-0 w-full px-4 sm:px-6 lg:px-8 bg-transparent z-40">
        <div className="bg-white border border-gray-200 rounded-2xl p-2 shadow-xl flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pergunte algo sobre suas finanças..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-3 py-2 outline-none"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={cn(
              "w-10 h-10 text-white rounded-xl flex items-center justify-center transition-colors shadow-lg disabled:bg-gray-300",
              colors.primary, colors.shadow
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Menu de navegação inferior */}
      <BottomNav />
    </div>
  );
}
