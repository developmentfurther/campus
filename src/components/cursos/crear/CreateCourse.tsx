
"use client";

/**
 * CrearCurso — Functional parity with EditarCurso
 * - Global tabs: general | unidades | examen | capstone | cierrecurso | cursantes
 * - Units: NO video at unit level (force urlVideo=""), optional duration
 * - Lessons: title (required), text/video/pdf optional, exercises[], finalMessage
 * - Final Exam: introTexto + ejercicios[] (no video)
 * - Capstone: videoUrl + instructions + checklist[] (validate URL)
 * - Closing: textoFinalCurso + textoFinalCursoVideoUrl (validate URL)
 * - Storage uploads: course thumbnail + lesson PDFs
 * - Pricing normalized; toasts via Sonner
 * - On create: addDoc + serverTimestamp; enroll students into alumnos/{email}.cursosAdquiridos via arrayUnion
 */

import React, { useContext, useState, useEffect, useMemo, useCallback } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  writeBatch,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  Firestore,
  Timestamp,
  setDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, FirebaseStorage } from "firebase/storage";
import { useAuth } from "@/contexts/AuthContext"; // ✅ correcto
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
import { storage, db } from "@/lib/firebase";
import VocabularyEditor from "../cursoItem/VocabularyEditor";





/* ----------------- Interfaces for Data Structures ----------------- */



interface Leccion {
  id: string;
  titulo: string;
  descripcion?: string;
  teoria?: string;
  urlVideo: string;
  urlImagen: string;
  pdfUrl: string;

  vocabulary?: {
  entries: {
    term: string;
    translation: string;
    example?: string;
  }[];
};


  ejercicios: Exercise[];
  finalMessage: string;
}


interface Unidad {
  id: string;
  titulo: string;
  descripcion: string;
  introVideo?: string;
  duracion?: number; // Optional duration in minutes
  urlImagen: string;
  ejercicios: Exercise[]; // Legacy, kept for backward compat
  textoCierre: string;
  lecciones: Leccion[];

  // 🆕 Nueva estructura para manejar el cierre de unidad
  closing?: {
    examIntro?: string;           // Texto introductorio para examen de cierre
    examExercises?: Exercise[];  // Ejercicios del examen
    closingText?: string;         // Texto final de la unidad
    pdfUrl?: string;              // ✅ URL del resumen PDF
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
  cursantes: string[]; // array of student emails
  textoFinalCurso: string;
  textoFinalCursoVideoUrl: string;
  unidades?: Unidad[]; // Will be added on save
  examenFinal?: ExamenFinal; // Will be added on save
  capstone?: Capstone; // Will be added on save
  creadoEn?: Timestamp;


  // 🔹 Fechas de creación y actualización
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

interface Alumno {
  email: string;
  displayName?: string;
  nombre?: string;
  // Add other student-related fields if available in your context
}


/* ----------------- small helpers ----------------- */
// Unique ID for units/lessons
const makeId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// Basic URL validator
const isValidUrl = (s: string): boolean => {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

// Upload a file to Storage and return its download URL

export const uploadFile = async (path: string, file: File): Promise<string> => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};





interface CrearCursoProps {
  onClose?: () => void;
}

function CrearCurso({ onClose }: CrearCursoProps) {
  // Context: Firestore/Storage, loaders, global courses state

  // Full context (to read students list)
 const { firestore, storage, alumnos, reloadData } = useAuth();;


  /* =========================
     Main Tabs (parity)
     ========================= */
  const MAIN_TABS = [
    { id: "general", label: "General", icon: <FiBookOpen /> },
    { id: "unidades", label: "Content", icon: <FiLayers /> },
    { id: "examen", label: "Exam", icon: <FiClipboard /> },
    { id: "capstone", label: "Project", icon: <FiClipboard /> },
    { id: "cierrecurso", label: "Closing", icon: <FiFlag /> },
    { id: "cursantes", label: "Students", icon: <FiUsers /> },
  ];
  const [activeMainTab, setActiveMainTab] = useState<string>("general");

  /* =========================
     Course state (level course)
     ========================= */
  const [curso, setCurso] = useState<Curso>({
  titulo: "",
  descripcion: "",
  nivel: "",
  idioma: "",         // ← reemplaza a categoria
  publico: true,
  videoPresentacion: "",
  urlImagen: "",
  cursantes: [],
  textoFinalCurso: "",
  textoFinalCursoVideoUrl: "",
});




// Batch actual (ajustá según tu lógica real)
const batchId = "batch_1"; // o tomalo desde contexto si lo tenés

  /* =========================
     Units / Lessons
     ========================= */
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [activeUnidad, setActiveUnidad] = useState<number>(0);
  const [activeUnitTab, setActiveUnitTab] = useState<"datos" | "lecciones" | "cierre">("datos"); // 'datos' | 'lecciones' | 'cierre'
  const [activeLeccion, setActiveLeccion] = useState<number>(0);
  const [filterIdioma, setFilterIdioma] = useState("");
  const [filterNivel, setFilterNivel] = useState("");
  const [filterNombre, setFilterNombre] = useState(""); // 🆕 Búsqueda por nombre
  const [filterCursoId, setFilterCursoId] = useState("");

  /* =========================
     Exam & Capstone (parity)
     ========================= */
  const [examenFinal, setExamenFinal] = useState<ExamenFinal>({
    introTexto: "",
    ejercicios: [], // parity: Exercises at course level
  });

  const [capstone, setCapstone] = useState<Capstone>({
    videoUrl: "", // NEW: own video for project
    instrucciones: "",
    checklist: [],
  });

  const [uploading, setUploading] = useState<boolean>(false);

  /* =========================
     Students (UI)
     ========================= */

  /* =========================
     Handlers - Course
     ========================= */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setCurso((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

 

  /* =========================
     Units
     ========================= */
  const agregarUnidad = () => {
    // NOTE: urlVideo kept for backward-compat but WILL be forced "" on save
    const nueva: Unidad = {
      id: makeId(),
      titulo: "",
      descripcion: "",
      urlVideo: "", // 🧹 removed from UI usage
      duracion: undefined, // optional
      urlImagen: "",
      ejercicios: [],
      textoCierre: "",
      lecciones: [],
    };
    setUnidades((p) => [...p, nueva]);
    setTimeout(() => {
      setActiveMainTab("unidades");
      setActiveUnidad(unidades.length);
      setActiveUnitTab("datos");
      setActiveLeccion(0);
    }, 0);
  };

  const borrarUnidad = (idx: number) => {
    setUnidades((p) => p.filter((_, i) => i !== idx));
    setActiveUnidad((i) => (i > 0 ? i - 1 : 0));
    setActiveUnitTab("datos");
    setActiveLeccion(0);
  };

const updateUnidad = useCallback(
  (
    idx: number,
    patch: Partial<Unidad> | ((prev: Unidad) => Unidad)
  ) => {
    setUnidades((prev) => {
      // Clonamos el array completo para evitar referencias mutadas
      const nuevas = structuredClone(prev);

      // Aplicamos el patch de forma segura
      const unidadPrev = nuevas[idx];
      nuevas[idx] =
        typeof patch === "function" ? patch(unidadPrev) : { ...unidadPrev, ...patch };

      return nuevas;
    });
  },
  []
);

const updateLeccion = useCallback(
  (unidadIdx: number, leccionIdx: number, patch: Partial<Leccion>) => {
    setUnidades((prev) => {
      const nuevas = structuredClone(prev);
      const unidad = nuevas[unidadIdx];
      if (!unidad || !Array.isArray(unidad.lecciones)) return prev;

      unidad.lecciones[leccionIdx] = {
        ...unidad.lecciones[leccionIdx],
        ...patch,
      };

      nuevas[unidadIdx] = unidad;
      return nuevas;
    });
  },
  []
);


  /* =========================
     Lessons
     ========================= */
  const agregarLeccion = (unidadIdx: number) => {
    const nueva: Leccion = {
      id: makeId(),
      titulo: "",
      descripcion: "",
      teoria: "",
      urlVideo: "",
      urlImagen: "",
      pdfUrl: "",
      ejercicios: [],
      finalMessage: "",
    };
    setUnidades((p) =>
      p.map((u, i) =>
        i === unidadIdx ? { ...u, lecciones: [...u.lecciones, nueva] } : u
      )
    );
    setTimeout(
      () => setActiveLeccion(unidades[unidadIdx]?.lecciones?.length || 0),
      0
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
    setActiveLeccion((i) => (i > 0 ? i - 1 : 0));
  };



  // === Subida a Imgur ===
async function uploadToImgur(file: File): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: {
        Authorization: "Client-ID TU_CLIENT_ID_AQUI", // 👈 reemplazá por tu Client ID
      },
      body: formData,
    });

    const data = await res.json();
    if (data.success) return data.data.link;
    console.error("Imgur upload failed:", data);
    toast.error("Upload failed");
    return null;
  } catch (err) {
    console.error("Error uploading to Imgur:", err);
    toast.error("Error uploading image");
    return null;
  }
}

  /* =========================
     Uploads
     ========================= */
  const onUploadMiniaturaCurso = async (file: File | undefined) => {
  if (!file) return;
  if (!file.type.startsWith("image/"))
    return toast.error("Upload a valid image");
  try {
    setUploading(true);
    // 🔹 Subir a Imgur en lugar de Firebase Storage
    const url = await uploadToImgur(file);
    if (!url) return toast.error("Could not upload image");
    setCurso((p) => ({ ...p, urlImagen: url }));
    toast.success("Thumbnail uploaded successfully");
  } catch (e: any) {
    console.error(e);
    toast.error("Couldn't upload thumbnail");
  } finally {
    setUploading(false);
  }
};


  const onUploadPdfLeccion = async (unidadIdx: number, leccionIdx: number, file: File | undefined) => {
    if (!file) return;
    if (file.type !== "application/pdf")
      return toast.error("The file must be a PDF");
    try {
      setUploading(true);
      const url = await uploadFile(
        `cursos/lecciones/pdf/${Date.now()}_${file.name}`,
        file
      );
      updateLeccion(unidadIdx, leccionIdx, { pdfUrl: url });
      toast.success("PDF uploaded");
    } catch (e: any) {
      console.error(e);
      toast.error("Couldn't upload the PDF");
    } finally {
      setUploading(false);
    }
  };

  /* =========================
     Students helpers
     ========================= */
  const toggleCursante = (email: string) => {
    setCurso((p) => {
      const set = new Set(p.cursantes || []);
      if (set.has(email)) set.delete(email);
      else set.add(email);
      return { ...p, cursantes: Array.from(set) };
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

// 2️⃣ Modificar filteredAlumnos para incluir los nuevos filtros
const filteredAlumnos = useMemo(() => {
  const list = Array.isArray(alumnos) ? alumnos : [];

  return list.filter((a) => {
    const lang = a.learningLanguage || a.idioma || "";
    const lvl = a.learningLevel || a.nivel || "";
    const nombre = (a.displayName || a.nombre || "").toLowerCase();
    
    // 🔍 Verificar si el alumno tiene el curso asignado
    const cursosAsignados = a.cursosAsignados || [];
    const tieneCurso = filterCursoId 
      ? cursosAsignados.some((c: any) => 
          c.curso?.toLowerCase().includes(filterCursoId.toLowerCase())
        )
      : true;

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
}, [alumnos, filterIdioma, filterNivel, filterNombre, filterCursoId]);




  /* =========================
     Save / HandleSubmit
     ========================= */

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  console.log("🔹 [DEBUG] Iniciando handleSubmit...");

  // Verificamos Firestore
  const dbToUse = firestore || db;
  if (!dbToUse) {
    toast.error("Firestore no inicializado");
    console.error("❌ [ERROR] Ninguna instancia de Firestore disponible.");
    return;
  }

  // Validaciones básicas
  if (!curso.titulo?.trim()) {
    console.warn("⚠️ Falta título de curso");
    return toast.error("The course needs a title");
  }
  if (!Array.isArray(unidades) || unidades.length === 0) {
    console.warn("⚠️ Falta unidad");
    return toast.error("Add at least one unit");
  }

  console.log("🔹 [DEBUG] Pasó validaciones iniciales");

  // Normalizamos unidades
 const unidadesToSave: Unidad[] = unidades.map((u) => ({
  id: u.id || makeId(),
  titulo: u.titulo || "",
  descripcion: u.descripcion || "",
  introVideo: u.introVideo || "",
  urlImagen: u.urlImagen || "",
  duracion: u.duracion ? Number(u.duracion) : undefined,
  textoCierre: u.textoCierre || "",
  lecciones: (u.lecciones || []).map((l) => ({
  id: l.id || makeId(),
  titulo: l.titulo || "",
  descripcion: l.descripcion || "",
  teoria: l.teoria || "",
  urlVideo: l.urlVideo || "",
  urlImagen: l.urlImagen || "",
  pdfUrl: l.pdfUrl || "",

  vocabulary: l.vocabulary
  ? {
      entries: l.vocabulary.entries || [],
    }
  : null,


  ejercicios: Array.isArray(l.ejercicios) ? l.ejercicios : [],
  finalMessage: l.finalMessage || "",
})),


  closing: {
  examIntro: u.closing?.examIntro ?? "",
  examExercises: u.closing?.examExercises ?? [],
  closingText: u.closing?.closingText ?? "",
  pdfUrl: u.closing?.pdfUrl ?? "",
  videoUrl: u.closing?.videoUrl ?? "",
},

}));



   try {
    console.log("🚀 [DEBUG] Iniciando bloque principal de creación...");






    // =====================================================
    // 2️⃣ Crear el curso
    // =====================================================
 const payload = {
  ...curso,
  unidades: unidadesToSave,
  examenFinal,
  capstone,
  creadoEn: serverTimestamp(),      
  actualizadoEn: serverTimestamp(),
  idioma: curso.idioma,
  nivel: curso.nivel,
  
};


console.log("🔥 DEBUG PRE ADD", {
  firestore,
  db,
  unidadesToSave,
  examenFinal,
  capstone,
  payload,
});

 // ✅ Guardá el payload directo
const refCurso = await addDoc(collection(dbToUse, "cursos"), payload);



    // =====================================================
    // 3️⃣ Enrolamiento de alumnos (si existen)
    // =====================================================
    if (curso.cursantes.length > 0) {
      console.log("🚀 Iniciando enrolamiento directo...");

      for (const email of curso.cursantes.map((e) => e.toLowerCase().trim())) {
        try {
          let userFound = false;
          for (let i = 1; i <= 10; i++) {
            const batchRef = doc(dbToUse, "alumnos", `batch_${i}`);
            const snap = await getDoc(batchRef);
            if (!snap.exists()) continue;

            const data = snap.data();
            const userKey = Object.keys(data).find(
              (k) => k.startsWith("user_") && data[k]?.email === email
            );

            if (userKey) {
              const path = `${userKey}.cursosAdquiridos`;
              await updateDoc(batchRef, { [path]: arrayUnion(refCurso.id) });
              console.log(`✅ ${email} actualizado en ${batchRef.id}/${userKey}`);
              userFound = true;
              break;
            }
          }

          if (!userFound) {
            console.warn(`⚠️ Usuario ${email} no encontrado en ningún batch`);
          }
        } catch (err) {
          console.error(`❌ Error enrolando ${email}:`, err);
        }
      }

      // Relación inversa (emails en el curso)
      const cursoRef = doc(dbToUse, "cursos", refCurso.id);
      await updateDoc(cursoRef, {
        cursantes: arrayUnion(...curso.cursantes.map((e) => e.toLowerCase())),
      });

      console.log("✅ Enrolamiento completado correctamente.");
    }


    // =====================================================
    // 5️⃣ Actualizar estado local y cerrar modal
    // =====================================================
    await reloadData?.();
    toast.success("✅ created successfully");
    onClose?.();

    console.log("🎉 [DEBUG] Curso creado correctamente:", refCurso.path);
  } catch (err: any) {
    toast.error("Error creating the course");
  } finally {
    console.log("🔹 [DEBUG] handleSubmit finalizado");
  }
};



  /* =========================
     UX: ESC to close + body scroll lock
     ========================= */
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

  const niveles = [
    { value: "A1", label: "A1 - Beginner" },
    { value: "A2", label: "A2 - Elementary" },
    { value: "B1", label: "B1 - Intermediate" },
    { value: "B2", label: "B2 - Upper Intermediate" },
    { value: "B2.5", label: "B2.5 - High Intermediate" }, 
    { value: "C1", label: "C1 - Advanced" },
    { value: "C2", label: "C2 - Mastery" },
];

const idiomasCurso = [
  { value: "es", label: "Spanish" },
  { value: "en", label: "English" },
  { value: "pt", label: "Portuguese" },
  { value: "fr", label: "French" },
  { value: "it", label: "Italian" },
];

  /* =========================
     RENDER
     ========================= */
  return (
   <div className="flex items-center justify-center" >


    <div className="
  relative flex w-full max-w-6xl max-h-[95vh] flex-col overflow-hidden 
  rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.25)]
  border border-[#112C3E]/30 bg-gradient-to-br 
  from-white to-[#F9FAFB]
">
     
      {/* HEADER */}
<header
  className="
    relative px-8 py-6 border-b 
    bg-gradient-to-r from-[#0C212D] via-[#112C3E] to-[#0C212D]
    text-white shadow-xl
  "
>

  {/* Close Button */}
  <button
    type="button"
    onClick={onClose}
    aria-label="Close"
    className="
      absolute right-6 top-6 
      flex h-10 w-10 items-center justify-center 
      rounded-xl bg-white/10 text-white 
      hover:bg-white/20 transition-all backdrop-blur-md
      shadow-lg hover:scale-105 active:scale-95
    "
  >
    <FiX size={20} />
  </button>

  {/* Title + Subtitle */}
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-2">
      <div
        className="
          w-11 h-11 flex items-center justify-center rounded-xl 
          bg-gradient-to-br from-[#EE7203] to-[#FF3816] text-white shadow-lg
        "
      >
        <FiBookOpen size={22} />
      </div>

      <h2 className="text-2xl font-black tracking-tight text-white">
        Create Material Academy
      </h2>
    </div>

    <p className="text-sm text-gray-300 font-medium">
      Define the structure, content, and configuration of your material.
    </p>
  </div>

  {/* NAV TABS */}
  <nav className="mt-6 flex flex-wrap gap-2">
    {MAIN_TABS.map((t) => {
      const active = activeMainTab === t.id;

      return (
        <button
          key={t.id}
          type="button"
          onClick={() => setActiveMainTab(t.id)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
            transition-all duration-200 
            shadow-sm border backdrop-blur-md
            ${
              active
                ? "bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white border-transparent shadow-lg scale-[1.03]"
                : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20 hover:text-white"
            }
          `}
        >
          {t.icon}
          {t.label}
        </button>
      );
    })}
  </nav>
</header>


      {/* BODY */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="text-center text-gray-400 text-sm py-16">
          <form onSubmit={handleSubmit} className="space-y-10">

          {activeMainTab === "general" && (
  <div className="space-y-10">

    {/* 📘 Material Information Section */}
    <section
      className="
        rounded-2xl border border-[#112C3E]/20 shadow-lg p-7 
        bg-white relative overflow-hidden
      "
    >
      {/* Spheres */}
      <div className="absolute -top-20 -right-16 w-44 h-44 bg-[#EE7203] opacity-[0.08] blur-2xl rounded-full" />
      <div className="absolute -bottom-20 -left-16 w-40 h-40 bg-[#FF3816] opacity-[0.08] blur-2xl rounded-full" />

      {/* Header */}
      <header className="flex items-center gap-4 mb-8 relative z-10">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center 
          bg-gradient-to-br from-[#EE7203] to-[#FF3816] shadow-lg text-white"
        >
          <FiBookOpen size={22} />
        </div>
        <h3 className="text-xl font-black text-[#0C212D] tracking-tight">
          Material Information
        </h3>
      </header>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 relative z-10">
        
        {/* LEFT SIDE (Inputs) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Title */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[#0C212D]">Material Title</label>
            <input
              type="text"
              name="titulo"
              value={curso.titulo}
              onChange={handleChange}
              placeholder="Ex: Introduction to React"
              required
              className="
                w-full rounded-xl border border-[#112C3E]/20 bg-white p-3.5
                text-[#0C212D] placeholder-gray-400 
                focus:ring-2 focus:ring-[#EE7203] focus:border-transparent 
                transition-all outline-none
              "
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[#0C212D]">Description</label>
            <textarea
              name="descripcion"
              value={curso.descripcion}
              onChange={handleChange}
              placeholder="Briefly describe what students will learn..."
              rows={4}
              required
              className="
                w-full rounded-xl border border-[#112C3E]/20 bg-white p-3.5 
                text-[#0C212D] placeholder-gray-400 
                focus:ring-2 focus:ring-[#EE7203] focus:border-transparent 
                resize-none outline-none transition
              "
            />
          </div>

          {/* Nivel + Idioma */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* Level */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-[#0C212D]">Level</label>
              <div className="relative">
                <select
                  name="nivel"
                  value={curso.nivel}
                  onChange={handleChange}
                  required
                  className="
                    w-full p-3.5 rounded-xl border border-[#112C3E]/20 bg-white 
                    appearance-none text-[#0C212D] 
                    focus:ring-2 focus:ring-[#EE7203] focus:border-transparent
                    outline-none transition
                  "
                >
                  <option value="" disabled>Select a level</option>
                  {niveles.map((n) => (
                    <option key={n.value} value={n.value}>
                      {n.label}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Language */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-[#0C212D]">Language</label>
              <div className="relative">
                <FiGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  name="idioma"
                  value={curso.idioma}
                  onChange={handleChange}
                  required
                  className="
                    w-full p-3.5 pl-10 rounded-xl border border-[#112C3E]/20 bg-white 
                    appearance-none text-[#0C212D] 
                    focus:ring-2 focus:ring-[#EE7203] focus:border-transparent
                    outline-none transition
                  "
                >
                  <option value="" disabled hidden>Select a language</option>
                  {idiomasCurso.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

          </div>

          {/* Public Material */}
          <div
            className="
              flex items-center gap-3 rounded-xl border border-[#112C3E]/20 
              bg-[#F8FAFB] p-4 shadow-sm
            "
          >
            <input
              type="checkbox"
              name="publico"
              checked={!!curso.publico}
              onChange={handleChange}
              className="h-5 w-5 accent-[#EE7203]"
            />

            <div className="flex flex-col">
              <span className="text-sm font-semibold text-[#0C212D]">Public Material</span>
              <span className="text-xs text-gray-500">
                Users will be able to view and access the Material.
              </span>
            </div>
          </div>

        </div>

      </div>
    </section>
  </div>
)}


 {/* TAB: Unidades */}
{activeMainTab === "unidades" && (
  <div className="space-y-8">

    <section
      className="
        rounded-2xl border border-[#112C3E]/20 bg-white p-6
      "
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="
            w-10 h-10 rounded-lg flex items-center justify-center
            bg-gradient-to-br from-[#EE7203] to-[#FF3816] text-white
          "
        >
          <FiLayers className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-black text-[#0C212D] tracking-tight">
          Material Content: Units & Lessons
        </h3>
      </div>

      {/* SIN animaciones, SIN blur, SIN sombras grandes */}

      {unidades.length === 0 ? (
        <div
          className="
            p-8 text-center rounded-xl border border-dashed
            border-[#112C3E]/30 bg-[#F8FAFC]
          "
        >
          <p className="mb-4 text-lg font-semibold text-[#0C212D]">
            No units added yet
          </p>

          <button
            type="button"
            onClick={agregarUnidad}
            className="
              inline-flex items-center gap-2 px-4 py-2
              bg-[#EE7203] text-white rounded-xl
              hover:bg-[#FF3816] transition-colors
            "
          >
            <FiPlus size={18} /> Add First Unit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

          {/* LEFT SIDEBAR: Unit List */}
          <div className="md:col-span-1 space-y-3">

            {unidades.map((u, idx) => {
              const active = activeUnidad === idx;

              return (
                <div
                  key={u.id}
                  onClick={() => setActiveUnidad(idx)}
                  className={`
                    flex items-center justify-between p-3 rounded-xl cursor-pointer
                    border transition-colors
                    ${
                      active
                        ? "border-[#EE7203] bg-[#EE7203]/10"
                        : "border-[#112C3E]/15 bg-white hover:bg-[#F3F4F6]"
                    }
                  `}
                >
                  <span className="font-medium text-sm text-[#0C212D]">
                    Unit {idx + 1}: {u.titulo || "Untitled Unit"}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      borrarUnidad(idx);
                    }}
                    className="text-gray-400 hover:text-red-500 p-1 rounded-full"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              onClick={agregarUnidad}
              className="
                w-full flex items-center justify-center gap-2 p-3
                border border-dashed border-[#112C3E]/25 
                bg-[#F8FAFC] rounded-xl text-[#0C212D]
                hover:bg-[#EEF1F5] transition-colors
              "
            >
              <FiPlus size={16} /> Add New Unit
            </button>
          </div>

          {/* RIGHT: Unit Details */}
          <div
            className="
              md:col-span-3 p-5 rounded-2xl border border-[#112C3E]/15 bg-white
            "
          >
            {unidades[activeUnidad] && (
              <>
                {/* TAB SELECTOR (Datos / Lecciones / Cierre) */}
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#112C3E]/15">
                  <h4 className="text-lg font-semibold text-[#0C212D]">
                    Editing Unit {activeUnidad + 1}
                  </h4>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveUnitTab("datos")}
                      className={`
                        px-3 py-1.5 rounded-lg text-sm font-medium
                        ${
                          activeUnitTab === "datos"
                            ? "bg-[#EE7203] text-white"
                            : "bg-[#F3F4F6] text-[#0C212D]"
                        }
                      `}
                    >
                      Details
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveUnitTab("lecciones")}
                      className={`
                        px-3 py-1.5 rounded-lg text-sm font-medium
                        ${
                          activeUnitTab === "lecciones"
                            ? "bg-[#EE7203] text-white"
                            : "bg-[#F3F4F6] text-[#0C212D]"
                        }
                      `}
                    >
                      Lessons ({unidades[activeUnidad]?.lecciones?.length || 0})
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveUnitTab("cierre")}
                      className={`
                        px-3 py-1.5 rounded-lg text-sm font-medium
                        ${
                          activeUnitTab === "cierre"
                            ? "bg-[#EE7203] text-white"
                            : "bg-[#F3F4F6] text-[#0C212D]"
                        }
                      `}
                    >
                      Closing
                    </button>
                  </div>
                </div>

                {/* === TAB: DATOS === */}
                {activeUnitTab === "datos" && (
                  <div className="space-y-5">
                    {/* Unit Title */}
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-[#0C212D]">
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
                        className="
                          w-full p-3 border border-[#112C3E]/20 rounded-xl
                          focus:ring-2 focus:ring-[#EE7203] outline-none
                        "
                        required
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-[#0C212D]">
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
                        rows={3}
                        className="
                          w-full p-3 border border-[#112C3E]/20 rounded-xl
                          focus:ring-2 focus:ring-[#EE7203] outline-none
                          resize-none
                        "
                      />
                    </div>

                    {/* Estimated Duration */}
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-[#0C212D] flex items-center gap-2">
                        <FiClock className="w-4 h-4" /> Estimated duration (minutes)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g., 60"
                        value={unidades[activeUnidad]?.duracion || ""}
                        onChange={(e) =>
                          updateUnidad(activeUnidad, {
                            duracion:
                              parseInt(e.target.value, 10) || undefined,
                          })
                        }
                        className="
                          w-full p-3 border border-[#112C3E]/20 rounded-xl
                          focus:ring-2 focus:ring-[#EE7203] outline-none
                        "
                      />
                    </div>

                    {/* Thumbnail */}
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-[#0C212D] flex items-center gap-2">
                        <FiImage className="w-4 h-4" /> Unit thumbnail (optional URL)
                      </label>
                      <div className="relative">
                        <FiLink2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="url"
                          placeholder="https://example.com/unit-image.jpg"
                          value={unidades[activeUnidad]?.urlImagen || ""}
                          onChange={(e) =>
                            updateUnidad(activeUnidad, {
                              urlImagen: e.target.value,
                            })
                          }
                          className="
                            w-full p-3 pl-10 border border-[#112C3E]/20 rounded-xl
                            focus:ring-2 focus:ring-[#EE7203] outline-none
                          "
                        />
                      </div>
                      {unidades[activeUnidad]?.urlImagen &&
                        isValidUrl(unidades[activeUnidad]?.urlImagen || "") && (
                          <img
                            src={unidades[activeUnidad]?.urlImagen}
                            className="w-full rounded-xl border max-h-36 object-cover"
                          />
                        )}
                    </div>

                    {/* Intro Video */}
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-[#0C212D] flex items-center gap-2">
                        <FiVideo className="w-4 h-4" /> Intro Video (optional)
                      </label>

                      <div className="relative">
                        <FiLink2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="url"
                          placeholder="https://vimeo.com/12345"
                          value={unidades[activeUnidad]?.introVideo || ""}
                          onChange={(e) =>
                            updateUnidad(activeUnidad, {
                              introVideo: e.target.value,
                            })
                          }
                          className="
                            w-full p-3 pl-10 border border-[#112C3E]/20 rounded-xl
                            focus:ring-2 focus:ring-[#EE7203] outline-none
                          "
                        />
                      </div>

                      {unidades[activeUnidad]?.introVideo &&
                        isValidUrl(unidades[activeUnidad]?.introVideo || "") && (
                          <div className="aspect-video mt-2 rounded-xl overflow-hidden border border-[#112C3E]/20 bg-[#F2F4F7]">
                            <iframe
                              src={unidades[activeUnidad]?.introVideo}
                              className="w-full h-full"
                              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                              allowFullScreen
                            />
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {/* === TAB: LECCIONES === */}
                {activeUnitTab === "lecciones" && (
                  <div className="space-y-6">

                    {unidades[activeUnidad]?.lecciones?.length > 0 ? (
                      unidades[activeUnidad].lecciones.map((l, lIdx) => (
                        <div
                          key={l.id}
                          className={`
                            p-4 rounded-xl border transition-colors
                            ${
                              activeLeccion === lIdx
                                ? "border-[#EE7203] bg-[#EE7203]/10"
                                : "border-[#112C3E]/15 bg-white hover:bg-[#F8F9FB]"
                            }
                          `}
                        >
                          {/* Header */}
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-[#0C212D]">
                              Lesson {lIdx + 1}: {l.titulo || "Untitled"}
                            </h4>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setActiveLeccion(lIdx)}
                                className={`
                                  px-3 py-1.5 rounded-lg text-sm font-medium
                                  ${
                                    activeLeccion === lIdx
                                      ? "bg-[#EE7203] text-white"
                                      : "bg-[#F3F4F6] text-[#0C212D]"
                                  }
                                `}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  borrarLeccion(activeUnidad, lIdx)
                                }
                                className="
                                  p-2 rounded-lg text-red-500 hover:bg-red-50
                                "
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </div>
                          </div>

                          {/* FORMULARIO LECCIÓN ACTIVA */}
                          {activeLeccion === lIdx && (
                            <div className="mt-3 space-y-4 border-t border-[#112C3E]/15 pt-3">
                              
                              {/* Título */}
                              <div className="space-y-1">
                                <label className="text-sm font-semibold text-[#0C212D]">
                                  Lesson Title
                                </label>
                                <input
                                  type="text"
                                  value={l.titulo || ""}
                                  onChange={(e) =>
                                    updateLeccion(activeUnidad, lIdx, {
                                      titulo: e.target.value,
                                    })
                                  }
                                  className="
                                    w-full rounded-xl border border-[#112C3E]/20 p-3
                                    focus:ring-2 focus:ring-[#EE7203] outline-none
                                  "
                                />
                              </div>

                              {/* Description */}
                              <div className="space-y-1">
                                <label className="text-sm font-semibold text-[#0C212D]">
                                  Description (short)
                                </label>
                                <textarea
                                  rows={2}
                                  value={l.descripcion || ""}
                                  onChange={(e) =>
                                    updateLeccion(activeUnidad, lIdx, {
                                      descripcion: e.target.value,
                                    })
                                  }
                                  className="
                                    w-full rounded-xl border border-[#112C3E]/20 p-3
                                    focus:ring-2 focus:ring-[#EE7203] outline-none
                                    resize-none
                                  "
                                />
                              </div>

                              {/* Video */}
                              <div className="space-y-1">
                                <label className="text-sm font-semibold text-[#0C212D] flex items-center gap-2">
                                  <FiVideo className="text-[#EE7203]" />
                                  Lesson Video (Vimeo)
                                </label>

                                <input
                                  type="url"
                                  placeholder="https://vimeo.com/123456789"
                                  value={l.urlVideo || ""}
                                  onChange={(e) =>
                                    updateLeccion(activeUnidad, lIdx, {
                                      urlVideo: e.target.value,
                                    })
                                  }
                                  className="
                                    w-full rounded-xl border border-[#112C3E]/20 p-3
                                    focus:ring-2 focus:ring-[#EE7203] outline-none
                                  "
                                />

                                {l.urlVideo &&
                                  isValidUrl(l.urlVideo) && (
                                    <div className="aspect-video rounded-xl overflow-hidden border border-[#112C3E]/20 bg-[#F2F4F7]">
                                      <iframe
                                        src={l.urlVideo.replace(
                                          'vimeo.com',
                                          'player.vimeo.com/video'
                                        )}
                                        className="w-full h-full"
                                        allow="autoplay; fullscreen; picture-in-picture"
                                        allowFullScreen
                                      />
                                    </div>
                                  )}
                              </div>

                              {/* Theory */}
                              <div className="space-y-1">
                                <label className="text-sm font-semibold text-[#0C212D]">
                                  Theory (Markdown)
                                </label>
                                <textarea
                                  rows={5}
                                  placeholder="Use Markdown: **bold**, _italic_, - lists..."
                                  value={l.teoria || ""}
                                  onChange={(e) =>
                                    updateLeccion(activeUnidad, lIdx, {
                                      teoria: e.target.value,
                                    })
                                  }
                                  className="
                                    w-full p-3 border border-[#112C3E]/20 rounded-xl
                                    focus:ring-2 focus:ring-[#EE7203] outline-none resize-none
                                  "
                                />
                              </div>

                              {/* Vocabulary */}
                              <div className="space-y-1">
                                <label className="text-sm font-semibold text-[#0C212D]">
                                  Vocabulary
                                </label>
                                <VocabularyEditor
                                  value={l.vocabulary}
                                  onChange={(val) =>
                                    updateLeccion(activeUnidad, lIdx, {
                                      vocabulary: val,
                                    })
                                  }
                                />
                              </div>

                              {/* Exercises */}
                              <div className="space-y-1">
                                <label className="text-sm font-semibold text-[#0C212D]">
                                  Exercises
                                </label>
                                <Exercises
                                  initial={l.ejercicios}
                                  onChange={(newExercises) =>
                                    updateLeccion(activeUnidad, lIdx, {
                                      ejercicios: [...newExercises],
                                    })
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-10">
                        No lessons yet.
                      </div>
                    )}

                    {/* Add Lesson */}
                    <button
                      type="button"
                      onClick={() => agregarLeccion(activeUnidad)}
                      className="
                        w-full flex items-center justify-center gap-2 p-3
                        bg-[#F8FAFC] border border-dashed border-[#112C3E]/25 
                        rounded-xl text-[#0C212D] hover:bg-[#EEF1F5]
                      "
                    >
                      <FiPlus size={16} /> Add New Lesson
                    </button>
                  </div>
                )}

                {/* === TAB: CIERRE === */}
                {activeUnitTab === "cierre" && (
                  <div className="space-y-6">
                    
                    <div className="rounded-xl border border-[#112C3E]/20 bg-white p-4">

                      <h3 className="text-[#0C212D] font-semibold mb-3 text-sm">
                        Final unit exam
                      </h3>

                      {/* Intro exam text */}
                      <div className="space-y-1 mb-4">
                        <label className="text-sm font-semibold text-[#0C212D]">
                          Introductory text
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Intro or instructions"
                          value={unidades[activeUnidad]?.closing?.examIntro || ""}
                          onChange={(e) =>
                            updateUnidad(activeUnidad, (prev) => ({
                              ...prev,
                              closing: {
                                ...(prev.closing || {}),
                                examIntro: e.target.value,
                              },
                            }))
                          }
                          className="
                            w-full rounded-xl border border-[#112C3E]/20 p-3
                            focus:ring-2 focus:ring-[#EE7203] outline-none resize-none
                          "
                        />
                      </div>

                      {/* Closing video */}
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-[#0C212D] flex items-center gap-2">
                          <FiVideo className="w-4 h-4" /> Closing Video (optional)
                        </label>

                        <div className="relative">
                          <FiLink2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="url"
                            placeholder="https://vimeo.com/123..."
                            value={unidades[activeUnidad]?.closing?.videoUrl || ""}
                            onChange={(e) =>
                              updateUnidad(activeUnidad, (prev) => ({
                                ...prev,
                                closing: {
                                  ...(prev.closing || {}),
                                  videoUrl: e.target.value,
                                },
                              }))
                            }
                            className="
                              w-full p-3 pl-10 rounded-xl border border-[#112C3E]/20
                              focus:ring-2 focus:ring-[#EE7203] outline-none
                            "
                          />
                        </div>

                        {unidades[activeUnidad]?.closing?.videoUrl &&
                          isValidUrl(unidades[activeUnidad]?.closing?.videoUrl || "") && (
                            <div className="aspect-video mt-2 rounded-xl overflow-hidden border border-[#112C3E]/20 bg-[#F2F4F7]">
                              <iframe
                                src={unidades[activeUnidad]?.closing?.videoUrl}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          )}
                      </div>

                      {/* Exam exercises */}
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-[#0C212D]">
                          Exam exercises
                        </label>
                        <Exercises
                          initial={unidades[activeUnidad]?.closing?.examExercises || []}
                          onChange={(updatedExercises) =>
                            updateUnidad(activeUnidad, (prev) => ({
                              ...prev,
                              closing: {
                                ...(prev.closing || {}),
                                examExercises: [...updatedExercises],
                              },
                            }))
                          }
                        />
                      </div>
                    </div>

                    {/* Closing text */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#0C212D]">
                        Closing text
                      </label>
                      <textarea
                        rows={4}
                        value={unidades[activeUnidad]?.closing?.closingText || ""}
                        onChange={(e) =>
                          updateUnidad(activeUnidad, (prev) => ({
                            ...prev,
                            closing: {
                              ...(prev.closing || {}),
                              closingText: e.target.value,
                            },
                          }))
                        }
                        className="
                          w-full p-3 rounded-xl border border-[#112C3E]/20
                          focus:ring-2 focus:ring-[#EE7203] outline-none resize-none
                        "
                      />
                    </div>

                    {/* PDF URL */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#0C212D] flex items-center gap-2">
                        <FiLink2 className="w-4 h-4" /> PDF summary URL (optional)
                      </label>

                      <input
                        type="url"
                        placeholder="https://drive.google.com/yourfile.pdf"
                        value={unidades[activeUnidad]?.closing?.pdfUrl || ""}
                        onChange={(e) =>
                          updateUnidad(activeUnidad, (prev) => ({
                            ...prev,
                            closing: {
                              ...(prev.closing || {}),
                              pdfUrl: e.target.value,
                            },
                          }))
                        }
                        className="
                          w-full p-3 rounded-xl border border-[#112C3E]/20
                          focus:ring-2 focus:ring-[#EE7203] outline-none
                        "
                      />

                      {unidades[activeUnidad]?.closing?.pdfUrl && (
                        <a
                          target="_blank"
                          rel="noopener noreferrer"
                          href={unidades[activeUnidad]?.closing?.pdfUrl}
                          className="text-[#EE7203] text-sm hover:underline flex items-center gap-2"
                        >
                          <FiFileText size={14} />
                          Preview PDF
                        </a>
                      )}
                    </div>
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
  <section
    className="
      rounded-2xl bg-white border border-[#112C3E]/20
      p-6 space-y-6
    "
  >

    {/* Header */}
    <div className="flex items-center gap-3 mb-4">
      <div
        className="
          w-10 h-10 rounded-lg flex items-center justify-center
          bg-gradient-to-br from-[#EE7203] to-[#FF3816] text-white
        "
      >
        <FiClipboard className="w-5 h-5" />
      </div>

      <h3 className="text-xl font-black text-[#0C212D] tracking-tight">
        Final Exam of the Material
      </h3>
    </div>

    {/* Intro exam text */}
    <div className="space-y-2">
      <label className="text-sm font-semibold text-[#0C212D]">
        Introductory text of the exam
      </label>

      <textarea
        placeholder="Instructions or introduction for the final exam"
        value={examenFinal.introTexto}
        onChange={(e) =>
          setExamenFinal((prev) => ({ ...prev, introTexto: e.target.value }))
        }
        rows={4}
        className="
          w-full rounded-xl p-3 bg-white
          border border-[#112C3E]/20
          focus:ring-2 focus:ring-[#EE7203] outline-none
          resize-none text-[#0C212D]
        "
      />
    </div>

    {/* Exercises */}
    <div className="space-y-2">
      <label className="text-sm font-semibold text-[#0C212D]">
        Exam exercises
      </label>

      <Exercises
        initial={examenFinal.ejercicios}
        onChange={(newExercises) =>
          setExamenFinal((prev) => ({ ...prev, ejercicios: newExercises }))
        }
      />
    </div>

  </section>
)}


{/* TAB: Capstone */}
{activeMainTab === "capstone" && (
  <section
    className="
      rounded-2xl bg-white border border-[#112C3E]/20
      p-6 space-y-6
    "
  >

    {/* Header */}
    <div className="flex items-center gap-3 mb-4">
      <div
        className="
          w-10 h-10 rounded-lg flex items-center justify-center
          bg-gradient-to-br from-[#FF3816] to-[#EE7203] text-white
        "
      >
        <FiLayers className="w-5 h-5" />
      </div>

      <h3 className="text-xl font-black text-[#0C212D] tracking-tight">
        Final Project (Capstone)
      </h3>
    </div>

    {/* Video URL */}
    <div className="space-y-2">
      <label
        className="flex items-center gap-2 text-sm font-semibold text-[#0C212D]"
      >
        <FiVideo className="text-[#EE7203]" /> Project video URL (optional)
      </label>

      <div className="relative">
        <FiLink2
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#112C3E]/40"
        />

        <input
          type="url"
          placeholder="https://youtube.com/watch?v=..."
          value={capstone.videoUrl}
          onChange={(e) =>
            setCapstone((p) => ({ ...p, videoUrl: e.target.value }))
          }
          className="
            w-full rounded-xl border border-[#112C3E]/20 bg-white
            p-3 pl-10 text-[#0C212D]
            focus:ring-2 focus:ring-[#EE7203] outline-none
          "
        />
      </div>

      {/* Preview */}
      {capstone.videoUrl && isValidUrl(capstone.videoUrl) && (
        <div
          className="
            aspect-video rounded-xl overflow-hidden border border-[#112C3E]/20
            bg-[#0C212D]/5
          "
        >
          <iframe
            src={capstone.videoUrl}
            title="Video of the final project"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
    </div>

    {/* Instructions */}
    <div className="space-y-2">
      <label className="text-sm font-semibold text-[#0C212D]">
        Project instructions
      </label>

      <textarea
        placeholder="Describe the objectives and steps of the final project."
        value={capstone.instrucciones}
        onChange={(e) =>
          setCapstone((p) => ({ ...p, instrucciones: e.target.value }))
        }
        rows={5}
        className="
          w-full rounded-xl border border-[#112C3E]/20 bg-white
          p-3 text-[#0C212D]
          focus:ring-2 focus:ring-[#EE7203] outline-none
          resize-none
        "
      />
    </div>

    {/* Checklist */}
    <div className="space-y-2">
      <label className="text-sm font-semibold text-[#0C212D]">
        Project checklist
      </label>

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
            className="
              flex-1 rounded-xl border border-[#112C3E]/20 bg-white
              p-3 text-[#0C212D]
              focus:ring-2 focus:ring-[#EE7203] outline-none
            "
            placeholder={`Element ${idx + 1}`}
          />

          <button
            type="button"
            onClick={() =>
              setCapstone((p) => ({
                ...p,
                checklist: p.checklist.filter((_, i) => i !== idx),
              }))
            }
            className="
              text-[#FF3816]/80 hover:text-[#FF3816]
              p-2 rounded-lg hover:bg-[#FF3816]/10 transition-colors
            "
            aria-label="Delete item"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          setCapstone((p) => ({ ...p, checklist: [...p.checklist, ""] }))
        }
        className="
          w-full flex items-center justify-center gap-2 p-3 rounded-xl
          bg-[#EE7203]/10 text-[#EE7203] border border-dashed border-[#EE7203]/40
          hover:bg-[#EE7203]/20 transition-colors text-sm font-semibold
        "
      >
        <FiPlus /> Add item to checklist
      </button>
    </div>

  </section>
)}

{/* TAB: Cierre del curso */}
{activeMainTab === "cierrecurso" && (
  <section
    className="
      rounded-2xl bg-white border border-[#112C3E]/20
      p-6 space-y-6
    "
  >
    {/* Header */}
    <div className="flex items-center gap-3 mb-4">
      <div
        className="
          w-10 h-10 rounded-lg flex items-center justify-center
          bg-gradient-to-br from-[#0C212D] to-[#112C3E] text-white
        "
      >
        <FiFlag className="w-5 h-5" />
      </div>

      <h3 className="text-xl font-black text-[#0C212D] tracking-tight">
        Closing of the Material
      </h3>
    </div>

    {/* Final message */}
    <div className="space-y-2">
      <label className="text-sm font-semibold text-[#0C212D]">
        Final message of the Material
      </label>

      <textarea
        placeholder="Message displayed upon completion of the material (thank you, conclusion, congratulations, etc.)"
        value={curso.textoFinalCurso}
        onChange={handleChange}
        name="textoFinalCurso"
        rows={5}
        className="
          w-full rounded-xl border border-[#112C3E]/20 bg-white
          p-3 text-[#0C212D]
          focus:ring-2 focus:ring-[#EE7203] outline-none resize-none
        "
      />
    </div>

    {/* Final video */}
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-[#0C212D]">
        <FiVideo className="text-[#EE7203]" /> Final video (optional)
      </label>

      <div className="relative">
        <FiLink2
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#112C3E]/40"
        />

        <input
          type="url"
          placeholder="https://youtube.com/watch?v=..."
          value={curso.textoFinalCursoVideoUrl}
          onChange={handleChange}
          name="textoFinalCursoVideoUrl"
          className="
            w-full rounded-xl border border-[#112C3E]/20 bg-white pl-10 p-3
            text-[#0C212D] focus:ring-2 focus:ring-[#EE7203] outline-none
          "
        />
      </div>

      {/* Preview */}
      {curso.textoFinalCursoVideoUrl &&
        isValidUrl(curso.textoFinalCursoVideoUrl) && (
          <div
            className="
              aspect-video overflow-hidden rounded-xl
              border border-[#112C3E]/20 bg-[#0C212D]/5
            "
          >
            <iframe
              src={curso.textoFinalCursoVideoUrl}
              title="Material closing video"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media;
                     gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
    </div>
  </section>
)}


{/* TAB: Cursantes */}
{/* TAB: Cursantes */}
{activeMainTab === "cursantes" && (
  <section
    className="
      rounded-2xl bg-white border border-[#112C3E]/20
      p-6 space-y-6
    "
  >
    {/* Header */}
    <div className="flex items-center gap-3 mb-4">
      <div
        className="
          w-10 h-10 rounded-lg flex items-center justify-center
          bg-gradient-to-br from-[#0C212D] to-[#112C3E]
          text-white
        "
      >
        <FiUsers className="w-5 h-5" />
      </div>

      <h3 className="text-xl font-black text-[#0C212D] tracking-tight">
        Material student management
      </h3>
    </div>

    {/* GRID PRINCIPAL */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

      {/* === COLUMNA IZQUIERDA: FILTROS + LISTA === */}
      <div className="space-y-6">

        {/* 🆕 BÚSQUEDA POR NOMBRE */}
        <div className="space-y-1">
          <label className="text-sm font-semibold text-[#0C212D] flex items-center gap-2">
            <FiSearch className="w-4 h-4" />
            Search by Name
          </label>

          <input
            type="text"
            placeholder="Type student name..."
            value={filterNombre}
            onChange={(e) => setFilterNombre(e.target.value)}
            className="
              w-full rounded-xl border border-[#112C3E]/20 bg-white
              p-3 text-[#0C212D]
              focus:ring-2 focus:ring-[#EE7203] outline-none
            "
          />
        </div>

        {/* 🆕 FILTRO POR ID DE CURSO */}
        <div className="space-y-1">
          <label className="text-sm font-semibold text-[#0C212D] flex items-center gap-2">
            <FiTag className="w-4 h-4" />
            Filter by Course ID
          </label>

          <input
            type="text"
            placeholder="Ex: ADM006"
            value={filterCursoId}
            onChange={(e) => setFilterCursoId(e.target.value)}
            className="
              w-full rounded-xl border border-[#112C3E]/20 bg-white
              p-3 text-[#0C212D] font-mono
              focus:ring-2 focus:ring-[#EE7203] outline-none
            "
          />
        </div>

        {/* FILTRO POR IDIOMA */}
        <div className="space-y-1">
          <label className="text-sm font-semibold text-[#0C212D]">
            Filter by Language
          </label>

          <select
            value={filterIdioma}
            onChange={(e) => setFilterIdioma(e.target.value)}
            className="
              w-full rounded-xl border border-[#112C3E]/20 bg-white
              p-3 text-[#0C212D]
              focus:ring-2 focus:ring-[#EE7203]
            "
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
          <label className="text-sm font-semibold text-[#0C212D]">
            Filter by Level
          </label>

          <select
            value={filterNivel}
            onChange={(e) => setFilterNivel(e.target.value)}
            className="
              w-full rounded-xl border border-[#112C3E]/20 bg-white
              p-3 text-[#0C212D]
              focus:ring-2 focus:ring-[#EE7203]
            "
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
            className="
              w-full flex items-center justify-center gap-2 p-2.5
              rounded-lg border border-[#112C3E]/20
              bg-gray-50 text-[#0C212D] text-sm font-medium
              hover:bg-gray-100 transition
            "
          >
            <FiX size={16} /> Clear filters
          </button>
        )}

        {/* LISTA DE ALUMNOS FILTRADOS */}
        <div
          className="
            max-h-80 overflow-y-auto rounded-xl border border-[#112C3E]/20
            bg-[#0C212D]/[0.02] p-3
          "
        >
          {filteredAlumnos.length === 0 ? (
            <p className="text-center text-[#0C212D]/50 py-6 text-sm">
              No students match the selected filters.
            </p>
          ) : (
            <>
              {/* 🆕 Mostrar contador de resultados */}
              <div className="mb-2 px-2 text-xs text-[#0C212D]/60">
                Showing {filteredAlumnos.length} student{filteredAlumnos.length !== 1 ? 's' : ''}
              </div>

              {filteredAlumnos.map((a) => (
                <div
                  key={a.email}
                  onClick={() => toggleCursante(a.email)}
                  className="
                    flex items-center justify-between p-2 rounded-lg
                    hover:bg-[#EE7203]/10 cursor-pointer transition
                  "
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-[#0C212D]">
                      {a.displayName || a.nombre || a.email}
                    </span>
                    {/* 🆕 Mostrar cursos asignados si se está filtrando por ID */}
                    {filterCursoId && a.cursosAsignados && (
                      <span className="text-xs text-[#0C212D]/50 font-mono">
                        {a.cursosAsignados
                          .filter((c: any) => c.curso)
                          .map((c: any) => c.curso)
                          .join(", ")}
                      </span>
                    )}
                  </div>

                  <input
                    type="checkbox"
                    checked={curso.cursantes.includes(a.email)}
                    readOnly
                    className="h-4 w-4 accent-[#EE7203]"
                  />
                </div>
              ))}
            </>
          )}
        </div>

        {/* BOTÓN: ADD ALL */}
        <button
          type="button"
          onClick={() =>
            addAllFiltered(filteredAlumnos.map((a) => a.email))
          }
          className="
            w-full flex items-center justify-center gap-2 p-3
            rounded-xl border border-dashed border-[#EE7203]/40
            bg-[#EE7203]/10 text-[#EE7203] font-semibold
            hover:bg-[#EE7203]/20 transition
          "
        >
          <FiPlus /> Add all filtered students ({filteredAlumnos.length})
        </button>
      </div>


      {/* === COLUMNA DERECHA: ALUMNOS SELECCIONADOS === */}
      <div className="space-y-6">
        <h4
          className="
            flex items-center gap-2 text-lg font-bold text-[#0C212D]
          "
        >
          <FiCheck className="text-[#EE7203]" />
          Selected students ({curso.cursantes.length})
        </h4>

        <div
          className="
            max-h-80 overflow-y-auto rounded-xl border border-[#112C3E]/20
            bg-[#0C212D]/[0.02] p-3
          "
        >
          {curso.cursantes.length === 0 ? (
            <p className="text-center text-[#0C212D]/50 py-6 text-sm">
              There are no selected students.
            </p>
          ) : (
            curso.cursantes.map((email) => (
              <div
                key={email}
                onClick={() => toggleCursante(email)}
                className="
                  flex items-center justify-between p-2 rounded-lg
                  hover:bg-red-50 cursor-pointer transition
                "
              >
                <span className="text-sm text-[#0C212D]">{email}</span>

                <button
                  type="button"
                  className="
                    text-[#0C212D]/40 hover:text-red-500
                    p-1 rounded-full hover:bg-red-50 transition
                  "
                  aria-label="Delete student"
                >
                  <FiTrash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* BOTÓN: REMOVE ALL */}
        <button
          type="button"
          onClick={removeAllSelected}
          className="
            w-full flex items-center justify-center gap-2 p-3
            rounded-xl border border-dashed border-red-300
            bg-red-50 text-red-600 font-semibold hover:bg-red-100
            transition
          "
        >
          <FiTrash2 /> Delete all selected
        </button>
      </div>
    </div>
  </section>
)}



<div
  className="
    sticky bottom-0 z-20
    flex justify-end 
    bg-white/90 backdrop-blur-md
    border-t border-[#112C3E]/20
    p-4
  "
>
  <button
    type="submit"
    disabled={uploading}
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
    {uploading ? "Saving..." : "Create Material"}
  </button>
</div>



</form>

        </div>
      </div>
    </div>
  </div>
);


}

export default CrearCurso;
