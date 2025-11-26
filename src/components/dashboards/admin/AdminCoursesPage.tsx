"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogOverlay,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FiBookOpen, FiPlus } from "react-icons/fi";
import EditCourseForm from "@/components/cursos/edit/EditCourseForm";
import CreateCourse from "@/components/cursos/crear/CreateCourse";

/* =====================================================================================
   📘 MATERIAL ACADEMICO (ADMIN)
   - Usa allCursos del AuthContext (datos completos)
   - Modal sin lag
   - Sin X duplicada (Radix)
   ===================================================================================== */

export default function MaterialAcademico() {
  const { allCursos, loadingAllCursos, reloadData } = useAuth();

  // Estados UI
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [fullCourseData, setFullCourseData] = useState<any | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  /* ============================================================================
     📌 Mapeamos cursos para la UI (rápido, sin fetch)
     ============================================================================ */
  const localCourses = useMemo(() => {
    if (!Array.isArray(allCursos)) return [];

    return allCursos.map((c: any) => ({
      id: c.id,
      title: c.titulo || "Untitled",
      description: c.descripcion || "",
      level: c.nivel || "N/A",
      category: c.categoria || "General",
      students: Array.isArray(c.cursantes) ? c.cursantes.length : 0,
      unidades: Array.isArray(c.unidades) ? c.unidades.length : 0,
      created:
        c.creadoEn?.seconds
          ? new Date(c.creadoEn.seconds * 1000).toLocaleDateString()
          : "N/A",
      visible: c.publico ?? true,
      image: c.urlImagen || "/images/default-course.jpg",
      videoPresentacion: c.videoPresentacion || "",
    }));
  }, [allCursos]);

  /* ============================================================================
     🟦 Crear curso
     ============================================================================ */
  const handleCourseCreated = async () => {
    setIsCreateModalOpen(false);
    toast.success("Curso creado correctamente");
    await reloadData();
  };

  /* ============================================================================
     ✏ Editar curso — instantáneo, sin fetch
     ============================================================================ */
  const handleEdit = (course: any) => {
    const full = allCursos.find((c) => c.id === course.id);

    if (!full) {
      toast.error("No se pudo cargar el curso");
      return;
    }

    setSelectedCourse(course);
    setFullCourseData(full);
    setIsModalOpen(true);
  };

  /* ============================================================================
     ❌ Eliminar curso
     ============================================================================ */
  const handleDelete = async (id: string) => {
    try {
      if (!confirm("¿Seguro que deseas eliminar este curso?")) return;

      await deleteDoc(doc(db, "cursos", id));
      toast.success("Curso eliminado correctamente");

      await reloadData();
    } catch (err) {
      console.error("❌ Error eliminando curso:", err);
      toast.error("Error al eliminar el curso");
    }
  };

  /* ============================================================================
     🔒 Cerrar modal y limpiar estados
     ============================================================================ */
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFullCourseData(null);
    setSelectedCourse(null);
  };

  /* =====================================================================================
       JSX
     ===================================================================================== */
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8 space-y-10">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FiBookOpen className="text-blue-600" />
            Material Académico
          </h1>

          <p className="text-gray-500 mt-1">
            Administra los cursos disponibles en el campus. Crea, edita o elimina material académico.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
        >
          <FiPlus size={18} /> Nuevo Material
        </Button>
      </header>

      {/* LISTADO */}
      {loadingAllCursos ? (
        <div className="text-center text-gray-500 py-10 bg-white rounded-xl border border-gray-200 shadow-sm">
          Cargando cursos...
        </div>
      ) : localCourses.length === 0 ? (
        <div className="text-center text-gray-500 py-10 bg-white rounded-xl border border-gray-200 shadow-sm">
          No hay cursos disponibles por el momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {localCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              {/* HEADER */}
              <div className="p-5 border-b border-gray-100 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{course.title}</h2>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {course.description || "Sin descripción"}
                  </p>
                </div>

                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${
                    course.visible
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {course.visible ? "Público" : "Oculto"}
                </span>
              </div>

              {/* STATS */}
              <div className="px-5 py-3 text-sm grid grid-cols-2 md:grid-cols-3 gap-2 border-b border-gray-100">
                <div className="text-gray-500">
                  <span className="font-medium text-gray-800">{course.unidades}</span> unidades
                </div>
                <div className="text-gray-500">
                  <span className="font-medium text-gray-800">{course.students}</span> alumnos
                </div>
                <div className="text-gray-500 hidden md:block">
                  Creado: <span className="font-medium text-gray-800">{course.created}</span>
                </div>
              </div>

              {/* ACCIONES */}
              <div className="flex flex-wrap justify-end gap-3 p-5 border-t border-gray-100 bg-gray-50">
                <Button
                  variant="outline"
                  onClick={() => window.open(`/material-academico/${course.id}`, "_blank")}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg text-sm"
                >
                  Ver Material
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleEdit(course)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-sm"
                >
                  Editar
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleDelete(course.id)}
                  className="border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                >
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =====================================================================================
         MODAL: CREAR CURSO
         ===================================================================================== */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogOverlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />

        <DialogContent
          className="!max-w-none !w-[95vw] !h-[90vh] !p-0 overflow-hidden 
                     bg-transparent shadow-none border-none
                     [&>button.absolute.right-4.top-4]:hidden"
        >
          <VisuallyHidden>
            <DialogTitle>Crear Curso</DialogTitle>
          </VisuallyHidden>

          {isCreateModalOpen && (
            <CreateCourse
              onClose={() => setIsCreateModalOpen(false)}
              onCreated={handleCourseCreated}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* =====================================================================================
         MODAL: EDITAR CURSO
         ===================================================================================== */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogOverlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />

        <DialogContent
          className="!max-w-none !w-[95vw] !h-[90vh] !p-0 overflow-hidden 
                     bg-transparent shadow-none border-none
                     [&>button.absolute.right-4.top-4]:hidden"
        >
          <VisuallyHidden>
            <DialogTitle>Editar Curso</DialogTitle>
          </VisuallyHidden>

          {isModalOpen && fullCourseData && (
            <EditCourseForm
              courseId={selectedCourse?.id}
              initialData={fullCourseData}
              onClose={handleCloseModal}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
