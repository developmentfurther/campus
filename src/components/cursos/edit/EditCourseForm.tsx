"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Exercises, { Exercise } from "../cursoItem/exercises/Exercises";
import {
  FiPlus,
  FiTrash2,
  FiVideo,
  FiSave,
  FiX,
  FiChevronDown,
  FiImage,
  FiLayers,
  FiTag,
  FiLink2,
  FiClipboard,
  FiUsers,
  FiSearch,
  FiCheck,
  FiBookOpen,
  FiFlag,
  FiGlobe,
  FiClock, FiArrowRight, FiCheckCircle
} from "react-icons/fi";
import VocabularyEditor from "../cursoItem/VocabularyEditor";
import BlockEditor from "../cursoItem/blocks/BlockEditor";
import ContentTimelineEditor from "../cursoItem/Content/ContentTimeLineEditor"; // ✅ Importado
import UnitBlockToolbar from "../cursoItem/blocks/UnitToolbar"; // ✅ Importado
import LessonItem from "../cursoItem/LessonItem";

/* ----------------- Interfaces ----------------- */

interface LessonBlock {
  type:
    | "title"
    | "description"
    | "theory"
    | "video"
    | "pdf"
    | "vocabulary"
    | "exercise";
  [key: string]: any;
}

interface Leccion {
  id: string;
  blocks: LessonBlock[];
}

interface ContentItem {
  id: string;
  type: "unit" | "final_exam" | "project" | "closing";
  refId?: string;
}

interface Unidad {
  id: string;
  titulo: string;
  descripcion: string;
  introVideo?: string;
  urlImagen: string;
  ejercicios: Exercise[];
  textoCierre: string;
  lecciones: Leccion[];
  closing?: {
    examIntro?: string;
    examExercises?: Exercise[];
    closingText?: string;
    pdfUrl?: string;
    videoUrl?: string;
  };
}

interface ExamenFinal {
  introTexto: string;
  ejercicios: Exercise[];
}

interface Capstone {
  videoUrl: string;
  instrucciones: string;
  checklist: string[];
}

interface Curso {
  titulo: string;
  descripcion: string;
  nivel: string;
  idioma: string;
  publico: boolean;
  videoPresentacion: string;
  urlImagen: string;
  cursantes: string[];
  textoFinalCurso: string;
  textoFinalCursoVideoUrl: string;
  unidades?: Unidad[];
  examenFinal?: ExamenFinal;
  capstone?: Capstone;
  contentTimeline?: ContentItem[]; // ✅ Nuevo campo
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

/* ----------------- Helpers ----------------- */
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const isValidUrl = (s: string) => {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};
const uploadFile = async (storage: any, path: string, file: File): Promise<string> => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

// Crea un bloque vacío según el tipo
const defaultBlock = (type: string): LessonBlock => {
  switch (type) {
    case "title":
      return { type: "title", value: "" };
    case "description":
      return { type: "description", value: "" };
    case "theory":
      return { type: "theory", value: "" };
    case "video":
      return { type: "video", url: "" };
    case "pdf":
      return { type: "pdf", url: "" };
    case "vocabulary":
      return { type: "vocabulary", entries: [] };
    case "exercise":
      return { type: "exercise", exercise: null };
    default:
      return { type: "description", value: "" };
  }
};

/* ==============================================================
   COMPONENTE PRINCIPAL
   ============================================================== */
export default function EditCourseForm({
  courseId,
  initialData,
  loading,
  onClose,
}: {
  courseId: string;
  initialData?: any;
  loading?: boolean;
  onClose?: () => void;
}) {
  const { firestore, alumnos, reloadData, alumnosRaw, userProfile } = useAuth();

  // Estados principales
  const [curso, setCurso] = useState<Curso | null>(null);
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [examenFinal, setExamenFinal] = useState<ExamenFinal>({
    introTexto: "",
    ejercicios: [],
  });
  const [capstone, setCapstone] = useState<Capstone>({
    videoUrl: "",
    instrucciones: "",
    checklist: [],
  });
  const [uploading, setUploading] = useState(false);

  // Estados de navegación UI
  const [activeMainTab, setActiveMainTab] = useState<string>("general");
  
  // Timeline y Selección (Igual que CrearCurso)
  const [contentTimeline, setContentTimeline] = useState<ContentItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Filtros de alumnos
  const [filterIdioma, setFilterIdioma] = useState("");
  const [filterNivel, setFilterNivel] = useState("");
  const [filterNombre, setFilterNombre] = useState("");
  const [filterCursoId, setFilterCursoId] = useState("");
  const [resumeItem, setResumeItem] = useState<{ id: string; name: string } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);


  /* =========================================================
     PERSISTENCIA DE POSICIÓN (BASE DE DATOS)
     ========================================================= */

  // 1. GUARDAR: Cada vez que seleccionas un item, actualizamos Firestore
  useEffect(() => {
    // Si no hay item, perfil o firestore listo, no hacemos nada
    if (!selectedItemId || !userProfile?.batchId || !userProfile?.userKey || !firestore) return;

    // Usamos un "debounce" de 1.5 segundos para no saturar la base de datos si das clicks rápidos
    const timer = setTimeout(async () => {
      try {
        const { batchId, userKey } = userProfile;
        const batchRef = doc(firestore, "alumnos", batchId);
        
        // Guardamos en: user_XYZ.editingProgress.ID_DEL_CURSO
        // Usamos notación de punto para actualizar solo ese campo específico sin borrar lo demás
        await updateDoc(batchRef, {
          [`${userKey}.editingProgress.${courseId}`]: selectedItemId
        });
        
        // Opcional: console.log("Posición guardada en DB");
      } catch (error) {
        console.error("Error guardando posición:", error);
      }
    }, 1500); 

    return () => clearTimeout(timer);
  }, [selectedItemId, userProfile, firestore, courseId]);


 // 2. LEER: Al abrir, consultamos DIRECTAMENTE a la base de datos
  useEffect(() => {
    const checkSavedPosition = async () => {
        // Validamos que tengamos lo necesario
        if (!userProfile?.batchId || !userProfile?.userKey || !firestore || contentTimeline.length === 0) return;

        try {
            // 🔥 CLAVE: Leemos el documento fresco, no usamos el userProfile del contexto que puede ser viejo
            const batchRef = doc(firestore, "alumnos", userProfile.batchId);
            const snap = await getDoc(batchRef);

            if (snap.exists()) {
                const batchData = snap.data();
                // Accedemos a user_XXX -> editingProgress
                const userData = batchData[userProfile.userKey] || {};
                const savedProgress = userData.editingProgress || {};
                const lastId = savedProgress[courseId];

                console.log("🔍 Posición recuperada de DB:", lastId); // Para depurar

                // Si existe un ID guardado y NO es el que ya está seleccionado por defecto (el primero)
                if (lastId && lastId !== selectedItemId) {
                    
                    // Verificamos que esa unidad/sección siga existiendo en el timeline
                    const itemExists = contentTimeline.find(i => i.id === lastId);

                    if (itemExists) {
                        let name = "Sección anterior";
                        
                        // Buscamos un nombre bonito
                        if (itemExists.type === "unit") {
                            const u = unidades.find(unit => unit.id === itemExists.refId);
                            if (u) name = `Unidad: ${u.titulo || "Sin título"}`;
                        } else if (itemExists.type === "final_exam") name = "Examen Final";
                        else if (itemExists.type === "project") name = "Proyecto Final";
                        else if (itemExists.type === "closing") name = "Cierre";

                        setResumeItem({ id: lastId, name });
                    }
                }
            }
        } catch (error) {
            console.error("❌ Error leyendo posición guardada:", error);
        }
    };

    // Ejecutamos la lectura solo cuando el timeline y el usuario estén listos
    checkSavedPosition();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentTimeline, userProfile?.batchId, courseId]);
 /* ==============================================================
     1. Cargar datos e inicializar (CON NORMALIZACIÓN)
     ============================================================== */
  useEffect(() => {
    if (!initialData) return;

    // 1. Normalizar los datos (convierte formato viejo a nuevo si hace falta)
    const safeData = normalizeCourseData(initialData);

    // 2. Setear los estados con la data ya limpia
    setCurso(safeData);
    setUnidades(safeData.unidades || []);
    setExamenFinal(safeData.examenFinal || { introTexto: "", ejercicios: [] });
    setCapstone(safeData.capstone || { videoUrl: "", instrucciones: "", checklist: [] });
    setContentTimeline(safeData.contentTimeline || []);

    // 3. Seleccionar el primer item por defecto para editar
    if (safeData.contentTimeline && safeData.contentTimeline.length > 0) {
      setSelectedItemId(safeData.contentTimeline[0].id);
    }
  }, [initialData]);

  // Agregar este useEffect después de los estados
useEffect(() => {
  // 👇 AGREGAR ESTA VALIDACIÓN
  if (!curso) return;
  
  // Si el item seleccionado ya no existe en el timeline, resetear
  if (selectedItemId && !curso.contentTimeline.some(i => i.id === selectedItemId)) {
    const firstItem = curso.contentTimeline.length > 0 ? curso.contentTimeline[0].id : null;
    setSelectedItemId(firstItem);
  }
}, [curso, selectedItemId]); // 👈 Cambiar dependencia a 'curso' completo
  /* ==============================================================
     2. Handlers de Contenido (Paridad con CrearCurso)
     ============================================================== */
  
  // Agregar Elementos al Timeline
  const agregarUnidad = () => {
    const nueva: Unidad = {
      id: makeId(),
      titulo: "",
      descripcion: "",
      introVideo: "",
      urlImagen: "",
      ejercicios: [],
      textoCierre: "",
      lecciones: [],
    };
    setUnidades((prev) => [...prev, nueva]);

    const timelineId = `unit-${nueva.id}`;
    setContentTimeline((prev) => [
      ...prev,
      { id: timelineId, type: "unit", refId: nueva.id },
    ]);
    setTimeout(() => setSelectedItemId(timelineId), 50);
  };
  
  

  const addFinalExamBlock = () => {
    const id = makeId();
    setContentTimeline((prev) => {
      if (prev.some((i) => i.type === "final_exam")) return prev;
      return [...prev, { id, refId: id, type: "final_exam" }];
    });
    setSelectedItemId(id);
  };

  const addProjectBlock = () => {
    const id = makeId();
    setContentTimeline((prev) => {
      if (prev.some((i) => i.type === "project")) return prev;
      return [...prev, { id, refId: id, type: "project" }];
    });
    setSelectedItemId(id);
  };

  const addClosingBlock = () => {
    const id = makeId();
    setContentTimeline((prev) => {
      if (prev.some((i) => i.type === "closing")) return prev;
      return [...prev, { id, refId: id, type: "closing" }];
    });
    setSelectedItemId(id);
  };

  // Updates
  const updateUnidad = useCallback(
    (idx: number, patch: Partial<Unidad> | ((prev: Unidad) => Unidad)) => {
      setUnidades((prev) => {
        const nuevas = structuredClone(prev);
        const unidadPrev = nuevas[idx];
        nuevas[idx] = typeof patch === "function" ? patch(unidadPrev) : { ...unidadPrev, ...patch };
        return nuevas;
      });
    },
    []
  );

  const agregarLeccion = (unidadIdx: number) => {
    const nueva: Leccion = { id: makeId(), blocks: [] };
    setUnidades((p) =>
      p.map((u, i) =>
        i === unidadIdx ? { ...u, lecciones: [...u.lecciones, nueva] } : u
      )
    );
  };

  const borrarLeccion = (unidadIdx: number, leccionIdx: number) => {
    setUnidades((p) =>
      p.map((u, i) =>
        i === unidadIdx
          ? { ...u, lecciones: u.lecciones.filter((_, j) => j !== leccionIdx) }
          : u
      )
    );
  };

  const updateBlock = (uIdx: number, lIdx: number, bIdx: number, updated: LessonBlock) => {
    setUnidades((prev) => {
      const copy = structuredClone(prev);
      copy[uIdx].lecciones[lIdx].blocks[bIdx] = updated;
      return copy;
    });
  };

  const deleteBlock = (uIdx: number, lIdx: number, bIdx: number) => {
    setUnidades((prev) => {
      const copy = structuredClone(prev);
      copy[uIdx].lecciones[lIdx].blocks.splice(bIdx, 1);
      return copy;
    });
  };

  const addBlock = (uIdx: number, lIdx: number, type: LessonBlock["type"]) => {
      setUnidades(prev => {
        const copy = structuredClone(prev);
        copy[uIdx].lecciones[lIdx].blocks.push(defaultBlock(type));
        return copy;
      });
  }

const deleteContentItem = (itemId: string) => {
  // 1. Buscamos en el estado contentTimeline (que es tu fuente de verdad para el orden)
  const item = contentTimeline.find((i) => i.id === itemId);
  if (!item) return;

  if (!confirm(`Delete this ${item.type.replace("_", " ")}?`)) return;

  // 2. 🔥 CORRECCIÓN CRÍTICA: Actualizamos el estado contentTimeline
  // Esto asegura que handleSubmit reciba la lista limpia
  setContentTimeline((prev) => prev.filter((i) => i.id !== itemId));

  // 3. Actualizamos el objeto curso (para mantener consistencia visual si algo más lo usa)
  setCurso((prev) => {
    if (!prev) return prev;
    return {
      ...prev,
      contentTimeline: prev.contentTimeline.filter((i) => i.id !== itemId),
    };
  });

  // 4. Si es una unidad, la borramos del array de unidades
  if (item.type === "unit") {
    setUnidades((prev) => prev.filter((u) => u.id !== item.refId));
  }
  
  // 5. UX: Si borraste lo que tenías seleccionado, limpia la selección
  if (selectedItemId === itemId) {
      setSelectedItemId(null);
  }
};

  /* ==============================================================
     3. Renderizadores de Editores (Lado Derecho)
     ============================================================== */
  const renderSelectedContentItem = () => {
    if (!selectedItemId) return <div className="text-center text-gray-400 py-8">Select an item to edit.</div>;
    
    const item = contentTimeline.find((i) => i.id === selectedItemId);
    if (!item) return null;

    switch (item.type) {
      case "unit": {
        const idx = unidades.findIndex((u) => u.id === item.refId);
        if (idx === -1) return <div className="text-red-400 p-4">Unit not found</div>;
        return renderUnitEditor(idx);
      }
      case "final_exam":
        return renderFinalExamEditor();
      case "project":
        return renderProjectEditor();
      case "closing":
        return renderClosingEditor();
      default:
        return null;
    }
  };

  const renderUnitEditor = (idx: number) => {
    const unidad = unidades[idx];
    return (
      <section className="rounded-2xl border border-[#112C3E]/20 bg-white p-6 space-y-8 animate-fadeIn">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#EE7203] to-[#FF3816] text-white">
            <FiLayers className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-black text-[#0C212D] tracking-tight">
            Editing Unit: {unidad.titulo || "Untitled"}
          </h3>
        </div>

        {/* Datos Básicos Unidad */}
        <div className="space-y-5">
            <div>
                <label className="text-sm font-semibold text-[#0C212D]">Unit Title</label>
                <input
                    type="text"
                    value={unidad.titulo}
                    onChange={(e) => updateUnidad(idx, { titulo: e.target.value })}
                    className="w-full p-3 border border-[#112C3E]/20 rounded-xl focus:ring-2 focus:ring-[#EE7203]"
                />
            </div>
             <div>
                <label className="text-sm font-semibold text-[#0C212D]">Description</label>
                <textarea
                    value={unidad.descripcion}
                    onChange={(e) => updateUnidad(idx, { descripcion: e.target.value })}
                    rows={2}
                    className="w-full p-3 border border-[#112C3E]/20 rounded-xl resize-none focus:ring-2 focus:ring-[#EE7203]"
                />
            </div>
             {/* THUMBNAIL */}
            <div className="space-y-2">
  <label className="text-sm font-semibold text-[#0C212D] flex items-center gap-2">
    <FiVideo className="text-[#EE7203]"/> Unit Intro Video (Optional - Vimeo)
  </label>
  
  <input 
    type="url" 
    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-[#EE7203]" 
    placeholder="https://vimeo.com/..." 
    value={unidad.introVideo || ""} 
    onChange={e => {
        // Actualizamos directamente la propiedad introVideo de la unidad
        updateUnidad(idx, { introVideo: e.target.value });
    }} 
  />

  {/* Preview del video */}
  {unidad.introVideo && isValidUrl(unidad.introVideo) && unidad.introVideo.includes("vimeo") && (
      <div className="aspect-video rounded-xl overflow-hidden border bg-gray-100 mt-2">
        <iframe 
            src={unidad.introVideo.replace("vimeo.com", "player.vimeo.com/video")}
            className="w-full h-full"
            allowFullScreen
        />
      </div>
  )}
</div>
        </div>
        
        <hr className="border-gray-100" />

        {/* Lecciones */}
        <div>
            <h4 className="text-lg font-bold text-[#0C212D] mb-4">Sections</h4>
             <div className="space-y-4">
  {unidad.lecciones.map((l, lIdx) => (
    <LessonItem
      key={l.id}
      unidadIdx={idx}
      leccion={l}
      leccionIdx={lIdx}
      updateBlock={updateBlock}
      deleteBlock={deleteBlock}
      addBlock={addBlock}
      borrarLeccion={borrarLeccion}
    />
  ))}
</div>

            <button
                type="button"
                onClick={() => agregarLeccion(idx)}
                className="w-full flex items-center justify-center gap-2 p-3 border border-dashed rounded-xl bg-[#F8FAFC] hover:bg-[#EEF1F5]"
            >
                <FiPlus /> Add New Section
            </button>
        </div>
      </section>
    );
  };

  const renderFinalExamEditor = () => (
    <section className="rounded-2xl bg-white border border-[#112C3E]/20 p-6 space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#EE7203] to-[#FF3816] text-white">
          <FiClipboard className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-black text-[#0C212D] tracking-tight">Final Exam</h3>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#0C212D]">Introductory text</label>
        <textarea
          value={examenFinal.introTexto}
          onChange={(e) => setExamenFinal((prev) => ({ ...prev, introTexto: e.target.value }))}
          rows={4}
          className="w-full rounded-xl p-3 border border-[#112C3E]/20"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#0C212D]">Exam exercises</label>
        <Exercises
          initial={examenFinal.ejercicios}
          onChange={(newExercises) => setExamenFinal((prev) => ({ ...prev, ejercicios: newExercises }))}
        />
      </div>
    </section>
  );

  const renderProjectEditor = () => (
    <section className="rounded-2xl bg-white border border-[#112C3E]/20 p-6 space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#FF3816] to-[#EE7203] text-white">
            <FiLayers className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-black text-[#0C212D] tracking-tight">Capstone Project</h3>
      </div>
      <div>
        <label className="text-sm font-semibold">Project video URL</label>
        <input
            type="url"
            value={capstone.videoUrl}
            onChange={(e) => setCapstone((p) => ({ ...p, videoUrl: e.target.value }))}
            className="w-full rounded-xl border p-3"
        />
         {capstone.videoUrl && isValidUrl(capstone.videoUrl) && (
            <div className="aspect-video mt-2 rounded-xl border overflow-hidden">
                <iframe src={capstone.videoUrl} className="w-full h-full" allowFullScreen />
            </div>
        )}
      </div>
      <div>
         <label className="text-sm font-semibold">Instructions</label>
         <textarea
            value={capstone.instrucciones}
            onChange={(e) => setCapstone((p) => ({ ...p, instrucciones: e.target.value }))}
            rows={5}
            className="w-full rounded-xl border p-3 resize-none"
         />
      </div>
       {/* Checklist simple map */}
       <div className="space-y-2">
            <label className="text-sm font-semibold">Checklist</label>
            {capstone.checklist.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                    <input 
                        value={item} 
                        onChange={(e) => {
                            const newL = [...capstone.checklist];
                            newL[idx] = e.target.value;
                            setCapstone(p => ({...p, checklist: newL}));
                        }}
                        className="flex-1 border p-2 rounded-lg"
                    />
                    <button onClick={() => setCapstone(p => ({...p, checklist: p.checklist.filter((_, i) => i !== idx)}))} className="text-red-500"><FiTrash2/></button>
                </div>
            ))}
            <button onClick={() => setCapstone(p => ({...p, checklist: [...p.checklist, ""]}))} className="text-sm text-[#EE7203]">+ Add Item</button>
       </div>
    </section>
  );

  const renderClosingEditor = () => (
    <section className="rounded-2xl bg-white border border-[#112C3E]/20 p-6 space-y-6">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#0C212D] to-[#112C3E] text-white">
                <FiFlag className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black text-[#0C212D] tracking-tight">Closing of the Material</h3>
        </div>
        <div>
            <label className="text-sm font-semibold">Final message</label>
            <textarea
                value={curso?.textoFinalCurso || ""}
                onChange={handleChange}
                name="textoFinalCurso"
                rows={5}
                className="w-full rounded-xl border p-3 resize-none"
            />
        </div>
        <div>
             <label className="text-sm font-semibold">Final Video URL</label>
             <input
                type="url"
                name="textoFinalCursoVideoUrl"
                value={curso?.textoFinalCursoVideoUrl || ""}
                onChange={handleChange}
                className="w-full p-3 border rounded-xl"
             />
        </div>
    </section>
  );

  /* ==============================================================
     4. Handlers de Guardado
     ============================================================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !curso) return toast.error("Error: System not ready");
    setUploading(true);

    const refCurso = doc(firestore, "cursos", courseId);

    // Normalizar unidades
    const unidadesToSave = unidades.map((u) => ({
      id: u.id,
      titulo: u.titulo || "",
      descripcion: u.descripcion || "",
      introVideo: u.introVideo || "",
      urlImagen: u.urlImagen || "",
      textoCierre: u.textoCierre || "",
      lecciones: u.lecciones.map((l) => ({
        id: l.id,
        blocks: l.blocks || [],
      })),
      closing: u.closing || {},
    }));

    const nuevosCursantes = curso.cursantes?.map((e) => e.toLowerCase().trim()).filter(Boolean) || [];

    try {
      const payload: any = {
        ...curso,
        unidades: unidadesToSave,
        examenFinal,
        capstone,
        contentTimeline, // ✅ GUARDAMOS EL TIMELINE
        cursantes: nuevosCursantes,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(refCurso, payload);

      // Enrolamiento (Misma lógica que antes)
      if (nuevosCursantes.length > 0) {
        // ... (Tu lógica existente de enrolamiento en batch) ...
         for (const email of nuevosCursantes) {
            let userFound = false;
            for (let i = 1; i <= 10 && !userFound; i++) {
                const batchRef = doc(firestore, "alumnos", `batch_${i}`);
                const snap = await getDoc(batchRef);
                if (!snap.exists()) continue;
                const data = snap.data();
                const userKey = Object.keys(data).find(
                    (key) => key.startsWith("user_") && data[key]?.email === email
                );
                if (userKey) {
                    const path = `${userKey}.cursosAdquiridos`;
                    await updateDoc(batchRef, { [path]: arrayUnion(courseId) });
                    userFound = true;
                }
            }
        }
      }

     // --- CAMBIOS AQUÍ ---
        // 1. Refrescamos la data de fondo
        await reloadData?.();
        
        // 2. Quitamos el loading
        setUploading(false);

        // 3. NO cerramos el formulario todavía (quitamos onClose?.())
        // 4. Mostramos el Modal de Éxito
        setShowSuccessModal(true);
        
        // Opcional: Mantener el toast si quieres doble feedback, o quitarlo.
        // toast.success(`✅ Saved successfully`); 

    } catch (err) {
        console.error(err);
        setUploading(false);
        toast.error("Error saving course");
    }
  };

  /* ==============================================================
     5. Handlers UX / Filtros
     ============================================================== */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setCurso((prev) => (prev ? { ...prev, [name]: type === "checkbox" ? checked : value } : prev));
  };

  const filteredAlumnos = useMemo(() => {
  const list = Array.isArray(alumnos) ? alumnos : [];

  // 1. Primero filtramos según los criterios
  const matches = list.filter((a) => {
    const lang = a.learningLanguage || a.idioma || "";
    const lvl = a.learningLevel || a.nivel || "";
    const nombre = (a.displayName || a.nombre || "").toLowerCase();
    
    // Lógica de ID de curso
    let tieneCurso = true;
    if (filterCursoId) {
      const alumnoRaw = alumnosRaw?.find((raw: any) => raw.email?.toLowerCase() === a.email?.toLowerCase());
      tieneCurso = alumnoRaw && Array.isArray(alumnoRaw.cursosAsignados) 
          ? alumnoRaw.cursosAsignados.some((c: any) => (c.curso || "").toLowerCase().includes(filterCursoId.toLowerCase()))
          : false;
    }

    return (filterIdioma ? lang.toLowerCase() === filterIdioma.toLowerCase() : true) &&
           (filterNivel ? lvl.toLowerCase() === filterNivel.toLowerCase() : true) &&
           (filterNombre ? nombre.includes(filterNombre.toLowerCase()) : true) &&
           tieneCurso;
  });

  // 2. 🔥 AQUI ESTA LA MAGIA: Desduplicar por email
  const uniqueMatches: any[] = [];
  const seenEmails = new Set();

  matches.forEach((alumno) => {
    const emailNormalizado = alumno.email?.toLowerCase().trim();
    if (emailNormalizado && !seenEmails.has(emailNormalizado)) {
      seenEmails.add(emailNormalizado);
      uniqueMatches.push(alumno);
    }
  });

  return uniqueMatches;

}, [alumnos, alumnosRaw, filterIdioma, filterNivel, filterNombre, filterCursoId]);

  const toggleCursante = (email: string) => {
    setCurso((p) => {
      if (!p) return p;
      const set = new Set(p.cursantes || []);
      if (set.has(email)) set.delete(email); else set.add(email);
      return { ...p, cursantes: Array.from(set) };
    });
  };

  const addAllFiltered = (emails: string[]) => {
    setCurso((p) => {
      if (!p) return p;
      const set = new Set(p.cursantes || []);
      emails.forEach((e) => set.add(e));
      return { ...p, cursantes: Array.from(set) };
    });
  };

  const removeAllSelected = () => setCurso((p) => (p ? { ...p, cursantes: [] } : p));

  // UX: Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "auto";
    };
  }, [onClose]);


  // Constantes visuales
  const MAIN_TABS = [
    { id: "general", label: "General", icon: <FiBookOpen /> },
    { id: "content", label: "Content", icon: <FiLayers /> }, // Unificado
    { id: "cursantes", label: "Students", icon: <FiUsers /> },
  ];
  const niveles = [{ value: "A1", label: "A1 - Beginner" }, { value: "A2", label: "A2 - Elementary" }, { value: "B1", label: "B1 - Intermediate" }, { value: "B2", label: "B2 - Upper Intermediate" }, { value: "B2.5", label: "B2.5 - High Intermediate" }, { value: "C1", label: "C1 - Advanced" }, { value: "C2", label: "C2 - Mastery" }];
  const idiomasCurso = [{ value: "es", label: "Spanish" }, { value: "en", label: "English" }, { value: "pt", label: "Portuguese" }, { value: "fr", label: "French" }, { value: "it", label: "Italian" }];

  if (loading || !curso) {
    return (
      <div className="flex items-center justify-center h-[90vh] bg-white rounded-2xl shadow-xl">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#EE7203] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Material data...</p>
        </div>
      </div>
    );
  }

  /* =========================
     RENDER FINAL
     ========================= */
  return (
    <div className="flex items-center justify-center">
      <div className="relative flex w-full max-w-6xl max-h-[95vh] flex-col overflow-hidden rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.25)] border border-[#112C3E]/30 bg-gradient-to-br from-white to-[#F9FAFB]">
        
        {/* HEADER */}
        <header className="relative px-8 py-6 border-b bg-gradient-to-r from-[#0C212D] via-[#112C3E] to-[#0C212D] text-white shadow-xl">
          <button type="button" onClick={onClose} className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-md shadow-lg">
            <FiX size={20} />
          </button>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#EE7203] to-[#FF3816] text-white shadow-lg">
                <FiBookOpen size={22} />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white">Edit Material Academy</h2>
            </div>
            <p className="text-sm text-gray-300 font-medium">Update the structure and content of your material.</p>
          </div>

          <nav className="mt-6 flex flex-wrap gap-2">
            {MAIN_TABS.map((t) => {
              const active = activeMainTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveMainTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm border backdrop-blur-md ${
                    active ? "bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white border-transparent shadow-lg scale-[1.03]" : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              );
            })}
          </nav>
        </header>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
            <form onSubmit={handleSubmit} className="space-y-10">
                
                {/* === TAB GENERAL === */}
                {activeMainTab === "general" && (
                     <section className="rounded-2xl border border-[#112C3E]/20 shadow-lg p-7 bg-white relative overflow-hidden">
                        <div className="absolute -top-20 -right-16 w-44 h-44 bg-[#EE7203] opacity-[0.08] blur-2xl rounded-full" />
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 relative z-10">
                            <div className="lg:col-span-2 space-y-6">
                                <div>
                                    <label className="text-sm font-semibold text-[#0C212D]">Material Title</label>
                                    <input type="text" name="titulo" value={curso.titulo} onChange={handleChange} required className="w-full rounded-xl border border-[#112C3E]/20 bg-white p-3.5 text-[#0C212D] focus:ring-2 focus:ring-[#EE7203]" />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-[#0C212D]">Description</label>
                                    <textarea name="descripcion" value={curso.descripcion} onChange={handleChange} rows={4} className="w-full rounded-xl border border-[#112C3E]/20 bg-white p-3.5 focus:ring-2 focus:ring-[#EE7203] resize-none" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-sm font-semibold text-[#0C212D]">Level</label>
                                        <div className="relative">
                                            <select name="nivel" value={curso.nivel} onChange={handleChange} className="w-full p-3.5 rounded-xl border border-[#112C3E]/20 bg-white appearance-none focus:ring-2 focus:ring-[#EE7203]">
                                                {niveles.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
                                            </select>
                                            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-[#0C212D]">Language</label>
                                        <div className="relative">
                                            <FiGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <select name="idioma" value={curso.idioma} onChange={handleChange} className="w-full p-3.5 pl-10 rounded-xl border border-[#112C3E]/20 bg-white appearance-none focus:ring-2 focus:ring-[#EE7203]">
                                                {idiomasCurso.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 rounded-xl border border-[#112C3E]/20 bg-[#F8FAFB] p-4">
                                    <input type="checkbox" name="publico" checked={!!curso.publico} onChange={handleChange} className="h-5 w-5 accent-[#EE7203]" />
                                    <span className="text-sm font-semibold text-[#0C212D]">Public Material</span>
                                </div>
                                
                            </div>
                        </div>
                     </section>
                )}

                {/* === TAB CONTENT (Unificado) === */}
                {activeMainTab === "content" && (
                    <div className="space-y-8">
{/* === BANNER: RETOMAR TRABAJO (DB) === */}
        {resumeItem && resumeItem.id !== selectedItemId && (
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl animate-fadeIn shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white text-blue-600 rounded-lg border border-blue-100">
                        <FiClock size={20} />
                    </div>
                    <div>
                        <p className="text-sm text-blue-900 font-bold">
                            ¿Continuar donde lo dejaste?
                        </p>
                        <p className="text-xs text-blue-700">
                            Detectamos edición reciente en: <span className="font-semibold underline">{resumeItem.name}</span>
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                     <button
                        type="button"
                        onClick={() => setResumeItem(null)}
                        className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                        Descartar
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedItemId(resumeItem.id);
                            setResumeItem(null);
                        }}
                        className="flex items-center gap-1 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-200 transition-all"
                    >
                        Ir allí <FiArrowRight />
                    </button>
                </div>
            </div>
        )}


                        {/* Timeline Editor */}
                        <ContentTimelineEditor
                            items={contentTimeline}
                            onChange={setContentTimeline}
                            selectedItemId={selectedItemId}
                            onSelect={setSelectedItemId}
                            onDelete={deleteContentItem}
                            onAddUnit={agregarUnidad}
                            onAddFinalExam={addFinalExamBlock}
                            onAddProject={addProjectBlock}
                            onAddClosing={addClosingBlock}
                        />
                        {/* Editor del Item Seleccionado */}
                        {renderSelectedContentItem()}
                    </div>
                )}

                {/* === TAB CURSANTES (RESTAURADA COMPLETA) === */}
                {activeMainTab === "cursantes" && (
                    <section className="rounded-2xl bg-white border border-[#112C3E]/20 p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            
                            {/* COLUMNA IZQ: FILTROS */}
                            <div className="space-y-6">
                                {/* Search Name */}
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-[#0C212D] flex items-center gap-2"><FiSearch className="w-4 h-4"/> Search by Name</label>
                                    <input type="text" placeholder="Type student name..." value={filterNombre} onChange={(e) => setFilterNombre(e.target.value)} className="w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-[#EE7203]"/>
                                </div>
                                {/* Filter Course ID */}
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-[#0C212D] flex items-center gap-2"><FiTag className="w-4 h-4"/> Filter by Course ID</label>
                                    <input type="text" placeholder="Ex: ADM006" value={filterCursoId} onChange={(e) => setFilterCursoId(e.target.value)} className="w-full rounded-xl border p-3 font-mono outline-none focus:ring-2 focus:ring-[#EE7203]"/>
                                </div>
                                {/* Filters Lang & Level */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-[#0C212D]">Language</label>
                                        <select value={filterIdioma} onChange={(e) => setFilterIdioma(e.target.value)} className="w-full rounded-xl border p-3">
                                            <option value="">All</option><option value="es">Spanish</option><option value="en">English</option><option value="pt">Portuguese</option><option value="fr">French</option><option value="it">Italian</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-[#0C212D]">Level</label>
                                        <select value={filterNivel} onChange={(e) => setFilterNivel(e.target.value)} className="w-full rounded-xl border p-3">
                                            <option value="">All</option>{niveles.map(l=><option key={l.value} value={l.value}>{l.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                                {/* Clear Filters */}
                                {(filterNombre || filterCursoId || filterIdioma || filterNivel) && (
                                    <button type="button" onClick={() => {setFilterNombre(""); setFilterCursoId(""); setFilterIdioma(""); setFilterNivel("")}} className="w-full p-2 rounded-lg border bg-gray-50 text-sm hover:bg-gray-100 flex justify-center items-center gap-2"><FiX/> Clear Filters</button>
                                )}
                                {/* List */}
                                <div className="max-h-80 overflow-y-auto border rounded-xl p-3 bg-[#FAFAFA]">
                                    <div className="mb-2 px-1 text-xs text-gray-500">Showing {filteredAlumnos.length} student{filteredAlumnos.length!==1?'s':''}</div>
                                    {filteredAlumnos.map(a => (
                                        <div key={a.email} onClick={() => toggleCursante(a.email)} className="flex justify-between p-2 hover:bg-orange-50 cursor-pointer rounded-lg border-b border-gray-100 last:border-0">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{a.displayName || a.email}</span>
                                                {filterCursoId && a.cursosAsignados && <span className="text-xs text-gray-400 font-mono">{a.cursosAsignados.filter((c:any)=>c.curso).map((c:any)=>c.curso).join(", ")}</span>}
                                            </div>
                                            <input type="checkbox" checked={curso.cursantes.includes(a.email)} readOnly className="accent-[#EE7203]"/>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={() => addAllFiltered(filteredAlumnos.map(a => a.email))} className="w-full p-3 rounded-xl border border-dashed border-[#EE7203] text-[#EE7203] bg-[#FFF8F0] hover:bg-[#FFF0E0] font-semibold"><FiPlus className="inline mr-2"/> Add all filtered</button>
                            </div>

                            {/* COLUMNA DER: SELECCIONADOS */}
                            <div className="space-y-6">
                                <h4 className="flex items-center gap-2 text-lg font-bold text-[#0C212D]"><FiCheck className="text-[#EE7203]"/> Selected ({curso.cursantes.length})</h4>
                                <div className="max-h-80 overflow-y-auto border rounded-xl p-3 bg-[#FAFAFA]">
                                    {curso.cursantes.length === 0 ? <p className="text-center text-gray-400 py-4 text-sm">No selected students.</p> : 
                                        curso.cursantes.map(email => (
                                            <div key={email} onClick={() => toggleCursante(email)} className="flex justify-between p-2 hover:bg-red-50 cursor-pointer rounded-lg border-b border-gray-100 last:border-0">
                                                <span className="text-sm">{email}</span>
                                                <FiTrash2 className="text-red-400"/>
                                            </div>
                                        ))
                                    }
                                </div>
                                <button type="button" onClick={removeAllSelected} className="w-full p-3 rounded-xl border border-dashed border-red-300 text-red-500 bg-red-50 hover:bg-red-100 font-semibold"><FiTrash2 className="inline mr-2"/> Remove all selected</button>
                            </div>
                        </div>
                    </section>
                )}

                {/* FOOTER SAVE */}
                <div className="sticky bottom-0 z-20 flex justify-end bg-white/90 backdrop-blur-md border-t border-[#112C3E]/20 p-4 rounded-xl">
                    <button type="submit" disabled={uploading} className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold tracking-wide transition-all duration-300 shadow-md ${uploading ? "bg-gray-300 cursor-not-allowed" : "bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white hover:scale-[1.02]"}`}>
                        <FiSave size={18} /> {uploading ? "Saving..." : "Save Changes"}
                    </button>
                </div>

            </form>
        </div>
      </div>
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center border border-white/20 transform transition-all scale-100 relative overflow-hidden">
                
                {/* Decoración de fondo */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#EE7203] to-[#FF3816]" />
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#EE7203]/10 rounded-full blur-2xl" />

                {/* Icono Animado */}
                <div className="mx-auto w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <FiCheckCircle className="w-10 h-10 text-green-500 stroke-[2]" />
                </div>

                {/* Texto */}
                <h3 className="text-2xl font-black text-[#0C212D] mb-2">
                    ¡Cambios Guardados!
                </h3>
                <p className="text-gray-500 mb-8 leading-relaxed text-sm">
                    El material académico ha sido actualizado y sincronizado correctamente.
                </p>

                {/* Botón de Acción */}
                <button
                    type="button" // Importante poner type="button" para que no intente enviar form
                    onClick={() => {
                        setShowSuccessModal(false);
                        onClose?.(); 
                    }}
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white font-bold text-lg shadow-lg hover:shadow-orange-500/30 hover:scale-[1.02] transition-all active:scale-95"
                >
                    Entendido, cerrar
                </button>
            </div>
        </div>
      )}
    </div>
  );
}


/* ----------------- MIGRATION / NORMALIZATION UTILS ----------------- */
const normalizeCourseData = (legacyData: any): Curso => {
  // 1. Normalizar Unidades y Lecciones (Convertir a Bloques)
  const normalizedUnits: Unidad[] = (legacyData.unidades || []).map((u: any) => {
    const unitId = u.id || makeId();

    const normalizedLessons: Leccion[] = (u.lecciones || []).map((l: any) => {
      // Si la lección YA tiene blocks, la dejamos tal cual
      if (l.blocks && l.blocks.length > 0) return l;

      // Si NO tiene blocks (es legacy), los creamos
      const blocks: LessonBlock[] = [];

      if (l.titulo) blocks.push({ type: "title", value: l.titulo });
      if (l.descripcion) blocks.push({ type: "description", value: l.descripcion });
      
      if (l.urlVideo && l.urlVideo.trim() !== "") {
        blocks.push({ type: "video", url: l.urlVideo });
      }
      
      if (l.teoria) blocks.push({ type: "theory", value: l.teoria });
      
      if (l.pdfUrl && l.pdfUrl.trim() !== "") {
        blocks.push({ type: "pdf", url: l.pdfUrl });
      }

      if (l.vocabulary && Array.isArray(l.vocabulary.entries)) {
        blocks.push({ type: "vocabulary", entries: l.vocabulary.entries });
      }

      if (Array.isArray(l.ejercicios)) {
        l.ejercicios.forEach((ex: any) => {
          blocks.push({ type: "exercise", exercise: ex });
        });
      }

      return {
        id: l.id || makeId(),
        blocks: blocks,
      };
    });

    return {
      id: unitId,
      titulo: u.titulo || "",
      descripcion: u.descripcion || "",
      introVideo: u.introVideo || "",
      urlImagen: u.urlImagen || "",
      ejercicios: [], 
      textoCierre: u.textoCierre || "",
      lecciones: normalizedLessons,
      closing: u.closing || {}, 
    };
  });

  // 2. Construir Timeline si no existe
  const finalTimeline: ContentItem[] = legacyData.contentTimeline || [];

  if (finalTimeline.length === 0) {
    // Generar timeline basado en la existencia de datos
    normalizedUnits.forEach((u) => {
      finalTimeline.push({ id: `unit-${u.id}`, type: "unit", refId: u.id });
    });

    if (legacyData.examenFinal && (legacyData.examenFinal.introTexto || (legacyData.examenFinal.ejercicios && legacyData.examenFinal.ejercicios.length > 0))) {
      const exId = makeId();
      finalTimeline.push({ id: exId, type: "final_exam", refId: exId });
    }

    if (legacyData.capstone && (legacyData.capstone.videoUrl || legacyData.capstone.instrucciones)) {
      const capId = makeId();
      finalTimeline.push({ id: capId, type: "project", refId: capId });
    }

    if (legacyData.textoFinalCurso || legacyData.textoFinalCursoVideoUrl) {
      const closeId = makeId();
      finalTimeline.push({ id: closeId, type: "closing", refId: closeId });
    }
  }

  // 3. Retornar objeto limpio y tipado
  return {
    titulo: legacyData.titulo || "",
    descripcion: legacyData.descripcion || "",
    nivel: legacyData.nivel || "",
    idioma: legacyData.idioma || "",
    publico: legacyData.publico || false,
    videoPresentacion: legacyData.videoPresentacion || "",
    urlImagen: legacyData.urlImagen || "",
    cursantes: legacyData.cursantes || [],
    textoFinalCurso: legacyData.textoFinalCurso || "",
    textoFinalCursoVideoUrl: legacyData.textoFinalCursoVideoUrl || "",
    unidades: normalizedUnits,
    examenFinal: legacyData.examenFinal || { introTexto: "", ejercicios: [] },
    capstone: legacyData.capstone || { videoUrl: "", instrucciones: "", checklist: [] },
    contentTimeline: finalTimeline,
    createdAt: legacyData.createdAt || null,
    updatedAt: legacyData.updatedAt || null,
  };
};