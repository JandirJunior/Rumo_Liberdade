import type { Metadata } from 'next';
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

import { ThemeProvider } from '@/lib/ThemeContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-gray-100 text-[#1A1A1A] font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <div className="min-h-screen flex justify-center">
            <main className="w-full md:max-w-2xl lg:max-w-4xl min-h-screen relative pb-24 shadow-2xl bg-white overflow-x-hidden">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
