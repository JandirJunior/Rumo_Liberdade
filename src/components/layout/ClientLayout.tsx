'use client';

import { ThemeProvider, useTheme } from '@/lib/ThemeContext';
import { KingdomProvider } from '@/contexts/KingdomContext';
import { ActionProvider } from '@/context/ActionContext';
import { SpeedDial } from '@/components/ui/SpeedDial';
import { GlobalModal } from '@/components/ui/GlobalModal';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { AmbientEngine } from '@/components/game/AmbientEngine';
import { AmbientBackground } from '@/components/game/AmbientBackground';
import { NotificationManager } from '@/components/game/NotificationManager';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useTheme();

  useEffect(() => {
    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
          },
          (err) => {
            console.log('ServiceWorker registration failed: ', err);
          }
        );
      });
    }
  }, []);
  
  const isAuthPage = pathname === '/logon' || pathname === '/genesis';
  const showNav = !isAuthPage && user && !loading;

  return (
    <div className="min-h-screen flex flex-col">
      {showNav && <Sidebar />}
      <div className={cn(
        "min-h-screen flex flex-col transition-all duration-300",
        showNav ? "md:pl-20 pb-20 md:pb-0" : "pl-0"
      )}>
        <main className="w-full min-h-screen relative overflow-x-hidden">
          {children}
          {showNav && <SpeedDial />}
          {showNav && <GlobalModal />}
          {showNav && <NotificationManager />}
        </main>
      </div>
      {showNav && <BottomNav />}
    </div>
  );
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <KingdomProvider>
        <ActionProvider>
          <ErrorBoundary>
            <AmbientEngine />
            <AmbientBackground />
            <LayoutContent>
              {children}
            </LayoutContent>
          </ErrorBoundary>
        </ActionProvider>
      </KingdomProvider>
    </ThemeProvider>
  );
}
