'use client';

import { Inter, Space_Grotesk } from 'next/font/google';
import { ThemeProvider, useTheme } from '@/lib/ThemeContext';
import { SpeedDial } from '@/components/ui/SpeedDial';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { AmbientEngine } from '@/components/game/AmbientEngine';
import { AmbientBackground } from '@/components/game/AmbientBackground';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useTheme();
  
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
        </main>
      </div>
      {showNav && <BottomNav />}
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${spaceGrotesk.variable}`}
    >
      <body
        className="bg-[var(--color-bg-dark)] text-[var(--color-text-main)] font-sans antialiased"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <ErrorBoundary>
            <AmbientEngine />
            <AmbientBackground />
            <LayoutContent>
              {children}
            </LayoutContent>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
