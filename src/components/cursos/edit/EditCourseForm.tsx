"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  writeBatch,
  arrayUnion,
  Timestamp,
  serverTimestamp,
  setDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Exercises, { Exercise } from "../cursoItem/exercises/Exercises";
import {
  FiPlus,
  FiTrash2,
  FiVideo,
  FiClock,
  FiSave,
  FiX,
  FiChevronDown,
  FiImage,
  FiLayers,
  FiTag,
  FiUpload,
  FiFileText,
  FiLink2,
  FiClipboard,
  FiUsers,
  FiSearch,
  FiCheck,
  FiBookOpen,
  FiFlag,
  FiDollarSign,
  FiGlobe,
} from "react-icons/fi";
import VocabularyEditor from "../cursoItem/VocabularyEditor";
import BlockEditor from "../cursoItem/blocks/BlockEditor";

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
    closingText?: string;
    examIntro?: string;
    examExercises?: Exercise[];
    pdfUrl?: string; // ✅ nuevo campo
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

  // 🔹 Fechas de creación y actualización
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

interface Alumno {
  email: string;
  displayName?: string;
  nombre?: string;
}

// Convierte una lección vieja → estructura de bloques
function convertLegacyLessonToBlocks(old: any) {
  const blocks: any[] = [];

  if (old.titulo) blocks.push({ type: "title", value: old.titulo });
  if (old.descripcion) blocks.push({ type: "description", value: old.descripcion });
  if (old.teoria) blocks.push({ type: "theory", value: old.teoria });
  if (old.urlVideo) blocks.push({ type: "video", url: old.urlVideo });
  if (old.pdfUrl) blocks.push({ type: "pdf", url: old.pdfUrl });

  if (old.vocabulary)
    blocks.push({ type: "vocabulary", entries: old.vocabulary.entries || [] });

  if (Array.isArray(old.ejercicios))
    old.ejercicios.forEach((ex: any) =>
      blocks.push({ type: "exercise", exercise: ex })
    );

  return {
    id: old.id || makeId(),
    blocks,
  };
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
const defaultBlock = (type: string) => {
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
      return null;
  }
};



/* ==============================================================
   COMPONENTE PRINCIPAL
   ============================================================== */
export default function EditCourseForm({
  
  courseId,
  initialData,  // 🔥 NUEVO: Recibe los datos pre-cargados
  loading,      // 🔥 NUEVO: Indicador de carga externa
  onClose,
}: {
  courseId: string;
  initialData?: any;  // 🔥 NUEVO
  loading?: boolean;  // 🔥 NUEVO
  onClose?: () => void;
}) {
  const { firestore, storage, alumnos, reloadData, alumnosRaw } = useAuth();

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
  const [searchAlumno, setSearchAlumno] = useState("");
  const [activeMainTab, setActiveMainTab] = useState<string>("general");
  
const [filterIdioma, setFilterIdioma] = useState("");
const [filterNivel, setFilterNivel] = useState("");
const [filterNombre, setFilterNombre] = useState(""); // 🆕
const [filterCursoId, setFilterCursoId] = useState(""); // 🆕


  // 🔹 Estados de navegación dentro del contenido
const [activeUnidad, setActiveUnidad] = useState<number>(0);
const [activeUnitTab, setActiveUnitTab] = useState<"datos" | "lecciones" | "cierre">("datos");
const [activeLeccion, setActiveLeccion] = useState<number>(0);



  /* ==============================================================
     🔹 Cargar datos del curso desde Firestore
     ============================================================== */
useEffect(() => {
  if (!initialData) return;

  setCurso(initialData);

  // ✅ Renderizar directamente sin conversiones
  setUnidades(initialData.unidades || []);
  setExamenFinal(initialData.examenFinal || { introTexto: "", ejercicios: [] });
  setCapstone(initialData.capstone || { videoUrl: "", instrucciones: "", checklist: [] });
}, [initialData]);


  function normalizeExercise(ex: any) {
  if (!ex || typeof ex !== "object") return {};

  const base = {
    id: ex.id || "",
    type: ex.type || "",
  };

  switch (ex.type) {
    case "reading":
      return {
        ...base,
        title: ex.title || "",
        text: ex.text || "",
        questions: Array.isArray(ex.questions)
          ? ex.questions.map((q: any) => ({
              id: q.id || "",
              prompt: q.prompt || "",
              kind: q.kind || "mc",
              options: q.options || [],
              correctIndex: q.correctIndex ?? 0,
              answer: q.answer ?? false,
            }))
          : [],
      };

    case "multiple_choice":
      return {
        ...base,
        question: ex.question || "",
        options: ex.options || [],
        correctIndex: ex.correctIndex ?? 0,
      };

    case "true_false":
      return {
        ...base,
        statement: ex.statement || "",
        answer: ex.answer ?? false,
      };

    case "fill_blank":
      return {
        ...base,
        title: ex.title || "",
        sentence: ex.sentence || "",
        answers: ex.answers || [],
        hintWords: ex.hintWords || "",
      };

    default:
      return {
        ...ex,
      };
  }
}

function normalizeLessonBlocks(lesson: any) {
  return {
    id: lesson.id,
    blocks: lesson.blocks.map((b: any) => {
      if (b.type === "exercise" && b.exercise) {
        return {
          ...b,
          exercise: normalizeExercise(b.exercise)
        };
      }
      return b;
    }),
  };
}


  /* ==============================================================
     🔹 Guardar cambios
     ============================================================== */
 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!firestore) return toast.error("Firestore no inicializado");
  if (!curso) return toast.error("Curso no cargado");

  const refCurso = doc(firestore, "cursos", courseId);

  // ✅ Guardar directamente sin normalizaciones raras
  const unidadesToSave = unidades.map((u) => ({
    id: u.id,
    titulo: u.titulo,
    descripcion: u.descripcion,
    introVideo: u.introVideo || "",
    urlImagen: u.urlImagen,
    textoCierre: u.textoCierre,
    lecciones: u.lecciones.map((l) => ({
      id: l.id,
      blocks: l.blocks,
    })),
    closing: u.closing || {},
  }));

  const nuevosCursantes =
    curso.cursantes?.map((e) => e.toLowerCase().trim()).filter(Boolean) || [];

  try {
    const payload: any = {
      ...curso,
      unidades: unidadesToSave,
      examenFinal,
      capstone,
      cursantes: nuevosCursantes,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(refCurso, payload);

    // 🔹 Enrolamiento (lo mantienes igual)
    if (nuevosCursantes.length > 0) {
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
            await updateDoc(batchRef, {
              [path]: arrayUnion(courseId),
            });
            userFound = true;
          }
        }
      }
    }

    toast.success(`✅ Curso "${curso.titulo}" actualizado correctamente`);
    await reloadData?.();
    onClose?.();

  } catch (err) {
    console.error("❌ Error actualizando curso:", err);
    toast.error("Error al guardar el curso");
  }
};



  /* ==============================================================
     🔹 Uploads
     ============================================================== */

  const onUploadPdfLeccion = async (
    unidadIdx: number,
    leccionIdx: number,
    file: File | undefined
  ) => {
    if (!file) return;
    if (file.type !== "application/pdf")
      return toast.error("The file must be a PDF");
    try {
      setUploading(true);
      const url = await uploadFile(
        storage,
        `cursos/lecciones/pdf/${Date.now()}_${file.name}`,
        file
      );
      updateLeccion(unidadIdx, leccionIdx, { pdfUrl: url });
      toast.success("PDF uploaded");
    } catch (e) {
      console.error(e);
      toast.error("Couldn't upload the PDF");
    } finally {
      setUploading(false);
    }
  };

  /* ==============================================================
     🔹 Handlers
     ============================================================== */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target;
    setCurso((prev) =>
      prev ? { ...prev, [name]: type === "checkbox" ? checked : value } : prev
    );
  };

 

  const agregarUnidad = () => {
    const nueva: Unidad = {
      id: makeId(),
      titulo: "",
      descripcion: "",
      urlVideo: "",
      urlImagen: "",
      ejercicios: [],
      textoCierre: "",
      lecciones: [],
    };
    setUnidades((p) => [...p, nueva]);
  };

  const borrarUnidad = (idx: number) => {
    setUnidades((p) => p.filter((_, i) => i !== idx));
  };

  const updateUnidad = useCallback(
  (
    idx: number,
    patch: Partial<Unidad> | ((prev: Unidad) => Unidad)
  ) => {
    setUnidades((prev) =>
      prev.map((u, i) => {
        if (i !== idx) return u;
        return typeof patch === "function" ? patch(u) : { ...u, ...patch };
      })
    );
  },
  []
);



  const agregarLeccion = (unidadIdx: number) => {
    const nueva: Leccion = {
  id: makeId(),
  blocks: [],
};

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

 const updateLeccion = (
  unidadIdx: number,
  leccionIdx: number,
  patch: Partial<Leccion>
) => {
  setUnidades((prev) =>
    prev.map((u, i) => {
      if (i !== unidadIdx) return u;

      return {
        ...u,
        lecciones: u.lecciones.map((l, j) =>
          j === leccionIdx ? { ...l, ...patch } : l
        ),
      };
    })
  );
};


  

  /* ==============================================================
     🔹 UX: ESC to close + scroll lock
     ============================================================== */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev || "auto";
    };
  }, [onClose]);

  /* ==============================================================
     🔹 Filtrado de alumnos
     ============================================================== */
const filteredAlumnos = useMemo(() => {
  const list = Array.isArray(alumnos) ? alumnos : [];

  return list.filter((a) => {
    const lang = a.learningLanguage || a.idioma || "";
    const lvl = a.learningLevel || a.nivel || "";
    const nombre = (a.displayName || a.nombre || "").toLowerCase();
    
    // 🔥 Buscar en alumnos_raw por email
    let tieneCurso = true;
    
    if (filterCursoId) {
      const alumnoRaw = alumnosRaw?.find(
        (raw: any) => raw.email?.toLowerCase() === a.email?.toLowerCase()
      );
      
      if (alumnoRaw && Array.isArray(alumnoRaw.cursosAsignados)) {
        tieneCurso = alumnoRaw.cursosAsignados.some((c: any) => {
          const cursoId = c.curso || "";
          return cursoId.toLowerCase().includes(filterCursoId.toLowerCase());
        });
      } else {
        tieneCurso = false;
      }
    }

    const matchLang = filterIdioma 
      ? lang.toLowerCase() === filterIdioma.toLowerCase() 
      : true;
    
    const matchLvl = filterNivel 
      ? lvl.toLowerCase() === filterNivel.toLowerCase() 
      : true;
    
    const matchNombre = filterNombre
      ? nombre.includes(filterNombre.toLowerCase())
      : true;

    return matchLang && matchLvl && matchNombre && tieneCurso;
  });
}, [alumnos, alumnosRaw, filterIdioma, filterNivel, filterNombre, filterCursoId]);


  /* ==============================================================
     🔹 Control de alumnos (toggle, añadir, quitar)
     ============================================================== */
  const toggleCursante = (email: string) => {
    setCurso((p) => {
      if (!p) return p;
      const set = new Set(p.cursantes || []);
      if (set.has(email)) set.delete(email);
      else set.add(email);
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

  const removeAllSelected = () => {
    setCurso((p) => (p ? { ...p, cursantes: [] } : p));
  };

  /* ==============================================================
     🔹 Tabs y opciones varias
     ============================================================== */
  const MAIN_TABS = [
    { id: "general", label: "General", icon: <FiBookOpen /> },
    { id: "unidades", label: "Content", icon: <FiLayers /> },
    { id: "examen", label: "Exam", icon: <FiClipboard /> },
    { id: "capstone", label: "Project", icon: <FiClipboard /> },
    { id: "cierrecurso", label: "Closing", icon: <FiFlag /> },
    { id: "cursantes", label: "Students", icon: <FiUsers /> },
  ];

  const niveles = [
  { value: "A1", label: "A1 - Beginner" },
  { value: "A2", label: "A2 - Elementary" },
  { value: "B1", label: "B1 - Intermediate" },
  { value: "B2", label: "B2 - Upper Intermediate" },
  { value: "B2.5", label: "B2.5 - High Intermediate" },
  { value: "C1", label: "C1 - Advanced" },
  { value: "C2", label: "C2 - Mastery" },
];
// Idiomas del curso (usamos curso.categoria como "language")
const idiomasCurso = [
  { value: "es", label: "Spanish" },
  { value: "en", label: "English" },
  { value: "pt", label: "Portuguese" },
  { value: "fr", label: "French" },
  { value: "it", label: "Italian" },
];

 if (loading || !curso) {
    return (
      <div className="bg-white text-slate-900 max-w-7xl w-full mx-auto rounded-3xl shadow-2xl relative max-h-[95vh] overflow-hidden flex flex-col border border-slate-200">
        <div className="flex items-center justify-center h-[90vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Material data...</p>
          </div>
        </div>
      </div>
    );
  }

const addBlock = (type: string) => {
  setUnidades(prev => {
    const copy = structuredClone(prev);
    const unidad = copy[activeUnidad];
    const leccion = unidad.lecciones[activeLeccion];

    leccion.blocks.push(defaultBlock(type));

    return copy;
  });
};

const updateBlock = (uIdx: number, lIdx: number, bIdx: number, updated: any) => {
  setUnidades(prev => {
    const copy = structuredClone(prev);
    copy[uIdx].lecciones[lIdx].blocks[bIdx] = updated;
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



  /* =========================
     RENDER
     ========================= */
  return (
   
  <div className="flex items-center justify-center" >
    {/* Shell */}
   <div className="
  relative flex w-full max-w-6xl max-h-[95vh] flex-col overflow-hidden 
  rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.25)]
  border border-[#112C3E]/30 bg-gradient-to-br 
  from-white to-[#F9FAFB]
">

      
      {/* HEADER (claro, igual a Create) */}
      <div
  className="
    relative px-8 py-6 border-b 
    bg-gradient-to-r from-[#0C212D] via-[#112C3E] to-[#0C212D]
    text-white shadow-xl
  "
>
  <button
    onClick={onClose}
    className="
      absolute top-6 right-6 text-white rounded-xl p-2 
      bg-white/10 hover:bg-white/20 backdrop-blur-md transition shadow-lg
    "
    aria-label="Close"
    type="button"
  >
    <FiX size={18} />
  </button>

  <h2 className="text-2xl font-black tracking-tight">Edit Material Academy</h2>
  <p className="text-sm text-gray-300">
    Define the structure, content, and configuration of your course.
  </p>

  {/* NAV TABS */}
  <div className="mt-6 flex flex-wrap gap-2">
    {MAIN_TABS.map((t) => {
      const active = activeMainTab === t.id;
      return (
        <button
          key={t.id}
          type="button"
          onClick={() => setActiveMainTab(t.id)}
          className={
            `
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
            transition-all duration-200 shadow-sm border backdrop-blur-md
            ` +
            (active
              ? `bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white border-transparent shadow-lg scale-[1.03]`
              : `bg-white/10 text-white/80 border-white/20 hover:bg-white/20 hover:text-white`)
          }
        >
          {t.icon}
          {t.label}
        </button>
      );
    })}
  </div>
</div>


      {/* BODY (scroll) */}
      <div className="flex-1 overflow-y-auto bg-[#F4F7FA]">

       <form onSubmit={handleSubmit} className="p-8 space-y-10">

          {/* ===== TAB: General ===== */}
          {activeMainTab === "general" && (
            <div className="space-y-8">
              {/* Card: Course info */}
              <section className="rounded-2xl border border-[#112C3E]/15 bg-white p-6 space-y-6">

                <div className="flex items-center gap-3 mb-4">
  <div className="w-10 h-10 rounded-xl bg-[#0C212D]/5 flex items-center justify-center">
    <FiBookOpen className="w-5 h-5 text-[#0C212D]" />
  </div>
  <h3 className="text-xl font-bold text-[#0C212D] tracking-tight">
    Material Information
  </h3>
</div>


                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Basics */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Material title</label>
                      <input
                        type="text"
                        name="titulo"
                        placeholder="Ex: Introduction to React"
                        value={curso.titulo}
                        onChange={handleChange}
                        className="w-full p-3.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    {/* Descripción */}
<div className="space-y-2">
  <label className="text-sm font-medium text-slate-700">
    Description
  </label>
  <textarea
    name="descripcion"
    value={curso.descripcion}
    onChange={handleChange}
    placeholder="Briefly describe what students will learn..."
    rows={4}
    className="w-full rounded-lg border border-slate-300 bg-white p-3 text-gray-800 
               focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
    required
  />
</div>


                    {/* Nivel + Idioma */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  {/* Level */}
  <div className="space-y-1">
    <label className="text-sm font-medium text-slate-700">
      Level
    </label>
    <div className="relative">
      <select
        name="nivel"
        value={curso.nivel}
        onChange={handleChange}
        required
        className="w-full appearance-none rounded-lg border border-gray-300 bg-white p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
      >
        <option value="" disabled>
          Select a level
        </option>
        {niveles.map((n) => (
          <option key={n.value} value={n.value}>
            {n.label}
          </option>
        ))}
      </select>
      <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
    </div>
  </div>

  {/* Language (usamos curso.categoria como idioma) */}
  <div className="space-y-1">
    <label className="text-sm font-medium text-slate-700">
      Language
    </label>
    <div className="relative">
      <FiGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <select
  name="idioma"
  value={curso.idioma}
  onChange={handleChange}
        className="w-full rounded-lg border border-gray-300 bg-white p-3 pl-10 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
      >
        <option value="" disabled hidden>
    Select a language
  </option>
        {idiomasCurso.map((lang) => (
          <option key={lang.value} value={lang.value}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  </div>
</div>




                    <label className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <input
                        type="checkbox"
                        name="publico"
                        checked={!!curso.publico}
                        onChange={handleChange}
                        className="h-5 w-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <div className="text-sm">
                        <span className="font-medium text-slate-700">Public course</span>
                        <span className="text-slate-500 block">Users will be able to see and access the course</span>
                      </div>
                    </label>
                  </div>

                  
                </div>
              </section>

             
            </div>
          )}

      {/* TAB: Unidades */}
{activeMainTab === "unidades" && (
  <div className="space-y-8">
    <section className="rounded-2xl border border-[#112C3E]/15 bg-white p-6 space-y-6">

      <div className="flex items-center gap-3 mb-4">
  <div className="w-10 h-10 rounded-xl bg-[#0C212D]/5 flex items-center justify-center">
    <FiLayers className="w-5 h-5 text-[#0C212D]" />
  </div>
  <h3 className="text-xl font-bold text-[#0C212D] tracking-tight">
    Material Content: Units & Sections
  </h3>
</div>


      {unidades.length === 0 ? (
        <div className="p-8 text-center bg-indigo-50 rounded-xl border border-dashed border-indigo-200 text-indigo-600">
          <p className="mb-4 text-lg font-medium">No units added yet</p>
          <button
            type="button"
            onClick={agregarUnidad}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors gap-2"
          >
            <FiPlus size={18} /> Add First Unit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Unit List */}
          <div className="md:col-span-1 space-y-3">
            {unidades.map((u, idx) => (
              <div
                key={u.id}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                  activeUnidad === idx
                    ? "bg-indigo-100 border-indigo-400 border text-indigo-800 shadow-md"
                    : "bg-white border border-slate-200 hover:bg-slate-50"
                }`}
                onClick={() => setActiveUnidad(idx)}
              >
                <span className="font-medium text-sm">
                  Unit {idx + 1}: {u.titulo || "Untitled Unit"}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    borrarUnidad(idx);
                  }}
                  className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                  aria-label="Delete unit"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={agregarUnidad}
              className="w-full flex items-center justify-center gap-2 p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-dashed border-indigo-200 hover:bg-indigo-100 transition-colors"
            >
              <FiPlus size={16} /> Add New Unit
            </button>
          </div>

          {/* Unit Details */}
          <div className="md:col-span-3 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            {unidades[activeUnidad] && (
              <>
                {/* Header tabs */}
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                  <h4 className="text-lg font-semibold text-slate-800">
                    Editing Unit {activeUnidad + 1}
                  </h4>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveUnitTab("datos")}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        activeUnitTab === "datos"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      Details
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveUnitTab("lecciones")}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        activeUnitTab === "lecciones"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      Sections ({unidades[activeUnidad]?.lecciones?.length || 0})
                    </button>
                    
                  </div>
                </div>

                {/* === TAB: Datos === */}
                {activeUnitTab === "datos" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Unit title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Introduction to JavaScript Basics"
                        value={unidades[activeUnidad]?.titulo || ""}
                        onChange={(e) =>
                          updateUnidad(activeUnidad, {
                            titulo: e.target.value,
                          })
                        }
                        className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Description (optional)
                      </label>
                      <textarea
                        placeholder="Brief description of this unit"
                        value={unidades[activeUnidad]?.descripcion || ""}
                        onChange={(e) =>
                          updateUnidad(activeUnidad, {
                            descripcion: e.target.value,
                          })
                        }
                        className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <FiImage className="w-4 h-4" /> Unit thumbnail (optional URL)
                      </label>
                      <div className="relative">
                        <FiLink2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="url"
                          placeholder="https://example.com/unit-image.jpg"
                          value={unidades[activeUnidad]?.urlImagen || ""}
                          onChange={(e) =>
                            updateUnidad(activeUnidad, {
                              urlImagen: e.target.value,
                            })
                          }
                          className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      {unidades[activeUnidad]?.urlImagen &&
                        isValidUrl(
                          unidades[activeUnidad]?.urlImagen || ""
                        ) && (
                          <img
                            src={unidades[activeUnidad]?.urlImagen}
                            alt="Unit thumbnail"
                            className="w-full rounded-xl border object-cover max-h-36"
                          />
                        )}
                    </div>
                    <div className="space-y-2">
  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
    <FiVideo className="w-4 h-4" /> Intro Video (optional)
  </label>

  <div className="relative">
    <FiLink2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
    <input
      type="url"
      placeholder="https://vimeo.com/12345"
      value={unidades[activeUnidad]?.introVideo || ""}
      onChange={(e) =>
        updateUnidad(activeUnidad, {
          introVideo: e.target.value,
        })
      }
      className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  </div>

  {/* Preview */}
  {unidades[activeUnidad]?.introVideo &&
    isValidUrl(unidades[activeUnidad]?.introVideo || "") && (
      <div className="aspect-video mt-2 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
        <iframe
          src={unidades[activeUnidad]?.introVideo}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )}
</div>

                  </div>
                )}

               {/* === TAB: Lecciones === */}
{activeUnitTab === "lecciones" && (
  <div className="space-y-6">
    {unidades[activeUnidad]?.lecciones?.length ? (
      unidades[activeUnidad].lecciones.map((l, lIdx) => (
        <div
          key={l.id}
          className={`p-4 rounded-xl border transition-all ${
            activeLeccion === lIdx
              ? "border-blue-500 bg-blue-50"
              : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-slate-800">
              Section {String.fromCharCode(65 + lIdx)}: {l.titulo || "Untitled"}
            </h4>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveLeccion(lIdx)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  activeLeccion === lIdx
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  borrarLeccion(activeUnidad, lIdx);
                }}
                className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          </div>

          {/* Contenido editable solo si está activa */}
          {activeLeccion === lIdx && (
  <div className="mt-3 space-y-4 border-t pt-4">

    {/* === Botonera para agregar bloques === */}
<div className="flex flex-wrap gap-2 mb-4">
  <button 
    type="button" 
    onClick={() => addBlock("title")} 
    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded"
  >
    + Título
  </button>
  
  <button 
    type="button" 
    onClick={() => addBlock("description")} 
    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded"
  >
    + Descripción
  </button>
  
  <button 
    type="button" 
    onClick={() => addBlock("theory")} 
    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded"
  >
    + Teoría
  </button>
  
  <button 
    type="button" 
    onClick={() => addBlock("video")} 
    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded"
  >
    + Video
  </button>
  
  <button 
    type="button" 
    onClick={() => addBlock("pdf")} 
    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded"
  >
    + PDF
  </button>
  
  <button 
    type="button" 
    onClick={() => addBlock("vocabulary")} 
    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded"
  >
    + Vocabulario
  </button>
  
  <button 
    type="button" 
    onClick={() => addBlock("exercise")} 
    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded"
  >
    + Ejercicio
  </button>
</div>

    {/* === Render dinámico de los bloques === */}
    {l.blocks.map((block, blockIdx) => (
      <div key={blockIdx} className="p-4 border rounded-lg bg-white">
        <BlockEditor
          block={block}
          onChange={(updated) => updateBlock(activeUnidad, lIdx, blockIdx, updated)}
          onDelete={() => deleteBlock(activeUnidad, lIdx, blockIdx)}
        />
      </div>
    ))}

  </div>
)}

        </div>
      ))
    ) : (
      <div className="text-center text-slate-500 py-10">
        No sections yet.
      </div>
    )}

    {/* Add new lesson */}
    <button
      type="button"
      onClick={() => agregarLeccion(activeUnidad)}
      className="w-full flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-600 rounded-xl border border-dashed border-blue-200 hover:bg-blue-100 transition-colors"
    >
      <FiPlus size={16} /> Add New Section
    </button>
  </div>
)}


                
              </>
            )}
          </div>
        </div>
      )}
    </section>
  </div>
)}


            {/* TAB: Examen */}
            {activeMainTab === "examen" && (
              <section className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-6 border border-purple-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FiClipboard className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">Final Exam</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Introductory Text for Exam</label>
                    <textarea
                      placeholder="Instructions or introduction for the final exam"
                      value={examenFinal.introTexto}
                      onChange={(e) => setExamenFinal((p) => ({ ...p, introTexto: e.target.value }))}
                      className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Exam Exercises</label>
                    <Exercises
  initial={examenFinal.ejercicios}
  onChange={(newExercises: Exercise[]) =>
    setExamenFinal((prev) => ({
      ...prev,
      ejercicios: [...newExercises],
    }))
  }
/>



                  </div>
                </div>
              </section>
            )}

            {/* TAB: Capstone */}
            {activeMainTab === "capstone" && (
              <section className="bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-2xl p-6 border border-pink-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                    <FiLayers className="w-5 h-5 text-pink-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">Capstone Project</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <FiVideo className="w-4 h-4" /> Project Video URL (optional)
                    </label>
                    <div className="relative">
                      <FiLink2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="url"
                        placeholder="https://youtube.com/watch?v=..."
                        value={capstone.videoUrl}
                        onChange={(e) => setCapstone((p) => ({ ...p, videoUrl: e.target.value }))}
                        className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                    {capstone.videoUrl && isValidUrl(capstone.videoUrl) && (
                      <div className="aspect-video bg-black/5 rounded-xl overflow-hidden">
                        <iframe
                          src={capstone.videoUrl}
                          title="Capstone video"
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Project Instructions</label>
                    <textarea
                      placeholder="Detailed instructions for the capstone project"
                      value={capstone.instrucciones}
                      onChange={(e) => setCapstone((p) => ({ ...p, instrucciones: e.target.value }))}
                      className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                      rows={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Project Checklist Items</label>
                    {capstone.checklist.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) =>
                            setCapstone((p) => {
                              const newList = [...p.checklist];
                              newList[idx] = e.target.value;
                              return { ...p, checklist: newList };
                            })
                          }
                          className="flex-1 p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder={`Checklist item ${idx + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setCapstone((p) => ({
                              ...p,
                              checklist: p.checklist.filter((_, i) => i !== idx),
                            }))
                          }
                          className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                          aria-label="Remove checklist item"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCapstone((p) => ({ ...p, checklist: [...p.checklist, ""] }))}
                      className="flex items-center gap-2 p-3 bg-pink-50 text-pink-600 rounded-xl border border-dashed border-pink-200 hover:bg-pink-100 transition-colors w-full justify-center mt-2"
                    >
                      <FiPlus size={16} /> Add Checklist Item
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* TAB: Cierre Curso */}
            {activeMainTab === "cierrecurso" && (
              <section className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-6 border border-green-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <FiFlag className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">Material Closing</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Final Material Message</label>
                    <textarea
                      placeholder="A message shown to students upon completing the entire course."
                      value={curso.textoFinalCurso}
                      onChange={handleChange}
                      name="textoFinalCurso"
                      className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      rows={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <FiVideo className="w-4 h-4" /> Final Material Video URL (optional)
                    </label>
                    <div className="relative">
                      <FiLink2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="url"
                        placeholder="https://youtube.com/watch?v=..."
                        value={curso.textoFinalCursoVideoUrl}
                        onChange={handleChange}
                        name="textoFinalCursoVideoUrl"
                        className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    {curso.textoFinalCursoVideoUrl && isValidUrl(curso.textoFinalCursoVideoUrl) && (
                      <div className="aspect-video bg-black/5 rounded-xl overflow-hidden">
                        <iframe
                          src={curso.textoFinalCursoVideoUrl}
                          title="Final Material video"
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* TAB: Cursantes */}
{/* TAB: Cursantes */}
{activeMainTab === "cursantes" && (
  <section className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 border border-blue-200">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
        <FiUsers className="w-5 h-5 text-blue-600" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900">
        Manage Material Students
      </h3>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* === COLUMNA IZQUIERDA: FILTROS + LISTA === */}
      <div className="space-y-4">

        {/* 🆕 BÚSQUEDA POR NOMBRE */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <FiSearch className="w-4 h-4" />
            Search by Name
          </label>
          <input
            type="text"
            placeholder="Type student name..."
            value={filterNombre}
            onChange={(e) => setFilterNombre(e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 🆕 FILTRO POR ID DE CURSO */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <FiTag className="w-4 h-4" />
            Filter by Course ID
          </label>
          <input
            type="text"
            placeholder="Ex: ADM006"
            value={filterCursoId}
            onChange={(e) => setFilterCursoId(e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* FILTRO POR IDIOMA */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Filter by Language</label>
          <select
            value={filterIdioma}
            onChange={(e) => setFilterIdioma(e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All languages</option>
            <option value="es">Spanish</option>
            <option value="en">English</option>
            <option value="pt">Portuguese</option>
            <option value="fr">French</option>
            <option value="it">Italian</option>
          </select>
        </div>

        {/* FILTRO POR NIVEL */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Filter by Level</label>
          <select
            value={filterNivel}
            onChange={(e) => setFilterNivel(e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All levels</option>
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
            <option value="B2.5">B2.5</option>
            <option value="C1">C1</option>
            <option value="C2">C2</option>
          </select>
        </div>

        {/* 🆕 BOTÓN LIMPIAR FILTROS */}
        {(filterNombre || filterCursoId || filterIdioma || filterNivel) && (
          <button
            type="button"
            onClick={() => {
              setFilterNombre("");
              setFilterCursoId("");
              setFilterIdioma("");
              setFilterNivel("");
            }}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 text-sm font-medium hover:bg-slate-100 transition-colors"
          >
            <FiX size={16} /> Clear filters
          </button>
        )}

        {/* LISTA DE ALUMNOS FILTRADOS */}
        <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-white">
          {filteredAlumnos.length === 0 ? (
            <p className="text-center text-slate-500 py-4">
              No students match the selected filters.
            </p>
          ) : (
            <>
              {/* 🆕 Contador de resultados */}
              <div className="mb-2 px-2 text-xs text-slate-600">
                Showing {filteredAlumnos.length} student{filteredAlumnos.length !== 1 ? 's' : ''}
              </div>

              {filteredAlumnos.map((a) => (
                <div
                  key={a.email}
                  className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer"
                  onClick={() => toggleCursante(a.email)}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-800">
                      {a.displayName || a.nombre || a.email}
                    </span>
                    {/* 🆕 Mostrar cursos asignados si se está filtrando por ID */}
                    {filterCursoId && alumnosRaw?.find(raw => raw.email === a.email)?.cursosAsignados && (
                      <span className="text-xs text-slate-500 font-mono">
                        {alumnosRaw
                          .find(raw => raw.email === a.email)
                          ?.cursosAsignados.filter((c: any) => c.curso)
                          .map((c: any) => c.curso)
                          .join(", ")}
                      </span>
                    )}
                  </div>

                  <input
                    type="checkbox"
                    checked={curso?.cursantes?.includes(a.email) || false}
                    readOnly
                    className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                </div>
              ))}
            </>
          )}
        </div>

        {/* ADD ALL FILTERED */}
        <button
          type="button"
          onClick={() => addAllFiltered(filteredAlumnos.map((a) => a.email))}
          className="w-full flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-600 rounded-xl border border-dashed border-blue-200 hover:bg-blue-100 transition-colors"
        >
          <FiPlus size={16} /> Add All Filtered Students ({filteredAlumnos.length})
        </button>
      </div>

      {/* === COLUMNA DERECHA: ALUMNOS SELECCIONADOS === */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <FiCheck size={20} className="text-blue-600" /> 
          Selected Students ({curso?.cursantes?.length || 0})
        </h4>

        <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-white">
          {!curso?.cursantes?.length ? (
            <p className="text-center text-slate-500 py-4">No students selected.</p>
          ) : (
            curso.cursantes.map((email) => (
              <div
                key={email}
                className="flex items-center justify-between p-2 hover:bg-red-50 rounded-lg cursor-pointer"
                onClick={() => toggleCursante(email)}
              >
                <span className="text-sm text-slate-800">{email}</span>
                <button
                  type="button"
                  className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                  aria-label="Remove student"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* REMOVE ALL */}
        <button
          type="button"
          onClick={removeAllSelected}
          className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl border border-dashed border-red-200 hover:bg-red-100 transition-colors"
        >
          <FiTrash2 size={16} /> Remove All Selected
        </button>
      </div>
    </div>
  </section>
)}


            {/* SAVE BAR */}
          <div className="p-4 bg-white border-t border-slate-200 sticky bottom-0 z-10 flex justify-end">
            <button
              type="submit"
              className={`
      inline-flex items-center gap-2
      px-6 py-3 rounded-xl font-bold tracking-wide
      transition-all duration-300 shadow-md

      ${
        uploading
          ? "bg-[#0C212D]/20 text-[#0C212D]/50 cursor-not-allowed"
          : `
            bg-gradient-to-r from-[#EE7203] to-[#FF3816]
            text-white
            hover:shadow-xl hover:shadow-[#EE7203]/20
            hover:scale-[1.02]
            active:scale-95
          `
      }
    `}
            >
              <FiSave size={18} />
              {uploading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  );
}
