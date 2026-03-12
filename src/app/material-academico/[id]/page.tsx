"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useContext,
} from "react";
import { FiMenu } from "react-icons/fi";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { toast } from "sonner";
import {
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiAlertTriangle,
  FiFileText,
  FiDownload,
  FiLoader,
  FiBook,
  FiClock,
  FiAward,
  FiTarget
} from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import { db as firestore, storage } from "@/lib/firebase";
import { getCourseProgressStats } from "@/lib/courseUtils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Player from "@vimeo/player";
import {motion} from "framer-motion"
import Image from "next/image";
import { jsPDF } from "jspdf";
import { FURTHER_LOGO_BASE64 } from "@/lib/logoBase64";
import { useI18n } from "@/contexts/I18nContext";
import MobileMenu from "@/components/ui/MobileMenu";
import LoaderUi from "@/components/ui/LoaderUi";
import MarkdownWYSIWYG from "@/components/cursos/cursoItem/blocks/MarkdownWYSIWYG";
import CoursePlayerVideoModal from "@/components/ui/CoursePlayerVideoModal";
import DownloadBibliographyButton from "@/hooks/DownloadBibliographyButton";
import React from "react";
import { EnhancedCourseIntro } from "@/components/cursos/EnhancedCourseIntro";
import { useAlumno } from "@/contexts/AlumnoContext";



/* =========================================================
   📘 Tipos base (reutilizamos los tuyos, resumidos)
   ========================================================= */
interface Exercise {
  id: string;
  type: string;
  [key: string]: any;
}

interface Lesson {
  id: string;
  titulo: string;
  texto?: string;
  urlVideo?: string;
  pdfUrl?: string;
  ejercicios?: Exercise[];
}

interface Unit {
  id: string;
  titulo: string;
  descripcion?: string;
  lecciones?: Lesson[];
}

interface Curso {
  id: string;
  titulo: string;
  descripcion?: string;
  unidades?: Unit[];
  cursantes?: string[];

  // 🔹 Campos reales del Creator
  textoFinalCurso?: string;
  textoFinalCursoVideoUrl?: string;

  // 🔹 Final exam & capstone (opcional, pero futuro-proof)
  examenFinal?: any;
  capstone?: any;
}


/* =========================================================
   🧮 Helpers
   ========================================================= */
function toEmbedPdfUrl(raw?: string): string {
  const href = String(raw || "").trim();
  if (!href) return "";

  try {
    const u = new URL(href);
    const host = u.hostname;
    if (host.includes("drive.google.com")) {
      const m = href.match(/\/file\/d\/([^/]+)\/(view|preview)/);
      if (m?.[1]) return `https://drive.google.com/file/d/${m[1]}/preview`;
      const gid = u.searchParams.get("id");
      if (gid) return `https://drive.google.com/file/d/${gid}/preview`;
      return href;
    }
    if (/\.(pdf)(\?|#|$)/i.test(href)) {
      return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(
        href
      )}`;
    }
    return href;
  } catch {
    return href;
  }
}

const buildKey = (unitId: string, lessonId: string) => `${unitId}::${lessonId}`;

function calcPercentage(completedMap: Record<string, boolean>, totalLessons: number) {
  if (!totalLessons) return 0;
  const done = Object.values(completedMap || {}).filter(Boolean).length;
  return Math.min(100, Math.round((done / totalLessons) * 100));
}

/* =========================================================
   🧠 Component: CoursePlayerPage (Parte 1 - base)
   ========================================================= */

export default function CoursePlayerPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id?.toString?.() || "";
  const { user, role, authReady, loading: authLoading, userProfile } = useAuth();
const { saveCourseProgress, getCourseProgress, hasSeenCoursePlayerTutorial, markCoursePlayerTutorialAsSeen, allDataLoaded } = useAlumno();
  const { t } = useI18n();
  const dashboardRoute = role === "admin" 
  ? "/admin" 
  : role === "profesor" 
  ? "/profesor" 
  : "/dashboard";


  // 🔸 Estados principales
  const [curso, setCurso] = useState<Curso | null>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUnits, setExpandedUnits] = useState<Record<number, boolean>>({});
  const [activeU, setActiveU] = useState(0);
  const [activeL, setActiveL] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [contentReady, setContentReady] = useState(false);

  const [activeTab, setActiveTab] = useState("theory");
  const [isProgressReady, setIsProgressReady] = useState(false);


  // 🔸 Progreso del usuario
  const [progress, setProgress] = useState<Record<string, any>>({});

  // 🔸 Control de medios
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string | null>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [showExerciseWarningModal, setShowExerciseWarningModal] = useState(false);
  const [unitsReady, setUnitsReady] = useState(false);




  /* =========================================================
     🔹 Cargar curso desde Firestore

     
     ========================================================= */
     
  useEffect(() => {
    async function fetchCourse() {
      if (!firestore || !courseId) return;
      try {
        const ref = doc(firestore, "cursos", courseId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as Curso;
          console.log("🔥 Datos crudos desde Firestore:", JSON.stringify(data, null, 2));
          setCurso({ ...data, id: snap.id,  });
          console.log("📚 Curso cargado:", data);
        } else {
          setCurso(null);
        }
      } catch (err) {
        console.error("Error al cargar curso:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [firestore, courseId]);
  


const normalizedUnits = useMemo(() => {
  if (!curso) return [];

  const normalized: any[] = [];

  const hasTimeline =
    Array.isArray((curso as any).contentTimeline) &&
    (curso as any).contentTimeline.length > 0;

  const timeline = hasTimeline
    ? (curso as any).contentTimeline
    : (curso.unidades || []).map((u: any, idx: number) => ({
        type: "unit",
        refId: u.id || `unit-${idx + 1}`,
      }));

  timeline.forEach((item: any, idxTimeline: number) => {
    if (item.type !== "unit") return;

    const u =
      (curso.unidades || []).find((uu: any) => uu.id === item.refId) ||
      (curso.unidades || [])[idxTimeline];

    if (!u) return;

    const unitId = u.id || `unit-${idxTimeline + 1}`;

    // 🔥 FILTRAR INTROS EXISTENTES UNA SOLA VEZ
    const leccionesSinIntro = (u.lecciones || []).filter(
      (l: any) => l.id !== "intro" && l.id !== "introduction"
    );

    // Procesar lecciones normales
    const lessons = leccionesSinIntro.map((l: any, idxL: number) => {
      const lessonId = l.id || `lesson-${idxTimeline + 1}-${idxL + 1}`;
      const isNewStructure = Array.isArray(l.blocks) && l.blocks.length > 0;

      let title = "";
      let description = "";
      let theory = "";
      let videoUrl = "";
      let pdfUrl = "";
      let vocabulary = null;
      const ejercicios: any[] = [];

      if (isNewStructure) {
        l.blocks.forEach((block: any) => {
          switch (block.type) {
            case "title":
              title = block.value || "";
              break;
            case "description":
              description = block.value || "";
              break;
            case "theory":
              theory = block.value || "";
              break;
            case "video":
              videoUrl = block.url || "";
              break;
            case "pdf":
              pdfUrl = block.url || "";
              break;
            case "vocabulary":
              vocabulary = block;
              break;
            case "exercise":
              if (Array.isArray(block.exercises)) {
                ejercicios.push(...block.exercises);
              }
              break;
          }
        });
      } else {
        title = l.titulo || "";
        description = l.descripcion || "";
        theory = l.teoria || "";
        videoUrl = l.urlVideo || "";
        pdfUrl = l.pdfUrl || "";
        vocabulary = l.vocabulary || null;
        if (Array.isArray(l.ejercicios)) {
          ejercicios.push(...l.ejercicios);
        }
      }

      return {
        key: buildKey(unitId, lessonId),
        id: lessonId,
        unitId,
        title: title || `Lección ${idxL + 1}`,
        description,
        text: "",
        theory,
        videoUrl,
        pdfUrl,
        vocabulary,
        ejercicios,
      };
    });

    // 🔥 AGREGAR INTRO SOLO SI HAY CONTENIDO (UNA SOLA VEZ)
    const hasIntroContent = !!(u.introVideo || (u.descripcion && u.descripcion.trim().length > 0));
    
    if (hasIntroContent) {
      lessons.unshift({
        key: buildKey(unitId, "intro"),
        id: "intro",
        unitId,
        title: "Introduction",
        description: u.descripcion || "",
        videoUrl: u.introVideo || "",
        ejercicios: [],
        pdfUrl: "",
        theory: "",
        unitSummary: u.titulo || "",
        lessonsCount: leccionesSinIntro.length,
      });
    }

    normalized.push({
      id: unitId,
      title: u.titulo || `Unidad ${idxTimeline + 1}`,
      description: u.descripcion || "",
      lessons,
    });
  });

  // 🔥 FINAL EXAM (sin cambios)
  if (timeline.some(i => i.type === "final_exam") && curso.examenFinal) {
    const ex = curso.examenFinal;
    normalized.push({
      id: "final_exam",
      title: "Final Exam",
      lessons: [
        {
          key: buildKey("final_exam", "exam"),
          id: "exam",
          unitId: "final_exam",
          title: ex.introTexto || "Final Exam",
          description: ex.introTexto || "",
          theory: ex.introTexto || "",
          ejercicios: ex.ejercicios || [],
          videoUrl: ex.videoUrl || "",
          pdfUrl: "",
        }
      ]
    });
  }

  // 🔥 CAPSTONE (sin cambios)
  if (timeline.some(i => i.type === "project") && curso.capstone) {
    const cap = curso.capstone;
    normalized.push({
      id: "project",
      title: "Capstone Project",
      lessons: [
        {
          key: buildKey("project", "cap1"),
          id: "cap1",
          unitId: "project",
          title: "Capstone Project",
          description: cap.instrucciones || "",
          theory: cap.instrucciones || "",
          videoUrl: cap.videoUrl || "",
          ejercicios: [],
          pdfUrl: ""
        }
      ]
    });
  }

  // 🔥 CLOSING - Solo agregar si existe en timeline O si hay contenido de cierre
  const hasClosingInTimeline = timeline.some(i => i.type === "closing");
  const hasClosingContent = curso.textoFinalCurso || curso.textoFinalCursoVideoUrl;

  if (hasClosingInTimeline && hasClosingContent) {
    normalized.push({
      id: "closing",
      title: "Closing Section",
      lessons: [
        {
          key: buildKey("closing", "end"),
          id: "end",
          unitId: "closing",
          title: "Closing Section",
          description: curso.textoFinalCurso || "",
          theory: curso.textoFinalCurso || "",
          videoUrl: curso.textoFinalCursoVideoUrl || "",
          ejercicios: [],
          pdfUrl: ""
        }
      ]
    });
  } else if (!hasClosingInTimeline && hasClosingContent) {
    // 🔙 LEGACY: Solo si NO hay timeline y hay contenido de cierre
    normalized.push({
      id: "closing-course",
      title: "Cierre del Curso",
      lessons: [
        {
          key: buildKey("closing", "final"),
          id: "final",
          unitId: "closing",
          title: "Cierre del Curso",
          text: curso.textoFinalCurso || "",
          videoUrl: curso.textoFinalCursoVideoUrl || "",
          ejercicios: [],
        },
      ],
    });
  }

  console.log("✅ Unidades normalizadas (final):", normalized);

  return normalized;
}, [curso?.id, curso?.unidades?.length]); // 👈 CAMBIO CRÍTICO


// 🔥 Reemplaza tu useEffect actual por este:
const unitsSetRef = useRef(false);

useEffect(() => {
  if (normalizedUnits.length > 0 && !unitsSetRef.current) {
    setUnits(normalizedUnits);
    setExpandedUnits({ 0: true });
    unitsSetRef.current = true;
    setUnitsReady(true); // ✅
  }
}, [normalizedUnits]);


/* =========================================================
   🔹 Cargar progreso del curso (OPTIMIZADO - solo 1 vez)
   ========================================================= */
const progressLoadedRef = useRef(false);
const progressCacheRef = useRef<Record<string, any>>({});





// Modificar el useEffect de progreso para marcar cuando esté listo:
useEffect(() => {
  async function loadProgress() {
    if (!user?.uid || !courseId || !getCourseProgress) return;

    const cacheKey = `${user.uid}-${courseId}`;
    if (progressLoadedRef.current && progressCacheRef.current[cacheKey]) {
      setProgress(progressCacheRef.current[cacheKey]);
      setIsProgressReady(true);
      setContentReady(true); // 👈 AGREGAR
      return;
    }

    try {
      const data = await getCourseProgress(user.uid, courseId);
      if (data?.byLesson) {
        const normalized: Record<string, any> = {};
        Object.entries(data.byLesson || {}).forEach(([key, val]) => {
          normalized[key] = val;
        });
        progressCacheRef.current[cacheKey] = normalized;
        progressLoadedRef.current = true;
        setProgress(normalized);
      } else {
        setProgress({});
        progressLoadedRef.current = true;
      }
    } catch (err) {
      console.error("❌ Error cargando progreso:", err);
      setProgress({});
    } finally {
      setIsProgressReady(true);
      setContentReady(true); // 👈 AGREGAR
    }
  }

  loadProgress();
}, [user?.uid, courseId]);

// 🔥 Limpiar caché cuando el usuario cambia de curso
useEffect(() => {
  return () => {
    progressLoadedRef.current = false;
    // No limpiamos progressCacheRef para mantener caché entre navegaciones
  };
}, [courseId]);






  useEffect(() => {
  if (!mobileNavOpen) return;
  const prev = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  return () => {
    document.body.style.overflow = prev || "auto";
  };
}, [mobileNavOpen]);



 /* =========================================================
     🔹 Resolver video de Firebase o HTTP
     ========================================================= */
  const activeLesson = useMemo(
    () => units[activeU]?.lessons?.[activeL] || null,
    [units, activeU, activeL]
  );

  useEffect(() => {
  if (activeLesson) {
    console.log("🔑 LessonKey ACTUAL:", activeLesson.key);
  }
}, [activeLesson]);


  // 🔹 Resetear scroll al cambiar de lección
// 🔹 Resetear scroll y tab al cambiar de lección
useEffect(() => {
  const mainElement = document.querySelector('main.overflow-y-auto');
  if (mainElement) {
    mainElement.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  // 👇 AGREGAR ESTO: Resetear tab automáticamente
  if (activeLesson) {
    // Prioridad: theory > vocabulary > exercises
    if (activeLesson.theory) {
      setActiveTab("theory");
    } else if (activeLesson.vocabulary) {
      setActiveTab("vocabulary");
    } else if (Array.isArray(activeLesson.ejercicios) && activeLesson.ejercicios.length > 0) {
      setActiveTab("exercises");
    }
  }
}, [activeU, activeL, activeLesson]); 

function normalizeVimeo(url: string) {
  // ya viene embed
  if (url.includes("player.vimeo.com")) return url;

  // https://vimeo.com/123456
  const match = url.match(/vimeo\.com\/(\d+)/);
  if (match?.[1]) {
    return `https://player.vimeo.com/video/${match[1]}`;
  }

  return url;
}

useEffect(() => {
  if (!activeLesson?.videoUrl) {
    setResolvedVideoUrl(null);
    return;
  }
  const url = activeLesson.videoUrl;

if (url.startsWith("http")) {
  const normalized = normalizeVimeo(url);
  setResolvedVideoUrl(normalized);
  return;
}


  const load = async () => {
    try {
      const httpsURL = await getDownloadURL(ref(storage, url));
      setResolvedVideoUrl(httpsURL);
    } catch {
      toast.error("No se pudo cargar el video.");
      setResolvedVideoUrl(null);
    }
  };
  load();
}, [activeLesson?.videoUrl]);

useEffect(() => {
  console.log("🔍 INTRO DEBUG:", {
    activeLesson: activeLesson?.id,
    unitId: activeLesson?.unitId,
    activeU,
    currentUnitId: units[activeU]?.id,
    allIntros: units.map((u, idx) => ({
      unitIndex: idx,
      lessons: u.lessons.filter(l => l.id === "intro")
    }))
  });
}, [activeLesson, activeU, units]);



function RenderVocabularyBlock({ vocab }: { vocab: any }) {
  if (!vocab) return null;

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <h3 className="text-blue-600 font-semibold text-lg">Vocabulary</h3>

      {/* MODO TABLA */}
      {(!vocab.mode || vocab.mode === "table") && (

        <div className="overflow-x-auto max-w-[750px]">
          <table className="w-full bg-white border border-slate-300 rounded-xl text-sm overflow-hidden">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="p-3 border-r font-medium text-slate-700">Term</th>
                <th className="p-3 border-r font-medium text-slate-700">Meaning</th>
                <th className="p-3 font-medium text-slate-700">Example</th>
              </tr>
            </thead>

            <tbody>
              {vocab.entries?.map((row: any, idx: number) => (
                <tr key={idx} className="border-t">
                  <td className="p-3 border-r text-slate-800">{row.term}</td>
                  <td className="p-3 border-r text-slate-800">{row.translation}</td>
                  <td className="p-3 text-slate-800">{row.example || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODO IMAGEN */}
      {vocab.mode === "image" && vocab.imageUrl && (
        <div className="max-w-[750px]">
          <img
            src={vocab.imageUrl}
            alt="Vocabulary chart"
            className="rounded-xl border border-slate-300 shadow-sm max-w-full"
          />
        </div>
      )}
    </div>
  );
}





/* =========================================================
     🔹 Manejar finalización del video
     ========================================================= */




  /* =========================================================
     🔹 Estados derivados
     ========================================================= */

const { totalLessons, completedCount, progressPercent } = useMemo(
  () => getCourseProgressStats(progress, units),
  [progress, units]
);





  /* =========================================================
   ▶️ Navegación entre lecciones
   ========================================================= */
const flatLessons = useMemo(() => {
  const arr: any[] = [];
  units.forEach((u, uIdx) =>
    (u.lessons || []).forEach((l, lIdx) => arr.push({ uIdx, lIdx, key: l.key }))
  );
  return arr;
}, [units]);

const indexOfLesson = useCallback(
  (uIdx: number, lIdx: number) => {
    let idx = 0;
    for (let i = 0; i < units.length; i++) {
      const len = units[i]?.lessons?.length || 0;
      if (i === uIdx) return idx + lIdx;
      idx += len;
    }
    return 0;
  },
  [units]
);

const goNextLesson = useCallback(async () => {
  const currentIdx = indexOfLesson(activeU, activeL);
  const currentLesson = flatLessons[currentIdx];

  // 1️⃣ NAVEGACIÓN INSTANTÁNEA
  const nextIdx = currentIdx + 1;
  if (nextIdx < flatLessons.length) {
    const next = flatLessons[nextIdx];
    
    setActiveU(next.uIdx);
    setActiveL(next.lIdx);
    setExpandedUnits((p) => ({ ...p, [next.uIdx]: true }));
    
    if (currentLesson?.key && activeLesson?.id !== "intro") {
      setProgress((prev) => ({
        ...prev,
        [currentLesson.key]: {
          ...(prev[currentLesson.key] || {}),
          videoEnded: true,
        },
      }));
    }
    
    toast.success("➡️ Avanzaste a la siguiente lección");
  } else {
    toast.success("🎉 ¡Curso completado!");
    router.push(dashboardRoute);
  }

  // 2️⃣ GUARDADO EN FIREBASE
  if (
    currentLesson?.key &&
    activeLesson?.id !== "intro" &&
    user?.uid &&
    saveCourseProgress
  ) {
    saveCourseProgress(user.uid, courseId, {
      [currentLesson.key]: { videoEnded: true },
    }).catch((err) => {
      console.error("❌ Error guardando progreso (silent):", err);
    });
  }
}, [
  // Dependencias necesarias para que no se "rompa" la función
  indexOfLesson, 
  activeU, 
  activeL, 
  flatLessons, 
  activeLesson, 
  user?.uid, 
  courseId, 
  saveCourseProgress, 
  router
]);

function makeKey(exId: string, qId?: string) {
  return qId ? `${exId}::${qId}` : exId;
}

// 1️⃣ Primero, calcula el estado de la lección actual
const currentLessonStatus = useMemo(() => {
  if (!activeLesson?.key) return 'not_started';
  
  const lessonProgress = progress[activeLesson.key];
  
  if (lessonProgress?.videoEnded || lessonProgress?.exSubmitted || lessonProgress?.exPassed) {
    return 'completed';
  }
  
  return 'in_progress';
}, [activeLesson?.key, progress]);

/* =========================================================
     🔥 OPTIMIZACIÓN INTRO: Pre-calcular estadísticas
     ========================================================= */
  const introDataStable = useMemo(() => {
    // Si no es la intro, no calculamos nada para ahorrar memoria
    if (activeLesson?.id !== "intro") return null;

    const currentUnit = units[activeU];
    const lessons = currentUnit?.lessons || [];
    
    // Filtramos lecciones reales (sin intro)
    const realLessons = lessons.filter(l => l.id !== "intro");
    const total = realLessons.length;
    
    // Contamos completadas basándonos en el objeto progress
    const completed = realLessons.filter(l => 
      progress[l.key]?.videoEnded || progress[l.key]?.exSubmitted
    ).length;

    return {
      title: activeLesson.unitSummary || currentUnit?.title || "",
      description: activeLesson.description || "",
      total,
      completed,
      // Generamos lecciones para la lista "What you will learn" (solo títulos y keys)
      previewLessons: lessons.slice(1, 5).map(l => ({ key: l.key, title: l.title }))
    };
  }, [activeLesson, units, activeU, progress]); // Solo recalcula si cambian datos reales

  /* =========================================================
   🧱 Helpers de progreso y Firestore
   ========================================================= */
function buildCourseStructure(units: any[]) {
  return units.map((u) => ({
    id: u.id,
    title: u.title,
    lessons: (u.lessons || []).map((l: any) => ({
      key: l.key,
      unitId: l.unitId,
      lessonId: l.id,
      title: l.titulo,
      type: l.type || "video",
    })),
  }));
}

function getExercisePrompt(ex: Exercise): string {
  switch (ex.type) {
    case "multiple_choice":
      return ex.question;
    case "true_false":
      return ex.statement;
    case "fill_blank":
      return ex.sentence;
    case "text":
      return ex.instructions;
    case "reorder":
      return ex.title;
    case "matching":
      return ex.title;
    case "reading":
      return ex.text;
    case "listening":
      return ex.transcript || "Escucha el audio y responde.";
    case "speaking":
      return ex.bullets.join("\n");
    case "reflection":
      return ex.prompt;
    case "sentence_correction":
      return ex.incorrect;
    case "verb_table":
      return ex.title; // o ex.instructions
    default:
      return "";
  }
}

function computeStats(byLesson: any, totalLessons: number) {
  const entries = Object.entries(byLesson || {});
  const completed = entries.filter(([, v]: any) => v?.exSubmitted || v?.videoEnded).length;
  const passed = entries.filter(([, v]: any) => v?.exPassed).length;
  const percentage = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
  return { completedLessons: completed, passedLessons: passed, percentage };
}

/* =========================================================
   💾 Guardar progreso (reemplaza el setProgress actual)
   ========================================================= */

/* ============================================================
   🧠 ExerciseRunner — VERSIÓN LIMPIA Y CORREGIDA (INTERNA)
   ============================================================ */

function ExerciseRunner({
  ejercicios,
  lessonKey,
  exerciseId, // 👈 Cambiar de exerciseIndex a exerciseId
  courseId,
  batchId,
  userKey,
  savedData,
  onSubmit,
}: {
  ejercicios: any[];
  lessonKey: string;
  exerciseId: string; // 👈 Ahora es string
  courseId: string;
  batchId: string;
  userKey: string;
  savedData?: any;
  onSubmit?: (r: { correct: number; total: number }) => void;
}) {
  // 🟢 INICIALIZACIÓN DIRECTA
  const [answers, setAnswers] = useState<Record<string, any>>({});
  
  const [submitted, setSubmitted] = useState(false);
  
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    msg: string;
    correct?: number;
    total?: number;
  } | null>(null);

  const { user } = useAuth();
const { saveCourseProgress } = useAlumno();

  // 🔥 KEY GLOBAL ÚNICA
  const currentExerciseKey = useMemo(
    () => `${lessonKey}::${exerciseId}`, // 👈 Usar exerciseId
    [lessonKey, exerciseId]
  );

  // 🔑 KEYS INTERNAS (input-level)
  const makeLocalKey = (exId: string, subId?: string) =>
    subId
      ? `${currentExerciseKey}::${exId}::${subId}`
      : `${currentExerciseKey}::${exId}`;

  // 🔥 EFECTO CRÍTICO: Cargar datos guardados cuando estén disponibles
  useEffect(() => {
    if (savedData) {
      // Restaurar respuestas
      if (savedData.score?.answers) {
        setAnswers(savedData.score.answers);
      }
      
      // Restaurar estado de submitted
      if (savedData.exSubmitted) {
        setSubmitted(true);
        setFeedback({
          ok: savedData.exPassed || false,
          msg: savedData.exPassed ? "✔️ ¡Correcto!" : "❌ Intento registrado",
          correct: savedData.score?.correct,
          total: savedData.score?.total,
        });
      }
    }
  }, [savedData]); // 👈 Se ejecuta cuando savedData cambie

/* ============================================================
   🧠 EVALUATE — versión limpia y estable
   ============================================================ */
const evaluate = async () => {
  if (submitted) return;

  const ex = ejercicios[0];
  if (!ex) return;

  let correct = 0;
  let totalItems = 1;

  // ============================================================
  // 🔸 Helpers por tipo de ejercicio
  // ============================================================

  // MC
  const evalMC = (ex: any) => {
    const key = makeLocalKey(ex.id);
    const val = answers[key];
    return val === ex.correctIndex;
  };

  // True / False
  const evalTF = (ex: any) => {
    const key = makeLocalKey(ex.id);
    const val = answers[key];
    return val === ex.answer;
  };

  // Fill blanks
  const evalFillBlank = (ex: any) => {
    const key = makeLocalKey(ex.id);
    const arr = answers[key];
    if (!Array.isArray(arr)) return false;

    return arr.every(
      (v, i) =>
        String(v).trim().toLowerCase() ===
        String(ex.answers[i]).trim().toLowerCase()
    );
  };

  // Reading / Listening
  const evalReadingListening = (ex: any) => {
    let ok = 0;

    ex.questions.forEach((q: any) => {
      const key = makeLocalKey(ex.id, q.id);
      const ans = answers[key];
      let isCorrect = false;

      if (q.kind === "mc") isCorrect = ans === q.correctIndex;
      if (q.kind === "tf") isCorrect = ans === q.answer;
      if (q.kind === "open") {
  // Las preguntas abiertas siempre suman 1 punto si hay texto
    isCorrect = ans?.trim() ? true : false;
  }
      if (isCorrect) ok++;
    });

    correct = ok;
    totalItems = ex.questions.length;
  };

  // Reorder
  const evalReorder = (ex: any) => {
    const key = makeLocalKey(ex.id);
    const userOrder = answers[key];
    return JSON.stringify(userOrder) === JSON.stringify(ex.correctOrder);
  };

  // Matching
  const evalMatching = (ex: any) => {
    let ok = 0;
    ex.pairs.forEach((pair: any, idx: number) => {
      const key = makeLocalKey(ex.id, String(idx));
      const sel = answers[key];
      if (sel === pair.right) ok++;
    });
    correct = ok;
    totalItems = ex.pairs.length;
  };

  // Reflection
  const evalReflection = (ex: any) => {
    let ok = 0;
    const n = ex.ideasCount || 3;

    for (let i = 0; i < n; i++) {
      const key = makeLocalKey(ex.id, `idea${i}`);
      const txt = answers[key];
      if (txt?.trim()) ok++;
    }

    correct = ok;
    totalItems = n;
  };

  // Sentence correction
  const evalSentenceCorrection = (ex: any) => {
    const key = makeLocalKey(ex.id);
    const ans = answers[key];
    if (!ans) return false;

    return ex.correctAnswers.some(
      (x: string) =>
        x.trim().toLowerCase() === String(ans).trim().toLowerCase()
    );
  };

  // Text / Speaking (auto-pass)
  const evalTextOrSpeaking = () => {
    correct = 1;
    totalItems = 1;
  };

        // TABLE (universal)
const evalTable = (ex: any) => {
  if (!ex.blanks || ex.blanks.length === 0) {
    // Si no hay blanks definidos, aprobar automáticamente
    correct = 1;
    totalItems = 1;
    return;
  }

  let ok = 0;
  const total = ex.blanks.length;

  ex.blanks.forEach((blank: any) => {
    const key = makeLocalKey(ex.id, `${blank.rowIndex}-${blank.column}`);
    const userAnswer = (answers[key] || "").trim().toLowerCase();
    const correctAnswer = (ex.correct?.[`${blank.rowIndex}-${blank.column}`] || "")
      .trim()
      .toLowerCase();
    
    if (userAnswer === correctAnswer) ok++;
  });

  correct = ok;
  totalItems = total;
};
  // ============================================================
  // 🔥 SWITCH PRINCIPAL
  // ============================================================
  switch (ex.type) {
    case "multiple_choice":
      correct = evalMC(ex) ? 1 : 0;
      totalItems = 1;
      break;
    case "true_false":
      correct = evalTF(ex) ? 1 : 0;
      totalItems = 1;
      break;
    case "fill_blank":
      correct = evalFillBlank(ex) ? 1 : 0;
      totalItems = 1;
      break;
    case "reading":
    case "listening":
      evalReadingListening(ex);
      break;
    case "reorder":
      correct = evalReorder(ex) ? 1 : 0;
      totalItems = 1;
      break;
    case "matching":
      evalMatching(ex);
      break;
    case "reflection":
      evalReflection(ex);
      break;
    case "sentence_correction":
      correct = evalSentenceCorrection(ex) ? 1 : 0;
      totalItems = 1;
      break;
    case "text":
    case "speaking":
      evalTextOrSpeaking();
      break;
    
      case "verb_table":
  evalTable(ex);
  break;

  case "open_question":
  // nunca falla, siempre suma 1/1
  correct = 1;
  totalItems = 1;
  break;
      
    default:
      correct = 0;
      totalItems = 1;
  }

  const passed = correct === totalItems;

  // ============================================================
  // 🔵 Actualizar UI antes de guardar
  // ============================================================
  setSubmitted(true);
  setFeedback({
    ok: passed,
    msg: passed ? "✔️ ¡Correcto!" : "❌ Intento registrado",
    correct,
    total: totalItems,
  });

  // ============================================================
  // 💾 Guardar en Firestore después
  // ============================================================
  try {
    if (!user?.uid) return;

    await saveCourseProgress(user.uid, courseId, {
      [currentExerciseKey]: {
        exSubmitted: true,
        exPassed: passed,
        score: {
          correct,
          total: totalItems,
          answers: { ...answers }, // todas las respuestas
        },
      },
    });
  } catch (err) {
    console.error("❌ Error guardando:", err);
    toast.error("No se pudo guardar tu progreso");
  }

  // Callback al padre
  onSubmit?.({ correct, total: totalItems });
};


// 🟢 Manejar cambios de inputs
const handleAnswer = (key: string, value: any) => {
  if (submitted) return; // luego de enviar no permite cambios
  setAnswers((prev) => ({
    ...prev,
    [key]: value,
  }));
};

/* ============================================================
   🔍 RENDERERS POR TIPO DE EJERCICIO
   ============================================================ */


// ─────────────────────────────────────────────────────────────
// 2️⃣  renderReading — reemplaza la función completa
// ─────────────────────────────────────────────────────────────

const renderReading = (ex: any) => {
  return (
    <div className="space-y-6">
      {/* Texto de lectura */}
      <div className="p-5 max-w-[800px]"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        {ex.title && (
          <h4 className="font-black text-white mb-3 text-lg">{ex.title}</h4>
        )}
        <p className="text-white/70 whitespace-pre-line leading-relaxed break-words text-sm">
          {ex.text}
        </p>
      </div>

      {/* Preguntas */}
      <div className="space-y-4 max-w-[800px]">
        {ex.questions.map((q: any, idx: number) => {
          const qKey = makeLocalKey(ex.id, q.id);
          const val = answers[qKey];
          let isCorrect = false;
          if (submitted) {
            if (q.kind === "mc") isCorrect = val === q.correctIndex;
            if (q.kind === "tf") isCorrect = val === q.answer;
          }

          return (
            <div key={q.id} className="p-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <h5 className="font-bold text-white/90 text-sm">{idx + 1}. {q.prompt}</h5>
                {submitted && (
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 flex-shrink-0"
                    style={isCorrect
                      ? { background: "rgba(34,197,94,0.12)", color: "#86efac", border: "1px solid rgba(34,197,94,0.3)" }
                      : { background: "rgba(255,56,22,0.12)", color: "#fca5a5", border: "1px solid rgba(255,56,22,0.3)" }}>
                    {isCorrect ? t("coursePlayer.exercise.correct") : t("coursePlayer.exercise.incorrect")}
                  </span>
                )}
              </div>

              {/* MC options */}
              {q.kind === "mc" && q.options.map((opt: string, i: number) => {
                const selected = val === i;
                const isOptCorrect = i === q.correctIndex;
                let bg = "rgba(255,255,255,0.02)"; let border = "rgba(255,255,255,0.08)"; let color = "rgba(255,255,255,0.65)";
                if (submitted) {
                  if (isOptCorrect) { bg = "rgba(34,197,94,0.1)"; border = "rgba(34,197,94,0.4)"; color = "#86efac"; }
                  else if (selected) { bg = "rgba(255,56,22,0.1)"; border = "rgba(255,56,22,0.4)"; color = "#fca5a5"; }
                } else if (selected) { bg = "rgba(238,114,3,0.1)"; border = "#EE7203"; color = "#EE7203"; }
                return (
                  <label key={i} className="flex items-center gap-3 p-2 mb-1 cursor-pointer text-sm transition-all"
                    style={{ background: bg, border: `1px solid ${border}`, color }}>
                    <input type="radio" disabled={submitted} checked={selected} onChange={() => handleAnswer(qKey, i)} className="hidden" />
                    <span>{opt}</span>
                  </label>
                );
              })}

              {/* TF options */}
              {q.kind === "tf" && (
                <div className="flex gap-2">
                  {[true, false].map((v) => {
                    const selected = val === v;
                    const isOptCorrect = q.answer === v;
                    let bg = "rgba(255,255,255,0.02)"; let border = "rgba(255,255,255,0.08)"; let color = "rgba(255,255,255,0.65)";
                    if (submitted) {
                      if (isOptCorrect) { bg = "rgba(34,197,94,0.1)"; border = "rgba(34,197,94,0.4)"; color = "#86efac"; }
                      else if (selected) { bg = "rgba(255,56,22,0.1)"; border = "rgba(255,56,22,0.4)"; color = "#fca5a5"; }
                    } else if (selected) { bg = "rgba(238,114,3,0.1)"; border = "#EE7203"; color = "#EE7203"; }
                    return (
                      <label key={String(v)} className="flex items-center gap-2 px-4 py-2 cursor-pointer text-sm font-bold transition-all"
                        style={{ background: bg, border: `1px solid ${border}`, color }}>
                        <input type="radio" disabled={submitted} checked={selected} onChange={() => handleAnswer(qKey, v)} className="hidden" />
                        {v ? "True" : "False"}
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Open */}
              {q.kind === "open" && (
                <div className="space-y-2">
                  <textarea rows={3} disabled={submitted} value={answers[qKey] || ""}
                    maxLength={q.maxLength || 500}
                    onChange={(e) => handleAnswer(qKey, e.target.value)}
                    placeholder={q.placeholder || "Write your answer..."}
                    className="w-full p-3 text-sm outline-none resize-none transition-all"
                    style={submitted
                      ? { background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", color: "#86efac" }
                      : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" }}
                  />
                  <p className="text-[10px] text-white/30">{(answers[qKey] || "").length}/{q.maxLength || 500}</p>
                </div>
              )}

              {submitted && !isCorrect && (
                <p className="text-xs mt-2" style={{ color: "#fca5a5" }}>
                  {q.kind === "mc" && `✓ ${q.options[q.correctIndex]}`}
                  {q.kind === "tf" && `✓ ${q.answer ? "True" : "False"}`}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};


// ─────────────────────────────────────────────────────────────
// 3️⃣  renderTable — reemplaza la función completa
// ─────────────────────────────────────────────────────────────

const renderTable = (ex: any) => {
  const isBlankCell = (rowIdx: number, col: string) =>
    (ex.blanks || []).some((b: any) => b.rowIndex === rowIdx && b.column === col);

  const inputStyle = (r: number, col: string) => {
    if (!submitted) return { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)" };
    const userAns = (answers[makeLocalKey(ex.id, `${r}-${col}`)] || "").trim().toLowerCase();
    const correctAns = (ex.correct?.[`${r}-${col}`] || "").trim().toLowerCase();
    return userAns === correctAns
      ? { background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.4)", color: "#86efac" }
      : { background: "rgba(255,56,22,0.1)", border: "1px solid rgba(255,56,22,0.4)", color: "#fca5a5" };
  };

  return (
    <div className="max-w-[750px] overflow-x-auto">
      <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid rgba(238,114,3,0.4)" }}>
            {["Subject", "Positive", "Negative"].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest"
                style={{ color: "#EE7203" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ex.rows.map((row: any, r: number) => (
            <tr key={r} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <td className="px-4 py-3 font-bold text-white">{row.subject}</td>
              {["positive", "negative"].map((col) => (
                <td key={col} className="px-2 py-2">
                  {isBlankCell(r, col) ? (
                    <input disabled={submitted}
                      value={answers[makeLocalKey(ex.id, `${r}-${col}`)] || ""}
                      onChange={(e) => handleAnswer(makeLocalKey(ex.id, `${r}-${col}`), e.target.value)}
                      placeholder="..."
                      className="w-full px-3 py-2 text-sm outline-none transition-all"
                      style={inputStyle(r, col)}
                    />
                  ) : (
                    <span className="px-3 py-2 block text-white/60">{row[col]}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {submitted && (ex.blanks || []).some((b: any) => {
        const key = `${b.rowIndex}-${b.column}`;
        return (answers[makeLocalKey(ex.id, key)] || "").trim().toLowerCase() !== (ex.correct?.[key] || "").trim().toLowerCase();
      }) && (
        <div className="mt-4 p-4 text-sm"
          style={{ background: "rgba(238,114,3,0.08)", border: "1px solid rgba(238,114,3,0.25)" }}>
          <p className="font-black text-white/80 mb-2 text-xs uppercase tracking-widest">Correct answers:</p>
          <ul className="space-y-1">
            {(ex.blanks || []).map((b: any, i: number) => {
              const key = `${b.rowIndex}-${b.column}`;
              if ((answers[makeLocalKey(ex.id, key)] || "").trim().toLowerCase() === (ex.correct?.[key] || "").trim().toLowerCase()) return null;
              return <li key={i} className="text-white/60 text-xs">• Row {b.rowIndex + 1} ({b.column}): <strong className="text-[#EE7203]">{ex.correct?.[key]}</strong></li>;
            })}
          </ul>
        </div>
      )}
    </div>
  );
};


// ─────────────────────────────────────────────────────────────
// 4️⃣  renderFillBlank — reemplaza la función completa
// ─────────────────────────────────────────────────────────────

const renderFillBlank = (ex: any) => {
  const key = makeLocalKey(ex.id);
  const parts = ex.sentence.split("***");
  const current = answers[key] || [];

  return (
    <div className="space-y-4 max-w-[750px]">
      <div className="text-white/80 text-base leading-relaxed whitespace-pre-wrap">
        {parts.map((part: string, i: number) => (
          <span key={i}>
            {part}
            {i < ex.answers.length && (
              <input type="text" disabled={submitted} value={current[i] || ""}
                placeholder="___"
                style={{
                  width: "120px",
                  ...(submitted
                    ? current[i]?.trim()?.toLowerCase() === ex.answers[i].trim().toLowerCase()
                      ? { background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.4)", color: "#86efac" }
                      : { background: "rgba(255,56,22,0.12)", border: "1px solid rgba(255,56,22,0.4)", color: "#fca5a5" }
                    : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)" })
                }}
                className="inline-block mx-1 px-3 py-1 text-base align-middle outline-none"
                onChange={(e) => {
                  const copy = [...current];
                  copy[i] = e.target.value;
                  handleAnswer(key, copy);
                }}
              />
            )}
          </span>
        ))}
      </div>

      {submitted && current.some((ans: string, idx: number) =>
        ans?.trim()?.toLowerCase() !== ex.answers[idx]?.trim()?.toLowerCase()
      ) && (
        <div className="p-3 text-xs"
          style={{ background: "rgba(238,114,3,0.08)", border: "1px solid rgba(238,114,3,0.25)" }}>
          <span className="font-black text-white/60 uppercase tracking-widest">{t("coursePlayer.exercise.correctAnswers")}: </span>
          <span className="text-[#EE7203] font-bold">{ex.answers.join(", ")}</span>
        </div>
      )}
    </div>
  );
};



// ─────────────────────────────────────────────────────────────
// 5️⃣  renderOpenQuestion — reemplaza la función completa
// ─────────────────────────────────────────────────────────────

const renderOpenQuestion = (ex: any) => {
  const key = makeLocalKey(ex.id);
  const txt = answers[key] || "";
  const max = ex.maxLength || 500;
  return (
    <div className="space-y-3 max-w-[800px]">
      <p className="font-bold text-white/80">{ex.prompt}</p>
      <textarea rows={4} disabled={submitted} value={txt} maxLength={max}
        onChange={(e) => handleAnswer(key, e.target.value)}
        className="w-full p-3 text-sm outline-none resize-none transition-all"
        style={submitted
          ? { background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", color: "#86efac" }
          : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" }}
      />
      <p className="text-[10px] text-white/30">{txt.length}/{max}</p>
    </div>
  );
};


// ─────────────────────────────────────────────────────────────
// 6️⃣  renderText — reemplaza la función completa
// ─────────────────────────────────────────────────────────────

const renderText = (ex: any) => {
  const key = makeLocalKey(ex.id);
  const txt = answers[key] || "";
  const max = ex.maxLength || 400;
  return (
    <div className="space-y-3 max-w-[800px]">
      <p className="font-bold text-white/80">{ex.prompt}</p>
      <textarea rows={4} disabled={submitted} value={txt} maxLength={max}
        onChange={(e) => handleAnswer(key, e.target.value)}
        className="w-full p-3 text-sm outline-none resize-none transition-all"
        style={submitted
          ? txt.trim()
            ? { background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", color: "#86efac" }
            : { background: "rgba(255,56,22,0.08)", border: "1px solid rgba(255,56,22,0.3)", color: "#fca5a5" }
          : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" }}
      />
      <p className="text-[10px] text-white/30">{t("coursePlayer.exercise.maxCharacters", { max, used: txt.length })}</p>
      {submitted && !txt.trim() && <p className="text-xs" style={{ color: "#fca5a5" }}>{t("coursePlayer.exercise.emptyIdea")}</p>}
    </div>
  );
};


// ─────────────────────────────────────────────────────────────
// 7️⃣  renderMatching — reemplaza la función completa
// ─────────────────────────────────────────────────────────────

const renderMatching = (ex: any) => {
  return (
    <div className="space-y-3 max-w-[750px]">
      {ex.pairs.map((pair: any, idx: number) => {
        const key = makeLocalKey(ex.id, String(idx));
        const val = answers[key] || "";
        const isCorrect = submitted && val === pair.right;

        return (
          <div key={idx} className="p-4 flex flex-wrap items-center gap-4"
            style={{
              background: submitted ? (isCorrect ? "rgba(34,197,94,0.06)" : "rgba(255,56,22,0.06)") : "rgba(255,255,255,0.03)",
              border: `1px solid ${submitted ? (isCorrect ? "rgba(34,197,94,0.3)" : "rgba(255,56,22,0.3)") : "rgba(255,255,255,0.08)"}`,
            }}>
            <span className="font-bold text-white text-sm">{pair.left}</span>
            <select disabled={submitted} value={val} onChange={(e) => handleAnswer(key, e.target.value)}
              className="px-3 py-2 text-sm outline-none"
              style={{ background: "#112C3E", border: "1px solid rgba(238,114,3,0.3)", color: val ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)" }}>
              <option value="">Select…</option>
              {ex.pairs.map((p: any, j: number) => <option key={j} value={p.right}>{p.right}</option>)}
            </select>
            {submitted && !isCorrect && (
              <p className="text-xs w-full" style={{ color: "#fca5a5" }}>✓ {pair.right}</p>
            )}
          </div>
        );
      })}
    </div>
  );
};


// ─────────────────────────────────────────────────────────────
// 8️⃣  renderReorder — reemplaza la función completa
// ─────────────────────────────────────────────────────────────

const renderReorder = (ex: any) => {
  const key = makeLocalKey(ex.id);
  const current = answers[key] ?? ex.items.map((_: any, i: number) => i);
  const move = (from: number, to: number) => {
    if (submitted || to < 0 || to >= current.length) return;
    const copy = [...current];
    [copy[from], copy[to]] = [copy[to], copy[from]];
    handleAnswer(key, copy);
  };
  const isCorrect = submitted && JSON.stringify(current) === JSON.stringify(ex.correctOrder);

  return (
    <div className="space-y-2 max-w-[750px]">
      {current.map((idx: number, pos: number) => (
        <div key={pos} className="flex items-center justify-between p-3 text-sm transition-all"
          style={{
            background: submitted ? (isCorrect ? "rgba(34,197,94,0.08)" : "rgba(255,56,22,0.08)") : "rgba(255,255,255,0.03)",
            border: `1px solid ${submitted ? (isCorrect ? "rgba(34,197,94,0.3)" : "rgba(255,56,22,0.3)") : "rgba(255,255,255,0.08)"}`,
            color: "rgba(255,255,255,0.8)",
          }}>
          <span>{ex.items[idx]}</span>
          {!submitted && (
            <div className="flex gap-1">
              {["↑", "↓"].map((arrow, i) => (
                <button key={arrow} onClick={() => move(pos, pos + (i === 0 ? -1 : 1))}
                  className="px-2 py-1 text-xs font-black transition-colors"
                  style={{ background: "rgba(238,114,3,0.15)", color: "#EE7203", border: "1px solid rgba(238,114,3,0.3)" }}>
                  {arrow}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
      {submitted && !isCorrect && (
        <p className="text-xs pt-1" style={{ color: "#fca5a5" }}>
          ✓ {ex.correctOrder.map((i: number) => ex.items[i]).join(" → ")}
        </p>
      )}
    </div>
  );
};


// ─────────────────────────────────────────────────────────────
// 9️⃣  renderReflection — reemplaza la función completa
// ─────────────────────────────────────────────────────────────

const renderReflection = (ex: any) => {
  const n = ex.ideasCount || 3;
  return (
    <div className="space-y-3 max-w-[750px]">
      <p className="font-bold text-white/80">{ex.prompt}</p>
      {[...Array(n)].map((_, i) => {
        const key = makeLocalKey(ex.id, `idea${i}`);
        const txt = answers[key] || "";
        return (
          <div key={i} className="space-y-1">
            <textarea rows={3} disabled={submitted} value={txt}
              onChange={(e) => handleAnswer(key, e.target.value)}
              placeholder={`Idea ${i + 1}`}
              className="w-full p-3 text-sm outline-none resize-none transition-all"
              style={submitted
                ? txt.trim()
                  ? { background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", color: "#86efac" }
                  : { background: "rgba(255,56,22,0.08)", border: "1px solid rgba(255,56,22,0.3)", color: "#fca5a5" }
                : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" }}
            />
            {submitted && !txt.trim() && (
              <span className="text-xs" style={{ color: "#fca5a5" }}>{t("coursePlayer.exercise.emptyIdea")}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};


// ─────────────────────────────────────────────────────────────
// 🔟  renderSentenceCorrection — reemplaza la función completa
// ─────────────────────────────────────────────────────────────

const renderSentenceCorrection = (ex: any) => {
  const key = makeLocalKey(ex.id);
  const val = answers[key] || "";
  const isCorrect = submitted && ex.correctAnswers.some(
    (ans: string) => ans.trim().toLowerCase() === val.trim().toLowerCase()
  );
  return (
    <div className="space-y-4 max-w-[750px]">
      <p className="font-bold text-white/70 text-sm uppercase tracking-widest">{t("coursePlayer.exercise.incorrectSentence")}</p>
      <p className="italic text-white/50 text-base">"{ex.incorrect}"</p>
      <input type="text" disabled={submitted} value={val}
        onChange={(e) => handleAnswer(key, e.target.value)}
        placeholder="Write the corrected sentence"
        className="w-full p-3 text-sm outline-none transition-all"
        style={submitted
          ? isCorrect
            ? { background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", color: "#86efac" }
            : { background: "rgba(255,56,22,0.08)", border: "1px solid rgba(255,56,22,0.3)", color: "#fca5a5" }
          : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" }}
      />
      {submitted && !isCorrect && (
        <p className="text-xs" style={{ color: "#fca5a5" }}>
          {t("coursePlayer.exercise.correctAnswer")}<br />
          <strong className="text-[#EE7203]">{ex.correctAnswers[0]}</strong>
        </p>
      )}
    </div>
  );
};


// ─────────────────────────────────────────────────────────────
// 1️⃣1️⃣  renderSpeaking — reemplaza la función completa
// ─────────────────────────────────────────────────────────────

const renderSpeaking = (ex: any) => {
  return (
    <div className="space-y-4 max-w-[750px]">
      <h4 className="font-black text-white">{ex.title}</h4>
      <ul className="space-y-2">
        {ex.bullets?.map((b: string, i: number) => (
          <li key={i} className="flex items-start gap-3 text-sm text-white/70">
            <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#EE7203" }} />
            {b}
          </li>
        ))}
      </ul>
      {ex.notes && <p className="text-sm italic text-white/40">{ex.notes}</p>}
      <p className="text-xs text-white/30">{t("coursePlayer.exercise.correction")}</p>
    </div>
  );
};


// ─────────────────────────────────────────────────────────────
// 1️⃣2️⃣  renderSolution — reemplaza la función completa
// ─────────────────────────────────────────────────────────────

  const renderSolution = (ex: any) => {
    if (feedback?.ok) return null;
    switch (ex.type) {
      case "multiple_choice":
        return <p className="text-xs mt-2 text-white/40">✓ <strong className="text-[#EE7203]">{ex.options?.[ex.correctIndex]}</strong></p>;
      case "true_false":
        return <p className="text-xs mt-2 text-white/40">✓ <strong className="text-[#EE7203]">{ex.answer ? "True" : "False"}</strong></p>;
      case "fill_blank":
        return <p className="text-xs mt-2 text-white/40">✓ <strong className="text-[#EE7203]">{ex.answers?.join(", ")}</strong></p>;
      default:
        return null;
    }
  };
  /* ============================================================
     🔚 JSX FINAL DEL EJERCICIO
     ============================================================ */
  const ex = ejercicios[0];
  if (!ex) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="p-6 space-y-6"
      style={{ background: "#112C3E", border: "1px solid rgba(238,114,3,0.2)" }}
    >
      {/* Header del ejercicio */}
      <div className="space-y-3">
        {ex.title && (
          <div className="flex items-center gap-3">
            <div className="w-1 h-8" style={{ background: "linear-gradient(180deg, #EE7203, #FF3816)" }} />
            <h3 className="text-xl font-black text-white">{ex.title}</h3>
          </div>
        )}

        {ex.instructions && (
          <div className="px-4 py-3 text-sm font-medium leading-relaxed"
            style={{ background: "rgba(238,114,3,0.08)", borderLeft: "3px solid #EE7203", color: "rgba(255,255,255,0.8)" }}>
            {ex.instructions}
          </div>
        )}

        {getExercisePrompt(ex) && 
  !["reading", "listening", "reorder", "matching", "speaking", "reflection"].includes(ex.type) && (
  <div className="px-4 py-3 mt-2"
    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
    <p className="text-base font-semibold text-white/80 whitespace-pre-wrap">
      {getExercisePrompt(ex)}
    </p>
  </div>
)}

        {/* Tipo badge */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1"
            style={{ background: "rgba(238,114,3,0.1)", color: "#EE7203", border: "1px solid rgba(238,114,3,0.25)" }}>
            {ex.type.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Área de respuesta */}
      <div className="p-4"
        style={{
          background: submitted
            ? feedback?.ok ? "rgba(34,197,94,0.06)" : "rgba(255,56,22,0.06)"
            : "rgba(255,255,255,0.02)",
          border: submitted
            ? feedback?.ok ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(255,56,22,0.3)"
            : "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {ex.type === "reading" && renderReading(ex)}
        {ex.type === "verb_table" && renderTable(ex)}
        {ex.type === "listening" && (
          <div className="space-y-6">
            {ex.audioUrl && (
              <>
                {/\.(mp3|wav|ogg)$/i.test(ex.audioUrl) && (
                  <audio controls src={ex.audioUrl} className="mt-2 w-full max-w-md" />
                )}
                {ex.audioUrl.includes("vimeo.com") && (
                  <iframe
                    src={ex.audioUrl.replace("vimeo.com/", "player.vimeo.com/video/")}
                    className="w-full h-48 mt-3"
                    allow="autoplay; fullscreen; encrypted-media"
                    allowFullScreen
                  />
                )}
              </>
            )}
            {renderReading(ex)}
          </div>
        )}
        {ex.type === "fill_blank" && renderFillBlank(ex)}
        {ex.type === "text" && renderText(ex)}
        {ex.type === "open_question" && renderOpenQuestion(ex)}
        {ex.type === "matching" && renderMatching(ex)}
        {ex.type === "reorder" && renderReorder(ex)}
        {ex.type === "reflection" && renderReflection(ex)}
        {ex.type === "sentence_correction" && renderSentenceCorrection(ex)}
        {ex.type === "speaking" && renderSpeaking(ex)}

        {/* MULTIPLE CHOICE */}
        {ex.type === "multiple_choice" && (
          <div className="flex flex-col gap-2 max-w-[750px]">
            {ex.options.map((opt: string, idx: number) => {
              const key = makeLocalKey(ex.id);
              const val = answers[key];
              const isSelected = val === idx;
              const isCorrectOpt = idx === ex.correctIndex;

              let bg = "rgba(255,255,255,0.03)";
              let border = "rgba(255,255,255,0.1)";
              let color = "rgba(255,255,255,0.7)";

              if (submitted) {
                if (isCorrectOpt) { bg = "rgba(34,197,94,0.12)"; border = "rgba(34,197,94,0.5)"; color = "#86efac"; }
                else if (isSelected) { bg = "rgba(255,56,22,0.12)"; border = "rgba(255,56,22,0.5)"; color = "#fca5a5"; }
              } else if (isSelected) {
                bg = "rgba(238,114,3,0.12)"; border = "#EE7203"; color = "#EE7203";
              }

              return (
                <motion.label
                  key={idx}
                  whileHover={!submitted ? { x: 4 } : {}}
                  className="flex items-center gap-3 p-3 cursor-pointer transition-all"
                  style={{ background: bg, border: `1px solid ${border}`, color }}
                >
                  <input type="radio" className="hidden" disabled={submitted}
                    checked={isSelected} onChange={() => handleAnswer(key, idx)} />
                  <span className="w-6 h-6 flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{ border: `1px solid ${border}`, color }}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-sm font-medium">{opt}</span>
                </motion.label>
              );
            })}
            {submitted && renderSolution(ex)}
          </div>
        )}

        {/* TRUE / FALSE */}
        {ex.type === "true_false" && (
          <div className="flex flex-wrap gap-3 max-w-[750px]">
            {[{ label: "True", value: true }, { label: "False", value: false }].map((opt) => {
              const key = makeLocalKey(ex.id);
              const val = answers[key];
              const isSelected = val === opt.value;
              const isCorrectOpt = ex.answer === opt.value;

              let bg = "rgba(255,255,255,0.03)";
              let border = "rgba(255,255,255,0.1)";
              let color = "rgba(255,255,255,0.7)";

              if (submitted) {
                if (isCorrectOpt) { bg = "rgba(34,197,94,0.12)"; border = "rgba(34,197,94,0.5)"; color = "#86efac"; }
                else if (isSelected) { bg = "rgba(255,56,22,0.12)"; border = "rgba(255,56,22,0.5)"; color = "#fca5a5"; }
              } else if (isSelected) {
                bg = "rgba(238,114,3,0.12)"; border = "#EE7203"; color = "#EE7203";
              }

              return (
                <motion.label key={opt.label}
                  whileHover={!submitted ? { scale: 1.03 } : {}}
                  className="flex items-center gap-3 px-6 py-3 cursor-pointer transition-all font-bold text-sm"
                  style={{ background: bg, border: `1px solid ${border}`, color }}
                >
                  <input type="radio" className="hidden" disabled={submitted}
                    checked={isSelected} onChange={() => handleAnswer(key, opt.value)} />
                  <span>{opt.label}</span>
                </motion.label>
              );
            })}
            {submitted && renderSolution(ex)}
          </div>
        )}
      </div>

      {/* Botón check */}
      <motion.button
        onClick={evaluate}
        disabled={submitted}
        whileHover={!submitted ? { scale: 1.02 } : {}}
        whileTap={!submitted ? { scale: 0.97 } : {}}
        className="w-full py-3 font-black text-sm uppercase tracking-widest transition-all"
        style={submitted
          ? { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)", cursor: "not-allowed" }
          : { background: "linear-gradient(135deg, #EE7203, #FF3816)", color: "white" }
        }
      >
        {submitted ? "Attempt recorded" : "Check answers"}
      </motion.button>

      {/* Score feedback */}
      {submitted && feedback && typeof feedback.correct === "number" && (
        <p className="text-sm font-bold"
          style={{ color: feedback.ok ? "#86efac" : "rgba(255,255,255,0.5)" }}>
          {feedback.correct}/{feedback.total} correct
        </p>
      )}
    </motion.div>
  );


}






// Estado para navegación dentro de ejercicios
const [currentExercise, setCurrentExercise] = useState(0);

const nextExercise = () => {
  if (activeLesson?.ejercicios && currentExercise < activeLesson.ejercicios.length - 1) {
    setCurrentExercise((prev) => prev + 1);
  }
};

const prevExercise = () => {
  if (currentExercise > 0) setCurrentExercise((prev) => prev - 1);
};


const dataReady = role === "alumno" ? allDataLoaded : true;
  /* =========================================================
     🔹 Guards de acceso
     ========================================================= */
if (!authReady || authLoading || loading || !dataReady) {
  return <LoaderUi />
}

  const canAccess =
    role === "admin" ||
    role === "profesor" ||
    (user?.email && (curso?.cursantes || []).includes(user.email));

  if (!curso || !canAccess) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0C212D] via-[#112C3E] to-[#0C212D] grid place-items-center px-6 py-12 relative overflow-hidden">
      
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#EE7203]/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#FF3816]/5 rounded-full blur-3xl"></div>
      
      {/* Card principal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative max-w-lg w-full"
      >
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#EE7203] via-[#FF3816] to-[#EE7203] rounded-3xl blur-xl opacity-20"></div>
        
        {/* Card content */}
        <div className="relative bg-gradient-to-br from-[#112C3E] to-[#0C212D] rounded-3xl border-2 border-[#EE7203]/30 p-10 shadow-2xl">
          
          {/* Icono con animación */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-[#EE7203] to-[#FF3816] shadow-lg shadow-[#EE7203]/50 grid place-items-center mb-6"
          >
            <FiAlertTriangle size={36} className="text-white" />
          </motion.div>

          {/* Título */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-black text-white text-center mb-3"
          >
            {t("coursePlayer.noAccessTitle")}
          </motion.h2>

          {/* Descripción */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-base text-white/70 text-center leading-relaxed mb-8"
          >
            {t("coursePlayer.noAccessDescription")}
          </motion.p>

          {/* Línea decorativa */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-[#EE7203]/30 to-transparent mb-8"></div>

          {/* Botón de acción */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(dashboardRoute)}
            className="w-full bg-gradient-to-r from-[#EE7203] via-[#FF3816] to-[#EE7203] bg-size-200 bg-pos-0 hover:bg-pos-100 text-white font-bold text-base py-4 rounded-xl shadow-lg shadow-[#EE7203]/30 transition-all duration-500 flex items-center justify-center gap-3 group"
            style={{ backgroundSize: '200% 100%' }}
          >
            <FiChevronLeft className="group-hover:-translate-x-1 transition-transform" />
            <span>{t("coursePlayer.goBack")}</span>
          </motion.button>

          {/* Mensaje adicional */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xs text-white/50 text-center mt-6"
          >
            Si crees que esto es un error, contacta con soporte
          </motion.p>
        </div>

        {/* Badge decorativo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="absolute -bottom-4 -right-4 bg-[#0C212D] border-2 border-[#EE7203] rounded-full px-4 py-2 shadow-xl"
        >
        </motion.div>
      </motion.div>
    </div>
  );
}





/* =========================================================
   🧩 CapstoneForm — entrega final (Drive link)
   ========================================================= */
function CapstoneForm({
  courseId,
  lessonkey,
  onSubmit,
}: {
  courseId: string;
  lessonKey: string;
  onSubmit: (link: string) => void;
}) {
  const [link, setLink] = useState("");
  return (
    <div className="space-y-3">
      <input
        type="url"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        placeholder="https://drive.google.com/..."
        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
      />
      <button
        onClick={() => {
          if (!link.trim()) return toast.error("Por favor, ingresa un enlace válido.");
          onSubmit(link);
        }}
        className="px-4 py-2 bg-yellow-400 text-black font-semibold rounded hover:bg-yellow-300"
      >
        Enviar entrega
      </button>
    </div>
  );
}

const currentUnit = units[activeU];


// ✅ Función de comparación personalizada
function arePropsEqual(prevProps, nextProps) {
  return (
    prevProps.title === nextProps.title &&
    prevProps.description === nextProps.description &&
    prevProps.total === nextProps.total &&
    prevProps.completed === nextProps.completed &&
    // Comparamos el array de lecciones por longitud y keys (más rápido que referencia)
    prevProps.previewLessons.length === nextProps.previewLessons.length &&
    prevProps.previewLessons[0]?.key === nextProps.previewLessons[0]?.key
  );
}

// 🔥 Componente auxiliar para las tarjetas de estadísticas
const StatCard = React.memo(({ icon: Icon, value, label, color }) => {
  const colors = {
    purple: "from-purple-50 to-purple-100 border-purple-200 bg-purple-500 text-purple-700 text-purple-900",
    emerald: "from-emerald-50 to-emerald-100 border-emerald-200 bg-emerald-500 text-emerald-700 text-emerald-900",
    orange: "from-orange-50 to-orange-100 border-orange-200 bg-[#EE7203] text-orange-700 text-orange-900"
  };

  const [bgFrom, bgTo, borderColor, iconBg, labelColor, valueColor] = colors[color].split(' ');

  return (
    <div className={`bg-gradient-to-br ${bgFrom} ${bgTo} border-2 ${borderColor} rounded-xl md:rounded-2xl p-4 md:p-6 flex sm:block items-center justify-between sm:justify-start hover:scale-105 transition-transform`}>
      <div className="flex items-center gap-3 sm:mb-3">
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${iconBg} flex items-center justify-center shadow-lg`}>
          <Icon className="text-white" size={20} />
        </div>
        <p className={`sm:hidden text-sm font-bold ${labelColor}`}>{label}</p>
      </div>
      <div className="text-right sm:text-left">
        <div className={`text-2xl md:text-4xl font-black ${valueColor}`}>{value}</div>
        <p className={`hidden sm:block text-xs md:text-sm font-bold ${labelColor} mt-1`}>{label}</p>
      </div>
    </div>
  );
});





  /* =========================================================
     🔹 UI inicial 
     ========================================================= */
 return (
 <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-white text-slate-900">
   
      {/* ======================= SIDEBAR IZQUIERDA (CORREGIDO) ======================= */}
{/* CAMBIOS: 
    1. Quitamos 'sticky' y 'top-0' (no son necesarios en este layout flex).
    2. Cambiamos 'h-screen' por 'h-full' (para respetar el contenedor padre y no cortarse).
    3. Aseguramos z-index por si acaso.
*/}
<aside className="w-80 hidden xl:block shrink-0 bg-gradient-to-b from-[#0C212D] via-[#112C3E] to-[#0C212D] h-full overflow-y-auto shadow-2xl z-30">
  
  {/* Header con efecto de luz */}
  <div className="relative p-6 border-b border-[#EE7203]/20">
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#EE7203] to-transparent"></div>
    <button
    data-tutorial="back-home"
      onClick={() => router.push(dashboardRoute)}
      className="flex items-center gap-2 text-sm text-white/70 hover:text-white font-semibold transition-all group"
    >
      <div className="w-8 h-8 rounded-lg bg-[#EE7203]/20 flex items-center justify-center group-hover:bg-[#EE7203]/30 transition-colors">
        <FiChevronLeft className="text-[#EE7203] group-hover:text-[#FF3816] transform group-hover:-translate-x-0.5 transition-all" />
      </div>
      <span>{t("coursePlayer.sidebar.backHome")}</span>
    </button>
  </div>

  {/* Info del curso */}
  <div className="p-6 border-b border-[#EE7203]/10">
    <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 shadow-xl">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-2 h-2 rounded-full bg-[#EE7203] animate-pulse mt-2"></div>
        <h1 className="text-xl font-black text-white line-clamp-2 leading-tight">
          {curso.titulo}
        </h1>
      </div>
      <p className="text-xs text-white/60 line-clamp-3 leading-relaxed ml-5">
        {curso.descripcion}
      </p>
    </div>
  </div>

  {/* Navigation */}
  {/* El pb-32 aquí es vital para que el scroll llegue hasta el final con holgura */}
  <nav
  data-tutorial="sidebar-units"
   className="p-4 space-y-3 pb-32">
    {units.map((u, uIdx) => {
      // Cierre del curso
      if (u.id === "closing-course") {
        const l = u.lessons?.[0];
        const done = l && (progress[l.key]?.videoEnded || progress[l.key]?.exSubmitted);
        const active = activeU === uIdx && activeL === 0;

        return (
          <div key={u.id} className="mt-6 pt-4">
            <div className="relative">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#EE7203]/30 to-transparent"></div>
            </div>
            
            <div className="px-3 py-3 mt-4 flex items-center gap-2 text-white/80 font-bold text-sm">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EE7203] to-[#FF3816] flex items-center justify-center shadow-lg">
                <span className="text-xl">🎓</span>
              </div>
              <span>{t("coursePlayer.sidebar.courseClosing")}</span>
            </div>
            
            <button
              onClick={() => {
                setActiveU(uIdx);
                setActiveL(0);
              }}
              className={`block w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all mt-2 ${
                active
                  ? "bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white shadow-lg shadow-[#EE7203]/20"
                  : done
                  ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30"
                  : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="truncate">{l?.title || t("coursePlayer.sidebar.courseClosing")}</span>
                {done && <FiCheckCircle size={16} className="text-emerald-400 flex-shrink-0" />}
              </div>
            </button>
          </div>
        );
      }

      const unitNumber = units.slice(0, uIdx).filter((x) => x.id !== "closing-course").length + 1;

      return (
        <div key={u.id}>
          <button
            onClick={() =>
              setExpandedUnits((prev) => ({ ...prev, [uIdx]: !prev[uIdx] }))
            }
            className={`w-full text-left px-4 py-4 font-bold flex justify-between items-center rounded-xl transition-all border ${
              expandedUnits[uIdx]
                ? "bg-gradient-to-r from-[#EE7203]/20 to-[#FF3816]/20 text-white border-[#EE7203]/40 shadow-lg"
                : "bg-white/5 hover:bg-white/10 text-white/80 border-white/10"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                expandedUnits[uIdx]
                  ? "bg-gradient-to-br from-[#EE7203] to-[#FF3816] text-white"
                  : "bg-white/10 text-white/60"
              }`}>
                {unitNumber}
              </div>
              <span className="text-sm">{u.title}</span>
            </div>
            <FiChevronRight
              className={`transition-transform flex-shrink-0 ${
                expandedUnits[uIdx] ? "rotate-90 text-[#EE7203]" : "text-white/40"
              }`}
              size={18}
            />
          </button>

          {expandedUnits[uIdx] && (
            <div className="mt-2 space-y-1.5 ml-3 pl-4 border-l-2 border-[#EE7203]/20">
              {u.lessons.map((l, lIdx) => {
                const done = progress[l.key]?.videoEnded || progress[l.key]?.exSubmitted;
                const active = activeU === uIdx && activeL === lIdx;
                return (
                  <button
                    key={l.key}
                    onClick={() => {
                      setActiveU(uIdx);
                      setActiveL(lIdx);
                    }}
                    className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? "bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white shadow-md"
                        : done
                        ? "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/20"
                        : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs">
                        {l.id === "closing"
                          ? `🏁 ${t("coursePlayer.sidebar.unitClosing")}`
                          : `${uIdx + 1}.${lIdx + 1}  ${l.title}`}
                      </span>
                      {done && (
                        <FiCheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      );
    })}
  </nav>
</aside>
    {/* ======================= CONTENIDO PRINCIPAL ======================= */}
    {/* Agregado w-full para asegurar que ocupe el ancho en mobile */}
<main className={`flex-1 w-full relative z-0 ${
  activeLesson?.id === "intro"
    ? "overflow-hidden h-full bg-[#0C212D]"
    : "overflow-y-auto bg-[#0C212D]"
}`}>
  
  {/* INTRODUCCIÓN ESPECIAL DE LA UNIDAD */}
  {activeLesson?.id === "intro" && introDataStable && isProgressReady ? (
    // Sin max-w-6xl para que ocupe todo el ancho
    <div className="h-full w-full">
      <EnhancedCourseIntro
        title={introDataStable.title}
        description={introDataStable.description}
        total={introDataStable.total}
        completed={introDataStable.completed}
        previewLessons={introDataStable.previewLessons}
        goNextLesson={goNextLesson}
        t={t}
      />
    </div>
  ) 

 : (
    <div className="relative min-h-full">

      {/* ── Fondo con grid geométrico (mismo que intro) ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="maingrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#EE7203" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#maingrid)" />
        </svg>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] opacity-10"
          style={{ background: "radial-gradient(circle, #EE7203 0%, transparent 65%)" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] opacity-8"
          style={{ background: "radial-gradient(circle, #FF3816 0%, transparent 65%)" }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-8 pb-28 mt-12 xl:mt-0">

        {/* ══════════════════════════════════════
            LESSON HEADER
        ══════════════════════════════════════ */}
        <motion.div
          data-tutorial="lesson-header"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative"
        >
          {/* Línea superior naranja */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute top-0 left-0 right-0 h-[2px] origin-left"
            style={{ background: "linear-gradient(90deg, #EE7203, #FF3816, transparent)" }}
          />

          <div
            className="pt-5 pb-6 px-6 md:px-8 flex flex-col md:flex-row items-start justify-between gap-4"
            style={{ borderBottom: "1px solid rgba(238,114,3,0.15)" }}
          >
            <div className="flex-1 space-y-2">
              {/* Unidad label */}
              <p className="text-[10px] font-black uppercase tracking-[0.25em]"
                style={{ color: "#EE7203" }}>
                {units[activeU]?.title}
              </p>
              {/* Título lección */}
              <h1
                className="text-3xl md:text-5xl font-black text-white leading-[1.05]"
                style={{ letterSpacing: "-0.02em" }}
              >
                {activeLesson?.title || t("coursePlayer.sidebar.lessonCurrent")}
              </h1>
              {activeLesson?.description && (
                <p className="text-white/50 text-sm md:text-base leading-relaxed font-medium max-w-2xl pt-1">
                  {activeLesson.description}
                </p>
              )}
            </div>

            {/* Badge de estado */}
            <div
              className="flex items-center gap-2 px-4 py-2 self-start"
              style={{
                background: currentLessonStatus === "completed"
                  ? "rgba(34,197,94,0.12)"
                  : "rgba(238,114,3,0.12)",
                border: `1px solid ${currentLessonStatus === "completed" ? "rgba(34,197,94,0.4)" : "rgba(238,114,3,0.4)"}`,
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: currentLessonStatus === "completed" ? "#22c55e" : "#EE7203",
                  boxShadow: `0 0 6px ${currentLessonStatus === "completed" ? "#22c55e" : "#EE7203"}`,
                }}
              />
              <span
                className="text-xs font-black uppercase tracking-wider"
                style={{ color: currentLessonStatus === "completed" ? "#22c55e" : "#EE7203" }}
              >
                {currentLessonStatus === "completed"
                  ? t("coursePlayer.sidebar.completed")
                  : t("coursePlayer.sidebar.inProgress")}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════
            VIDEO
        ══════════════════════════════════════ */}
        {resolvedVideoUrl && (
          <motion.div
            data-tutorial="video-player"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative"
          >
            {/* Glow sutil */}
            <div className="absolute -inset-px opacity-60"
              style={{ background: "linear-gradient(135deg, #EE7203, #FF3816, transparent, transparent)", borderRadius: 0 }} />
            <div className="relative aspect-video bg-black overflow-hidden"
              style={{ border: "1px solid rgba(238,114,3,0.3)" }}>
              <iframe
                id="vimeo-player"
                src={resolvedVideoUrl}
                className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media; web-share"
                allowFullScreen
              />
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════
            PDF
        ══════════════════════════════════════ */}
        {activeLesson?.pdfUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            style={{ border: "1px solid rgba(238,114,3,0.2)" }}
          >
            {/* Header PDF */}
            <div className="flex items-center gap-4 px-6 py-4"
              style={{
                background: "#112C3E",
                borderBottom: "1px solid rgba(238,114,3,0.2)"
              }}>
              <div className="w-1 h-8"
                style={{ background: "linear-gradient(180deg, #EE7203, #FF3816)" }} />
              <div>
                <p className="text-white font-black text-sm uppercase tracking-wider">
                  {t("coursePlayer.sidebar.bibliography")}
                </p>
                <p className="text-white/40 text-xs">
                  {t("coursePlayer.sidebar.downloadPdf")}
                </p>
              </div>
            </div>
            <div className="p-4 bg-[#0C212D]">
              <iframe
                src={toEmbedPdfUrl(activeLesson.pdfUrl)}
                className="w-full h-[400px] md:h-[600px]"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                title="Resumen PDF"
              />
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════
            ACADEMIC CONTENT (theory / vocab / exercises)
        ══════════════════════════════════════ */}
        {(activeLesson?.theory ||
          activeLesson?.vocabulary ||
          (Array.isArray(activeLesson?.ejercicios) && activeLesson.ejercicios.length > 0)) && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-0"
            style={{ border: "1px solid rgba(238,114,3,0.2)" }}
          >

            {/* ── TABS ── */}
            <div
              data-tutorial="content-tabs"
              className="flex overflow-x-auto"
              style={{ borderBottom: "1px solid rgba(238,114,3,0.2)", background: "#112C3E" }}
            >
              {activeLesson?.theory && (
                <button
                  onClick={() => setActiveTab("theory")}
                  className="relative flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap"
                  style={{
                    color: activeTab === "theory" ? "#EE7203" : "rgba(255,255,255,0.35)",
                    borderBottom: activeTab === "theory" ? "2px solid #EE7203" : "2px solid transparent",
                    background: activeTab === "theory" ? "rgba(238,114,3,0.08)" : "transparent",
                  }}
                >
                  <span>📖</span>
                  {t("coursePlayer.tabs.theory")}
                </button>
              )}
              {activeLesson?.vocabulary && (
                <button
                  onClick={() => setActiveTab("vocabulary")}
                  className="relative flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap"
                  style={{
                    color: activeTab === "vocabulary" ? "#EE7203" : "rgba(255,255,255,0.35)",
                    borderBottom: activeTab === "vocabulary" ? "2px solid #EE7203" : "2px solid transparent",
                    background: activeTab === "vocabulary" ? "rgba(238,114,3,0.08)" : "transparent",
                  }}
                >
                  <span>📝</span>
                  {t("coursePlayer.tabs.vocabulary")}
                </button>
              )}
              {Array.isArray(activeLesson?.ejercicios) && activeLesson.ejercicios.length > 0 && (
                <button
                  onClick={() => setActiveTab("exercises")}
                  className="relative flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap"
                  style={{
                    color: activeTab === "exercises" ? "#EE7203" : "rgba(255,255,255,0.35)",
                    borderBottom: activeTab === "exercises" ? "2px solid #EE7203" : "2px solid transparent",
                    background: activeTab === "exercises" ? "rgba(238,114,3,0.08)" : "transparent",
                  }}
                >
                  <span>🧠</span>
                  {t("coursePlayer.tabs.exercises")}
                  <span
                    className="ml-1 px-2 py-0.5 text-[10px] font-black"
                    style={{
                      background: "rgba(238,114,3,0.15)",
                      color: "#EE7203",
                      border: "1px solid rgba(238,114,3,0.3)",
                    }}
                  >
                    {activeLesson.ejercicios.length}
                  </span>
                </button>
              )}
            </div>

            {/* ── TAB CONTENT ── */}
            <div style={{ background: "#0C212D" }}>

              {/* TEORÍA */}
              {activeTab === "theory" && activeLesson?.theory && (
                <motion.div
                  data-tutorial="theory-content"
                  key="theory"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35 }}
                  className="p-6 md:p-10"
                >
                  {/* Section label */}
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-1 h-10"
                      style={{ background: "linear-gradient(180deg, #EE7203, #FF3816)" }} />
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black text-white"
                        style={{ letterSpacing: "-0.02em" }}>
                        {t("coursePlayer.tabs.theoryTitle")}
                      </h2>
                      <p className="text-white/40 text-xs uppercase tracking-widest font-bold mt-0.5">
                        {t("coursePlayer.tabs.theorySubtitle")}
                      </p>
                    </div>
                  </div>

                  <div
  className="
    prose prose-invert max-w-none
    prose-headings:text-white prose-headings:font-black prose-headings:tracking-tight
    prose-p:text-white/70 prose-p:leading-relaxed prose-p:text-base
    prose-strong:text-white prose-strong:font-bold
    prose-a:text-[#EE7203] prose-a:font-semibold prose-a:no-underline
    prose-li:text-white/70
    prose-blockquote:border-l-[#EE7203] prose-blockquote:text-white/60
    prose-code:text-[#EE7203] prose-code:bg-white/5 prose-code:px-1
  "
  style={{
    color: "rgba(255,255,255,0.75)",
  }}
>
  <style>{`
    .theory-content * { color: inherit !important; }
    .theory-content p { color: rgba(255,255,255,0.72) !important; }
    .theory-content strong, .theory-content b { color: white !important; }
    .theory-content h1, .theory-content h2, .theory-content h3,
    .theory-content h4, .theory-content h5, .theory-content h6 { color: white !important; }
    .theory-content a { color: #EE7203 !important; }
    .theory-content li { color: rgba(255,255,255,0.72) !important; }
    .theory-content code { color: #EE7203 !important; background: rgba(255,255,255,0.05) !important; }
  `}</style>
  <div className="theory-content">
    <MarkdownWYSIWYG>
      {activeLesson.theory}
    </MarkdownWYSIWYG>
  </div>
</div>
                </motion.div>
              )}

              {/* VOCABULARY */}
              {activeTab === "vocabulary" && activeLesson?.vocabulary && (
                <motion.div
                  key="vocabulary"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35 }}
                  className="p-6 md:p-10"
                >
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-1 h-10"
                      style={{ background: "linear-gradient(180deg, #EE7203, #FF3816)" }} />
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black text-white"
                        style={{ letterSpacing: "-0.02em" }}>
                        {t("coursePlayer.tabs.vocabTitle")}
                      </h2>
                      <p className="text-white/40 text-xs uppercase tracking-widest font-bold mt-0.5">
                        {t("coursePlayer.tabs.vocabSubtitle")}
                      </p>
                    </div>
                  </div>

                  {/* Vocabulary table — dark */}
                  {(!activeLesson.vocabulary.mode || activeLesson.vocabulary.mode === "table") && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ borderBottom: "2px solid rgba(238,114,3,0.4)" }}>
                            {["Term", "Meaning", "Example"].map((h) => (
                              <th key={h} className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest"
                                style={{ color: "#EE7203" }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {activeLesson.vocabulary.entries?.map((row: any, idx: number) => (
                            <tr key={idx}
                              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                              className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-4 py-3 font-bold text-white">{row.term}</td>
                              <td className="px-4 py-3 text-white/70">{row.translation}</td>
                              <td className="px-4 py-3 text-white/50 italic">{row.example || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {activeLesson.vocabulary.mode === "image" && activeLesson.vocabulary.imageUrl && (
                    <img
                      src={activeLesson.vocabulary.imageUrl}
                      alt="Vocabulary chart"
                      className="max-w-full"
                      style={{ border: "1px solid rgba(238,114,3,0.2)" }}
                    />
                  )}
                </motion.div>
              )}

              {/* EXERCISES */}
              {activeTab === "exercises" &&
                Array.isArray(activeLesson?.ejercicios) &&
                activeLesson.ejercicios.length > 0 && (
                <motion.div
                  data-tutorial="exercises-section"
                  key="exercises"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35 }}
                  className="p-6 md:p-10 space-y-8"
                >
                  {/* Header ejercicios */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    style={{ borderBottom: "1px solid rgba(238,114,3,0.15)", paddingBottom: "1.5rem" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-10"
                        style={{ background: "linear-gradient(180deg, #EE7203, #FF3816)" }} />
                      <div>
                        <h2 className="text-2xl md:text-3xl font-black text-white"
                          style={{ letterSpacing: "-0.02em" }}>
                          {t("coursePlayer.tabs.exercisesTitle")}
                        </h2>
                        <p className="text-white/40 text-xs uppercase tracking-widest font-bold mt-0.5">
                          {t("coursePlayer.tabs.exercisesSubtitle")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 self-start sm:self-auto"
                      style={{
                        border: "1px solid rgba(238,114,3,0.3)",
                        background: "rgba(238,114,3,0.08)",
                      }}>
                      <span className="text-2xl font-black" style={{ color: "#EE7203" }}>
                        {activeLesson.ejercicios.length}
                      </span>
                      <span className="text-xs font-black uppercase tracking-widest text-white/40">
                        Exercises
                      </span>
                    </div>
                  </div>

                  {/* Lista de ejercicios */}
                  <div className="space-y-6">
                    {activeLesson.ejercicios.map((ejercicio: any, exerciseIndex: number) => {
                      const ejercicioId = ejercicio.id || `ex${exerciseIndex}`;
                      const exerciseKey = `${activeLesson.key}::${ejercicioId}`;
                      const savedData = progress[exerciseKey];

                      return (
                        <motion.div
                          key={ejercicioId}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: exerciseIndex * 0.07 }}
                        >
                          <ExerciseRunner
                            ejercicios={[ejercicio]}
                            lessonKey={activeLesson.key}
                            exerciseId={ejercicioId}
                            batchId={userProfile?.batchId}
                            userKey={userProfile?.userKey}
                            courseId={courseId}
                            savedData={savedData}
                            onSubmit={() => {}}
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════
            FINAL MESSAGE
        ══════════════════════════════════════ */}
        {activeLesson?.finalMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-start gap-4 p-6"
            style={{
              border: "1px solid rgba(34,197,94,0.3)",
              background: "rgba(34,197,94,0.06)",
            }}
          >
            <span className="text-2xl">🎉</span>
            <div>
              <h3 className="font-black text-white text-lg mb-1">
                {t("coursePlayer.cta.excellentWork")}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                {activeLesson.finalMessage}
              </p>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════
            NEXT LESSON CTA
        ══════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex justify-center pt-4 pb-6"
        >
          <motion.button
            data-tutorial="next-lesson"
            onClick={goNextLesson}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="group relative flex items-center gap-4 px-8 py-5 font-black text-base text-white overflow-hidden w-full sm:w-auto justify-center"
            style={{ background: "linear-gradient(135deg, #EE7203 0%, #FF3816 100%)" }}
          >
            {/* Shine on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%)" }} />
            <span style={{ letterSpacing: "0.02em" }}>
              {t("coursePlayer.cta.continueNext")}
            </span>
            <div className="w-8 h-8 border border-white/30 flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <FiChevronRight size={16} />
            </div>
          </motion.button>
        </motion.div>

      </div>
    </div>
  )}
        
    </main>

   {/* ======================= SIDEBAR DERECHA (Desktop) ======================= */}
<aside data-tutorial="progress-sidebar" className="hidden xl:block xl:w-80 xl:shrink-0 sticky top-0 h-screen overflow-y-auto"
  style={{ background: "#112C3E", borderLeft: "1px solid rgba(238,114,3,0.15)" }}>

  {/* Header */}
  <div className="relative p-6" style={{ borderBottom: "1px solid rgba(238,114,3,0.15)" }}>
    <motion.div
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.7 }}
      className="absolute top-0 left-0 right-0 h-[2px] origin-left"
      style={{ background: "linear-gradient(90deg, #EE7203, #FF3816, transparent)" }}
    />
    <div className="flex items-center gap-3 pt-2">
      <div className="w-1 h-7" style={{ background: "linear-gradient(180deg, #EE7203, #FF3816)" }} />
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/50">
        {t("coursePlayer.sidebar.summary")}
      </h3>
    </div>
    <p className="text-xs text-white/35 leading-relaxed mt-3 ml-4 line-clamp-3">
      {curso?.descripcion || t("coursePlayer.sidebar.noDescription")}
    </p>
  </div>

  {/* Lección actual */}
  <div className="p-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: "#EE7203" }}>
      {t("coursePlayer.sidebar.lessonCurrent")}
    </p>
    <div className="space-y-2">
      <p className="text-[10px] text-white/35 uppercase tracking-widest font-bold">
        {units[activeU]?.title || "—"}
      </p>
      <p className="font-black text-white text-sm leading-snug">
        {activeLesson?.title || "—"}
      </p>
      {activeLesson?.description && (
        <p className="text-xs text-white/40 leading-relaxed line-clamp-2">
          {activeLesson.description}
        </p>
      )}
    </div>
  </div>

  {/* Stats progreso */}
  <div className="p-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
    <div className="grid grid-cols-2 gap-0" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex flex-col items-center py-4"
        style={{ borderRight: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="text-3xl font-black" style={{ color: "#EE7203" }}>{completedCount}</div>
        <div className="text-[10px] text-white/35 uppercase tracking-widest font-bold mt-1">
          {t("coursePlayer.sidebar.completed")}
        </div>
      </div>
      <div className="flex flex-col items-center py-4">
        <div className="text-3xl font-black" style={{ color: "#FF3816" }}>{totalLessons}</div>
        <div className="text-[10px] text-white/35 uppercase tracking-widest font-bold mt-1">
          {t("coursePlayer.sidebar.total")}
        </div>
      </div>
    </div>

    {/* Progress bar */}
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-white/35 uppercase tracking-widest font-bold">
          {t("coursePlayer.sidebar.progress")}
        </span>
        <span className="text-xs font-black" style={{ color: "#EE7203" }}>
          {progressPercent}%
        </span>
      </div>
      <div className="h-[3px] w-full" style={{ background: "rgba(255,255,255,0.08)" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full"
          style={{ background: "linear-gradient(90deg, #EE7203, #FF3816)" }}
        />
      </div>
    </div>
  </div>

  {/* Bibliography download */}
  <div data-tutorial="bibliography-download" className="p-6"
    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
    <DownloadBibliographyButton
      unit={currentUnit}
      courseTitle={curso?.titulo}
    />
  </div>

  {/* Keep going */}
  <div className="p-6">
    <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.25)" }}>
      💪 {t("coursePlayer.sidebar.keepGoing")}
    </p>
  </div>

</aside>

    {/* 📚 MODAL DE VIDEO DEL COURSE PLAYER */}
    <CoursePlayerVideoModal
      videoUrl="https://player.vimeo.com/video/1146041029" 
      courseTitle={curso?.titulo || "Material Académico"} 
      autoShow={true}
      videoType="youtube"
    /> 

    {/* {!loadingCoursePlayerTutorialStatus && !hasSeenCoursePlayerTutorial && (
  <CoursePlayerTutorial
    onComplete={markCoursePlayerTutorialAsSeen}
    onSkip={markCoursePlayerTutorialAsSeen}
  />
)} */}

    <MobileMenu
      curso={curso}
      units={units}
      progress={progress}
      activeU={activeU}
      activeL={activeL}
      setActiveU={setActiveU}
      setActiveL={setActiveL}
      expandedUnits={expandedUnits}
      setExpandedUnits={setExpandedUnits}
      activeLesson={activeLesson}
      currentUnit={units[activeU]}
      router={router}
      t={t}
      DownloadBibliographyButton={DownloadBibliographyButton}
    />
  </div>
);


}