"use client";

import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { FiBookOpen, FiUser, FiArrowRight } from "react-icons/fi";
import { useDashboardUI } from "@/stores/useDashboardUI";

export default function ProfesorHomePage() {
  const { user, allCursos, userProfile } = useAuth();
  const { setSection } = useDashboardUI();

  // Mapeo de idiomas del profesor
  const idiomaDisplayMap: Record<string, string> = {
    en: "English",
    es: "Spanish",
    pt: "Portuguese",
    fr: "French",
    it: "Italian",
  };

  // Normalizar idiomas del profesor
  const idiomasProfesorNormalizados = useMemo(() => {
    const idiomasProfesor = Array.isArray(userProfile?.idiomasProfesor)
      ? userProfile.idiomasProfesor
      : [];

    return idiomasProfesor.map((p) => {
      const idiomaRaw = (p.idioma || "").toLowerCase().trim();

      if (["en", "es", "pt", "fr", "it"].includes(idiomaRaw)) {
        return {
          codigo: idiomaRaw,
          nivel: (p.nivel || "").toUpperCase().trim(),
        };
      }

      const codigoMap: Record<string, string> = {
        english: "en",
        ingles: "en",
        inglés: "en",
        spanish: "es",
        espanol: "es",
        español: "es",
        portuguese: "pt",
        portugues: "pt",
        português: "pt",
        french: "fr",
        frances: "fr",
        francés: "fr",
        italian: "it",
        italiano: "it",
      };

      return {
        codigo: codigoMap[idiomaRaw] || idiomaRaw,
        nivel: (p.nivel || "").toUpperCase().trim(),
      };
    });
  }, [userProfile?.idiomasProfesor]);

  // Obtener idiomas que el profesor puede enseñar
  const idiomasProfesorSet = useMemo(() => {
    return new Set(idiomasProfesorNormalizados.map((p) => p.codigo));
  }, [idiomasProfesorNormalizados]);

  // Filtrar cursos disponibles para el profesor
  const cursosDisponibles = useMemo(() => {
    if (!Array.isArray(allCursos) || idiomasProfesorSet.size === 0) return [];

    return allCursos.filter((curso) => {
      const cursoIdioma = (curso.idioma || "").toLowerCase().trim();
      return idiomasProfesorSet.has(cursoIdioma);
    });
  }, [allCursos, idiomasProfesorSet]);

  // Calcular total de lecciones
  const totalLecciones = useMemo(() => {
    return cursosDisponibles.reduce((acc, curso) => {
      const units = curso.unidades || [];
      const lessons = units.reduce((sum: number, u: any) => {
        const lessonList = u.lessons || u.lecciones || [];
        return sum + (Array.isArray(lessonList) ? lessonList.length : 0);
      }, 0);
      return acc + lessons;
    }, 0);
  }, [cursosDisponibles]);

  return (
    <div className="min-h-screen bg-white text-gray-800 p-8 space-y-8">
      {/* HEADER */}
      <header>
        <h1 className="text-3xl font-bold" style={{ color: "#112C3E" }}>
          Welcome, {userProfile?.firstName || user?.email?.split("@")[0] || "Teacher"}
        </h1>
        <p className="text-gray-500 mt-2">
          Manage your teaching materials and profile settings.
        </p>
      </header>

      {/* MAIN CARDS */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CARD 1: Academic Materials */}
        <div className="bg-gradient-to-br from-[#112C3E] to-[#1a4159] rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <FiBookOpen size={28} />
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-2">Academic Materials</h2>
          <p className="text-white/80 mb-6">
            Access all courses available for your teaching languages.
          </p>

          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <div>
                <p className="text-white/70 text-sm">Available Courses</p>
                <p className="text-3xl font-bold">{cursosDisponibles.length}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <div>
                <p className="text-white/70 text-sm">Total Lessons</p>
                <p className="text-3xl font-bold">{totalLecciones}</p>
              </div>
            </div>

            <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <p className="text-white/70 text-sm mb-2">Teaching Languages</p>
              <div className="flex flex-wrap gap-2">
                {idiomasProfesorNormalizados.map((idioma, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium"
                  >
                    {idiomaDisplayMap[idioma.codigo] || idioma.codigo.toUpperCase()} - {idioma.nivel}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => setSection("cursos")}
            className="w-full py-3 px-4 bg-white text-[#112C3E] rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
          >
            View All Courses
            <FiArrowRight size={18} />
          </button>
        </div>

        {/* CARD 2: Profile Settings */}
        <div className="bg-gradient-to-br from-[#EE7203] to-[#ff8c2e] rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <FiUser size={28} />
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-2">Profile Settings</h2>
          <p className="text-white/80 mb-6">
            Manage your teaching credentials and personal information.
          </p>

          <div className="space-y-4 mb-6">
            <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <p className="text-white/70 text-sm">Email</p>
              <p className="font-medium mt-1">{user?.email || "Not available"}</p>
            </div>

            <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <p className="text-white/70 text-sm">Full Name</p>
              <p className="font-medium mt-1">
                {userProfile?.firstName && userProfile?.lastName
                  ? `${userProfile.firstName} ${userProfile.lastName}`
                  : "Not configured"}
              </p>
            </div>

            <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <p className="text-white/70 text-sm">Role</p>
              <p className="font-medium mt-1 capitalize">
                {userProfile?.role || "Teacher"}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSection("perfil")}
            className="w-full py-3 px-4 bg-white text-[#EE7203] rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
          >
            Edit Profile
            <FiArrowRight size={18} />
          </button>
        </div>

      </section>

      {/* INFO FOOTER */}
      <div className="text-center text-gray-500 text-sm pt-8 border-t border-gray-200">
        <p>
          Use the navigation menu to access courses, students, and other teaching tools.
        </p>
      </div>
    </div>
  );
}