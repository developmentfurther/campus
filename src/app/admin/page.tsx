"use client";
import { useDashboardUI } from "@/stores/useDashboardUI";
import { useAuth } from "@/contexts/AuthContext";
import AdminHome from "@/features/admin/AdminHome";
import AdminCoursesPage from "@/features/admin/AdminCoursesPage";
import AlumnosPage from "@/features/admin/AlumnosPage";
import ProfesoresPage from "@/features/admin/ProfesoresPage";
import AdminAnunciosPage from "@/features/admin/AdminAnunciosPage";
import AdminProfilePage from "@/features/admin/AdminProfilePage";
import GamingHub from "@/features/gaming/GamingHub";
import ChatBox from "@/components/chat/ChatBox";
import ChatHistoryList from "@/components/chat/history/ChatHistoryList";
import ChatHistorySession from "@/components/chat/history/ChatHistorySession";

export default function AdminPage() {
  const { section } = useDashboardUI();

  switch (section) {
    case "home":          return <AdminHome />;
    case "material":      return <AdminCoursesPage />;
    case "alumnos":       return <AlumnosPage />;
    case "profesores":    return <ProfesoresPage />;
    case "anuncios":      return <AdminAnunciosPage />;
    case "perfil":        return <AdminProfilePage />;
    case "gaming":        return <GamingHub />;
    case "chatbot":       return <ChatBox />;
    case "chat-history":  return <ChatHistoryList />;
    case "chat-session":  return <ChatHistorySession />;
    default:              return <AdminHome />;
  }
}