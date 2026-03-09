import MobileNavbarAdmin from "@/components/layout/MobileNavbarAdmin";
import SidebarAdmin from "@/components/layout/SidebarAdmin";
import { AdminProvider } from "@/contexts/AdminContext";
import { UsersProvider } from "@/contexts/UserContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProvider>
      <UsersProvider>
        <div className="min-h-screen bg-gray-50">
          <SidebarAdmin />
          <main className="lg:ml-72 min-h-screen">{children}</main>
          <MobileNavbarAdmin />
        </div>
      </UsersProvider>
    </AdminProvider>
  );
}