"use client";
import { useDashboardUI } from "@/stores/useDashboardUI";
import { useAuth } from "@/contexts/AuthContext";
import AlumnoHome from "@/features/alumno/AlumnoHome";
import AlumnoCoursesPage from "@/features/alumno/AlumnoCoursesPage";
import AlumnoCertificatesPage from "@/features/alumno/AlumnoCertificatePage";
import AlumnoProfilePage from "@/features/alumno/AlumnoProfilePage";
import GamingHub from "@/features/gaming/GamingHub";
import ChatBox from "@/components/chat/ChatBox";
import ChatHistoryList from "@/components/chat/history/ChatHistoryList";
import ChatHistorySession from "@/components/chat/history/ChatHistorySession";
import AlumnoInfo from "@/features/alumno/AlumnoInfo";
import PodcastSection from "@/components/podcast/PodcastSection";

export default function DashboardPage() {
  const { section } = useDashboardUI();
  const { user } = useAuth();

  switch (section) {
    case "home":          return <AlumnoHome />;
    case "miscursos":     return <AlumnoCoursesPage />;
    case "certificados":  return <AlumnoCertificatesPage />;
    case "perfil":        return <AlumnoProfilePage />;
    case "gaming":        return <GamingHub />;
    case "chatbot":       return <ChatBox />;
    case "chat-history":  return <ChatHistoryList />;
    case "chat-session":  return <ChatHistorySession />;
    case "infoimportante":return <AlumnoInfo userEmail={user?.email || ""} />;
    case "podcast":       return <PodcastSection />;
    default:              return <AlumnoHome />;
  }
}