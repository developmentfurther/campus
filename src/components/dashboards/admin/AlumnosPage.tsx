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
  FiFilter,
  FiUsers,
  FiGlobe,
  FiAward,
} from "react-icons/fi";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

export default function StudentsPage() {
  const { alumnos, loading, reloadData } = useAuth();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [languageFilter, setLanguageFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);


  const PAGE_SIZE = 25;

  /* 🔍 FILTRADO CORREGIDO */
  const filteredAlumnos = useMemo(() => {
    if (!Array.isArray(alumnos)) return [];

    console.log("🔍 Filtrando alumnos:", {
      total: alumnos.length,
      languageFilter,
      levelFilter,
      search,
    });

    return alumnos
      .filter((a) => {
        if (!search) return true;
        return a?.email?.toLowerCase().includes(search.toLowerCase());
      })
      .filter((a) => {
        if (!languageFilter) return true;
        const match = a.learningLanguage === languageFilter.toLowerCase();
        if (!match && a.learningLanguage) {
          console.log("❌ No match idioma:", {
            alumno: a.email,
            tiene: a.learningLanguage,
            buscando: languageFilter.toLowerCase(),
          });
        }
        return match;
      })
      .filter((a) => {
        if (!levelFilter) return true;
        const match = a.learningLevel === levelFilter.toUpperCase();
        if (!match && a.learningLevel) {
          console.log("❌ No match nivel:", {
            alumno: a.email,
            tiene: a.learningLevel,
            buscando: levelFilter.toUpperCase(),
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

  /* 📝 UPDATE FIELDS */
  const handleUpdateField = async (
  alumno: any,
  field: "learningLanguage" | "learningLevel",
  value: string
) => {
  try {
    // ✅ Solo necesitamos batchId y userKey
    if (!alumno.batchId || !alumno.userKey) {
      toast.error("Unable to update this student.");
      return;
    }

    const batchRef = doc(db, "alumnos", alumno.batchId);
    const snap = await getDoc(batchRef);
    if (!snap.exists()) return;

    // 🔥 Actualiza directamente el campo anidado
    await updateDoc(batchRef, {
      [`${alumno.userKey}.${field}`]: value,
    });

    await reloadData?.();

    toast.success("Updated successfully.");
  } catch (err) {
    console.error(err);
    toast.error("Error saving changes.");
  }
};


  const languageNames: Record<string, string> = {
    en: "English",
    es: "Spanish",
    pt: "Portuguese",
    fr: "French",
    it: "Italian",
  };

  const SyncModal = () => (
  <div className="fixed inset-0 bg-[#0C212D]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
      
      {/* Header minimalista */}
      <div className="bg-[#0C212D] px-8 py-6 border-b-4 border-[#EE7203]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#EE7203]/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-[#EE7203]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Synchronization in Progress
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Background process initiated
            </p>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-8">
        
        {/* Status card */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-6 border border-gray-200">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center">
                <div className="w-5 h-5 border-3 border-[#EE7203] border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[#0C212D] mb-2">
                Syncing student data...
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                The system is currently synchronizing all student records. This process runs in the background and won't interrupt your work.
              </p>
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-[#EE7203]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Duration</span>
            </div>
            <p className="text-lg font-bold text-[#0C212D]">~5 minutes</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-[#EE7203]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</span>
            </div>
            <p className="text-lg font-bold text-[#EE7203]">Active</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Processing...</span>
            <span className="text-xs font-mono text-gray-500">Running</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#EE7203] to-[#FF3816] rounded-full animate-pulse shadow-sm" 
                 style={{ width: '100%' }}>
            </div>
          </div>
        </div>

        {/* Info note */}
        <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r-lg p-4 mb-6">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-900">
              You can safely close this window and continue working. You'll be notified when the sync is complete.
            </p>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={() => setShowSyncModal(false)}
          className="w-full py-3.5 rounded-lg bg-[#0C212D] text-white font-semibold text-sm hover:bg-[#112C3E] active:scale-[0.99] transition-all duration-150 shadow-lg"
        >
          Continue Working
        </button>
      </div>
    </div>
  </div>
);


// 2. Modal de confirmación
const ConfirmModal = () => (
  <div className="fixed inset-0 bg-[#0C212D]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
      
      {/* Header */}
      <div className="bg-[#0C212D] px-8 py-6 border-b-4 border-[#EE7203]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#EE7203]/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-[#EE7203]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Confirm Synchronization
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Action required
            </p>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-8">
        <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-4 mb-6">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-900 mb-1">
                About to sync student accounts
              </p>
              <p className="text-sm text-amber-800">
                This will create missing Firebase Auth accounts for all students in the system.
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Do you want to continue with this operation?
        </p>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowConfirmModal(false)}
            className="flex-1 py-3 rounded-lg font-semibold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-[0.99] transition-all duration-150"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              setShowConfirmModal(false);
              
              try {
                const res = await fetch("/api/sync-alumnos", { method: "POST" });
                const data = await res.json();

                if (!data.ok) {
                  toast.error("Sync failed: " + data.error);
                  return;
                }

                // ✔ Mostrar modal de éxito
                setShowSyncModal(true);

              } catch (err) {
                console.error(err);
                toast.error("Unexpected error occurred.");
              }
            }}
            className="flex-1 py-3 rounded-lg font-semibold text-sm bg-[#0C212D] text-white hover:bg-[#112C3E] active:scale-[0.99] transition-all duration-150 shadow-lg"
          >
            Yes, Continue
          </button>
        </div>
      </div>
    </div>
  </div>
);


  return (
    
    <div className="min-h-screen p-6 md:p-10 space-y-8">

       {/* ✅ Render modal si está activo */}
      {showConfirmModal && <ConfirmModal />}
{showSyncModal && <SyncModal />}
      {/* HEADER SECTION */}
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200">
              <FiUsers className="text-orange-600" size={18} />
              <span className="text-sm font-semibold text-orange-700">
                Student Management
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0C212D] tracking-tight">
              Campus Students
            </h1>
            
            <p className="text-lg text-gray-600 max-w-2xl">
              Manage and monitor all registered students across the Further
              Corporate learning platform.
            </p>
          </div>

{/* 🔄 SYNC BUTTON */}
<button
  onClick={() => setShowConfirmModal(true)}
  className="
    px-6 py-3.5 rounded-lg font-semibold text-white text-sm
    bg-[#0C212D] hover:bg-[#112C3E]
    shadow-lg hover:shadow-xl
    active:scale-[0.99]
    transition-all duration-150
    flex items-center justify-center gap-2.5
    group
  "
>
  <svg 
    className="w-5 h-5 text-[#EE7203] group-hover:rotate-180 transition-transform duration-500" 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
    />
  </svg>
  <span>Sync Campus Accounts</span>
</button>


          {/* Stats Cards */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white border-2 border-[#0C212D] shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-[#0C212D] flex items-center justify-center">
                <FiUsers className="text-white" size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Total Students
                </p>
                <p className="text-2xl font-bold text-[#0C212D]">
                  {filteredAlumnos.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FiFilter className="text-[#EE7203]" size={20} />
            <h3 className="text-lg font-bold text-[#0C212D]">Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative group">
              <FiSearch
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#EE7203] transition-colors"
              />
              <input
                type="text"
                placeholder="Search by email..."
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm 
                focus:border-[#EE7203] focus:ring-4 focus:ring-orange-100 outline-none transition-all"
              />
            </div>

            {/* Language Filter */}
            <div className="relative group">
              <FiGlobe
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#EE7203] transition-colors"
              />
              <select
                value={languageFilter}
                onChange={(e) => {
                  setPage(1);
                  setLanguageFilter(e.target.value);
                }}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm appearance-none
                focus:border-[#EE7203] focus:ring-4 focus:ring-orange-100 outline-none transition-all cursor-pointer"
              >
                <option value="">All Languages</option>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="pt">Portuguese</option>
                <option value="fr">French</option>
                <option value="it">Italian</option>
              </select>
            </div>

            {/* Level Filter */}
            <div className="relative group">
              <FiAward
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#EE7203] transition-colors"
              />
              <select
                value={levelFilter}
                onChange={(e) => {
                  setPage(1);
                  setLevelFilter(e.target.value);
                }}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm appearance-none
                focus:border-[#EE7203] focus:ring-4 focus:ring-orange-100 outline-none transition-all cursor-pointer"
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
          </div>
        </div>
      </div>

      {/* STUDENT LIST */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-16 h-16 border-4 border-[#EE7203] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading students...</p>
        </div>
      ) : filteredAlumnos.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-300">
          <FiUsers className="mx-auto text-gray-300" size={64} />
          <p className="mt-4 text-gray-500 text-lg font-medium">
            No students found.
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
                    Student
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">
                    User ID
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">
                    Language
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">
                    Level
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {paginatedAlumnos.map((a, i) => {
                  const langDisplay = a.learningLanguage || "";
                  const levelDisplay = a.learningLevel || "";

                  return (
                    <tr
                      key={i}
                      className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-all group"
                    >
                      {/* Student */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#EE7203] to-[#FF3816] flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-110 transition-transform">
                            {a.email?.charAt(0).toUpperCase() ?? "A"}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#0C212D] text-base">
                              {a.nombre || a.email?.split("@")[0] || "User"}
                            </span>
                            <span className="text-sm text-gray-500 flex items-center gap-1.5">
                              <FiMail size={13} />
                              {a.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* UID */}
                      <td className="px-6 py-5">
                        <code className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-mono text-gray-700 border border-gray-200">
                          {a.uid || "-"}
                        </code>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-gray-600">
                          <FiCalendar size={14} className="text-[#EE7203]" />
                          <span className="text-sm font-medium">
                            {a.createdAt
                              ? new Date(a.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }
                                )
                              : "N/A"}
                          </span>
                        </div>
                      </td>

                      {/* Language */}
                      <td className="px-6 py-5">
                        <select
                          value={langDisplay}
                          onChange={(e) =>
                            handleUpdateField(
                              a,
                              "learningLanguage",
                              e.target.value
                            )
                          }
                          className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium
                          focus:border-[#EE7203] focus:ring-4 focus:ring-orange-100 outline-none transition-all cursor-pointer
                          hover:border-[#EE7203]"
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

                      {/* Level */}
                      <td className="px-6 py-5">
                        <select
                          value={levelDisplay}
                          onChange={(e) =>
                            handleUpdateField(a, "learningLevel", e.target.value)
                          }
                          className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium
                          focus:border-[#EE7203] focus:ring-4 focus:ring-orange-100 outline-none transition-all cursor-pointer
                          hover:border-[#EE7203]"
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

                      {/* Status */}
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                          {a.estadoAlumno || "Active"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-gray-200">
            {paginatedAlumnos.map((a, i) => {
              const langDisplay = a.learningLanguage || "";
              const levelDisplay = a.learningLevel || "";

              return (
                <div key={i} className="p-5 space-y-4 hover:bg-orange-50 transition-colors">
                  {/* Header */}
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#EE7203] to-[#FF3816] flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0">
                      {a.email?.charAt(0).toUpperCase() ?? "A"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#0C212D] text-lg truncate">
                        {a.nombre || a.email?.split("@")[0] || "User"}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5 truncate">
                        <FiMail size={13} />
                        {a.email}
                      </p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                        User ID
                      </p>
                      <code className="text-xs font-mono text-gray-700">
                        {a.uid || "-"}
                      </code>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                        Registered
                      </p>
                      <p className="text-sm text-gray-700">
                        {a.createdAt
                          ? new Date(a.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Selects */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                        Language
                      </label>
                      <select
                        value={langDisplay}
                        onChange={(e) =>
                          handleUpdateField(a, "learningLanguage", e.target.value)
                        }
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm
                        focus:border-[#EE7203] focus:ring-4 focus:ring-orange-100 outline-none"
                      >
                        <option value="" disabled>
                          Select
                        </option>
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="pt">Portuguese</option>
                        <option value="fr">French</option>
                        <option value="it">Italian</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                        Level
                      </label>
                      <select
                        value={levelDisplay}
                        onChange={(e) =>
                          handleUpdateField(a, "learningLevel", e.target.value)
                        }
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm
                        focus:border-[#EE7203] focus:ring-4 focus:ring-orange-100 outline-none"
                      >
                        <option value="" disabled>
                          Select
                        </option>
                        <option value="A1">A1</option>
                        <option value="A2">A2</option>
                        <option value="B1">B1</option>
                        <option value="B2">B2</option>
                        <option value="B2.5">B2.5</option>
                        <option value="C1">C1</option>
                        <option value="C2">C2</option>
                      </select>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase">
                      Status:
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                      {a.estadoAlumno || "Active"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-200">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-sm
              bg-white border-2 border-[#0C212D] text-[#0C212D]
              hover:bg-[#0C212D] hover:text-white
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#0C212D]
              transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <FiChevronLeft size={18} />
              Previous
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#0C212D]">
                Page {page}
              </span>
              <span className="text-sm text-gray-500">of</span>
              <span className="text-sm font-bold text-[#0C212D]">
                {totalPages}
              </span>
            </div>

            <button
              onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
              disabled={page >= totalPages}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-sm
              bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white
              hover:shadow-lg hover:scale-105
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:scale-100
              transition-all flex items-center justify-center gap-2"
            >
              Next
              <FiChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}