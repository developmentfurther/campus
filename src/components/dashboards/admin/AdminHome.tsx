"use client";

import { useDashboardUI } from "@/stores/useDashboardUI";
import {
  FiUsers,
  FiBookOpen,
  FiBell,
  FiActivity,
  FiCalendar,
  FiMessageCircle,
  FiUser,
} from "react-icons/fi";

export default function AdminHome() {
  const { setSection } = useDashboardUI();

  const cards = [
    {
      id: "alumnos",
      label: "Students",
      desc: "Manage student profiles, academic progress, languages, and access settings.",
      extra: "Full access to student list, editing tools, and batch control.",
      icon: <FiUsers size={26} />,
      color: "bg-blue-50 text-blue-600",
    },
    {
      id: "material",
      label: "Academic Material",
      desc: "Create and manage courses, units, lessons, and examinations.",
      extra: "Control over content, videos, PDFs, closing sections, and evaluations.",
      icon: <FiBookOpen size={26} />,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      id: "profesores",
      label: "Teachers",
      desc: "Complete administration of the teaching staff.",
      extra: "Update profiles, languages, permissions, and access to materials.",
      icon: <FiActivity size={26} />,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      id: "anuncios",
      label: "Announcements",
      desc: "Publish global announcements segmented by language.",
      extra: "Instantly visible to students based on native language.",
      icon: <FiBell size={26} />,
      color: "bg-orange-50 text-orange-600",
    },
    {
      id: "chatbot",
      label: "AI Chat",
      desc: "Administrative view of the AI-powered conversational chat.",
      extra: "Monitor sessions, feedback, and linguistic behavior.",
      icon: <FiMessageCircle size={26} />,
      color: "bg-purple-50 text-purple-600",
    },
    {
      id: "perfil",
      label: "My Profile",
      desc: "Update your personal information and credentials.",
      extra: "Direct access to account settings and language preferences.",
      icon: <FiUser size={26} />,
      color: "bg-gray-100 text-gray-700",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8 space-y-10">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Quick access to the main management tools of the campus.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <FiCalendar size={16} />
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </div>
      </header>

      {/* DASHBOARD CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {cards.map((c, i) => (
          <button
            key={i}
            onClick={() => setSection(c.id)}
            className="cursor-pointer p-6 bg-white border border-gray-200 rounded-2xl shadow-sm 
            hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col gap-4 text-left"
          >
            <div
              className={`p-3 rounded-xl w-fit text-xl flex items-center justify-center ${c.color}`}
            >
              {c.icon}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900">{c.label}</h3>
              <p className="text-sm text-gray-600 mt-1">{c.desc}</p>
              <p className="text-xs text-gray-400 mt-2">{c.extra}</p>
            </div>
          </button>
        ))}
      </section>

      {/* FOOTER */}
      <footer className="text-center text-xs text-gray-400 pt-8 border-t border-gray-100">
        © {new Date().getFullYear()} Further Campus — Admin Panel
      </footer>
    </div>
  );
}
