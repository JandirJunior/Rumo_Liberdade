import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { ThemeProvider } from '@/lib/ThemeContext';
import { SpeedDial } from '@/components/ui/SpeedDial';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { AmbientEngine } from '@/components/game/AmbientEngine';
import { AmbientBackground } from '@/components/game/AmbientBackground';
import { Sidebar } from '@/components/layout/Sidebar';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'Rumo à Liberdade',
  description: 'Controle financeiro inteligente para investidores de longo prazo',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

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
            <Sidebar />
            <div className="min-h-screen flex flex-col md:pl-20">
              <main className="w-full min-h-screen relative pb-24 overflow-x-hidden">
                {children}
                <SpeedDial />
              </main>
            </div>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}