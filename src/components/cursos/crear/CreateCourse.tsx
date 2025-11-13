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
import Exercises from "../cursoItem/exercises/Exercises";
// import Exercises from "../cursoItem/exercises/Exercises"; // Assuming this path is correct
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




/* ----------------- Interfaces for Data Structures ----------------- */



interface Ejercicio {
  // Define structure of an exercise
  id: string;
  pregunta: string;
  opciones: { texto: string; correcto: boolean }[];
  tipo: "multiple_choice" | "true_false" | "text_input";
  // Add other fields as needed
}

interface Leccion {
  id: string;
  titulo: string;
  descripcion?: string;  // ✅ nuevo campo breve
  teoria?: string;       // ✅ texto markdown (en vez de textarea “texto”)
  urlVideo: string;
  urlImagen: string;
  pdfUrl: string;
  ejercicios: Ejercicio[];
  finalMessage: string;
}

interface Unidad {
  id: string;
  titulo: string;
  descripcion: string;
  urlVideo: string; // Forced empty on save
  duracion?: number; // Optional duration in minutes
  urlImagen: string;
  ejercicios: Ejercicio[]; // Legacy, kept for backward compat
  textoCierre: string;
  lecciones: Leccion[];

  // 🆕 Nueva estructura para manejar el cierre de unidad
  closing?: {
    examIntro?: string;           // Texto introductorio para examen de cierre
    examExercises?: Ejercicio[];  // Ejercicios del examen
    closingText?: string;         // Texto final de la unidad
    pdfUrl?: string;              // ✅ URL del resumen PDF
  };
}


interface ExamenFinal {
  introTexto: string;
  ejercicios: Ejercicio[];
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
  categoria: string;
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

  profesorNombre?: string;

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


// 🔹 Helper para crear profesor
const crearProfesorEnFirestore = async (firestore: Firestore, batchId: string, data: any) => {

  const dbToUse = firestore || db;
  // Ruta válida con 3 segmentos (colección / documento / subcolección)
const profCol = collection(dbToUse, "profesores_batches", `batch_${batchId}`, "profesores");

  const profRef = doc(profCol); // genera profesor_X

  await setDoc(profRef, {
    ...data,
    createdAt: serverTimestamp(),
  });

  return { id: profRef.id, ref: profRef };
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
    categoria: "",
    publico: true,
    videoPresentacion: "",
    urlImagen: "",
    cursantes: [], // selected emails
    textoFinalCurso: "",
    textoFinalCursoVideoUrl: "", // NEW: optional closing video
  });

  // --- Profesor asignado ---
const [asignarProfesor, setAsignarProfesor] = useState<"ninguno" | "existente" | "nuevo">("ninguno");

// Lista de profesores existentes (si los querés cargar)
const [profesores, setProfesores] = useState<any[]>([]);

// Datos de profesor nuevo
const [nuevoProfesor, setNuevoProfesor] = useState({
  nombre: "",
  apellido: "",
  email: "",
  idioma: "",
  nivel: "",
});

// Profesor existente seleccionado
const [profesorSeleccionado, setProfesorSeleccionado] = useState<string>("");

// Batch actual (ajustá según tu lógica real)
const batchId = "batch_1"; // o tomalo desde contexto si lo tenés

  /* =========================
     Units / Lessons
     ========================= */
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [activeUnidad, setActiveUnidad] = useState<number>(0);
  const [activeUnitTab, setActiveUnitTab] = useState<"datos" | "lecciones" | "cierre">("datos"); // 'datos' | 'lecciones' | 'cierre'
  const [activeLeccion, setActiveLeccion] = useState<number>(0);

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
  const [searchAlumno, setSearchAlumno] = useState<string>("");

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
      texto: "",
      urlVideo: "",
      urlImagen: "",
      pdfUrl: "",
      ejercicios: [],
      finalMessage: "", // NEW: message after finishing exercises
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

  const filteredAlumnos: Alumno[] = useMemo(() => {
    const q = (searchAlumno || "").toLowerCase().trim();
    const list = Array.isArray(alumnos) ? alumnos : [];
    if (!q) return list;
    return list.filter((a) => {
      const name = (a?.displayName || a?.nombre || "").toLowerCase();
      const mail = (a?.email || "").toLowerCase();
      return name.includes(q) || mail.includes(q);
    });
  }, [alumnos, searchAlumno]);

  useEffect(() => {
  const fetchProfesores = async () => {
    try {
      const docRef = doc(db, "profesores", "batch_1");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() || {};
        const list = Object.values(data);
        setProfesores(Array.isArray(list) ? list : []);
      } else {
        console.warn("⚠️ No hay profesores en batch_1");
        setProfesores([]);
      }
    } catch (err) {
      console.error("❌ Error cargando profesores:", err);
      setProfesores([]);
    }
  };
  fetchProfesores();
}, []);

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
  urlVideo: "",
  urlImagen: u.urlImagen || "",
  duracion: u.duracion ? Number(u.duracion) : undefined,
  ejercicios: [],
  textoCierre: u.textoCierre || "",
  lecciones: (u.lecciones || []).map((l) => ({
  id: l.id || makeId(),
  titulo: l.titulo || "",
  descripcion: l.descripcion || "",
  teoria: l.teoria || "",
  urlVideo: l.urlVideo || "",
  urlImagen: l.urlImagen || "",
  pdfUrl: l.pdfUrl || "",
  ejercicios: Array.isArray(l.ejercicios) ? l.ejercicios : [],
  finalMessage: l.finalMessage || "",
})),

  closing: {
    examIntro: u.closing?.examIntro || "",
    examExercises: Array.isArray(u.closing?.examExercises)
      ? u.closing.examExercises
      : [],
    closingText: u.closing?.closingText || "",
  },
}));



  try {
    console.log("🚀 [DEBUG] Iniciando bloque principal de creación...");

  // =====================================================
// 1️⃣ Crear o asignar profesor solo si aplica
// =====================================================
let profesorNombreFinal: string | null = null;

// EXISTENTE
if (asignarProfesor === "existente" && profesorSeleccionado) {
  const p = profesores.find((x) => x.id === profesorSeleccionado);
  if (p) profesorNombreFinal = `${p.nombre} ${p.apellido}`.trim();
}

// NUEVO
if (asignarProfesor === "nuevo" && nuevoProfesor.nombre.trim()) {
  profesorNombreFinal = `${nuevoProfesor.nombre} ${nuevoProfesor.apellido}`.trim();
}




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
  profesorNombre: profesorNombreFinal ?? null,
  
};



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
    // 4️⃣ Relación inversa en profesor (si aplica)
    // =====================================================
    // 4️⃣ Relación inversa en profesor (opcional)
if (asignarProfesor === "nuevo" && profesorData?.email) {
  const profBatchRef = doc(dbToUse, "profesores", "batch_1");
  await updateDoc(profBatchRef, {
    [`${profesorData.id}.cursoAsignadoId`]: refCurso.id,
    [`${profesorData.id}.updatedAt`]: serverTimestamp(),
  });
  console.log("🔁 Profesor actualizado con curso asignado.");
}


    // =====================================================
    // 5️⃣ Actualizar estado local y cerrar modal
    // =====================================================
    await reloadData?.();
    toast.success("✅ Course created successfully");
    onClose?.();

    console.log("🎉 [DEBUG] Curso creado correctamente:", refCurso.path);
  } catch (err: any) {
    console.error("❌ [ERROR] Error creando curso o profesor:", err);
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
  <div className="items-center justify-center flex ">
    
    <div className="relative flex w-full max-w-6xl max-h-[95vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200">
      
      {/* HEADER */}
      <header className="relative border-b border-gray-200 bg-white px-6 py-5">
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition"
        >
          <FiX size={18} />
        </button>

        {/* Título + subtítulo */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <FiBookOpen className="text-blue-600" />
            Create Material Academy
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Define the structure, content, and configuration of your course.
          </p>
        </div>

        {/* NAV TABS */}
        <nav className="mt-5 flex flex-wrap gap-2">
          {MAIN_TABS.map((t) => {
            const active = activeMainTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveMainTab(t.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-150
                  ${
                    active
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-blue-50"
                  }`}
              >
                <span className="flex items-center gap-1">
                  {t.icon}
                  {t.label}
                </span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="text-center text-gray-400 text-sm py-16">
          <form onSubmit={handleSubmit} className="space-y-10">

          {/* TAB GENERAL */}
          {activeMainTab === "general" && (
    <div className="space-y-10">

      {/* 📘 Course Information */}
      <section className="rounded-xl bg-white border border-gray-200 shadow-sm p-6">
        <header className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-50 text-blue-600 rounded-lg">
            <FiBookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Course information
          </h3>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- Lado izquierdo: datos principales --- */}
          <div className="lg:col-span-2 space-y-6">
            {/* Título */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Course title
              </label>
              <input
                type="text"
                name="titulo"
                value={curso.titulo}
                onChange={handleChange}
                placeholder="Ex: Introduction to React"
                className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>

            {/* Descripción */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="descripcion"
                value={curso.descripcion}
                onChange={handleChange}
                placeholder="Briefly describe what students will learn..."
                rows={4}
                className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                required
              />
            </div>

            {/* Nivel + Categoría */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nivel */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
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

              {/* Language */}
<div className="space-y-1">
  <label className="text-sm font-medium text-gray-700">
    Language
  </label>
  <div className="relative">
    <FiGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
    <select
  name="categoria"
  value={curso.categoria}
  onChange={handleChange}
  required
  className="w-full rounded-lg border border-gray-300 bg-white p-3 pl-10 text-gray-800
             focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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

            {/* Profesor a cargo */}
<div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
    <FiUsers className="w-4 h-4 text-blue-600" />
    Professor in charge
  </label>

  {/* Modo de asignación */}
  <div className="flex flex-wrap gap-6 mb-4">
    <label className="flex items-center gap-2 text-gray-700">
      <input
        type="radio"
        checked={asignarProfesor === "ninguno"}
        onChange={() => setAsignarProfesor("ninguno")}
        className="h-4 w-4 accent-blue-600"
      />
      <span className="text-sm">None</span>
    </label>

    <label className="flex items-center gap-2 text-gray-700">
      <input
        type="radio"
        checked={asignarProfesor === "existente"}
        onChange={() => setAsignarProfesor("existente")}
        className="h-4 w-4 accent-blue-600"
      />
      <span className="text-sm">Existing</span>
    </label>

    <label className="flex items-center gap-2 text-gray-700">
      <input
        type="radio"
        checked={asignarProfesor === "nuevo"}
        onChange={() => setAsignarProfesor("nuevo")}
        className="h-4 w-4 accent-blue-600"
      />
      <span className="text-sm">New</span>
    </label>
  </div>

  {/* EXISTENTE */}
  {asignarProfesor === "existente" && (
    <select
      value={profesorSeleccionado}
      onChange={(e) => setProfesorSeleccionado(e.target.value)}
      className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">Select existing professor</option>
      {profesores.map((p) => (
        <option key={p.id} value={p.id}>
          {p.nombre} {p.apellido}
        </option>
      ))}
    </select>
  )}

  {/* NUEVO — solo nombre y apellido */}
  {asignarProfesor === "nuevo" && (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
      <input
        type="text"
        placeholder="Name"
        value={nuevoProfesor.nombre}
        onChange={(e) =>
          setNuevoProfesor({ ...nuevoProfesor, nombre: e.target.value })
        }
        className="rounded-lg border border-gray-300 bg-white p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <input
        type="text"
        placeholder="Last name"
        value={nuevoProfesor.apellido}
        onChange={(e) =>
          setNuevoProfesor({ ...nuevoProfesor, apellido: e.target.value })
        }
        className="rounded-lg border border-gray-300 bg-white p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )}
</div>



            {/* Público */}
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <input
                type="checkbox"
                name="publico"
                checked={!!curso.publico}
                onChange={handleChange}
                className="h-5 w-5 accent-blue-600"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700">
                  Public Course
                </span>
                <span className="text-xs text-gray-500">
                  Users will be able to view and access the course.
                </span>
              </div>
            </div>
          </div>

          {/* --- Lado derecho: Media --- */}
          <div className="space-y-6">
            {/* Video */}
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FiVideo className="text-blue-600" /> Presentation video (optional)
              </label>
              <div className="relative">
                <FiLink2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="url"
                  name="videoPresentacion"
                  value={curso.videoPresentacion}
                  onChange={handleChange}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 pl-10 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {curso.videoPresentacion && isValidUrl(curso.videoPresentacion) && (
                <div className="aspect-video rounded-lg overflow-hidden border border-gray-200">
                  <iframe
                    src={curso.videoPresentacion}
                    title="Intro video"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>

            {/* Imagen */}
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FiImage className="text-blue-600" /> Course Image
              </label>

              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 p-3 text-gray-600 text-sm transition">
                <FiUpload className="text-gray-500" />
                {uploading ? "Uploading..." : "Upload image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onUploadMiniaturaCurso(e.target.files?.[0])}
                  disabled={uploading}
                />
              </label>

              <div className="relative">
                <FiLink2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="url"
                  placeholder="Or paste an image URL https://"
                  value={curso.urlImagen}
                  onChange={(e) =>
                    setCurso((p) => ({ ...p, urlImagen: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 pl-10 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {curso.urlImagen && isValidUrl(curso.urlImagen) && (
                <img
                  src={curso.urlImagen}
                  alt="Course thumbnail"
                  className="w-full rounded-lg border border-gray-200 object-cover max-h-48"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      
    </div>
          )}

 {/* TAB: Unidades */}
{activeMainTab === "unidades" && (
  <div className="space-y-8">
    <section className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-2xl p-6 border border-indigo-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
          <FiLayers className="w-5 h-5 text-indigo-600" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900">
          Course Content: Units & Lessons
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
                      Lessons ({unidades[activeUnidad]?.lecciones?.length || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveUnitTab("cierre")}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        activeUnitTab === "cierre"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      Closing
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
                        className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                  </div>
                )}

                {/* === TAB: Lecciones === */}
       {/* === TAB: Lecciones === */}
{activeUnitTab === "lecciones" && (
  <div className="space-y-6">
    {/* Lista de lecciones de la unidad */}
    {unidades[activeUnidad]?.lecciones?.length > 0 ? (
      unidades[activeUnidad].lecciones.map((l, lIdx) => (
        <div
          key={l.id}
          className={`p-4 rounded-xl border transition-all ${
            activeLeccion === lIdx
              ? "border-blue-500 bg-blue-50"
              : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          {/* Header con el título de la lección */}
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-slate-800">
              Lesson {lIdx + 1}: {l.titulo || "Untitled"}
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
                onClick={() => borrarLeccion(activeUnidad, lIdx)}
                className="p-2 rounded-lg text-red-500 hover:bg-red-50"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          </div>

          {/* Si está activa, mostramos el formulario de edición */}
          {activeLeccion === lIdx && (
            <div className="mt-3 space-y-4 border-t border-gray-200 pt-3">
              {/* Título */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Lesson Title
                </label>
                <input
                  type="text"
                  value={l.titulo}
                  onChange={(e) =>
                    updateLeccion(activeUnidad, lIdx, {
                      titulo: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Descripción breve */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Description (short)
                </label>
                <textarea
                  placeholder="Short description of this lesson..."
                  value={l.descripcion || ""}
                  onChange={(e) =>
                    updateLeccion(activeUnidad, lIdx, {
                      descripcion: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 bg-white p-2 text-gray-800 focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Contenido teórico (Markdown) */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Theory (Markdown)
                </label>
                <textarea
                  placeholder="Use Markdown: **bold**, _italic_, - lists, [link](https://...)"
                  value={l.teoria || ""}
                  onChange={(e) =>
                    updateLeccion(activeUnidad, lIdx, {
                      teoria: e.target.value,
                    })
                  }
                  rows={5}
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supports <code>**bold**</code>, <code>_italic_</code>, lists (-) and links.
                </p>
              </div>

              {/* Ejercicios */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Exercises
                </label>
                <Exercises
                  initial={l.ejercicios}
                  onChange={(newExercises: Ejercicio[]) =>
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
      <div className="text-center text-slate-500 py-10">
        No lessons yet.
      </div>
    )}

    {/* Botón para agregar lección */}
    <button
      type="button"
      onClick={() => agregarLeccion(activeUnidad)}
      className="w-full flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-600 rounded-xl border border-dashed border-blue-200 hover:bg-blue-100 transition-colors"
    >
      <FiPlus size={16} /> Add New Lesson
    </button>
  </div>
)}



                {/* === TAB: Cierre === */}
                {activeUnitTab === "cierre" && (
                  <div className="space-y-6">
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                      <h3 className="text-gray-800 font-semibold mb-3 text-sm">
                        Final unit exam
                      </h3>
                      <div className="space-y-1 mb-4">
                        <label className="text-sm font-medium text-gray-700">
                          Introductory text
                        </label>
                        <textarea
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
                          rows={3}
                          className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-800 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">
                          Exam exercises
                        </label>
                        <Exercises
  initial={unidades[activeUnidad]?.closing?.examExercises || []}
  onChange={(updatedExercises) => {
    console.log("🧩 [DEBUG] setExercises CIERRE ejecutado", {
      unidad: activeUnidad,
      updatedExercises,
    });
    updateUnidad(activeUnidad, (prevUnidad) => ({
      ...prevUnidad,
      closing: {
        ...(prevUnidad.closing || {}),
        examExercises: [...updatedExercises],
      },
    }));
  }}
/>

                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">
                        Closing text
                      </label>
                      <textarea
                        placeholder="Displayed after finishing the unit"
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
                        rows={4}
                        className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-800 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
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
                        className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {unidades[activeUnidad]?.closing?.pdfUrl && (
                        <a
                          href={unidades[activeUnidad]?.closing?.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <FiFileText size={14} /> Preview PDF
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
  <section className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 space-y-6">
    {/* Header */}
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 bg-purple-50 text-purple-600 flex items-center justify-center rounded-lg">
        <FiClipboard className="w-5 h-5" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">
        Final exam of the course
      </h3>
    </div>

    {/* Intro examen */}
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Introductory text of the exam
      </label>
      <textarea
        placeholder="Instrucciones o introducción para el examen final del curso"
        value={examenFinal.introTexto}
        onChange={(e) =>
          setExamenFinal((prev) => ({ ...prev, introTexto: e.target.value }))
        }
        rows={4}
        className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
      />
    </div>

    {/* Ejercicios */}
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Exam exercises
      </label>
      <Exercises
        exercises={examenFinal.ejercicios}
        setExercises={(newExercises: Ejercicio[]) =>
          setExamenFinal((p) => ({ ...p, ejercicios: newExercises }))
        }
      />
    </div>
  </section>
)}

{/* TAB: Capstone */}
{activeMainTab === "capstone" && (
  <section className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 space-y-6">
    {/* Header */}
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 bg-pink-50 text-pink-600 flex items-center justify-center rounded-lg">
        <FiLayers className="w-5 h-5" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">
        Final Project (Capstone)
      </h3>
    </div>

    {/* Video */}
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <FiVideo className="text-pink-500" /> Project video URL (optional)
      </label>
      <div className="relative">
        <FiLink2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="url"
          placeholder="https://youtube.com/watch?v=..."
          value={capstone.videoUrl}
          onChange={(e) =>
            setCapstone((p) => ({ ...p, videoUrl: e.target.value }))
          }
          className="w-full rounded-lg border border-gray-300 bg-white p-3 pl-10 text-gray-800 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
        />
      </div>
      {capstone.videoUrl && isValidUrl(capstone.videoUrl) && (
        <div className="aspect-video rounded-lg overflow-hidden border border-gray-200">
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

    {/* Instrucciones */}
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Project instructions
      </label>
      <textarea
        placeholder="Describe the objectives and steps of the final project."
        value={capstone.instrucciones}
        onChange={(e) =>
          setCapstone((p) => ({ ...p, instrucciones: e.target.value }))
        }
        rows={5}
        className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-800 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none"
      />
    </div>

    {/* Checklist */}
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
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
            className="flex-1 rounded-lg border border-gray-300 bg-white p-3 text-gray-800 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
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
            className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition"
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
        className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-pink-300 bg-pink-50 text-pink-600 hover:bg-pink-100 transition text-sm font-medium"
      >
        <FiPlus /> Add item to checklist
      </button>
    </div>
  </section>
)}

{/* TAB: Cierre del curso */}
{activeMainTab === "cierrecurso" && (
  <section className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 space-y-6">
    {/* Header */}
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 bg-green-50 text-green-600 flex items-center justify-center rounded-lg">
        <FiFlag className="w-5 h-5" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">
        Closing of the course
      </h3>
    </div>

    {/* Mensaje final */}
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Final message of the course
      </label>
      <textarea
        placeholder="Message displayed upon completion of the course (thank you, conclusion, congratulations, etc.)"
        value={curso.textoFinalCurso}
        onChange={handleChange}
        name="textoFinalCurso"
        rows={5}
        className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-800 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
      />
    </div>

    {/* Video final */}
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <FiVideo className="text-green-500" /> Final video (optional)
      </label>
      <div className="relative">
        <FiLink2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="url"
          placeholder="https://youtube.com/watch?v=..."
          value={curso.textoFinalCursoVideoUrl}
          onChange={handleChange}
          name="textoFinalCursoVideoUrl"
          className="w-full rounded-lg border border-gray-300 bg-white p-3 pl-10 text-gray-800 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
        />
      </div>

      {curso.textoFinalCursoVideoUrl &&
        isValidUrl(curso.textoFinalCursoVideoUrl) && (
          <div className="aspect-video overflow-hidden rounded-lg border border-gray-200">
            <iframe
              src={curso.textoFinalCursoVideoUrl}
              title="Course closing video"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
    </div>
  </section>
)}

{/* TAB: Cursantes */}
{activeMainTab === "cursantes" && (
  <section className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 space-y-6">
    {/* Header */}
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 bg-blue-50 text-blue-600 flex items-center justify-center rounded-lg">
        <FiUsers className="w-5 h-5" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">
        Course student management
      </h3>
    </div>

    {/* Contenido */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* === COLUMNA IZQUIERDA: Alumnos disponibles === */}
      <div className="space-y-4">
        {/* Búsqueda */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search for student by name or email"
            value={searchAlumno}
            onChange={(e) => setSearchAlumno(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white p-3 pl-10 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Lista de alumnos */}
        <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
          {filteredAlumnos.length === 0 ? (
            <p className="text-center text-gray-500 py-6 text-sm">
              No available students were found.
            </p>
          ) : (
            filteredAlumnos.map((a) => (
              <div
                key={a.email}
                onClick={() => toggleCursante(a.email)}
                className="flex items-center justify-between p-2 rounded-md hover:bg-blue-50 cursor-pointer transition"
              >
                <span className="text-sm font-medium text-gray-700">
                  {a.displayName || a.nombre || a.email}
                </span>
                <input
                  type="checkbox"
                  checked={curso.cursantes.includes(a.email)}
                  readOnly
                  className="h-4 w-4 accent-blue-600"
                />
              </div>
            ))
          )}
        </div>

        {/* Botón agregar todos */}
        <button
          type="button"
          onClick={() => addAllFiltered(filteredAlumnos.map((a) => a.email))}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100 p-3 text-sm font-medium transition"
        >
          <FiPlus /> Add all filters
        </button>
      </div>

      {/* === COLUMNA DERECHA: Alumnos seleccionados === */}
      <div className="space-y-4">
        <h4 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
          <FiCheck className="text-blue-600" /> Selected students (
          {curso.cursantes.length})
        </h4>

        <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
          {curso.cursantes.length === 0 ? (
            <p className="text-center text-gray-500 py-6 text-sm">
              There are no selected students.
            </p>
          ) : (
            curso.cursantes.map((email) => (
              <div
                key={email}
                onClick={() => toggleCursante(email)}
                className="flex items-center justify-between p-2 rounded-md hover:bg-red-50 cursor-pointer transition"
              >
                <span className="text-sm text-gray-700">{email}</span>
                <button
                  type="button"
                  className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition"
                  aria-label="Delete student"
                >
                  <FiTrash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Botón eliminar todos */}
        <button
          type="button"
          onClick={removeAllSelected}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-red-300 bg-red-50 text-red-600 hover:bg-red-100 p-3 text-sm font-medium transition"
        >
          <FiTrash2 /> Delete all selected
        </button>
      </div>
    </div>
  </section>
)}

{/* SAVE BUTTON */}
<div className="sticky bottom-0 z-10 flex justify-end bg-gray-50 border-t border-gray-200 p-4">
  <button
    type="submit"
    disabled={uploading}
    className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold shadow-sm transition
      ${
        uploading
          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
          : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      }`}
  >
    <FiSave size={18} />
    {uploading ? "Saving..." : "Create course"}
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