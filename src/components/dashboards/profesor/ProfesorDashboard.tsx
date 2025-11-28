"use client";

import { useDashboardUI } from "@/stores/useDashboardUI";
import ProfesorHomePage from "./ProfesorHomePage";
import ProfesorCoursesPage from "./ProfesorCoursesPage";
import ProfesorPerfil from "./ProfesorPerfil";
// import ProfesorStudentsPage from "./ProfesorStudentsPage"; // futuro

export default function ProfesorDashboard() {
  const { section } = useDashboardUI();

  switch (section) {
    case "home":
      return <ProfesorHomePage />;


    case "cursos":
      return <ProfesorCoursesPage />;

    case "perfil":
      return <ProfesorPerfil />;

    default:
      return <ProfesorHomePage />;
  }
}
