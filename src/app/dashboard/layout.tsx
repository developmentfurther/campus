import MobileNavbarAlumno from "@/components/layout/MobileNavbarAlumno";
import SidebarAlumno from "@/components/layout/SidebarAlumno";
import { GlobalPodcast } from "@/components/podcast/GlobalPodcast";
import { AlumnoProvider } from "@/contexts/AlumnoContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
     <AlumnoProvider>
      <div className="min-h-screen bg-gray-50">
        <SidebarAlumno />
        <main className="lg:ml-72 min-h-screen">{children}</main>
        <MobileNavbarAlumno />
        <GlobalPodcast />
      </div>
    </AlumnoProvider>
  );
}