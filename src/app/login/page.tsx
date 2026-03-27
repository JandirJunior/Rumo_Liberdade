'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '@/services/firebase';
import { IMAGES } from '@/assets/images';
import { LogIn, ShieldCheck, Sword, Castle, Mail, Lock, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/kingdom-selector');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/kingdom-selector');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('O login com Google não está habilitado no Firebase Console.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('O popup foi bloqueado pelo navegador. Permita popups para este site.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('A autenticação foi cancelada.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        // Ignorar o erro se o usuário apenas fechou o popup intencionalmente
        console.log('Popup fechado pelo usuário.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Falha de conexão. Se estiver usando o modo de visualização, tente abrir o aplicativo em uma nova aba. Verifique também sua internet ou desative bloqueadores de anúncios (AdBlock) que podem estar impedindo o login.');
      } else {
        setError(`Falha ao autenticar com Google. Tente novamente. (${err.message})`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push('/kingdom-selector');
    } catch (err: any) {
      console.error('Email auth error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setError('Ocorreu um erro. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-dark)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={IMAGES.LOGIN}
          alt="Background"
          fill
          priority
          className="object-cover opacity-90"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--color-bg-dark)]/80 to-[var(--color-bg-dark)] opacity-70" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 animate-pulse opacity-30">
        <ShieldCheck className="w-16 h-16 text-[var(--color-primary)]" />
      </div>
      <div className="absolute bottom-10 right-10 animate-bounce opacity-30">
        <Sword className="w-16 h-16 text-[var(--color-primary)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-[var(--color-bg-panel)]/90 border border-[var(--color-border)] rounded-3xl p-8 shadow-2xl backdrop-blur-md medieval-border relative">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2">
            <div className="w-24 h-24 bg-[var(--color-bg-panel)] rounded-2xl rotate-45 flex items-center justify-center border-2 border-[var(--color-primary)] shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.3)]">
              <div className="-rotate-45">
                <Castle className="w-12 h-12 text-[var(--color-primary)]" />
              </div>
            </div>
          </div>

          <div className="mt-12 text-center space-y-2 mb-8">
            <h1 className="text-3xl font-display font-bold text-[var(--color-text-main)] medieval-title">
              Rumo à Liberdade
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              Sua jornada financeira épica começa aqui
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl text-sm mb-6 text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {!showEmailLogin ? (
                <motion.div
                  key="options"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full py-4 bg-[var(--color-primary)] hover:brightness-110 disabled:opacity-50 text-[var(--color-bg-dark)] font-bold rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 group medieval-border"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-[var(--color-bg-dark)] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <LogIn className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        Entrar com Google
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowEmailLogin(true)}
                    className="w-full py-3 border border-[var(--color-border)] text-[var(--color-text-main)] hover:bg-[var(--color-primary)]/10 rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    <Mail className="w-5 h-5" />
                    Entrar com E-mail
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="email-login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleEmailAuth}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest ml-1">
                      E-mail
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-2xl py-3 pl-12 pr-4 text-[var(--color-text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest ml-1">
                      Senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-2xl py-3 pl-12 pr-4 text-[var(--color-text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-[var(--color-primary)] hover:brightness-110 disabled:opacity-50 text-[var(--color-bg-dark)] font-bold rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 group medieval-border"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-[var(--color-bg-dark)] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        {isSignUp ? <UserPlus className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
                        {isSignUp ? 'Criar Conta' : 'Entrar'}
                      </>
                    )}
                  </button>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-sm text-[var(--color-primary)] hover:underline"
                    >
                      {isSignUp ? 'Já tem uma conta? Entre aqui' : 'Não tem conta? Crie uma agora'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEmailLogin(false)}
                      className="text-sm text-[var(--color-text-muted)] hover:underline"
                    >
                      Voltar para outras opções
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
