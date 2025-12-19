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
import { FiBookOpen, FiPlus, FiEye, FiEdit3, FiTrash2, FiUsers, FiLayers } from "react-icons/fi";
import EditCourseForm from "@/components/cursos/edit/EditCourseForm";
import CreateCourse from "@/components/cursos/crear/CreateCourse";

export default function MaterialAcademico() {
  const { allCursos, loadingAllCursos, reloadData } = useAuth();

  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [fullCourseData, setFullCourseData] = useState<any | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const localCourses = useMemo(() => {
    if (!Array.isArray(allCursos)) return [];

    return allCursos.map((c: any) => ({
      id: c.id,
      title: c.titulo || "Untitled",
      description: c.descripcion || "",
      level: c.nivel || "N/A",
      category: c.idioma.toUpperCase() || "General",
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

  const handleCourseCreated = async () => {
    setIsCreateModalOpen(false);
    toast.success("Course created successfully.");
    await reloadData();
  };

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

  const handleDelete = async (id: string) => {
    try {
      if (!confirm("Are you sure you want to delete this course?")) return;

      await deleteDoc(doc(db, "cursos", id));
      toast.success("Course deleted successfully.");

      await reloadData();
    } catch (err) {
      console.error("❌ Error deleting course:", err);
      toast.error("Error deleting the course.");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFullCourseData(null);
    setSelectedCourse(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-12 bg-gradient-to-b from-[#EE7203] to-[#FF3816] rounded-full"></div>
              <div className="flex-1">
                <h1 className="text-4xl font-black text-[#0C212D] flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-[#EE7203] to-[#FF3816] rounded-xl">
                    <FiBookOpen className="text-white" size={28} />
                  </div>
                  Academic Material
                </h1>
                <p className="text-[#112C3E]/70 mt-2 text-base font-medium">
                  Manage the courses available in the campus. Create, edit, or delete academic material.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="group bg-gradient-to-r from-[#EE7203] to-[#FF3816] hover:shadow-2xl hover:shadow-[#EE7203]/40 text-white rounded-xl px-8 py-6 text-base font-bold transition-all duration-300 hover:scale-105 flex items-center gap-3"
          >
            <FiPlus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
            New Material
          </Button>
        </header>

        {/* LIST */}
        {loadingAllCursos ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#EE7203] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#112C3E] font-semibold">Loading materials...</p>
            </div>
          </div>
        ) : localCourses.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-gradient-to-br from-[#0C212D] to-[#112C3E] w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <FiBookOpen className="text-white" size={40} />
            </div>
            <h3 className="text-2xl font-black text-[#0C212D] mb-3">No materials yet</h3>
            <p className="text-[#112C3E]/60">Create your first course to get started.</p>
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

        {/* MODAL: CREATE COURSE */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogOverlay className="fixed inset-0 bg-black/50 z-40" />

          <DialogContent
            className="!max-w-none !w-[95vw] !h-[90vh] !p-0 overflow-hidden 
                       bg-transparent shadow-none border-none
                       [&>button.absolute.right-4.top-4]:hidden"
          >
            <VisuallyHidden>
              <DialogTitle>Create Material</DialogTitle>
            </VisuallyHidden>

            {isCreateModalOpen && (
              <CreateCourse
                onClose={() => setIsCreateModalOpen(false)}
                onCreated={handleCourseCreated}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* MODAL: EDIT COURSE */}
        <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
          <DialogOverlay className="fixed inset-0 bg-black/50 z-40" />

          <DialogContent
            className="!max-w-none !w-[95vw] !h-[90vh] !p-0 overflow-hidden 
                       bg-transparent shadow-none border-none
                       [&>button.absolute.right-4.top-4]:hidden"
          >
            <VisuallyHidden>
              <DialogTitle>Edit Course</DialogTitle>
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
    </div>
  );
}

function CourseCard({ course, index, onEdit, onDelete }) {
  return (
    <div
      className="group relative bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 border-2 border-gray-100 hover:border-[#EE7203]/30 overflow-hidden"
      style={{
        animation: 'fadeInUp 0.5s ease-out forwards',
        animationDelay: `${index * 0.1}s`,
        opacity: 0
      }}
    >
      {/* Decorative gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#EE7203] via-[#FF3816] to-[#EE7203] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#EE7203]/5 to-[#FF3816]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* Content */}
      <div className="relative z-10">
        {/* HEADER */}
        <div className="p-6 border-b-2 border-gray-100 group-hover:border-[#EE7203]/20 transition-colors">
          <div className="flex justify-between items-start gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-black text-[#0C212D] group-hover:text-[#EE7203] transition-colors duration-300 line-clamp-1">
                {course.title}
              </h2>
              <p className="text-sm text-[#112C3E]/70 line-clamp-2 mt-2 leading-relaxed">
                {course.description || "No description"}
              </p>
            </div>

            <span
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-lg font-bold uppercase tracking-wide shadow-sm ${
                course.visible
                  ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {course.visible ? "Public" : "Hidden"}
            </span>
          </div>

          {/* Category & Level */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="px-3 py-1 bg-gradient-to-r from-[#0C212D] to-[#112C3E] text-white text-xs font-bold rounded-lg">
              {course.category}
            </span>
            <span className="px-3 py-1 bg-white border-2 border-[#EE7203] text-[#EE7203] text-xs font-bold rounded-lg">
              Level {course.level}
            </span>
          </div>
        </div>

        {/* STATS */}
        <div className="px-6 py-5 grid grid-cols-3 gap-4 border-b-2 border-gray-100">
          <StatBubble
            icon={<FiLayers size={18} />}
            value={course.unidades}
            label="Units"
          />
          <StatBubble
            icon={<FiUsers size={18} />}
            value={course.students}
            label="Students"
          />
          <StatBubble
            icon={<FiBookOpen size={18} />}
            value={course.created}
            label="Created"
            small
          />
        </div>

        {/* ACTIONS */}
        <div className="flex flex-wrap justify-end gap-3 p-6 bg-gradient-to-br from-gray-50 to-white">
          <Button
            variant="outline"
            onClick={() => window.open(`/material-academico/${course.id}`, "_blank")}
            className="group/btn border-2 border-[#0C212D] text-[#0C212D] hover:bg-[#0C212D] hover:text-white rounded-xl text-sm font-bold px-5 py-2 transition-all duration-300 flex items-center gap-2"
          >
            <FiEye size={16} className="group-hover/btn:scale-110 transition-transform" />
            View
          </Button>

          <Button
            variant="outline"
            onClick={() => onEdit(course)}
            className="group/btn border-2 border-[#EE7203] text-[#EE7203] hover:bg-[#EE7203] hover:text-white rounded-xl text-sm font-bold px-5 py-2 transition-all duration-300 flex items-center gap-2"
          >
            <FiEdit3 size={16} className="group-hover/btn:scale-110 transition-transform" />
            Edit
          </Button>

          <Button
            variant="outline"
            onClick={() => onDelete(course.id)}
            className="group/btn border-2 border-[#FF3816] text-[#FF3816] hover:bg-[#FF3816] hover:text-white rounded-xl text-sm font-bold px-5 py-2 transition-all duration-300 flex items-center gap-2"
          >
            <FiTrash2 size={16} className="group-hover/btn:scale-110 transition-transform" />
            Delete
          </Button>
        </div>
      </div>

      {/* Corner decoration */}
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-[#EE7203]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-tl-full transform translate-x-16 translate-y-16 group-hover:translate-x-8 group-hover:translate-y-8"></div>
    </div>
  );
}

function StatBubble({ icon, value, label, small = false }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="text-[#EE7203]">{icon}</div>
        <p className={`font-black text-[#0C212D] ${small ? 'text-xs' : 'text-xl'}`}>
          {value}
        </p>
      </div>
      <p className="text-xs text-[#112C3E]/60 font-semibold uppercase tracking-wide">
        {label}
      </p>
    </div>
  );
}

// Animation CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  if (!document.head.querySelector('style[data-admin-courses]')) {
    style.setAttribute('data-admin-courses', 'true');
    document.head.appendChild(style);
  }
}