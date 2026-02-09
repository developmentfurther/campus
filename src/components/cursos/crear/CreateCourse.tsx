"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  Timestamp,
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
} from "react-icons/fi";
import BlockEditor from "../cursoItem/blocks/BlockEditor";
import ContentTimelineEditor from "../cursoItem/Content/ContentTimeLineEditor";
import UnitBlockToolbar from "../cursoItem/blocks/UnitToolbar";
import LessonItem from "../cursoItem/LessonItem"; // ✅ IMPORTADO
import { db, storage } from "@/lib/firebase";
import useAutoSave from "@/hooks/useAutoSave";
/* ----------------- Interfaces ----------------- */

interface LessonBlock {
  type: string;
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
  contentTimeline: ContentItem[];
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

const defaultBlock = (type: string): LessonBlock => {
    const base = { type };
    if (type === "vocabulary") return { ...base, entries: [] };
    if (type === "exercise") return { ...base, exercise: null };
    if (["video", "pdf"].includes(type)) return { ...base, url: "" };
    return { ...base, value: "" };
};

/* ==============================================================
   COMPONENTE PRINCIPAL: CREAR CURSO
   ============================================================== */
export default function CrearCurso({ onClose }: { onClose?: () => void }) {
  const { firestore, alumnos, reloadData, alumnosRaw } = useAuth();
  const dbToUse = firestore || db; 

  // --- Estados del Curso ---
  const [curso, setCurso] = useState<Curso>({
    titulo: "",
    descripcion: "",
    nivel: "",
    idioma: "",
    publico: true,
    videoPresentacion: "",
    urlImagen: "",
    cursantes: [],
    textoFinalCurso: "",
    textoFinalCursoVideoUrl: "",
    contentTimeline: [],
  });

  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [examenFinal, setExamenFinal] = useState<ExamenFinal>({ introTexto: "", ejercicios: [] });
  const [capstone, setCapstone] = useState<Capstone>({ videoUrl: "", instrucciones: "", checklist: [] });

  // --- Estados UI ---
  const [activeMainTab, setActiveMainTab] = useState<string>("general");
  const [uploading, setUploading] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  // Estado para el texto del JSON
const [jsonImportText, setJsonImportText] = useState("");
// Estado para mostrar/ocultar el panel de importación (opcional, si quieres que sea un popup)
const [showImportModal, setShowImportModal] = useState(false);

  // --- Filtros Alumnos ---
  const [filterIdioma, setFilterIdioma] = useState("");
  const [filterNivel, setFilterNivel] = useState("");
  const [filterNombre, setFilterNombre] = useState("");
  const [filterCursoId, setFilterCursoId] = useState("");
  // 1. Agrupar todo lo que queremos salvar

// --- Estado para el Modal de Confirmación de Salida ---
  const [showExitModal, setShowExitModal] = useState(false);

  // Función para verificar si hay cambios antes de cerrar
  const handleAttemptClose = () => {
    // Verificamos si hay algo de información relevante cargada
    const hasData = curso.titulo || curso.descripcion || unidades.length > 0;

    if (hasData) {
      // Si hay datos, mostramos la pregunta
      setShowExitModal(true);
    } else {
      // Si está vacío, cerramos directamente sin preguntar
      onClose?.();
    }
  };

  // Actualizar el listener de la tecla Escape para usar la nueva lógica
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Si el modal de confirmación ya está abierto, lo cerramos con Escape
        if (showExitModal) {
            setShowExitModal(false);
        } else {
            // Si no, intentamos cerrar el curso
            handleAttemptClose();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, curso, unidades, showExitModal]);



  /* ==============================================================
     LOGICA DE FILTRADO
     ============================================================== */
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

  // 2. Desduplicar por email
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
      setCurso(p => {
          const s = new Set(p.cursantes);
          s.has(email) ? s.delete(email) : s.add(email);
          return { ...p, cursantes: Array.from(s) };
      });
  };

  const addAllFiltered = (emails: string[]) => {
    setCurso((p) => {
      const set = new Set(p.cursantes || []);
      emails.forEach((e) => set.add(e));
      return { ...p, cursantes: Array.from(set) };
    });
  };

  const removeAllSelected = () => {
    setCurso((p) => ({ ...p, cursantes: [] }));
  };



  const agregarUnidad = () => {
    const nueva: Unidad = {
      id: makeId(),
      titulo: "",
      descripcion: "",
      urlImagen: "",
      lecciones: [],
      ejercicios: [],
      textoCierre: ""
    };
    setUnidades(prev => [...prev, nueva]);
    
    const tId = `unit-${nueva.id}`;
    setCurso(prev => ({
        ...prev,
        contentTimeline: [...prev.contentTimeline, { id: tId, type: "unit", refId: nueva.id }]
    }));
    setTimeout(() => setSelectedItemId(tId), 50);
  };

  const addTimelineItem = (type: ContentItem["type"]) => {
      if (["final_exam", "project", "closing"].includes(type)) {
          if (curso.contentTimeline.some(i => i.type === type)) {
              toast.error(`You can only have one ${type.replace("_", " ")}`);
              return;
          }
      }
      const id = makeId();
      setCurso(prev => ({
          ...prev,
          contentTimeline: [...prev.contentTimeline, { id, type, refId: id }]
      }));
      setSelectedItemId(id);
  };

  // 🔥 NUEVA FUNCIÓN: Eliminar items del timeline y sus datos asociados
  const deleteContentItem = (itemId: string) => {
    const item = curso.contentTimeline.find((i) => i.id === itemId);
    if (!item) return;

    if (!confirm(`Delete this ${item.type.replace("_", " ")}?`)) return;

    // 1. Actualizar el Timeline
    setCurso((prev) => ({
      ...prev,
      contentTimeline: prev.contentTimeline.filter((i) => i.id !== itemId),
    }));

    // 2. Borrar datos asociados si es una unidad
    if (item.type === "unit") {
      setUnidades((prev) => prev.filter((u) => u.id !== item.refId));
    }
    
    // 3. Resetear selección si borramos lo que estábamos viendo
    if (selectedItemId === itemId) {
        setSelectedItemId(null);
    }
  };

  const updateUnidad = useCallback((idx: number, patch: Partial<Unidad>) => {
    setUnidades(prev => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...patch };
        return copy;
    });
  }, []);

  const agregarLeccion = (uIdx: number) => {
      setUnidades(prev => {
          const copy = structuredClone(prev);
          copy[uIdx].lecciones.push({ id: makeId(), blocks: [] });
          return copy;
      });
  };

  const borrarLeccion = (uIdx: number, lIdx: number) => {
      setUnidades(prev => {
          const copy = structuredClone(prev);
          copy[uIdx].lecciones.splice(lIdx, 1);
          return copy;
      });
  };

  const addBlock = (uIdx: number, lIdx: number, type: string) => {
      setUnidades(prev => {
          const copy = structuredClone(prev);
          copy[uIdx].lecciones[lIdx].blocks.push(defaultBlock(type));
          return copy;
      });
  };

  const updateBlock = (uIdx: number, lIdx: number, bIdx: number, val: any) => {
      setUnidades(prev => {
          const copy = structuredClone(prev);
          copy[uIdx].lecciones[lIdx].blocks[bIdx] = val;
          return copy;
      });
  };

  const deleteBlock = (uIdx: number, lIdx: number, bIdx: number) => {
      setUnidades(prev => {
          const copy = structuredClone(prev);
          copy[uIdx].lecciones[lIdx].blocks.splice(bIdx, 1);
          return copy;
      });
  };

  /* ==============================================================
     RENDERIZADORES
     ============================================================== */
  const renderSelectedContentItem = () => {
    if (!selectedItemId) return <div className="text-center text-gray-400 py-10">Select an item from the timeline to edit.</div>;
    
    const item = curso.contentTimeline.find(i => i.id === selectedItemId);
    if (!item) return null;

    if (item.type === "unit") {
        const idx = unidades.findIndex(u => u.id === item.refId);
        if (idx === -1) return <div>Unit not found</div>;
        const u = unidades[idx];
        return (
            <div className="space-y-6 animate-fadeIn">
                <div className="bg-white p-6 rounded-2xl border border-[#112C3E]/20 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                         <div className="p-2 bg-orange-100 text-[#EE7203] rounded-lg"><FiLayers /></div>
                         <h3 className="font-bold text-lg text-[#0C212D]">Editing Unit</h3>
                    </div>
                    <div className="grid gap-4">
                        <input className="w-full p-3 border rounded-xl" placeholder="Unit Title" value={u.titulo} onChange={e => updateUnidad(idx, { titulo: e.target.value })} />
                        <textarea className="w-full p-3 border rounded-xl" rows={2} placeholder="Description" value={u.descripcion} onChange={e => updateUnidad(idx, { descripcion: e.target.value })} />
                        <div className="space-y-2">
                        <label className="text-sm font-semibold text-[#0C212D] flex items-center gap-2">
                            <FiVideo className="text-[#EE7203]"/> Unit Intro Video (Optional - Vimeo)
                        </label>
                        <input 
                            type="url" 
                            className="w-full p-3 border rounded-xl" 
                            placeholder="https://vimeo.com/..." 
                            value={u.introVideo || ""} 
                            onChange={e => {
                                updateUnidad(idx, { introVideo: e.target.value });
                            }} 
                        />
                        {/* Preview del video de la unidad */}
                        {u.introVideo && isValidUrl(u.introVideo) && u.introVideo.includes("vimeo") && (
                             <div className="aspect-video rounded-xl overflow-hidden border bg-gray-100 mt-2">
                                <iframe 
                                    src={u.introVideo.replace("vimeo.com", "player.vimeo.com/video")}
                                    className="w-full h-full"
                                    allowFullScreen
                                />
                            </div>
                        )}
                    </div>
                </div>
                </div>
                <div>
                    <h4 className="font-bold text-[#0C212D] mb-4">Sections</h4>
                    
                    {/* 🔥 AQUÍ USAMOS EL COMPONENTE COLAPSABLE LessonItem */}
                    <div className="space-y-4">
                        {u.lecciones.map((l, lIdx) => (
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

                    <button onClick={() => agregarLeccion(idx)} className="w-full p-3 border border-dashed rounded-xl bg-slate-50 hover:bg-slate-100 flex justify-center items-center gap-2 text-slate-600 font-medium mt-4">
                        <FiPlus /> Add Section
                    </button>
                </div>
            </div>
        );
    }

    if (item.type === "final_exam") {
        return (
            <div className="bg-white p-6 rounded-2xl border border-[#112C3E]/20 space-y-6 animate-fadeIn">
                <h3 className="font-bold text-lg text-[#0C212D] flex items-center gap-2"><FiClipboard className="text-[#EE7203]"/> Final Exam</h3>
                <textarea className="w-full p-3 border rounded-xl" rows={3} placeholder="Exam Instructions" value={examenFinal.introTexto} onChange={e => setExamenFinal(p => ({...p, introTexto: e.target.value}))} />
                <Exercises initial={examenFinal.ejercicios} onChange={ex => setExamenFinal(p => ({...p, ejercicios: ex}))} />
            </div>
        );
    }

    if (item.type === "project") {
        return (
            <div className="bg-white p-6 rounded-2xl border border-[#112C3E]/20 space-y-6 animate-fadeIn">
                 <h3 className="font-bold text-lg text-[#0C212D] flex items-center gap-2"><FiLayers className="text-[#EE7203]"/> Capstone Project</h3>
                 <input className="w-full p-3 border rounded-xl" placeholder="Video URL" value={capstone.videoUrl} onChange={e => setCapstone(p => ({...p, videoUrl: e.target.value}))} />
                 <textarea className="w-full p-3 border rounded-xl" rows={4} placeholder="Instructions" value={capstone.instrucciones} onChange={e => setCapstone(p => ({...p, instrucciones: e.target.value}))} />
                 <div className="space-y-2">
                     <label className="font-semibold text-sm">Checklist</label>
                     {capstone.checklist.map((item, i) => (
                         <div key={i} className="flex gap-2">
                             <input value={item} onChange={e => {
                                 const copy = [...capstone.checklist]; copy[i] = e.target.value;
                                 setCapstone(p => ({...p, checklist: copy}));
                             }} className="flex-1 p-2 border rounded-lg" />
                             <button onClick={() => setCapstone(p => ({...p, checklist: p.checklist.filter((_, idx) => idx !== i)}))} className="text-red-500"><FiTrash2/></button>
                         </div>
                     ))}
                     <button onClick={() => setCapstone(p => ({...p, checklist: [...p.checklist, ""]}))} className="text-sm text-[#EE7203] font-medium">+ Add Item</button>
                 </div>
            </div>
        );
    }

    if (item.type === "closing") {
        return (
            <div className="bg-white p-6 rounded-2xl border border-[#112C3E]/20 space-y-6 animate-fadeIn">
                <h3 className="font-bold text-lg text-[#0C212D] flex items-center gap-2"><FiFlag className="text-[#EE7203]"/> Closing</h3>
                <textarea className="w-full p-3 border rounded-xl" rows={4} placeholder="Final Message" name="textoFinalCurso" value={curso.textoFinalCurso} onChange={e => setCurso(p => ({...p, textoFinalCurso: e.target.value}))} />
               <input 
    type="url"
    placeholder="https://vimeo.com/123456789" 
    name="textoFinalCursoVideoUrl" 
    value={curso.textoFinalCursoVideoUrl} 
    onChange={(e) => {
        const url = e.target.value;
        // Validación Vimeo
        if (url && !url.includes("vimeo.com")) {
            toast.warning("⚠️ Only Vimeo URLs are supported");
        }
        setCurso(p => ({...p, textoFinalCursoVideoUrl: url}));
    }}
    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-[#EE7203]"
/>

{/* ✅ Preview del video */}
{curso.textoFinalCursoVideoUrl && isValidUrl(curso.textoFinalCursoVideoUrl) && (
    <div className="aspect-video rounded-xl overflow-hidden border bg-gray-100">
        <iframe 
            src={curso.textoFinalCursoVideoUrl.replace("vimeo.com", "player.vimeo.com/video")}
            className="w-full h-full"
            allowFullScreen
        />
    </div>
)}
            </div>
        );
    }
    return null;
  };

  /* ==============================================================
     HANDLE SUBMIT
     ============================================================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbToUse) return toast.error("Database not initialized");
    if (!curso.titulo) return toast.error("Title is required");

    try {
        setUploading(true);
        const payload = {
            ...curso,
            unidades: unidades.map(u => ({
                id: u.id,
                titulo: u.titulo || "",
                descripcion: u.descripcion || "",
                urlImagen: u.urlImagen || "",
                introVideo: u.introVideo || "",
                lecciones: u.lecciones,
                textoCierre: u.textoCierre || "",
                closing: u.closing || {}
            })),
            examenFinal,
            capstone,
            contentTimeline: curso.contentTimeline, 
            creadoEn: serverTimestamp(),
            actualizadoEn: serverTimestamp(),
            cursantes: curso.cursantes.map(c => c.toLowerCase().trim())
        };

        const docRef = await addDoc(collection(dbToUse, "cursos"), payload);

        if (payload.cursantes.length > 0) {
            for (const email of payload.cursantes) {
                let found = false;
                for (let i = 1; i <= 10 && !found; i++) {
                    const batchRef = doc(dbToUse, "alumnos", `batch_${i}`);
                    const snap = await getDoc(batchRef);
                    if (!snap.exists()) continue;
                    const data = snap.data();
                    const key = Object.keys(data).find(k => k.startsWith("user_") && data[k]?.email === email);
                    if (key) {
                        await updateDoc(batchRef, { [`${key}.cursosAdquiridos`]: arrayUnion(docRef.id) });
                        found = true;
                    }
                }
            }
            await updateDoc(doc(dbToUse, "cursos", docRef.id), { cursantes: arrayUnion(...payload.cursantes) });
        }

        toast.success("Course created successfully!");
        reloadData?.();
        onClose?.();

    } catch (err) {
        console.error(err);
        toast.error("Error creating course");
    } finally {
        setUploading(false);
    }
  };





  // --- UX Close ---
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "auto";
    };
  }, [onClose]);

  const MAIN_TABS = [
      { id: "general", label: "General", icon: <FiBookOpen /> },
      { id: "content", label: "Content", icon: <FiLayers /> },
      { id: "cursantes", label: "Students", icon: <FiUsers /> },
  ];

  // 📥 FUNCIÓN PARA CARGAR JSON (Importar)
const handleLoadFromJsonText = () => {
  if (!jsonImportText.trim()) {
    toast.error("El campo está vacío");
    return;
  }

  try {
    // 1. Intentar convertir el texto a objeto JS
    const data = JSON.parse(jsonImportText);

    // 2. Validaciones básicas de estructura
    if (!data.curso || !Array.isArray(data.unidades)) {
      throw new Error("El JSON no tiene la estructura correcta (faltan 'curso' o 'unidades').");
    }

    // 3. Restaurar estados (Misma lógica que antes)
    setCurso({
        titulo: data.curso.titulo || "",
        descripcion: data.curso.descripcion || "",
        nivel: data.curso.nivel || "",
        idioma: data.curso.idioma || "",
        publico: data.curso.publico ?? true,
        videoPresentacion: data.curso.videoPresentacion || "",
        urlImagen: data.curso.urlImagen || "",
        cursantes: Array.isArray(data.curso.cursantes) ? data.curso.cursantes : [],
        textoFinalCurso: data.curso.textoFinalCurso || "",
        textoFinalCursoVideoUrl: data.curso.textoFinalCursoVideoUrl || "",
        contentTimeline: Array.isArray(data.curso.contentTimeline) ? data.curso.contentTimeline : []
    });

    setUnidades(data.unidades);

    if (data.examenFinal) setExamenFinal(data.examenFinal);
    if (data.capstone) setCapstone(data.capstone);

    // 4. Feedback visual
    toast.success("✅ Datos cargados correctamente");
    setJsonImportText(""); // Limpiar el campo
    setShowImportModal(false); // Cerrar el modal si lo usas
    
    // Forzar actualización de vista
    if (data.curso.contentTimeline?.length > 0) {
        setSelectedItemId(data.curso.contentTimeline[0].id);
    }

  } catch (error) {
    console.error(error);
    toast.error("❌ Error de sintaxis JSON. Revisa que no falten comillas o llaves.");
  }
};

// 📤 FUNCIÓN HELPER PARA DESCARGAR (Para que pruebes la estructura)
const handleExportJson = () => {
    const backupData = {
        curso: curso,         // Tu estado 'curso' actual
        unidades: unidades,   // Tu estado 'unidades' actual
        examenFinal: examenFinal,
        capstone: capstone
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `curso_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
};
  return (
    <div className="flex items-center justify-center">
        <div className="relative flex w-full max-w-6xl max-h-[95vh] flex-col overflow-hidden rounded-2xl shadow-2xl border border-[#112C3E]/30 bg-gradient-to-br from-white to-[#F9FAFB]">
            
            {/* Header */}
            <header className="px-8 py-6 border-b bg-gradient-to-r from-[#0C212D] via-[#112C3E] to-[#0C212D] text-white shadow-md relative">
                 <button type="button" onClick={handleAttemptClose} className="absolute right-6 top-6 p-2 rounded-xl bg-white/10 hover:bg-white/20"><FiX size={20}/></button>
                 <div className="flex items-center gap-2 mb-1">
                     <div className="p-2 rounded-xl bg-gradient-to-br from-[#EE7203] to-[#FF3816] shadow-lg"><FiBookOpen size={22}/></div>
                     <h2 className="text-2xl font-black">Create Material Academy</h2>
                 </div>
                 <p className="text-gray-300 text-sm pl-14">Define the structure and content of your new material.</p>
                 
                 <div className="flex gap-2 mt-6">
                     {MAIN_TABS.map(t => (
                         <button type="button" key={t.id} onClick={() => setActiveMainTab(t.id)} 
                            className={`px-4 py-2 rounded-lg text-sm font-bold flex gap-2 items-center transition-all ${activeMainTab === t.id ? 'bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white shadow-lg' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}>
                            {t.icon} {t.label}
                         </button>
                     ))}
                 </div>
            </header>

            {/* Body */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
                <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* --- GENERAL TAB --- */}
                    {activeMainTab === "general" && (
                        <div className="bg-white p-8 rounded-2xl border border-[#112C3E]/10 shadow-sm space-y-6">
                             <div className="grid lg:grid-cols-2 gap-6">
                                 <div>
                                     <label className="text-[#0C212D] font-bold text-sm">Material Title</label>
                                     <input className="w-full p-3 border rounded-xl mt-1 focus:ring-2 focus:ring-[#EE7203]" value={curso.titulo} onChange={e => setCurso({...curso, titulo: e.target.value})} placeholder="Ex: React Basics" required />
                                 </div>
                                 <div>
                                     <label className="text-[#0C212D] font-bold text-sm">Language</label>
                                     <select className="w-full p-3 border rounded-xl mt-1" value={curso.idioma} onChange={e => setCurso({...curso, idioma: e.target.value})} required>
                                         <option value="" hidden>Select...</option>
                                         <option value="es">Spanish</option> <option value="en">English</option>
                                         <option value="pt">Portuguese</option> <option value="fr">French</option><option value="it">Italian</option>
                                     </select>
                                 </div>
                                 <div className="lg:col-span-2">
                                     <label className="text-[#0C212D] font-bold text-sm">Description</label>
                                     <textarea className="w-full p-3 border rounded-xl mt-1 resize-none" rows={3} value={curso.descripcion} onChange={e => setCurso({...curso, descripcion: e.target.value})} required />
                                 </div>
                                 

                                 <div>
                                     <label className="text-[#0C212D] font-bold text-sm">Level</label>
                                     <select className="w-full p-3 border rounded-xl mt-1" value={curso.nivel} onChange={e => setCurso({...curso, nivel: e.target.value})} required>
                                         <option value="" hidden>Select...</option>
                                         {["A1","A2","B1","B2","B2.5","C1","C2"].map(l => <option key={l} value={l}>{l}</option>)}
                                     </select>
                                 </div>
                                 <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border">
                                     <input type="checkbox" checked={curso.publico} onChange={e => setCurso({...curso, publico: e.target.checked})} className="accent-[#EE7203] w-5 h-5" />
                                     <span className="font-bold text-[#0C212D]">Public Material</span>
                                 </div>
                             </div>
                        </div>
                    )}

                    {/* --- CONTENT TAB (TIMELINE) --- */}
                    {activeMainTab === "content" && (
                        <div className="space-y-6">
{/* --- COMPONENTE IMPORTAR JSON --- */}
<div className="mb-8 overflow-hidden rounded-2xl border-2 border-[#EE7203]/30 bg-gradient-to-br from-[#0C212D] to-[#112C3E] shadow-2xl">
  
  {/* Header de la tarjeta */}
  <div className="relative overflow-hidden border-b-2 border-[#EE7203]/20 bg-gradient-to-r from-[#112C3E] to-[#0C212D] px-6 py-5">
    {/* Decoración de fondo */}
    <div className="absolute top-0 right-0 w-32 h-32 bg-[#EE7203]/10 rounded-full blur-3xl"></div>
    <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#FF3816]/10 rounded-full blur-2xl"></div>
    
    <div className="relative flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EE7203] to-[#FF3816] flex items-center justify-center shadow-lg">
        <FiClipboard className="text-white" size={20} />
      </div>
      <div>
        <h3 className="font-black text-white text-base tracking-wide">
          IMPORTAR DATOS DESDE JSON
        </h3>
        <p className="text-xs text-white/60 font-medium">
          Autocompleta todos los campos del curso
        </p>
      </div>
    </div>
  </div>

  {/* Cuerpo de la tarjeta */}
  <div className="p-6 space-y-4">
    <div className="bg-[#EE7203]/5 border-l-4 border-[#EE7203] rounded-r-lg p-4">
      <p className="text-sm text-white/80 leading-relaxed">
        Pega aquí el objeto JSON del curso para autocompletar todos los campos automáticamente.
      </p>
    </div>
    
    <div className="relative group">
      {/* Glow effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#EE7203] to-[#FF3816] rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
      
      <textarea
        value={jsonImportText}
        onChange={(e) => setJsonImportText(e.target.value)}
        className="relative w-full min-h-[180px] rounded-xl border-2 border-[#EE7203]/30 bg-[#0C212D] p-4 font-mono text-sm text-[#EE7203] placeholder:text-white/30 focus:border-[#EE7203] focus:outline-none focus:ring-2 focus:ring-[#EE7203]/50 transition-all shadow-inner"
        placeholder='{
  "curso": {
    "titulo": "Mi Curso Avanzado",
    "descripcion": "Descripción completa..."
  },
  "unidades": [...]
}'
        spellCheck={false}
      />
    </div>

    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleLoadFromJsonText}
        className="group relative px-8 py-3 rounded-xl font-black text-sm text-white transition-all hover:scale-105 active:scale-95 uppercase tracking-wider shadow-xl bg-gradient-to-r from-[#EE7203] to-[#FF3816] hover:shadow-2xl hover:shadow-[#EE7203]/50 overflow-hidden"
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        
        <span className="relative flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Cargar Datos
        </span>
      </button>

      {/* Badge informativo */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
        <div className="w-2 h-2 rounded-full bg-[#EE7203] animate-pulse"></div>
        <span className="text-xs text-white/70 font-medium">
          Formato JSON válido
        </span>
      </div>
    </div>
  </div>
</div>

                            <ContentTimelineEditor 
                                items={curso.contentTimeline}
                                onChange={newTl => setCurso(prev => ({...prev, contentTimeline: newTl}))}
                                selectedItemId={selectedItemId}
                                onSelect={setSelectedItemId}
                                onDelete={deleteContentItem} // ✅ AGREGADO: Función para borrar
                                onAddUnit={agregarUnidad}
                                onAddFinalExam={() => addTimelineItem("final_exam")}
                                onAddProject={() => addTimelineItem("project")}
                                onAddClosing={() => addTimelineItem("closing")}
                            />
                            {renderSelectedContentItem()}
                        </div>
                    )}

                    {/* --- STUDENTS TAB (Restaurada al diseño original) --- */}
                    {activeMainTab === "cursantes" && (
                      <section className="rounded-2xl bg-white border border-[#112C3E]/20 p-6 space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#0C212D] to-[#112C3E] text-white">
                            <FiUsers className="w-5 h-5" />
                          </div>
                          <h3 className="text-xl font-black text-[#0C212D] tracking-tight">
                            Material student management
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          
                          {/* === COLUMNA IZQUIERDA: FILTROS + LISTA === */}
                          <div className="space-y-6">
                            
                            {/* SEARCH BY NAME */}
                            <div className="space-y-1">
                              <label className="text-sm font-semibold text-[#0C212D] flex items-center gap-2">
                                <FiSearch className="w-4 h-4" /> Search by Name
                              </label>
                              <input
                                type="text"
                                placeholder="Type student name..."
                                value={filterNombre}
                                onChange={(e) => setFilterNombre(e.target.value)}
                                className="w-full rounded-xl border border-[#112C3E]/20 bg-white p-3 text-[#0C212D] focus:ring-2 focus:ring-[#EE7203] outline-none"
                              />
                            </div>

                            {/* FILTER BY COURSE ID */}
                            <div className="space-y-1">
                              <label className="text-sm font-semibold text-[#0C212D] flex items-center gap-2">
                                <FiTag className="w-4 h-4" /> Filter by Course ID
                              </label>
                              <input
                                type="text"
                                placeholder="Ex: ADM006"
                                value={filterCursoId}
                                onChange={(e) => setFilterCursoId(e.target.value)}
                                className="w-full rounded-xl border border-[#112C3E]/20 bg-white p-3 text-[#0C212D] font-mono focus:ring-2 focus:ring-[#EE7203] outline-none"
                              />
                            </div>

                            {/* FILTERS: LANGUAGE & LEVEL */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                <label className="text-sm font-semibold text-[#0C212D]">Language</label>
                                <select
                                    value={filterIdioma}
                                    onChange={(e) => setFilterIdioma(e.target.value)}
                                    className="w-full rounded-xl border border-[#112C3E]/20 bg-white p-3 text-[#0C212D] focus:ring-2 focus:ring-[#EE7203]"
                                >
                                    <option value="">All</option>
                                    <option value="es">Spanish</option>
                                    <option value="en">English</option>
                                    <option value="pt">Portuguese</option>
                                    <option value="fr">French</option>
                                    <option value="it">Italian</option>
                                </select>
                                </div>
                                <div className="space-y-1">
                                <label className="text-sm font-semibold text-[#0C212D]">Level</label>
                                <select
                                    value={filterNivel}
                                    onChange={(e) => setFilterNivel(e.target.value)}
                                    className="w-full rounded-xl border border-[#112C3E]/20 bg-white p-3 text-[#0C212D] focus:ring-2 focus:ring-[#EE7203]"
                                >
                                    <option value="">All</option>{["A1","A2","B1","B2","B2.5","C1","C2"].map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                                </div>
                            </div>

                            {/* CLEAR FILTERS */}
                            {(filterNombre || filterCursoId || filterIdioma || filterNivel) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFilterNombre("");
                                  setFilterCursoId("");
                                  setFilterIdioma("");
                                  setFilterNivel("");
                                }}
                                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border border-[#112C3E]/20 bg-gray-50 text-[#0C212D] text-sm font-medium hover:bg-gray-100 transition"
                              >
                                <FiX size={16} /> Clear filters
                              </button>
                            )}

                            {/* FILTERED LIST */}
                            <div className="max-h-80 overflow-y-auto rounded-xl border border-[#112C3E]/20 bg-[#0C212D]/[0.02] p-3">
                              {filteredAlumnos.length === 0 ? (
                                <p className="text-center text-[#0C212D]/50 py-6 text-sm">No students match.</p>
                              ) : (
                                <>
                                  <div className="mb-2 px-2 text-xs text-[#0C212D]/60">
                                    Showing {filteredAlumnos.length} student{filteredAlumnos.length !== 1 ? 's' : ''}
                                  </div>
                                  {filteredAlumnos.map((a) => (
                                    <div
                                      key={a.email}
                                      onClick={() => toggleCursante(a.email)}
                                      className="flex items-center justify-between p-2 rounded-lg hover:bg-[#EE7203]/10 cursor-pointer transition"
                                    >
                                      <div className="flex flex-col">
                                        <span className="text-sm font-medium text-[#0C212D]">{a.displayName || a.nombre || a.email}</span>
                                        {filterCursoId && a.cursosAsignados && (
                                          <span className="text-xs text-[#0C212D]/50 font-mono">
                                            {a.cursosAsignados.filter((c: any) => c.curso).map((c: any) => c.curso).join(", ")}
                                          </span>
                                        )}
                                      </div>
                                      <input type="checkbox" checked={curso.cursantes.includes(a.email)} readOnly className="h-4 w-4 accent-[#EE7203]" />
                                    </div>
                                  ))}
                                </>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => addAllFiltered(filteredAlumnos.map((a) => a.email))}
                              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-[#EE7203]/40 bg-[#EE7203]/10 text-[#EE7203] font-semibold hover:bg-[#EE7203]/20 transition"
                            >
                              <FiPlus /> Add all filtered students
                            </button>
                          </div>

                          {/* === COLUMNA DERECHA: SELECCIONADOS === */}
                          <div className="space-y-6">
                            <h4 className="flex items-center gap-2 text-lg font-bold text-[#0C212D]">
                              <FiCheck className="text-[#EE7203]" /> Selected students ({curso.cursantes.length})
                            </h4>
                            <div className="max-h-80 overflow-y-auto rounded-xl border border-[#112C3E]/20 bg-[#0C212D]/[0.02] p-3">
                              {curso.cursantes.length === 0 ? (
                                <p className="text-center text-[#0C212D]/50 py-6 text-sm">No selected students.</p>
                              ) : (
                                curso.cursantes.map((email) => (
                                  <div key={email} onClick={() => toggleCursante(email)} className="flex items-center justify-between p-2 rounded-lg hover:bg-red-50 cursor-pointer transition">
                                    <span className="text-sm text-[#0C212D]">{email}</span>
                                    <button type="button" className="text-[#0C212D]/40 hover:text-red-500 p-1 rounded-full">
                                      <FiTrash2 size={15} />
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={removeAllSelected}
                              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-red-300 bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition"
                            >
                              <FiTrash2 /> Delete all selected
                            </button>
                          </div>
                        </div>
                      </section>
                    )}

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-white/90 backdrop-blur border-t p-4 flex justify-end rounded-xl">
                        <button type="submit" disabled={uploading} className="px-8 py-3 bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                            {uploading ? "Creating..." : <><FiSave /> Create Material</>}
                        </button>
                    </div>

                </form>
            </div>
        </div>
        {/* --- MODAL DE CONFIRMACIÓN DE SALIDA --- */}
{showExitModal && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center  p-4 animate-fadeIn">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 transform transition-all scale-100">
      
      {/* Header del Modal */}
      <div className="bg-orange-50 p-6 border-b border-orange-100 flex items-center gap-4">
        <div className="bg-orange-100 p-3 rounded-full text-[#EE7203]">
          <FiFlag size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#0C212D]">¿Salir sin guardar?</h3>
          <p className="text-sm text-gray-500">Perderás todos los cambios realizados.</p>
        </div>
      </div>

      {/* Acciones */}
      <div className="p-6 flex gap-3 justify-end bg-white">
        <button
          onClick={() => setShowExitModal(false)}
          className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={() => {
            setShowExitModal(false);
            onClose?.(); // 👈 Aquí cerramos definitivamente
          }}
          className="px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-md transition-all transform active:scale-95"
        >
          Sí, salir y descartar
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}