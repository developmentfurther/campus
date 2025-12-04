import React, { useState } from 'react';
import { FiMenu, FiX, FiChevronRight, FiChevronLeft, FiCheckCircle, FiBook, FiFileText } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileMenu({
  curso,
  units,
  progress,
  activeU,
  activeL,
  setActiveU,
  setActiveL,
  expandedUnits,
  setExpandedUnits,
  activeLesson,
  currentUnit,
  router,
  t,
  DownloadBibliographyButton
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('navigation'); // 'navigation' o 'info'

  return (
    <>
      {/* Botón flotante para abrir menú */}
      <button
        onClick={() => setIsOpen(true)}
        className="xl:hidden fixed bottom-6 right-6 z-40 w-16 h-16 bg-gradient-to-br from-[#EE7203] to-[#FF3816] rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform"
      >
        <FiMenu size={28} />
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="xl:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
        )}
      </AnimatePresence>

      {/* Panel deslizante */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="xl:hidden fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-white z-50 shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header del menú */}
            <div className="bg-gradient-to-br from-[#0C212D] to-[#112C3E] p-6 border-b-4 border-[#EE7203]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-white">{curso.titulo}</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>
              
              {/* Tabs de navegación */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('navigation')}
                  className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                    activeTab === 'navigation'
                      ? 'bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white shadow-lg'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  📚 {t("coursePlayer.tabs.theory")}
                </button>
                <button
                  onClick={() => setActiveTab('info')}
                  className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                    activeTab === 'info'
                      ? 'bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white shadow-lg'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  ℹ️ {t("coursePlayer.sidebar.summary")}
                </button>
              </div>
            </div>

            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto">
              {/* TAB: NAVEGACIÓN */}
              {activeTab === 'navigation' && (
                <div className="p-4 space-y-3 pb-32">
                  {/* Botón volver al dashboard */}
                  <button
                    onClick={() => {
                      router.push("/dashboard");
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-slate-100 to-slate-50 border border-slate-200 text-[#0C212D] hover:shadow-lg transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#EE7203]/20 flex items-center justify-center">
                      <FiChevronLeft className="text-[#EE7203]" size={20} />
                    </div>
                    <span className="font-bold text-sm">{t("coursePlayer.sidebar.backHome")}</span>
                  </button>

                  {/* Lista de unidades */}
                  {units.map((u, uIdx) => {
                    // Cierre del curso
                    if (u.id === "closing-course") {
                      const l = u.lessons?.[0];
                      const done = l && (progress[l.key]?.videoEnded || progress[l.key]?.exSubmitted);
                      const active = activeU === uIdx && activeL === 0;

                      return (
                        <div key={u.id} className="mt-6 pt-4">
                          <div className="relative mb-4">
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#EE7203]/30 to-transparent"></div>
                          </div>
                          
                          <div className="px-3 py-3 flex items-center gap-2 text-[#0C212D] font-bold text-sm mb-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EE7203] to-[#FF3816] flex items-center justify-center shadow-lg">
                              <span className="text-xl">🎓</span>
                            </div>
                            <span>{t("coursePlayer.sidebar.courseClosing")}</span>
                          </div>
                          
                          <button
                            onClick={() => {
                              setActiveU(uIdx);
                              setActiveL(0);
                              setIsOpen(false);
                            }}
                            className={`block w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                              active
                                ? "bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white shadow-lg"
                                : done
                                ? "bg-emerald-500/20 text-emerald-700 hover:bg-emerald-500/30 border border-emerald-500/30"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="truncate">{l?.title || t("coursePlayer.sidebar.courseClosing")}</span>
                              {done && <FiCheckCircle size={16} className="text-emerald-500 flex-shrink-0" />}
                            </div>
                          </button>
                        </div>
                      );
                    }

                    const unitNumber = units.slice(0, uIdx).filter((x) => x.id !== "closing-course").length + 1;

                    return (
                      <div key={u.id}>
                        <button
                          onClick={() =>
                            setExpandedUnits((prev) => ({ ...prev, [uIdx]: !prev[uIdx] }))
                          }
                          className={`w-full text-left px-4 py-4 font-bold flex justify-between items-center rounded-xl transition-all border ${
                            expandedUnits[uIdx]
                              ? "bg-gradient-to-r from-[#EE7203]/20 to-[#FF3816]/20 text-[#0C212D] border-[#EE7203]/40 shadow-lg"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                              expandedUnits[uIdx]
                                ? "bg-gradient-to-br from-[#EE7203] to-[#FF3816] text-white"
                                : "bg-slate-200 text-slate-600"
                            }`}>
                              {unitNumber}
                            </div>
                            <span className="text-sm">{u.title}</span>
                          </div>
                          <FiChevronRight
                            className={`transition-transform flex-shrink-0 ${
                              expandedUnits[uIdx] ? "rotate-90 text-[#EE7203]" : "text-slate-400"
                            }`}
                            size={18}
                          />
                        </button>

                        {expandedUnits[uIdx] && (
                          <div className="mt-2 space-y-1.5 ml-3 pl-4 border-l-2 border-[#EE7203]/20">
                            {u.lessons.map((l, lIdx) => {
                              const done = progress[l.key]?.videoEnded || progress[l.key]?.exSubmitted;
                              const active = activeU === uIdx && activeL === lIdx;
                              return (
                                <button
                                  key={l.key}
                                  onClick={() => {
                                    setActiveU(uIdx);
                                    setActiveL(lIdx);
                                    setIsOpen(false);
                                  }}
                                  className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                                    active
                                      ? "bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white shadow-md"
                                      : done
                                      ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border border-emerald-500/20"
                                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="truncate text-xs">
                                      {l.id === "closing"
                                        ? `🏁 ${t("coursePlayer.sidebar.unitClosing")}`
                                        : `${uIdx + 1}.${lIdx + 1}  ${l.title}`}
                                    </span>
                                    {done && (
                                      <FiCheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB: INFORMACIÓN */}
              {activeTab === 'info' && (
                <div className="p-6 space-y-6">
                  {/* Descripción del curso */}
                  <div className="bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-2 h-8 bg-gradient-to-b from-[#EE7203] via-[#FF3816] to-[#EE7203] rounded-full"></div>
                      <h3 className="text-lg font-black text-[#0C212D]">
                        {t("coursePlayer.sidebar.summary")}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {curso?.descripcion || t("coursePlayer.sidebar.noDescription")}
                    </p>
                  </div>

                  {/* Lección actual */}
                  <div className="bg-gradient-to-br from-slate-50 to-white border-2 border-[#EE7203]/20 rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#EE7203] to-[#FF3816] flex items-center justify-center shadow-lg">
                        <FiBook className="text-white" size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] text-[#112C3E]/50 uppercase tracking-widest font-bold mb-1">
                          {t("coursePlayer.sidebar.lessonCurrent")}
                        </p>
                        <p className="text-xs text-[#0C212D] font-semibold">
                          {units[activeU]?.title || "—"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 border border-slate-200">
                      <p className="font-black text-[#0C212D] text-base leading-tight mb-2">
                        {activeLesson?.title || "—"}
                      </p>
                      {activeLesson?.description && (
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {activeLesson.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Estadísticas */}
                  <div className="bg-gradient-to-br from-[#0C212D] to-[#112C3E] rounded-2xl p-5 shadow-xl">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-black text-[#EE7203] mb-1">
                          {Object.values(progress).filter(p => p.videoEnded || p.exSubmitted).length}
                        </div>
                        <div className="text-[10px] text-white/60 uppercase tracking-wider font-bold">
                          {t("coursePlayer.sidebar.completed")}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-black text-[#FF3816] mb-1">
                          {units.reduce((acc, u) => acc + (u.lessons?.length || 0), 0)}
                        </div>
                        <div className="text-[10px] text-white/60 uppercase tracking-wider font-bold">
                          {t("coursePlayer.sidebar.total")}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-5 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-white/70 font-semibold">{t("coursePlayer.sidebar.progress")}</span>
                        <span className="text-xs text-[#EE7203] font-black">
                          {Math.round((Object.values(progress).filter(p => p.videoEnded || p.exSubmitted).length / units.reduce((acc, u) => acc + (u.lessons?.length || 0), 0)) * 100)}%
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#EE7203] to-[#FF3816] rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(Object.values(progress).filter(p => p.videoEnded || p.exSubmitted).length / units.reduce((acc, u) => acc + (u.lessons?.length || 0), 0)) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Botón de descarga */}
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#EE7203] to-[#FF3816] rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <DownloadBibliographyButton 
                      unit={currentUnit}
                      courseTitle={curso?.titulo}
                    />
                  </div>

                  {/* Footer motivacional */}
                  <div className="bg-gradient-to-r from-[#EE7203]/5 via-[#FF3816]/5 to-[#EE7203]/5 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-600 font-medium">
                      💪 {t("coursePlayer.sidebar.keepGoing")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}