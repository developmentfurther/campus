// src/components/layout/SidebarShared.tsx
"use client";

import { FiLogOut } from "react-icons/fi";

export function SidebarButton({
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
        ${active
          ? "bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white shadow-lg scale-[1.02]"
          : "text-[#0C212D] hover:bg-gray-50 hover:pl-6"
        }`}
    >
      {!active && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#EE7203] to-[#FF3816] opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
      )}
      <span className={`relative z-10 transition-all duration-300 ${active ? "" : "group-hover:rotate-12 group-hover:scale-110"}`}>
        {icon}
      </span>
      <span className="relative z-10 tracking-wide">{label}</span>
      {active && (
        <>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-white opacity-40 rounded-r-full" />
        </>
      )}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 group-hover:left-full transition-all duration-700" />
      </div>
    </button>
  );
}

export function SectionTitle({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-4 mb-3 mt-2">
      <span className="text-[#FF3816]">{icon}</span>
      <p className="text-[10px] uppercase text-[#112C3E] font-black tracking-widest opacity-70">
        {children}
      </p>
      <div className="flex-1 h-px bg-gradient-to-r from-[#EE7203] to-transparent opacity-20" />
    </div>
  );
}

export function SidebarFooter({
  email,
  role,
  initials,
  onLogout,
}: {
  email?: string | null;
  role: string;
  initials: string;
  onLogout: () => void;
}) {
  return (
    <div className="relative border-t border-gray-100 p-5 z-10">
      <div className="bg-gradient-to-br from-[#0C212D] to-[#112C3E] rounded-2xl p-4 mb-4 relative overflow-hidden group hover:shadow-xl transition-shadow duration-300">
        <div className="absolute top-0 right-0 w-20 h-20 bg-[#EE7203] opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#EE7203] to-[#FF3816] flex items-center justify-center font-black text-lg text-white shadow-lg relative">
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity rounded-xl" />
            {initials}
          </div>
          <div className="flex flex-col truncate flex-1">
            <span className="text-sm font-bold text-white truncate">{email}</span>
            <span className="text-xs text-gray-300 font-medium">{role}</span>
          </div>
        </div>
      </div>

      <button
        onClick={onLogout}
        className="flex items-center justify-center gap-2 w-full px-4 py-3
          bg-gradient-to-r from-[#EE7203] to-[#FF3816] hover:from-[#FF3816] hover:to-[#EE7203]
          rounded-xl text-white font-bold text-sm transition-all duration-300
          shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95
          relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
        <FiLogOut size={18} className="relative z-10" />
        <span className="relative z-10">Log out</span>
      </button>

      <p className="text-[10px] text-gray-400 text-center mt-4 font-semibold tracking-wide">
        © {new Date().getFullYear()} Further Campus
      </p>
    </div>
  );
}