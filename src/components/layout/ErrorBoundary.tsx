'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { safeStringify } from '../../lib/utils';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', safeStringify(error), safeStringify(errorInfo));
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg-dark)]">
          <div className="bg-[var(--color-bg-panel)] p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-[var(--color-border)] medieval-border">
            <h2 className="text-2xl font-bold text-[var(--color-text-main)] mb-4 medieval-title">Ops! A magia falhou.</h2>
            <p className="text-[var(--color-text-muted)] mb-6">
              Ocorreu um erro inesperado. Por favor, tente recarregar a página ou entre em contato com o suporte se o problema persistir.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-[var(--color-primary)] text-[var(--color-bg-dark)] font-bold rounded-xl hover:brightness-110 transition-colors medieval-glow"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
