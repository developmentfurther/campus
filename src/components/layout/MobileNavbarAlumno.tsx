"use client";

import { useState } from "react";
import { useDashboardUI } from "@/stores/useDashboardUI";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  FiHome,
  FiBookOpen,
  FiAward,
  FiUser,
  FiLogOut,
  FiMessageSquare,
  FiTarget,
  FiClock,
  FiZap,
  FiMenu,
  FiX,
  FiInfo
} from "react-icons/fi";
import { useI18n } from "@/contexts/I18nContext";

export default function MobileNavbarAlumno() {
  const { t } = useI18n();
  const { section, setSection } = useDashboardUI();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const initials = user?.email?.charAt(0).toUpperCase() ?? "A";

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleNavigation = (sectionId: string) => {
    setSection(sectionId as any);
    setIsOpen(false);
  };

  const menuCampus = [
    { id: "home", label: t("sidebar.home"), icon: <FiHome size={20} /> },
    { id: "miscursos", label: t("sidebar.learning"), icon: <FiBookOpen size={20} /> },
    { id: "certificados", label: t("sidebar.certificates"), icon: <FiAward size={20} /> },
    { id: "infoimportante", label: t("sidebar.importantinfo"), icon: <FiInfo size={20} /> },
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
    <>
      {/* NAVBAR SUPERIOR MOBILE */}
     <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-[0_-2px_8px_rgba(0,0,0,0.05)]">

        <div className="flex items-center justify-between px-4 py-3">
          
          {/* Logo + Brand */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-[#EE7203] rounded-full animate-pulse"></div>
              <div className="w-1.5 h-1.5 bg-[#FF3816] rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
              <div className="w-1.5 h-1.5 bg-[#EE7203] rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
            </div>
            <h1 className="text-lg font-black text-[#0C212D] tracking-tight">
              Further Campus
            </h1>
          </div>

          {/* Hamburger Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative w-10 h-10 bg-gradient-to-br from-[#EE7203] to-[#FF3816] rounded-xl flex items-center justify-center text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
          >
            {isOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </nav>

      {/* OVERLAY */}
      <div
        className={`lg:hidden fixed inset-0 bg-black z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-50 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* MENU LATERAL DESLIZABLE */}
      <aside
        className={`lg:hidden fixed top-0 right-0 bottom-0 w-80 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header del menú */}
        <div className="relative bg-gradient-to-br from-[#0C212D] via-[#112C3E] to-[#0C212D] p-6 text-white overflow-hidden">
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#EE7203] to-[#FF3816] opacity-20 rounded-full blur-2xl -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#FF3816] opacity-10 rounded-full blur-2xl -ml-12 -mb-12"></div>

          <div className="relative z-10">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <FiX size={20} />
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-[#EE7203] rounded-full animate-pulse"></div>
                <div className="w-1.5 h-1.5 bg-[#FF3816] rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-1.5 h-1.5 bg-[#EE7203] rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>

            <h1 className="text-xl font-black text-white tracking-tight mb-1">
              {t("sidebar.headerTitle")}
            </h1>
            <p className="text-xs text-[#EE7203] font-bold uppercase tracking-wider">
              {t("sidebar.headerSubtitle")}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto h-[calc(100vh-280px)]">
          
          {/* Campus Section */}
          <MobileSectionTitle icon={<FiZap size={12} />}>
            {t("sidebar.campusSection")}
          </MobileSectionTitle>
          <ul className="space-y-2 mb-6">
            {menuCampus.map((item) => (
              <MobileNavButton
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={section === item.id}
                onClick={() => handleNavigation(item.id)}
              />
            ))}
          </ul>

          {/* Chat Section */}
          <MobileSectionTitle icon={<FiMessageSquare size={12} />}>
            {t("sidebar.chatSection")}
          </MobileSectionTitle>
          <ul className="space-y-2 mb-6">
            {chatSection.map((item) => (
              <MobileNavButton
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={section === item.id}
                onClick={() => handleNavigation(item.id)}
              />
            ))}
          </ul>

          {/* Personal Section */}
          <MobileSectionTitle icon={<FiUser size={12} />}>
            {t("sidebar.accountSection")}
          </MobileSectionTitle>
          <ul className="space-y-2">
            {menuPersonal.map((item) => (
              <MobileNavButton
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={section === item.id}
                onClick={() => handleNavigation(item.id)}
              />
            ))}
          </ul>
        </nav>

        {/* Footer with user info */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 p-4 bg-white">
          <div className="bg-gradient-to-br from-[#0C212D] to-[#112C3E] rounded-xl p-3 mb-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#EE7203] opacity-10 rounded-full blur-xl"></div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#EE7203] to-[#FF3816] flex items-center justify-center font-black text-white shadow-md">
                {initials}
              </div>
              <div className="flex flex-col truncate flex-1">
                <span className="text-xs font-bold text-white truncate">
                  {user?.email}
                </span>
                <span className="text-[10px] text-gray-300 font-medium">
                  {t("sidebar.user")}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5
              bg-gradient-to-r from-[#EE7203] to-[#FF3816] hover:from-[#FF3816] hover:to-[#EE7203]
              rounded-lg text-white font-bold text-sm transition-all duration-300
              shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95
              relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <FiLogOut size={16} className="relative z-10" />
            <span className="relative z-10">{t("sidebar.logout")}</span>
          </button>
        </div>
      </aside>

      {/* Spacer para el contenido (evita que el navbar tape el contenido) */}
      <div className="lg:hidden h-14"></div>
    </>
  );
}

/* ===== COMPONENTES AUXILIARES ===== */

function MobileNavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all duration-300 group relative overflow-hidden ${
        active
          ? "bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white shadow-md"
          : "text-[#0C212D] hover:bg-gray-50"
      }`}
    >
      {!active && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#EE7203] to-[#FF3816] opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
      )}
      
      <span className={`relative z-10 transition-all duration-300 ${
        active ? "" : "group-hover:scale-110"
      }`}>
        {icon}
      </span>
      
      <span className="relative z-10">{label}</span>
      
      {active && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
      )}
    </button>
  );
}

function MobileSectionTitle({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
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