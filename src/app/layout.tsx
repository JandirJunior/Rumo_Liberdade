/**
 * Layout Raiz da Aplicação: Define a estrutura base de todas as páginas do Next.js.
 * Configura fontes globais (Inter e Space Grotesk), estilos CSS globais e provedores de contexto.
 * Inclui o ClientLayout que gerencia temas, autenticação e navegação responsiva.
 * Responsável por renderizar o layout comum a todas as rotas da aplicação.
 */
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
        className="text-[var(--color-text-main)] font-sans antialiased theme-bg"
        suppressHydrationWarning
      >
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
