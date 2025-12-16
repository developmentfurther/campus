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
} from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import { db as firestore, storage } from "@/lib/firebase";
import { getCourseProgressStats } from "@/contexts/AuthContext";
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
  const { user, role, authReady, loading: authLoading, userProfile, saveCourseProgress, getCourseProgress } = useAuth();
  const { t } = useI18n();


  // 🔸 Estados principales
  const [curso, setCurso] = useState<Curso | null>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUnits, setExpandedUnits] = useState<Record<number, boolean>>({});
  const [activeU, setActiveU] = useState(0);
  const [activeL, setActiveL] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("theory");


  // 🔸 Progreso del usuario
  const [progress, setProgress] = useState<Record<string, any>>({});

  // 🔸 Control de medios
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string | null>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);



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
  


/* =========================================================
   🔹 Normalizar unidades (OPTIMIZADO con useMemo)
   ========================================================= */
const normalizedUnits = useMemo(() => {
  if (!curso) return [];

  console.log("📦 Normalizando curso (raw):", curso);

  const normalized: any[] = [];

  // 1️⃣ Detectar si el curso ya tiene contentTimeline
  const hasTimeline =
    Array.isArray((curso as any).contentTimeline) &&
    (curso as any).contentTimeline.length > 0;

  // 2️⃣ Construir una "timeline" base
  const timeline = hasTimeline
    ? (curso as any).contentTimeline
    : // 🔙 MODO LEGACY: si no hay contentTimeline, armamos uno simple
      (curso.unidades || []).map((u: any, idx: number) => ({
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

    // Procesar lecciones...
    const lessons = (u.lecciones || []).map((l: any, idxL: number) => {
      const lessonId = l.id || `lesson-${idxTimeline + 1}-${idxL + 1}`;

      // Detectar si es estructura nueva (blocks) o legacy
      const isNewStructure = Array.isArray(l.blocks) && l.blocks.length > 0;

      let title = "";
      let description = "";
      let theory = "";
      let videoUrl = "";
      let pdfUrl = "";
      let vocabulary = null;
      const ejercicios: any[] = [];

      if (isNewStructure) {
        // 🆕 NUEVA ESTRUCTURA: blocks[]
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
        // 🔙 LEGACY: campos directos
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
        text: "", // obsoleto, lo dejamos vacío
        theory,
        videoUrl,
        pdfUrl,
        vocabulary,
        ejercicios,
      };
    });

    // Introducción
    if (u.urlVideo || u.descripcion) {
  lessons.unshift({
    key: buildKey(unitId, "intro"),
    id: "intro",
    unitId,
    title: t("coursePlayer.sidebar.introduction"),
    description: u.descripcion || "",
    videoUrl: u.introVideo || "",
    ejercicios: [],
    pdfUrl: "",
    theory: "",
    // 🆕 Agregamos el resumen de la unidad
    unitSummary: u.titulo || "",
    lessonsCount: (u.lecciones || []).length,
  });
}


    normalized.push({
      id: unitId,
      title: u.titulo || `Unidad ${idxTimeline + 1}`,
      description: u.descripcion || "",
      lessons,
    });
  });

  // FINAL EXAM
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

  // CAPSTONE PROJECT
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

  // CLOSING
  if (timeline.some(i => i.type === "closing") &&
     (curso.textoFinalCurso || curso.textoFinalCursoVideoUrl)) 
  {
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
  }

  // ⚠️ LEGACY: Si no hay contentTimeline y hay cierre de curso
  const hasClosingTimelineItem = hasTimeline &&
    (curso as any).contentTimeline?.some((it: any) => it.type === "closing");

  if (!hasClosingTimelineItem && (curso.textoFinalCurso || curso.textoFinalCursoVideoUrl)) {
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
}, [curso]); // 👈 Solo depende de 'curso', NO de 't'

// 🔥 Efecto separado para setear units y expandir primera unidad
useEffect(() => {
  setUnits(normalizedUnits);
  if (normalizedUnits.length > 0) {
    setExpandedUnits({ 0: true });
  }
}, [normalizedUnits]);


/* =========================================================
   🔹 Cargar progreso del curso (OPTIMIZADO - solo 1 vez)
   ========================================================= */
const progressLoadedRef = useRef(false);
const progressCacheRef = useRef<Record<string, any>>({});

useEffect(() => {
  async function loadProgress() {
    if (!user?.uid || !courseId || !getCourseProgress) return;

    // 🔥 Si ya cargamos progreso para este curso, no volver a traerlo
    const cacheKey = `${user.uid}-${courseId}`;
    if (progressLoadedRef.current && progressCacheRef.current[cacheKey]) {
      console.log("✅ Usando progreso en caché");
      setProgress(progressCacheRef.current[cacheKey]);
      return;
    }

    console.log("📚 Cargando progreso del curso desde Firestore...");
    
    try {
      const data = await getCourseProgress(user.uid, courseId);

      if (data?.byLesson) {
        // ✅ Normalizamos todas las keys para evitar duplicados en memoria
        const normalized: Record<string, any> = {};
        Object.entries(data.byLesson || {}).forEach(([key, val]) => {
          normalized[key] = val; // NO TOCAR KEYS
        });

        // 🔥 Guardar en caché y marcar como cargado
        progressCacheRef.current[cacheKey] = normalized;
        progressLoadedRef.current = true;
        setProgress(normalized);
        
        console.log("✅ Progreso cargado y cacheado:", Object.keys(normalized).length, "lecciones");
      } else {
        console.log("⚠️ No hay progreso previo guardado.");
        setProgress({});
        progressLoadedRef.current = true;
      }
    } catch (err) {
      console.error("❌ Error cargando progreso:", err);
      setProgress({});
    }
  }

  loadProgress();
}, [user?.uid, courseId]); // 👈 SOLO estas dependencias

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

const goNextLesson = async () => {
  const currentIdx = indexOfLesson(activeU, activeL);
  const currentLesson = flatLessons[currentIdx];

  // 1️⃣ NAVEGACIÓN INSTANTÁNEA (sin esperar Firebase)
  const nextIdx = currentIdx + 1;
  if (nextIdx < flatLessons.length) {
    const next = flatLessons[nextIdx];
    
    // 🟢 Actualizar UI INMEDIATAMENTE
    setActiveU(next.uIdx);
    setActiveL(next.lIdx);
    setExpandedUnits((p) => ({ ...p, [next.uIdx]: true }));
    
    // 🎯 Actualizar progreso local ANTES de Firebase
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
    router.push("/dashboard");
  }

  // 2️⃣ GUARDADO EN FIREBASE (en segundo plano, sin bloquear)
  if (
    currentLesson?.key &&
    activeLesson?.id !== "intro" &&
    user?.uid &&
    saveCourseProgress
  ) {
    // 🔥 NO USAR AWAIT - deja que corra en paralelo
    saveCourseProgress(user.uid, courseId, {
      [currentLesson.key]: { videoEnded: true },
    }).catch((err) => {
      console.error("❌ Error guardando progreso (silent):", err);
      // Opcional: podrías revertir el cambio local si falla
      // pero generalmente es mejor dejarlo así (optimistic)
    });
  }
};

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
  exerciseIndex,
  courseId,
  batchId,
  userKey,
  onSubmit,
}: {
  ejercicios: any[];
  lessonKey: string;
  exerciseIndex: number;
  courseId: string;
  batchId: string;
  userKey: string;
  onSubmit?: (r: { correct: number; total: number }) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    msg: string;
    correct?: number;
    total?: number;
  } | null>(null);

  const { user, saveCourseProgress, getCourseProgress } = useAuth();

  // 🔥 KEY GLOBAL ÚNICA
  const currentExerciseKey = useMemo(
    () => `${lessonKey}::ex${exerciseIndex}`,
    [lessonKey, exerciseIndex]
  );

  // 🔑 KEYS INTERNAS (input-level)
  const makeLocalKey = (exId: string, subId?: string) =>
    subId
      ? `${currentExerciseKey}::${exId}::${subId}`
      : `${currentExerciseKey}::${exId}`;

  /** =====================================================================================
   * 🧠 RESTORE ESTADO ANTES GUARDADO
   ===================================================================================== */
  useEffect(() => {
    async function load() {
    if (!user?.uid) return;

    // 🛑 Si el padre ya tiene progreso cargado → NO refetch
    const parentProgress = progress?.[currentExerciseKey];
    if (parentProgress) {
      console.log("⏭ No refetch — progreso ya cargado en padre");
      return;
    }
      console.log("⟳ Fetching progreso desde Firestore...");
    const prev = await getCourseProgress(user.uid, courseId);

      if (!prev?.exSubmitted) {
        setSubmitted(false);
        setAnswers({});
        setFeedback(null);
        return;
      }

      // 🟢 Ya había respondido → restaurar
      setSubmitted(true);

      const ex = ejercicios[0];
      const restored: Record<string, any> = {};

      if (!ex) return;

      // restore según tipo
      if (ex.type === "reading" || ex.type === "listening") {
        ex.questions.forEach((q: any) => {
          const key = makeLocalKey(ex.id, q.id);
          restored[key] = prev.score?.answers?.[key];
        });
      } else if (ex.type === "fill_blank") {
        const key = makeLocalKey(ex.id);
        restored[key] = prev.score?.answers?.[key] || [];
      } else if (ex.type === "matching") {
        ex.pairs.forEach((_: any, idx: number) => {
          const key = makeLocalKey(ex.id, String(idx));
          restored[key] = prev.score?.answers?.[key];
        });
      } else if (ex.type === "reflection") {
        const n = ex.ideasCount || 3;
        for (let i = 0; i < n; i++) {
          const key = makeLocalKey(ex.id, `idea${i}`);
          restored[key] = prev.score?.answers?.[key];
        }
      } else {
        const key = makeLocalKey(ex.id);
        restored[key] = prev.score?.answers?.[key];
      }

      setAnswers(restored);

      setFeedback({
        ok: prev.exPassed,
        msg: prev.exPassed ? "Ejercicio aprobado" : "Intento previo guardado",
        correct: prev.score.correct,
        total: prev.score.total,
      });
    }

    load();
  }, [user?.uid, courseId, currentExerciseKey, ejercicios]);

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

const renderReading = (ex: any) => {
  return (
    <div className="space-y-6">
      {/* Texto */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 max-w-[800px]">
        {ex.title && (
          <h4 className="font-semibold text-slate-900 mb-2 text-lg">
            {ex.title}
          </h4>
        )}
        <p className="text-slate-700 whitespace-pre-line leading-relaxed break-words">
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
            <div
              key={q.id}
              className="border border-slate-300 rounded-xl p-4 bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <h5 className="font-medium mb-2 text-slate-800">
                  {idx + 1}. {q.prompt}
                </h5>

                {submitted && (
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      isCorrect
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {isCorrect
  ? t("coursePlayer.exercise.correct")
  : t("coursePlayer.exercise.incorrect")}
                  </span>
                )}
              </div>

              {/* MC */}
              {q.kind === "mc" &&
                q.options.map((opt: string, i: number) => {
                  const selected = val === i;
                  const isOptCorrect = i === q.correctIndex;

                  const base =
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition";

                  const color = submitted
                    ? isOptCorrect
                      ? "bg-emerald-50 border-emerald-300"
                      : selected
                      ? "bg-rose-50 border-rose-300"
                      : "bg-white border-slate-200"
                    : selected
                    ? "bg-blue-50 border-blue-300"
                    : "bg-white border-slate-300 hover:bg-slate-100";

                  return (
                    <label key={i} className={`${base} ${color}`}>
                      <input
                        type="radio"
                        disabled={submitted}
                        checked={selected}
                        onChange={() => handleAnswer(qKey, i)}
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}

              {/* TRUE/FALSE */}
              {q.kind === "tf" && (
                <div className="flex gap-3">
                  {[true, false].map((v) => {
                    const selected = val === v;
                    const isOptCorrect = q.answer === v;

                    const base =
                      "flex items-center gap-3 px-4 py-2 rounded-lg border cursor-pointer transition";

                    const color = submitted
                      ? isOptCorrect
                        ? "bg-emerald-50 border-emerald-300"
                        : selected
                        ? "bg-rose-50 border-rose-300"
                        : "bg-white border-slate-200"
                      : selected
                      ? "bg-blue-50 border-blue-300"
                      : "bg-white border-slate-300 hover:bg-slate-100";

                    return (
                      <label key={String(v)} className={`${base} ${color}`}>
                        <input
                          type="radio"
                          disabled={submitted}
                          checked={selected}
                          onChange={() => handleAnswer(qKey, v)}
                        />
                        <span>{v ? "True" : "False"}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {q.kind === "open" && (
  <div className="space-y-3">
    <textarea
      rows={4}
      disabled={submitted}
      value={answers[qKey] || ""}
      maxLength={q.maxLength || 500}
      onChange={(e) => handleAnswer(qKey, e.target.value)}
      placeholder={q.placeholder || "Escribe tu respuesta..."}
      className={`w-full p-3 rounded-xl border text-sm bg-white transition ${
        submitted
          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
          : "border-slate-300 focus:ring-2 focus:ring-blue-300"
      }`}
    />
    <p className="text-xs text-slate-500">
      {(answers[qKey] || "").length}/{q.maxLength || 500} characters
    </p>
  </div>
)}

              {submitted && !isCorrect && (
                <div className="text-xs text-rose-600 mt-2">
                  {q.kind === "mc" &&
                    `Correct answer: ${q.options[q.correctIndex]}`}
                  {q.kind === "tf" &&
                    `Correct answer: ${q.answer ? "True" : "False"}`}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const renderTable = (ex: any) => {
  // Helper para saber si una celda es blank
  const isBlankCell = (rowIdx: number, col: string) => {
    return (ex.blanks || []).some(
      b => b.rowIndex === rowIdx && b.column === col
    );
  };

  return (
    <div className="max-w-[750px] overflow-x-auto">
      {ex.title && (
        <h4 className="font-semibold text-slate-900 mb-4 text-lg">
          {ex.title}
        </h4>
      )}

      <table className="w-full border rounded-xl bg-white text-sm overflow-hidden shadow-sm">
        <thead className="bg-slate-100">
          <tr>
            <th className="border border-slate-300 px-4 py-3 text-left font-semibold text-slate-700">
              Subject
            </th>
            <th className="border border-slate-300 px-4 py-3 text-left font-semibold text-slate-700">
              Positive
            </th>
            <th className="border border-slate-300 px-4 py-3 text-left font-semibold text-slate-700">
              Negative
            </th>
          </tr>
        </thead>

        <tbody>
          {ex.rows.map((row: any, r: number) => (
            <tr key={r} className="hover:bg-slate-50 transition-colors">
              {/* Subject - siempre visible */}
              <td className="border border-slate-300 px-4 py-3 font-medium text-slate-900">
                {row.subject}
              </td>

              {/* Positive */}
              <td className="border border-slate-300 p-2">
                {isBlankCell(r, "positive") ? (
                  <input
                    disabled={submitted}
                    value={answers[makeLocalKey(ex.id, `${r}-positive`)] || ""}
                    onChange={(e) =>
                      handleAnswer(makeLocalKey(ex.id, `${r}-positive`), e.target.value)
                    }
                    placeholder="..."
                    className={`w-full px-3 py-2 rounded-lg border text-sm transition-all ${
                      submitted
                        ? (answers[makeLocalKey(ex.id, `${r}-positive`)] || "")
                            .trim()
                            .toLowerCase() ===
                          (ex.correct?.[`${r}-positive`] || "").trim().toLowerCase()
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-medium"
                          : "bg-rose-50 border-rose-300 text-rose-800"
                        : "border-slate-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    }`}
                  />
                ) : (
                  <span className="px-3 py-2 block text-slate-700">
                    {row.positive}
                  </span>
                )}
              </td>

              {/* Negative */}
              <td className="border border-slate-300 p-2">
                {isBlankCell(r, "negative") ? (
                  <input
                    disabled={submitted}
                    value={answers[makeLocalKey(ex.id, `${r}-negative`)] || ""}
                    onChange={(e) =>
                      handleAnswer(makeLocalKey(ex.id, `${r}-negative`), e.target.value)
                    }
                    placeholder="..."
                    className={`w-full px-3 py-2 rounded-lg border text-sm transition-all ${
                      submitted
                        ? (answers[makeLocalKey(ex.id, `${r}-negative`)] || "")
                            .trim()
                            .toLowerCase() ===
                          (ex.correct?.[`${r}-negative`] || "").trim().toLowerCase()
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-medium"
                          : "bg-rose-50 border-rose-300 text-rose-800"
                        : "border-slate-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    }`}
                  />
                ) : (
                  <span className="px-3 py-2 block text-slate-700">
                    {row.negative}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mostrar respuestas correctas después de enviar */}
      {submitted && (ex.blanks || []).some(b => {
        const key = `${b.rowIndex}-${b.column}`;
        const userAns = (answers[makeLocalKey(ex.id, key)] || "").trim().toLowerCase();
        const correctAns = (ex.correct?.[key] || "").trim().toLowerCase();
        return userAns !== correctAns;
      }) && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <p className="font-semibold text-blue-800 mb-2">📝 Respuestas correctas:</p>
          <ul className="space-y-1 text-blue-700">
            {(ex.blanks || []).map((b: any, i: number) => {
              const key = `${b.rowIndex}-${b.column}`;
              const userAns = (answers[makeLocalKey(ex.id, key)] || "").trim().toLowerCase();
              const correctAns = (ex.correct?.[key] || "").trim().toLowerCase();
              
              if (userAns === correctAns) return null;
              
              return (
                <li key={i}>
                  • Fila {b.rowIndex + 1} ({b.column}): <strong>{ex.correct?.[key]}</strong>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};


const renderFillBlank = (ex: any) => {
  const key = makeLocalKey(ex.id);
  const parts = ex.sentence.split("***");
  const current = answers[key] || [];

  return (
    <div className="space-y-4 max-w-[750px]">
      <div className="text-slate-800 text-base leading-relaxed whitespace-pre-wrap">
        {parts.map((part: string, i: number) => (
          <span key={i}>
            {/* Texto del fragmento (preservando saltos de línea) */}
            {part}

            {/* Input inline solo si corresponde */}
            {i < ex.answers.length && (
              <input
                type="text"
                disabled={submitted}
                value={current[i] || ""}
                className={`inline-block mx-1 px-3 py-1 rounded-lg border text-base align-middle ${
                  submitted
                    ? current[i]?.trim()?.toLowerCase() ===
                      ex.answers[i].trim().toLowerCase()
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                      : "bg-rose-50 border-rose-300 text-rose-800"
                    : "border-slate-300 focus:ring-2 focus:ring-blue-300"
                }`}
                style={{ width: '120px' }}
                placeholder="___"
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

      {/* Mostrar respuestas correctas después de enviar */}
      {submitted && (
        <div className="mt-3 text-xs text-slate-600">
          {current.some(
            (ans: string, idx: number) =>
              ans?.trim()?.toLowerCase() !== ex.answers[idx]?.trim()?.toLowerCase()
          ) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <span className="font-semibold">{t("coursePlayer.exercise.correctAnswers")}</span>{" "}
              {ex.answers.join(", ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const renderOpenQuestion = (ex: any) => {
  const key = makeLocalKey(ex.id);
  const txt = answers[key] || "";
  const max = ex.maxLength || 500;

  return (
    <div className="space-y-3 max-w-[800px]">
      <p className="font-medium text-slate-800">{ex.prompt}</p>

      <textarea
        rows={4}
        disabled={submitted}
        value={txt}
        maxLength={max}
        onChange={(e) => handleAnswer(key, e.target.value)}
        className={`w-full p-3 rounded-xl border text-sm bg-white transition ${
          submitted
            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
            : "border-slate-300 focus:ring-2 focus:ring-blue-300"
        }`}
      />

      <p className="text-xs text-slate-500">
        {txt.length}/{max} characters
      </p>
    </div>
  );
};


const renderText = (ex: any) => {
  const key = makeLocalKey(ex.id);
  const txt = answers[key] || "";
  const max = ex.maxLength || 400;

  return (
    <div className="space-y-3 max-w-[800px]">
      <p className="font-medium text-slate-800">{ex.prompt}</p>

      <textarea
        rows={4}
        disabled={submitted}
        value={txt}
        maxLength={max}
        onChange={(e) => handleAnswer(key, e.target.value)}
        className={`w-full p-3 rounded-xl border text-sm bg-white transition ${
          submitted
            ? txt.trim()
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-rose-300 bg-rose-50 text-rose-700"
            : "border-slate-300 focus:ring-2 focus:ring-blue-300"
        }`}
      />

      <p className="text-xs text-slate-500">
  {t("coursePlayer.exercise.maxCharacters", {
    max,
    used: txt.length,
  })}
</p>

      {submitted && !txt.trim() && (
        <p className="text-xs text-rose-600">
          {t("coursePlayer.exercise.emptyIdea")}
        </p>
      )}
    </div>
  );
};

const renderMatching = (ex: any) => {
  return (
    <div className="space-y-4 max-w-[750px]">
      {ex.pairs.map((pair: any, idx: number) => {
        const key = makeLocalKey(ex.id, String(idx));
        const val = answers[key] || "";

        return (
          <div key={idx} className="p-4 border rounded-xl bg-white space-y-2">
            <p className="font-medium text-slate-700">Emparejar:</p>

            <div className="flex items-center gap-4">
              <span className="font-semibold text-slate-900">{pair.left}</span>

              <select
                disabled={submitted}
                value={val}
                onChange={(e) => handleAnswer(key, e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="">Seleccionar…</option>
                {ex.pairs.map((p: any, j: number) => (
                  <option key={j} value={p.right}>
                    {p.right}
                  </option>
                ))}
              </select>
            </div>

            {submitted && val !== pair.right && (
              <p className="text-xs text-rose-600">
                Correcto: <b>{pair.right}</b>
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

const renderReorder = (ex: any) => {
  const key = makeLocalKey(ex.id);
  const current = answers[key] ?? ex.items.map((_: any, i: number) => i);

  const move = (from: number, to: number) => {
    if (submitted) return;
    if (to < 0 || to >= current.length) return;

    const copy = [...current];
    [copy[from], copy[to]] = [copy[to], copy[from]];
    handleAnswer(key, copy);
  };

  const isCorrect =
    submitted &&
    JSON.stringify(current) === JSON.stringify(ex.correctOrder);

  return (
    <div className="space-y-3 max-w-[750px]">
      <h4 className="font-semibold text-slate-900">{ex.title}</h4>

      {current.map((idx: number, pos: number) => (
        <div
          key={pos}
          className={`flex items-center justify-between p-3 rounded-lg border bg-white ${
            submitted
              ? isCorrect
                ? "border-emerald-300 bg-emerald-50"
                : "border-rose-300 bg-rose-50"
              : "border-slate-300"
          }`}
        >
          <span>{ex.items[idx]}</span>

          {!submitted && (
            <div className="flex gap-2">
              <button
                className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded text-xs"
                onClick={() => move(pos, pos - 1)}
              >
                ↑
              </button>
              <button
                className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded text-xs"
                onClick={() => move(pos, pos + 1)}
              >
                ↓
              </button>
            </div>
          )}
        </div>
      ))}

      {submitted && !isCorrect && (
        <div className="text-xs text-rose-600">
          Orden correcto:
          <br />
          {ex.correctOrder.map((i: number) => ex.items[i]).join(" → ")}
        </div>
      )}
    </div>
  );
};

const renderReflection = (ex: any) => {
  const n = ex.ideasCount || 3;

  return (
    <div className="space-y-4 max-w-[750px]">
      <p className="font-medium text-slate-900">{ex.prompt}</p>

      {[...Array(n)].map((_, i) => {
        const key = makeLocalKey(ex.id, `idea${i}`);
        const txt = answers[key] || "";

        return (
          <div key={i} className="space-y-1">
            <textarea
              rows={3}
              disabled={submitted}
              value={txt}
              onChange={(e) => handleAnswer(key, e.target.value)}
              placeholder={`Idea ${i + 1}`}
              className={`w-full p-3 rounded-xl bg-white border text-sm transition ${
                submitted
                  ? txt.trim()
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-rose-300 bg-rose-50 text-rose-700"
                  : "border-slate-300 focus:ring-2 focus:ring-blue-300"
              }`}
            />

            {submitted && !txt.trim() && (
              <span className="text-xs text-rose-500">
                {t("coursePlayer.exercise.emptyIdea")}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

const renderSentenceCorrection = (ex: any) => {
  const key = makeLocalKey(ex.id);
  const val = answers[key] || "";

  const isCorrect =
    submitted &&
    ex.correctAnswers.some(
      (ans: string) =>
        ans.trim().toLowerCase() === val.trim().toLowerCase()
    );

  return (
    <div className="space-y-4 max-w-[750px]">
      <p className="font-medium text-slate-900">{t("coursePlayer.exercise.incorrectSentence")}</p>

      <p className="italic text-slate-600">“{ex.incorrect}”</p>

      <input
        type="text"
        disabled={submitted}
        value={val}
        onChange={(e) => handleAnswer(key, e.target.value)}
        className={`w-full p-3 rounded-xl border bg-white text-sm ${
          submitted
            ? isCorrect
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-rose-300 bg-rose-50 text-rose-700"
            : "border-slate-300 focus:ring-2 focus:ring-blue-300"
        }`}
        placeholder="Escribí la frase corregida"
      />

      {submitted && !isCorrect && (
        <p className="text-xs text-rose-600">
          {t("coursePlayer.exercise.correctAnswer")}
          <br />
          <b>{ex.correctAnswers[0]}</b>
        </p>
      )}
    </div>
  );
};

const renderSpeaking = (ex: any) => {
  return (
    <div className="space-y-4 max-w-[750px]">
      <h4 className="font-semibold text-slate-800">{ex.title}</h4>

      <ul className="list-disc pl-6 space-y-2 text-slate-700">
        {ex.bullets?.map((b: string, i: number) => (
          <li key={i}>{b}</li>
        ))}
      </ul>

      {ex.notes && (
        <p className="text-sm text-slate-500 italic">{ex.notes}</p>
      )}

      <p className="text-xs text-slate-500">
        {t("coursePlayer.exercise.correction")}
      </p>
    </div>
  );
};

  /* ============================================================
     💡 SOLUCIÓN MOSTRADA DESPUÉS DE ENVIAR
     ============================================================ */
  const renderSolution = (ex: any) => {
    if (feedback?.ok) return null; // si aprobó, no mostramos solución

    switch (ex.type) {
      case "multiple_choice":
        return (
          <div className="text-xs text-slate-500 mt-2">
            Correcta: <b>{ex.options?.[ex.correctIndex]}</b>
          </div>
        );
      case "true_false":
        return (
          <div className="text-xs text-slate-500 mt-2">
            La respuesta correcta es:{" "}
            <b>{ex.answer ? "Verdadero" : "Falso"}</b>
          </div>
        );
      case "fill_blank":
        return (
          <div className="text-xs text-slate-500 mt-2">
            Respuestas correctas: {ex.answers?.join(", ")}
          </div>
        );
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
      className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6"
    >
      {/* Header */}
<motion.div className="space-y-3 mb-6">
  {/* 🎯 TÍTULO DEL EJERCICIO */}
  {ex.title && (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 grid place-items-center text-xl">
        🧠
      </div>
      <h3 className="text-2xl font-bold text-slate-900">
        {ex.title}
      </h3>
    </div>
  )}

  {/* 📋 INSTRUCCIONES DEL EJERCICIO */}
  {ex.instructions && (
    <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-xl p-4">
      <p className="text-sm text-blue-900 leading-relaxed font-medium">
        {ex.instructions}
      </p>
    </div>
  )}
  {/* 📝 CONSIGNA / ENUNCIADO */}
{getExercisePrompt(ex) && (
  <div className="bg-slate-100 border border-slate-300 rounded-xl p-4 mt-3">
    <p className="text-base font-semibold text-slate-800 whitespace-pre-wrap">
      {getExercisePrompt(ex)}
    </p>
  </div>
)}

</motion.div>

{/* Indicador de tipo */}
<div className="flex items-center gap-2 mb-4">
  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
    {ex.type.replace(/_/g, ' ').toUpperCase()}
  </span>
</div>

      {/* Card del ejercicio */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.05 }}
        className={`rounded-xl p-5 border ${
          submitted
            ? feedback?.ok
              ? "bg-emerald-50 border-emerald-300"
              : "bg-rose-50 border-rose-300"
            : "bg-slate-50 border-slate-200"
        }`}
      >
        {/* CONSIGNA UNIVERSAL */}
{ex.type !== "reading" &&
  ex.type !== "listening" && (
    <h4 className="font-semibold text-slate-900 mb-4 text-lg whitespace-pre-wrap">
      {/* {getExercisePrompt(ex)} */}
    </h4>
)}

        {/* 🔀 Selección de renderer según tipo */}
        {ex.type === "reading" && renderReading(ex)}

{ex.type === "verb_table" && renderTable(ex)}


        {ex.type === "listening" && (
          <div className="space-y-6">
            {ex.audioUrl && (
  <>
    {/* Si es un .mp3/.wav → usar audio normal */}
    {/\.(mp3|wav|ogg)$/i.test(ex.audioUrl) ? (
      <audio controls src={ex.audioUrl} className="mt-2 w-full max-w-md" />
    ) : null}

    {/* Si contiene Vimeo → usar iframe */}
    {ex.audioUrl.includes("vimeo.com") ? (
      <iframe
        src={ex.audioUrl.replace("vimeo.com/", "player.vimeo.com/video/")}
        className="w-full h-48 rounded mt-3"
        allow="autoplay; fullscreen; encrypted-media"
        allowFullScreen
      />
    ) : null}
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
          <div className="flex flex-col gap-3 max-w-[750px]">
            {ex.options.map((opt: string, idx: number) => {
              const key = makeLocalKey(ex.id);
              const val = answers[key];
              const isSelected = val === idx;
              const isCorrectOpt = idx === ex.correctIndex;

              const base =
                "flex items-center gap-3 p-4 rounded-xl cursor-pointer transition border text-sm";
              const color = submitted
                ? isCorrectOpt
                  ? "bg-emerald-50 border-emerald-300"
                  : isSelected
                  ? "bg-rose-50 border-rose-300"
                  : "bg-white border-slate-200"
                : isSelected
                ? "bg-blue-50 border-blue-300 text-blue-700 shadow-sm"
                : "bg-white border-slate-300 hover:bg-slate-100";

              return (
                <motion.label
                  key={idx}
                  whileHover={!submitted ? { scale: 1.02 } : {}}
                  whileTap={!submitted ? { scale: 0.97 } : {}}
                  className={base + " " + color}
                >
                  <input
                    type="radio"
                    className="hidden"
                    disabled={submitted}
                    checked={isSelected}
                    onChange={() => handleAnswer(key, idx)}
                  />
                  <span className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-xs">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt}</span>
                </motion.label>
              );
            })}

            {submitted && renderSolution(ex)}
          </div>
        )}

        {/* TRUE / FALSE */}
        {ex.type === "true_false" && (
          <div className="flex flex-wrap gap-3 max-w-[750px]">
            {[
              { label: "Verdadero", value: true },
              { label: "Falso", value: false },
            ].map((opt) => {
              const key = makeLocalKey(ex.id);
              const val = answers[key];
              const isSelected = val === opt.value;
              const isCorrectOpt = ex.answer === opt.value;

              const base =
                "flex items-center gap-3 px-6 py-3 rounded-xl cursor-pointer border transition text-sm font-medium";
              const color = submitted
                ? isCorrectOpt
                  ? "bg-emerald-50 border-emerald-300"
                  : isSelected
                  ? "bg-rose-50 border-rose-300"
                  : "bg-white border-slate-200"
                : isSelected
                ? "bg-blue-50 border-blue-300 text-blue-700 shadow-sm"
                : "bg-white border-slate-300 hover:bg-slate-100";

              return (
                <motion.label
                  key={opt.label}
                  whileHover={!submitted ? { scale: 1.02 } : {}}
                  whileTap={!submitted ? { scale: 0.97 } : {}}
                  className={base + " " + color}
                >
                  <input
                    type="radio"
                    className="hidden"
                    disabled={submitted}
                    checked={isSelected}
                    onChange={() => handleAnswer(key, opt.value)}
                  />
                  <span>{opt.label}</span>
                </motion.label>
              );
            })}

            {submitted && renderSolution(ex)}
          </div>
        )}
      </motion.div>

      {/* Botón de comprobar */}
      <motion.button
        onClick={evaluate}
        disabled={submitted}
        whileHover={!submitted ? { scale: 1.03 } : {}}
        whileTap={!submitted ? { scale: 0.97 } : {}}
        className={`w-full py-3 rounded-xl font-semibold transition shadow-sm ${
    submitted
      ? "bg-slate-300 text-slate-500 cursor-not-allowed"
      : "bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white hover:shadow-2xl hover:shadow-[#EE7203]/40 "
  }`}
>
        {submitted ? "Attempt recorded" : "Check answers"}
      </motion.button>

      {/* Feedback numérico */}
      {submitted && feedback && (
        <div className="text-sm text-slate-700 mt-2">
          {typeof feedback.correct === "number" &&
            typeof feedback.total === "number" && (
              <p>
                Resultado:{" "}
                <b>
                  {feedback.correct}/{feedback.total}
                </b>{" "}
                correctas
              </p>
            )}
        </div>
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

  /* =========================================================
     🔹 Guards de acceso
     ========================================================= */
  if (!authReady || authLoading || loading) {
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
            onClick={() => router.push("/dashboard")}
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

function DownloadBibliographyButton({ unit, courseTitle }) {
  const [loading, setLoading] = useState(false);

  const generatePDF = async () => {
    setLoading(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = 20;

      // ==========================================
      // 🎨 HEADER CON LOGO Y TÍTULO
      // ==========================================
      
      // Logo "Further" (texto a la izquierda)
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(238, 114, 3);
      doc.text("Further", margin, yPosition);
      
      // Logo (imagen en esquina derecha)
      const imgWidth = 40;
      const imgHeight = 25;
      doc.addImage(
        FURTHER_LOGO_BASE64,
        "PNG",
        pageWidth - margin - imgWidth,
        yPosition - 22,
        imgWidth,
        imgHeight
      );
      
      // Línea decorativa
      doc.setDrawColor(238, 114, 3);
      doc.setLineWidth(2);
      doc.line(margin, yPosition + 3, pageWidth - margin, yPosition + 3);
      
      yPosition += 15;

      // Título del curso
      doc.setFontSize(16);
      doc.setTextColor(12, 33, 45);
      doc.setFont("helvetica", "bold");
      doc.text(courseTitle || "Curso", margin, yPosition);
      yPosition += 10;

      // Título de la unidad
      doc.setFontSize(14);
      doc.setTextColor(17, 44, 62);
      doc.text(`Unit: ${unit.title}`, margin, yPosition);
      yPosition += 15;

      // ==========================================
      // 📚 CONTENIDO DE CADA LECCIÓN
      // ==========================================
      
      unit.lessons?.forEach((lesson, idx) => {
        // Ignorar intro y closing
        if (lesson.id === "intro" || lesson.id === "closing") return;

        // Check si necesitamos nueva página
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 20;
        }

        // Número y título de lección
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(238, 114, 3);
        doc.text(`${idx + 1}. ${lesson.title}`, margin, yPosition);
        yPosition += 8;

        // Descripción
        if (lesson.description) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(60, 60, 60);
          const descLines = doc.splitTextToSize(
            lesson.description,
            pageWidth - 2 * margin
          );
          doc.text(descLines, margin + 5, yPosition);
          yPosition += descLines.length * 5 + 5;
        }

        // Teoría/Contenido
        if (lesson.theory) {
          if (yPosition > pageHeight - 60) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(40, 40, 40);
          
          // Limpiar markdown básico
          const cleanTheory = lesson.theory
            .replace(/[#*_`]/g, "")
            .replace(/\n{3,}/g, "\n\n")
            .substring(0, 1500);
          
          const theoryLines = doc.splitTextToSize(
            cleanTheory + (lesson.theory.length > 1500 ? "..." : ""),
            pageWidth - 2 * margin
          );
          
          doc.text(theoryLines, margin + 5, yPosition);
          yPosition += theoryLines.length * 5 + 3;
        }

        // Vocabulario
        if (lesson.vocabulary?.entries) {
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(238, 114, 3);
          doc.text("Vocabulary:", margin + 5, yPosition);
          yPosition += 6;

          doc.setFont("helvetica", "normal");
          doc.setTextColor(60, 60, 60);
          
          lesson.vocabulary.entries.slice(0, 20).forEach((entry) => {
            if (yPosition > pageHeight - 20) {
              doc.addPage();
              yPosition = 20;
            }
            const vocabLine = `• ${entry.term}: ${entry.translation || entry.meaning}`;
            const lines = doc.splitTextToSize(vocabLine, pageWidth - 2 * margin - 10);
            doc.text(lines, margin + 10, yPosition);
            yPosition += lines.length * 5;
          });
        }

        // ==========================================
        // 🧠 EJERCICIOS DE LA LECCIÓN
        // ==========================================
        if (lesson.ejercicios && lesson.ejercicios.length > 0) {
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = 20;
          }

          // Título de sección de ejercicios
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(238, 114, 3);
          doc.text("Ejercicios:", margin + 5, yPosition);
          yPosition += 8;

          lesson.ejercicios.forEach((ex, exIdx) => {
            if (yPosition > pageHeight - 30) {
              doc.addPage();
              yPosition = 20;
            }

            // Número de ejercicio
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(60, 60, 60);
            doc.text(`Ejercicio ${exIdx + 1}:`, margin + 10, yPosition);
            yPosition += 6;

            doc.setFont("helvetica", "normal");
            doc.setTextColor(50, 50, 50);

            // Renderizar según tipo de ejercicio
            switch (ex.type) {
              case "multiple_choice":
                if (ex.question) {
                  const qLines = doc.splitTextToSize(ex.question, pageWidth - 2 * margin - 15);
                  doc.text(qLines, margin + 15, yPosition);
                  yPosition += qLines.length * 5 + 3;
                }
                ex.options?.forEach((opt, i) => {
                  if (yPosition > pageHeight - 15) {
                    doc.addPage();
                    yPosition = 20;
                  }
                  const optLine = `${String.fromCharCode(65 + i)}) ${opt}`;
                  const lines = doc.splitTextToSize(optLine, pageWidth - 2 * margin - 20);
                  doc.text(lines, margin + 20, yPosition);
                  yPosition += lines.length * 5;
                });
                yPosition += 3;
                break;

              case "true_false":
                if (ex.statement) {
                  const stLines = doc.splitTextToSize(ex.statement, pageWidth - 2 * margin - 15);
                  doc.text(stLines, margin + 15, yPosition);
                  yPosition += stLines.length * 5 + 3;
                }
                doc.text("☐ Verdadero    ☐ Falso", margin + 20, yPosition);
                yPosition += 7;
                break;

              case "fill_blank":
                if (ex.sentence) {
                  const sentence = ex.sentence.replace(/\*\*\*/g, "_____");
                  const sentLines = doc.splitTextToSize(sentence, pageWidth - 2 * margin - 15);
                  doc.text(sentLines, margin + 15, yPosition);
                  yPosition += sentLines.length * 5 + 5;
                }
                break;

              case "reading":
              case "listening":
                if (ex.title) {
                  doc.setFont("helvetica", "bold");
                  const titleLines = doc.splitTextToSize(ex.title, pageWidth - 2 * margin - 15);
                  doc.text(titleLines, margin + 15, yPosition);
                  yPosition += titleLines.length * 5 + 2;
                }
                if (ex.text) {
                  doc.setFont("helvetica", "normal");
                  const textLines = doc.splitTextToSize(
                    ex.text.substring(0, 500) + (ex.text.length > 500 ? "..." : ""),
                    pageWidth - 2 * margin - 15
                  );
                  doc.text(textLines, margin + 15, yPosition);
                  yPosition += textLines.length * 5 + 3;
                }
                
                // Preguntas del reading/listening
                if (ex.questions && ex.questions.length > 0) {
                  ex.questions.forEach((q, qIdx) => {
                    if (yPosition > pageHeight - 25) {
                      doc.addPage();
                      yPosition = 20;
                    }
                    
                    doc.setFont("helvetica", "bold");
                    const promptLines = doc.splitTextToSize(
                      `${qIdx + 1}. ${q.prompt}`,
                      pageWidth - 2 * margin - 20
                    );
                    doc.text(promptLines, margin + 20, yPosition);
                    yPosition += promptLines.length * 5 + 2;

                    doc.setFont("helvetica", "normal");
                    if (q.kind === "mc" && q.options) {
                      q.options.forEach((opt, i) => {
                        if (yPosition > pageHeight - 15) {
                          doc.addPage();
                          yPosition = 20;
                        }
                        const optLine = `${String.fromCharCode(65 + i)}) ${opt}`;
                        const lines = doc.splitTextToSize(optLine, pageWidth - 2 * margin - 25);
                        doc.text(lines, margin + 25, yPosition);
                        yPosition += lines.length * 5;
                      });
                    } else if (q.kind === "tf") {
                      doc.text("☐ True    ☐ False", margin + 25, yPosition);
                      yPosition += 5;
                    }
                    yPosition += 3;
                  });
                }
                break;

              case "text":
                if (ex.prompt) {
                  const promptLines = doc.splitTextToSize(ex.prompt, pageWidth - 2 * margin - 15);
                  doc.text(promptLines, margin + 15, yPosition);
                  yPosition += promptLines.length * 5 + 3;
                }
                doc.text("____________________________________________________", margin + 15, yPosition);
                yPosition += 5;
                doc.text("____________________________________________________", margin + 15, yPosition);
                yPosition += 5;
                doc.text("____________________________________________________", margin + 15, yPosition);
                yPosition += 7;
                break;

              case "matching":
                doc.text("Emparejar:", margin + 15, yPosition);
                yPosition += 5;
                ex.pairs?.forEach((pair, i) => {
                  if (yPosition > pageHeight - 15) {
                    doc.addPage();
                    yPosition = 20;
                  }
                  doc.text(`${i + 1}. ${pair.left} → ___________`, margin + 20, yPosition);
                  yPosition += 5;
                });
                yPosition += 3;
                break;

              case "reflection":
                if (ex.prompt) {
                  const promptLines = doc.splitTextToSize(ex.prompt, pageWidth - 2 * margin - 15);
                  doc.text(promptLines, margin + 15, yPosition);
                  yPosition += promptLines.length * 5 + 3;
                }
                const ideasCount = ex.ideasCount || 3;
                for (let i = 0; i < ideasCount; i++) {
                  if (yPosition > pageHeight - 15) {
                    doc.addPage();
                    yPosition = 20;
                  }
                  doc.text(`Idea ${i + 1}: ________________________________________`, margin + 15, yPosition);
                  yPosition += 7;
                }
                break;

              case "sentence_correction":
                if (ex.incorrect) {
                  doc.text("Frase incorrecta:", margin + 15, yPosition);
                  yPosition += 5;
                  const incorrectLines = doc.splitTextToSize(`"${ex.incorrect}"`, pageWidth - 2 * margin - 15);
                  doc.text(incorrectLines, margin + 20, yPosition);
                  yPosition += incorrectLines.length * 5 + 3;
                }
                doc.text("Corrección: _________________________________________", margin + 15, yPosition);
                yPosition += 7;
                break;

              case "speaking":
                if (ex.title) {
                  const titleLines = doc.splitTextToSize(ex.title, pageWidth - 2 * margin - 15);
                  doc.text(titleLines, margin + 15, yPosition);
                  yPosition += titleLines.length * 5 + 3;
                }
                ex.bullets?.forEach((bullet) => {
                  if (yPosition > pageHeight - 15) {
                    doc.addPage();
                    yPosition = 20;
                  }
                  const bulletLines = doc.splitTextToSize(`• ${bullet}`, pageWidth - 2 * margin - 20);
                  doc.text(bulletLines, margin + 20, yPosition);
                  yPosition += bulletLines.length * 5;
                });
                yPosition += 5;
                break;

              default:
                doc.text("(Ejercicio interactivo)", margin + 15, yPosition);
                yPosition += 7;
            }

            yPosition += 5; // Espacio entre ejercicios
          });
        }

        yPosition += 8; // Espacio entre lecciones
      });

      // ==========================================
      // 🔚 FOOTER EN TODAS LAS PÁGINAS
      // ==========================================
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Página ${i} de ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      }

      // ==========================================
      // 💾 GUARDAR PDF
      // ==========================================
      const filename = `${courseTitle}_${unit.title}_Bibliografia.pdf`
        .replace(/[^a-zA-Z0-9_\s]/g, "")
        .replace(/\s+/g, "_")
        .substring(0, 60);
      
      doc.save(filename);
      toast.success("📥 Bibliografía descargada correctamente");
      
    } catch (error) {
      console.error("Error generando PDF:", error);
      toast.error("Hubo un error al generar el PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={generatePDF}
      disabled={loading || !unit}
      className="relative w-full bg-white hover:bg-gray-50 border-2 border-gray-200 rounded-2xl p-5 
                 transition-all group hover:border-[#EE7203]/30 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0C212D] to-[#112C3E] 
                          flex items-center justify-center group-hover:shadow-lg transition-shadow">

            {loading ? (
              <FiLoader className="animate-spin text-[#EE7203]" size={18} />
            ) : (
              <FiDownload className="text-[#EE7203]" size={18} />
            )}

          </div>

          <div className="text-left">
            <p className="text-sm font-black text-[#0C212D]">Bibliografía</p>
            <p className="text-xs text-slate-500">
              {loading ? "Generando PDF..." : "Descargar PDF"}
            </p>
          </div>
        </div>

        {!loading && (
          <FiChevronRight className="text-slate-400 group-hover:text-[#EE7203] group-hover:translate-x-1 transition-all" />
        )}
      </div>
    </button>
  );
}

// Componente de introducción mejorada
function EnhancedCourseIntro({ 
  activeLesson, 
  units, 
  activeU, 
  progress, 
  goNextLesson,
  t 
}) {
  if (!activeLesson || activeLesson.id !== "intro") return null;

  const currentUnit = units[activeU];
  const completedLessons = currentUnit?.lessons
  ?.filter(l => l.id !== "intro") // ⬅️ excluir intro
  ?.filter(l => 
    progress[l.key]?.videoEnded || progress[l.key]?.exSubmitted
  ).length || 0;


  const totalLessons = (currentUnit?.lessons?.length || 1) - 1;
  const estimatedHours = Math.ceil((totalLessons * 15) / 60);


  return (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="space-y-4 md:space-y-6"
  >
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl md:rounded-3xl shadow-xl border-2 border-[#EE7203]/20 overflow-hidden">
      
      {/* Header decorativo */}
      {/* Padding reducido: p-5 en móvil vs p-8 en desktop */}
      <div className="bg-gradient-to-r from-[#0C212D] to-[#112C3E] p-5 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-[#EE7203]/10 rounded-full blur-3xl"></div>
        
        {/* Flex-col en móvil para alinear icono y texto verticalmente si es necesario */}
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* Icono más pequeño en móvil */}
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-[#EE7203] to-[#FF3816] flex items-center justify-center shadow-lg shrink-0">
            <span className="text-2xl md:text-4xl">🎯</span>
          </div>
          <div>
            <p className="text-[#EE7203] text-xs md:text-sm font-bold uppercase tracking-wider mb-1">
              {t("coursePlayer.intro.welcomeToUnit")}
            </p>
            {/* Texto responsive */}
            <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
              {activeLesson.unitSummary || currentUnit?.title}
            </h2>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="p-4 md:p-8 space-y-4 md:space-y-6">
        
        {/* Descripción de la unidad */}
        {activeLesson?.description && (
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-xl md:rounded-r-2xl p-4 md:p-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-lg md:text-xl">📖</span>
              </div>
              <div className="flex-1">
                <h3 className="text-base md:text-lg font-black text-blue-900 mb-1 md:mb-2">
                  {t("coursePlayer.intro.aboutThisUnit")}
                </h3>
                <p className="text-sm md:text-base text-blue-800 leading-relaxed">
                  {activeLesson.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Grid de estadísticas */}
        {/* En móvil usamos grid-cols-1 con gap pequeño, en md grid-cols-3 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          {/* Lecciones */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl md:rounded-2xl p-4 md:p-6 flex sm:block items-center justify-between sm:justify-start">
            <div className="flex items-center gap-3 sm:mb-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-purple-500 flex items-center justify-center">
                <span className="text-lg md:text-2xl">📚</span>
              </div>
              {/* En móvil mostramos el texto al lado, en desktop abajo */}
              <p className="sm:hidden text-sm font-bold text-purple-700">
                {t("coursePlayer.intro.lessonsInUnit")}
              </p>
            </div>
            <div className="text-right sm:text-left">
              <div className="text-2xl md:text-4xl font-black text-purple-900">
                {totalLessons}
              </div>
              <p className="hidden sm:block text-sm font-bold text-purple-700">
                {t("coursePlayer.intro.lessonsInUnit")}
              </p>
            </div>
          </div>

          {/* Progreso */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-xl md:rounded-2xl p-4 md:p-6 flex sm:block items-center justify-between sm:justify-start">
            <div className="flex items-center gap-3 sm:mb-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                <span className="text-lg md:text-2xl">✅</span>
              </div>
              <p className="sm:hidden text-sm font-bold text-emerald-700">
                {t("coursePlayer.intro.completedLessons")}
              </p>
            </div>
            <div className="text-right sm:text-left">
              <div className="text-2xl md:text-4xl font-black text-emerald-900">
                {completedLessons}
              </div>
              <p className="hidden sm:block text-sm font-bold text-emerald-700">
                {t("coursePlayer.intro.completedLessons")}
              </p>
            </div>
          </div>

          {/* Secciones restantes */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl md:rounded-2xl p-4 md:p-6 flex sm:block items-center justify-between sm:justify-start">
            <div className="flex items-center gap-3 sm:mb-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                <span className="text-lg md:text-2xl">📋</span>
              </div>
              <p className="sm:hidden text-sm font-bold text-orange-700">
                 {t("coursePlayer.intro.remainingSections")}
              </p>
            </div>
            <div className="text-right sm:text-left">
              <div className="text-2xl md:text-4xl font-black text-orange-900">
                {totalLessons - completedLessons}
              </div>
              <p className="hidden sm:block text-sm font-bold text-orange-700">
                {t("coursePlayer.intro.remainingSections")}
              </p>
            </div>
          </div>
        </div>

        {/* Objetivos de aprendizaje */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 rounded-xl md:rounded-2xl p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-[#0C212D] to-[#112C3E] flex items-center justify-center flex-shrink-0">
              <span className="text-xl md:text-2xl">🎓</span>
            </div>
            <div className="flex-1 w-full">
              <h3 className="text-lg md:text-xl font-black text-slate-900 mb-3">
                {t("coursePlayer.intro.whatYouWillLearn")}
              </h3>
              <div className="space-y-2">
                {currentUnit?.lessons?.slice(1, 5).map((lesson, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#EE7203] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-[10px] md:text-xs font-bold">{idx + 1}</span>
                    </div>
                    <p className="text-sm md:text-base text-slate-700 font-medium line-clamp-2 md:line-clamp-1">{lesson.title}</p>
                  </div>
                ))}
                {(currentUnit?.lessons?.length || 0) > 6 && (
                  <p className="text-slate-500 text-xs md:text-sm italic ml-8 md:ml-9">
                    {t("coursePlayer.intro.andMore", { 
                      count: (currentUnit?.lessons?.length || 0) - 5 
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CTA para empezar */}
        <div className="relative overflow-hidden rounded-xl md:rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[#EE7203] to-[#FF3816] opacity-10"></div>
          <div className="relative bg-gradient-to-br from-[#0C212D] to-[#112C3E] p-6 md:p-8 text-center">
            <h3 className="text-xl md:text-2xl font-black text-white mb-2 md:mb-3">
              {t("coursePlayer.intro.readyToStart")}
            </h3>
            <p className="text-xs md:text-base text-slate-300 mb-4 md:mb-6 max-w-2xl mx-auto">
              {t("coursePlayer.intro.clickNextLesson")}
            </p>
            {/* Botón full width en mobile */}
            <button
              onClick={goNextLesson}
              className="w-full md:w-auto group px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white font-black text-base md:text-lg rounded-xl md:rounded-2xl shadow-lg hover:scale-105 transition-all inline-flex items-center justify-center gap-3"
            >
              <span>{t("coursePlayer.intro.startFirstLesson")}</span>
              <FiChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </button>
          </div>
        </div>

      </div>
    </div>
  </motion.div>
);
}


  /* =========================================================
     🔹 UI inicial 
     ========================================================= */
 return (
 <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-white text-slate-900">
   
    {/* ======================= SIDEBAR IZQUIERDA ======================= */}
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
      onClick={() => router.push("/dashboard")}
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
  <nav className="p-4 space-y-3 pb-32">
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
    <main className="flex-1 w-full overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-slate-50 relative z-0">
      
      {/* Ajustado padding horizontal px-4 para mobile, px-6 o px-8 en desktop */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 md:space-y-10 pb-24">
       
        {/* INTRODUCCIÓN ESPECIAL DE LA UNIDAD */}
        <EnhancedCourseIntro
          activeLesson={activeLesson}
          units={units}
          activeU={activeU}
          progress={progress}
          goNextLesson={goNextLesson}
          t={t}
        />

        {activeLesson?.id !== "intro" && (
          <>
          {/* Header Hero */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative overflow-hidden mt-12 xl:mt-0" // Margen top en mobile para no chocar con el hamburger menu si es flotante
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#0C212D] via-[#112C3E] to-[#0C212D] rounded-3xl blur-2xl opacity-5"></div>
              {/* Padding reducido en mobile: p-5 vs p-8 */}
              <div className="relative bg-gradient-to-br from-[#0C212D] to-[#112C3E] rounded-3xl p-5 md:p-8 shadow-2xl border border-[#EE7203]/20">
                {/* Flex-col en mobile para apilar titulo y estado */}
                <div className="flex flex-col md:flex-row items-start justify-between gap-4 md:gap-6">
                  <div className="flex-1 space-y-3 w-full">
                    <div className="flex items-start md:items-center gap-3">
                      <div className="w-1.5 h-8 md:w-2 md:h-12 bg-gradient-to-b from-[#EE7203] via-[#FF3816] to-[#EE7203] rounded-full shadow-lg shrink-0 mt-1 md:mt-0"></div>
                      {/* Texto responsive text-2xl vs text-4xl */}
                      <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
                        {activeLesson?.title || t("coursePlayer.sidebar.lessonCurrent")}
                      </h1>
                    </div>
                    {activeLesson?.description && (
                      <p className="text-slate-300 text-sm md:text-lg leading-relaxed ml-4 md:ml-5 font-medium">
                        {activeLesson.description}
                      </p>
                    )}
                  </div>
                  
                  <div className={`flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-2xl shadow-lg self-start md:self-center ${
                    currentLessonStatus === 'completed'
                      ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                      : 'bg-gradient-to-r from-[#EE7203] to-[#FF3816]'
                  }`}>
                    <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${
                      currentLessonStatus === 'completed'
                        ? 'bg-white'
                        : 'bg-white animate-pulse'
                    }`}></div>
                    <span className="text-white font-bold text-xs md:text-sm whitespace-nowrap">
                      {currentLessonStatus === 'completed' 
                        ? t("coursePlayer.sidebar.completed") 
                        : t("coursePlayer.sidebar.inProgress")
                      }
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

          {/* VIDEO */}
            {resolvedVideoUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative group"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-[#EE7203] via-[#FF3816] to-[#EE7203] rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl border border-[#0C212D]/10">
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

            {/* PDF */}
            {activeLesson?.pdfUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden"
              >
                {/* Padding responsive px-5 py-4 */}
                <div className="bg-gradient-to-r from-[#0C212D] to-[#112C3E] px-5 py-4 md:px-8 md:py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-[#EE7203] to-[#FF3816] flex items-center justify-center shadow-lg shrink-0">
                      <FiFileText className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-black text-white">{t("coursePlayer.sidebar.bibliography")}</h3>
                      <p className="text-slate-300 text-xs md:text-sm font-medium">{t("coursePlayer.sidebar.downloadPdf")}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 md:p-6">
                  <iframe
                    src={toEmbedPdfUrl(activeLesson.pdfUrl)}
                    className="w-full h-[400px] md:h-[600px] rounded-2xl border border-slate-200 shadow-inner"
                    title="Resumen PDF"
                  />
                </div>
              </motion.div>
            )}

            {/* CONTENIDO ACADÉMICO */}
            {(activeLesson?.theory || activeLesson?.vocabulary || 
              (Array.isArray(activeLesson?.ejercicios) && activeLesson.ejercicios.length > 0)) && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="space-y-6"
              >
                {/* Navigation Pills - Responsive: flex-wrap para que bajen si no caben */}
                <div className="top-6 z-10 backdrop-blur-xl bg-white/80 rounded-2xl shadow-2xl border border-slate-200/50 p-2">
                  <div className="flex flex-wrap sm:flex-nowrap gap-2">
                    {activeLesson?.theory && (
                      <button
                        onClick={() => setActiveTab("theory")}
                        className={`flex-1 min-w-[120px] px-4 py-3 md:px-6 md:py-4 rounded-xl font-bold text-sm transition-all ${
                          activeTab === "theory"
                            ? "bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white shadow-lg shadow-[#EE7203]/30 scale-105"
                            : "text-[#112C3E]/70 hover:bg-slate-100 hover:text-[#0C212D]"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-lg md:text-xl">📖</span>
                          <span>{t("coursePlayer.tabs.theory")}</span>
                        </div>
                      </button>
                    )}
                    
                    {activeLesson?.vocabulary && (
                      <button
                        onClick={() => setActiveTab("vocabulary")}
                        className={`flex-1 min-w-[120px] px-4 py-3 md:px-6 md:py-4 rounded-xl font-bold text-sm transition-all ${
                          activeTab === "vocabulary"
                            ? "bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white shadow-lg shadow-[#EE7203]/30 scale-105"
                            : "text-[#112C3E]/70 hover:bg-slate-100 hover:text-[#0C212D]"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-lg md:text-xl">📝</span>
                          <span>{t("coursePlayer.tabs.vocabulary")}</span>
                        </div>
                      </button>
                    )}
                    
                    {Array.isArray(activeLesson?.ejercicios) && activeLesson.ejercicios.length > 0 && (
                      <button
                        onClick={() => setActiveTab("exercises")}
                        className={`flex-1 min-w-[120px] px-4 py-3 md:px-6 md:py-4 rounded-xl font-bold text-sm transition-all ${
                          activeTab === "exercises"
                            ? "bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white shadow-lg shadow-[#EE7203]/30 scale-105"
                            : "text-[#112C3E]/70 hover:bg-slate-100 hover:text-[#0C212D]"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-lg md:text-xl">🧠</span>
                          <span>{t("coursePlayer.tabs.exercises")}</span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                {/* Content Cards - FIX CRÍTICO: p-5 en mobile, p-10 en desktop */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden min-h-[300px] md:min-h-[500px]">
                  
                  {/* TEORÍA */}
                  {activeTab === "theory" && activeLesson?.theory && (
                    <motion.div
                      key="theory"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.4 }}
                      className="p-5 md:p-10"
                    >
                      <div className="max-w-4xl mx-auto">
                        <div className="mb-6 md:mb-8 flex items-center gap-4">
                          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-[#0C212D] to-[#112C3E] flex items-center justify-center shadow-lg shrink-0">
                            <span className="text-2xl md:text-3xl">📖</span>
                          </div>
                          <div>
                            <h2 className="text-2xl md:text-3xl font-black text-[#0C212D]">{t("coursePlayer.tabs.theoryTitle")}</h2>
                            <p className="text-sm md:text-base text-slate-600 font-medium">{t("coursePlayer.tabs.theorySubtitle")}</p>
                          </div>
                        </div>
                        <article className="prose prose-base md:prose-lg prose-slate max-w-none prose-headings:text-[#0C212D] prose-headings:font-black prose-a:text-[#EE7203] prose-a:font-semibold prose-strong:text-[#0C212D] prose-strong:font-bold prose-p:leading-relaxed prose-p:text-slate-700">
                          <MarkdownWYSIWYG>
                            {activeLesson.theory}
                          </MarkdownWYSIWYG>
                        </article>
                      </div>
                    </motion.div>
                  )}

                  {/* VOCABULARY */}
                  {activeTab === "vocabulary" && activeLesson?.vocabulary && (
                    <motion.div
                      key="vocabulary"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.4 }}
                      className="p-5 md:p-10"
                    >
                      <div className="max-w-4xl mx-auto">
                        <div className="mb-6 md:mb-8 flex items-center gap-4">
                          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-[#EE7203] to-[#FF3816] flex items-center justify-center shadow-lg shrink-0">
                            <span className="text-2xl md:text-3xl">📝</span>
                          </div>
                          <div>
                            <h2 className="text-2xl md:text-3xl font-black text-[#0C212D]">{t("coursePlayer.tabs.vocabTitle")}</h2>
                            <p className="text-sm md:text-base text-slate-600 font-medium">{t("coursePlayer.tabs.vocabSubtitle")}</p>
                          </div>
                        </div>
                        <RenderVocabularyBlock vocab={activeLesson.vocabulary} />
                      </div>
                    </motion.div>
                  )}

                  {/* EJERCICIOS */}
                  {activeTab === "exercises" && 
                  Array.isArray(activeLesson?.ejercicios) &&
                  activeLesson.ejercicios.length > 0 && (
                    <motion.div
                      key="exercises"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.4 }}
                      className="p-5 md:p-10 space-y-6 md:space-y-8"
                    >
                      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
                        
                        {/* Header con contador TOTAL */}
                        <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-[#112C3E] to-[#0C212D] flex items-center justify-center shadow-lg shrink-0">
                              <span className="text-2xl md:text-3xl">🧠</span>
                            </div>
                            <div>
                              <h2 className="text-2xl md:text-3xl font-black text-[#0C212D]">
                                {t("coursePlayer.tabs.exercisesTitle")}
                              </h2>
                              <p className="text-sm md:text-base text-slate-600 font-medium">
                                {t("coursePlayer.tabs.exercisesSubtitle")}
                              </p>
                            </div>
                          </div>
                          <div className="px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-[#0C212D] to-[#112C3E] text-white rounded-2xl shadow-lg self-start md:self-auto">
                            <span className="text-xl md:text-2xl font-black">{activeLesson.ejercicios.length}</span>
                            <span className="text-slate-300 font-medium"> ejercicios</span>
                          </div>
                        </div>

                        {/* 🔥 TODOS LOS EJERCICIOS EN CASCADA */}
                        {activeLesson.ejercicios.map((_, exerciseIndex) => (
                          <motion.div
                            key={exerciseIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: exerciseIndex * 0.1 }}
                          >
                            <ExerciseRunner
                              ejercicios={[activeLesson.ejercicios[exerciseIndex]]}
                              lessonKey={activeLesson.key}
                              exerciseIndex={exerciseIndex}
                              batchId={userProfile?.batchId}
                              userKey={userProfile?.userKey}
                              courseId={courseId}
                              onSubmit={() => {}}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Final Message */}
            {activeLesson?.finalMessage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 rounded-3xl blur-2xl opacity-20"></div>
                <div className="relative bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-3xl p-6 md:p-8 shadow-xl">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg flex-shrink-0">
                      <span className="text-2xl md:text-3xl">🎉</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-black text-emerald-900 mb-2">{t("coursePlayer.cta.excellentWork")}</h3>
                      <p className="text-sm md:text-base text-emerald-800 font-medium leading-relaxed">{activeLesson.finalMessage}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Next Lesson CTA - Responsive */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex justify-center pt-8 pb-8"
            >
              <button
                onClick={goNextLesson}
                className="group relative px-8 py-4 md:px-12 md:py-6 rounded-3xl font-black text-base md:text-lg shadow-2xl bg-gradient-to-r from-[#EE7203] via-[#FF3816] to-[#EE7203] bg-size-200 bg-pos-0 hover:bg-pos-100 text-white transition-all duration-500 hover:scale-105 hover:shadow-[#EE7203]/50 flex items-center gap-3 md:gap-4 w-full md:w-auto justify-center"
                style={{ backgroundSize: '200% 100%' }}
              >
                <span>{t("coursePlayer.cta.continueNext")}</span>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <FiChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </motion.div>
          </>
        )}
      </div>
    </main>

    {/* ======================= SIDEBAR DERECHA (Desktop) ======================= */}
    <aside className="hidden xl:block xl:w-96 xl:shrink-0 bg-white border-l border-gray-200 sticky top-0 h-screen overflow-y-auto">
       {/* ... (Contenido Sidebar Derecha sin cambios) ... */}
       <div className="relative bg-gradient-to-br from-[#0C212D] to-[#112C3E] p-8 border-b-4 border-[#EE7203]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#EE7203]/10 rounded-full blur-3xl"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-8 bg-gradient-to-b from-[#EE7203] via-[#FF3816] to-[#EE7203] rounded-full shadow-lg"></div>
              <h3 className="text-xl font-black text-white">
                {t("coursePlayer.sidebar.summary")}
              </h3>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              {curso?.descripcion ||  t("coursePlayer.sidebar.noDescription")}
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-[#EE7203]/5 to-[#FF3816]/5 rounded-full blur-2xl"></div>
            
            <div className="relative bg-gradient-to-br from-slate-50 to-white border-2 border-[#EE7203]/20 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#EE7203] to-[#FF3816] flex items-center justify-center shadow-lg">
                  <FiBook className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-[#112C3E]/50 uppercase tracking-widest font-bold mb-1">
                      {t("coursePlayer.sidebar.lessonCurrent")}
                  </p>
                  <p className="text-xs text-[#0C212D] font-semibold">
                    {units[activeU]?.title || "—"}
                  </p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <p className="font-black text-[#0C212D] text-base leading-tight mb-2">
                  {activeLesson?.title || "—"}
                </p>
                {activeLesson?.description && (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {activeLesson.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="bg-gradient-to-br from-[#0C212D] to-[#112C3E] rounded-2xl p-5 shadow-xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-3xl font-black text-[#EE7203] mb-1">
                  {completedCount}
                </div>
                <div className="text-[10px] text-white/60 uppercase tracking-wider font-bold">
                  {t("coursePlayer.sidebar.completed")}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-[#FF3816] mb-1">
                  {totalLessons}
                </div>
                <div className="text-[10px] text-white/60 uppercase tracking-wider font-bold">
                  {t("coursePlayer.sidebar.total")}
                </div>
              </div>
            </div>
            
            <div className="mt-5 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/70 font-semibold">{t("coursePlayer.sidebar.progress")}</span>
                <span className="text-xs text-[#EE7203] font-black">
                  {progressPercent}%
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#EE7203] to-[#FF3816] rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#EE7203] to-[#FF3816] rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <DownloadBibliographyButton 
              unit={currentUnit}
              courseTitle={curso?.titulo}
            />
          </div>
        </div>

        <div className="px-6 pb-8">
          <div className="bg-gradient-to-r from-[#EE7203]/5 via-[#FF3816]/5 to-[#EE7203]/5 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-600 font-medium">
              💪 {t("coursePlayer.sidebar.keepGoing")}
            </p>
          </div>
        </div>
    </aside>

    {/* 📚 MODAL DE VIDEO DEL COURSE PLAYER */}
    <CoursePlayerVideoModal
      videoUrl="https://player.vimeo.com/video/1146041029" 
      courseTitle={curso?.titulo || "Material Académico"} 
      autoShow={true}
      videoType="youtube"
    /> 

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