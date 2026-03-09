// ============================================================
// EnhancedCourseIntro — REWORK VISUAL
// Dirección: Editorial dark industrial, layout asimétrico
// Paleta: #0C212D #112C3E #EE7203 #FF3816
// ============================================================

import { motion } from "framer-motion";
import { FiChevronRight, FiCheckCircle, FiBook, FiClock, FiAward, FiTarget, FiZap } from "react-icons/fi";
import { memo } from "react";

// ✅ Función de comparación (igual que antes)
function arePropsEqual(prevProps: any, nextProps: any) {
  return (
    prevProps.title === nextProps.title &&
    prevProps.description === nextProps.description &&
    prevProps.total === nextProps.total &&
    prevProps.completed === nextProps.completed &&
    prevProps.previewLessons.length === nextProps.previewLessons.length &&
    prevProps.previewLessons[0]?.key === nextProps.previewLessons[0]?.key
  );
}

export const EnhancedCourseIntro = memo(function EnhancedCourseIntro({
  title,
  description,
  total,
  completed,
  previewLessons,
  goNextLesson,
  t,
}: {
  title: string;
  description: string;
  total: number;
  completed: number;
  previewLessons: { key: string; title: string }[];
  goNextLesson: () => void;
  t: (key: string, opts?: any) => string;
}) {
  const progress = total > 0 ? (completed / total) * 100 : 0;
  const remaining = total - completed;

  // Stagger variants para los items de la lista
  const containerVariants = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.08, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -16 },
    show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  return (
    // Ocupa todo el espacio disponible en el main
    <div className="w-full h-full flex overflow-hidden bg-[#0C212D]">

<style>{`
      .course-intro-left::-webkit-scrollbar,
      .course-intro-right::-webkit-scrollbar {
        width: 4px;
      }
      .course-intro-left::-webkit-scrollbar-track,
      .course-intro-right::-webkit-scrollbar-track {
        background: transparent;
      }
      .course-intro-left::-webkit-scrollbar-thumb,
      .course-intro-right::-webkit-scrollbar-thumb {
        background: rgba(238, 114, 3, 0.2);
        border-radius: 2px;
      }
      .course-intro-left::-webkit-scrollbar-thumb:hover,
      .course-intro-right::-webkit-scrollbar-thumb:hover {
        background: rgba(238, 114, 3, 0.4);
      }
    `}</style>
      {/* ══════════════════════════════════════════
          COLUMNA IZQUIERDA — Hero visual
      ══════════════════════════════════════════ */}
      <div className="relative w-full xl:w-[55%] flex flex-col overflow-hidden">

        {/* Fondo con textura geométrica */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Grid diagonal sutil */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#EE7203" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Orb naranja grande — fondo */}
          <div
            className="absolute -top-40 -left-20 w-[500px] h-[500px] rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, #EE7203 0%, transparent 70%)",
            }}
          />
          {/* Orb rojo — abajo derecha */}
          <div
            className="absolute -bottom-20 right-10 w-[300px] h-[300px] rounded-full opacity-10"
            style={{
              background: "radial-gradient(circle, #FF3816 0%, transparent 70%)",
            }}
          />
        </div>

        {/* Línea decorativa superior izquierda */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute top-0 left-0 right-0 h-[3px] origin-left"
          style={{ background: "linear-gradient(90deg, #EE7203, #FF3816, transparent)" }}
        />

        {/* Contenido principal */}
        <div className="relative flex-1 flex flex-col justify-between p-8 md:p-12 xl:p-14 overflow-y-auto course-intro-left">


          {/* Badge superior */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 inline-flex items-center gap-2 self-start"
          >
            <span
              className="text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1.5 border"
              style={{
                color: "#EE7203",
                borderColor: "rgba(238,114,3,0.3)",
                background: "rgba(238,114,3,0.08)",
              }}
            >
              {t("coursePlayer.intro.welcomeToUnit")}
            </span>
          </motion.div>

          {/* Título principal */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6"
          >
            {/* Número de unidad decorativo */}
            <div
              className="text-[120px] md:text-[160px] font-black leading-none select-none pointer-events-none mb-[-20px]"
              style={{
                color: "transparent",
                WebkitTextStroke: "1px rgba(238,114,3,0.15)",
                lineHeight: 0.85,
              }}
            >
              01
            </div>

            <h1
              className="text-4xl md:text-5xl xl:text-6xl font-black leading-[1.05] text-white"
              style={{ letterSpacing: "-0.02em" }}
            >
              {title}
            </h1>
          </motion.div>

          {/* Descripción */}
          {description && (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base md:text-lg text-white/60 leading-relaxed mb-8 max-w-lg font-medium"
            >
              {description}
            </motion.p>
          )}

          {/* Barra de progreso estilo "cargando" */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mb-10"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/40 uppercase tracking-widest font-bold">
                {t("coursePlayer.sidebar.progress")}
              </span>
              <span
                className="text-xs font-black"
                style={{ color: "#EE7203" }}
              >
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-[3px] bg-white/10 w-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
                className="h-full"
                style={{ background: "linear-gradient(90deg, #EE7203, #FF3816)" }}
              />
            </div>
          </motion.div>

          {/* Stats — 3 números grandes en línea */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="grid grid-cols-3 gap-0 mb-10 border border-white/10"
          >
            {[
              {
                value: total,
                label: t("coursePlayer.intro.lessonsInUnit"),
                accent: "#EE7203",
              },
              {
                value: completed,
                label: t("coursePlayer.intro.completedLessons"),
                accent: "#22c55e",
              },
              {
                value: remaining,
                label: t("coursePlayer.intro.remainingSections"),
                accent: "#FF3816",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-center py-5 px-4 relative"
                style={{
                  borderRight: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none",
                }}
              >
                <div
                  className="text-4xl md:text-5xl font-black mb-1"
                  style={{ color: stat.accent }}
                >
                  {stat.value}
                </div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold text-center leading-tight">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
          >
            <motion.button
              onClick={goNextLesson}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="group relative w-full sm:w-auto flex items-center justify-center gap-4 px-8 py-5 font-black text-base text-white overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #EE7203 0%, #FF3816 100%)",
              }}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%)",
                }} />

              <FiZap size={20} className="group-hover:rotate-12 transition-transform duration-300" />
              <span style={{ letterSpacing: "0.02em" }}>
                {t("coursePlayer.intro.startFirstLesson")}
              </span>
              <div className="w-8 h-8 border border-white/30 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <FiChevronRight size={16} />
              </div>
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          COLUMNA DERECHA — What you will learn
          Solo visible en xl
      ══════════════════════════════════════════ */}
      <div
        className="hidden xl:flex w-[45%] flex-col overflow-hidden relative"
        style={{
          background: "#112C3E",
          borderLeft: "1px solid rgba(238,114,3,0.15)",
        }}
      >
        {/* Fondo sutil */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute top-0 right-0 w-64 h-64 opacity-10"
            style={{
              background: "radial-gradient(circle, #EE7203 0%, transparent 70%)",
            }}
          />
        </div>

        {/* Header de la columna */}
        <div className="relative p-10 pb-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-3 mb-2"
          >
            <div
              className="w-1 h-8"
              style={{ background: "linear-gradient(180deg, #EE7203, #FF3816)" }}
            />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/50">
              {t("coursePlayer.intro.whatYouWillLearn")}
            </h2>
          </motion.div>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="origin-left h-px mt-4"
            style={{ background: "linear-gradient(90deg, rgba(238,114,3,0.3), transparent)" }}
          />
        </div>

        {/* Lista de lecciones */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative flex-1 overflow-y-auto px-10 pb-10 space-y-1 course-intro-right">
          {previewLessons.map((lesson, idx) => (
            <motion.div
              key={lesson.key}
              variants={itemVariants}
              className="group flex items-start gap-4 py-4 border-b border-white/5 last:border-0 cursor-default"
            >
              {/* Número */}
              <div
                className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-xs font-black mt-0.5 transition-all duration-300 group-hover:scale-110"
                style={{
                  background: idx < completed
                    ? "linear-gradient(135deg, #22c55e, #16a34a)"
                    : "linear-gradient(135deg, #EE7203, #FF3816)",
                  color: "white",
                }}
              >
                {idx < completed ? "✓" : idx + 1}
              </div>

              {/* Texto */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold leading-snug transition-colors duration-200"
                  style={{
                    color: idx < completed ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.85)",
                    textDecoration: idx < completed ? "line-through" : "none",
                  }}
                >
                  {lesson.title}
                </p>
              </div>

              {/* Indicador de estado */}
              <div
                className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2 transition-all duration-300"
                style={{
                  background: idx < completed
                    ? "#22c55e"
                    : idx === completed
                    ? "#EE7203"
                    : "rgba(255,255,255,0.15)",
                  boxShadow: idx === completed ? "0 0 6px #EE7203" : "none",
                }}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Footer info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="relative p-10 pt-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-3">
            <FiAward style={{ color: "#EE7203" }} size={16} />
            <p className="text-xs text-white/40 font-medium leading-relaxed">
              {t("coursePlayer.intro.clickNextLesson")}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}, arePropsEqual);