"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useProfesor } from "@/contexts/ProfesorContext";

// Poppins via Google Fonts
const poppinsStyle = `@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');`;

const IDIOMA_LABEL: Record<string, string> = {
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
  fr: "French",
  it: "Italian",
};

const NIVEL_COLOR: Record<string, string> = {
  A1: "#4ADE80",
  A2: "#86EFAC",
  B1: "#60A5FA",
  B2: "#3B82F6",
  "B2.5": "#6366F1",
  C1: "#EE7203",
  C2: "#DC2626",
};

const NIVELES = ["A1", "A2", "B1", "B2", "B2.5", "C1", "C2"];
const IDIOMAS = ["en", "es", "pt", "fr", "it"];

export default function ProfesorCoursesPage() {
  const { allCursos, loadingAllCursos } = useProfesor();
  const { userProfile } = useAuth();
  const router = useRouter();

  const [filterIdioma, setFilterIdioma] = useState("");
  const [filterNivel, setFilterNivel] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const NIVEL_ORDER = ["A1", "A2", "B1", "B2", "B2.5", "C1", "C2"];
const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "">("asc");
  // ✅ FIX 1: campo correcto idiomasQueEnseña
  // ✅ FIX 2: dependencia correcta en useMemo
  const idiomasProfesorSet = useMemo(() => {
    const raw: any[] = Array.isArray((userProfile as any)?.idiomasQueEnseña)
      ? (userProfile as any).idiomasQueEnseña
      : [];
    return new Set(
      raw.map((p) =>
        (typeof p === "string" ? p : p.idioma || "").toLowerCase().trim()
      )
    );
  }, [(userProfile as any)?.idiomasQueEnseña]);

  const cursosPermitidos = useMemo(() => {
    if (!Array.isArray(allCursos) || idiomasProfesorSet.size === 0) return [];
    return allCursos.filter((c) =>
      idiomasProfesorSet.has((c.idioma || "").toLowerCase().trim())
    );
  }, [allCursos, idiomasProfesorSet]);

 const cursosFiltrados = useMemo(() => {
  const filtered = cursosPermitidos.filter((c) => {
    const okIdioma = filterIdioma
      ? (c.idioma || "").toLowerCase().trim() === filterIdioma
      : true;
    const okNivel = filterNivel
      ? (c.nivel || "").toUpperCase().trim() === filterNivel
      : true;
    return okIdioma && okNivel;
  });

  if (sortOrder === "asc") {
    filtered.sort((a, b) => NIVEL_ORDER.indexOf(a.nivel?.toUpperCase()) - NIVEL_ORDER.indexOf(b.nivel?.toUpperCase()));
  } else if (sortOrder === "desc") {
    filtered.sort((a, b) => NIVEL_ORDER.indexOf(b.nivel?.toUpperCase()) - NIVEL_ORDER.indexOf(a.nivel?.toUpperCase()));
  }

  return filtered;
}, [cursosPermitidos, filterIdioma, filterNivel, sortOrder]);

  
  const idiomasDisponibles = IDIOMAS.filter((code) =>
    cursosPermitidos.some((c) => (c.idioma || "").toLowerCase().trim() === code)
  );

  const nivelesDisponibles = NIVELES.filter((n) =>
    cursosPermitidos.some((c) => (c.nivel || "").toUpperCase().trim() === n)
  );

  const totalLecciones = (curso: any) =>
    (curso.unidades || []).reduce(
      (acc: number, u: any) => acc + (u.lecciones?.length || 0),
      0
    );

  const totalMinutos = (curso: any) =>
    (curso.unidades || []).reduce(
      (acc: number, u: any) => acc + (u.duracion || 0),
      0
    );

  if (loadingAllCursos) {
    return (
      <>
        <style>{poppinsStyle}</style>
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "#F8F7F4", fontFamily: "'Poppins', sans-serif" }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-14 h-14">
              <div
                className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
                style={{ borderTopColor: "#EE7203" }}
              />
            </div>
            <p
              className="text-sm font-semibold tracking-widest uppercase"
              style={{ color: "#112C3E", opacity: 0.5 }}
            >
              Loading material…
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{poppinsStyle}</style>
      <div
        className="min-h-screen"
        style={{ backgroundColor: "#F8F7F4", fontFamily: "'Poppins', sans-serif" }}
      >
        {/* HEADER */}
        <div
          className="px-8 pt-10 pb-8"
          style={{ borderBottom: "1px solid rgba(17,44,62,0.08)" }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <span
                className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ backgroundColor: "#EE7203", color: "#fff" }}
              >
                Academic Material
              </span>
              <span
                className="text-xs font-medium"
                style={{ color: "#112C3E", opacity: 0.4 }}
              >
                {cursosFiltrados.length} material{cursosFiltrados.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1
                  className="text-4xl font-black leading-tight"
                  style={{ color: "#112C3E", letterSpacing: "-0.02em" }}
                >
                  Your Material Library
                </h1>
                <p className="mt-1 text-sm" style={{ color: "#112C3E", opacity: 0.45 }}>
                  Showing content for:{" "}
                  <span style={{ color: "#EE7203", fontWeight: 700 }}>
                    {Array.from(idiomasProfesorSet)
                      .map((c) => IDIOMA_LABEL[c as string] || (c as string).toUpperCase())
                      .join(", ") || "—"}
                  </span>
                </p>
              </div>

              {/* FILTROS */}
              <div className="flex gap-3">
                <div className="relative">
                  <select
                    value={filterIdioma}
                    onChange={(e) => setFilterIdioma(e.target.value)}
                    className="appearance-none pl-4 pr-8 py-2.5 rounded-xl text-sm font-semibold cursor-pointer focus:outline-none transition-all"
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      backgroundColor: filterIdioma ? "#112C3E" : "#fff",
                      color: filterIdioma ? "#fff" : "#112C3E",
                      border: "1.5px solid",
                      borderColor: filterIdioma ? "#112C3E" : "rgba(17,44,62,0.15)",
                    }}
                  >
                    <option value="">All Languages</option>
                    {idiomasDisponibles.map((code) => (
                      <option key={code} value={code}>
                        {IDIOMA_LABEL[code] || code.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <span
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                    style={{ color: filterIdioma ? "#fff" : "#112C3E", opacity: 0.5 }}
                  >▾</span>
                </div>

                <div className="relative">
                  <select
                    value={filterNivel}
                    onChange={(e) => setFilterNivel(e.target.value)}
                    className="appearance-none pl-4 pr-8 py-2.5 rounded-xl text-sm font-semibold cursor-pointer focus:outline-none transition-all"
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      backgroundColor: filterNivel ? "#EE7203" : "#fff",
                      color: filterNivel ? "#fff" : "#112C3E",
                      border: "1.5px solid",
                      borderColor: filterNivel ? "#EE7203" : "rgba(17,44,62,0.15)",
                    }}
                  >
                    <option value="">All Levels</option>
                    {nivelesDisponibles.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <span
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                    style={{ color: filterNivel ? "#fff" : "#112C3E", opacity: 0.5 }}
                  >▾</span>
                </div>

                <div className="relative">
  <select
    value={sortOrder}
    onChange={(e) => setSortOrder(e.target.value as "asc" | "desc" | "")}
    className="appearance-none pl-4 pr-8 py-2.5 rounded-xl text-sm font-semibold cursor-pointer focus:outline-none transition-all"
    style={{
      fontFamily: "'Poppins', sans-serif",
      backgroundColor: sortOrder ? "#112C3E" : "#fff",
      color: sortOrder ? "#fff" : "#112C3E",
      border: "1.5px solid",
      borderColor: sortOrder ? "#112C3E" : "rgba(17,44,62,0.15)",
    }}
  >
    <option value="">No order</option>
    <option value="asc">Level: A1 → C2</option>
    <option value="desc">Level: C2 → A1</option>
  </select>
  <span
    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs"
    style={{ color: sortOrder ? "#fff" : "#112C3E", opacity: 0.5 }}
  >▾</span>
</div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="max-w-6xl mx-auto px-8 py-8">
          {cursosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 text-3xl"
                style={{ backgroundColor: "rgba(17,44,62,0.06)" }}
              >
                📚
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: "#112C3E" }}>
                No materials found
              </h3>
              <p className="text-sm max-w-xs" style={{ color: "#112C3E", opacity: 0.45 }}>
                {cursosPermitidos.length === 0
                  ? "There are no materials available for your teaching languages yet."
                  : "Try adjusting the filters above."}
              </p>
              {(filterIdioma || filterNivel) && (
                <button
                  onClick={() => { setFilterIdioma(""); setFilterNivel(""); }}
                  className="mt-5 px-5 py-2 rounded-xl text-sm font-semibold"
                  style={{ fontFamily: "'Poppins', sans-serif", backgroundColor: "#EE7203", color: "#fff" }}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {cursosFiltrados.map((c) => {
                const nivelColor = NIVEL_COLOR[(c.nivel || "").toUpperCase()] || "#EE7203";
                const isHovered = hoveredId === c.id;
                const mins = totalMinutos(c);
                const horas = Math.floor(mins / 60);
                const restMin = mins % 60;
                const durLabel = horas > 0 ? `${horas}h ${restMin}m` : `${mins}m`;

                return (
                  <div
                    key={c.id}
                    onMouseEnter={() => setHoveredId(c.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => window.open(`/material-academico/${c.id}`, "_blank")}
                    className="cursor-pointer rounded-2xl overflow-hidden flex flex-col transition-all duration-200"
                    style={{
                      backgroundColor: "#fff",
                      border: "1.5px solid",
                      borderColor: isHovered ? "#EE7203" : "rgba(17,44,62,0.10)",
                      transform: isHovered ? "translateY(-3px)" : "translateY(0)",
                      boxShadow: isHovered
                        ? "0 12px 32px rgba(238,114,3,0.12)"
                        : "0 2px 8px rgba(17,44,62,0.04)",
                    }}
                  >
                    <div className="h-1.5 w-full" style={{ backgroundColor: nivelColor }} />

                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-4">
                        <span
                          className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg"
                          style={{ backgroundColor: nivelColor + "18", color: nivelColor }}
                        >
                          {c.nivel || "—"}
                        </span>
                        <span
                          className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg"
                          style={{ backgroundColor: "rgba(17,44,62,0.06)", color: "#112C3E" }}
                        >
                          {IDIOMA_LABEL[(c.idioma || "").toLowerCase()] || c.idioma?.toUpperCase()}
                        </span>
                      </div>

                      <h2
                        className="text-lg font-extrabold leading-snug mb-3 flex-1"
                        style={{ color: "#112C3E", letterSpacing: "-0.01em" }}
                      >
                        {c.titulo}
                      </h2>

                      {c.descripcion && (
                        <p
                          className="text-xs leading-relaxed mb-4 line-clamp-2"
                          style={{ color: "#112C3E", opacity: 0.45 }}
                        >
                          {c.descripcion}
                        </p>
                      )}

                      <div
                        className="flex items-center gap-4 pt-4 mt-auto"
                        style={{ borderTop: "1px solid rgba(17,44,62,0.07)" }}
                      >
                        <Stat label="Units" value={c.unidades?.length || 0} />
                        <Stat label="Lessons" value={totalLecciones(c)} />
                        <Stat label="Duration" value={durLabel} />
                      </div>

                      <button
                        className="mt-4 w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200"
                        style={{
                          fontFamily: "'Poppins', sans-serif",
                          backgroundColor: isHovered ? "#EE7203" : "rgba(17,44,62,0.05)",
                          color: isHovered ? "#fff" : "#112C3E",
                        }}
                      >
                        View material
                        <span style={{ transform: isHovered ? "translateX(3px)" : "translateX(0)", transition: "transform 0.2s", display: "inline-block" }}>
                          →
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col">
      <span
        className="text-xs uppercase tracking-widest font-semibold"
        style={{ color: "#112C3E", opacity: 0.35 }}
      >
        {label}
      </span>
      <span className="text-sm font-black" style={{ color: "#112C3E" }}>
        {value}
      </span>
    </div>
  );
}