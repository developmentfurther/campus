"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FiBookOpen, FiPlus, FiEye, FiEdit3, FiTrash2, FiUsers, FiLayers } from "react-icons/fi";
import EditCourseForm from "@/components/cursos/edit/EditCourseForm";
import CrearMaterial from "@/components/cursos/crear/CreateCourse";

export default function MaterialAcademico() {
  const { allCursos, loadingAllCursos, reloadData } = useAuth();

  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [fullCourseData, setFullCourseData] = useState<any | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const localCourses = useMemo(() => {
    if (!Array.isArray(allCursos)) return [];
    return allCursos.map((c: any) => ({
      id: c.id,
      title: c.titulo || "Untitled",
      description: c.descripcion || "",
      level: c.nivel || "N/A",
      category: (c.idioma || "").toUpperCase() || "General",
      students: Array.isArray(c.cursantes) ? c.cursantes.length : 0,
      unidades: Array.isArray(c.unidades) ? c.unidades.length : 0,
      created: c.creadoEn?.seconds
        ? new Date(c.creadoEn.seconds * 1000).toLocaleDateString()
        : "N/A",
      visible: c.publico ?? true,
    }));
  }, [allCursos]);

  const handleEdit = (course: any) => {
    const full = allCursos.find((c) => c.id === course.id);
    if (!full) { toast.error("No se pudo cargar el curso"); return; }
    setSelectedCourse(course);
    setFullCourseData(full);
    setIsEditOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que querés eliminar este material?")) return;
    try {
      await deleteDoc(doc(db, "cursos", id));
      toast.success("Material eliminado.");
      await reloadData();
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar.");
    }
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setFullCourseData(null);
    setSelectedCourse(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-12 bg-gradient-to-b from-[#EE7203] to-[#FF3816] rounded-full" />
            <div>
              <h1 className="text-4xl font-black text-[#0C212D] flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[#EE7203] to-[#FF3816] rounded-xl">
                  <FiBookOpen className="text-white" size={28} />
                </div>
                Material Académico
              </h1>
              <p className="text-[#112C3E]/70 mt-2 text-base font-medium">
                Gestioná los materiales disponibles en el campus.
              </p>
            </div>
          </div>

          <Button
            onClick={() => setIsCreateOpen(true)}
            className="group bg-gradient-to-r from-[#EE7203] to-[#FF3816] hover:shadow-2xl hover:shadow-[#EE7203]/40 text-white rounded-xl px-8 py-6 text-base font-bold transition-all duration-300 hover:scale-105 flex items-center gap-3"
          >
            <FiPlus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
            Nuevo Material
          </Button>
        </header>

        {/* List */}
        {loadingAllCursos ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#EE7203] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[#112C3E] font-semibold">Cargando materiales...</p>
            </div>
          </div>
        ) : localCourses.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-gradient-to-br from-[#0C212D] to-[#112C3E] w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <FiBookOpen className="text-white" size={40} />
            </div>
            <h3 className="text-2xl font-black text-[#0C212D] mb-3">Sin materiales aún</h3>
            <p className="text-[#112C3E]/60">Creá tu primer material para comenzar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {localCourses.map((course, index) => (
              <CourseCard
                key={course.id}
                course={course}
                index={index}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* CrearMaterial — rendered outside the grid, takes care of its own overlay */}
      {isCreateOpen && (
        <CrearMaterial
          onClose={() => setIsCreateOpen(false)}
        />
      )}

      {/* EditCourseForm — same pattern */}
      {isEditOpen && fullCourseData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40  p-4">
          <div className="w-full max-w-5xl max-h-[94vh] overflow-hidden">
            <EditCourseForm
              courseId={selectedCourse?.id}
              initialData={fullCourseData}
              onClose={handleCloseEdit}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CourseCard ───────────────────────────────────────────────────────────────

function CourseCard({
  course,
  index,
  onEdit,
  onDelete,
}: {
  course: any;
  index: number;
  onEdit: (c: any) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className="group relative bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 border-2 border-gray-100 hover:border-[#EE7203]/30 overflow-hidden"
      style={{
        animation: "fadeInUp 0.4s ease-out forwards",
        animationDelay: `${index * 0.08}s`,
        opacity: 0,
      }}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#EE7203] to-[#FF3816] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

      <div className="relative z-10">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-start gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black text-[#0C212D] group-hover:text-[#EE7203] transition-colors duration-300 line-clamp-1">
                {course.title}
              </h2>
              <p className="text-sm text-[#112C3E]/60 line-clamp-2 mt-1 leading-relaxed">
                {course.description || "Sin descripción"}
              </p>
            </div>
            <span
              className={`shrink-0 text-xs px-3 py-1 rounded-lg font-bold uppercase tracking-wide ${
                course.visible
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {course.visible ? "Público" : "Oculto"}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-[#0C212D] text-white text-xs font-bold rounded-lg">
              {course.category}
            </span>
            <span className="px-3 py-1 border-2 border-[#EE7203] text-[#EE7203] text-xs font-bold rounded-lg">
              Nivel {course.level}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="px-6 py-4 grid grid-cols-3 gap-4 border-b border-gray-100">
          <StatBubble icon={<FiLayers size={16} />} value={course.unidades} label="Unidades" />
          <StatBubble icon={<FiUsers size={16} />} value={course.students} label="Alumnos" />
          <StatBubble icon={<FiBookOpen size={16} />} value={course.created} label="Creado" small />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-5">
          <Button
            variant="outline"
            onClick={() => window.open(`/material-academico/${course.id}`, "_blank")}
            className="border-2 border-[#0C212D] text-[#0C212D] hover:bg-[#0C212D] hover:text-white rounded-xl text-sm font-bold px-4 py-2 transition-all flex items-center gap-2"
          >
            <FiEye size={15} /> Ver
          </Button>
          <Button
            variant="outline"
            onClick={() => onEdit(course)}
            className="border-2 border-[#EE7203] text-[#EE7203] hover:bg-[#EE7203] hover:text-white rounded-xl text-sm font-bold px-4 py-2 transition-all flex items-center gap-2"
          >
            <FiEdit3 size={15} /> Editar
          </Button>
          <Button
            variant="outline"
            onClick={() => onDelete(course.id)}
            className="border-2 border-[#FF3816] text-[#FF3816] hover:bg-[#FF3816] hover:text-white rounded-xl text-sm font-bold px-4 py-2 transition-all flex items-center gap-2"
          >
            <FiTrash2 size={15} /> Eliminar
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatBubble({
  icon,
  value,
  label,
  small = false,
}: {
  icon: React.ReactNode;
  value: any;
  label: string;
  small?: boolean;
}) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <div className="text-[#EE7203]">{icon}</div>
        <p className={`font-black text-[#0C212D] ${small ? "text-xs" : "text-lg"}`}>{value}</p>
      </div>
      <p className="text-xs text-[#112C3E]/50 font-semibold uppercase tracking-wide">{label}</p>
    </div>
  );
}

// Keyframes inyectados una sola vez
if (typeof document !== "undefined") {
  if (!document.head.querySelector("[data-material-anim]")) {
    const s = document.createElement("style");
    s.setAttribute("data-material-anim", "true");
    s.textContent = `@keyframes fadeInUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }`;
    document.head.appendChild(s);
  }
}