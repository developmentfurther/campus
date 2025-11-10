"use client";

import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  FiBookOpen,
  FiUsers,
  FiTrendingUp,
  FiClipboard,
  FiArrowRight,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { useDashboardUI } from "@/stores/useDashboardUI";
import { useRouter } from "next/navigation";

export default function ProfesorHomePage() {
  const { user, allCursos } = useAuth();
  const { setSection } = useDashboardUI();
  const router = useRouter();

  // ✅ Cursos asignados al profesor (soporta ambos modelos)
  const cursosAsignados = useMemo(() => {
    if (!Array.isArray(allCursos)) return [];
    const email = (user?.email || "").toLowerCase();

    return allCursos.filter((c: any) => {
      const profId = c.profesorId || c.ownerId;
      const profesores = Array.isArray(c.profesores)
        ? c.profesores.map((p: string) => (p || "").toLowerCase())
        : [];

      return (
        (profId && profId === user?.uid) ||
        profesores.includes(email)
      );
    });
  }, [allCursos, user?.uid, user?.email]);

  // 👥 Alumnos únicos entre todos los cursos asignados (por email)
  const alumnosUnicos = useMemo(() => {
    const set = new Set<string>();
    cursosAsignados.forEach((c: any) =>
      (c.cursantes || []).forEach((mail: string) => {
        if (mail) set.add(String(mail).toLowerCase());
      })
    );
    return Array.from(set);
  }, [cursosAsignados]);

  // 📈 KPIs simples (expandidos más adelante)
  const kpis = useMemo(() => {
    const coursesCount = cursosAsignados.length;

    const lessonsTotal = cursosAsignados.reduce((acc: number, c: any) => {
      const fromUnits = Array.isArray(c.unidades)
        ? c.unidades.reduce(
            (a: number, u: any) => a + (u.lecciones?.length || 0),
            0
          )
        : 0;
      return acc + fromUnits;
    }, 0);

    return {
      coursesCount,
      studentsCount: alumnosUnicos.length,
      lessonsTotal,
      // Pendiente: integrar “entregas pendientes” desde Context (cuando lo expongas)
      pendingReviews: "—",
    };
  }, [cursosAsignados, alumnosUnicos.length]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8 space-y-8">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Hola, {user?.email?.split("@")[0] || "Profesor"}
          </h1>
          <p className="text-gray-500 mt-1">
            Gestioná tus cursos, seguí el progreso de tus alumnos y corregí entregas.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setSection("cursos")}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Ver mis cursos
          </Button>
          <Button
            variant="outline"
            onClick={() => setSection("alumnos")}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Ver alumnos
          </Button>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <Kpi
          icon={<FiBookOpen className="text-purple-600" />}
          label="Cursos a cargo"
          value={kpis.coursesCount}
        />
        <Kpi
          icon={<FiUsers className="text-purple-600" />}
          label="Alumnos únicos"
          value={kpis.studentsCount}
        />
        <Kpi
          icon={<FiClipboard className="text-purple-600" />}
          label="Lecciones totales"
          value={kpis.lessonsTotal}
        />
        <Kpi
          icon={<FiTrendingUp className="text-purple-600" />}
          label="Entregas pendientes"
          value={kpis.pendingReviews}
          hint="Conectar a ‘entregas’ del Context"
        />
      </section>

      {/* QUICK ACTIONS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ActionCard
          title="Corregir entregas"
          desc="Revisá los trabajos y asigná feedback."
          onClick={() => setSection("alumnos")}
        />
        <ActionCard
          title="Gestionar avisos"
          desc="Publicá noticias para tus cursos."
          onClick={() => router.push("/dashboard")} // placeholder: cuando tengas ProfesorAvisosPage
        />
        <ActionCard
          title="Ver progreso"
          desc="Monitoreá el avance de tus alumnos."
          onClick={() => setSection("alumnos")}
        />
      </section>

      {/* LISTA DE CURSOS ASIGNADOS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Mis cursos a cargo
          </h2>
          <button
            onClick={() => setSection("cursos")}
            className="text-sm text-purple-600 hover:text-purple-700 inline-flex items-center gap-1"
          >
            Ver todos <FiArrowRight />
          </button>
        </div>

        {cursosAsignados.length === 0 ? (
          <div className="border border-dashed border-gray-300 p-6 rounded-xl text-gray-500 text-center">
            Aún no tenés cursos asignados.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {cursosAsignados.slice(0, 6).map((c: any) => {
              const units = Array.isArray(c.unidades) ? c.unidades.length : 0;
              const lessons =
                Array.isArray(c.unidades)
                  ? c.unidades.reduce(
                      (acc: number, u: any) => acc + (u.lecciones?.length || 0),
                      0
                    )
                  : 0;

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl shadow border border-slate-200 p-5 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {c.titulo || "Curso sin título"}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-2 mt-1">
                        {c.descripcion || "Sin descripción."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-4">
                    <span>Unidades: {units}</span>
                    <span>Lecciones: {lessons}</span>
                    <span>Alumnos: {(c.cursantes || []).length}</span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={() =>
                        // vista de curso en modo lectura: reusa CoursePlayer
                        c.id ? router.push(`/material-academico/${c.id}`) : null
                      }
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Abrir curso
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSection("alumnos")}
                      className="border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      Ver alumnos
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

/* ---------- UI Partials ---------- */

function Kpi({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 grid place-items-center">
          {icon}
        </div>
        <div>
          <div className="text-2xl font-extrabold text-slate-900 leading-tight">
            {value}
          </div>
          <div className="text-sm text-slate-500">{label}</div>
          {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  title,
  desc,
  onClick,
}: {
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500 mt-1">{desc}</p>
        </div>
        <FiArrowRight className="text-slate-400" />
      </div>
    </button>
  );
}
