import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
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

import { ThemeProvider } from '@/lib/ThemeContext';
import { SpeedDial } from '@/components/SpeedDial';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-gray-100 text-[#1A1A1A] font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <div className="min-h-screen flex flex-col">
            <main className="w-full min-h-screen relative pb-24 bg-white overflow-x-hidden">
              {children}
              <SpeedDial />
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
