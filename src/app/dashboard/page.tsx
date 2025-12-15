"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LoaderUi from "@/components/ui/LoaderUi";
import WelcomeVideoModal from "@/components/ui/WelcomeVideoModal";

import AdminDashboard from "@/components/dashboards/admin/AdminDashboard";
import ProfesorDashboard from "@/components/dashboards/profesor/ProfesorDashboard";
import AlumnoDashboard from "@/components/dashboards/alumno/AlumnoDashboard";

export default function DashboardPage() {
  const { user, role, authReady, loading, loggingOut } = useAuth();
  const router = useRouter();

  // 🔒 Redirige al login si no hay sesión
  useEffect(() => {
    if (authReady && !user) router.replace("/login");
  }, [authReady, user, router]);

  if (loggingOut) {
    return <LoaderUi />;
  }

  if (!authReady || loading) {
    return <LoaderUi />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        No hay usuario autenticado.
      </div>
    );
  }

  // 🎬 Función para renderizar el dashboard según el rol
  const renderDashboard = () => {
    if (role === "admin") return <AdminDashboard />;
    if (role === "profesor") return <ProfesorDashboard />;
    if (role === "alumno") return <AlumnoDashboard />;
    
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400">
        Rol no reconocido.
      </div>
    );
  };

  return (
    <>
      {/* 🎥 Modal de video de bienvenida - SE MUESTRA PARA TODOS LOS ROLES */}
      <WelcomeVideoModal 
        videoUrl="https://player.vimeo.com/video/1146030268" // 👈 Reemplaza con tu video
        autoShow={true} 
      />
      
      {/* 📊 Dashboard específico según rol */}
      {renderDashboard()}
    </>
  );
}