"use client";

import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute"; // 👈 Importamos el guardián

// Layouts
import SidebarAdmin from "@/components/layout/SidebarAdmin";
import SidebarProfesor from "@/components/layout/SidebarProfesor";
import SidebarAlumno from "@/components/layout/SidebarAlumno";

import MobileNavbarAlumno from "@/components/layout/MobileNavbarAlumno";
import MobileNavbarAdmin from "@/components/layout/MobileNavbarAdmin";
import MobileNavbarProfesor from "@/components/layout/MobileNavbarProfesor";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Solo necesitamos el role para decidir qué sidebar mostrar.
  // La protección de "si está logueado o no" la hace el componente padre.
  const { role } = useAuth();

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
    // 🔥 Envolvemos todo en ProtectedRoute. 
    // Si no hay usuario, este componente NUNCA renderizará el div de abajo,
    // sino que redirigirá al login inmediatamente.
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        
        {renderSidebar()}
        
        <main className="flex-1 overflow-y-auto p-6">
            {children}
        </main>

        {/* MOBILE NAV */}
        {role === "alumno" && <MobileNavbarAlumno />}
        {role === "admin" && <MobileNavbarAdmin />}
        {role === "profesor" && <MobileNavbarProfesor />}
      
      </div>
    </ProtectedRoute>
  );
}