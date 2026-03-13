"use client";

import { useState, useEffect, useMemo } from "react";
import { fetchAllProfesores, updateProfesor, deleteProfesor, ProfesorProfile } from "@/lib/profesorBatches";
import { getDocs, collection, getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import {
  FiPlus, FiTrash2, FiEdit2, FiSearch, FiX, FiCheck,
  FiUser, FiMail, FiGlobe, FiUsers, FiChevronDown, FiLoader
} from "react-icons/fi";

const IDIOMAS = [
  { v: "en", l: "English" },
  { v: "es", l: "Español" },
  { v: "pt", l: "Português" },
  { v: "fr", l: "Français" },
  { v: "it", l: "Italiano" },
];

const NIVELES = ["A1", "A2", "B1", "B2", "C1", "C2"];
const PAGE_SIZE = 8;

const EMPTY_FORM = {
  email: "",
  password: "",
  nombre: "",
  apellido: "",
  idExterno: "",
  idiomasQueEnseña: ["en"] as string[],
  nivel: "A1",
};

export default function ProfesoresPage() {
  const [profesores, setProfesores] = useState<ProfesorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [alumnos, setAlumnos] = useState<any[]>([]);

  // Filtros de lista
  const [filterNombre, setFilterNombre] = useState("");
  const [filterIdioma, setFilterIdioma] = useState("");
  const [filterNivel, setFilterNivel] = useState("");
  const [page, setPage] = useState(0);

  // Modal crear
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  // Modal editar
  const [editProfesor, setEditProfesor] = useState<ProfesorProfile | null>(null);
  const [editForm, setEditForm] = useState<Partial<ProfesorProfile>>({});

  // Filtro alumnos en modal editar
  const [filterAlumnoNombre, setFilterAlumnoNombre] = useState("");
  const [filterAlumnoEmpresa, setFilterAlumnoEmpresa] = useState("");
  const [alumnosPage, setAlumnosPage] = useState(0);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [profs, alumnosData] = await Promise.all([
        fetchAllProfesores(),
        loadAlumnos(),
      ]);
      setProfesores(profs);
      setAlumnos(alumnosData);
    } finally {
      setLoading(false);
    }
  };

  const loadAlumnos = async () => {
    const snap = await getDocs(collection(db, "alumnos"));
    const result: any[] = [];
    snap.forEach((batchDoc) => {
      if (!batchDoc.id.startsWith("batch_")) return;
      const data = batchDoc.data();
      for (const key in data) {
        if (key.startsWith("user_")) {
          result.push({ ...data[key], batchId: batchDoc.id, userKey: key });
        }
      }
    });
    return result;
  };

  // ─── Filtros lista profesores ─────────────────────────────
  const filteredProfesores = useMemo(() => {
    return profesores.filter((p) => {
      const nombreCompleto = `${p.nombre} ${p.apellido}`.toLowerCase();
      if (filterNombre && !nombreCompleto.includes(filterNombre.toLowerCase())) return false;
      if (filterIdioma && !p.idiomasQueEnseña?.includes(filterIdioma)) return false;
      if (filterNivel && p.nivel !== filterNivel) return false;
      return true;
    });
  }, [profesores, filterNombre, filterIdioma, filterNivel]);

  const paginatedProfesores = filteredProfesores.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filteredProfesores.length / PAGE_SIZE);

  // ─── Filtros alumnos en modal editar ─────────────────────
  const empresas = useMemo(() => {
    return Array.from(new Set(
      alumnos.map(a => a.curso?.toLowerCase().trim()).filter(Boolean)
    )).sort();
  }, [alumnos]);

  const filteredAlumnos = useMemo(() => {
    return alumnos.filter((a) => {
      const nombre = (a.displayName || a.nombre || a.email || "").toLowerCase();
      if (filterAlumnoNombre && !nombre.includes(filterAlumnoNombre.toLowerCase()) &&
          !a.email?.toLowerCase().includes(filterAlumnoNombre.toLowerCase())) return false;
      if (filterAlumnoEmpresa && a.curso?.toLowerCase().trim() !== filterAlumnoEmpresa) return false;
      return true;
    });
  }, [alumnos, filterAlumnoNombre, filterAlumnoEmpresa]);

  const paginatedAlumnos = filteredAlumnos.slice(alumnosPage * PAGE_SIZE, (alumnosPage + 1) * PAGE_SIZE);

  // ─── Crear profesor ───────────────────────────────────────
  const handleCreate = async () => {
    if (!form.email || !form.password || !form.nombre || !form.apellido) {
      toast.error("Completá todos los campos obligatorios");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/profesores/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Profesor creado correctamente");
      setShowCreate(false);
      setForm(EMPTY_FORM);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Error creando profesor");
    } finally {
      setCreating(false);
    }
  };

  // ─── Editar profesor ──────────────────────────────────────
  const openEdit = (p: ProfesorProfile) => {
    setEditProfesor(p);
    setEditForm({ ...p });
    setFilterAlumnoNombre("");
    setFilterAlumnoEmpresa("");
    setAlumnosPage(0);
  };

  const handleSaveEdit = async () => {
    if (!editProfesor) return;
    try {
      await updateProfesor(editProfesor.batchId, editProfesor.userKey, editForm);
      toast.success("Profesor actualizado");
      setEditProfesor(null);
      await loadAll();
    } catch {
      toast.error("Error actualizando profesor");
    }
  };

  const toggleAlumno = (uid: string) => {
    setEditForm((prev) => {
      const current = prev.alumnos || [];
      return {
        ...prev,
        alumnos: current.includes(uid)
          ? current.filter((id) => id !== uid)
          : [...current, uid],
      };
    });
  };

  const toggleIdioma = (v: string, inEdit = false) => {
    if (inEdit) {
      setEditForm((prev) => {
        const current = prev.idiomasQueEnseña || [];
        return {
          ...prev,
          idiomasQueEnseña: current.includes(v)
            ? current.filter((i) => i !== v)
            : [...current, v],
        };
      });
    } else {
      setForm((prev) => {
        const current = prev.idiomasQueEnseña;
        return {
          ...prev,
          idiomasQueEnseña: current.includes(v)
            ? current.filter((i) => i !== v)
            : [...current, v],
        };
      });
    }
  };

  // ─── Eliminar ─────────────────────────────────────────────
  const handleDelete = async (p: ProfesorProfile) => {
    if (!confirm(`¿Eliminar a ${p.nombre} ${p.apellido}? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteProfesor(p.batchId, p.userKey);
      toast.success("Profesor eliminado");
      await loadAll();
    } catch {
      toast.error("Error eliminando profesor");
    }
  };

  const handleToggleActive = async (p: ProfesorProfile) => {
    await updateProfesor(p.batchId, p.userKey, { active: !p.active });
    await loadAll();
  };

  // ─── UI ───────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <FiLoader className="animate-spin text-slate-400" size={28} />
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Profesores</h1>
          <p className="text-sm text-slate-500 mt-1">{profesores.length} profesores registrados</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition"
        >
          <FiPlus size={16} /> Nuevo profesor
        </button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-3 gap-3">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            value={filterNombre}
            onChange={(e) => { setFilterNombre(e.target.value); setPage(0); }}
            placeholder="Buscar por nombre..."
            className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <select
          value={filterIdioma}
          onChange={(e) => { setFilterIdioma(e.target.value); setPage(0); }}
          className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="">Todos los idiomas</option>
          {IDIOMAS.map(i => <option key={i.v} value={i.v}>{i.l}</option>)}
        </select>
        <select
          value={filterNivel}
          onChange={(e) => { setFilterNivel(e.target.value); setPage(0); }}
          className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="">Todos los niveles</option>
          {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      {(filterNombre || filterIdioma || filterNivel) && (
        <button
          onClick={() => { setFilterNombre(""); setFilterIdioma(""); setFilterNivel(""); setPage(0); }}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 transition"
        >
          <FiX size={12} /> Limpiar filtros
        </button>
      )}

      {/* Tabla */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Nombre</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Idiomas</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Nivel</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Alumnos</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedProfesores.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  No hay profesores que coincidan con los filtros
                </td>
              </tr>
            ) : paginatedProfesores.map((p) => (
              <tr key={p.uid} className="hover:bg-slate-50 transition">
                <td className="px-4 py-3 font-semibold text-slate-800">
                  {p.nombre} {p.apellido}
                  {p.idExterno && <span className="ml-2 text-xs text-slate-400">#{p.idExterno}</span>}
                </td>
                <td className="px-4 py-3 text-slate-600">{p.email}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(p.idiomasQueEnseña || []).map(i => (
                      <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg uppercase">{i}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">{p.nivel}</span>
                </td>
                <td className="px-4 py-3 text-slate-600">{p.alumnos?.length || 0}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleActive(p)}
                    className={`px-2 py-0.5 text-xs font-bold rounded-lg transition ${
                      p.active ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-red-50 text-red-700 hover:bg-red-100"
                    }`}
                  >
                    {p.active ? "Activo" : "Inactivo"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => openEdit(p)} className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-500 hover:text-slate-800">
                      <FiEdit2 size={15} />
                    </button>
                    <button onClick={() => handleDelete(p)} className="p-2 hover:bg-red-50 rounded-lg transition text-slate-500 hover:text-red-600">
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >← Anterior</button>
            <span className="text-xs text-slate-400">Página {page + 1} de {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >Siguiente →</button>
          </div>
        )}
      </div>

      {/* ─── MODAL CREAR ─────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-black text-slate-900">Nuevo profesor</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-slate-100 rounded-xl"><FiX /></button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Nombre *</label>
                  <input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Apellido *</label>
                  <input value={form.apellido} onChange={e => setForm(p => ({ ...p, apellido: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Contraseña *</label>
                <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">ID Externo (opcional)</label>
                <input value={form.idExterno} onChange={e => setForm(p => ({ ...p, idExterno: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Idiomas que enseña</label>
                  <div className="flex flex-wrap gap-2">
                    {IDIOMAS.map(i => (
                      <button
                        key={i.v}
                        type="button"
                        onClick={() => toggleIdioma(i.v)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition ${
                          form.idiomasQueEnseña.includes(i.v)
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                        }`}
                      >
                        {i.l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Nivel</label>
                  <select value={form.nivel} onChange={e => setForm(p => ({ ...p, nivel: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900">
                    {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition">Cancelar</button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition disabled:opacity-50"
              >
                {creating ? <FiLoader className="animate-spin" size={14} /> : <FiCheck size={14} />}
                {creating ? "Creando..." : "Crear profesor"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL EDITAR ─────────────────────────────────── */}
      {editProfesor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h2 className="font-black text-slate-900">Editar — {editProfesor.nombre} {editProfesor.apellido}</h2>
              <button onClick={() => setEditProfesor(null)} className="p-2 hover:bg-slate-100 rounded-xl"><FiX /></button>
            </div>

            <div className="p-6 space-y-6">
              {/* Datos básicos */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Datos personales</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Nombre</label>
                    <input value={editForm.nombre || ""} onChange={e => setEditForm(p => ({ ...p, nombre: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Apellido</label>
                    <input value={editForm.apellido || ""} onChange={e => setEditForm(p => ({ ...p, apellido: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">ID Externo</label>
                    <input value={editForm.idExterno || ""} onChange={e => setEditForm(p => ({ ...p, idExterno: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Nivel</label>
                    <select value={editForm.nivel || "A1"} onChange={e => setEditForm(p => ({ ...p, nivel: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900">
                      {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Idiomas */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Idiomas que enseña</h3>
                <div className="flex flex-wrap gap-2">
                  {IDIOMAS.map(i => (
                    <button
                      key={i.v}
                      type="button"
                      onClick={() => toggleIdioma(i.v, true)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
                        (editForm.idiomasQueEnseña || []).includes(i.v)
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      {i.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alumnos asignados */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                  Alumnos asignados ({(editForm.alumnos || []).length})
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* Buscador */}
                  <div className="space-y-2">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                      <input
                        value={filterAlumnoNombre}
                        onChange={e => { setFilterAlumnoNombre(e.target.value); setAlumnosPage(0); }}
                        placeholder="Buscar alumno..."
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                    <select
                      value={filterAlumnoEmpresa}
                      onChange={e => { setFilterAlumnoEmpresa(e.target.value); setAlumnosPage(0); }}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      <option value="">Todas las empresas</option>
                      {empresas.map(e => (
                        <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
                      ))}
                    </select>

                    <div className="max-h-48 overflow-y-auto space-y-1 border border-slate-100 rounded-xl p-1">
                      {paginatedAlumnos.map(a => (
                        <div
                          key={a.uid}
                          onClick={() => toggleAlumno(a.uid)}
                          className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition"
                        >
                          <div>
                            <p className="text-sm text-slate-700">{a.displayName || a.nombre || a.email}</p>
                            <p className="text-xs text-slate-400">{a.email}</p>
                          </div>
                          <input type="checkbox" readOnly
                            checked={(editForm.alumnos || []).includes(a.uid)}
                            className="accent-slate-900" />
                        </div>
                      ))}
                      {paginatedAlumnos.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-4">Sin resultados</p>
                      )}
                    </div>

                    {filteredAlumnos.length > PAGE_SIZE && (
                      <div className="flex items-center justify-between">
                        <button onClick={() => setAlumnosPage(p => Math.max(0, p - 1))} disabled={alumnosPage === 0}
                          className="px-3 py-1 text-xs rounded-lg border border-slate-200 disabled:opacity-40">← Ant</button>
                        <span className="text-xs text-slate-400">{alumnosPage + 1}/{Math.ceil(filteredAlumnos.length / PAGE_SIZE)}</span>
                        <button onClick={() => setAlumnosPage(p => Math.min(Math.ceil(filteredAlumnos.length / PAGE_SIZE) - 1, p + 1))}
                          disabled={alumnosPage >= Math.ceil(filteredAlumnos.length / PAGE_SIZE) - 1}
                          className="px-3 py-1 text-xs rounded-lg border border-slate-200 disabled:opacity-40">Sig →</button>
                      </div>
                    )}
                  </div>

                  {/* Asignados */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-2">Asignados ({(editForm.alumnos || []).length})</p>
                    <div className="max-h-64 overflow-y-auto space-y-1 border border-slate-100 rounded-xl p-1">
                      {(editForm.alumnos || []).length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-8">Sin alumnos asignados</p>
                      ) : (editForm.alumnos || []).map(uid => {
                        const a = alumnos.find(x => x.uid === uid);
                        return (
                          <div key={uid} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                            <div>
                              <p className="text-sm text-slate-700">{a?.displayName || a?.nombre || a?.email || uid}</p>
                              {a?.email && <p className="text-xs text-slate-400">{a.email}</p>}
                            </div>
                            <button onClick={() => toggleAlumno(uid)} className="text-slate-400 hover:text-red-500 transition">
                              <FiX size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {(editForm.alumnos || []).length > 0 && (
                      <button
                        onClick={() => setEditForm(p => ({ ...p, alumnos: [] }))}
                        className="mt-2 text-xs text-red-500 hover:text-red-700 transition"
                      >
                        Quitar todos
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 sticky bottom-0 bg-white">
              <button onClick={() => setEditProfesor(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition">Cancelar</button>
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition"
              >
                <FiCheck size={14} /> Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}