"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoaderUi from "@/components/ui/LoaderUi";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, authReady, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si la autenticación cargó y no hay usuario, chao
    if (authReady && !loading && !user) {
      router.replace("/"); // O '/login' si tu login está ahí
    }
  }, [user, authReady, loading, router]);

  // Mientras carga o si no hay usuario, mostramos loader
  if (!authReady || loading || !user) {
    return <LoaderUi />;
  }

  return <>{children}</>;
}