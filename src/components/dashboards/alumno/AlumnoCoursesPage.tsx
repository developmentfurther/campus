"use client";

import { useAuth } from "@/contexts/AuthContext";
import { FiBookOpen, FiAward, FiArrowRight, FiStar } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useI18n } from "@/contexts/I18nContext";

export default function AlumnoCoursesPage() {
  const { misCursos, loadingCursos } = useAuth();
  const router = useRouter();
  const { t } = useI18n();

  if (loadingCursos)
    return (
      <div className="p-8 text-slate-500 bg-white min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-[#EE7203] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#112C3E] font-medium">{t("courses.loading")}</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6 md:p-10">
      
      {/* HEADER con diseño asimétrico */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white text-xs font-bold uppercase tracking-wider mb-4 shadow-lg">
              <FiBookOpen size={14} />
              <span> {t("courses.resource")} </span>
            </div>
            
            <h1 className="text-5xl font-black text-[#0C212D] mb-3 leading-tight">
              {t("courses.title")}
            </h1>
            
            <p className="text-[#112C3E]/70 text-lg max-w-2xl">
              {t("courses.subtitle")}
            </p>

            {/* Decorative line */}
            <div className="mt-5 flex items-center gap-2">
              <div className="h-1 w-16 bg-gradient-to-r from-[#EE7203] to-[#FF3816] rounded-full"></div>
              <div className="h-1 w-8 bg-[#0C212D]/20 rounded-full"></div>
              <div className="h-1 w-4 bg-[#0C212D]/10 rounded-full"></div>
            </div>
          </div>

          {/* Stats card flotante */}
          {misCursos.length > 0 && (
            <div className="lg:w-64 bg-gradient-to-br from-[#0C212D] to-[#112C3E] rounded-2xl p-6 shadow-2xl border border-[#EE7203]/20">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#EE7203]">
                  <FiBookOpen className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-white/60 text-xs uppercase tracking-wide font-medium"> {t("courses.available")} </p>
                  <p className="text-white text-3xl font-black">{misCursos.length}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EMPTY STATE rediseñado */}
      {misCursos.length === 0 ? (
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0C212D] to-[#112C3E] opacity-5"></div>
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(238, 114, 3, 0.1) 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }}></div>
            
            <div className="relative border-2 border-dashed border-[#0C212D]/20 p-16 text-center">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#EE7203] blur-2xl opacity-20"></div>
                  <div className="relative p-6 rounded-2xl bg-white border-2 border-[#EE7203]/30">
                    <FiBookOpen size={48} className="text-[#EE7203]" />
                  </div>
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-[#0C212D] mb-3">
                {t("courses.emptyMessage")}
              </h3>
              <p className="text-[#112C3E]/60 text-base max-w-md mx-auto">
                {t("courses.emptyHint")}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {misCursos.map((c, index) => (
              <CourseCard 
                key={c.id} 
                course={c} 
                index={index}
                router={router}
                t={t}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CourseCard({ course, index, router, t }) {
  // Colores alternados para cada card
  const colorSchemes = [
    { from: '#0C212D', to: '#112C3E', accent: '#EE7203' },
    { from: '#112C3E', to: '#0C212D', accent: '#FF3816' },
    { from: '#0C212D', to: '#0C212D', accent: '#EE7203' }
  ];
  
  const scheme = colorSchemes[index % colorSchemes.length];

  return (
    <div className="group relative rounded-3xl overflow-hidden transition-all duration-500 hover:scale-[1.02]">
      
      {/* Gradient background */}
      <div 
        className="absolute inset-0 opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, ${scheme.from} 0%, ${scheme.to} 100%)`
        }}
      ></div>

      {/* Hover glow effect */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${scheme.accent}20 0%, transparent 70%)`
        }}
      ></div>

      {/* Decorative corner */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${scheme.accent} 0%, transparent 70%)`,
            transform: 'translate(40%, -40%)'
          }}
        ></div>
      </div>

      {/* Content */}
      <div className="relative p-8 flex flex-col h-full min-h-[340px]">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div 
              className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider"
              style={{ 
                backgroundColor: scheme.accent,
                color: '#FFFFFF'
              }}
            >
              {course.idioma?.toUpperCase() || t("courses.generalCategory")}
            </div>
            
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm">
              <FiStar className="text-[#FFD700]" size={12} />
              <span className="text-white text-xs font-semibold">5</span>
            </div>
          </div>

          <h2 className="text-2xl font-black text-white leading-tight line-clamp-2 min-h-[3.5rem]">
            {course.titulo || t("courses.untitled")}
          </h2>
        </div>

        {/* Stats Grid - SIN DURACIÓN */}
        <div className="grid grid-cols-2 gap-3 mb-6 flex-grow mt-6">
          <StatBubble
            icon={<FiBookOpen size={16} />}
            label={t("courses.units")}
            value={course.unidades?.length || 0}
            accent={scheme.accent}
          />
          <StatBubble
            icon={<FiAward size={16} />}
            label={t("courses.level")}
            value={course.nivel || t("courses.noLevel")}
            accent={scheme.accent}
          />
        </div>

        {/* CTA Button */}
        <button
          onClick={() => window.open(`/material-academico/${course.id}`, "_blank")}
          className="relative w-full py-4 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-3 overflow-hidden transition-all duration-300 group-hover:gap-4 bg-white text-[#0C212D] hover:shadow-2xl"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-[#EE7203] to-[#FF3816] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></span>
          <span className="relative z-10 group-hover:text-white transition-colors duration-300">
            {t("courses.viewDetails")}
          </span>
          <FiArrowRight size={18} className="relative z-10 group-hover:text-white transition-all duration-300 transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}

function StatBubble({ icon, label, value, accent }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 hover:bg-white/15 transition-colors duration-300">
      <div className="flex items-center gap-3">
        <div 
          className="p-2 rounded-lg"
          style={{ backgroundColor: accent + '30' }}
        >
          <div style={{ color: accent }}>{icon}</div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white/50 text-xs font-medium uppercase tracking-wide">
            {label}
          </p>
          <p className="text-white font-bold text-base truncate">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}