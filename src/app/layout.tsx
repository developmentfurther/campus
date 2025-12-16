// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { I18nProvider } from "@/contexts/I18nContext";
import { UsersProvider } from '@/contexts/UserContext';

// 👇 1. Importar el componente
import {GlobalPodcast}  from '@/components/podcast/GlobalPodcast'; 

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Further Campus – Tu espacio para aprender',
  description: 'Further Campus plataforma educativa...',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} relative`}> {/* Agregué relative por seguridad */}
        <I18nProvider>
          <AuthProvider>
            <UsersProvider>
              
              <main className="min-h-screen bg-gray-50">
                {children}
              </main>

              {/* 👇 2. Aquí va el reproductor. 
                  Al estar fuera del children, pero dentro de los providers,
                  persiste en toda la app y tiene acceso al contexto si fuera necesario. 
              */}
              <GlobalPodcast />

            </UsersProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}