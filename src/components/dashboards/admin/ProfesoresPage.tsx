"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useMemo, useEffect } from "react";
import {
  FiSearch,
  FiUser,
  FiMail,
  FiCalendar,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiX,
  FiGlobe,
  FiFlag,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogTitle,
  DialogPortal,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, updateDoc, deleteField } from "firebase/firestore";
import { addProfesorToBatch } from "@/lib/profesorBatches";

export default function TeachersPage() {
  const {
    profesores,
    loadProfesores,
    loadingProfesores,
    reloadData,
  } = useAuth();

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfesor, setEditingProfesor] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    idioma: "",
    nivel: "",
    createdAt: "",
  });

  // Load professors on mount if empty
  useEffect(() => {
    if (!profesores?.length) {
      loadProfesores?.();
    }
  }, [profesores]);

  // 🔹 Filter list dynamically
  const filteredProfesores = useMemo(() => {
    if (!Array.isArray(profesores)) return [];
    return profesores.filter((p) => {
      const q = search.toLowerCase();
      return (
        p.email?.toLowerCase().includes(q) ||
        p.nombre?.toLowerCase().includes(q) ||
        p.apellido?.toLowerCase().includes(q)
      );
    });
  }, [profesores, search]);

  /* =========================================================
     🔹 DELETE TEACHER
  ========================================================= */
  const handleDelete = async (id: string) => {
    try {
      const confirmDelete = confirm("Are you sure you want to delete this teacher?");
      if (!confirmDelete) return;

      const ref = doc(db, "profesores", "batch_1");

      await updateDoc(ref, {
        [id]: deleteField(),
      });

      toast.success("Teacher deleted successfully.");
      await loadProfesores?.();
    } catch (err) {
      console.error("❌ Error deleting teacher:", err);
      toast.error("Error deleting teacher.");
    }
  };

  /* =========================================================
     🔹 SAVE TEACHER (CREATE / EDIT)
  ========================================================= */
  const handleSave = async () => {
    const { nombre, apellido, email, idioma, nivel, createdAt } = formData;

    if (!email || !nombre || !apellido || !idioma || !nivel) {
      toast.error("Please complete all fields.");
      return;
    }

    try {
      const ref = doc(db, "profesores", "batch_1");

      if (editingProfesor) {
        // UPDATE existing teacher
        await updateDoc(ref, {
          [`${editingProfesor.id}`]: {
            ...editingProfesor,
            nombre,
            apellido,
            email,
            idioma,
            nivel,
            createdAt: createdAt
              ? new Date(createdAt).toISOString()
              : new Date().toISOString(),
          },
        });

        toast.success("Teacher updated successfully.");
      } else {
        // CREATE new teacher
        await addProfesorToBatch({
          nombre,
          apellido,
          email,
          idioma,
          nivel,
          createdAt: createdAt
            ? new Date(createdAt).toISOString()
            : new Date().toISOString(),
        });

        toast.success("Teacher created successfully.");
      }

      setIsModalOpen(false);
      setEditingProfesor(null);
      setFormData({
        nombre: "",
        apellido: "",
        email: "",
        idioma: "",
        nivel: "",
        createdAt: "",
      });

      await loadProfesores?.();
    } catch (err) {
      console.error("❌ Error saving teacher:", err);
      toast.error("Error saving teacher.");
    }
  };

  /* =========================================================
     🔹 OPEN CREATE MODAL
  ========================================================= */
  const openModalForCreate = () => {
    setEditingProfesor(null);
    setFormData({
      nombre: "",
      apellido: "",
      email: "",
      idioma: "",
      nivel: "",
      createdAt: "",
    });
    setIsModalOpen(true);
  };

  /* =========================================================
     🔹 OPEN EDIT MODAL
  ========================================================= */
  const openModalForEdit = (profesor: any) => {
    setEditingProfesor(profesor);
    setFormData({
      nombre: profesor.nombre || "",
      apellido: profesor.apellido || "",
      email: profesor.email || "",
      idioma: profesor.idioma || "",
      nivel: profesor.nivel || "",
      createdAt: profesor.createdAt
        ? profesor.createdAt?.toDate
          ? profesor.createdAt.toDate().toISOString().slice(0, 10)
          : profesor.createdAt.slice(0, 10)
        : "",
    });
    setIsModalOpen(true);
  };

  /* =========================================================
     🔹 RENDER
  ========================================================= */

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8 space-y-10">

      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FiUser className="text-blue-600" />
            Teachers
          </h1>
          <p className="text-gray-500 mt-1">
            Manage campus teachers. Create, edit, or remove instructors.
          </p>
        </div>

        <Button
          onClick={openModalForCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <FiPlus size={16} /> New Teacher
        </Button>
      </header>

      {/* SEARCH BAR */}
      <div className="relative max-w-md">
        <FiSearch size={18} className="absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Search teacher by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm 
          focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
        />
      </div>

      {/* LIST */}
      {loadingProfesores ? (
        <div className="text-center text-gray-500 py-10 bg-white rounded-xl border shadow-sm">
          Loading teachers...
        </div>
      ) : filteredProfesores.length === 0 ? (
        <div className="text-center text-gray-500 py-10 bg-white rounded-xl border shadow-sm">
          No teachers registered.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          
          {/* TABLE */}
          <table className="w-full text-sm table-auto border-collapse">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-semibold">
              <tr>
                <th className="px-5 py-3 text-left w-[35%]">Teacher</th>
                <th className="px-5 py-3 text-left w-[20%]">Language</th>
                <th className="px-5 py-3 text-left w-[20%]">Level</th>
                <th className="px-5 py-3 text-left w-[15%]">Registration Date</th>
                <th className="px-5 py-3 text-left w-[10%]">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredProfesores.map((p, i) => (
                <tr
                  key={i}
                  className="border-t border-gray-100 hover:bg-gray-50 transition"
                >
                  {/* NAME */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        {p.nombre?.charAt(0)?.toUpperCase() ?? "T"}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800">
                          {p.nombre} {p.apellido}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <FiMail size={12} />
                          {p.email}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* LANGUAGE */}
                  <td className="px-5 py-4 text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <FiGlobe size={12} className="text-gray-400" />
                      {p.idioma || "-"}
                    </span>
                  </td>

                  {/* LEVEL */}
                  <td className="px-5 py-4 text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <FiFlag size={12} className="text-gray-400" />
                      {p.nivel || "-"}
                    </span>
                  </td>

                  {/* DATE */}
                  <td className="px-5 py-4 text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <FiCalendar size={12} className="text-gray-400" />
                      {p.createdAt ? (
                        new Date(
                          p.createdAt?.toDate
                            ? p.createdAt.toDate()
                            : p.createdAt
                        ).toLocaleDateString("en-US")
                      ) : (
                        "N/A"
                      )}
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td className="px-5 py-4 flex gap-2">
                    <button
                      onClick={() => openModalForEdit(p)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-semibold"
                    >
                      <FiEdit2 size={12} /> Edit
                    </button>

                    <button
                      onClick={() => handleDelete(p.id)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-800 text-xs font-semibold"
                    >
                      <FiTrash2 size={12} /> Delete
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
          <DialogContent
            className="
              fixed left-1/2 top-1/2 z-50
              -translate-x-1/2 -translate-y-1/2
              w-[92vw] max-w-md
              rounded-xl border bg-white p-6 shadow-2xl
              max-h-[90vh] overflow-y-auto
              focus:outline-none
            "
          >
            <VisuallyHidden>
              <DialogTitle>
                {editingProfesor ? "Edit Teacher" : "New Teacher"}
              </DialogTitle>
            </VisuallyHidden>

            {/* TITLE ROW */}
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-800">
                <FiUser className="text-blue-600" />
                {editingProfesor ? "Edit Teacher" : "New Teacher"}
              </h2>
            </div>

            {/* FORM */}
            <div className="space-y-5">

              {/* NAME / LAST NAME */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-600 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="John"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-600 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Doe"
                    value={formData.apellido}
                    onChange={(e) =>
                      setFormData({ ...formData, apellido: e.target.value })
                    }
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-600 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="teacher@further.edu"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* DATE */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-600 mb-1">
                  Registration Date
                </label>
                <input
                  type="date"
                  value={formData.createdAt || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, createdAt: e.target.value })
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* LANGUAGE & LEVEL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* LANGUAGE */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-600 mb-1">
                    Language
                  </label>
                  <select
                    value={formData.idioma}
                    onChange={(e) =>
                      setFormData({ ...formData, idioma: e.target.value })
                    }
                    className="w-full rounded-lg border px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled hidden>
                      Select language
                    </option>
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="Portuguese">Portuguese</option>
                    <option value="Italian">Italian</option>
                    <option value="French">French</option>
                  </select>
                </div>

                {/* LEVEL */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-600 mb-1">
                    Level
                  </label>
                  <select
                    value={formData.nivel}
                    onChange={(e) =>
                      setFormData({ ...formData, nivel: e.target.value })
                    }
                    className="w-full rounded-lg border px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled hidden>
                      Select level
                    </option>
                    <option value="A1">A1 - Beginner</option>
                    <option value="A2">A2 - Elementary</option>
                    <option value="B1">B1 - Intermediate</option>
                    <option value="B2">B2 - Upper Intermediate</option>
                    <option value="C1">C1 - Advanced</option>
                    <option value="C2">C2 - Mastery</option>
                  </select>
                </div>

              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border-gray-300 px-4 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </Button>

              <Button
                onClick={handleSave}
                className="rounded-lg bg-blue-600 px-4 text-white hover:bg-blue-700"
              >
                {editingProfesor ? "Save Changes" : "Create Teacher"}
              </Button>
            </div>

          </DialogContent>
        </DialogPortal>
      </Dialog>
    </div>
  );
}
