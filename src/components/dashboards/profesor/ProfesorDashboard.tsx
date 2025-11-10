"use client";

import { useDashboardUI } from "@/stores/useDashboardUI";
import ProfesorHomePage from "./ProfesorHomePage";
import ProfesorCoursesPage from "./ProfesorCoursesPage";
import ProfesorEntregasPage from "./ProfesorEntregasPage";

export default function ProfesorDashboard() {
  const { section } = useDashboardUI();

  switch (section) {
    case "home":
      return <ProfesorHomePage />;
    case "evaluaciones":
      return <ProfesorEntregasPage  />;
    // case "alumnos":
    //   return <ProfesorStudentsPage />;
    default:
      return <ProfesorHomePage />;
  }
}
