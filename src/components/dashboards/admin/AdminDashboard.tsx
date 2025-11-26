"use client";

import { useDashboardUI } from "@/stores/useDashboardUI";
import { useAuth } from "@/contexts/AuthContext";

import HomeDashboard from "../HomeDashboard";
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

export default function AdminDashboard() {
  const { section } = useDashboardUI();
  const { userProfile } = useAuth(); // ← por si lo necesitás luego

  switch (section) {
    case "home":
      return <AdminHome />;

    case "material":
      return <AdminCoursesPage />;

    case "alumnos":
      return <AlumnosPage />;

    case "profesores":
      return <ProfesoresPage />;

    case "gaming":
      return <GamingHub />;

    case "perfil":
      return <AdminProfilePage />;

    case "chatbot":
      return <ChatBox />;

    case "chat-history":
      return <ChatHistoryList />;

    case "chat-session":
      return <ChatHistorySession />;

    case "anuncios":
      return <AdminAnunciosPage />;
    default:
      return <HomeDashboard />;
  }
}
