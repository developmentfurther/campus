// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { UsersProvider } from '@/contexts/UserContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Further Campus – Tu espacio para aprender, practicar y certificar tu inglés',
  description: 'Further Campus es la plataforma educativa oficial de Further Corporate: accedé a tus cursos, progresos, lecciones interactivas, exámenes automáticos, certificaciones y un nuevo módulo de gaming para aprender inglés de forma dinámica y a tu ritmo.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {/* ✅ AuthProvider en el nivel global */}
        <AuthProvider>
          <UsersProvider>
            <main className="min-h-screen bg-gray-50">{children}</main>
          </UsersProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
