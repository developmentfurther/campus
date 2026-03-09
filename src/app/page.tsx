"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const ROLE_ROUTES = {
  admin:    "/admin",
  profesor: "/profesores",
  alumno:   "/dashboard",
} as const;

export default function HomePage() {
  const { user, role, authReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authReady) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    // Redirigir según rol. Fallback a /dashboard si el rol no está aún
    const destination = role ? ROLE_ROUTES[role] : "/dashboard";
    router.replace(destination);
  }, [authReady, user, role, router]);

  return null;
}