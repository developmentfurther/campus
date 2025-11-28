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
import { doc, updateDoc } from "firebase/firestore";

export default function ProfesoresPage() {
  const { profesores, loadProfesores, loadingProfesores } = useAuth();

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    idiomas: [] as { idioma: string; nivel: string }[],
    createdAt: "",
  });

  /* =========================================================
     LOAD ON MOUNT
  ========================================================= */
  useEffect(() => {
    if (!profesores?.length) loadProfesores?.();
  }, [profesores]);

  /* =========================================================
     FILTER LIST
  ========================================================= */
  const filtered = useMemo(() => {
    if (!Array.isArray(profesores)) return [];
    const q = search.toLowerCase();

    return profesores.filter((p: any) => {
      return (
        p.email?.toLowerCase().includes(q) ||
        p.nombre?.toLowerCase().includes(q) ||
        p.apellido?.toLowerCase().includes(q)
      );
    });
  }, [profesores, search]);

  /* =========================================================
     OPEN CREATE
  ========================================================= */
  const openCreate = () => {
    setEditing(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      idiomas: [],
      createdAt: "",
    });
    setIsModalOpen(true);
  };

  /* =========================================================
     OPEN EDIT
  ========================================================= */
 const openEdit = (prof: any) => {
  setEditing(prof);

  const idiomas = Array.isArray(prof.idiomasProfesor)
    ? prof.idiomasProfesor
    : [];

  setFormData({
    firstName: prof.nombre || "",
    lastName: prof.apellido || "",
    email: prof.email || "",
    createdAt: prof.createdAt
      ? new Date(
          prof.createdAt?.toDate
            ? prof.createdAt.toDate()
            : prof.createdAt
        )
          .toISOString()
          .slice(0, 10)
      : "",
    idiomas: idiomas.length > 0 ? idiomas : [{ idioma: "", nivel: "" }],
  });

  setIsModalOpen(true);
};


  /* =========================================================
     SAVE
  ========================================================= */
  const handleSave = async () => {
    if (!editing) {
      toast.error("Solo se puede editar profesores existentes.");
      return;
    }

    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error("Complete name and email.");
      return;
    }

    try {
      const ref = doc(db, "alumnos", editing.batchId);

      await updateDoc(ref, {
        [`${editing.userKey}.firstName`]: formData.firstName,
        [`${editing.userKey}.lastName`]: formData.lastName,
        [`${editing.userKey}.email`]: formData.email,
        [`${editing.userKey}.idiomasProfesor`]: formData.idiomas,
        [`${editing.userKey}.createdAt`]:
          formData.createdAt || new Date().toISOString(),
      });

      toast.success("Teacher updated.");

      setIsModalOpen(false);
      setEditing(null);

      loadProfesores?.();
    } catch (err) {
      console.error(err);
      toast.error("Error updating teacher.");
    }
  };

  /* =========================================================
     DELETE
  ========================================================= */
  const deleteTeacher = async (prof: any) => {
    const ok = confirm("Delete this teacher?");
    if (!ok) return;

    try {
      const ref = doc(db, "alumnos", prof.batchId);

      await updateDoc(ref, {
        [`${prof.userKey}.role`]: "alumno",
        [`${prof.userKey}.idiomasProfesor`]: [],
      });

      toast.success("Teacher removed (role reverted to alumno).");
      loadProfesores?.();
    } catch (err) {
      console.error(err);
      toast.error("Error removing teacher.");
    }
  };

  /* =========================================================
     ADD LANGUAGE ENTRY
  ========================================================= */
  const addIdioma = () => {
    setFormData({
      ...formData,
      idiomas: [...formData.idiomas, { idioma: "", nivel: "" }],
    });
  };

  /* =========================================================
     RENDER
  ========================================================= */
  return (
    <div className="min-h-screen p-8 space-y-10 bg-gray-50 text-gray-800">

      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FiUser className="text-blue-600" />
            Teachers
          </h1>
          <p className="text-gray-500">
            Manage and edit campus instructors.
          </p>
        </div>

        <Button
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          disabled
        >
          <FiPlus size={16} /> New Teacher (Disabled)
        </Button>
      </header>

      {/* SEARCH */}
      <div className="relative max-w-md">
        <FiSearch className="absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-10 pr-3 py-2 border rounded-lg shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* LIST */}
      {loadingProfesores ? (
        <div className="text-center py-10 bg-white rounded-xl border shadow-sm">
          Loading teachers...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border shadow-sm">
          No teachers found.
        </div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-5 py-3 text-left">Teacher</th>
                <th className="px-5 py-3 text-left">Languages</th>
                <th className="px-5 py-3 text-left">Since</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((p: any, i: number) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  {/* NAME */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        {p.nombre?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">
                          {p.nombre} {p.apellido}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <FiMail size={12} /> {p.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* LANGUAGES */}
                  <td className="px-5 py-4">
                    {p.idiomasProfesor?.length === 0 ? (
                      <span className="text-gray-400 text-xs">No languages</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {p.idiomasProfesor.map((it: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-xs text-gray-700"
                          >
                            <FiGlobe size={12} /> {it.idioma} —
                            <FiFlag size={12} /> {it.nivel}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* DATE */}
                  <td className="px-5 py-4 text-gray-600">
                    {p.createdAt
                      ? new Date(
                          p.createdAt?.toDate
                            ? p.createdAt.toDate()
                            : p.createdAt
                        ).toLocaleDateString()
                      : "N/A"}
                  </td>

                  {/* ACTIONS */}
                  <td className="px-5 py-4 flex gap-3">
                    <button
                      onClick={() => openEdit(p)}
                      className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                    >
                      <FiEdit2 size={12} /> Edit
                    </button>

                    <button
                      onClick={() => deleteTeacher(p)}
                      className="text-red-600 hover:text-red-800 text-xs flex items-center gap-1"
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
          <DialogOverlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <DialogContent
            className="
              fixed left-1/2 top-1/2
              -translate-x-1/2 -translate-y-1/2
              z-50 w-[92vw] max-w-md
              rounded-xl bg-white p-6 shadow-xl
            "
          >
            <VisuallyHidden>
              <DialogTitle>
                {editing ? "Edit Teacher" : "Create Teacher"}
              </DialogTitle>
            </VisuallyHidden>

            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <FiUser className="text-blue-600" />
              Edit Teacher
            </h2>

            <div className="space-y-4">
              {/* FIRST / LAST NAME */}
              <div className="grid grid-cols-2 gap-4">
                <input
                  className="border p-2 rounded"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                />
                <input
                  className="border p-2 rounded"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                />
              </div>

              {/* EMAIL */}
              <input
                className="border p-2 rounded w-full"
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />

              {/* LANGUAGES */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Languages</span>
                  <Button
                    size="sm"
                    onClick={addIdioma}
                    className="text-xs bg-blue-500 text-white"
                  >
                    Add
                  </Button>
                </div>

                <div className="space-y-3">
                  {formData.idiomas.map((it, idx) => (
                    <div
                      key={idx}
                      className="flex gap-2 items-center border p-2 rounded"
                    >
                      <select
                        className="border p-1 rounded flex-1"
                        value={it.idioma}
                        onChange={(e) => {
                          const updated = [...formData.idiomas];
                          updated[idx].idioma = e.target.value;
                          setFormData({ ...formData, idiomas: updated });
                        }}
                      >
                        <option value="">Idioma</option>
                        <option value="ingles">Inglés</option>
                        <option value="espanol">Español</option>
                        <option value="portugues">Portugués</option>
                        <option value="italiano">Italiano</option>
                        <option value="frances">Francés</option>
                      </select>

                      <select
                        className="border p-1 rounded flex-1"
                        value={it.nivel}
                        onChange={(e) => {
                          const updated = [...formData.idiomas];
                          updated[idx].nivel = e.target.value;
                          setFormData({ ...formData, idiomas: updated });
                        }}
                      >
                        <option value="">Nivel</option>
                        <option value="A1">A1</option>
                        <option value="A2">A2</option>
                        <option value="B1">B1</option>
                        <option value="B2">B2</option>
                        <option value="B2.5">B2.5</option>
                        <option value="C1">C1</option>
                        <option value="C2">C2</option>
                      </select>

                      <FiX
                        className="cursor-pointer text-red-500"
                        onClick={() => {
                          const updated = formData.idiomas.filter(
                            (_, j) => j !== idx
                          );
                          setFormData({ ...formData, idiomas: updated });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* DATE */}
              <input
                className="border p-2 rounded w-full"
                type="date"
                value={formData.createdAt}
                onChange={(e) =>
                  setFormData({ ...formData, createdAt: e.target.value })
                }
              />
            </div>

            {/* ACTIONS */}
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>

              <Button className="bg-blue-600 text-white" onClick={handleSave}>
                Save
              </Button>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </div>
  );
}
