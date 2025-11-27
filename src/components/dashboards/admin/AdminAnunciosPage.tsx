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

  // 🔍 filters and search
  const [search, setSearch] = useState("");
  const [filterIdioma, setFilterIdioma] = useState<"all" | string>("all");
  const [filterEstado, setFilterEstado] = useState<"all" | "visible" | "hidden">(
    "all"
  );

  // 📄 pagination
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
    <div className="p-8 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage global announcements shown to students based on their language.
          </p>
        </div>

        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          onClick={() => setModal({ mode: "create" })}
        >
          <FiPlus size={18} />
          Create announcement
        </Button>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        {/* Search */}
        <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-gray-50">
          <FiSearch className="text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by title, subtitle or content..."
            className="bg-transparent flex-1 outline-none text-sm text-gray-700"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex flex-wrap gap-3 justify-end">
          {/* Language */}
          <div className="flex items-center gap-2 text-sm">
            <FiGlobe className="text-gray-400" />
            <select
              className="border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 text-sm"
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

          {/* Status */}
          <div className="flex items-center gap-2 text-sm">
            <FiFilter className="text-gray-400" />
            <select
              className="border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 text-sm"
              value={filterEstado}
              onChange={(e) => {
                setFilterEstado(e.target.value as any);
                setPage(1);
              }}
            >
              <option value="all">All</option>
              <option value="visible">Visible only</option>
              <option value="hidden">Hidden only</option>
            </select>
          </div>
        </div>
      </div>

      {/* LIST */}
      {loadingAnuncios ? (
        <p className="text-gray-500">Loading announcements...</p>
      ) : filteredAndSorted.length === 0 ? (
        <p className="text-gray-500">
          No announcements match the current filters.
        </p>
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
                  className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Title + visibility */}
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 line-clamp-2">
                          {a.titulo}
                        </h2>
                        <p className="text-gray-600 mt-1 text-sm line-clamp-2">
                          {a.subtitulo}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleVisible(a)}
                        className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border transition
                          ${
                            visible
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : "bg-red-100 text-red-700 border-red-300"
                          }
                        `}
                      >
                        {visible ? (
                          <>
                            <FiEye size={14} />
                            <span>Visible to students</span>
                          </>
                        ) : (
                          <>
                            <FiEyeOff size={14} />
                            <span>Hidden from students</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Tag + date */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                      <div className="flex items-center gap-2">
                        <FiTag className="text-gray-400" />
                        <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                          {a.idioma?.toUpperCase?.() || "N/A"}
                        </span>
                      </div>
                      <span>{created}</span>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex justify-end gap-2 mt-6">
                    <Button
                      variant="outline"
                      className="flex items-center gap-1 text-xs"
                      onClick={() => setPreview(a)}
                    >
                      <FiPreview size={14} />
                      Preview
                    </Button>

                    <Button
                      variant="outline"
                      className="flex items-center gap-1 text-xs"
                      onClick={() => setModal({ mode: "edit", anuncio: a })}
                    >
                      <FiEdit2 size={14} />
                      Edit
                    </Button>

                    <Button
                      variant="destructive"
                      className="flex items-center gap-1 text-xs"
                      onClick={() =>
                        setConfirmDelete({
                          open: true,
                          anuncioId: a.id,
                          titulo: a.titulo,
                        })
                      }
                    >
                      <FiTrash2 size={14} />
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 text-sm text-gray-600">
              <span>
                Page {safePage} of {totalPages} — Showing{" "}
                {paginated.length} of {filteredAndSorted.length} announcements
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={safePage === 1}
                  onClick={() => handleChangePage(safePage - 1)}
                >
                  <FiChevronLeft size={16} />
                </Button>

                <span>
                  {safePage} / {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="icon"
                  disabled={safePage === totalPages}
                  onClick={() => handleChangePage(safePage + 1)}
                >
                  <FiChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* CREATE / EDIT MODAL */}
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

      {/* DELETE CONFIRM MODAL */}
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

      {/* PREVIEW MODAL */}
      {preview && (
        <PreviewModal anuncio={preview} onClose={() => setPreview(null)} />
      )}
    </div>
  );
}

/* ============================
   🧨 MODAL: Delete Confirmation
   ============================ */
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900">
          Delete announcement?
        </h3>

        <p className="text-gray-600 mt-2">
          You are about to delete <b>{titulo}</b>. This action cannot be undone.
        </p>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>

          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ============================
   👁 PREVIEW MODAL
   ============================ */
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white max-w-xl w-full rounded-2xl shadow-xl border border-gray-200 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900">
              {anuncio.titulo}
            </h3>
            <p className="text-gray-600 mt-2">{anuncio.subtitulo}</p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            Close
          </button>
        </div>

        <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
              {anuncio.idioma?.toUpperCase?.() || "N/A"}
            </span>

            <span
              className={`px-2 py-1 rounded-full text-xs ${
                visible
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {visible ? "Visible" : "Hidden"}
            </span>
          </div>

          <span>{created}</span>
        </div>

        <hr className="my-4" />

        <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">
          {anuncio.contenido || "No additional content."}
        </div>
      </div>
    </div>
  );
}
