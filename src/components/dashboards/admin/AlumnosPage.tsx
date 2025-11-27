"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useMemo } from "react";
import {
  FiSearch,
  FiUser,
  FiCalendar,
  FiMail,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

export default function StudentsPage() {
  const { alumnos, loading } = useAuth();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [languageFilter, setLanguageFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");

  const PAGE_SIZE = 25;

/* 🔍 FILTRADO CORREGIDO */
const filteredAlumnos = useMemo(() => {
  if (!Array.isArray(alumnos)) return [];

  console.log("🔍 Filtrando alumnos:", {
    total: alumnos.length,
    languageFilter,
    levelFilter,
    search
  });

  return alumnos
    // 1️⃣ Filtro por email
    .filter((a) => {
      if (!search) return true;
      return a?.email?.toLowerCase().includes(search.toLowerCase());
    })
    
    // 2️⃣ Filtro por idioma (comparación directa, ya está normalizado)
    .filter((a) => {
      if (!languageFilter) return true;
      
      // Los datos ya vienen en minúsculas desde loadAlumnos
      const match = a.learningLanguage === languageFilter.toLowerCase();
      
      // 🐛 Debug: ver qué está pasando
      if (!match && a.learningLanguage) {
        console.log("❌ No match idioma:", {
          alumno: a.email,
          tiene: a.learningLanguage,
          buscando: languageFilter.toLowerCase()
        });
      }
      
      return match;
    })
    
    // 3️⃣ Filtro por nivel (comparación directa, ya está normalizado)
    .filter((a) => {
      if (!levelFilter) return true;
      
      // Los datos ya vienen en mayúsculas desde loadAlumnos
      const match = a.learningLevel === levelFilter.toUpperCase();
      
      // 🐛 Debug: ver qué está pasando
      if (!match && a.learningLevel) {
        console.log("❌ No match nivel:", {
          alumno: a.email,
          tiene: a.learningLevel,
          buscando: levelFilter.toUpperCase()
        });
      }
      
      return match;
    });
}, [alumnos, search, languageFilter, levelFilter]);

  /* 📄 PAGINADO */
  const totalPages = Math.ceil(filteredAlumnos.length / PAGE_SIZE) || 1;

  const paginatedAlumnos = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredAlumnos.slice(start, end);
  }, [filteredAlumnos, page]);

  /* 📝 UPDATE FIELDS (solo afecta colección alumnos, no raw) */
  const handleUpdateField = async (
    alumno: any,
    field: "learningLanguage" | "learningLevel",
    value: string
  ) => {
    try {
      if (!alumno.batchId || !alumno.uid) {
        toast.error("Unable to update this student.");
        return;
      }

      const batchRef = doc(db, "alumnos", alumno.batchId);
      const snap = await getDoc(batchRef);
      if (!snap.exists()) return;

      const data = snap.data();

      const userKey = Object.keys(data).find(
        (k) => k.startsWith("user_") && data[k].uid === alumno.uid
      );
      if (!userKey) return;

      await updateDoc(batchRef, {
        [`${userKey}.${field}`]: value,
      });

      toast.success("Updated successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Error saving changes.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8 space-y-10">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FiUser className="text-blue-600" />
            Students
          </h1>
          <p className="text-gray-500 mt-1">
            Manage all registered students in the campus.
          </p>
        </div>
      </header>

      {/* BARRA DE FILTROS */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* SEARCH */}
        <div className="relative w-full md:max-w-xs">
          <FiSearch size={18} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by email..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm 
            focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
          />
        </div>

        {/* FILTER LANGUAGE */}
        <select
          value={languageFilter}
          onChange={(e) => {
            setPage(1);
            setLanguageFilter(e.target.value);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white shadow-sm"
        >
          <option value="">All Languages</option>
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="pt">Portuguese</option>
          <option value="fr">French</option>
          <option value="it">Italian</option>
        </select>

        {/* FILTER LEVEL */}
        <select
          value={levelFilter}
          onChange={(e) => {
            setPage(1);
            setLevelFilter(e.target.value);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white shadow-sm"
        >
          <option value="">All Levels</option>
          <option value="A1">A1</option>
          <option value="A2">A2</option>
          <option value="B1">B1</option>
          <option value="B2">B2</option>
          <option value="B2.5">B2.5</option>
          <option value="C1">C1</option>
          <option value="C2">C2</option>
        </select>
      </div>

      {/* LISTA */}
      {loading ? (
        <div className="text-center text-gray-500 py-10 bg-white rounded-xl border border-gray-200 shadow-sm">
          Loading students...
        </div>
      ) : filteredAlumnos.length === 0 ? (
        <div className="text-center text-gray-500 py-10 bg-white rounded-xl border border-gray-200 shadow-sm">
          No students found.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* TABLA */}
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-semibold">
              <tr>
                <th className="text-left px-5 py-3">Student</th>
                <th className="text-left px-5 py-3">UID</th>
                <th className="text-left px-5 py-3">Creation Date</th>
                <th className="text-left px-5 py-3">Language</th>
                <th className="text-left px-5 py-3">Level</th>
                <th className="text-left px-5 py-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {paginatedAlumnos.map((a, i) => {
  // 🔥 Los datos ya vienen normalizados, úsalos directamente
  const langDisplay = a.learningLanguage || ""; // ya en minúsculas
  const levelDisplay = a.learningLevel || "";   // ya en mayúsculas

  return (
    <tr
      key={i}
      className="border-t border-gray-100 hover:bg-gray-50 transition"
    >
      {/* STUDENT */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            {a.email?.charAt(0).toUpperCase() ?? "A"}
          </div>

          <div className="flex flex-col">
            <span className="font-medium text-gray-800">
              {a.nombre || a.email?.split("@")[0] || "User"}
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <FiMail size={12} />
              {a.email}
            </span>
          </div>
        </div>
      </td>

      {/* UID */}
      <td className="px-5 py-4 text-gray-600">{a.uid || "-"}</td>

      {/* DATE */}
      <td className="px-5 py-4 text-gray-600 flex items-center gap-1">
        <FiCalendar size={12} className="text-gray-400" />
        {a.createdAt
          ? new Date(a.createdAt).toLocaleDateString("en-US")
          : "N/A"}
      </td>

      {/* LANGUAGE - value ya está en minúsculas */}
      <td className="px-5 py-4">
        <select
          value={langDisplay}
          onChange={(e) =>
            handleUpdateField(a, "learningLanguage", e.target.value)
          }
          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
        >
          <option value="" disabled>
            Select language
          </option>
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="pt">Portuguese</option>
          <option value="fr">French</option>
          <option value="it">Italian</option>
        </select>
      </td>

      {/* LEVEL - value ya está en mayúsculas */}
      <td className="px-5 py-4">
        <select
          value={levelDisplay}
          onChange={(e) =>
            handleUpdateField(a, "learningLevel", e.target.value)
          }
          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
        >
          <option value="" disabled>
            Select level
          </option>
          <option value="A1">A1</option>
          <option value="A2">A2</option>
          <option value="B1">B1</option>
          <option value="B2">B2</option>
          <option value="B2.5">B2.5</option>
          <option value="C1">C1</option>
          <option value="C2">C2</option>
        </select>
      </td>

      {/* STATUS */}
      <td className="px-5 py-4">
        <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
          {a.estadoAlumno || "Active"}
        </span>
      </td>
    </tr>
  );
})}
            </tbody>
          </table>

          {/* PAGINACIÓN */}
          <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-t">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-40 flex items-center gap-1"
            >
              <FiChevronLeft /> Previous
            </button>

            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() =>
                setPage((p) =>
                  p < totalPages ? p + 1 : p
                )
              }
              disabled={page >= totalPages}
              className="px-3 py-1 border rounded disabled:opacity-40 flex items-center gap-1"
            >
              Next <FiChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
