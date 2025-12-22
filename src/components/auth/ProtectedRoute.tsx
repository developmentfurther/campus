"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoaderUi from "@/components/ui/LoaderUi";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, authReady, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Solo redirigir si ya terminamos de cargar todo (authReady) y no hay usuario
    if (authReady && !loading && !user) {
      router.replace("/");
    }
  }, [user, authReady, loading, router]);

  // CASO 1: Aún cargando el estado inicial de Auth
  if (!authReady || loading) {
    return <LoaderUi />;
  }

  // CASO 2: Ya cargó, pero no hay usuario (estamos redirigiendo en el useEffect)
  // 🔥 IMPORTANTE: No mostrar Loader aquí si ya sabemos que no hay user.
  // Devolver null evita el parpadeo o el loader infinito visual mientras redirige.
  if (!user) {
    return null; 
  }

  // CASO 3: Todo ok
  return <>{children}</>;
}