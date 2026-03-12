// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { I18nProvider } from "@/contexts/I18nContext";
import { GlobalPodcast } from '@/components/podcast/GlobalPodcast'; 
import { ChatProvider } from '@/contexts/ChatContext';
import { AlumnoProvider } from '@/contexts/AlumnoContext'; // 👈 AGREGAR

export const metadata: Metadata = {
  title: 'Further Campus – Tu espacio para aprender',
  description: 'Further Campus plataforma educativa...',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="relative">
        <I18nProvider>
          <AuthProvider>
            <AlumnoProvider> {/* 👈 AGREGAR — debe ir DENTRO de AuthProvider */}
              <ChatProvider>
                <main className="min-h-screen bg-gray-50">
                  {children}
                </main>
                <GlobalPodcast />
              </ChatProvider>
            </AlumnoProvider> {/* 👈 CERRAR */}
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}