"use client";

import { useDashboardUI } from "@/stores/useDashboardUI";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  FiHome,
  FiBookOpen,
  FiAward,
  FiUser,
  FiLogOut,
  FiCalendar,
  FiMessageSquare,
  FiTarget,
  FiClock,
  FiZap,
} from "react-icons/fi";
import { useI18n } from "@/contexts/I18nContext";

export default function SidebarAlumno() {
  const { t } = useI18n();
  const { section, setSection } = useDashboardUI();
  const { user, logout } = useAuth();
  const router = useRouter();
  const initials = user?.email?.charAt(0).toUpperCase() ?? "A";

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const menuCampus = [
    { id: "home", label: t("sidebar.home"), icon: <FiHome size={20} /> },
    { id: "miscursos", label: t("sidebar.learning"), icon: <FiBookOpen size={20} /> },
    { id: "certificados", label: t("sidebar.certificates"), icon: <FiAward size={20} /> },
    { id: "gaming", label: t("sidebar.gaming"), icon: <FiTarget size={20} /> },
  ];

  const chatSection = [
    {
      id: "chatbot",
      label: t("sidebar.chatbot"),
      icon: <FiMessageSquare size={20} />,
    },
    {
      id: "chat-history",
      label: t("sidebar.chatHistory"),
      icon: <FiClock size={20} />,
    },
  ];

  const menuPersonal = [
    { id: "perfil", label: t("sidebar.profile"), icon: <FiUser size={20} /> },
  ];

  return (
    <aside className="w-72 bg-white border-r border-gray-100 flex flex-col h-screen relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#EE7203] opacity-5 rounded-full blur-3xl -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-32 left-0 w-40 h-40 bg-[#FF3816] opacity-5 rounded-full blur-3xl -translate-x-20"></div>
      
      {/* HEADER */}
      <div className="relative p-6 pb-8">
        <div className="absolute top-0 left-0 w-1 h-20 bg-gradient-to-b from-[#EE7203] via-[#FF3816] to-transparent rounded-r-full"></div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-[#EE7203] rounded-full animate-pulse"></div>
          <div className="w-1.5 h-1.5 bg-[#FF3816] rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
          <div className="w-1 h-1 bg-[#EE7203] rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
        </div>
        <h1 className="text-2xl font-black text-[#0C212D] tracking-tight mb-1">
          {t("sidebar.headerTitle")}
        </h1>
        <p className="text-xs text-[#EE7203] font-bold uppercase tracking-wider">
          {t("sidebar.headerSubtitle")}
        </p>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-4 py-2 overflow-y-auto relative z-10">
        <SectionTitle icon={<FiZap size={12} />}>
          {t("sidebar.campusSection")}
        </SectionTitle>
        <ul className="space-y-2 mb-8">
          {menuCampus.map((item, idx) => (
            <SidebarButton
              key={item.id}
              id={item.id}
              icon={item.icon}
              label={item.label}
              active={section === item.id}
              onClick={() => setSection(item.id as any)}
              delay={idx * 50}
            />
          ))}
        </ul>

        {/* CHAT */}
        <SectionTitle icon={<FiMessageSquare size={12} />}>
          {t("sidebar.chatSection")}
        </SectionTitle>
        <ul className="space-y-2 mb-8">
          {chatSection.map((item, idx) => (
            <SidebarButton
              key={item.id}
              {...item}
              active={section === item.id}
              onClick={() => setSection(item.id as any)}
              delay={idx * 50}
            />
          ))}
        </ul>

        {/* PERSONAL */}
        <SectionTitle icon={<FiUser size={12} />}>
          {t("sidebar.accountSection")}
        </SectionTitle>
        <ul className="space-y-2">
          {menuPersonal.map((item, idx) => (
            <SidebarButton
              key={item.id}
              id={item.id}
              icon={item.icon}
              label={item.label}
              active={section === item.id}
              onClick={() => setSection(item.id as any)}
              delay={idx * 50}
            />
          ))}
        </ul>
      </nav>

      {/* FOOTER */}
      <div className="relative border-t border-gray-100 p-5 z-10">
        <div className="bg-gradient-to-br from-[#0C212D] to-[#112C3E] rounded-2xl p-4 mb-4 relative overflow-hidden group hover:shadow-xl transition-shadow duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-[#EE7203] opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity"></div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#EE7203] to-[#FF3816] flex items-center justify-center font-black text-lg text-white shadow-lg relative">
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity rounded-xl"></div>
              {initials}
            </div>
            <div className="flex flex-col truncate flex-1">
              <span className="text-sm font-bold text-white truncate">
                {user?.email}
              </span>
              <span className="text-xs text-gray-300 font-medium">
                {t("sidebar.user")}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full px-4 py-3
            bg-gradient-to-r from-[#EE7203] to-[#FF3816] hover:from-[#FF3816] hover:to-[#EE7203]
            rounded-xl text-white font-bold text-sm transition-all duration-300
            shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95
            relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
          <FiLogOut size={18} className="relative z-10" />
          <span className="relative z-10">{t("sidebar.logout")}</span>
        </button>

        <p className="text-[10px] text-gray-400 text-center mt-4 font-semibold tracking-wide">
          © {new Date().getFullYear()} Further Campus
        </p>
      </div>
    </aside>
  );
}

/* 🔹 COMPONENTES AUXILIARES */

function SidebarButton({
  id,
  icon,
  label,
  active,
  onClick,
  delay = 0,
}: {
  id: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  delay?: number;
}) {
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 group relative overflow-hidden ${
        active
          ? "bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white shadow-lg scale-[1.02]"
          : "text-[#0C212D] hover:bg-gray-50 hover:pl-6"
      }`}
    >
      {/* Animated background on hover */}
      {!active && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#EE7203] to-[#FF3816] opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
      )}
      
      {/* Icon with rotation effect */}
      <span className={`relative z-10 transition-all duration-300 ${
        active ? "" : "group-hover:rotate-12 group-hover:scale-110"
      }`}>
        {icon}
      </span>
      
      {/* Label */}
      <span className="relative z-10 tracking-wide">{label}</span>
      
      {/* Active indicator */}
      {active && (
        <>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-white opacity-40 rounded-r-full"></div>
        </>
      )}
      
      {/* Hover shine effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 group-hover:left-full transition-all duration-700"></div>
      </div>
    </button>
  );
}

function SectionTitle({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-4 mb-3 mt-2">
      <span className="text-[#FF3816]">{icon}</span>
      <p className="text-[10px] uppercase text-[#112C3E] font-black tracking-widest opacity-70">
        {children}
      </p>
      <div className="flex-1 h-px bg-gradient-to-r from-[#EE7203] to-transparent opacity-20"></div>
    </div>
  );
}