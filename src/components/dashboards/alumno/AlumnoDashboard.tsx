"use client";

import { useEffect } from "react";
import { useDashboardUI } from "@/stores/useDashboardUI";

import AlumnoCoursesPage from "./AlumnoCoursesPage";
import AlumnoHome from "./AlumnoHome";
import AlumnoCertificatesPage from "./AlumnoCertificatePage";
import AlumnoProfilePage from "./AlumnoProfilePage";
import GamingHub from "@/app/dashboard/gaming/page";
import ChatBox from "@/components/chat/ChatBox";
import ChatHistoryList from "@/components/chat/history/ChatHistoryList";
import ChatHistorySession from "@/components/chat/history/ChatHistorySession"; 
import AlumnoInfo from "./AlumnoInfo";
import PodcastSection from "@/components/podcast/PodcastSection";
import { useAuth } from "@/contexts/AuthContext";

export default function AlumnoDashboard() {
  // 👇 2. Extraemos también 'setSection'
  const { section, setSection } = useDashboardUI();
  const { user } = useAuth();

  /* ==========================================================
     🔥 FIX: Resetear al Home al montar el dashboard
     Esto asegura que siempre empiecen en el inicio al loguearse
     ========================================================== */
  useEffect(() => {
    setSection("home");
  }, []); // El array vacío [] asegura que solo corra 1 vez al inicio
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

      case "podcast":
        return <PodcastSection/>;


    default:
      return <AlumnoHome />;
  }
}
