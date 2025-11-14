"use client";

import { useDashboardUI } from "@/stores/useDashboardUI";
import HomeDashboard from "../HomeDashboard";

import AlumnoCoursesPage from "./AlumnoCoursesPage";
import AlumnoHome from "./AlumnoHome";
import AlumnoCertificatesPage from "./AlumnoCertificatePage";
import AlumnoProfilePage from "./AlumnoProfilePage";
import GamingHub from "@/app/dashboard/gaming/page";
import ChatBox from "@/components/chat/ChatBox";

export default function AlumnoDashboard() {
  const { section } = useDashboardUI();

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

    default:
      return <HomeDashboard />;
  }
}
