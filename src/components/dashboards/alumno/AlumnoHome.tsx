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
  FiZap,
  FiTarget,
  FiClock,
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

  const localeMap: Record<string, string> = {
    es: "es-ES",
    en: "en-US",
    pt: "pt-BR",
    it: "it-IT",
    fr: "fr-FR",
  };

  const locale = localeMap[lang] || "en-US";

  const formattedDate = new Date().toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const idiomaAlumno = userProfile?.learningLanguage || "es";

  const anunciosFiltrados = anuncios.filter(
    (a) => a.idioma === idiomaAlumno && a.visible !== false
  );

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

  if (loadingCursos || loadingActivity || loadingAnuncios) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#EE7203] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#0C212D] font-semibold">{t("dashboard.loading")}</p>
        </div>
      </div>
    );
  }

  const firstName = user?.email?.split("@")[0] ?? "Alumno";

  const quickLinks = [
    {
      id: "miscursos",
      icon: <FiBookOpen />,
      title: t("quick.material"),
      description: t("quick.materialDesc"),
      gradient: "from-[#EE7203] to-[#FF3816]",
    },
    {
      id: "certificados",
      icon: <FiAward />,
      title: t("quick.certificates"),
      description: t("quick.certificatesDesc"),
      gradient: "from-[#FF3816] to-[#EE7203]",
    },
    {
      id: "gaming",
      icon: <FiTarget />,
      title: t("quick.gaming"),
      description: t("quick.gamingDesc"),
      gradient: "from-[#0C212D] to-[#112C3E]",
    },
    {
      id: "chatbot",
      icon: <FiMessageSquare />,
      title: t("quick.chat"),
      description: t("quick.chatDesc"),
      gradient: "from-[#112C3E] to-[#0C212D]",
    },
    {
      id: "chat-history",
      icon: <FiClock />,
      title: t("quick.history"),
      description: t("quick.historyDesc"),
      gradient: "from-[#EE7203] to-[#FF3816]",
    },
    {
      id: "perfil",
      icon: <FiSettings />,
      title: t("quick.profile"),
      description: t("quick.profileDesc"),
      gradient: "from-[#0C212D] to-[#112C3E]",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">

        {/* ---------------- HEADER ---------------- */}
        <header className="relative overflow-hidden bg-gradient-to-br from-[#0C212D] via-[#112C3E] to-[#0C212D] rounded-3xl p-8 md:p-12 text-white shadow-2xl">
          
          {/* Elementos decorativos */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#EE7203] to-[#FF3816] opacity-10 rounded-full blur-3xl -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#FF3816] opacity-10 rounded-full blur-3xl -ml-36 -mb-36"></div>
          
          {/* Patrón de puntos */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'radial-gradient(circle, #EE7203 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">

            {/* Left – Saludo + Stats */}
            <div className="flex-1">

              <div className="flex items-center gap-3 mb-6">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-[#EE7203] rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-[#FF3816] rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-[#EE7203] rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-[#EE7203] via-[#FF3816] to-transparent max-w-xs"></div>
              </div>

              <div className="flex items-center gap-3 text-gray-300 mb-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                  <FiCalendar size={18} className="text-[#EE7203]" />
                </div>
                <span className="text-sm font-bold tracking-wide">{formattedDate}</span>
              </div>

              <h1 className="text-4xl md:text-6xl font-black mb-4 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                {t("dashboard.hello", { name: firstName })}
              </h1>

              <p className="text-gray-300 text-lg max-w-2xl leading-relaxed font-medium">
                {t("dashboard.welcomeFull")}
              </p>

              {/* Mini stats con diseño moderno */}
              <div className="flex flex-wrap gap-4 mt-10">
                <StatsCard
                  icon={<FiBookOpen size={24} />}
                  value={misCursos.length}
                  label={t("dashboard.activeCoursesLabel")}
                  gradient="from-[#EE7203] to-[#FF3816]"
                />
                <StatsCard
                  icon={<FiAward size={24} />}
                  value={0}
                  label={t("dashboard.certificatesLabel")}
                  gradient="from-[#FF3816] to-[#EE7203]"
                />
              </div>
            </div>

            {/* Right – Idioma / Nivel */}
            <div className="flex flex-col gap-4 lg:min-w-[240px]">
              <ProfileInfoCard
                title={t("dashboard.language")}
                value={renderLanguage(userProfile?.learningLanguage)}
                icon={<FiZap size={18} />}
              />
              <ProfileInfoCard
                title={t("dashboard.level")}
                value={userProfile?.learningLevel || t("dashboard.unassigned")}
                icon={<FiTrendingUp size={18} />}
              />
            </div>

          </div>
        </header>

        {/* ---------------- ACCESOS RÁPIDOS ---------------- */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-12 bg-gradient-to-b from-[#EE7203] to-[#FF3816] rounded-full"></div>
            <h2 className="text-3xl font-black text-[#0C212D]">
              {t("dashboard.quickTitle")}
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickLinks.map((link) => (
              <QuickAccessCard key={link.id} link={link} onClick={() => setSection(link.id)} />
            ))}
          </div>
        </section>

        {/* ---------------- ANUNCIOS + ACTIVIDAD ---------------- */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ANUNCIOS */}
          <AnnouncementsSection
            anunciosFiltrados={anunciosFiltrados}
            locale={locale}
            t={t}
          />

          {/* ACTIVIDAD */}
          <ActivitySection recentActivity={recentActivity} timeAgo={timeAgo} t={t} />

        </section>

        {/* ---------------- FOOTER ---------------- */}
        <footer className="text-center text-xs text-gray-400 pt-12 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-1 h-1 bg-[#EE7203] rounded-full"></div>
            <div className="w-1 h-1 bg-[#FF3816] rounded-full"></div>
            <div className="w-1 h-1 bg-[#EE7203] rounded-full"></div>
          </div>
          <p className="font-semibold">© {new Date().getFullYear()} {t("dashboard.footer")}</p>
        </footer>

      </div>
    </div>
  );
}

/* =====================================================================
   🔹 Subcomponentes modernos
   ===================================================================== */

function StatsCard({ icon, value, label, gradient }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer min-w-[180px]`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>
      <div className="relative z-10 flex items-center gap-4">
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div>
          <p className="text-3xl font-black">{value}</p>
          <p className="text-xs text-white/80 font-semibold uppercase tracking-wide">{label}</p>
        </div>
      </div>
    </div>
  );
}

function ProfileInfoCard({ title, value, icon }) {
  return (
    <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:bg-white/15 transition-all duration-300 group overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 bg-[#EE7203] opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="text-[#EE7203]">{icon}</div>
          <p className="text-xs text-gray-300 uppercase tracking-widest font-bold">{title}</p>
        </div>
        <p className="text-xl font-black text-white">{value}</p>
      </div>
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

function QuickAccessCard({ link, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group relative bg-white rounded-2xl p-7 shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden cursor-pointer text-left hover:-translate-y-1"
    >
      {/* Gradiente de fondo en hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${link.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
      
      {/* Brillo animado */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 group-hover:left-full transition-all duration-1000"></div>
      </div>

      <div className="relative z-10">
        <div className={`bg-gradient-to-br ${link.gradient} w-14 h-14 rounded-xl flex items-center justify-center text-2xl text-white mb-5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
          {link.icon}
        </div>

        <h3 className="font-black text-[#0C212D] text-xl mb-2 group-hover:text-white transition-colors duration-300">
          {link.title}
        </h3>

        <p className="text-sm text-gray-600 mb-5 group-hover:text-white/90 transition-colors duration-300 leading-relaxed">
          {link.description}
        </p>

        <div className="flex items-center text-[#EE7203] text-sm font-bold group-hover:text-white transition-colors duration-300">
          <span className="group-hover:mr-2 transition-all duration-300">Explorar</span>
          <FiArrowRight className="opacity-0 group-hover:opacity-100 transition-all duration-300" />
        </div>
      </div>
    </button>
  );
}

function AnnouncementsSection({ anunciosFiltrados, locale, t }) {
  return (
    <div className="lg:col-span-2 bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-[#EE7203] to-[#FF3816] p-3 rounded-xl shadow-md">
            <FiBell className="text-white" size={22} />
          </div>
          <h2 className="text-2xl font-black text-[#0C212D]">
            {t("dashboard.announcements")}
          </h2>
        </div>
        <span className="bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white text-xs font-black px-4 py-2 rounded-full shadow-md">
          {anunciosFiltrados.length}
        </span>
      </div>

      {anunciosFiltrados.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-gray-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
            <FiBell className="text-gray-400" size={28} />
          </div>
          <p className="text-gray-500 font-semibold">{t("dashboard.noAnnouncements")}</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {anunciosFiltrados.map((n) => (
            <div
              key={n.id}
              className="group relative bg-gradient-to-r from-gray-50 to-white border-l-4 border-[#EE7203] rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:border-[#FF3816] overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#EE7203] to-[#FF3816] opacity-0 group-hover:opacity-5 rounded-full blur-2xl transition-opacity duration-500"></div>
              <div className="relative z-10">
                <h3 className="font-black text-[#0C212D] text-lg mb-2">{n.titulo}</h3>
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">{n.subtitulo}</p>
                <p className="text-xs text-gray-400 font-semibold">
                  {n.creadoEn?.toDate?.().toLocaleDateString(locale, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActivitySection({ recentActivity, timeAgo, t }) {
  return (
    <div className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-gradient-to-br from-[#0C212D] to-[#112C3E] p-3 rounded-xl shadow-md">
          <FiActivity className="text-white" size={22} />
        </div>
        <h2 className="text-2xl font-black text-[#0C212D]">
          {t("dashboard.activity")}
        </h2>
      </div>

      {recentActivity.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-gray-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
            <FiActivity className="text-gray-400" size={28} />
          </div>
          <p className="text-gray-500 text-sm font-semibold">{t("dashboard.noActivity")}</p>
        </div>
      ) : (
        <ul className="space-y-5 max-h-96 overflow-y-auto pr-2">
          {recentActivity.map((a, i) => (
            <li
              key={i}
              className="relative border-l-2 border-gray-200 pl-5 pb-5 hover:border-[#EE7203] transition-colors duration-300 group"
            >
              <div className="absolute left-0 top-0 w-2 h-2 bg-[#EE7203] rounded-full -translate-x-[5px] group-hover:scale-150 transition-transform"></div>
              <p 
                className="text-sm text-[#0C212D] mb-2 font-semibold leading-relaxed" 
                dangerouslySetInnerHTML={{
                  __html: renderActivityMessage(a, t)
                }}
              />
              <span className="text-xs text-gray-400 font-bold">{timeAgo(a.date)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function renderActivityMessage(activity, t) {
  switch (activity.type) {
    case "gaming":
      return `
        <span class="font-black text-transparent bg-gradient-to-r from-[#EE7203] to-[#FF3816] bg-clip-text">🎮 Gaming:</span>
        ${t("dashboard.activityGamingPlayed")} 
        <span class="font-bold text-[#0C212D]">${activity.games.join(", ")}</span>
      `;
    default:
      return activity.message || "";
  }
}