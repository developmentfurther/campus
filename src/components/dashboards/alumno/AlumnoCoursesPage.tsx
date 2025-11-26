"use client";

import { useAuth } from "@/contexts/AuthContext";
import { FiBookOpen, FiClock, FiUser, FiArrowRight, FiAward } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useI18n } from "@/contexts/I18nContext";

export default function AlumnoCoursesPage() {
  const { misCursos, loadingCursos } = useAuth();
  const router = useRouter();
  const { t } = useI18n();

  if (loadingCursos)
    return (
      <div className="p-8 text-slate-500 bg-white min-h-screen flex items-center justify-center">
        {t("courses.loading")}
      </div>
    );

  return (
    <div className="min-h-screen bg-white text-gray-800 p-8 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#112C3E' }}>
            {t("courses.title")}
          </h1>
          <p className="text-gray-500 mt-1">
            {t("courses.subtitle")}
          </p>
        </div>
      </div>

      {/* EMPTY STATE */}
      {misCursos.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 p-12 text-center rounded-2xl">
          <div className="flex justify-center mb-4">
            <FiBookOpen size={48} className="text-gray-400" />
          </div>
          <p className="text-gray-600 mb-2 font-medium">
            {t("courses.emptyMessage")}
          </p>
          <p className="text-gray-400 text-sm">
            {t("courses.emptyHint")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {misCursos.map((c) => (
            <div
              key={c.id}
              className="group relative border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 transition-all duration-300 hover:shadow-lg"
            >
              {/* Top Accent Bar */}
              <div 
                className="h-1.5 w-full"
                style={{ 
                  background: c.progressPercent >= 100 
                    ? '#EE7203' 
                    : `linear-gradient(to right, #EE7203 ${c.progressPercent}%, #e5e7eb ${c.progressPercent}%)`
                }}
              />

              <div className="p-6">
                {/* Header Section */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span 
                        className="text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-md"
                        style={{ backgroundColor: '#112C3E', color: '#FFFFFF' }}
                      >
                        {c.categoria || t("courses.generalCategory")}
                      </span>
                      {c.progressPercent >= 100 && (
                        <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#EE7203' }}>
                          <FiAward size={14} />
                          Completado
                        </div>
                      )}
                    </div>
                    <h2 
                      className="text-xl font-bold leading-tight"
                      style={{ color: '#112C3E' }}
                    >
                      {c.titulo || t("courses.untitled")}
                    </h2>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-5 pb-5 border-b border-gray-200">
                  <StatItem
                    icon={<FiBookOpen size={16} />}
                    label={t("courses.units")}
                    value={c.unidades?.length || 0}
                  />
                  <StatItem
                    icon={<FiClock size={16} />}
                    label={t("courses.duration")}
                    value={`${c.unidades?.reduce(
                      (acc: number, u: any) => acc + (u.duracion || 0),
                      0
                    )} min`}
                  />
                  <StatItem
  icon={<FiAward size={16} />} 
  label={t("courses.level")}
  value={c.nivel || t("courses.noLevel")}
  fullWidth
/>

                </div>

                {/* Progress Section */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      Progreso del curso
                    </span>
                    <span 
                      className="text-sm font-bold"
                      style={{ color: '#EE7203' }}
                    >
                      {c.progressPercent}%
                    </span>
                  </div>
                  <div className="relative w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${c.progressPercent}%`,
                        backgroundColor: '#EE7203'
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">
                    {t("courses.lessonsCompleted", {
                      done: c.completedCount,
                      total: c.totalLessons,
                    })}
                  </p>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => router.push(`/material-academico/${c.id}`)}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 group-hover:gap-3"
                  style={{ 
                    backgroundColor: '#EE7203',
                    color: '#FFFFFF'
                  }}
                >
                  {c.progressPercent >= 100
                    ? t("courses.review")
                    : t("courses.continue")}
                  <FiArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* Stat Item Component */
function StatItem({ 
  icon, 
  label, 
  value, 
  fullWidth = false 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number;
  fullWidth?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 ${fullWidth ? 'col-span-2' : ''}`}>
      <div 
        className="p-2 rounded-lg"
        style={{ backgroundColor: '#f8f9fa' }}
      >
        <div style={{ color: '#112C3E' }}>
          {icon}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
          {label}
        </p>
        <p 
          className="font-semibold truncate"
          style={{ color: '#112C3E' }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}