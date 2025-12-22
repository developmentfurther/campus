"use client";

import { useDashboardUI } from "@/stores/useDashboardUI";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

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

const AdminSkeleton = () => (
  <div className="p-6 w-full h-full animate-pulse space-y-6">
    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
    <div className="h-4 bg-gray-100 rounded w-1/3"></div>
    
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
  const { dataReady } = useAuth();

  // Resetear a home al montar
  useEffect(() => {
    setSection("home");
  }, [setSection]);

  // Renderizado protegido para secciones que necesitan data
  const renderProtected = (Component: React.ReactNode) => {
    if (!dataReady) return <AdminSkeleton />;
    return Component;
  };

  switch (section) {
    case "home":
      return <AdminHome />;

    case "material":
      return renderProtected(<AdminCoursesPage />);

    case "alumnos":
      return renderProtected(<AlumnosPage />);

    case "profesores":
      return renderProtected(<ProfesoresPage />);

    case "gaming":
      return <GamingHub />;

    case "perfil":
      return <AdminProfilePage />;

    case "chatbot":
      return <ChatBox />;

    case "chat-history":
      return renderProtected(<ChatHistoryList />);

    case "chat-session":
      return <ChatHistorySession />;

    case "anuncios":
      return renderProtected(<AdminAnunciosPage />);

    default:
      return <AdminHome />;
  }
}