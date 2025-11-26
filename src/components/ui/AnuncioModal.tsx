'use client';

import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, addDoc, updateDoc, collection, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const idiomas = ["es", "en", "pt", "fr", "it"];

export default function AnuncioModal({ mode, anuncio, onClose, onSaved }) {
  const [titulo, setTitulo] = useState(anuncio?.titulo || "");
  const [subtitulo, setSubtitulo] = useState(anuncio?.subtitulo || "");
  const [contenido, setContenido] = useState(anuncio?.contenido || "");
  const [idioma, setIdioma] = useState(anuncio?.idioma || "es");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);

    const payload = {
      titulo,
      subtitulo,
      contenido,
      idioma,
      actualizadoEn: serverTimestamp(),
    };

    try {
      if (mode === "create") {
        await addDoc(collection(db, "anuncios"), {
          ...payload,
          visible: true,
          creadoEn: serverTimestamp(),
        });
        toast.success("Anuncio creado");
      } else {
        await updateDoc(doc(db, "anuncios", anuncio.id), payload);
        toast.success("Anuncio actualizado");
      }

      onSaved();
      onClose();
    } catch (err) {
      toast.error("Error al guardar");
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4">
        <h2 className="text-xl font-bold">
          {mode === "create" ? "Crear anuncio" : "Editar anuncio"}
        </h2>

        <input
          className="w-full p-3 border rounded"
          placeholder="Título"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />

        <input
          className="w-full p-3 border rounded"
          placeholder="Subtítulo"
          value={subtitulo}
          onChange={(e) => setSubtitulo(e.target.value)}
        />

        <textarea
          className="w-full p-3 border rounded"
          rows={4}
          placeholder="Contenido breve del anuncio..."
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
        />

        <select
          className="w-full p-3 border rounded"
          value={idioma}
          onChange={(e) => setIdioma(e.target.value)}
        >
          {idiomas.map((i) => (
            <option key={i} value={i}>
              {i.toUpperCase()}
            </option>
          ))}
        </select>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
