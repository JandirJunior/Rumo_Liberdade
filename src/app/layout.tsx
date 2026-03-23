import { Inter, Space_Grotesk } from 'next/font/google';
import { ClientLayout } from '@/components/layout/ClientLayout';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata = {
  title: 'Rumo à Liberdade - RPG Financeiro',
  description: 'Transforme sua vida financeira em uma jornada épica.',
  manifest: '/manifest.json',
  themeColor: '#f27d26',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Rumo à Liberdade',
  },
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
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
