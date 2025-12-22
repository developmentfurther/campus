"use client";

import { useDashboardUI } from "@/stores/useDashboardUI";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  FiHome,
  FiBookOpen,
  FiUsers,
  FiUser,
  FiLogOut,
  FiBell,
  FiTarget,
  FiMessageSquare,
  FiClock,
  FiZap,
} from "react-icons/fi";

export default function SidebarAdmin() {
  const { section, setSection } = useDashboardUI();
  const { user, logout } = useAuth();
  const router = useRouter();
  const initials = user?.email?.charAt(0).toUpperCase() ?? "A";

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  /* ============================================================
     🔹 SECCIONES DEL SIDEBAR ADMIN
     ============================================================ */

  const adminSection = [
    { id: "home", label: "Dashboard", icon: <FiHome size={20} /> },
    { id: "material", label: "Academic Material", icon: <FiBookOpen size={20} /> },
    { id: "alumnos", label: "Students", icon: <FiUsers size={20} /> },
    { id: "profesores", label: "Teachers", icon: <FiUser size={20} /> },
    { id: "anuncios", label: "Announcements", icon: <FiBell size={20} /> },
  ];

  const gamingSection = [
    { id: "gaming", label: "Gaming Hub", icon: <FiTarget size={20} /> },
  ];

  const chatSection = [
    { id: "chatbot", label: "AI Chat", icon: <FiMessageSquare size={20} /> },
    { id: "chat-history", label: "AI History", icon: <FiClock size={20} /> },
  ];

  const accountSection = [
    { id: "perfil", label: "Profile", icon: <FiUser size={20} /> },
  ];

  /* ============================================================
     🔹 RENDER (CLON DEL ALUMNO)
     ============================================================ */

  return (
    <aside className="hidden lg:flex w-72 bg-white border-r border-gray-100 flex-col h-screen relative overflow-hidden">

      {/* Fondo decorativo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#EE7203] opacity-5 rounded-full blur-3xl -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-32 left-0 w-40 h-40 bg-[#FF3816] opacity-5 rounded-full blur-3xl -translate-x-20"></div>

      {/* HEADER */}
      <div className="relative p-4 pb-4">
        <div className="absolute top-0 left-0 w-1 h-20 bg-gradient-to-b from-[#EE7203] via-[#FF3816] to-transparent rounded-r-full"></div>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-[#EE7203] rounded-full animate-pulse"></div>
          <div className="w-1.5 h-1.5 bg-[#FF3816] rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
          <div className="w-1 h-1 bg-[#EE7203] rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
        </div>

        <h1 className="text-2xl font-black text-[#0C212D] tracking-tight mb-1">
          Further Campus
        </h1>
        <p className="text-xs text-[#EE7203] font-bold uppercase tracking-wider">
          Admin Panel
        </p>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-4 py-2 overflow-y-auto relative z-10">

        {/* ADMINISTRACIÓN */}
        <SectionTitle icon={<FiZap size={12} />}>Administration</SectionTitle>
        <ul className="space-y-1 mb-4">
          {adminSection.map((item, idx) => (
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

        {/* GAMING */}
        <SectionTitle icon={<FiTarget size={12} />}>Gaming</SectionTitle>
        <ul className="space-y-2 mb-8">
          {gamingSection.map((item, idx) => (
            <SidebarButton
              key={item.id}
              {...item}
              active={section === item.id}
              onClick={() => setSection(item.id as any)}
              delay={idx * 50}
            />
          ))}
        </ul>

        {/* CHAT */}
        <SectionTitle icon={<FiMessageSquare size={12} />}>AI Tools</SectionTitle>
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
        <SectionTitle icon={<FiUser size={12} />}>Account</SectionTitle>
        <ul className="space-y-2">
          {accountSection.map((item, idx) => (
            <SidebarButton
              key={item.id}
              {...item}
              active={section === item.id}
              onClick={() => setSection(item.id as any)}
              delay={idx * 50}
            />
          ))}
        </ul>

      </nav>

      {/* FOOTER — IDENTICO AL DE ALUMNO */}
      <div className="relative border-t border-gray-100 p-5 z-10">
        <div className="bg-gradient-to-br from-[#0C212D] to-[#112C3E] rounded-2xl p-4 mb-4 
                        relative overflow-hidden group hover:shadow-xl transition-shadow duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-[#EE7203] opacity-10 rounded-full blur-2xl 
                          group-hover:opacity-20 transition-opacity"></div>

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#EE7203] to-[#FF3816] 
                            flex items-center justify-center font-black text-lg text-white shadow-lg relative">
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 
                              transition-opacity rounded-xl"></div>
              {initials}
            </div>

            <div className="flex flex-col truncate flex-1">
              <span className="text-sm font-bold text-white truncate">{user?.email}</span>
              <span className="text-xs text-gray-300 font-medium">Administrator</span>
            </div>
          </div>
        </div>

        {/* BOTÓN LOGOUT */}
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
          <span className="relative z-10">Log out</span>
        </button>

        <p className="text-[10px] text-gray-400 text-center mt-4 font-semibold tracking-wide">
          © {new Date().getFullYear()} Further Campus
        </p>
      </div>
    </aside>
  );
}

/* 🔹 COMPONENTES AUXILIARES — COPIADOS DEL ALUMNO */

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
    data-tutorial={id === "chat-history" ? "chat-history" : undefined}
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold 
        transition-all duration-300 group relative overflow-hidden
        ${
          active
            ? "bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white shadow-lg scale-[1.02]"
            : "text-[#0C212D] hover:bg-gray-50 hover:pl-6"
        }`}
    >
      {!active && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#EE7203] to-[#FF3816] 
                        opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
      )}

      <span className={`relative z-10 transition-all duration-300 ${
        active ? "" : "group-hover:rotate-12 group-hover:scale-110"
      }`}>
        {icon}
      </span>

      <span className="relative z-10 tracking-wide">{label}</span>

      {active && (
        <>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 
                           bg-white rounded-full animate-pulse"></div>
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-white opacity-40 
                           rounded-r-full"></div>
        </>
      )}

      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute top-0 -left-full h-full w-1/2 
                        bg-gradient-to-r from-transparent via-white to-transparent 
                        opacity-20 group-hover:left-full transition-all duration-700"></div>
      </div>
    </button>
  );
}

function SectionTitle({ children, icon }) {
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
