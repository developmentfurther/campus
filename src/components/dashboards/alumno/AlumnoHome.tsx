"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { useDashboardUI } from "@/stores/useDashboardUI";
import {
  FiBookOpen,
  FiAward,
  FiBell,
  FiCalendar,
  FiTrendingUp,
  FiActivity,
  FiFileText,
  FiMessageSquare,
  FiSettings,
  FiArrowRight,
} from "react-icons/fi";

export default function AlumnoHome() {
  const {
    user,
    misCursos,
    loadingCursos,
    recentActivity,
    loadingActivity,
    userProfile,
    anuncios,
    loadingAnuncios,
  } = useAuth();

  const { t, lang } = useI18n();
  const { setSection } = useDashboardUI();

  // 🔥 Locale map para fechas en 5 idiomas
  const localeMap: Record<string, string> = {
    es: "es-ES",
    en: "en-US",
    pt: "pt-BR",
    it: "it-IT",
    fr: "fr-FR",
  };

  const locale = localeMap[lang] || "en-US";

  // Fecha formateada del header
  const formattedDate = new Date().toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Idioma del alumno (para anuncios)
  const idiomaAlumno = userProfile?.learningLanguage || "es";

  // Filtrar anuncios por idioma del alumno
  const anunciosFiltrados = anuncios.filter(
    (a) => a.idioma === idiomaAlumno && a.visible !== false
  );

  // Helper timeAgo internacionalizado
  function timeAgo(date: Date) {
    const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);

    const minutes = Math.floor(diffSeconds / 60);
    const hours = Math.floor(diffSeconds / 3600);
    const days = Math.floor(diffSeconds / 86400);

    if (days > 0) return t("dashboard.time.days", { count: days });
    if (hours > 0) return t("dashboard.time.hours", { count: hours });
    if (minutes > 0) return t("dashboard.time.minutes", { count: minutes });

    return t("dashboard.time.justNow");
  }

  // Loading global
  if (loadingCursos || loadingActivity || loadingAnuncios) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t("dashboard.loading")}</p>
        </div>
      </div>
    );
  }

  const firstName = user?.email?.split("@")[0] ?? "Alumno";

  // Accesos rápidos del dashboard
  const quickLinks = [
    {
      id: "miscursos",
      icon: <FiBookOpen />,
      title: t("quick.material"),
      description: t("quick.materialDesc"),
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      id: "certificados",
      icon: <FiAward />,
      title: t("quick.certificates"),
      description: t("quick.certificatesDesc"),
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600",
    },
    {
      id: "gaming",
      icon: <FiActivity />,
      title: t("quick.gaming"),
      description: t("quick.gamingDesc"),
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
    {
      id: "chatbot",
      icon: <FiMessageSquare />,
      title: t("quick.chat"),
      description: t("quick.chatDesc"),
      bgColor: "bg-pink-50",
      textColor: "text-pink-600",
    },
    {
      id: "chat-history",
      icon: <FiFileText />,
      title: t("quick.history"),
      description: t("quick.historyDesc"),
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      id: "perfil",
      icon: <FiSettings />,
      title: t("quick.profile"),
      description: t("quick.profileDesc"),
      bgColor: "bg-gray-50",
      textColor: "text-gray-600",
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">

        {/* ---------------- HEADER ---------------- */}
        <header className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-8 md:p-12 text-white shadow-xl">
          {/* Burbujas decorativas */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

            {/* Left – Saludo + Stats */}
            <div className="flex-1">

              <div className="flex items-center gap-2 text-orange-100 mb-3">
                <FiCalendar size={18} />
                <span className="text-sm font-medium">{formattedDate}</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-3">
                {t("dashboard.hello", { name: firstName })} 👋
              </h1>

              <p className="text-orange-100 text-lg max-w-2xl">
                {t("dashboard.welcomeFull")}
              </p>

              {/* Mini stats */}
              <div className="flex flex-wrap gap-6 mt-8">
                <CardStat
                  icon={<FiBookOpen size={20} />}
                  value={misCursos.length}
                  label={t("dashboard.activeCoursesLabel")}
                />
                <CardStat
                  icon={<FiAward size={20} />}
                  value={0}
                  label={t("dashboard.certificatesLabel")}
                />
              </div>
            </div>

            {/* Right – Idioma / Nivel */}
            <div className="flex flex-col gap-3 lg:min-w-[200px]">
              <InfoCard
                title={t("dashboard.language")}
                value={renderLanguage(userProfile?.learningLanguage)}
              />
              <InfoCard
                title={t("dashboard.level")}
                value={userProfile?.learningLevel || t("dashboard.unassigned")}
              />
            </div>

          </div>
        </header>

        {/* ---------------- ACCESOS RÁPIDOS ---------------- */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></span>
            {t("dashboard.quickTitle")}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((link) => (
              <QuickLinkCard key={link.id} link={link} onClick={() => setSection(link.id)} />
            ))}
          </div>
        </section>

        {/* ---------------- ANUNCIOS + ACTIVIDAD ---------------- */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ANUNCIOS */}
          <Announcements
            anunciosFiltrados={anunciosFiltrados}
            locale={locale}
            t={t}
          />

          {/* ACTIVIDAD */}
          <RecentActivity recentActivity={recentActivity} timeAgo={timeAgo} t={t} />

        </section>

        {/* ---------------- FOOTER ---------------- */}
        <footer className="text-center text-xs text-gray-400 pt-8 border-t border-gray-200">
          © {new Date().getFullYear()} {t("dashboard.footer")}
        </footer>

      </div>
    </div>
  );
}

/* =====================================================================
   🔹 Subcomponentes limpios y reutilizables
   ===================================================================== */

function CardStat({ icon, value, label }) {
  return (
    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
      <div className="bg-white/20 rounded-lg p-2">{icon}</div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-orange-100">{label}</p>
      </div>
    </div>
  );
}

function InfoCard({ title, value }) {
  return (
    <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20">
      <p className="text-xs text-orange-100 mb-1 uppercase tracking-wide">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function renderLanguage(code?: string) {
  const languages = {
    es: "🇪🇸 Español",
    en: "🇬🇧 English",
    pt: "🇧🇷 Portuguese",
    it: "🇮🇹 Italian",
    fr: "🇫🇷 French",
  };
  return languages[code ?? ""] || "🌍 N/A";
}

function QuickLinkCard({ link, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer text-left"
    >
      <div className={`${link.bgColor} ${link.textColor} w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-4`}>
        {link.icon}
      </div>

      <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-blue-600 transition-colors">
        {link.title}
      </h3>

      <p className="text-sm text-gray-500 mb-4">{link.description}</p>

      <div className="flex items-center text-blue-600 text-sm font-medium">
        <span className="group-hover:mr-2 transition-all duration-300">{link.title}</span>
        <FiArrowRight className="opacity-0 group-hover:opacity-100 transition-all duration-300" />
      </div>
    </button>
  );
}

function Announcements({ anunciosFiltrados, locale, t }) {
  return (
    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <div className="bg-orange-100 p-2 rounded-lg">
            <FiBell className="text-orange-500" size={20} />
          </div>
          {t("dashboard.announcements")}
        </h2>
        <span className="bg-orange-100 text-orange-600 text-xs font-semibold px-3 py-1 rounded-full">
          {anunciosFiltrados.length} {t("dashboard.announcementsNew")}
        </span>
      </div>

      {anunciosFiltrados.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiBell className="text-gray-400" size={24} />
          </div>
          <p className="text-gray-500">{t("dashboard.noAnnouncements")}</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {anunciosFiltrados.map((n) => (
            <div
              key={n.id}
              className="bg-gradient-to-r from-orange-50 to-transparent border-l-4 border-orange-500 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
            >
              <h3 className="font-semibold text-gray-800 mb-1">{n.titulo}</h3>
              <p className="text-sm text-gray-600 mb-2">{n.subtitulo}</p>

              <p className="text-xs text-gray-400">
                {n.creadoEn?.toDate?.().toLocaleDateString(locale, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecentActivity({ recentActivity, timeAgo, t }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
        <div className="bg-blue-100 p-2 rounded-lg">
          <FiTrendingUp className="text-blue-500" size={20} />
        </div>
        {t("dashboard.activity")}
      </h2>

      {recentActivity.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiTrendingUp className="text-gray-400" size={24} />
          </div>
          <p className="text-gray-500 text-sm">{t("dashboard.noActivity")}</p>
        </div>
      ) : (
        <ul className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {recentActivity.map((a, i) => (
            <li
              key={i}
              className="border-l-2 border-blue-200 pl-4 pb-4 hover:border-blue-500 transition-colors"
            >
              <p
                className="text-sm text-gray-700 mb-1"
                dangerouslySetInnerHTML={{ __html: a.message }}
              />
              <span className="text-xs text-gray-400">{timeAgo(a.date)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
