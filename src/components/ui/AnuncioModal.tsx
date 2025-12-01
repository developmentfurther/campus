"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  addDoc,
  updateDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { toast } from "sonner";

const languages = ["es", "en", "pt", "fr", "it"];

export default function AnuncioModal({ mode, anuncio, onClose, onSaved }) {
  const [title, setTitle] = useState(anuncio?.titulo || "");
  const [subtitle, setSubtitle] = useState(anuncio?.subtitulo || "");
  const [language, setLanguage] = useState(anuncio?.idioma || "es");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return toast.error("Title is required.");
    if (!subtitle.trim()) return toast.error("Subtitle is required.");

    setLoading(true);

    const payload = {
      titulo: title.trim(),
      subtitulo: subtitle.trim(),
      contenido: "", // contenido eliminado, lo dejamos vacío
      idioma: language,
      actualizadoEn: serverTimestamp(),
    };

    try {
      if (mode === "create") {
        await addDoc(collection(db, "anuncios"), {
          ...payload,
          visible: true,
          creadoEn: serverTimestamp(),
        });
        toast.success("Announcement created.");
      } else {
        await updateDoc(doc(db, "anuncios", anuncio.id), payload);
        toast.success("Announcement updated.");
      }

      onSaved(); // 👈 ya no llamamos onClose aquí
    } catch (err) {
      console.error(err);
      toast.error("Error saving announcement.");
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-2xl bg-[#0C212D] border border-[#112C3E] overflow-hidden shadow-2xl">

        {/* HEADER */}
        <div className="p-6 bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white">
          <h2 className="text-2xl font-extrabold">
            {mode === "create" ? "Create Announcement" : "Edit Announcement"}
          </h2>
          <p className="text-white/90 text-sm mt-1">
            Configure the title, subtitle and language
          </p>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-4 bg-[#0C212D]">
          {/* Title */}
          <div>
            <label className="block text-sm text-gray-300 mb-1 font-semibold">
              Title
            </label>
            <input
              className="w-full p-3 rounded-xl bg-[#112C3E] border border-[#17364d] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#EE7203]"
              placeholder="Title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-sm text-gray-300 mb-1 font-semibold">
              Short message
            </label>
            <input
              className="w-full p-3 rounded-xl bg-[#112C3E] border border-[#17364d] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#EE7203]"
              placeholder="Short message..."
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm text-gray-300 mb-1 font-semibold">
              Language
            </label>
            <select
              className="w-full p-3 rounded-xl bg-[#112C3E] border border-[#17364d] text-white cursor-pointer focus:ring-2 focus:ring-[#EE7203]"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {languages.map((l) => (
                <option value={l} key={l}>
                  {l.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 p-6 bg-[#0C212D] border-t border-[#112C3E]">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white font-bold hover:opacity-90 transition shadow-md"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
