"use client";

import { useDashboardUI } from "@/stores/useDashboardUI";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

import AdminCoursesPage from "./AdminCoursesPage";
import AdminHome from "./AdminHome";
import AlumnosPage from "./AlumnosPage";
import ProfesoresPage from "./ProfesoresPage";
import GamingHub from "@/app/dashboard/gaming/page";
import AdminProfilePage from "./AdminProfilePage";
import ChatBox from "@/components/chat/ChatBox";
import ChatHistoryList from "@/components/chat/history/ChatHistoryList";
import ChatHistorySession from "@/components/chat/history/ChatHistorySession";
import AdminAnunciosPage from "./AdminAnunciosPage";
import Cookies from "js-cookie"; // 👈 Importamos js-cookie
import { useRouter } from "next/navigation";
// 👇 Un componente visual simple para simular carga (Skeleton)
// Puedes moverlo a tu carpeta de UI si prefieres
const AdminSkeleton = () => (
  <div className="p-6 w-full h-full animate-pulse space-y-6">
    {/* Header falso */}
    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
    <div className="h-4 bg-gray-100 rounded w-1/3"></div>
    
    {/* Tabla/Contenido falso */}
    <div className="border border-gray-100 bg-white rounded-lg p-4 h-[500px] w-full mt-6 shadow-sm">
      <div className="flex space-x-4 mb-4 border-b pb-4">
         <div className="h-10 w-32 bg-gray-100 rounded"></div>
         <div className="h-10 w-32 bg-gray-100 rounded"></div>
         <div className="h-10 w-full bg-gray-50 rounded"></div>
      </div>
      <div className="space-y-3">
         {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 bg-gray-50 rounded w-full"></div>
         ))}
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const { section, setSection } = useDashboardUI();
  const { dataReady, loading, user, role } = useAuth(); // 👈 Añade 'loading'
  const router = useRouter();
  const [is2faVerified, setIs2faVerified] = useState(false);
  const [checking, setChecking] = useState(true); // 👈 Nuevo estado

  // 1. RESETEAR A HOME
  useEffect(() => {
    setSection("home");
  }, []);

 // 2. 🔥 VALIDACIÓN CONTINUA DE COOKIE 2FA
  useEffect(() => {
    // Si no hay usuario o no es admin, no verificar (ProtectedRoute ya maneja esto)
    if (!user || role !== "admin") {
      setChecking(false);
      return;
    }

    const verifyCookie = () => {
      const cookie = Cookies.get("admin_2fa_valid");
      
      console.log("🔍 Verificando 2FA - Cookie:", cookie);

      if (!cookie || cookie !== "true") {
        console.log("❌ Sin cookie o expirada → Redirigiendo a /2fa");
        setIs2faVerified(false);
        router.replace("/2fa");
      } else {
        console.log("✅ Cookie válida");
        setIs2faVerified(true);
        setChecking(false);
      }
    };

    // Verificar inmediatamente
    verifyCookie();

    // 🔥 Verificar cada 5 segundos si la cookie sigue existiendo
    const interval = setInterval(() => {
      const cookie = Cookies.get("admin_2fa_valid");
      
      if (!cookie || cookie !== "true") {
        console.log("⚠️ Cookie 2FA expiró durante la sesión");
        clearInterval(interval);
        setIs2faVerified(false);
        router.replace("/2fa");
      }
    }, 5000); // Cada 5 segundos

    return () => clearInterval(interval);
  }, [user, role, router]);

  // 3. LOADING STATE
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#EE7203] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Verificando acceso seguro...</p>
        </div>
      </div>
    );
  }

  // 4. Si no está verificado 2FA, no mostrar nada (se está redirigiendo)
  if (!is2faVerified) {
    return null;
  }

  // 5. RENDERIZADO PROTEGIDO
  const renderProtected = (Component: React.ReactNode) => {
    if (!dataReady) return <AdminSkeleton />;
    return Component;
  };

  switch (section) {
    case "home":
      // El Home puede renderizar, pero sus widgets internos deberían manejar loading
      // O puedes bloquearlo también si prefieres que aparezca todo de golpe.
      return <AdminHome />;

    case "material": // Cursos -> Necesita allCursos
      return renderProtected(<AdminCoursesPage />);

    case "alumnos": // Alumnos -> PESADO -> Necesita alumnos
      return renderProtected(<AlumnosPage />);

    case "profesores": // Profesores -> Necesita profesores
      return renderProtected(<ProfesoresPage />);

    case "gaming":
      return <GamingHub />;

    case "perfil":
      return <AdminProfilePage />;

    case "chatbot":
      return <ChatBox />;

    case "chat-history":
      // El historial depende de dataReady para cargar sesiones
      return renderProtected(<ChatHistoryList />);

    case "chat-session":
      return <ChatHistorySession />;

    case "anuncios":
      return renderProtected(<AdminAnunciosPage />);

    default:
      return <AdminHome />;
  }
}