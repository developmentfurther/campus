"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import AnuncioModal from "@/components/ui/AnuncioModal";
import {
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiTag,
  FiSearch,
  FiFilter,
  FiGlobe,
  FiEye,
  FiEyeOff,
  FiChevronLeft,
  FiChevronRight,
  FiEye as FiPreview,
  FiAlertCircle,
  FiX,
  FiZap,
} from "react-icons/fi";

export default function AdminAnunciosPage() {
  const { anuncios, loadingAnuncios, loadAnuncios } = useAuth();

  const [modal, setModal] = useState<{
    mode: "create" | "edit";
    anuncio?: any;
  } | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean;
    anuncioId?: string;
    titulo?: string;
  }>({ open: false });

  const [preview, setPreview] = useState<any | null>(null);

  const [search, setSearch] = useState("");
  const [filterIdioma, setFilterIdioma] = useState<"all" | string>("all");
  const [filterEstado, setFilterEstado] = useState<"all" | "visible" | "hidden">(
    "all"
  );

  const [page, setPage] = useState(1);
  const pageSize = 6;

  const idiomasDisponibles = useMemo(() => {
    const set = new Set<string>();
    (anuncios || []).forEach((a: any) => {
      if (a.idioma) set.add(a.idioma);
    });
    return Array.from(set);
  }, [anuncios]);

  const filteredAndSorted = useMemo(() => {
    if (!Array.isArray(anuncios)) return [];

    const sorted = [...anuncios].sort((a: any, b: any) => {
      const da = a.creadoEn?.toDate?.() ?? new Date(0);
      const dbb = b.creadoEn?.toDate?.() ?? new Date(0);
      return dbb.getTime() - da.getTime();
    });

    const q = search.trim().toLowerCase();

    return sorted.filter((a: any) => {
      if (filterIdioma !== "all" && a.idioma !== filterIdioma) return false;
      if (filterEstado === "visible" && a.visible === false) return false;
      if (filterEstado === "hidden" && a.visible !== false) return false;

      if (!q) return true;

      const hay = (
        (a.titulo || "") +
        " " +
        (a.subtitulo || "") +
        " " +
        (a.contenido || "")
      )
        .toString()
        .toLowerCase();

      return hay.includes(q);
    });
  }, [anuncios, search, filterIdioma, filterEstado]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginated = filteredAndSorted.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "anuncios", id));
      toast.success("Announcement deleted.");
      loadAnuncios();
    } catch (err) {
      toast.error("Error deleting announcement.");
      console.error(err);
    }
  };

  const handleToggleVisible = async (anuncio: any) => {
    try {
      const newVisible = anuncio.visible === false ? true : false;

      await updateDoc(doc(db, "anuncios", anuncio.id), {
        visible: newVisible,
      });

      toast.success(
        newVisible
          ? "Announcement is now visible to students."
          : "Announcement is now hidden from students."
      );

      setFilterEstado("all");
      loadAnuncios();
    } catch (err) {
      toast.error("Error updating visibility.");
      console.error(err);
    }
  };

  const handleChangePage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        
        {/* HEADER */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0C212D] via-[#112C3E] to-[#0C212D] rounded-3xl p-8 md:p-10 text-white shadow-2xl">
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#EE7203] to-[#FF3816] opacity-10 rounded-full blur-3xl -mr-40 -mt-40"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FF3816] opacity-10 rounded-full blur-3xl -ml-32 -mb-32"></div>
          
          {/* Pattern */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'radial-gradient(circle, #EE7203 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-[#EE7203] rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-[#FF3816] rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-[#EE7203] rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-[#EE7203] via-[#FF3816] to-transparent max-w-[200px]"></div>
              </div>

              <h1 className="text-4xl md:text-5xl font-black mb-3 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                Announcements
              </h1>
              <p className="text-gray-300 text-lg font-medium max-w-2xl">
                Manage global announcements shown to students based on their language
              </p>
            </div>

            <button
              onClick={() => setModal({ mode: "create" })}
              className="group relative px-6 py-4 bg-gradient-to-r from-[#EE7203] to-[#FF3816] hover:from-[#FF3816] hover:to-[#EE7203] rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden flex items-center gap-3 whitespace-nowrap"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <FiPlus size={20} className="relative z-10" />
              <span className="relative z-10">Create Announcement</span>
            </button>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            
            {/* Search */}
            <div className="flex-1">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#EE7203] transition-colors">
                  <FiSearch size={20} />
                </div>
                <input
                  type="text"
                  placeholder="Search by title, subtitle or content..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium
                    focus:border-[#EE7203] focus:ring-4 focus:ring-[#EE7203]/10 outline-none transition-all
                    hover:border-gray-300 bg-gray-50 focus:bg-white"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              {/* Language Filter */}
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <FiGlobe size={18} />
                </div>
                <select
                  className="pl-10 pr-8 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-[#0C212D] text-sm font-bold
                    hover:border-gray-300 focus:border-[#EE7203] focus:ring-4 focus:ring-[#EE7203]/10 outline-none transition-all
                    appearance-none cursor-pointer min-w-[160px]"
                  value={filterIdioma}
                  onChange={(e) => {
                    setFilterIdioma(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">All languages</option>
                  {idiomasDisponibles.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <FiFilter size={18} />
                </div>
                <select
                  className="pl-10 pr-8 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-[#0C212D] text-sm font-bold
                    hover:border-gray-300 focus:border-[#EE7203] focus:ring-4 focus:ring-[#EE7203]/10 outline-none transition-all
                    appearance-none cursor-pointer min-w-[140px]"
                  value={filterEstado}
                  onChange={(e) => {
                    setFilterEstado(e.target.value as any);
                    setPage(1);
                  }}
                >
                  <option value="all">All status</option>
                  <option value="visible">Visible only</option>
                  <option value="hidden">Hidden only</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* LIST */}
        {loadingAnuncios ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#EE7203] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#0C212D] font-bold">Loading announcements...</p>
            </div>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <div className="bg-gray-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <FiAlertCircle className="text-gray-400" size={32} />
            </div>
            <p className="text-gray-600 font-semibold text-lg">No announcements match the current filters</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginated.map((a: any) => {
                const created =
                  a.creadoEn?.toDate?.().toLocaleDateString?.() ?? "No date";
                const visible = a.visible !== false;

                return (
                  <div
                    key={a.id}
                    className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1"
                  >
                    {/* Header with gradient */}
                    <div className={`relative p-5 ${
                      visible 
                        ? 'bg-gradient-to-r from-[#EE7203] to-[#FF3816]' 
                        : 'bg-gradient-to-r from-gray-400 to-gray-500'
                    }`}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h2 className="text-lg font-black text-white line-clamp-2 leading-tight">
                            {a.titulo}
                          </h2>
                          
                          <button
                            type="button"
                            onClick={() => handleToggleVisible(a)}
                            className="flex-shrink-0 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg p-2 transition-all"
                          >
                            {visible ? (
                              <FiEye className="text-white" size={18} />
                            ) : (
                              <FiEyeOff className="text-white" size={18} />
                            )}
                          </button>
                        </div>

                        <p className="text-white/90 text-sm font-medium line-clamp-2">
                          {a.subtitulo}
                        </p>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                          <FiTag className="text-[#EE7203]" size={16} />
                          <span className="bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white text-xs font-bold px-3 py-1 rounded-full">
                            {a.idioma?.toUpperCase?.() || "N/A"}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 font-semibold">{created}</span>
                      </div>

                      {/* Status badge */}
                      <div className="mb-5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg ${
                          visible
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {visible ? (
                            <>
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              Visible to students
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              Hidden from students
                            </>
                          )}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPreview(a)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-[#0C212D] rounded-lg font-bold text-sm transition-all"
                        >
                          <FiPreview size={16} />
                          Preview
                        </button>

                        <button
                          onClick={() => setModal({ mode: "edit", anuncio: a })}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-[#EE7203] to-[#FF3816] hover:from-[#FF3816] hover:to-[#EE7203] text-white rounded-lg font-bold text-sm transition-all shadow-md hover:shadow-lg"
                        >
                          <FiEdit2 size={16} />
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            setConfirmDelete({
                              open: true,
                              anuncioId: a.id,
                              titulo: a.titulo,
                            })
                          }
                          className="flex items-center justify-center px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold text-sm transition-all"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <span className="text-sm text-gray-600 font-semibold">
                    Page {safePage} of {totalPages} — Showing{" "}
                    <span className="text-[#EE7203] font-black">{paginated.length}</span> of{" "}
                    <span className="text-[#EE7203] font-black">{filteredAndSorted.length}</span> announcements
                  </span>

                  <div className="flex items-center gap-3">
                    <button
                      disabled={safePage === 1}
                      onClick={() => handleChangePage(safePage - 1)}
                      className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white rounded-lg font-bold transition-all hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                    >
                      <FiChevronLeft size={18} />
                    </button>

                    <span className="text-sm font-black text-[#0C212D] min-w-[60px] text-center">
                      {safePage} / {totalPages}
                    </span>

                    <button
                      disabled={safePage === totalPages}
                      onClick={() => handleChangePage(safePage + 1)}
                      className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white rounded-lg font-bold transition-all hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                    >
                      <FiChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-1 h-1 bg-[#EE7203] rounded-full"></div>
            <div className="w-1 h-1 bg-[#FF3816] rounded-full"></div>
            <div className="w-1 h-1 bg-[#EE7203] rounded-full"></div>
          </div>
          <p className="text-xs text-gray-400 font-semibold">
            © {new Date().getFullYear()} Further Campus - Admin Panel
          </p>
        </div>
      </div>

      {/* MODALS */}
      {modal && (
        <AnuncioModal
          mode={modal.mode}
          anuncio={modal.anuncio}
          onClose={() => setModal(null)}
          onSaved={() => {
            loadAnuncios();
            setModal(null);
          }}
        />
      )}

      {confirmDelete.open && (
        <DeleteConfirmModal
          titulo={confirmDelete.titulo}
          onCancel={() => setConfirmDelete({ open: false })}
          onConfirm={() => {
            if (confirmDelete.anuncioId) {
              handleDelete(confirmDelete.anuncioId);
            }
            setConfirmDelete({ open: false });
          }}
        />
      )}

      {preview && (
        <PreviewModal anuncio={preview} onClose={() => setPreview(null)} />
      )}
    </div>
  );
}

/* ===== DELETE CONFIRM MODAL ===== */
function DeleteConfirmModal({
  titulo,
  onCancel,
  onConfirm,
}: {
  titulo?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
              <FiAlertCircle size={24} />
            </div>
            <h3 className="text-2xl font-black">Delete Announcement?</h3>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-700 leading-relaxed">
            You are about to delete <span className="font-black text-[#0C212D]">"{titulo}"</span>. 
            This action cannot be undone.
          </p>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-[#0C212D] rounded-xl font-bold transition-all"
            >
              Cancel
            </button>

            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== PREVIEW MODAL ===== */
function PreviewModal({
  anuncio,
  onClose,
}: {
  anuncio: any;
  onClose: () => void;
}) {
  const created =
    anuncio?.creadoEn?.toDate?.().toLocaleDateString?.() ?? "No date";
  const visible = anuncio?.visible !== false;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl border border-gray-100 max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#0C212D] via-[#112C3E] to-[#0C212D] p-6 text-white">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#EE7203] to-[#FF3816] opacity-20 rounded-full blur-2xl -mr-20 -mt-20"></div>
          
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h3 className="text-2xl font-black mb-2">{anuncio.titulo}</h3>
                <p className="text-gray-300 font-medium">{anuncio.subtitulo}</p>
              </div>

              <button
                onClick={onClose}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-all"
              >
                <FiX className="text-white" size={20} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white text-xs font-bold px-3 py-1 rounded-full">
                {anuncio.idioma?.toUpperCase?.() || "N/A"}
              </span>

              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                visible
                  ? 'bg-green-500/20 text-green-300'
                  : 'bg-gray-500/20 text-gray-300'
              }`}>
                {visible ? "Visible" : "Hidden"}
              </span>

              <span className="text-xs text-gray-400 font-semibold ml-auto">{created}</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
            {anuncio.contenido || (
              <p className="text-gray-400 italic">No additional content.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}