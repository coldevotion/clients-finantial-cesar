import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { QueryProvider } from '@/components/providers/query-provider';
import './globals.css';

// next/font descarga, optimiza y sirve la fuente localmente —
// elimina la petición externa a Google y el bloqueo de render.
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-jakarta',
});

export const metadata: Metadata = {
  title: 'Provired — Mensajería Masiva',
  description: 'Plataforma de campañas masivas por WhatsApp con flujos automatizados',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={jakarta.variable}>
      <body className={jakarta.className}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
