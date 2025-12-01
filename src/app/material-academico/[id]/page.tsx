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
  FiPlay,
  FiAlertTriangle,
  FiClock,
  FiMaximize,
  FiBookOpen,
  FiFileText,
  FiLock,
} from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import { db as firestore, storage } from "@/lib/firebase";
import { getCourseProgressStats } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Player from "@vimeo/player";
import {motion} from "framer-motion"
import Image from "next/image";





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



  // 🔸 Estados principales
  const [curso, setCurso] = useState<Curso | null>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUnits, setExpandedUnits] = useState<Record<number, boolean>>({});
  const [activeU, setActiveU] = useState(0);
  const [activeL, setActiveL] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);


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
     🔹 Normalizar unidades
     ========================================================= */
useEffect(() => {
  if (!curso) return;

  console.log("📦 Normalizando curso:", curso.unidades);

  const normalized: any[] = [];

  // 1️⃣ Unidades normales
  (curso.unidades || []).forEach((u: any, idxU: number) => {
    const unitId = u.id || `unit-${idxU + 1}`;

   const lessons = (u.lecciones || []).map((l: any, idxL: number) => {
  const lessonId = l.id || `lesson-${idxU + 1}-${idxL + 1}`;

  return {
    key: buildKey(unitId, lessonId),
    id: lessonId,
    unitId,
    title: l.titulo || `Lección ${idxL + 1}`,
    description: l.descripcion || "",
    text: l.texto || "",
    theory: l.teoria || "",
    videoUrl: l.urlVideo || "",
    pdfUrl: l.pdfUrl || "",
    vocabulary: l.vocabulary || null,
  
    ejercicios: Array.isArray(l.ejercicios) ? l.ejercicios : [],
  };
});



// 1️⃣ Introducción como primera lección (si tiene video o descripción)
if (u.urlVideo || u.descripcion) {
  lessons.unshift({
    key: buildKey(unitId, "intro"),
    id: "intro",
    unitId,
    title: `Introducción`,      // 👈 título fijo o podés usar u.titulo
    description: u.descripcion || "",  // 👈 descripción real
    videoUrl: u.introVideo || "",        // 👈 video de introducción
    theory: "",                         // vacío
    ejercicios: [],                     // vacío
    pdfUrl: "",                         // vacío
  });
}


    // 2️⃣ Cierre / examen final de la unidad (solo 1)
if (u.closing && (u.closing.examIntro || u.closing.examExercises?.length || u.closing.pdfUrl)) {
  lessons.push({
    key: buildKey(unitId, "closing"),
    id: "closing",
    unitId,
    title: "🧠 Cierre de la unidad",
    text: u.closing.examIntro || "",
    ejercicios: Array.isArray(u.closing.examExercises)
      ? u.closing.examExercises
      : [],
    pdfUrl: u.closing.pdfUrl || "", // ✅ nuevo campo PDF
    videoUrl: u.closing.videoUrl || "",
  });
}


    normalized.push({
  id: unitId,
  title: u.titulo || `Unidad ${idxU + 1}`,
  description: u.descripcion || "",
  introVideo: u.introVideo || null,
  lessons,
  
});

  });

  // 3️⃣ Cierre final del curso (video + mensaje final)
  if (curso.textoFinalCurso || curso.textoFinalCursoVideoUrl) {
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
  setUnits(normalized);
  if (normalized.length > 0) setExpandedUnits({ 0: true });
}, [curso]);



/* =========================================================
   🔹 Cargar progreso del curso desde AuthContext
   ========================================================= */
useEffect(() => {
  async function loadProgress() {
    if (!user?.uid || !courseId || !getCourseProgress) return;

    console.log("📚 Cargando progreso del curso desde contexto...");
    const data = await getCourseProgress(user.uid, courseId);

    if (data?.byLesson) {
      // ✅ Normalizamos todas las keys para evitar duplicados en memoria
const normalized: Record<string, any> = {};
Object.entries(data.byLesson || {}).forEach(([key, val]) => {
  normalized[key] = val; // NO TOCAR KEYS
});
setProgress(normalized);

    } else {
      console.log("⚠️ No hay progreso previo guardado.");
      setProgress({});
    }
  }

  loadProgress();
}, [user?.uid, courseId, getCourseProgress]);







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

  if (currentLesson?.key && user?.uid && saveCourseProgress) {
    try {
      // 🔹 Normalizamos la key antes de guardar
const normalizedKey = currentLesson.key
  .replace("closing-course", "closing") // unificamos el cierre del curso
  .replace("closing::", "closing-course::"); // aseguramos consistencia

await saveCourseProgress(user.uid, courseId, {
  [normalizedKey]: { videoEnded: true },
});


      // actualizamos estado local (para que el check se marque sin recargar)
      setProgress((prev) => ({
        ...prev,
        [currentLesson.key]: {
          ...(prev[currentLesson.key] || {}),
          videoEnded: true,
        },
      }));

      console.log("✅ Progreso guardado para:", currentLesson.key);
    } catch (err) {
      console.error("❌ Error guardando progreso:", err);
    }
  }

  const nextIdx = currentIdx + 1;
  if (nextIdx < flatLessons.length) {
    const next = flatLessons[nextIdx];
    setActiveU(next.uIdx);
    setActiveL(next.lIdx);
    setExpandedUnits((p) => ({ ...p, [next.uIdx]: true }));
    toast.success("➡️ Avanzaste a la siguiente lección");
  } else {
    toast.success("🎉 ¡Curso completado!");
    router.push("/dashboard");
  }
};

function makeKey(exId: string, qId?: string) {
  return qId ? `${exId}::${qId}` : exId;
}


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

      const fullProgress = await getCourseProgress(user.uid, courseId);
      const prev = fullProgress?.byLesson?.[currentExerciseKey];

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
                    {isCorrect ? "Correcto" : "Incorrecto"}
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

const renderFillBlank = (ex: any) => {
  const key = makeLocalKey(ex.id);
  const parts = ex.sentence.split("***");
  const current = answers[key] || [];

  return (
    <div className="space-y-4 max-w-[750px]">
      {parts.map((part: string, i: number) => (
        <div key={i} className="space-y-2">
          {/* Texto del fragmento anterior */}
          {part.trim() && (
            <p className="text-slate-800 text-base leading-relaxed">
              {part}
            </p>
          )}

          {/* Input SOLO si corresponde */}
          {i < ex.answers.length && (
            <input
              type="text"
              disabled={submitted}
              value={current[i] || ""}
              className={`w-full px-4 py-2 rounded-lg border text-base ${
                submitted
                  ? current[i]?.trim()?.toLowerCase() ===
                    ex.answers[i].trim().toLowerCase()
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                    : "bg-rose-50 border-rose-300 text-rose-800"
                  : "border-slate-300 focus:ring-2 focus:ring-blue-300"
              }`}
              placeholder={`Respuesta ${i + 1}`}
              onChange={(e) => {
                const copy = [...current];
                copy[i] = e.target.value;
                handleAnswer(key, copy);
              }}
            />
          )}
        </div>
      ))}
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
        Máximo {max} caracteres — Usaste {txt.length}
      </p>

      {submitted && !txt.trim() && (
        <p className="text-xs text-rose-600">
          Este campo no puede estar vacío.
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
                * Esta idea no puede estar vacía.
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
      <p className="font-medium text-slate-900">Corrige esta frase:</p>

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
          Respuesta correcta:
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
        * Este ejercicio no es auto-evaluable.
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
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-3 mb-1"
      >
        <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 grid place-items-center text-xl">
          🧠
        </div>
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Ejercicio</h3>
          
        </div>
      </motion.div>

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
        {/* Título / prompt principal (menos para reading/listening que ya tienen su propio header) */}
        {ex.type !== "reading" &&
          ex.type !== "listening" &&
          (ex.question || ex.prompt || ex.statement) && (
            <h4 className="font-semibold text-slate-900 mb-4 text-lg">
              {ex.question || ex.prompt || ex.statement}
            </h4>
          )}

        {/* 🔀 Selección de renderer según tipo */}
        {ex.type === "reading" && renderReading(ex)}

        {ex.type === "listening" && (
          <div className="space-y-6">
            {ex.audioUrl && (
              <audio
                controls
                src={ex.audioUrl}
                className="w-full max-w-md"
              />
            )}
            {renderReading(ex)}
          </div>
        )}

        {ex.type === "fill_blank" && renderFillBlank(ex)}
        {ex.type === "text" && renderText(ex)}
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
        {submitted ? "Intento registrado" : "Comprobar respuestas"}
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
    return (
      <div className="min-h-[60vh] grid place-items-center text-slate-300">
        Cargando material...
      </div>
    );
  }

  const canAccess =
    role === "admin" ||
    role === "profesor" ||
    (user?.email && (curso?.cursantes || []).includes(user.email));

  if (!curso || !canAccess) {
    return (
      <div className="min-h-[60vh] grid place-items-center px-6 bg-[#0B1220]">
        <div className="max-w-md bg-slate-800 rounded-2xl border border-slate-700 p-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-yellow-400/20 text-yellow-400 grid place-items-center">
            <FiAlertTriangle />
          </div>
          <h2 className="mt-3 text-lg font-bold text-white">
            No tienes acceso
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            Iniciá sesión con la cuenta correcta o contactá al administrador.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-yellow-400 text-slate-900 font-semibold hover:bg-yellow-300"
          >
            Volver
          </button>
        </div>
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

  /* =========================================================
     🔹 UI inicial (básica)
     ========================================================= */
 return (
 <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-white text-slate-900">
    {/* ======================= SIDEBAR IZQUIERDA ======================= */}
    <aside className="w-72 shrink-0 border-r-2 border-gray-100 bg-white sticky top-0 h-screen overflow-y-auto">
      
      {/* Header del sidebar */}
      <div className="p-4 border-b-2 border-gray-100 bg-gradient-to-br from-[#0C212D] to-[#112C3E]">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-sm text-white/80 hover:text-white font-medium transition-colors group"
        >
          <FiChevronLeft className="text-[#EE7203] group-hover:text-[#FF3816] transform group-hover:-translate-x-1 transition-all" />
          Volver al inicio
        </button>
      </div>

      {/* Info del curso */}
      <div className="p-5 border-b-2 border-gray-100 bg-gradient-to-br from-[#EE7203]/5 to-[#FF3816]/5">
        <h1 className="text-lg font-black text-[#0C212D] line-clamp-2 mb-2">{curso.titulo}</h1>
        <p className="text-xs text-[#112C3E]/70 line-clamp-2 leading-relaxed">{curso.descripcion}</p>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-2 pb-32">
        {units.map((u, uIdx) => {
          // Cierre del curso
          if (u.id === "closing-course") {
            const l = u.lessons?.[0];
            const done = l && (progress[l.key]?.videoEnded || progress[l.key]?.exSubmitted);
            const active = activeU === uIdx && activeL === 0;

            return (
              <div key={u.id} className="mt-4 pt-3 border-t-2 border-gray-200">
                <div className="px-3 py-2 font-bold text-[#0C212D] flex items-center gap-2">
                  <span className="text-lg">🎓</span>
                  <span>Cierre del curso</span>
                </div>
                <button
                  onClick={() => {
                    setActiveU(uIdx);
                    setActiveL(0);
                  }}
                  className={`block w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? "bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white shadow-lg"
                      : done
                      ? "text-[#10b981] hover:bg-emerald-50 border-2 border-emerald-200"
                      : "text-[#112C3E] hover:bg-gray-100 border-2 border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{l?.title || "Cierre del Curso"}</span>
                    {done && <FiCheckCircle size={14} className="text-emerald-500 flex-shrink-0" />}
                  </div>
                </button>
              </div>
            );
          }

          const unitNumber =
            units.slice(0, uIdx).filter((x) => x.id !== "closing-course").length + 1;

          return (
            <div key={u.id}>
              <button
                onClick={() =>
                  setExpandedUnits((prev) => ({ ...prev, [uIdx]: !prev[uIdx] }))
                }
                className={`w-full text-left px-4 py-3 font-bold flex justify-between items-center rounded-xl transition-all border-2 ${
                  expandedUnits[uIdx]
                    ? "bg-gradient-to-r from-[#0C212D] to-[#112C3E] text-white border-[#0C212D]"
                    : "hover:bg-gray-50 text-[#0C212D] border-transparent"
                }`}
              >
                <span className="text-sm">
                  Unit {unitNumber}: {u.title}
                </span>
                <FiChevronRight
                  className={`transition-transform flex-shrink-0 ${
                    expandedUnits[uIdx] ? "rotate-90 text-[#EE7203]" : ""
                  }`}
                  size={18}
                />
              </button>

              {expandedUnits[uIdx] && (
                <div className="mt-2 space-y-1 ml-2">
                  {u.lessons.map((l, lIdx) => {
                    const done =
                      progress[l.key]?.videoEnded || progress[l.key]?.exSubmitted;
                    const active = activeU === uIdx && activeL === lIdx;
                    return (
                      <button
                        key={l.key}
                        onClick={() => {
                          setActiveU(uIdx);
                          setActiveL(lIdx);
                        }}
                        className={`block w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all border-2 ${
                          active
                            ? "bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white shadow-lg border-[#EE7203]"
                            : done
                            ? "text-[#10b981] hover:bg-emerald-50 border-emerald-200"
                            : "text-[#112C3E] hover:bg-gray-50 border-transparent"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">
                            {l.id === "closing"
                              ? "Cierre de la unidad"
                              : `${uIdx + 1}.${lIdx + 1}  ${l.title}`}
                          </span>
                          {done && (
                            <FiCheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
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
    <main className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6">
       
        {/* Título de la lección */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-10 bg-gradient-to-b from-[#EE7203] to-[#FF3816] rounded-full"></div>
          <h1 className="text-3xl font-black text-[#0C212D]">
            {activeLesson?.title || "Lección actual"}
          </h1>
        </div>

        <>
          {activeLesson?.description && (
            <p className="text-[#112C3E]/80 mb-4 text-lg leading-relaxed">{activeLesson.description}</p>
          )}

          {/* VIDEO */}
          {resolvedVideoUrl && (
            <div className="aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 border-2 border-gray-200 shadow-xl">
              <iframe
                id="vimeo-player"
                src={resolvedVideoUrl}
                className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media; web-share"
                allowFullScreen
              />
            </div>
          )}

          {/* PDF */}
          {activeLesson?.pdfUrl && (
            <div className="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-lg">
              <h3 className="text-[#EE7203] font-black mb-4 flex items-center gap-3 text-lg">
                <div className="p-2 bg-gradient-to-br from-[#EE7203] to-[#FF3816] rounded-lg">
                  <FiFileText className="text-white" size={20} />
                </div>
                Resumen de la unidad
              </h3>
              <iframe
                src={toEmbedPdfUrl(activeLesson.pdfUrl)}
                className="w-full h-[500px] rounded-xl border-2 border-gray-200"
                title="Resumen PDF"
              />
            </div>
          )}

          {/* TEORÍA */}
          {activeLesson?.theory && (
            <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 shadow-lg">
              <article className="prose prose-slate max-w-none prose-headings:text-[#0C212D] prose-a:text-[#EE7203] prose-strong:text-[#0C212D]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {activeLesson.theory}
                </ReactMarkdown>
              </article>
            </div>
          )}

          {/* VOCABULARY */}
          {activeLesson?.vocabulary && (
            <RenderVocabularyBlock vocab={activeLesson.vocabulary} />
          )}

          {/* EJERCICIOS */}
          {Array.isArray(activeLesson?.ejercicios) &&
            activeLesson.ejercicios.length > 0 && (
              <>
                <section className="bg-white p-8 rounded-2xl border-2 border-gray-200 space-y-6 shadow-lg">
                  <div className="flex items-center justify-between pb-4 border-b-2 border-gray-100">
                    <h3 className="text-xl font-black text-[#0C212D]">Ejercicios</h3>
                    <span className="px-4 py-2 bg-gradient-to-r from-[#0C212D] to-[#112C3E] text-white text-sm font-bold rounded-xl">
                      {currentExercise + 1} / {activeLesson.ejercicios.length}
                    </span>
                  </div>

                  <ExerciseRunner
                    ejercicios={[activeLesson.ejercicios[currentExercise]]}
                    lessonKey={activeLesson.key}
                    exerciseIndex={currentExercise}
                    batchId={userProfile?.batchId}
                    userKey={userProfile?.userKey}
                    courseId={courseId}
                    onSubmit={() => {}}
                  />

                  <div className="flex justify-between items-center pt-4 border-t-2 border-gray-100">
                    <button
                      onClick={prevExercise}
                      disabled={currentExercise === 0}
                      className="px-6 py-3 rounded-xl bg-white border-2 border-gray-200 hover:border-[#0C212D] text-[#0C212D] disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold transition-all hover:shadow-lg"
                    >
                      ← Anterior
                    </button>
                    <button
                      onClick={nextExercise}
                      disabled={
                        currentExercise >= activeLesson.ejercicios.length - 1
                      }
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#EE7203] to-[#FF3816] hover:shadow-2xl hover:shadow-[#EE7203]/30 text-white font-bold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
                    >
                      Siguiente →
                    </button>
                  </div>
                </section>
              </>
            )}

          {activeLesson?.finalMessage && (
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-6 text-emerald-800 font-medium shadow-lg">
              {activeLesson.finalMessage}
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button
              onClick={goNextLesson}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-black shadow-xl bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white hover:shadow-2xl hover:shadow-[#EE7203]/40 transition-all hover:scale-105"
            >
              Siguiente lección
              <FiChevronRight size={20} />
            </button>
          </div>
        </>
      </div>
    </main>

    {/* ======================= SIDEBAR DERECHA ======================= */}
    <aside className="hidden xl:block xl:w-80 xl:shrink-0 bg-white border-l-2 border-gray-100 p-6 sticky top-0 h-screen overflow-y-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-gradient-to-b from-[#EE7203] to-[#FF3816] rounded-full"></div>
          <h3 className="text-lg font-black text-[#0C212D]">
            Resumen del material
          </h3>
        </div>
        <p className="text-sm text-[#112C3E]/70 leading-relaxed">
          {curso?.descripcion || "Sin descripción disponible"}
        </p>
      </div>

      <div className="bg-gradient-to-br from-[#EE7203]/10 to-[#FF3816]/5 border-2 border-[#EE7203]/20 rounded-2xl p-5 space-y-3">
        <p className="text-xs text-[#112C3E]/60 uppercase tracking-wider font-bold">Lección actual</p>
        <p className="font-black text-[#EE7203] text-lg">
          {activeLesson?.title || "—"}
        </p>
        <p className="text-sm text-[#0C212D] font-medium">
          📚 {units[activeU]?.title || "—"}
        </p>
      </div>
    </aside>
  </div>
);



}