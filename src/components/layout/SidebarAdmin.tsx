"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardUI } from "@/stores/useDashboardUI";
import {
  FiHome, FiBookOpen, FiUsers, FiUser,
  FiBell, FiTarget, FiMessageSquare, FiClock, FiZap,
} from "react-icons/fi";
import { SidebarButton, SectionTitle, SidebarFooter } from "./SidebarShared";

type SectionKey =
  | "home" | "material" | "alumnos" | "profesores" | "anuncios"
  | "gaming" | "chatbot" | "chat-history" | "perfil";

export default function SidebarAdmin() {
  const { user, logout } = useAuth();
  const { section, setSection } = useDashboardUI();
  const router = useRouter();
  const initials = user?.email?.charAt(0).toUpperCase() ?? "A";

  const isActive = (key: SectionKey) => section === key;
  const navigate = (key: SectionKey) => setSection(key);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const adminSection: Array<{ id: SectionKey; label: string; icon: React.ReactNode }> = [
    { id: "home",       label: "Dashboard",         icon: <FiHome size={20} /> },
    { id: "material",   label: "Academic Material", icon: <FiBookOpen size={20} /> },
    { id: "alumnos",    label: "Students",          icon: <FiUsers size={20} /> },
    { id: "profesores", label: "Teachers",          icon: <FiUser size={20} /> },
    { id: "anuncios",   label: "Announcements",     icon: <FiBell size={20} /> },
  ];

  const gamingSection: Array<{ id: SectionKey; label: string; icon: React.ReactNode }> = [
    { id: "gaming", label: "Gaming Hub", icon: <FiTarget size={20} /> },
  ];

  const chatSection: Array<{ id: SectionKey; label: string; icon: React.ReactNode }> = [
    { id: "chatbot",      label: "AI Chat",    icon: <FiMessageSquare size={20} /> },
    { id: "chat-history", label: "AI History", icon: <FiClock size={20} /> },
  ];

  const accountSection: Array<{ id: SectionKey; label: string; icon: React.ReactNode }> = [
    { id: "perfil", label: "Profile", icon: <FiUser size={20} /> },
  ];

  return (
    <aside className="hidden lg:flex fixed top-0 left-0 w-72  bg-white border-r border-gray-100 flex-col h-screen overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#EE7203] opacity-5 rounded-full blur-3xl -translate-y-16 translate-x-16" />
      <div className="absolute bottom-32 left-0 w-40 h-40 bg-[#FF3816] opacity-5 rounded-full blur-3xl -translate-x-20" />

      {/* HEADER */}
      <div className="relative p-6 pb-8">
        <div className="absolute top-0 left-0 w-1 h-20 bg-gradient-to-b from-[#EE7203] via-[#FF3816] to-transparent rounded-r-full" />
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-[#EE7203] rounded-full animate-pulse" />
          <div className="w-1.5 h-1.5 bg-[#FF3816] rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
          <div className="w-1 h-1 bg-[#EE7203] rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
        </div>
        <h1 className="text-2xl font-black text-[#0C212D] tracking-tight mb-1">Further Campus</h1>
        <p className="text-xs text-[#EE7203] font-bold uppercase tracking-wider">Admin Panel</p>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-4 py-2 overflow-y-auto relative z-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <SectionTitle icon={<FiZap size={12} />}>Administration</SectionTitle>
        <ul className="space-y-1 mb-4">
          {adminSection.map((item, idx) => (
            <SidebarButton key={item.id} {...item} active={isActive(item.id)} onClick={() => navigate(item.id)} delay={idx * 50} />
          ))}
        </ul>

        <SectionTitle icon={<FiTarget size={12} />}>Gaming</SectionTitle>
        <ul className="space-y-2 mb-8">
          {gamingSection.map((item, idx) => (
            <SidebarButton key={item.id} {...item} active={isActive(item.id)} onClick={() => navigate(item.id)} delay={idx * 50} />
          ))}
        </ul>

        <SectionTitle icon={<FiMessageSquare size={12} />}>AI Tools</SectionTitle>
        <ul className="space-y-2 mb-8">
          {chatSection.map((item, idx) => (
            <SidebarButton key={item.id} {...item} active={isActive(item.id)} onClick={() => navigate(item.id)} delay={idx * 50} />
          ))}
        </ul>

        <SectionTitle icon={<FiUser size={12} />}>Account</SectionTitle>
        <ul className="space-y-2">
          {accountSection.map((item, idx) => (
            <SidebarButton key={item.id} {...item} active={isActive(item.id)} onClick={() => navigate(item.id)} delay={idx * 50} />
          ))}
        </ul>
      </nav>

      <SidebarFooter email={user?.email} role="Administrator" initials={initials} onLogout={handleLogout} />
    </aside>
  );
}