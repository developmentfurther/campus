'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { user, authReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authReady) return;

    if (!user) {
      // Usuario NO logueado → ir al login
      router.replace('/login');
      return;
    }

    // Usuario logueado → ir al dashboard
    router.replace('/dashboard');
  }, [authReady, user, router]);

  // No mostrar NADA en pantalla
  return null;
}
