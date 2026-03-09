"use client";
import { useDashboardUI } from "@/stores/useDashboardUI";
import ProfesorHomePage from "@/features/profesor/ProfesorHomePage";
import ProfesorCoursesPage from "@/features/profesor/ProfesorCoursesPage";
import ProfesorPerfil from "@/features/profesor/ProfesorPerfil";

export default function ProfesorPage() {
  const { section } = useDashboardUI();

  switch (section) {
    case "home":   return <ProfesorHomePage />;
    case "cursos": return <ProfesorCoursesPage />;
    case "perfil": return <ProfesorPerfil />;
    default:       return <ProfesorHomePage />;
  }
}