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
  FiUsers,
  FiBookOpen,
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

  /* LOAD ON MOUNT */
  useEffect(() => {
    if (!profesores?.length) loadProfesores?.();
  }, [profesores]);

  /* FILTER LIST */
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

  /* OPEN CREATE */
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

  /* OPEN EDIT */
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
            prof.createdAt?.toDate ? prof.createdAt.toDate() : prof.createdAt
          )
            .toISOString()
            .slice(0, 10)
        : "",
      idiomas: idiomas.length > 0 ? idiomas : [{ idioma: "", nivel: "" }],
    });

    setIsModalOpen(true);
  };

  /* SAVE */
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

  /* DELETE */
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

  /* ADD LANGUAGE ENTRY */
  const addIdioma = () => {
    setFormData({
      ...formData,
      idiomas: [...formData.idiomas, { idioma: "", nivel: "" }],
    });
  };

  const languageNames: Record<string, string> = {
    ingles: "English",
    espanol: "Spanish",
    portugues: "Portuguese",
    italiano: "Italian",
    frances: "French",
  };

  return (
    <div className="min-h-screen p-6 md:p-10 space-y-8">
      {/* HEADER SECTION */}
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200">
              <FiBookOpen className="text-orange-600" size={18} />
              <span className="text-sm font-semibold text-orange-700">
                Instructor Management
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0C212D] tracking-tight">
              Campus Teachers
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Manage and edit all instructors across the Further Corporate
              learning platform.
            </p>
          </div>

          {/* Stats + Action */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white border-2 border-[#0C212D] shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-[#0C212D] flex items-center justify-center">
                <FiUsers className="text-white" size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Total Teachers
                </p>
                <p className="text-2xl font-bold text-[#0C212D]">
                  {filtered.length}
                </p>
              </div>
            </div>

           
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FiSearch className="text-[#EE7203]" size={20} />
            <h3 className="text-lg font-bold text-[#0C212D]">Search</h3>
          </div>

          <div className="relative group max-w-xl">
            <FiSearch
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#EE7203] transition-colors"
            />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm 
              focus:border-[#EE7203] focus:ring-4 focus:ring-orange-100 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* LIST */}
      {loadingProfesores ? (
        <div className="text-center py-20">
          <div className="inline-block w-16 h-16 border-4 border-[#EE7203] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading teachers...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-300">
          <FiUsers className="mx-auto text-gray-300" size={64} />
          <p className="mt-4 text-gray-500 text-lg font-medium">
            No teachers found.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-[#0C212D] to-[#112C3E]">
                  <th className="text-left px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">
                    Languages & Levels
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">
                    Since
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filtered.map((p: any, i: number) => (
                  <tr
                    key={i}
                    className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-all group"
                  >
                    {/* TEACHER */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#EE7203] to-[#FF3816] flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-110 transition-transform">
                          {p.nombre?.charAt(0)?.toUpperCase() || "T"}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#0C212D] text-base">
                            {p.nombre} {p.apellido}
                          </span>
                          <span className="text-sm text-gray-500 flex items-center gap-1.5">
                            <FiMail size={13} />
                            {p.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* LANGUAGES */}
                    <td className="px-6 py-5">
                      {!p.idiomasProfesor || p.idiomasProfesor.length === 0 ? (
                        <span className="text-gray-400 text-sm italic">
                          No languages assigned
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {p.idiomasProfesor.map((it: any, idx: number) => (
                            <div
                              key={idx}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200"
                            >
                              <FiGlobe size={14} className="text-[#EE7203]" />
                              <span className="text-sm font-medium text-[#0C212D]">
                                {languageNames[it.idioma] || it.idioma}
                              </span>
                              <span className="text-gray-400">·</span>
                              <FiFlag size={14} className="text-[#FF3816]" />
                              <span className="text-sm font-semibold text-[#0C212D]">
                                {it.nivel}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* DATE */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-gray-600">
                        <FiCalendar size={14} className="text-[#EE7203]" />
                        <span className="text-sm font-medium">
                          {p.createdAt
                            ? new Date(
                                p.createdAt?.toDate
                                  ? p.createdAt.toDate()
                                  : p.createdAt
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "N/A"}
                        </span>
                      </div>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-6 py-5">
                      <div className="flex gap-3">
                        <button
                          onClick={() => openEdit(p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                          bg-[#0C212D] text-white text-sm font-medium
                          hover:bg-[#112C3E] hover:scale-105 transition-all shadow-sm"
                        >
                          <FiEdit2 size={14} />
                          Edit
                        </button>

                        <button
                          onClick={() => deleteTeacher(p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                          bg-white border-2 border-[#FF3816] text-[#FF3816] text-sm font-medium
                          hover:bg-[#FF3816] hover:text-white hover:scale-105 transition-all"
                        >
                          <FiTrash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-gray-200">
            {filtered.map((p: any, i: number) => (
              <div
                key={i}
                className="p-5 space-y-4 hover:bg-orange-50 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#EE7203] to-[#FF3816] flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0">
                    {p.nombre?.charAt(0)?.toUpperCase() || "T"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#0C212D] text-lg">
                      {p.nombre} {p.apellido}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5 truncate">
                      <FiMail size={13} />
                      {p.email}
                    </p>
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    Languages & Levels
                  </p>
                  {!p.idiomasProfesor || p.idiomasProfesor.length === 0 ? (
                    <span className="text-gray-400 text-sm italic">
                      No languages assigned
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {p.idiomasProfesor.map((it: any, idx: number) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <FiGlobe size={12} className="text-[#EE7203]" />
                          <span className="text-xs font-medium text-[#0C212D]">
                            {languageNames[it.idioma] || it.idioma}
                          </span>
                          <span className="text-gray-400 text-xs">·</span>
                          <FiFlag size={12} className="text-[#FF3816]" />
                          <span className="text-xs font-semibold text-[#0C212D]">
                            {it.nivel}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Date */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    Since
                  </p>
                  <p className="text-sm text-gray-700">
                    {p.createdAt
                      ? new Date(
                          p.createdAt?.toDate
                            ? p.createdAt.toDate()
                            : p.createdAt
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "N/A"}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg
                    bg-[#0C212D] text-white text-sm font-medium
                    hover:bg-[#112C3E] transition-all"
                  >
                    <FiEdit2 size={14} />
                    Edit
                  </button>

                  <button
                    onClick={() => deleteTeacher(p)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg
                    bg-white border-2 border-[#FF3816] text-[#FF3816] text-sm font-medium
                    hover:bg-[#FF3816] hover:text-white transition-all"
                  >
                    <FiTrash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <DialogContent
            className="
              fixed left-1/2 top-1/2
              -translate-x-1/2 -translate-y-1/2
              z-50 w-[92vw] max-w-lg
              rounded-2xl bg-white p-0 shadow-2xl
              border-2 border-gray-200
            "
          >
            <VisuallyHidden>
              <DialogTitle>
                {editing ? "Edit Teacher" : "Create Teacher"}
              </DialogTitle>
            </VisuallyHidden>

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#0C212D] to-[#112C3E] px-6 py-5 rounded-t-xl">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FiUser size={22} />
                Edit Teacher
              </h2>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              {/* NAME FIELDS */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase mb-2 block">
                    First Name
                  </label>
                  <input
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm
                    focus:border-[#EE7203] focus:ring-4 focus:ring-orange-100 outline-none transition-all"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase mb-2 block">
                    Last Name
                  </label>
                  <input
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm
                    focus:border-[#EE7203] focus:ring-4 focus:ring-orange-100 outline-none transition-all"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase mb-2 block">
                  Email Address
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm
                  focus:border-[#EE7203] focus:ring-4 focus:ring-orange-100 outline-none transition-all"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              {/* LANGUAGES */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-gray-600 uppercase">
                    Languages & Levels
                  </label>
                  <Button
                    size="sm"
                    onClick={addIdioma}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold
                    bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white
                    hover:shadow-md transition-all"
                  >
                    <FiPlus size={14} className="mr-1" />
                    Add Language
                  </Button>
                </div>

                <div className="space-y-3">
                  {formData.idiomas.map((it, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 items-center p-3 bg-gray-50 rounded-xl border border-gray-200"
                    >
                      <select
                        className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm
                        focus:border-[#EE7203] focus:ring-2 focus:ring-orange-100 outline-none"
                        value={it.idioma}
                        onChange={(e) => {
                          const updated = [...formData.idiomas];
                          updated[idx].idioma = e.target.value;
                          setFormData({ ...formData, idiomas: updated });
                        }}
                      >
                        <option value="">Select Language</option>
                        <option value="ingles">Inglés</option>
                        <option value="espanol">Español</option>
                        <option value="portugues">Portugués</option>
                        <option value="italiano">Italiano</option>
                        <option value="frances">Francés</option>
                      </select>

                      <select
                        className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm
                        focus:border-[#EE7203] focus:ring-2 focus:ring-orange-100 outline-none"
                        value={it.nivel}
                        onChange={(e) => {
                          const updated = [...formData.idiomas];
                          updated[idx].nivel = e.target.value;
                          setFormData({ ...formData, idiomas: updated });
                        }}
                      >
                        <option value="">Level</option>
                        <option value="A1">A1</option>
                        <option value="A2">A2</option>
                        <option value="B1">B1</option>
                        <option value="B2">B2</option>
                        <option value="B2.5">B2.5</option>
                        <option value="C1">C1</option>
                        <option value="C2">C2</option>
                      </select>

                      <button
                        onClick={() => {
                          const updated = formData.idiomas.filter(
                            (_, j) => j !== idx
                          );
                          setFormData({ ...formData, idiomas: updated });
                        }}
                        className="p-2 rounded-lg hover:bg-red-50 text-[#FF3816] transition-colors"
                      >
                        <FiX size={18} />
                      </button>
                    </div>
                  ))}

                  {formData.idiomas.length === 0 && (
                    <p className="text-sm text-gray-400 italic text-center py-4">
                      No languages added yet. Click "Add Language" to start.
                    </p>
                  )}
                </div>
              </div>

              {/* DATE */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase mb-2 block">
                  Registration Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm
                  focus:border-[#EE7203] focus:ring-4 focus:ring-orange-100 outline-none transition-all"
                  value={formData.createdAt}
                  onChange={(e) =>
                    setFormData({ ...formData, createdAt: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 px-6 py-4 bg-gray-50 rounded-b-xl border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm
                bg-white border-2 border-gray-300 text-gray-700
                hover:bg-gray-100 transition-all"
              >
                Cancel
              </Button>

              <Button
                onClick={handleSave}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm
                bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white
                hover:shadow-lg hover:scale-105 transition-all"
              >
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </div>
  );
}