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
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Exercises from "../cursoItem/exercises/Exercises";
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

/* ----------------- Interfaces ----------------- */


interface Ejercicio {
  id: string;
  pregunta: string;
  opciones: { texto: string; correcto: boolean }[];
  tipo: "multiple_choice" | "true_false" | "text_input";
}

interface Leccion {
  id: string;
  titulo: string;
  descripcion?: string;  // ✅ nuevo campo corto
  teoria?: string;       // ✅ markdown
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
  urlVideo: string;
  duracion?: number;
  urlImagen: string;
  ejercicios: Ejercicio[];
  textoCierre: string;
  lecciones: Leccion[];
  closing?: {
    closingText?: string;
    examIntro?: string;
    examExercises?: Ejercicio[];
    pdfUrl?: string; // ✅ nuevo campo
    videoUrl?: string;
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
  categoria: string;
  publico: boolean;
  videoPresentacion: string;
  urlImagen: string;
  cursantes: string[];
  textoFinalCurso: string;
  textoFinalCursoVideoUrl: string;
  unidades?: Unidad[];
  examenFinal?: ExamenFinal;
  capstone?: Capstone;
  // 🔹 Profesor asignado (opcional)
  profesorId?: string;
  profesorRef?: DocumentReference | null;
  profesorNombre?: string;

  // 🔹 Fechas de creación y actualización
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

interface Alumno {
  email: string;
  displayName?: string;
  nombre?: string;
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

/* ==============================================================
   COMPONENTE PRINCIPAL
   ============================================================== */
export default function EditCourseForm({
  
  courseId,
  onClose,
}: {
  courseId: string;
  onClose?: () => void;
}) {
  const { firestore, storage, alumnos, reloadData } = useAuth();

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
  // 🔹 Estados de navegación dentro del contenido
const [activeUnidad, setActiveUnidad] = useState<number>(0);
const [activeUnitTab, setActiveUnitTab] = useState<"datos" | "lecciones" | "cierre">("datos");
const [activeLeccion, setActiveLeccion] = useState<number>(0);

// Profesor asignado en EDIT
const [asignarProfesor, setAsignarProfesor] = useState<
  "keep" | "none" | "existente" | "nuevo"
>("keep");


const [profesores, setProfesores] = useState<any[]>([]);
const [profesorSeleccionado, setProfesorSeleccionado] = useState<string>("");

// Para crear un profesor “rápido” (solo nombre/apellido → se guarda como texto)
const [nuevoProfesor, setNuevoProfesor] = useState({
  nombre: "",
  apellido: "",
});
console.log("🧩 [EditCourseForm] Props:", { courseId, firestore });

  /* ==============================================================
     🔹 Cargar datos del curso desde Firestore
     ============================================================== */
  useEffect(() => {
    const loadCourse = async () => {
      if (!firestore || !courseId) return;
      try {
        const docRef = doc(firestore, "cursos", courseId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          toast.error("El curso no existe o fue eliminado");
          return;
        }
        const data = snap.data() as Curso;
        setCurso(data);
        setUnidades(data.unidades || []);
        setExamenFinal(data.examenFinal || { introTexto: "", ejercicios: [] });
        setCapstone(data.capstone || { videoUrl: "", instrucciones: "", checklist: [] });
      } catch (err) {
        console.error("❌ Error cargando curso:", err);
        toast.error("Error cargando los datos del curso");
      }
    };
    loadCourse();
  }, [firestore, courseId]);


  // cargar los profes
  useEffect(() => {
  const fetchProfesores = async () => {
    if (!firestore) return;
    try {
      const docRef = doc(firestore, "profesores", "batch_1");
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        setProfesores([]);
        return;
      }
      const data = snap.data() || {};
      const list = Object.values(data);
      setProfesores(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("❌ Error cargando profesores:", err);
      setProfesores([]);
    }
  };

  fetchProfesores();
}, [firestore]);

  /* ==============================================================
     🔹 Guardar cambios
     ============================================================== */
 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!firestore) return toast.error("Firestore no inicializado");
  if (!curso) return toast.error("Curso no cargado");

  const refCurso = doc(firestore, "cursos", courseId);

  // 1️⃣ Normalizar unidades
  const unidadesToSave = (unidades || []).map((u: any) => ({
    ...u,
    closing: {
      examIntro: u.closing?.examIntro || "",
      examExercises: Array.isArray(u.closing?.examExercises)
        ? u.closing.examExercises
        : [],
      closingText: u.closing?.closingText || "",
      pdfUrl: u.closing?.pdfUrl || "",
      videoUrl: u.closing?.videoUrl || "",  // ← 🔥 NUEVO
    },
    lecciones: (u.lecciones || []).map((l: any) => ({
      ...l,
      ejercicios: Array.isArray(l.ejercicios) ? l.ejercicios : [],
    })),
  }));

  // 2️⃣ Normalizar cursantes
  const nuevosCursantes =
    curso.cursantes?.map((e) => e.toLowerCase().trim()).filter(Boolean) || [];

  try {
   // 3️⃣ PROFESOR ASIGNADO (solo nombre)
  let profesorNombre: string | null = null;

  // 🟦 KEEP CURRENT → mantener el que ya tiene el curso
  if (asignarProfesor === "keep") {
    profesorNombre = curso.profesorNombre || null;
  }

  // ⛔ NONE → eliminar profesor
  if (asignarProfesor === "none") {
    profesorNombre = null;
  }

  // 🔵 EXISTENTE → asignar profesor seleccionado
  if (asignarProfesor === "existente" && profesorSeleccionado) {
    const prof = profesores.find((p) => p.id === profesorSeleccionado);
    if (prof) {
      profesorNombre = `${prof.nombre} ${prof.apellido}`.trim();
    }
  }

  // 🟢 NUEVO → crear profesor (solo nombre)
  if (asignarProfesor === "nuevo" && nuevoProfesor.nombre.trim()) {
    profesorNombre = `${nuevoProfesor.nombre} ${nuevoProfesor.apellido}`.trim();
  }

    // 4️⃣ Payload limpio
    const payload: any = {
      ...curso,
      profesorNombre,           // 👈 solo esto
      unidades: unidadesToSave,
      examenFinal,
      capstone,
      cursantes: nuevosCursantes,
      updatedAt: serverTimestamp(),
    };

    // 5️⃣ Guardar curso
    await updateDoc(refCurso, payload);

    // 6️⃣ Enrolamiento en alumnos/batch_X/user_Y.cursosAdquiridos
    if (nuevosCursantes.length > 0) {
      console.log("🚀 Comenzando ENROLAMIENTO...");

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

            console.log(`✅ ${email} enrolado en ${batchRef.id}/${userKey}`);
            userFound = true;
          }
        }

        if (!userFound) {
          console.warn(`⚠️ Usuario ${email} no encontrado en ningún batch`);
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




useEffect(() => {
  const fetchProfesores = async () => {
    try {
      const docRef = doc(firestore, "profesores", "batch_1");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() || {};
        const list = Object.entries(data).map(([id, val]: any) => ({
          id,
          ...val,
        }));
        setProfesores(list);
      } else {
        setProfesores([]);
      }
    } catch (err) {
      console.error("❌ Error cargando profesores:", err);
      setProfesores([]);
    }
  };

  if (firestore) fetchProfesores();
}, [firestore]);


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
      duracion: undefined,
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
      titulo: "",
      texto: "",
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
    setUnidades((p) =>
      p.map((u, i) =>
        i === unidadIdx
          ? {
              ...u,
              lecciones: u.lecciones.map((l, j) =>
                j === leccionIdx ? { ...l, ...patch } : l
              ),
            }
          : u
      )
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
    const q = searchAlumno.toLowerCase().trim();
    const list = Array.isArray(alumnos) ? alumnos : [];
    if (!q) return list;
    return list.filter((a) => {
      const name = (a?.displayName || a?.nombre || "").toLowerCase();
      const mail = (a?.email || "").toLowerCase();
      return name.includes(q) || mail.includes(q);
    });
  }, [alumnos, searchAlumno]);

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

// ✅ Evitar crash mientras carga
if (!curso) {
  return (
    <div className="flex items-center justify-center h-screen text-gray-600">
      Loading course data...
    </div>
  );
}



  /* =========================
     RENDER
     ========================= */
  return (
   
  <div >
    {/* Shell */}
    <div className="bg-white text-slate-900 max-w-7xl w-full mx-auto rounded-3xl shadow-2xl relative max-h-[95vh] overflow-hidden flex flex-col border border-slate-200">
      
      {/* HEADER (claro, igual a Create) */}
      <div className="relative border-b border-slate-200 px-6 py-4">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-500 hover:text-slate-700 rounded-full p-2 hover:bg-slate-100 transition"
          aria-label="Close"
          type="button"
        >
          <FiX size={18} />
        </button>

        <h2 className="text-[20px] font-semibold tracking-tight">Edit Material Academy</h2>
        <p className="text-sm text-slate-500">
          Define the structure, content, and configuration of your course.
        </p>

        {/* NAV tabs — pills claras con realce azul */}
        <div className="mt-4 flex flex-wrap gap-2">
          {MAIN_TABS.map((t) => {
            const active = activeMainTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveMainTab(t.id)}
                className={[
                  "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm border transition-all",
                  active
                    ? "bg-white text-blue-600 border-blue-200 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                ].join(" ")}
              >
                <span className={active ? "text-blue-600" : "text-slate-500"}>
                  {t.icon}
                </span>
                <span className="font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* BODY (scroll) */}
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* ===== TAB: General ===== */}
          {activeMainTab === "general" && (
            <div className="space-y-8">
              {/* Card: Course info */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                    <FiBookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold">Course information</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Basics */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Course title</label>
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
        name="categoria"
        value={curso.categoria}
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

{/* Profesor a cargo */}
<div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
    <FiUsers className="w-4 h-4 text-blue-600" />
    Professor in charge
  </label>

  {/* Profesor actual (solo lectura, si existe) */}
  {curso.profesorNombre && (
    <p className="text-xs text-slate-500 mb-3">
      Current professor:{" "}
      <span className="font-medium text-slate-700">
        {curso.profesorNombre}
      </span>
    </p>
  )}

  {/* OPCIONES */}
  <div className="flex flex-wrap gap-6 mb-4">

    {/* KEEP (solo si existe profesor) */}
    {curso.profesorNombre && (
      <label className="flex items-center gap-2 text-gray-700">
        <input
          type="radio"
          checked={asignarProfesor === "keep"}
          onChange={() => setAsignarProfesor("keep")}
          className="h-4 w-4 accent-blue-600"
        />
        <span className="text-sm">Keep current</span>
      </label>
    )}

    {/* NONE (siempre visible) */}
    <label className="flex items-center gap-2 text-gray-700">
      <input
        type="radio"
        checked={asignarProfesor === "none"}
        onChange={() => setAsignarProfesor("none")}
        className="h-4 w-4 accent-blue-600"
      />
      <span className="text-sm">
        {curso.profesorNombre ? "Remove professor" : "None"}
      </span>
    </label>

    {/* EXISTING */}
    <label className="flex items-center gap-2 text-gray-700">
      <input
        type="radio"
        checked={asignarProfesor === "existente"}
        onChange={() => setAsignarProfesor("existente")}
        className="h-4 w-4 accent-blue-600"
      />
      <span className="text-sm">Existing</span>
    </label>

    {/* NEW */}
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

  {/* SELECT EXISTING */}
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

  {/* NEW PROFESSOR */}
  {asignarProfesor === "nuevo" && (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
      <input
        type="text"
        placeholder="Name"
        value={nuevoProfesor.nombre}
        onChange={(e) =>
          setNuevoProfesor((prev) => ({ ...prev, nombre: e.target.value }))
        }
        className="rounded-lg border border-gray-300 bg-white p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="text"
        placeholder="Last name"
        value={nuevoProfesor.apellido}
        onChange={(e) =>
          setNuevoProfesor((prev) => ({ ...prev, apellido: e.target.value }))
        }
        className="rounded-lg border border-gray-300 bg-white p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )}
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

                  {/* Media */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <FiVideo className="w-4 h-4" /> Presentation video (optional)
                      </label>
                      <div className="relative">
                        <FiLink2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="url"
                          name="videoPresentacion"
                          placeholder="https://youtube.com/watch?v=…"
                          value={curso.videoPresentacion}
                          onChange={handleChange}
                          className="w-full p-3.5 pl-11 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      {curso.videoPresentacion && isValidUrl(curso.videoPresentacion) && (
                        <div className="aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
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

                    <div className="space-y-3">
                      <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <FiImage className="w-4 h-4" /> Course image
                      </label>
                      <div className="relative">
                        <FiLink2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="url"
                          placeholder="Or paste an image URL https://"
                          value={curso.urlImagen}
                          onChange={(e) => setCurso((p) => ({ ...p!, urlImagen: e.target.value }))}
                          className="w-full p-3.5 pl-11 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      {curso.urlImagen && isValidUrl(curso.urlImagen) && (
                        <img
                          src={curso.urlImagen}
                          alt="Course thumbnail"
                          className="w-full rounded-xl border border-slate-200 object-cover max-h-48 bg-slate-50"
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

              {/* Descripción */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Short Description
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


{/* URL del Video */}
<div className="space-y-1">
  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
    <FiVideo className="w-4 h-4" /> Video URL (Vimeo, YouTube o archivo)
  </label>

  <div className="relative">
    <FiLink2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
    <input
      type="url"
      placeholder="https://vimeo.com/123...  |  https://..."
      value={l.urlVideo || ""}
      onChange={(e) =>
        updateLeccion(activeUnidad, lIdx, {
          urlVideo: e.target.value,
        })
      }
      className="w-full p-3 pl-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>

  {/* PREVIEW AUTOMÁTICO */}
  {l.urlVideo && isValidUrl(l.urlVideo) && (
    <div className="aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-50 mt-2">
      <iframe
        src={l.urlVideo}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )}
</div>

              {/* Teoría en Markdown */}
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
                <label className="text-sm font-medium text-gray-700">Exercises</label>
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

    {/* Add new lesson */}
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
{/* VIDEO DEL CIERRE DE LA UNIDAD */}
<div className="space-y-1">
  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
    <FiVideo className="w-4 h-4" /> Closing Video (optional)
  </label>

  <div className="relative">
    <FiLink2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
    <input
      type="url"
      placeholder="https://vimeo.com/123...  |  https://youtube.com/..."
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
      className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  </div>

  {/* PREVIEW */}
  {unidades[activeUnidad]?.closing?.videoUrl &&
    isValidUrl(unidades[activeUnidad]?.closing?.videoUrl || "") && (
      <div className="aspect-video mt-2 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
        <iframe
          src={unidades[activeUnidad]?.closing?.videoUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )}
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
  exercises={unidades[activeUnidad]?.closing?.examExercises || []}
  setExercises={(updatedExercises) =>
    updateUnidad(activeUnidad, (prevUnidad) => ({
      ...prevUnidad,
      closing: {
        ...(prevUnidad.closing || {}),
        examExercises: [...updatedExercises],
      },
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
                  <h3 className="text-xl font-semibold text-slate-900">Course Closing</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Final Course Message</label>
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
                      <FiVideo className="w-4 h-4" /> Final Course Video URL (optional)
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
                          title="Final course video"
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
            {activeMainTab === "cursantes" && (
              <section className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FiUsers className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">Manage Course Students</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Available Students */}
                  <div className="space-y-4">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search student by name or email"
                        value={searchAlumno}
                        onChange={(e) => setSearchAlumno(e.target.value)}
                        className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-white">
                      {filteredAlumnos.length === 0 ? (
                        <p className="text-center text-slate-500 py-4">No students found or available.</p>
                      ) : (
                        filteredAlumnos.map((a) => (
                          <div
                            key={a.email}
                            className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer"
                            onClick={() => toggleCursante(a.email)}
                          >
                            <span className="text-sm font-medium text-slate-800">
                              {a.displayName || a.nombre || a.email}
                            </span>
                            <input
                              type="checkbox"
                              checked={curso.cursantes.includes(a.email)}
                              readOnly
                              className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                            />
                          </div>
                        ))
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => addAllFiltered(filteredAlumnos.map((a) => a.email))}
                      className="w-full flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-600 rounded-xl border border-dashed border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      <FiPlus size={16} /> Add All Filtered Students
                    </button>
                  </div>

                  {/* Selected Students */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      <FiCheck size={20} className="text-blue-600" /> Selected Students ({curso.cursantes.length})
                    </h4>
                    <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-white">
                      {curso.cursantes.length === 0 ? (
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-sm"
              disabled={uploading}
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


