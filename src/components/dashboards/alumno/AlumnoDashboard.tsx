"use client";

import { useDashboardUI } from "@/stores/useDashboardUI";
import HomeDashboard from "../HomeDashboard";

import AlumnoCoursesPage from "./AlumnoCoursesPage";
import AlumnoHome from "./AlumnoHome";
import AlumnoCertificatesPage from "./AlumnoCertificatePage";
import AlumnoProfilePage from "./AlumnoProfilePage";
import GamingHub from "@/app/dashboard/gaming/page";
import ChatBox from "@/components/chat/ChatBox";
import ChatHistoryList from "@/components/chat/history/ChatHistoryList";
import ChatHistorySession from "@/components/chat/history/ChatHistorySession"; 
import AlumnoInfo from "./AlumnoInfo";
import { useAuth } from "@/contexts/AuthContext";

export default function AlumnoDashboard() {
  const { section } = useDashboardUI();
  const { user } = useAuth();

  switch (section) {
    case "home":
      return <AlumnoHome />;

    case "miscursos":
      return <AlumnoCoursesPage />;

    case "certificados":
      return <AlumnoCertificatesPage />;

    case "perfil":
      return <AlumnoProfilePage />;

    case "gaming":
      return <GamingHub />;

    case "chatbot":
      return <ChatBox />;

      case "chat-history":
        return <ChatHistoryList />;
      
      case "chat-session":
        return <ChatHistorySession />;

    case "infoimportante":
      return <AlumnoInfo userEmail={user?.email || ""} />;


    default:
      return <AlumnoHome />;
  }
}
