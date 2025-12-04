"use client";

import { useMemo, useState } from "react";
import { FiUsers, FiPlus, FiTrash2 } from "react-icons/fi";

interface EnrollStudentsSectionProps {
  alumnos: any[];                      // alumnos_raw desde AuthContext
  cursoId: string;                     // ej: "ADM006"
  selected: string[];                  // emails ya seleccionados
  setSelected: (value: string[]) => void;
}

export default function EnrollStudentsSection({
  alumnos,
  cursoId,
  selected,
  setSelected,
}: EnrollStudentsSectionProps) {

  const [filterIdioma, setFilterIdioma] = useState("");
  const [filterNivel, setFilterNivel] = useState("");
  const [filterByAssigned, setFilterByAssigned] = useState(false);

  // 🔍 FILTRADO PRINCIPAL
  const filteredAlumnos = useMemo(() => {
    const list = Array.isArray(alumnos) ? alumnos : [];

    return list.filter((a) => {
      const lang = a.learningLanguage || a.idioma || "";
      const lvl = a.learningLevel || a.nivel || "";

      const matchLang = filterIdioma ? lang.toLowerCase() === filterIdioma.toLowerCase() : true;
      const matchLvl = filterNivel ? lvl.toLowerCase() === filterNivel.toLowerCase() : true;

      // ⭐ FILTRO NUEVO → alumnos que ya tengan asignado este curso
      const matchCursoAsignado = filterByAssigned
        ? Array.isArray(a.cursosAsignados) &&
          a.cursosAsignados.some((c: any) => c.curso === cursoId)
        : true;

      return matchLang && matchLvl && matchCursoAsignado;
    });
  }, [alumnos, filterIdioma, filterNivel, filterByAssigned, cursoId]);

  // Toggle individual
  const toggle = (email: string) => {
    if (selected.includes(email)) {
      setSelected(selected.filter((e) => e !== email));
    } else {
      setSelected([...selected, email]);
    }
  };

  // Add all filtered
  const addAll = () => {
    const emails = filteredAlumnos.map((a) => a.email);
    setSelected(Array.from(new Set([...selected, ...emails])));
  };

  // Remove all
  const removeAll = () => setSelected([]);

  return (
    <section className="p-6 rounded-xl bg-white border border-gray-200 space-y-6">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-orange-500 text-white flex items-center justify-center">
          <FiUsers />
        </div>
        <h3 className="text-xl font-bold">Student Enrollment</h3>
      </div>

      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Idioma */}
        <select
          value={filterIdioma}
          onChange={(e) => setFilterIdioma(e.target.value)}
          className="p-3 rounded-xl border"
        >
          <option value="">All languages</option>
          <option value="es">Spanish</option>
          <option value="en">English</option>
          <option value="pt">Portuguese</option>
          <option value="fr">French</option>
          <option value="it">Italian</option>
        </select>

        {/* Nivel */}
        <select
          value={filterNivel}
          onChange={(e) => setFilterNivel(e.target.value)}
          className="p-3 rounded-xl border"
        >
          <option value="">All levels</option>
          <option value="A1">A1</option>
          <option value="A2">A2</option>
          <option value="B1">B1</option>
          <option value="B2">B2</option>
          <option value="C1">C1</option>
          <option value="C2">C2</option>
        </select>

        {/* ⭐ Filtro nuevo → alumnos que ya tengan asignado este curso */}
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={filterByAssigned}
            onChange={(e) => setFilterByAssigned(e.target.checked)}
          />
          Show only students already assigned to {cursoId}
        </label>

      </div>

      {/* LISTA ALUMNOS */}
      <div className="max-h-80 overflow-y-auto border rounded-xl p-3 bg-gray-50">
        {filteredAlumnos.length === 0 ? (
          <p className="text-center text-gray-400 py-6 text-sm">
            No students match the selected filters.
          </p>
        ) : (
          filteredAlumnos.map((a) => (
            <div
              key={a.email}
              onClick={() => toggle(a.email)}
              className="flex items-center justify-between p-2 mb-1 bg-white rounded-lg border cursor-pointer hover:bg-gray-100"
            >
              <span className="text-sm">{a.displayName || a.nombre || a.email}</span>
              <input
                type="checkbox"
                readOnly
                checked={selected.includes(a.email)}
              />
            </div>
          ))
        )}
      </div>

      {/* BUTTONS */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={addAll}
          className="flex items-center gap-2 bg-orange-200 text-orange-700 px-4 py-2 rounded-lg"
        >
          <FiPlus /> Add all filtered
        </button>

        <button
          type="button"
          onClick={removeAll}
          className="flex items-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-lg"
        >
          <FiTrash2 /> Remove all
        </button>
      </div>

    </section>
  );
}
