"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

import SidebarAdmin from "@/components/layout/SidebarAdmin";
import SidebarProfesor from "@/components/layout/SidebarProfesor";
import SidebarAlumno from "@/components/layout/SidebarAlumno";

import MobileNavbarAlumno from "@/components/layout/MobileNavbarAlumno";
import MobileNavbarAdmin from "@/components/layout/MobileNavbarAdmin";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, role, authReady, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authReady && !user) router.replace("/login");
  }, [authReady, user, router]);

  if (!authReady || loading)
    return <div className="flex h-screen items-center justify-center text-gray-500">Cargando sesión...</div>;

  if (!user) return null;

  const renderSidebar = () => {
    switch (role) {
      case "admin":
        return <SidebarAdmin />;
      case "profesor":
        return <SidebarProfesor />;
      case "alumno":
        return <SidebarAlumno />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {renderSidebar()}
      <main className="flex-1 overflow-y-auto p-6">{children}</main>

      {/* MOBILE NAV ONLY FOR ALUMNO */}
      {role === "alumno" && <MobileNavbarAlumno />}
      {role === "admin" && <MobileNavbarAdmin />}
    
    </div>
  );
}
