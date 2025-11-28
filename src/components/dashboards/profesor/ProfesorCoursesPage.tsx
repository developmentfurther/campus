"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useMemo } from "react";
import { FiBookOpen, FiClock, FiAward, FiArrowRight } from "react-icons/fi";
import { useRouter } from "next/navigation";

// MAPEO INVERSO: idiomaCurso (código corto) → idioma legible
const idiomaDisplayMap: Record<string, string> = {
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
  fr: "French",
  it: "Italian",
};

export default function ProfesorCoursesPage() {
  const { allCursos, loadingAllCursos, userProfile } = useAuth();
  const router = useRouter();

  const [filterIdioma, setFilterIdioma] = useState("");
  const [filterNivel, setFilterNivel] = useState("");

  // Obtener idiomas del profesor (puede tener varios)
  const idiomasProfesor = Array.isArray(userProfile?.idiomasProfesor)
    ? userProfile.idiomasProfesor
    : [];

  console.log("👨‍🏫 Datos del profesor:", {
    idiomasProfesor,
    totalCursos: allCursos?.length || 0,
  });

  /* ----------------------------------------------------------
    1️⃣ NORMALIZAR idiomas del profesor a códigos cortos (en, es, etc)
  ----------------------------------------------------------- */
  const idiomasProfesorNormalizados = useMemo(() => {
    return idiomasProfesor.map((p) => {
      // El idioma puede venir como "english", "ingles", "English", "en", etc.
      const idiomaRaw = (p.idioma || "").toLowerCase().trim();
      
      // Si ya es un código corto (en, es, pt, fr, it), úsalo tal cual
      if (["en", "es", "pt", "fr", "it"].includes(idiomaRaw)) {
        return {
          codigo: idiomaRaw,
          nivel: (p.nivel || "").toUpperCase().trim(),
        };
      }
      
      // Mapeo COMPLETO: inglés + español + portugués
      const codigoMap: Record<string, string> = {
        // Inglés
        english: "en",
        ingles: "en",
        inglés: "en",
        
        // Español
        spanish: "es",
        espanol: "es",
        español: "es",
        
        // Portugués
        portuguese: "pt",
        portugues: "pt",
        português: "pt",
        
        // Francés
        french: "fr",
        frances: "fr",
        francés: "fr",
        
        // Italiano
        italian: "it",
        italiano: "it",
      };
      
      const codigoFinal = codigoMap[idiomaRaw] || idiomaRaw;
      
      console.log(`🔄 Normalizando: "${p.idioma}" → "${codigoFinal}"`);
      
      return {
        codigo: codigoFinal,
        nivel: (p.nivel || "").toUpperCase().trim(),
      };
    });
  }, [idiomasProfesor]);

  console.log("🔄 Idiomas normalizados:", idiomasProfesorNormalizados);

  /* ----------------------------------------------------------
    2️⃣ FILTRAR cursos que coincidan con idiomas del profesor
    Un profesor puede enseñar TODOS los niveles del idioma que domina
  ----------------------------------------------------------- */
  const cursosPermitidos = useMemo(() => {
    if (!Array.isArray(allCursos) || idiomasProfesorNormalizados.length === 0) {
      console.warn("⚠️ No hay cursos o idiomas del profesor");
      return [];
    }

    console.log("🔍 Analizando cursos...");
    console.log("Total cursos disponibles:", allCursos.length);
    
    // Obtener solo los IDIOMAS (sin considerar nivel)
    const idiomasProfesorSet = new Set(
      idiomasProfesorNormalizados.map((p) => p.codigo)
    );
    
    console.log("🗣️ Idiomas que el profesor puede enseñar:", Array.from(idiomasProfesorSet));
    
    // Mostrar primeros 3 cursos como muestra
    allCursos.slice(0, 3).forEach((curso, i) => {
      console.log(`📖 Curso ${i + 1}:`, {
        titulo: curso.titulo,
        idioma: curso.idioma,
        nivel: curso.nivel,
        idiomaLower: (curso.idioma || "").toLowerCase().trim(),
        nivelUpper: (curso.nivel || "").toUpperCase().trim(),
      });
    });

    const permitidos = allCursos.filter((curso) => {
      const cursoIdioma = (curso.idioma || "").toLowerCase().trim();

      // ✅ SOLO verificar que el idioma coincida (ignorar nivel)
      const match = idiomasProfesorSet.has(cursoIdioma);

      if (match) {
        console.log("✅ Curso permitido:", {
          titulo: curso.titulo,
          idioma: cursoIdioma,
          nivel: curso.nivel || "N/A",
        });
      } else {
        console.log("❌ Curso no permitido (idioma diferente):", {
          titulo: curso.titulo,
          idioma: cursoIdioma,
          idiomasProfesor: Array.from(idiomasProfesorSet),
        });
      }

      return match;
    });

    console.log(`📚 Cursos permitidos para profesor: ${permitidos.length}`);
    return permitidos;
  }, [allCursos, idiomasProfesorNormalizados]);

  /* ----------------------------------------------------------
    3️⃣ FILTRADO MANUAL por idioma y nivel seleccionado
  ----------------------------------------------------------- */
  const cursosFiltrados = useMemo(() => {
    return cursosPermitidos.filter((curso) => {
      const cursoIdioma = (curso.idioma || "").toLowerCase().trim();
      const cursoNivel = (curso.nivel || "").toUpperCase().trim();

      const okIdioma = filterIdioma ? cursoIdioma === filterIdioma : true;
      const okNivel = filterNivel ? cursoNivel === filterNivel : true;

      return okIdioma && okNivel;
    });
  }, [cursosPermitidos, filterIdioma, filterNivel]);

  /* ----------------------------------------------------------
    4️⃣ LISTAS COMPLETAS de idiomas y niveles disponibles
  ----------------------------------------------------------- */
  const idiomasDisponibles = [
    { codigo: "en", nombre: "English" },
    { codigo: "es", nombre: "Spanish" },
    { codigo: "pt", nombre: "Portuguese" },
    { codigo: "fr", nombre: "French" },
    { codigo: "it", nombre: "Italian" },
  ];

  const nivelesDisponibles = [
    "A1",
    "A2",
    "B1",
    "B2",
    "B2.5",
    "C1",
    "C2",
  ];

  if (loadingAllCursos) {
    return (
      <div className="p-8 text-slate-500 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EE7203] mx-auto mb-4"></div>
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: "#112C3E" }}>
          Available Material
        </h1>
        <p className="text-gray-500 mt-1">
          Material based on your teaching languages: {" "}
          <span className="font-semibold text-[#EE7203]">
            {idiomasProfesorNormalizados
              .map((p) => `${idiomaDisplayMap[p.codigo] || p.codigo} (${p.nivel})`)
              .join(", ")}
          </span>
        </p>
      </div>

      {/* FILTROS */}
      <div className="flex gap-4">
        {/* Filtro por Idioma */}
        <select
          className="border border-gray-300 p-3 rounded-lg bg-white text-gray-700 font-medium focus:ring-2 focus:ring-[#EE7203] focus:border-transparent"
          value={filterIdioma}
          onChange={(e) => setFilterIdioma(e.target.value)}
        >
          <option value="">All Languages</option>
          {idiomasDisponibles.map((idioma) => (
            <option key={idioma.codigo} value={idioma.codigo}>
              {idioma.nombre}
            </option>
          ))}
        </select>

        {/* Filtro por Nivel */}
        <select
          className="border border-gray-300 p-3 rounded-lg bg-white text-gray-700 font-medium focus:ring-2 focus:ring-[#EE7203] focus:border-transparent"
          value={filterNivel}
          onChange={(e) => setFilterNivel(e.target.value)}
        >
          <option value="">All Levels</option>
          {nivelesDisponibles.map((nivel) => (
            <option key={nivel} value={nivel}>
              {nivel}
            </option>
          ))}
        </select>
      </div>

      {/* ESTADO VACÍO */}
      {cursosFiltrados.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 p-12 text-center rounded-2xl">
          <FiBookOpen size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium text-lg mb-2">
            No courses match your teaching profile
          </p>
          <p className="text-gray-500 text-sm">
            {cursosPermitidos.length === 0
              ? "There are no courses available for your languages and levels."
              : "Try adjusting the filters above."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {cursosFiltrados.map((c) => (
            <div
              key={c.id}
              className="group border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-[#EE7203] hover:shadow-lg transition-all"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <span
                      className="text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-md"
                      style={{ backgroundColor: "#112C3E", color: "#FFFFFF" }}
                    >
                      {idiomaDisplayMap[c.idioma?.toLowerCase()] || c.idioma?.toUpperCase()} • {c.nivel}
                    </span>

                    <h2
                      className="text-xl font-bold mt-2"
                      style={{ color: "#112C3E" }}
                    >
                      {c.titulo}
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5 pb-5 border-b border-gray-200">
                  <StatItem
                    icon={<FiBookOpen size={16} />}
                    label="Units"
                    value={c.unidades?.length || 0}
                  />
                  <StatItem
                    icon={<FiClock size={16} />}
                    label="Duration"
                    value={`${c.unidades?.reduce(
                      (acc, u) => acc + (u.duracion || 0),
                      0
                    )} min`}
                  />
                  <StatItem
                    icon={<FiAward size={16} />}
                    label="Level"
                    value={c.nivel}
                    fullWidth
                  />
                </div>

                <button
                  onClick={() => router.push(`/material-academico/${c.id}`)}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all group-hover:gap-3"
                  style={{ backgroundColor: "#EE7203", color: "#FFFFFF" }}
                >
                  View details
                  <FiArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatItem({ icon, label, value, fullWidth = false }) {
  return (
    <div className={`flex items-center gap-3 ${fullWidth ? "col-span-2" : ""}`}>
      <div className="p-2 rounded-lg bg-gray-100">
        <div style={{ color: "#112C3E" }}>{icon}</div>
      </div>
      <div className="flex-1">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
          {label}
        </p>
        <p className="font-semibold" style={{ color: "#112C3E" }}>
          {value}
        </p>
      </div>
    </div>
  );
}