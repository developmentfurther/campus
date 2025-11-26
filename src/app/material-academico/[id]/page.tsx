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
    theory: l.teoria || "",   // ✅ nuevo campo markdown
    videoUrl: l.urlVideo || "",
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
Object.entries(data.byLesson || {}).forEach(([key, val]: [string, any]) => {
  const cleanKey = key
    .replace("closing-course", "closing")
    .replace("closing::", "closing-course::");
  normalized[cleanKey] = val;
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
      {vocab.mode === "table" && (
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






/* =========================================================
   🧠 ExerciseRunner — versión avanzada completa (TSX)
   ========================================================= */


/* =========================================================
   🧠 ExerciseRunner — VERSIÓN CORREGIDA
   ========================================================= */
/* =========================================================
   🧠 ExerciseRunner — VERSIÓN CORREGIDA
   ========================================================= */
function ExerciseRunner({
  ejercicios,
  lessonKey,
  exerciseIndex, // 🆕 NUEVO: índice del ejercicio actual
  batchId,
  userKey,
  courseId,
  onSubmit,
}: {
  ejercicios: any[];
  lessonKey: string;
  exerciseIndex: number; // 🆕 NUEVO
  batchId: string;
  userKey: string;
  courseId: string;
  onSubmit?: (result: { correct: number; total: number }) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    msg: string;
    correct?: number;
    total?: number;
  } | null>(null);

  const { user, saveCourseProgress } = useAuth();
  const prevProgress = (progress as any) || {};

  // 🆕 CONSTRUIR KEY ÚNICA POR EJERCICIO
  const currentExerciseKey = `${lessonKey}::ex${exerciseIndex}`;

  // Manejar respuesta individual
  const handleAnswer = (id: string, value: any) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  // 🆕 Cargar estado previo DEL EJERCICIO ESPECÍFICO
  useEffect(() => {
    const prev = prevProgress?.[currentExerciseKey];

    if (!prev?.exSubmitted) {
      // Si no hay intento previo, resetear todo
      setSubmitted(false);
      setFeedback(null);
      setAnswers({});
      return;
    }

    // Si hay intento previo, cargar ese estado
    setSubmitted(true);

    if (prev.score?.answers) {
      setAnswers(prev.score.answers);
    }

    setFeedback({
      ok: prev.exPassed,
      msg: prev.exPassed ? "¡Correcto!" : "Intento previo registrado.",
      correct: prev.score?.correct,
      total: prev.score?.total,
    });
  }, [currentExerciseKey]); // 🔧 SOLO depende de currentExerciseKey

  // ✅ Evaluación (sin cambios en la lógica interna)
  const evaluate = async () => {
    if (submitted) return;

    const ex = ejercicios[0];
    if (!ex) return;

    let correct = 0;
    let totalItems = 1;

    // [... tu lógica de evaluación existente ...]
    const evalMC = (ex: any) => {
      const a = answers[ex.id];
      return a === ex.correctIndex;
    };

    const evalTF = (ex: any) => {
      const a = answers[ex.id];
      return a === ex.answer;
    };

    const evalFill = (ex: any) => {
      const a = answers[ex.id];
      return (
        Array.isArray(a) &&
        Array.isArray(ex.answers) &&
        a.every(
          (v, i) =>
            v?.trim()?.toLowerCase() ===
            ex.answers[i]?.trim()?.toLowerCase()
        )
      );
    };

    const evalReadingOrListening = (ex: any) => {
      let okCount = 0;
      const totalQ = ex.questions?.length || 0;

      ex.questions.forEach((q: any) => {
        const qKey = `${ex.id}::${q.id}`;
        const ans = answers[qKey];

        let isOk = false;

        if (q.kind === "mc") {
          isOk = ans === q.correctIndex;
        } else if (q.kind === "tf") {
          isOk = ans === q.answer;
        }

        if (isOk) okCount++;
      });

      correct = okCount;
      totalItems = totalQ || 1;
    };

    switch (ex.type) {
      case "multiple_choice":
        totalItems = 1;
        correct = evalMC(ex) ? 1 : 0;
        break;

      case "true_false":
        totalItems = 1;
        correct = evalTF(ex) ? 1 : 0;
        break;

      case "fill_blank":
        totalItems = 1;
        correct = evalFill(ex) ? 1 : 0;
        break;

      case "reading":
      case "listening":
        evalReadingOrListening(ex);
        break;

      case "sentence_correction": {
        const a = answers[ex.id];
        if (typeof a === "string") {
          const matched = ex.correctAnswers.some(
            (ans: string) =>
              ans.trim().toLowerCase() === a.trim().toLowerCase()
          );
          correct = matched ? 1 : 0;
        } else {
          correct = 0;
        }
        totalItems = 1;
        break;
      }

      case "speaking":
      case "reflection":
      case "vocabulary":
        correct = 1;
        totalItems = 1;
        break;

      default:
        correct = 0;
        totalItems = 1;
        break;
    }

    const passed = correct === totalItems;

    setSubmitted(true);
    setFeedback({
      ok: passed,
      msg: passed
        ? "✅ ¡Ejercicio completado!"
        : "❌ Hay respuestas incorrectas.",
      correct,
      total: totalItems,
    });

    try {
      if (!userProfile?.batchId || !userProfile?.userKey) {
        console.error("❌ No hay batchId o userKey en userProfile");
        return;
      }

      if (user?.uid && saveCourseProgress) {
        // 🆕 GUARDAR CON LA KEY ÚNICA DEL EJERCICIO
        await saveCourseProgress(user.uid, courseId, {
          [currentExerciseKey]: {
            exSubmitted: true,
            exPassed: passed,
            score: { correct, total: totalItems, answers },
          },
        });

        console.log("✅ Progreso guardado para:", currentExerciseKey);
      }
    } catch (err) {
      console.error("🔥 Error guardando resultado:", err);
    }

    onSubmit?.({ correct, total: totalItems });
  };

  // [... resto del código de renderizado sin cambios ...]
  const renderSolution = (ex: any) => {
    if (feedback?.ok) return null;

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

  const renderReading = (ex: any) => {
    return (
      <div className="space-y-6">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <h4 className="font-semibold text-slate-900 mb-3 text-lg">
            {ex.title || "Reading"}
          </h4>
          <p className="text-slate-700 whitespace-pre-line leading-relaxed break-words max-w-[750px]">
            {ex.text}
          </p>
        </div>

        <div className="space-y-4">
          {ex.questions.map((q: any, idx: number) => {
            const qKey = `${ex.id}::${q.id}`;
            const current = answers[qKey];
            let isCorrect = false;

            if (submitted) {
              if (q.kind === "mc") {
                isCorrect = current === q.correctIndex;
              } else if (q.kind === "tf") {
                isCorrect = current === q.answer;
              }
            }

            return (
              <div key={q.id} className="border border-slate-300 rounded-xl p-4 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <h5 className="font-medium mb-2">
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

                {q.kind === "mc" && (
                  <div className="space-y-2">
                    {q.options.map((opt: string, optIdx: number) => {
                      const selected = current === optIdx;
                      const isOptCorrect = optIdx === q.correctIndex;
                      const base = "flex items-center gap-3 p-3 rounded-lg border cursor-pointer";
                      const color = submitted
                        ? isOptCorrect
                          ? "bg-emerald-50 border-emerald-300"
                          : selected
                          ? "bg-rose-50 border-rose-300"
                          : "bg-slate-50 border-slate-200"
                        : selected
                        ? "bg-blue-50 border-blue-300"
                        : "bg-slate-50 border-slate-300 hover:bg-slate-100";

                      return (
                        <label key={optIdx} className={`${base} ${color}`}>
                          <input
                            type="radio"
                            disabled={submitted}
                            checked={selected}
                            onChange={() => handleAnswer(qKey, optIdx)}
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {q.kind === "tf" && (
                  <div className="flex gap-4">
                    {[true, false].map((val) => {
                      const selected = current === val;
                      const isOptCorrect = q.answer === val;
                      const base = "flex items-center gap-3 px-4 py-2 rounded-lg border cursor-pointer";
                      const color = submitted
                        ? isOptCorrect
                          ? "bg-emerald-50 border-emerald-300"
                          : selected
                          ? "bg-rose-50 border-rose-300"
                          : "bg-slate-50 border-slate-200"
                        : selected
                        ? "bg-blue-50 border-blue-300"
                        : "bg-slate-50 border-slate-300 hover:bg-slate-100";

                      return (
                        <label key={String(val)} className={`${base} ${color}`}>
                          <input
                            type="radio"
                            disabled={submitted}
                            checked={selected}
                            onChange={() => handleAnswer(qKey, val)}
                          />
                          <span>{val ? "True" : "False"}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {submitted && !isCorrect && (
                  <div className="mt-2 text-xs text-rose-600">
                    {q.kind === "mc" && `Correct answer: ${q.options[q.correctIndex]}`}
                    {q.kind === "tf" && `Correct answer: ${q.answer ? "True" : "False"}`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderFillBlank = (ex: any, answers: any, submitted: boolean, handleAnswer: any) => {
  return (
    <div className="space-y-3 max-w-[650px]">
      {ex.answers.map((_: any, idx: number) => {
        const userAns = answers[ex.id]?.[idx] || "";
        const correct = ex.answers[idx];

        const isCorrect =
          submitted &&
          userAns.trim().toLowerCase() === correct.trim().toLowerCase();

        const base =
          "px-4 py-2 rounded-xl bg-white border text-sm transition w-full";

        const color = !submitted
          ? "border-slate-300 focus:ring-2 focus:ring-blue-300"
          : isCorrect
          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
          : "border-rose-300 bg-rose-50 text-rose-700";

        return (
          <div key={idx} className="space-y-1">
            <input
              type="text"
              disabled={submitted}
              className={`${base} ${color}`}
              placeholder={`Respuesta ${idx + 1}`}
              value={userAns}
              onChange={(e) => {
                const val = e.target.value;
                const current = Array.isArray(answers[ex.id])
                  ? [...answers[ex.id]]
                  : [];
                current[idx] = val;
                handleAnswer(ex.id, current);
              }}
            />

            {/* Feedback si es incorrecto */}
            {submitted && !isCorrect && (
              <p className="text-xs text-rose-600">
                Correcta: <b>{correct}</b>
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};



const renderSpeaking = (ex: any) => {
  return (
    <div className="space-y-4 max-w-[700px]">
      {/* Título del ejercicio */}
      {ex.title && (
        <h4 className="text-lg font-semibold text-slate-900">{ex.title}</h4>
      )}

      {/* Bullets */}
      <ul className="list-disc pl-6 space-y-2 text-slate-700">
        {ex.bullets.map((item: string, idx: number) => (
          <li key={idx} className="leading-relaxed">
            {item}
          </li>
        ))}
      </ul>

      {/* Notas opcionales */}
      {ex.notes && (
        <p className="text-sm text-slate-500 italic">
          {ex.notes}
        </p>
      )}

      {/* Mensaje de que no es auto-evaluable */}
      <p className="text-xs text-slate-500 border-t pt-3">
        * Este ejercicio no es auto-evaluable. Tu progreso se registra al avanzar.
      </p>
    </div>
  );
};

const renderReflection = (
  ex: any,
  answers: any,
  submitted: boolean,
  handleAnswer: any
) => {
  const totalIdeas = ex.ideasCount || 3;

  return (
    <div className="space-y-6 max-w-[700px]">
      
      {/* CONSIGNA */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <h4 className="font-semibold text-slate-900 mb-2">
          {ex.title || "Reflection"}
        </h4>
        <p className="text-slate-700 whitespace-pre-line leading-relaxed">
          {ex.prompt}
        </p>
      </div>

      {/* CAMPOS DE RESPUESTA */}
      <div className="space-y-4">
        {[...Array(totalIdeas)].map((_, idx) => {
          const key = `${ex.id}::idea${idx}`;
          const userText = answers[key] || "";

          const base =
            "w-full p-3 rounded-lg border bg-white text-sm focus:ring-2 transition";

          const color = !submitted
            ? "border-slate-300 focus:ring-blue-300"
            : userText.trim().length > 0
            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
            : "border-rose-300 bg-rose-50 text-rose-700";

          return (
            <div key={idx} className="space-y-1">
              <textarea
                rows={3}
                disabled={submitted}
                className={`${base} ${color}`}
                placeholder={`Idea ${idx + 1}`}
                value={userText}
                onChange={(e) => handleAnswer(key, e.target.value)}
              />

              {/* Feedback para ideas vacías */}
              {submitted && userText.trim().length === 0 && (
                <p className="text-xs text-rose-600">
                  * Esta idea no puede estar vacía.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* NOTA */}
      <p className="text-xs text-slate-500">
        * Este ejercicio no es auto-evaluable. Se registra tu participación.
      </p>
    </div>
  );
};

const renderSentenceCorrection = (
  ex: any,
  answers: any,
  submitted: boolean,
  handleAnswer: any
) => {
  const userAns = answers[ex.id] || "";

  // Determinar si es correcto cuando submitted = true
  const isCorrect =
    submitted &&
    typeof userAns === "string" &&
    ex.correctAnswers.some(
      (a: string) =>
        a.trim().toLowerCase() === userAns.trim().toLowerCase()
    );

  const base =
    "w-full p-3 rounded-xl border text-sm transition bg-white";

  const color = !submitted
    ? "border-slate-300 focus:ring-2 focus:ring-blue-300"
    : isCorrect
    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
    : "border-rose-300 bg-rose-50 text-rose-700";

  return (
    <div className="space-y-5 max-w-[700px]">
      {/* Frase incorrecta */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <h4 className="font-semibold text-slate-900 mb-3">
          Corregí la siguiente frase:
        </h4>

        <p className="italic text-slate-700">
          “{ex.incorrect}”
        </p>
      </div>

      {/* Input del alumno */}
      <div className="space-y-1">
        <input
          type="text"
          disabled={submitted}
          placeholder="Escribí la frase corregida"
          className={`${base} ${color}`}
          value={userAns}
          onChange={(e) => handleAnswer(ex.id, e.target.value)}
        />

        {/* Feedback si está mal */}
        {submitted && !isCorrect && (
          <p className="text-xs text-rose-600">
            Respuesta correcta:
            {" "}
            <b>{ex.correctAnswers[0]}</b>
            {ex.correctAnswers.length > 1 &&
              ` (o variantes aceptadas: ${ex.correctAnswers
                .slice(1)
                .join(", ")})`}
          </p>
        )}
      </div>

      {/* Nota */}
      <p className="text-xs text-slate-500">
        * Evaluación exacta (sin mayúsculas / minúsculas).
      </p>
    </div>
  );
};





  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-3 mb-1"
      >
        <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 grid place-items-center text-xl">
          🧠
        </div>
        <h3 className="text-xl font-semibold text-slate-900">Ejercicio</h3>
      </motion.div>

      {ejercicios.map((ex) => (
        <motion.div
          key={ex.id}
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
          {ex.type !== "reading" && ex.type !== "listening" && (
            <h4 className="font-semibold text-slate-900 mb-4 text-lg">
              {ex.question || ex.prompt || ex.statement}
            </h4>
          )}


{ex.type === "speaking" && renderSpeaking(ex)}

{ex.type === "fill_blank" &&
  renderFillBlank(ex, answers, submitted, handleAnswer)}

{ex.type === "reflection" &&
  renderReflection(ex, answers, submitted, handleAnswer)}
{ex.type === "sentence_correction" &&
  renderSentenceCorrection(ex, answers, submitted, handleAnswer)}



          {/* MULTIPLE CHOICE */}
          {ex.type === "multiple_choice" && (
            <div className="flex flex-col gap-3">
              {ex.options.map((opt: string, idx: number) => {
                const isSelected = answers[ex.id] === idx;
                const isCorrect = idx === ex.correctIndex;
                const base = "flex items-center gap-3 p-4 rounded-xl cursor-pointer transition border";
                const color = submitted
                  ? isCorrect
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
                    whileTap={!submitted ? { scale: 0.98 } : {}}
                    className={base + " " + color}
                  >
                    <input
                      type="radio"
                      name={ex.id}
                      disabled={submitted}
                      checked={isSelected}
                      onChange={() => handleAnswer(ex.id, idx)}
                    />
                    <span className="text-sm">{opt}</span>
                  </motion.label>
                );
              })}
              {submitted && renderSolution(ex)}
            </div>
          )}

          {/* TRUE/FALSE */}
          {ex.type === "true_false" && (
            <div className="flex gap-4">
              {["Verdadero", "Falso"].map((label, idx) => {
                const val = idx === 0;
                const isSelected = answers[ex.id] === val;
                const isCorrect = ex.answer === val;
                const base = "flex items-center gap-3 px-6 py-3 rounded-xl cursor-pointer border transition";
                const color = submitted
                  ? isCorrect
                    ? "bg-emerald-50 border-emerald-300"
                    : isSelected
                    ? "bg-rose-50 border-rose-300"
                    : "bg-white border-slate-200"
                  : isSelected
                  ? "bg-blue-50 border-blue-300 text-blue-700 shadow-sm"
                  : "bg-white border-slate-300 hover:bg-slate-100";

                return (
                  <motion.label
                    key={label}
                    whileHover={!submitted ? { scale: 1.02 } : {}}
                    whileTap={!submitted ? { scale: 0.96 } : {}}
                    className={base + " " + color}
                  >
                    <input
                      type="radio"
                      name={ex.id}
                      disabled={submitted}
                      checked={isSelected}
                      onChange={() => handleAnswer(ex.id, val)}
                    />
                    <span className="font-medium">{label}</span>
                  </motion.label>
                );
              })}
              {submitted && renderSolution(ex)}
            </div>
          )}

          {/* READING */}
          {ex.type === "reading" && renderReading(ex)}

          {/* LISTENING */}
          {ex.type === "listening" && (
            <div className="space-y-6">
              <audio controls src={ex.audioUrl} className="w-full max-w-md" />
              {renderReading(ex)}
            </div>
          )}
        </motion.div>
      ))}

      <motion.button
        onClick={evaluate}
        disabled={submitted}
        whileHover={!submitted ? { scale: 1.03 } : {}}
        whileTap={!submitted ? { scale: 0.97 } : {}}
        className={`w-full py-3 rounded-xl font-semibold transition shadow-sm
          ${
            submitted
              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
      >
        {submitted ? "Intento registrado" : "Comprobar respuestas"}
      </motion.button>

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
        Cargando curso...
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
 <div className="flex h-screen overflow-hidden bg-white text-slate-900">
    {/* ======================= SIDEBAR IZQUIERDA ======================= */}
    <aside className="w-72 shrink-0 border-r border-slate-200 bg-white sticky top-0 h-screen overflow-y-auto">
      <div className="p-4 border-b border-slate-200">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600"
        >
          <FiChevronLeft className="text-blue-600" />
          Volver al inicio
        </button>
      </div>

      <div className="p-4 border-b border-slate-200">
        <h1 className="text-lg font-bold text-slate-900 line-clamp-1">{curso.titulo}</h1>
        <p className="text-xs text-slate-500 line-clamp-2">{curso.descripcion}</p>
        
      </div>

      <nav className="p-3 space-y-2 pb-32">
        {units.map((u, uIdx) => {
          // Cierre del curso
          if (u.id === "closing-course") {
            const l = u.lessons?.[0];
            const done = l && (progress[l.key]?.videoEnded || progress[l.key]?.exSubmitted);
            const active = activeU === uIdx && activeL === 0;

            return (
              <div key={u.id} className="mt-4 pt-3 border-t border-slate-200">
                <div className="px-3 py-2 font-semibold text-slate-700">🎓 Cierre del curso</div>
                <button
                  onClick={() => {
                    setActiveU(uIdx);
                    setActiveL(0);
                  }}
                  className={`block w-full text-left px-5 py-1.5 rounded-md text-sm transition ${
                    active
                      ? "bg-blue-50 text-blue-600 border border-blue-200"
                      : done
                      ? "text-emerald-600 hover:bg-slate-100"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{l?.title || "Cierre del Curso"}</span>
                    {done && <FiCheckCircle size={12} className="text-emerald-500" />}
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
                className={`w-full text-left px-3 py-2 font-semibold flex justify-between items-center rounded-md transition ${
                  expandedUnits[uIdx]
                    ? "bg-blue-50 text-blue-700"
                    : "hover:bg-slate-100 text-slate-700"
                }`}
              >
                <span>
                  Unit {unitNumber}: {u.title}
                </span>
                <FiChevronRight
                  className={`transition-transform ${
                    expandedUnits[uIdx] ? "rotate-90" : ""
                  }`}
                />
              </button>

              {expandedUnits[uIdx] && (
                <div className="mt-1 space-y-1">
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
                        className={`block w-full text-left px-5 py-1.5 rounded-md text-sm transition ${
                          active
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : done
                            ? "text-emerald-600 hover:bg-slate-100"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">
  {l.id === "closing"
    ? "Cierre de la unidad"
    : `${uIdx + 1}.${lIdx + 1}  ${l.title}`}
</span>


                          {done && (
                            <FiCheckCircle size={12} className="text-emerald-500" />
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
    
    {/* Logo fijo al fondo */}

 {/* Logo fijo al fondo */}
     <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
        <div className="w-full h-px bg-slate-200 mb-4" />
        <div className="flex justify-center">
          <Image
            src="/images/logo.png"
            alt="Further Corporate"
            width={200}
            height={80}
            className="opacity-90"
          />
        </div>
      </div>

    </aside>

    {/* ======================= CONTENIDO PRINCIPAL ======================= */}
    <main className="flex-1 p-8 overflow-y-auto bg-white">
      <div className="max-w-5xl mx-auto space-y-6">
       

        <h1 className="text-2xl font-bold text-slate-900">
          {activeLesson?.title || "Lección actual"}
        </h1>

          <>

          {activeLesson?.description && (
              <p className="text-slate-600 mb-2">{activeLesson.description}</p>
            )}
            {/* VIDEO */}
            {resolvedVideoUrl && (
              <div className="aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                <iframe
                  id="vimeo-player"
                  src={resolvedVideoUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {/* PDF */}
            {activeLesson?.pdfUrl && (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-blue-600 font-semibold mb-3 flex items-center gap-2">
                  <FiFileText /> Resumen de la unidad
                </h3>
                <iframe
                  src={toEmbedPdfUrl(activeLesson.pdfUrl)}
                  className="w-full h-[500px] rounded-lg border border-slate-200"
                  title="Resumen PDF"
                />
              </div>
            )}

            

            {/* TEORÍA */}
            {activeLesson?.theory && (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <article className="prose max-w-none">
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
                    <section className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">
                          {currentExercise + 1} / {activeLesson.ejercicios.length}
                        </span>
                      </div>

  
<ExerciseRunner
  ejercicios={[activeLesson.ejercicios[currentExercise]]}
  lessonKey={activeLesson.key}
  exerciseIndex={currentExercise} // 🆕 AGREGAR ESTE PROP
  batchId={userProfile?.batchId}
  userKey={userProfile?.userKey}
  courseId={courseId}
  onSubmit={async ({ correct, total }) => {
    const passed = correct === total;
    
    // 🆕 Construir la key única del ejercicio
    const exerciseKey = `${activeLesson.key}::ex${currentExercise}`;

    if (!user?.uid) {
      toast.error("Inicia sesión para guardar tu progreso");
      return;
    }

    try {
      await saveCourseProgress(user.uid, courseId, {
        [exerciseKey]: {
          exSubmitted: true,
          exPassed: passed,
          score: { correct, total },
        },
      });

      setProgress((prev) => ({
        ...prev,
        [exerciseKey]: {
          ...(prev[exerciseKey] || {}),
          exSubmitted: true,
          exPassed: passed,
          score: { correct, total },
        },
      }));

      toast[passed ? "success" : "info"](
        passed
          ? "🎉 ¡Ejercicio aprobado!"
          : "❌ Fallaste. Tu intento quedó guardado."
      );
    } catch (error) {
      console.error("🔥 Error guardando progreso:", error);
      toast.error("No se pudo guardar tu progreso");
    }
  }}
/>


                      <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                        <button
                          onClick={prevExercise}
                          disabled={currentExercise === 0}
                          className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 text-sm font-medium transition-all"
                        >
                          ← Anterior
                        </button>
                        <button
                          onClick={nextExercise}
                          disabled={
                            currentExercise >= activeLesson.ejercicios.length - 1
                          }
                          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all"
                        >
                          Siguiente →
                        </button>
                      </div>
                    </section>
               
                </>
              )}

            {activeLesson?.finalMessage && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-emerald-700">
                {activeLesson.finalMessage}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={goNextLesson}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold shadow bg-blue-600 text-white hover:bg-blue-700"
              >
                Siguiente lección
                <FiChevronRight />
              </button>
            </div>
          </>
      </div>
    </main>

    {/* ======================= SIDEBAR DERECHA ======================= */}
    <aside className="hidden xl:block xl:w-80 xl:shrink-0 bg-white border-l border-slate-200 p-6 sticky top-0 h-screen overflow-y-auto">
      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        Resumen del curso
      </h3>
      <p className="text-sm text-slate-600 mb-4">
        {curso?.descripcion || "Sin descripción disponible"}
      </p>

      

      <div className="border-t border-slate-200 pt-4 space-y-1 text-sm">
        <p className="text-slate-600">Lección actual</p>
        <p className="font-semibold text-blue-600">
          {activeLesson?.title || "—"}
        </p>
        <p className="text-xs text-slate-500">
          Unidad: {units[activeU]?.title || "—"}
        </p>
      </div>
    </aside>
  </div>
);



}
