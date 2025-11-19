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
  { id: "home", label: t("sidebar.home"), icon: <FiHome size={16} /> },
  { id: "miscursos", label: t("sidebar.learning"), icon: <FiBookOpen size={16} /> },
  { id: "certificados", label: t("sidebar.certificates"), icon: <FiAward size={16} /> },
  { id: "gaming", label: t("sidebar.gaming"), icon: <FiTarget size={16} /> },
];

const chatSection = [
  {
    id: "chatbot",
    label: t("sidebar.chatbot"),
    icon: <FiMessageSquare size={16} />,
  },
  {
    id: "chat-history",
    label: t("sidebar.chatHistory"),
    icon: <FiClock size={16} />,
  },
];


const menuPersonal = [
  { id: "perfil", label: t("sidebar.profile"), icon: <FiUser size={16} /> },
  { id: "eventos", label: t("sidebar.events"), icon: <FiCalendar size={16} /> },
  { id: "mensajes", label: t("sidebar.messages"), icon: <FiMessageSquare size={16} /> },
];


  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* HEADER */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">
          {t("sidebar.headerTitle")}
        </h1>
        <p className="text-xs text-gray-500 mt-1">Portal del alumno</p>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto">
        <SectionTitle>{t("sidebar.campusSection")}</SectionTitle>
        <ul className="space-y-1 mb-6">
          {menuCampus.map((item) => (
            <SidebarButton
              key={item.id}
              id={item.id}
              icon={item.icon}
              label={item.label}
              active={section === item.id}
              onClick={() => setSection(item.id as any)}
            />
          ))}
        </ul>

        {/* CHAT */}
        <SectionTitle>{t("sidebar.chatSection")} </SectionTitle>
        <ul className="space-y-1 mb-6">
          {chatSection.map((item) => (
            <SidebarButton
              key={item.id}
              {...item}
              active={section === item.id}
              onClick={() => setSection(item.id as any)}
            />
          ))}
        </ul>


        {/* PERSONAL */}
        <SectionTitle>{t("sidebar.accountSection")}</SectionTitle>
        <ul className="space-y-1">
          {menuPersonal.map((item) => (
            <SidebarButton
              key={item.id}
              id={item.id}
              icon={item.icon}
              label={item.label}
              active={section === item.id}
              onClick={() => setSection(item.id as any)}
            />
          ))}
        </ul>
      </nav>

      {/* FOOTER */}
      <div className="border-t border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            {initials}
          </div>
          <div className="flex flex-col truncate">
            <span className="text-sm font-medium text-gray-800 truncate max-w-[150px]">
              {user?.email}
            </span>
            <span className="text-xs text-gray-500">Alumno</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium text-sm transition"
        >
          <FiLogOut size={16} />
          {t("sidebar.logout")}

        </button>

        <p className="text-xs text-gray-400 text-center mt-5">
          © {new Date().getFullYear()} Further Academy
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
}: {
  id: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
        active
          ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
          : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide px-4 mb-2 mt-1">
      {children}
    </p>
  );
}
