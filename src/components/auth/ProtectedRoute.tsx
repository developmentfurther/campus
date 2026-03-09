"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoaderUi from "@/components/ui/LoaderUi";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, authReady } = useAuth(); // ← ya no usamos `loading`
  const router = useRouter();

  useEffect(() => {
    if (authReady && !user) {
      router.replace("/");
    }
  }, [user, authReady, router]);

  // CASO 1: Firebase Auth todavía no respondió (< 200ms normalmente)
  if (!authReady) {
    return <LoaderUi />;
  }

  // CASO 2: Ya cargó pero no hay usuario → redirigiendo
  if (!user) {
    return null;
  }

  // CASO 3: Todo ok → renderizar layout completo
  // El role y userProfile llegan después en background, sin bloquear
  return <>{children}</>;
}