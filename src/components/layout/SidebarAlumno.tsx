"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { useDashboardUI } from "@/stores/useDashboardUI";
import {
  FiHome, FiBookOpen, FiAward, FiUser,
  FiClock, FiMessageSquare, FiTarget, FiZap,
  FiInfo, FiHeadphones,
} from "react-icons/fi";
import { SidebarButton, SectionTitle, SidebarFooter } from "./SidebarShared";
import LanguageSwitcher from "../LanguageSwitcher";

type SectionKey =
  | "home" | "miscursos" | "certificados" | "infoimportante"
  | "gaming" | "chatbot" | "chat-history" | "podcast" | "perfil";

export default function SidebarAlumno() {
  const { t } = useI18n();
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

  const menuCampus: Array<{ id: SectionKey; label: string; icon: React.ReactNode }> = [
    { id: "home",            label: t("sidebar.home"),          icon: <FiHome size={20} /> },
    { id: "miscursos",       label: t("sidebar.learning"),      icon: <FiBookOpen size={20} /> },
    { id: "certificados",    label: t("sidebar.certificates"),  icon: <FiAward size={20} /> },
    { id: "infoimportante",  label: t("sidebar.importantinfo"), icon: <FiInfo size={20} /> },
    { id: "gaming",          label: t("sidebar.gaming"),        icon: <FiTarget size={20} /> },
  ];

  const chatSection: Array<{ id: SectionKey; label: string; icon: React.ReactNode }> = [
    { id: "chatbot",      label: t("sidebar.chatbot"),     icon: <FiMessageSquare size={20} /> },
    { id: "chat-history", label: t("sidebar.chatHistory"), icon: <FiClock size={20} /> },
  ];

  const menuMedia: Array<{ id: SectionKey; label: string; icon: React.ReactNode }> = [
    { id: "podcast", label: "Podcast", icon: <FiHeadphones size={20} /> },
  ];

  const menuPersonal: Array<{ id: SectionKey; label: string; icon: React.ReactNode }> = [
    { id: "perfil", label: t("sidebar.profile"), icon: <FiUser size={20} /> },
  ];

  return (
    <aside className="hidden lg:flex fixed top-0 left-0 w-72 z-[9999] bg-white border-r border-gray-100 flex-col h-screen overflow-hidden">
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
        <h1 className="text-2xl font-black text-[#0C212D] tracking-tight mb-1">
          {t("sidebar.headerTitle")}
        </h1>
        <p className="text-xs text-[#EE7203] font-bold uppercase tracking-wider">
          {t("sidebar.headerSubtitle")}
        </p>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-4 py-2 overflow-y-auto relative z-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <SectionTitle icon={<FiZap size={12} />}>{t("sidebar.campusSection")}</SectionTitle>
        <ul className="space-y-2 mb-8">
          {menuCampus.map((item, idx) => (
            <SidebarButton key={item.id} {...item} active={isActive(item.id)} onClick={() => navigate(item.id)} delay={idx * 50} />
          ))}
        </ul>

        <SectionTitle icon={<FiMessageSquare size={12} />}>{t("sidebar.chatSection")}</SectionTitle>
        <ul className="space-y-2 mb-8">
          {chatSection.map((item, idx) => (
            <SidebarButton key={item.id} {...item} active={isActive(item.id)} onClick={() => navigate(item.id)} delay={idx * 50} />
          ))}
        </ul>

        <SectionTitle icon={<FiHeadphones size={12} />}>Multimedia</SectionTitle>
        <ul className="space-y-2 mb-8">
          {menuMedia.map((item, idx) => (
            <SidebarButton key={item.id} {...item} active={isActive(item.id)} onClick={() => navigate(item.id)} delay={idx * 50} />
          ))}
        </ul>

        <SectionTitle icon={<FiUser size={12} />}>{t("sidebar.accountSection")}</SectionTitle>
        <ul className="space-y-2">
          {menuPersonal.map((item, idx) => (
            <SidebarButton key={item.id} {...item} active={isActive(item.id)} onClick={() => navigate(item.id)} delay={idx * 50} />
          ))}
        </ul>
      </nav>

        <LanguageSwitcher />  
      <SidebarFooter email={user?.email} role={t("sidebar.user")} initials={initials} onLogout={handleLogout} />
    </aside>
  );
}