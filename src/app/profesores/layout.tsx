import MobileNavbarProfesor from "@/components/layout/MobileNavbarProfesor";
import SidebarProfesor from "@/components/layout/SidebarProfesor";
import { ProfesorProvider } from "@/contexts/ProfesorContext";
export default function ProfesorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProfesorProvider>
      <div className="min-h-screen bg-gray-50">
        <SidebarProfesor />
        <main className="lg:ml-72 min-h-screen">{children}</main>
        <MobileNavbarProfesor />
      </div>
    </ProfesorProvider>
  );
}