"use client";

import { useState } from "react";
import { useDashboardUI } from "@/stores/useDashboardUI";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

import {
  FiHome,
  FiBookOpen,
  FiUsers,
  FiUser,
  FiBell,
  FiTarget,
  FiMessageSquare,
  FiClock,
  FiMenu,
  FiX,
  FiLogOut,
} from "react-icons/fi";

export default function MobileNavbarAdmin() {
  const { section, setSection } = useDashboardUI();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const initials = user?.email?.charAt(0).toUpperCase() ?? "A";

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleNavigation = (id: string) => {
    setSection(id as any);
    setIsOpen(false);
  };

  /* ==========================================================
     🔹 SECCIONES DEL ADMIN
     ========================================================== */
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

  /* ==========================================================
     🔹 NAVBAR INFERIOR
     ========================================================== */
  return (
    <>
      {/* NAVBAR INFERIOR MOBILE */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-[0_-2px_8px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between px-4 py-3">

          {/* LOGO */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-[#EE7203] rounded-full animate-pulse"></div>
              <div className="w-1.5 h-1.5 bg-[#FF3816] rounded-full animate-pulse" style={{ animationDelay: ".2s" }}></div>
              <div className="w-1.5 h-1.5 bg-[#EE7203] rounded-full animate-pulse" style={{ animationDelay: ".4s" }}></div>
            </div>

            <h1 className="text-lg font-black text-[#0C212D] tracking-tight">
              Admin Panel
            </h1>
          </div>

          {/* BOTÓN HAMBURGUESA */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative w-10 h-10 bg-gradient-to-br from-[#EE7203] to-[#FF3816] 
                       rounded-xl flex items-center justify-center text-white 
                       shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
          >
            {isOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </nav>

      {/* OVERLAY */}
      <div
        className={`lg:hidden fixed inset-0 bg-black z-40 transition-opacity duration-300 
          ${isOpen ? "opacity-50 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsOpen(false)}
      />

      {/* MENÚ DESLIZABLE */}
      <aside
        className={`lg:hidden fixed top-0 right-0 bottom-0 w-80 bg-white z-50 shadow-2xl 
          transform transition-transform duration-300 ease-out 
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* HEADER */}
        <div className="relative bg-gradient-to-br from-[#0C212D] via-[#112C3E] to-[#0C212D] p-6 text-white overflow-hidden">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center 
                       text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <FiX size={20} />
          </button>

          <div className="flex gap-1 mb-4">
            <div className="w-1.5 h-1.5 bg-[#EE7203] rounded-full animate-pulse"></div>
            <div className="w-1.5 h-1.5 bg-[#FF3816] rounded-full animate-pulse" style={{ animationDelay: ".2s" }}></div>
            <div className="w-1.5 h-1.5 bg-[#EE7203] rounded-full animate-pulse" style={{ animationDelay: ".4s" }}></div>
          </div>

          <h1 className="text-xl font-black tracking-tight mb-1">Admin Panel</h1>
          <p className="text-xs text-[#EE7203] font-bold uppercase tracking-wider">Further Campus</p>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto h-[calc(100vh-280px)]">
          <MobileSectionTitle>Administration</MobileSectionTitle>
          <ul className="space-y-2 mb-6">
            {adminSection.map((item) => (
              <MobileNavButton
                key={item.id}
                {...item}
                active={section === item.id}
                onClick={() => handleNavigation(item.id)}
              />
            ))}
          </ul>

          <MobileSectionTitle>Gaming</MobileSectionTitle>
          <ul className="space-y-2 mb-6">
            {gamingSection.map((item) => (
              <MobileNavButton
                key={item.id}
                {...item}
                active={section === item.id}
                onClick={() => handleNavigation(item.id)}
              />
            ))}
          </ul>

          <MobileSectionTitle>AI Tools</MobileSectionTitle>
          <ul className="space-y-2 mb-6">
            {chatSection.map((item) => (
              <MobileNavButton
                key={item.id}
                {...item}
                active={section === item.id}
                onClick={() => handleNavigation(item.id)}
              />
            ))}
          </ul>

          <MobileSectionTitle>Account</MobileSectionTitle>
          <ul className="space-y-2">
            {accountSection.map((item) => (
              <MobileNavButton
                key={item.id}
                {...item}
                active={section === item.id}
                onClick={() => handleNavigation(item.id)}
              />
            ))}
          </ul>
        </nav>

        {/* FOOTER */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 p-4 bg-white">
          <div className="bg-gradient-to-br from-[#0C212D] to-[#112C3E] rounded-xl p-3 mb-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#EE7203] opacity-10 rounded-full blur-xl"></div>

            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#EE7203] to-[#FF3816] flex items-center justify-center font-black text-white shadow-md">
                {initials}
              </div>

              <div className="flex flex-col truncate flex-1">
                <span className="text-xs font-bold text-white truncate">{user?.email}</span>
                <span className="text-[10px] text-gray-300 font-medium">Administrator</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5
                       bg-gradient-to-r from-[#EE7203] to-[#FF3816] hover:from-[#FF3816] hover:to-[#EE7203]
                       rounded-lg text-white font-bold text-sm transition-all duration-300
                       shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95"
          >
            <FiLogOut size={16} />
            Log Out
          </button>
        </div>
      </aside>

      {/* SPACER */}
      <div className="lg:hidden h-14"></div>
    </>
  );
}

/* ==========================================================
   🔹 COMPONENTES AUXILIARES
   ========================================================== */

function MobileNavButton({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold 
        transition-all duration-300 group relative overflow-hidden
        ${active ? "bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white shadow-md"
                 : "text-[#0C212D] hover:bg-gray-50"}`}
    >
      {!active && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#EE7203] to-[#FF3816] opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
      )}

      <span className={`${active ? "" : "group-hover:scale-110"} relative z-10 transition-all`}>
        {icon}
      </span>

      <span className="relative z-10">{label}</span>

      {active && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
      )}
    </button>
  );
}

function MobileSectionTitle({ children }) {
  return (
    <p className="text-[10px] uppercase text-[#112C3E] font-black tracking-widest opacity-70 px-4 mb-3 mt-2 flex items-center gap-2">
      {children}
      <span className="flex-1 h-px bg-gradient-to-r from-[#EE7203] to-transparent opacity-20"></span>
    </p>
  );
}
