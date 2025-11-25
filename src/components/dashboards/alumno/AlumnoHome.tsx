"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import {
  FiBookOpen,
  FiAward,
  FiBell,
  FiCalendar,
  FiTrendingUp,
} from "react-icons/fi";

export default function AlumnoHome() {
  const {
    user,
    misCursos,
    loadingCursos,
    recentActivity,
    loadingActivity,
  } = useAuth();

  const { t } = useI18n();

  /* --- Helper de tiempo --- */
  function timeAgo(date: Date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `hace ${days} día${days > 1 ? "s" : ""}`;
    if (hours > 0) return `hace ${hours} hora${hours > 1 ? "s" : ""}`;
    if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? "s" : ""}`;
    return "hace unos segundos";
  }

  /* === Loading global === */
  if (loadingCursos || loadingActivity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
        {t("dashboard.loading")}
      </div>
    );
  }

  /* === Placeholder anuncios === */
  const announcements = [
    {
      title: "Nuevo curso disponible: Comunicación efectiva",
      desc: "Ya puedes inscribirte al nuevo módulo impartido por la profesora García.",
      date: "Oct 20, 2025",
    },
  ];

  const firstName = user?.email?.split("@")[0] ?? "Alumno";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8 space-y-8">
      {/* ---------- HEADER ---------- */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t("dashboard.hello", { name: firstName })}
          </h1>
          <p className="text-gray-500 mt-1">
            {t("dashboard.welcome")}
          </p>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-500">
          <FiCalendar size={16} />
          {new Date().toLocaleDateString()}
        </div>
      </header>

      {/* ---------- CARDS RESUMEN ---------- */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <DashboardCard
          icon={<FiBookOpen />}
          label={t("dashboard.activeCourses")}
          value={misCursos.length}
          color="text-blue-600 bg-blue-50"
        />

        <DashboardCard
          icon={<FiAward />}
          label={t("dashboard.certificates")}
          value={0}
          color="text-yellow-600 bg-yellow-50"
        />
      </section>

      {/* ---------- ACTIVIDAD + ANUNCIOS ---------- */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* ACTIVIDAD */}
        <div className="xl:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <FiTrendingUp className="text-blue-500" />
            {t("dashboard.recentActivity")}
          </h2>

          {recentActivity.length === 0 ? (
            <p className="text-gray-500 text-sm">{t("dashboard.noActivity")}</p>
          ) : (
            <ul className="space-y-4">
              {recentActivity.map((a, i) => (
                <li
                  key={i}
                  className="border-b border-gray-100 pb-3 flex justify-between items-center text-sm"
                >
                  <span
                    className="text-gray-700"
                    dangerouslySetInnerHTML={{ __html: a.message }}
                  />

                  <span className="text-gray-400">{timeAgo(a.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ANUNCIOS */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <FiBell className="text-orange-500" />
            {t("dashboard.announcements")}
          </h2>

          {announcements.length === 0 ? (
            <p className="text-gray-500 text-sm">
              {t("dashboard.noAnnouncements")}
            </p>
          ) : (
            <ul className="space-y-5">
              {announcements.map((n, i) => (
                <li key={i} className="border-b border-gray-100 pb-3">
                  <p className="font-medium text-gray-800">{n.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{n.desc}</p>
                  <p className="text-xs text-gray-400 mt-2">{n.date}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-center text-xs text-gray-400 pt-8 border-t border-gray-100">
        © {new Date().getFullYear()} Further Campus — Campus Virtual
      </footer>
    </div>
  );
}

/* --- CARD --- */
function DashboardCard({ icon, label, value, color }: any) {
  return (
    <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
      <div className={`p-3 rounded-lg text-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}
