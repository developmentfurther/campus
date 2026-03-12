"use client";

import { useAdmin } from "@/contexts/AdminContext";
import { useState, useMemo, useEffect, useRef } from "react";
import {
  FiSearch,
  FiCalendar,
  FiMail,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiUsers,
  FiGlobe,
  FiAward,
  FiEdit2,
  FiCheck,
  FiBriefcase,
} from "react-icons/fi";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "pt", label: "Portuguese", flag: "🇧🇷" },
  { code: "fr", label: "French", flag: "🇫🇷" },
  { code: "it", label: "Italian", flag: "🇮🇹" },
];

const PRIORITY = ["en", "es", "pt", "fr", "it"];

function getDefaultLanguage(langs: string[]) {
  for (const lang of PRIORITY) {
    if (langs.includes(lang)) return lang;
  }
  return langs[0] || "en";
}

function LanguagePopover({ alumno, onSave }: { alumno: any; onSave: (langs: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(alumno.learningLanguages || []);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggle = (code: string) => {
    setSelected(prev =>
      prev.includes(code) ? prev.filter(l => l !== code) : [...prev, code]
    );
  };

  const handleSave = () => {
    if (selected.length === 0) {
      toast.error("At least one language is required.");
      return;
    }
    onSave(selected);
    setOpen(false);
  };

  const langs = alumno.learningLanguages || [];

  return (
    <div className="relative" ref={ref}>
      {/* Badges + edit button */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {langs.map((l: string) => {
          const lang = LANGUAGES.find(x => x.code === l);
          return (
            <span key={l} className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg text-xs font-semibold">
              {lang?.flag} {lang?.label ?? l}
            </span>
          );
        })}
        <button
          onClick={() => { setSelected(langs); setOpen(!open); }}
          className="w-7 h-7 rounded-lg border-2 border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#EE7203] hover:text-[#EE7203] transition-all"
        >
          <FiEdit2 size={12} />
        </button>
      </div>

      {/* Popover */}
      {open && (
        <div className="absolute z-50 top-full mt-2 left-0 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-52 animate-scale-in">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Languages</p>
          <div className="space-y-2 mb-4">
            {LANGUAGES.map(lang => (
              <label key={lang.code} className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => toggle(lang.code)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${
                    selected.includes(lang.code)
                      ? "bg-[#EE7203] border-[#EE7203]"
                      : "border-gray-300 group-hover:border-[#EE7203]"
                  }`}
                >
                  {selected.includes(lang.code) && <FiCheck size={12} className="text-white" />}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {lang.flag} {lang.label}
                </span>
              </label>
            ))}
          </div>
          <button
            onClick={handleSave}
            className="w-full py-2 rounded-lg bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white text-sm font-bold hover:shadow-md transition-all"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}

export default function StudentsPage() {
  const { alumnos, loadingAlumnos: loading, reloadData } = useAdmin();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [languageFilter, setLanguageFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [empresaFilter, setEmpresaFilter] = useState("");

  const debouncedSearch = useDebounce(search, 300);
  const PAGE_SIZE = 25;

  const filteredAlumnos = useMemo(() => {
    if (!Array.isArray(alumnos)) return [];
    return alumnos
      .filter((a) => {
        if (!debouncedSearch) return true;
        return a?.email?.toLowerCase().includes(debouncedSearch.toLowerCase());
      })
      .filter((a) => {
  if (!empresaFilter) return true;
  return a.curso?.toLowerCase().trim() === empresaFilter.toLowerCase().trim();
})
      .filter((a) => {
        if (!languageFilter) return true;
        return a.learningLanguages?.includes(languageFilter);
      })
      .filter((a) => {
        if (!levelFilter) return true;
        return a.learningLevel === levelFilter.toUpperCase();
      });
  }, [alumnos, debouncedSearch, languageFilter, levelFilter, empresaFilter]);

  const empresasUnicas = useMemo(() => {
  if (!Array.isArray(alumnos)) return [];
  const set = new Set<string>();
 alumnos.forEach(a => { if (a.curso) set.add(a.curso.toLowerCase().trim()); });
  return Array.from(set).sort();
}, [alumnos]);

  const totalPages = Math.ceil(filteredAlumnos.length / PAGE_SIZE) || 1;

  const paginatedAlumnos = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredAlumnos.slice(start, start + PAGE_SIZE);
  }, [filteredAlumnos, page]);

  const handleUpdateLanguages = async (alumno: any, langs: string[]) => {
    try {
      if (!alumno.batchId || !alumno.userKey) {
        toast.error("Unable to update this student.");
        return;
      }
      const batchRef = doc(db, "alumnos", alumno.batchId);
      await updateDoc(batchRef, {
        [`${alumno.userKey}.learningLanguages`]: langs,
        [`${alumno.userKey}.activeLanguage`]: getDefaultLanguage(langs),
      });
      await reloadData?.();
      toast.success("Languages updated.");
    } catch (err) {
      console.error(err);
      toast.error("Error saving changes.");
    }
  };

  const handleUpdateLevel = async (alumno: any, value: string) => {
    try {
      if (!alumno.batchId || !alumno.userKey) {
        toast.error("Unable to update this student.");
        return;
      }
      const batchRef = doc(db, "alumnos", alumno.batchId);
      await updateDoc(batchRef, {
        [`${alumno.userKey}.learningLevel`]: value,
      });
      await reloadData?.();
      toast.success("Updated successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Error saving changes.");
    }
  };

  const SyncModal = () => (
    <div className="fixed inset-0 bg-[#0C212D]/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-[#0C212D] px-8 py-6 border-b-4 border-[#EE7203]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#EE7203]/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-[#EE7203]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Synchronization in Progress</h2>
              <p className="text-sm text-gray-400 mt-0.5">Background process initiated</p>
            </div>
          </div>
        </div>
        <div className="p-8">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-6 border border-gray-200">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-[#EE7203] border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#0C212D] mb-2">Syncing student data...</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  The system is currently synchronizing all student records. This process runs in the background and won't interrupt your work.
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Duration</p>
              <p className="text-lg font-bold text-[#0C212D]">~5 minutes</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Status</p>
              <p className="text-lg font-bold text-[#EE7203]">Active</p>
            </div>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-6">
            <div className="h-full bg-gradient-to-r from-[#EE7203] to-[#FF3816] rounded-full animate-pulse" style={{ width: '100%' }}></div>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r-lg p-4 mb-6">
            <p className="text-sm text-blue-900">You can safely close this window and continue working.</p>
          </div>
          <button onClick={() => setShowSyncModal(false)} className="w-full py-3.5 rounded-lg bg-[#0C212D] text-white font-semibold text-sm hover:bg-[#112C3E] transition-all">
            Continue Working
          </button>
        </div>
      </div>
    </div>
  );

  const ConfirmModal = () => (
    <div className="fixed inset-0 bg-[#0C212D]/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-[#0C212D] px-8 py-6 border-b-4 border-[#EE7203]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#EE7203]/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-[#EE7203]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Confirm Synchronization</h2>
              <p className="text-sm text-gray-400 mt-0.5">Action required</p>
            </div>
          </div>
        </div>
        <div className="p-8">
          <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-4 mb-6">
            <p className="text-sm font-semibold text-amber-900 mb-1">About to sync student accounts</p>
            <p className="text-sm text-amber-800">This will create missing Firebase Auth accounts for all students in the system.</p>
          </div>
          <p className="text-sm text-gray-600 mb-6">Do you want to continue with this operation?</p>
          <div className="flex gap-3">
            <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 rounded-lg font-semibold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all">
              Cancel
            </button>
            <button
              onClick={async () => {
                setShowConfirmModal(false);
                try {
                  const res = await fetch("/api/sync-alumnos", { method: "POST" });
                  const data = await res.json();
                  if (!data.ok) { toast.error("Sync failed: " + data.error); return; }
                  setShowSyncModal(true);
                } catch (err) {
                  console.error(err);
                  toast.error("Unexpected error occurred.");
                }
              }}
              className="flex-1 py-3 rounded-lg font-semibold text-sm bg-[#0C212D] text-white hover:bg-[#112C3E] transition-all shadow-lg"
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
      {showConfirmModal && <ConfirmModal />}
      {showSyncModal && <SyncModal />}

      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200">
              <FiUsers className="text-orange-600" size={18} />
              <span className="text-sm font-semibold text-orange-700">Student Management</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0C212D] tracking-tight">Campus Students</h1>
            <p className="text-lg text-gray-600 max-w-2xl">Manage and monitor all registered students across the Further Corporate learning platform.</p>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-6 py-3.5 rounded-lg font-semibold text-white text-sm bg-[#0C212D] hover:bg-[#112C3E] shadow-lg hover:shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 group"
          >
            <svg className="w-5 h-5 text-[#EE7203] group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Sync Campus Accounts</span>
          </button>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white border-2 border-[#0C212D] shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-[#0C212D] flex items-center justify-center">
                <FiUsers className="text-white" size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Students</p>
                <p className="text-2xl font-bold text-[#0C212D]">{filteredAlumnos.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FiFilter className="text-[#EE7203]" size={20} />
            <h3 className="text-lg font-bold text-[#0C212D]">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative group">
              <FiSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#EE7203] transition-colors" />
              <input
                type="text"
                placeholder="Search by email..."
                value={search}
                onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm focus:border-[#EE7203] focus:ring-4 focus:ring-orange-100 outline-none transition-all"
              />
            </div>
            <div className="relative group">
              <FiGlobe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#EE7203] transition-colors" />
              <select
                value={languageFilter}
                onChange={(e) => { setPage(1); setLanguageFilter(e.target.value); }}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm appearance-none focus:border-[#EE7203] focus:ring-4 focus:ring-orange-100 outline-none transition-all cursor-pointer"
              >
                <option value="">All Languages</option>
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
              </select>
            </div>
            <div className="relative group">
              <FiAward size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#EE7203] transition-colors" />
              <select
                value={levelFilter}
                onChange={(e) => { setPage(1); setLevelFilter(e.target.value); }}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm appearance-none focus:border-[#EE7203] focus:ring-4 focus:ring-orange-100 outline-none transition-all cursor-pointer"
              >
                <option value="">All Levels</option>
                {["A1","A2","B1","B2","B2.5","C1","C2"].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="relative group">
  <FiBriefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#EE7203] transition-colors" />
  <select
    value={empresaFilter}
    onChange={(e) => { setPage(1); setEmpresaFilter(e.target.value); }}
    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm appearance-none focus:border-[#EE7203] focus:ring-4 focus:ring-orange-100 outline-none transition-all cursor-pointer"
  >
    <option value="">All Companies</option>
    {empresasUnicas.map(e => (
      <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
    ))}
  </select>
</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-16 h-16 border-4 border-[#EE7203] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading students...</p>
        </div>
      ) : filteredAlumnos.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-300">
          <FiUsers className="mx-auto text-gray-300" size={64} />
          <p className="mt-4 text-gray-500 text-lg font-medium">No students found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm overflow-hidden">
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-[#0C212D] to-[#112C3E]">
                  {["Student", "User ID", "Registered", "Languages", "Level", "Status"].map(h => (
                    <th key={h} className="text-left px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedAlumnos.map((a, i) => (
                  <tr key={i} className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-all group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#EE7203] to-[#FF3816] flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-110 transition-transform">
                          {a.email?.charAt(0).toUpperCase() ?? "A"}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#0C212D] text-base">
                            {a.firstName ? `${a.firstName} ${a.lastName}` : a.email?.split("@")[0]}
                          </span>
                          <span className="text-sm text-gray-500 flex items-center gap-1.5">
                            <FiMail size={13} />{a.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <code className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-mono text-gray-700 border border-gray-200">
                        {a.uid || "-"}
                      </code>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-gray-600">
                        <FiCalendar size={14} className="text-[#EE7203]" />
                        <span className="text-sm font-medium">
                          {a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <LanguagePopover alumno={a} onSave={(langs) => handleUpdateLanguages(a, langs)} />
                    </td>
                    <td className="px-6 py-5">
                      <select
                        value={a.learningLevel || ""}
                        onChange={(e) => handleUpdateLevel(a, e.target.value)}
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium focus:border-[#EE7203] focus:ring-4 focus:ring-orange-100 outline-none transition-all cursor-pointer hover:border-[#EE7203]"
                      >
                        <option value="" disabled>Select level</option>
                        {["A1","A2","B1","B2","B2.5","C1","C2"].map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                        a.active ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-red-100 text-red-700 border-red-200"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${a.active ? "bg-emerald-500" : "bg-red-500"}`}></span>
                        {a.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="lg:hidden divide-y divide-gray-200">
            {paginatedAlumnos.map((a, i) => (
              <div key={i} className="p-5 space-y-4 hover:bg-orange-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#EE7203] to-[#FF3816] flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0">
                    {a.email?.charAt(0).toUpperCase() ?? "A"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#0C212D] text-lg truncate">
                      {a.firstName ? `${a.firstName} ${a.lastName}` : a.email?.split("@")[0]}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5 truncate">
                      <FiMail size={13} />{a.email}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Languages</p>
                  <LanguagePopover alumno={a} onSave={(langs) => handleUpdateLanguages(a, langs)} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Level</p>
                  <select
                    value={a.learningLevel || ""}
                    onChange={(e) => handleUpdateLevel(a, e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-[#EE7203] outline-none"
                  >
                    <option value="" disabled>Select</option>
                    {["A1","A2","B1","B2","B2.5","C1","C2"].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  a.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${a.active ? "bg-emerald-500" : "bg-red-500"}`}></span>
                  {a.active ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-200">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-sm bg-white border-2 border-[#0C212D] text-[#0C212D] hover:bg-[#0C212D] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#0C212D] transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <FiChevronLeft size={18} /> Previous
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#0C212D]">Page {page}</span>
              <span className="text-sm text-gray-500">of</span>
              <span className="text-sm font-bold text-[#0C212D]">{totalPages}</span>
            </div>
            <button
              onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
              disabled={page >= totalPages}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white hover:shadow-lg hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:scale-100 transition-all flex items-center justify-center gap-2"
            >
              Next <FiChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}