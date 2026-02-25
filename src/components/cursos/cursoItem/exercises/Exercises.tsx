"use client";

import React, {
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";


// ===== Definiciones de tipo para los ejercicios =====

export interface ExerciseBase {
  id: string;
  title: string; 
  instructions: string;  
}

/* ===============================
   Tipos existentes (ya usados)
=================================*/

interface MultipleChoiceExercise extends ExerciseBase {
  type: "multiple_choice";
  question: string;
  options: string[];
  correctIndex: number;
}

export interface TrueFalseExercise extends ExerciseBase {
  type: "true_false";
  statement: string;
  answer: boolean;
}

export interface FillBlankExercise extends ExerciseBase {
  type: "fill_blank";
  sentence: string;
  answers: string[];
  hintWords: string;
}

export interface TextExercise extends ExerciseBase {
  type: "text";
  maxLength: number;
}

export interface ReorderExercise extends ExerciseBase {
  type: "reorder";
  items: string[];
  correctOrder: number[];
}

export interface MatchingExercise extends ExerciseBase {
  type: "matching";
  pairs: { left: string; right: string }[];
}

/* =========================================
   Preguntas de comprensión (Reading/Listening)
============================================*/

export interface ComprehensionQuestionBase {
  id: string;
  prompt: string;
}

export interface ComprehensionMCQuestion extends ComprehensionQuestionBase {
  kind: "mc";
  options: string[];
  correctIndex: number;
}

export interface ComprehensionTFQuestion extends ComprehensionQuestionBase {
  kind: "tf";
  answer: boolean;
}
export interface ComprehensionOpenQuestion extends ComprehensionQuestionBase {
  kind: "open";
  placeholder?: string; // opcional
  maxLength?: number;  // opcional
}


type ComprehensionQuestion =
  | ComprehensionMCQuestion
  | ComprehensionTFQuestion
  | ComprehensionOpenQuestion;

/* =========================================
   Nuevos tipos de ejercicios
============================================*/

// 📖 Reading: texto + preguntas de comprensión
export interface ReadingExercise extends ExerciseBase {
  type: "reading";
  text: string; // texto a leer
  questions: ComprehensionQuestion[]; // MC o True/False
}


// 🎧 Listening: audio + preguntas de comprensión
export interface ListeningExercise extends ExerciseBase {
  type: "listening";
  audioUrl: string;             // URL del audio (storage, https, etc.)
  questions: ComprehensionQuestion[];
  transcript?: string;          // opcional: texto del audio si lo quieren
}

// 🗣️ Speaking: bullets con prompts para hablar
export interface SpeakingExercise extends ExerciseBase {
  type: "speaking";
  bullets: string[];  // cada ítem = un bullet/prompt
  notes?: string;     // campo extra opcional de notas/instrucciones
}

// 💭 Reflection: texto + 3 ideas del alumno
export interface ReflectionExercise extends ExerciseBase {
  type: "reflection";
  prompt: string;     // consigna de reflexión
  ideasCount: number; // normalmente 3 (puedes setear por defecto en el editor)
}

// ✏️ Sentence correction: corregir la frase
export interface SentenceCorrectionExercise extends ExerciseBase {
  type: "sentence_correction";
  incorrect: string;        // frase mal escrita
  correctAnswers: string[]; // posibles correcciones válidas
  // Luego en el front de alumno puedes decidir si haces comparación exacta,
  // case-insensitive, etc.
}

export interface VerbTableExercise extends ExerciseBase {
  type: "verb_table";
  rows: {
    subject: string;
    positive: string;
    negative: string;
  }[];
  // 🔥 NUEVO: Define qué celdas están vacías
  blanks: {
    rowIndex: number;
    column: "positive" | "negative"; // qué columna completar
  }[];
  // Las respuestas correctas para cada blank
  correct: {
    [key: string]: string; // key = "rowIndex-column", value = respuesta
  };
}



export interface OpenQuestionExercise extends ExerciseBase {
  type: "open_question";
  prompt: string;
  maxLength: number;
}

/* =========================================
   Unión principal de ejercicios
============================================*/

export type Exercise =
  | MultipleChoiceExercise
  | TrueFalseExercise
  | FillBlankExercise
  | TextExercise
  | ReorderExercise
  | MatchingExercise
  | ReadingExercise
  | ListeningExercise
  | SpeakingExercise
  | ReflectionExercise
  | SentenceCorrectionExercise
  | VerbTableExercise
  | OpenQuestionExercise;


// ===== Props del componente =====

interface ExercisesProps {
  initial?: Exercise[];
  onChange?: (exercises: Exercise[]) => void;
}

// ===== Implementación del componente =====

export default function Exercises({ initial = [], onChange }: ExercisesProps) {
  // ===== UI y estado de renderización =====
  const [snapshot, setSnapshot] = useState<Exercise[]>([]);
  const [savedMessage, setSavedMessage] = useState<string>("");
  const [touched, setTouched] = useState<boolean>(false);
  const [activeIdx, setActiveIdx] = useState<number>(0);

  // ===== Refs como única fuente de verdad =====
  const exercisesRef = useRef<Exercise[]>(initial ? structuredClone(initial) : []);
  const validationsRef = useRef<Record<string, boolean>>({});
  const mountedRef = useRef<boolean>(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ===== Utilidades =====
  const makeId = (): string =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const firstLine = (str: string = ""): string => {
    const s = String(str || "");
    const line = s
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.length > 0);
    return line || s.trim();
  };

  // ===== Validación por tipo =====
  const validateExercise = (ex: Exercise): boolean => {
  if (!ex || !ex.type) return false;

  switch (ex.type) {
    case "multiple_choice": {
      if (!ex.question || ex.question.trim() === "") return false;

      const opts = (ex.options || []).map(o => o.trim());
      const nonEmpty = opts.filter(o => o !== "");

      if (nonEmpty.length < 2) return false;

      const idx = Number(ex.correctIndex);
      if (!Number.isInteger(idx)) return false;
      if (idx < 0 || idx >= opts.length) return false;
      if (opts[idx] === "") return false;

      return true;
    }

    case "true_false":
      return ex.statement && ex.statement.trim() !== "" && typeof ex.answer === "boolean";

    case "fill_blank": {
      if (!ex.sentence || typeof ex.sentence !== "string") return false;

      const blanks = (ex.sentence.match(/\*\*\*/g) || []).length;
      if (blanks === 0) return false;

      if (!Array.isArray(ex.answers)) return false;
      if (ex.answers.length !== blanks) return false;

      // Permitir respuestas vacías mientras editan
      return true;
    }

    case "text":
      return true; // nada estrictamente requerido

    case "reorder": {
      const nonEmpty = (ex.items || []).filter(i => i.trim() !== "");
      return nonEmpty.length >= 2; // no requiere correctOrder completo
    }

    case "matching": {
      const pairs = ex.pairs || [];
      if (pairs.length === 0) return false;

      // Debe haber al menos un par válido
      const atLeastOne = pairs.some(
        p => p.left.trim() !== "" && p.right.trim() !== ""
      );
      return atLeastOne;
    }

    case "reading": {
      if (!ex.text || ex.text.trim() === "") return false;

      // Si no hay preguntas, igual permitir
      if (!ex.questions || ex.questions.length === 0) return true;

      return ex.questions.every(q => q.prompt.trim() !== "");
    }

    case "listening": {
      if (!ex.audioUrl) return false;

      if (!ex.questions || ex.questions.length === 0) return true;

      return ex.questions.every(q => q.prompt.trim() !== "");
    }

    case "speaking": {
      const bullets = ex.bullets || [];
      if (bullets.length === 0) return false;

      // al menos uno no vacío
      return bullets.some(b => b.trim() !== "");
    }

    case "reflection":
      return ex.prompt.trim() !== "" && ex.ideasCount >= 1;

    case "sentence_correction":
      return ex.incorrect.trim() !== "" &&
        Array.isArray(ex.correctAnswers) &&
        ex.correctAnswers.length > 0;

    case "verb_table": {
      const rows = ex.rows || [];
      if (rows.length === 0) return false;

      // Debe haber al menos un subject válido
      return rows.some(r => r.subject.trim() !== "");
    }

    case "open_question":
  return ex.prompt?.trim() !== "";

    default:
      return false;
  }
};


  // ===== Actualización de snapshot con debounce (revalidación) =====
  // ✅ Validar solo el ejercicio que cambió
const updateSnapshot = useCallback((changedId?: string) => {
  if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
  updateTimeoutRef.current = setTimeout(() => {
    if (changedId) {
      const ex = exercisesRef.current.find(e => e.id === changedId);
      if (ex) validationsRef.current[changedId] = validateExercise(ex);
    } else {
      // Solo si es necesario validar todo
      exercisesRef.current.forEach((e) => {
        validationsRef.current[e.id] = validateExercise(e);
      });
    }
    setSnapshot([...exercisesRef.current]);
  }, 300);
}, []);
  // ===== Actualización inmediata de snapshot (cambios estructurales) =====
  const forceSnapshot = useCallback(() => {
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    exercisesRef.current.forEach((e) => {
      validationsRef.current[e.id] = validateExercise(e);
    });
    setSnapshot([...exercisesRef.current]);
  }, []);

  // ===== Montaje inicial =====
 useEffect(() => {
  if (!mountedRef.current) {
    exercisesRef.current = initial ? structuredClone(initial) : [];

    // Sincronizar answers de fill_blank con los *** de la sentence
    exercisesRef.current = exercisesRef.current.map(ex => {
  // Normalizar campos base para evitar undefined en inputs controlados
  const normalized = {
    ...ex,
    title: ex.title ?? "",
    instructions: ex.instructions ?? "",
  };

  // Sincronizar answers de fill_blank
  if (normalized.type === "fill_blank") {
    const blanks = (normalized.sentence?.match(/\*\*\*/g) || []).length;
    const answers = Array.from({ length: blanks }, (_, i) => normalized.answers?.[i] || "");
    return { ...normalized, answers };
  }

  return normalized;
});

    exercisesRef.current.forEach((e) => {
      validationsRef.current[e.id] = validateExercise(e);
    });
    setActiveIdx((idx) =>
      exercisesRef.current.length === 0
        ? 0
        : Math.min(idx, exercisesRef.current.length - 1)
    );
    setSnapshot([...exercisesRef.current]);
    mountedRef.current = true;
  }
}, [initial]);

  // ===== Mutadores de colección =====
  const addExercise = (type: Exercise['type']) => {
    const id = makeId();
    let base: Exercise | null = null;
        switch (type) {
      case "multiple_choice":
        base = {
          id,
          type,
          title: "",              
          instructions: "",   
          question: "",
          options: ["", ""],
          correctIndex: 0,
        };
        break;

      case "true_false":
        base = {
          id,
          type,
          title: "",             
          instructions: "",  
          statement: "",
          answer: true,
        };
        break;

      case "fill_blank":
        base = {
          id,
          type,
          title: "",
          instructions: "",
          sentence: "",
          answers: [],
          hintWords: "",
        };
        break;

      case "text":
        base = {
          id,
          type,
          title: "",
          instructions: "",
          maxLength: 500,
        };
        break;

      case "reorder":
        base = {
          id,
          type,
          title: "",
          instructions: "",
          items: [],
          correctOrder: [],
        };
        break;

      case "matching":
        base = {
          id,
          type,
          title: "",
          instructions: "",
          pairs: [{ left: "", right: "" }],
        };
        break;

      /* ===============================
         📖 READING — texto + preguntas
      ==================================*/
      case "reading":
        base = {
          id,
          type,
          title: "",
          instructions: "",
          text: "",
          questions: [
            {
              id: makeId(),
              kind: "mc",
              prompt: "",
              options: ["", ""],
              correctIndex: 0,
            },
          ],
        };
        break;

      

      /* ===============================
         🎧 LISTENING — audio + preguntas
      ==================================*/
      case "listening":
        base = {
          id,
          type,
          title: "",
          instructions: "",
          audioUrl: "",
          questions: [
            {
              id: makeId(),
              kind: "tf",
              prompt: "",
              answer: true,
            },
          ],
          transcript: "",
        };
        break;

      /* ===============================
         🗣️ SPEAKING — bullets
      ==================================*/
      case "speaking":
        base = {
          id,
          type,
          title: "",
          instructions: "",
          bullets: [""],
          notes: "",
        };
        break;

      /* ===============================
         💭 REFLECTION
      ==================================*/
      case "reflection":
        base = {
          id,
          type,
          title: "",
          instructions: "", 
          prompt: "",
          ideasCount: 3, // default = 3 ideas
        };
        break;

      /* ===============================
         ✏️ SENTENCE CORRECTION
      ==================================*/
      case "sentence_correction":
        base = {
          id,
          type,
          title: "",
          instructions: "",
          incorrect: "",
          correctAnswers: [""],
        };
        break;
    
    case "verb_table":
  base = {
    id,
    type: "verb_table",
    title: "",
    instructions: "",
    rows: [
      { subject: "I", positive: "am", negative: "am not" }
    ],
    blanks: [], // vacío inicialmente
    correct: {}, // vacío inicialmente
  };
  break;

case "open_question":
  base = {
    id,
    type: "open_question",
    title: "",
    instructions: "",
    prompt: "",
    maxLength: 500,
  };
  break;
      }


    if (!base) return;
    exercisesRef.current.push(base);
    validationsRef.current[base.id] = validateExercise(base);
    setTouched(true);
    setActiveIdx(exercisesRef.current.length - 1);
    forceSnapshot();
  };

  const duplicateExercise = (id: string) => {
    const ex = exercisesRef.current.find((x) => x.id === id);
    if (!ex) return;
    const copy = structuredClone(ex);
    copy.id = makeId();
    exercisesRef.current.push(copy);
    validationsRef.current[copy.id] = validateExercise(copy);
    setTouched(true);
    setActiveIdx(exercisesRef.current.length - 1);
    forceSnapshot();
  };

  const removeExercise = (id: string) => {
    const arr = exercisesRef.current;
    const idx = arr.findIndex((e) => e.id === id);
    if (idx === -1) return;
    if (!confirm("¿Eliminar este ejercicio?")) return;

    arr.splice(idx, 1);
    delete validationsRef.current[id];

    setActiveIdx((prev) => {
      if (arr.length === 0) return 0;
      return Math.min(prev, arr.length - 1);
    });
    setTouched(true);
    forceSnapshot();
  };

  const swapExercises = (from: number, to: number) => {
    const arr = exercisesRef.current;
    if (to < 0 || to >= arr.length) return;
    [arr[from], arr[to]] = [arr[to], arr[from]];
    setTouched(true);
    setActiveIdx(to);
    forceSnapshot();
  };

  // ===== Mutadores de campo =====
  const updateField = useCallback(
    (id: string, patch: Partial<Exercise>) => {
      const ex = exercisesRef.current.find((x) => x.id === id);
      if (!ex) return;
      Object.assign(ex, patch);
      setTouched(true);
      updateSnapshot(); // validaciones con debounce
    },
    [updateSnapshot]
  );

  const updateFieldImmediate = useCallback(
  (id: string, patch: Partial<Exercise>) => {
    const ex = exercisesRef.current.find((x) => x.id === id);
    if (!ex) return;
    Object.assign(ex, patch);
    setTouched(true);
    setSnapshot((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
    updateSnapshot();
  },
  [updateSnapshot]
);

  // ===== Ayudantes de opción múltiple =====
  const addOption = (id: string) => {
    const ex = exercisesRef.current.find((x) => x.id === id) as MultipleChoiceExercise | undefined;
    if (!ex) return;
    ex.options = Array.isArray(ex.options) ? ex.options : [];
    ex.options.push("");
    setTouched(true);
    forceSnapshot();
  };

  const removeOption = (id: string, idx: number) => {
    const ex = exercisesRef.current.find((x) => x.id === id) as MultipleChoiceExercise | undefined;
    if (!ex || !Array.isArray(ex.options)) return;
    if (ex.options.length <= 2) return;
    ex.options.splice(idx, 1);
    if (ex.correctIndex >= ex.options.length) ex.correctIndex = 0;
    setTouched(true);
    forceSnapshot();
  };

  // ===== Ayudantes de reordenación (vista previa de arrastre) =====
  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, exId: string, idx: number) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ exId, idx }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent<HTMLLIElement>, exId: string, targetIdx: number) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain") || "{}");
      if (!data || data.exId !== exId || data.idx === targetIdx) return;

      const ex = exercisesRef.current.find((x) => x.id === exId) as ReorderExercise | undefined;
      if (!ex || !Array.isArray(ex.items)) return;

      const nonEmptyItems = ex.items.filter(
        (item) => item && item.trim() !== ""
      );
      if (data.idx >= nonEmptyItems.length || targetIdx >= nonEmptyItems.length)
        return;

      const items = [...nonEmptyItems];
      const [moved] = items.splice(data.idx, 1);
      items.splice(targetIdx, 0, moved);

      updateFieldImmediate(exId, { items });
    } catch (error) {
      console.error("Error en arrastrar y soltar:", error);
    }
  };

  // ===== Ayudantes de emparejamiento =====
  const addPair = (id: string) => {
    const ex = exercisesRef.current.find((x) => x.id === id) as MatchingExercise | undefined;
    if (!ex) return;
    ex.pairs = Array.isArray(ex.pairs) ? ex.pairs : [];
    ex.pairs.push({ left: "", right: "" });
    setTouched(true);
    forceSnapshot();
  };

  const removePair = (id: string, idx: number) => {
    const ex = exercisesRef.current.find((x) => x.id === id) as MatchingExercise | undefined;
    if (!ex || !Array.isArray(ex.pairs)) return;
    ex.pairs.splice(idx, 1);
    setTouched(true);
    forceSnapshot();
  };

  // ===== ¿Todo válido? =====
  const allValid = useMemo(() => {
    if (snapshot.length === 0) return true;
    return snapshot.every(
      (ex) => validationsRef.current[ex.id] ?? validateExercise(ex)
    );
  }, [snapshot]);

  // ===== Guardar / Revertir =====
  const handleSave = () => {
  if (!allValid) {
    setSavedMessage("Hay ejercicios incompletos o no válidos.");
    return;
  }
  
  // Función recursiva para limpiar undefined
  const cleanUndefined = (obj: any): any => {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(cleanUndefined);
    }
    
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const key in obj) {
        const value = obj[key];
        if (value !== undefined) {
          cleaned[key] = cleanUndefined(value);
        }
      }
      return cleaned;
    }
    
    return obj;
  };
  
  // Limpiar valores undefined de todos los ejercicios
  const cleanExercises = cleanUndefined(structuredClone(exercisesRef.current));
  
  if (typeof onChange === "function")
    onChange(cleanExercises);
  setTouched(false);
  setSavedMessage("Ejercicios guardados.");
  setTimeout(() => setSavedMessage(""), 2200);
};

  const handleRevert = () => {
    exercisesRef.current = initial ?
      structuredClone(initial) : [];
    validationsRef.current = {};
    exercisesRef.current.forEach(
      (e) => (validationsRef.current[e.id] = validateExercise(e))
    );
    setTouched(false);
    setActiveIdx((idx) =>
      exercisesRef.current.length === 0
        ? 0
        : Math.min(idx, exercisesRef.current.length - 1)
    );
    forceSnapshot();
    setSavedMessage("Cambios revertidos.");
    setTimeout(() => setSavedMessage(""), 1800);
  };

  // ===== Ayudantes de UI =====
  const typeLabel = (t: Exercise['type']): string =>
  ({
    multiple_choice: "Múltiple",
    true_false: "Verdadero/Falso",
    fill_blank: "Rellenar espacios",
    text: "Párrafo",
    reorder: "Reordenar",
    matching: "Emparejar",
    reading: "Reading",
    listening: "Listening",
    speaking: "Speaking",
    reflection: "Reflexión",
    sentence_correction: "Corrección",
    verb_table: "Verb Table",
    open_question: "Pregunta Abierta",
  }[t] || t);

  const getTabTitle = (ex: Exercise, idx: number): string => {
  if (ex.type === "multiple_choice")
    return firstLine(ex.question) || `Múltiple ${idx + 1}`;
  if (ex.type === "true_false")
    return firstLine(ex.statement) || `Verdadero/Falso ${idx + 1}`;
  if (ex.type === "fill_blank")
    return firstLine(ex.title || ex.sentence) || `Rellenar ${idx + 1}`;
  if (ex.type === "text")
    return firstLine(ex.title || ex.instructions) || `Párrafo ${idx + 1}`;
  if (ex.type === "reorder")
    return firstLine(ex.title) || `Reordenar ${idx + 1}`;
  if (ex.type === "matching")
    return firstLine(ex.title) || `Emparejar ${idx + 1}`;
  
  // Nuevos tipos
  if (ex.type === "reading")
    return firstLine(ex.title) || `Reading ${idx + 1}`;
  if (ex.type === "listening")
    return firstLine(ex.title) || `Listening ${idx + 1}`;
  if (ex.type === "speaking")
    return firstLine(ex.title) || `Speaking ${idx + 1}`;
  if (ex.type === "reflection")
    return firstLine(ex.title) || `Reflexión ${idx + 1}`;
  if (ex.type === "sentence_correction")
    return firstLine(ex.title) || `Corrección ${idx + 1}`;
  if (ex.type === "verb_table")
    return firstLine(ex.title) || `Verb Table ${idx + 1}`;
    
  return `Ejercicio ${idx + 1}`;
};

  // ===== Renderizadores =====
  const renderMultipleChoice = (ex: MultipleChoiceExercise) => (
    <div className="space-y-3">
      {/* Título */}
<input
  type="text"
  className="w-full border rounded px-3 py-2 mb-2"
  placeholder="Título del ejercicio"
  value={ex.title}
  onChange={(e) => updateFieldImmediate(ex.id, { title: e.target.value })}
/>

{/* Instrucciones */}
<textarea
  rows={2}
  className="w-full border rounded px-3 py-2 mb-4"
  placeholder="Instrucciones del ejercicio"
  value={ex.instructions}
  onChange={(e) => updateFieldImmediate(ex.id, { instructions: e.target.value })}
/>

      <textarea
        rows={3}
        className="w-full border rounded px-3 py-2"
        style={{ whiteSpace: "pre-wrap" }}
        placeholder="Pregunta (ej., ¿Cuál es la respuesta correcta?)"
        value={ex.question ?? ""}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          updateFieldImmediate(ex.id, { question: e.target.value })
        }
      />
      <div className="space-y-2">
        {ex.options.map((opt, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              type="radio"
              name={`mc-correct-${ex.id}`}
              checked={ex.correctIndex === i}
              onChange={() => updateField(ex.id, { correctIndex: i })}
              title="Marcar como correcta"
            />
            <input
              className="flex-1 border rounded px-3 py-2"
              placeholder={`Opción ${i + 1}`}
              value={opt ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const newOptions = [...(ex.options || [])];
                newOptions[i] = e.target.value;
                updateFieldImmediate(ex.id, { options: newOptions });
              }}
            />
            <button
              type="button"
              className="text-sm px-2 py-1 rounded bg-red-100 text-red-700"
              onClick={() => removeOption(ex.id, i)}
            >
              ✖
            </button>
          </div>
        ))}
        <div className="flex gap-2 items-center">
          <button
            type="button"
            className="px-3 py-1.5 rounded bg-slate-100"
            onClick={() => addOption(ex.id)}
          >
            + Opción
          </button>
          <span className="text-xs text-slate-500">
            Usa el radio para marcar la correcta.
          </span>
        </div>
      </div>
    </div>
  );

  const renderFillBlank = (ex: FillBlankExercise) => {
    const blanksCount = (ex.sentence?.match(/\*\*\*/g) || []).length;
    const syncHintWordsToAnswers = (raw: string) => {
      const tokens = String(raw || "")
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      const nextAnswers = Array.from({ length: blanksCount }).map(
        (_, i) => tokens[i] || ex.answers?.[i] || ""
      );
      updateFieldImmediate(ex.id, { hintWords: raw, answers: nextAnswers });
    };

    const onSentenceChange = (s: string) => {
      const count = (s.match(/\*\*\*/g) || []).length;
      const nextAnswers = Array.from({ length: count }).map(
        (_, i) => ex.answers?.[i] || ""
      );
      updateFieldImmediate(ex.id, { sentence: s, answers: nextAnswers });
    };

    const renderSentencePreview = () => {
      if (!ex.sentence) return null;
      const html = ex.sentence.replace(/\*\*\*/g, "____");
      return (
        <div
          className="text-sm text-slate-600 px-3 py-2 bg-slate-50 border rounded"
          style={{ whiteSpace: "pre-wrap" }}
        >
          {html}
        </div>
      );
    };

    return (
      <div className="space-y-3">
        {/* Título/instrucciones multilínea */}
        <textarea
          rows={2}
          className="w-full border rounded px-3 py-2"
          style={{ whiteSpace: "pre-wrap" }}
          placeholder="Título / instrucciones (ej., Completa la oración con las palabras correctas)"
          value={ex.title ?? ""}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            updateFieldImmediate(ex.id, { title: e.target.value })
          }
        />

{/* Instrucciones */}
<textarea
  rows={2}
  className="w-full border rounded px-3 py-2 mb-4"
  placeholder="Instrucciones del ejercicio"
  value={ex.instructions}
  onChange={(e) => updateFieldImmediate(ex.id, { instructions: e.target.value })}
/>


        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
          <input
            className="md:col-span-9 border rounded px-3 py-2"
            placeholder="Palabras para los espacios (separadas por comas), ej., perro, gato, pájaro"
            value={ex.hintWords ?? ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateFieldImmediate(ex.id, { hintWords: e.target.value })
            }
          />
          <button
            type="button"
            className="md:col-span-3 px-3 py-2 rounded bg-slate-100 hover:bg-slate-200 border text-sm"
            onClick={() => syncHintWordsToAnswers(ex.hintWords || "")}
            title="Sincronizar palabras con la lista de respuestas de abajo"
          >
            Aplicar palabras a respuestas
          </button>
        </div>

        <textarea
          rows={3}
          className="w-full border rounded px-3 py-2"
          style={{ whiteSpace: "pre-wrap" }}
          placeholder='Usa "***" para los espacios (ej., Tengo un *** perro y un *** gato).'
          value={ex.sentence ?? ""}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onSentenceChange(e.target.value)}
        />

        {renderSentencePreview()}

        {blanksCount === 0 ? (
          <div className="text-xs text-amber-700">
            Añade al menos un "***" para crear espacios.
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-xs text-slate-600">
              Respuestas (en orden de aparición):
            </div>
            {Array.from({ length: blanksCount }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs text-slate-500 min-w-[70px]">
                  Espacio #{idx + 1}
                </span>
                <input
                  className="flex-1 border rounded px-3 py-2"
                  placeholder={`Respuesta para el espacio #${idx + 1}`}
                  value={ex.answers?.[idx] ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const nextAnswers = Array.from({ length: blanksCount }).map(
                      (_, i) =>
                        i === idx ? e.target.value : ex.answers?.[i] || ""
                    );
                    updateFieldImmediate(ex.id, { answers: nextAnswers });
                  }}
                />
              </div>
            ))}
            <button
              type="button"
              className="mt-2 text-xs text-slate-600 hover:text-slate-800"
              onClick={() => syncHintWordsToAnswers(ex.hintWords || "")}
            >
              ↻ Re-aplicar palabras desde el campo superior
            </button>
          </div>
        )}

        <div className="text-xs">
          {validateExercise(ex) ? (
            <div className="text-green-600">
              ✓ El ejercicio está completo y es válido
            </div>
          ) : (
            <div className="text-amber-600">
              ⚠ Requerido: oración con "***" y el mismo número de respuestas.
            </div>
          )}
        </div>
      </div>
    );
  };

const renderVerbTable = (ex: VerbTableExercise) => {
  // Helper para toggle blanks
  const toggleBlank = (rowIdx: number, col: "positive" | "negative") => {
    const blanks = ex.blanks || [];
    const exists = blanks.some(b => b.rowIndex === rowIdx && b.column === col);
    
    let newBlanks;
    let newCorrect = { ...(ex.correct || {}) };
    
    if (exists) {
      // Remover blank
      newBlanks = blanks.filter(b => !(b.rowIndex === rowIdx && b.column === col));
      delete newCorrect[`${rowIdx}-${col}`];
    } else {
      // Agregar blank
      newBlanks = [...blanks, { rowIndex: rowIdx, column: col }];
      // La respuesta correcta es el valor actual de la celda
      const currentValue = ex.rows[rowIdx]?.[col] || "";
      newCorrect[`${rowIdx}-${col}`] = currentValue;
    }
    
    updateFieldImmediate(ex.id, { blanks: newBlanks, correct: newCorrect });
  };

  const isBlank = (rowIdx: number, col: "positive" | "negative") => {
    return (ex.blanks || []).some(b => b.rowIndex === rowIdx && b.column === col);
  };

  return (
    <div className="space-y-4">
      {/* Título */}
      <input
  type="text"
  className="w-full border rounded px-3 py-2 mb-2"
  placeholder="Título del ejercicio (ej: Verb table - To be)"
  value={ex.title ?? ""}
  onChange={(e) =>
    updateFieldImmediate(ex.id, { title: e.target.value })
  }
/>

{/* Instrucciones */}
<textarea
  rows={2}
  className="w-full border rounded px-3 py-2 mb-4"
  placeholder="Instrucciones del ejercicio"
  value={ex.instructions ?? ""}
  onChange={(e) =>
    updateFieldImmediate(ex.id, { instructions: e.target.value })
  }
/>

      {/* Instrucción para el profesor */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <p className="font-semibold mb-1">💡 Instrucciones:</p>
        <p>1. Completa la tabla con todos los valores</p>
        <p>2. Haz clic en el ícono 🔒 para marcar qué celdas debe completar el alumno</p>
        <p>3. Las celdas marcadas se mostrarán vacías al estudiante</p>
      </div>

      {/* Tabla editable */}
      <div className="overflow-x-auto">
        <table className="w-full border rounded bg-white text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="border px-3 py-2 text-left font-semibold">Subject</th>
              <th className="border px-3 py-2 text-left font-semibold">
                Positive
                <span className="text-xs text-slate-500 ml-2">(click 🔒 to hide)</span>
              </th>
              <th className="border px-3 py-2 text-left font-semibold">
                Negative
                <span className="text-xs text-slate-500 ml-2">(click 🔒 to hide)</span>
              </th>
              <th className="border px-2 py-2 w-16"></th>
            </tr>
          </thead>

          <tbody>
            {ex.rows.map((row, idx) => (
              <tr key={idx}>
                {/* Subject (siempre visible) */}
                <td className="border px-3 py-2">
                  <input
                    className="w-full border rounded px-2 py-1 bg-slate-50"
                    value={row.subject}
                    placeholder="Subject"
                    onChange={(e) => {
                      const newRows = [...ex.rows];
                      newRows[idx].subject = e.target.value;
                      updateFieldImmediate(ex.id, { rows: newRows });
                    }}
                  />
                </td>

                {/* Positive */}
                <td className="border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <input
                      className={`flex-1 border rounded px-2 py-1 ${
                        isBlank(idx, "positive") 
                          ? "bg-yellow-50 border-yellow-300" 
                          : "bg-white"
                      }`}
                      value={row.positive}
                      placeholder="Positive form"
                      onChange={(e) => {
                        const newRows = [...ex.rows];
                        newRows[idx].positive = e.target.value;
                        
                        // Si está marcado como blank, actualizar correct también
                        const newCorrect = { ...(ex.correct || {}) };
                        if (isBlank(idx, "positive")) {
                          newCorrect[`${idx}-positive`] = e.target.value;
                        }
                        
                        updateFieldImmediate(ex.id, { 
                          rows: newRows,
                          correct: newCorrect 
                        });
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => toggleBlank(idx, "positive")}
                      className={`px-2 py-1 rounded transition-colors ${
                        isBlank(idx, "positive")
                          ? "bg-yellow-200 text-yellow-800 hover:bg-yellow-300"
                          : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                      }`}
                      title={isBlank(idx, "positive") ? "Estudiante debe completar" : "Visible para estudiante"}
                    >
                      {isBlank(idx, "positive") ? "🔒" : "👁️"}
                    </button>
                  </div>
                </td>

                {/* Negative */}
                <td className="border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <input
                      className={`flex-1 border rounded px-2 py-1 ${
                        isBlank(idx, "negative") 
                          ? "bg-yellow-50 border-yellow-300" 
                          : "bg-white"
                      }`}
                      value={row.negative}
                      placeholder="Negative form"
                      onChange={(e) => {
                        const newRows = [...ex.rows];
                        newRows[idx].negative = e.target.value;
                        
                        // Si está marcado como blank, actualizar correct también
                        const newCorrect = { ...(ex.correct || {}) };
                        if (isBlank(idx, "negative")) {
                          newCorrect[`${idx}-negative`] = e.target.value;
                        }
                        
                        updateFieldImmediate(ex.id, { 
                          rows: newRows,
                          correct: newCorrect 
                        });
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => toggleBlank(idx, "negative")}
                      className={`px-2 py-1 rounded transition-colors ${
                        isBlank(idx, "negative")
                          ? "bg-yellow-200 text-yellow-800 hover:bg-yellow-300"
                          : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                      }`}
                      title={isBlank(idx, "negative") ? "Estudiante debe completar" : "Visible para estudiante"}
                    >
                      {isBlank(idx, "negative") ? "🔒" : "👁️"}
                    </button>
                  </div>
                </td>

                {/* Eliminar fila */}
                <td className="border px-2 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
  const newRows = ex.rows.filter((_, i) => i !== idx);

  // Reindexar blanks: eliminar los de esta fila y decrementar los posteriores
  const newBlanks = (ex.blanks || [])
    .filter(b => b.rowIndex !== idx)
    .map(b => b.rowIndex > idx ? { ...b, rowIndex: b.rowIndex - 1 } : b);

  // Reindexar correct con la misma lógica
  const newCorrect: Record<string, string> = {};
  Object.entries(ex.correct || {}).forEach(([key, val]) => {
    const dashIdx = key.lastIndexOf("-");
    const rowIdx = parseInt(key.slice(0, dashIdx));
    const col = key.slice(dashIdx + 1);
    if (rowIdx === idx) return; // esta fila se elimina
    const newRow = rowIdx > idx ? rowIdx - 1 : rowIdx;
    newCorrect[`${newRow}-${col}`] = val as string;
  });

  updateFieldImmediate(ex.id, { 
    rows: newRows,
    blanks: newBlanks,
    correct: newCorrect
  });
}}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✖
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Botón añadir fila */}
      <button
        type="button"
        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded text-sm"
        onClick={() => {
          updateFieldImmediate(ex.id, {
            rows: [...ex.rows, { subject: "", positive: "", negative: "" }],
          });
        }}
      >
        + Añadir fila
      </button>

      {/* Preview de blanks */}
      {(ex.blanks || []).length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
          <p className="font-semibold text-green-800 mb-2">
            ✅ Celdas que el alumno debe completar ({(ex.blanks || []).length}):
          </p>
          <ul className="space-y-1 text-green-700">
            {(ex.blanks || []).map((b, i) => (
              <li key={i}>
                • Fila {b.rowIndex + 1}: <strong>{b.column}</strong> 
                {" → "}
                <code className="bg-green-100 px-2 py-0.5 rounded">
                  {ex.correct?.[`${b.rowIndex}-${b.column}`] || "(vacío)"}
                </code>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};


  const renderText = (ex: TextExercise) => (
    <div className="space-y-2">

      {/* Título */}
<input
  type="text"
  className="w-full border rounded px-3 py-2 mb-2"
  placeholder="Título del ejercicio"
  value={ex.title}
  onChange={(e) => updateFieldImmediate(ex.id, { title: e.target.value })}
/>

{/* Instrucciones */}
<textarea
  rows={2}
  className="w-full border rounded px-3 py-2 mb-4"
  placeholder="Instrucciones del ejercicio"
  value={ex.instructions}
  onChange={(e) => updateFieldImmediate(ex.id, { instructions: e.target.value })}
/>

      <div className="flex items-center gap-2">
        <label className="text-sm text-slate-600">Máx. caracteres</label>
        <input
          type="number"
          min={10}
          className="w-24 border rounded px-2 py-1"
          value={ex.maxLength ?? 0}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const value = parseInt(e.target.value || "0", 10) || 0;
            updateField(ex.id, { maxLength: value });
          }}
        />
      </div>
    </div>
  );

 const renderTrueFalse = (ex: TrueFalseExercise) => (
  <div className="space-y-2">
    {/* Título del ejercicio */}
    <input
      type="text"
      className="w-full border rounded px-3 py-2 mb-2"
      placeholder="Título del ejercicio"
      value={ex.title ?? ""}
      onChange={(e) =>
        updateFieldImmediate(ex.id, { title: e.target.value })
      }
    />

    {/* Instrucciones generales */}
    <textarea
      rows={2}
      className="w-full border rounded px-3 py-2 mb-4"
      placeholder="Instrucciones generales (ej: Read the sentences and mark True/False...)"
      value={ex.instructions ?? ""}
      onChange={(e) =>
        updateFieldImmediate(ex.id, { instructions: e.target.value })
      }
    />

    {/* Enunciado multilínea */}
    <textarea
      rows={3}
      className="w-full border rounded px-3 py-2"
      style={{ whiteSpace: "pre-wrap" }}
      placeholder="Enunciado (ej., El cielo es azul.)"
      value={ex.statement ?? ""}
      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
        updateFieldImmediate(ex.id, { statement: e.target.value })
      }
    />
    
    <div className="flex items-center gap-4 mt-1">
      <label className="flex items-center gap-2">
        <input
          type="radio"
          name={`tf-${ex.id}`}
          checked={ex.answer === true}
          onChange={() => updateField(ex.id, { answer: true })}
        />
        Verdadero
      </label>
      <label className="flex items-center gap-2">
        <input
          type="radio"
          name={`tf-${ex.id}`}
          checked={ex.answer === false}
          onChange={() => updateField(ex.id, { answer: false })}
        />
        Falso
      </label>
    </div>
  </div>
);

  const renderReorder = (ex: ReorderExercise) => (
    <div className="space-y-3">
      {/* Título/instrucciones multilínea */}
      <textarea
        rows={3}
        className="w-full border rounded px-3 py-2"
        style={{ whiteSpace: "pre-wrap" }}
        placeholder="Título / instrucciones (ej., Ordena las 5 partes del pitch)"
        value={ex.title ?? ""}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateFieldImmediate(ex.id, { title: e.target.value })}
      />

{/* Instrucciones */}
<textarea
  rows={2}
  className="w-full border rounded px-3 py-2 mb-4"
  placeholder="Instrucciones del ejercicio"
  value={ex.instructions}
  onChange={(e) => updateFieldImmediate(ex.id, { instructions: e.target.value })}
/>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Columna izquierda: Elementos */}
        <div>
          <div className="text-sm font-medium text-slate-700 mb-2">
            1) Define los elementos a reordenar
          </div>
          <textarea
            rows={8}
            className="w-full border rounded px-3 py-2 font-mono text-sm resize-y"
            placeholder={
              "Escribe un elemento por línea:\n\nEl gancho\nEl problema\nLa solución\nLa propuesta de valor\nLa llamada a la acción"
            }
            value={(ex.items || []).join("\n")}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              const rawText = e.target.value;
              const items = rawText.split("\n"); // mantener todas las líneas visualmente
              const nonEmptyItems = items.filter((item) => item.trim() !== "");
              let correctOrder = ex.correctOrder || [];
              const prevNonEmptyItems = (ex.items || []).filter(
                (item) => item.trim() !== ""
              );
              if (nonEmptyItems.length !== prevNonEmptyItems.length) {
                correctOrder = [];
              } else {
                correctOrder = correctOrder.filter((idx) => {
                  const actualItem = items[idx];
                  return (
                    idx >= 0 &&
                    idx < items.length &&
                    actualItem &&
                    actualItem.trim() !== ""
                  );
                });
              }

              updateFieldImmediate(ex.id, { items, correctOrder });
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === "Enter") {
                e.stopPropagation(); // dejar que el textarea maneje el salto de línea natural
              }
            }}
            style={{ whiteSpace: "pre-wrap" }}
          />
          <div className="text-xs text-slate-500 mt-1">
            Presiona Enter para crear una nueva línea. Total:{" "}
            {(ex.items || []).filter((item) => item.trim() !== "").length} elementos válidos
          </div>
        </div>

        {/* Columna derecha: Orden correcto */}
        <div>
          <div className="text-sm font-medium text-slate-700 mb-2">
            2) Define el orden correcto
          </div>

          <div className="border rounded p-3 bg-slate-50 max-h-80 overflow-y-auto">
            {(ex.items || []).filter((item) => item.trim() !== "").length ===
            0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                Primero añade algunos elementos a la izquierda.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-slate-600 mb-3">
                  Haz clic en los elementos en el orden correcto:
                </div>

                {/* Elementos disponibles */}
                <div className="space-y-1 mb-4">
                  <div className="text-xs font-medium text-slate-500">
                    Elementos disponibles:
                  </div>
                  {(ex.items || [])
                    .map((item, idx) => ({ item, idx }))
                    .filter(({ item }) => item.trim() !== "")
                    .map(({ item, idx }) => {
                      const isInOrder = (ex.correctOrder || []).includes(idx);
                      const orderPosition = isInOrder
                        ? (ex.correctOrder || []).indexOf(idx) + 1
                        : null;
                      return (
                        <button
                          key={idx}
                          type="button"
                          className={`w-full text-left px-3 py-2 rounded border text-sm transition ${
                            isInOrder
                              ? "bg-blue-100 border-blue-300 text-blue-800"
                              : "bg-white hover:bg-slate-50 border-slate-200"
                          }`}
                          onClick={() => {
                            const currentOrder = ex.correctOrder || [];
                            const newOrder = isInOrder
                              ? currentOrder.filter((i) => i !== idx)
                              : [...currentOrder, idx];
                            updateField(ex.id, { correctOrder: newOrder });
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className="flex-1 pr-2"
                              style={{ whiteSpace: "pre-wrap" }}
                            >
                              {item}
                            </span>
                            {isInOrder && (
                              <span className="bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-xs font-bold">
                                #{orderPosition}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>

                {/* Orden actual */}
                {(ex.correctOrder || []).length > 0 && (
                  <div className="border-t pt-3">
                    <div className="text-xs font-medium text-green-600 mb-2">
                      Orden correcto definido:
                    </div>
                    <ol className="space-y-1">
                      {(ex.correctOrder || []).map((idx, pos) => (
                        <li
                          key={pos}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold min-w-[24px] text-center">
                            {pos + 1}
                          </span>
                          <span
                            className="flex-1"
                            style={{ whiteSpace: "pre-wrap" }}
                          >
                            {(ex.items || [])[idx] || `[Error: índice ${idx}]`}
                          </span>
                          <button
                            type="button"
                            className="text-red-500 hover:text-red-700 text-xs px-1"
                            onClick={() => {
                              const newOrder = (ex.correctOrder || []).filter(
                                (_, i) => i !== pos
                              );
                              updateField(ex.id, { correctOrder: newOrder });
                            }}
                            title="Eliminar de la secuencia"
                          >
                            ✖
                          </button>
                        </li>
                      ))}
                    </ol>

                    <button
                      type="button"
                      className="mt-2 text-xs text-slate-500 hover:text-slate-700"
                      onClick={() => updateField(ex.id, { correctOrder: [] })}
                    >
                      🗑 Limpiar orden
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vista previa visual de arrastrar y soltar */}
      {(ex.items || []).filter((item) => item.trim() !== "").length > 0 && (
        <div>
          <div className="text-sm font-medium text-slate-700 mb-2">
            3) Vista previa (arrastra para probar)
          </div>
          <ul className="divide-y border rounded bg-white">
            {(ex.items || [])
              .filter((item) => item.trim() !== "")
              .map((item, i) => (
                <li
                  key={`preview-${i}`}
                  className="px-3 py-2 hover:bg-slate-50 cursor-move border-l-4 border-l-transparent hover:border-l-blue-400 transition-colors"
                  draggable
                  onDragStart={(e) => handleDragStart(e, ex.id, i)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, ex.id, i)}
                  title="Arrastra para reordenar (solo visual)"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-sm min-w-[24px]">
                      #{i + 1}
                    </span>
                    <span
                      className="flex-1 text-sm"
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      {item}
                    </span>
                    <span className="text-slate-300 text-xs">⋮⋮</span>
                  </div>
                </li>
              ))}
          </ul>
          <div className="mt-2 text-xs text-slate-500">
            💡 Esta sección es solo una prueba visual. El orden correcto se define arriba.
          </div>
        </div>
      )}

      <div className="text-xs">
        {validateExercise(ex) ? (
          <div className="text-green-600">✓ Ejercicio completo y válido</div>
        ) : (
          <div className="text-amber-600">
            ⚠ Requerido: título, al menos 2 elementos y un orden correcto.
          </div>
        )}
      </div>
    </div>
  );

  const renderMatching = (ex: MatchingExercise) => (
    <div className="space-y-3">
      {/* Título/instrucciones multilínea */}
      <textarea
        rows={3}
        className="w-full border rounded px-3 py-2"
        style={{ whiteSpace: "pre-wrap" }}
        placeholder="Título / instrucciones (ej., Empareja cada oración con la audiencia correcta)"
        value={ex.title ?? ""}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateFieldImmediate(ex.id, { title: e.target.value })}
      />


{/* Instrucciones */}
<textarea
  rows={2}
  className="w-full border rounded px-3 py-2 mb-4"
  placeholder="Instrucciones del ejercicio"
  value={ex.instructions}
  onChange={(e) => updateFieldImmediate(ex.id, { instructions: e.target.value })}
/>


      <div className="text-xs text-slate-600">Pares</div>
      <div className="space-y-2">
        {(ex.pairs || []).map((pair, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2">
            <textarea
              rows={2}
              className="md:col-span-5 border rounded px-3 py-2"
              style={{ whiteSpace: "pre-wrap" }}
              placeholder="Izquierda"
              value={pair.left ?? ""}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                const newPairs = [...(ex.pairs || [])];
                newPairs[idx] = { ...newPairs[idx], left: e.target.value };
                updateFieldImmediate(ex.id, { pairs: newPairs });
              }}
            />
            <div className="md:col-span-2 flex items-center justify-center text-slate-400">
              ↔
            </div>
            <textarea
              rows={2}
              className="md:col-span-5 border rounded px-3 py-2"
              style={{ whiteSpace: "pre-wrap" }}
              placeholder="Derecha"
              value={pair.right ?? ""}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                const newPairs = [...(ex.pairs || [])];
                newPairs[idx] = { ...newPairs[idx], right: e.target.value };
                updateFieldImmediate(ex.id, { pairs: newPairs });
              }}
            />
            <div className="md:col-span-12 flex justify-end">
              <button
                type="button"
                className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs"
                onClick={() => removePair(ex.id, idx)}
              >
                Eliminar par
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="px-3 py-1.5 rounded bg-slate-100"
        onClick={() => addPair(ex.id)}
      >
        + Añadir par
      </button>
    </div>
  );

  const renderEditorByType = (ex: Exercise) => {
    switch (ex.type) {
      case "multiple_choice":
        return renderMultipleChoice(ex);
      case "fill_blank":
        return renderFillBlank(ex);
      case "text":
        return renderText(ex);
      case "true_false":
        return renderTrueFalse(ex);
      case "reorder":
        return renderReorder(ex);
      case "matching":
        return renderMatching(ex);

         case "reading":
      return renderReading(ex);
    case "listening":
      return renderListening(ex);
    case "speaking":
      return renderSpeaking(ex);
    case "reflection":
      return renderReflection(ex);
    case "sentence_correction":
      return renderSentenceCorrection(ex);

    case "verb_table":
  return renderVerbTable(ex);

  case "open_question":
  return renderOpenQuestion(ex as OpenQuestionExercise);

      default:
        return null;
    }
  };

  const renderReading = (ex: ReadingExercise) => {
  const update = (patch: Partial<ReadingExercise>) =>
    updateFieldImmediate(ex.id, patch);

  // ==========================
  // Ayudantes para preguntas
  // ==========================
  const addQuestion = () => {
    const newQ: ComprehensionQuestion = {
      id: makeId(),
      kind: "mc",
      prompt: "",
      options: ["", ""],
      correctIndex: 0,
    };
    update({ questions: [...ex.questions, newQ] });
  };

  const updateQuestion = (qid: string, patch: Partial<ComprehensionQuestion>) => {
    const next = ex.questions.map((q) =>
      q.id === qid ? { ...q, ...patch } : q
    );
    update({ questions: next });
  };

  const removeQuestion = (qid: string) => {
    update({ questions: ex.questions.filter((q) => q.id !== qid) });
  };

 const toggleKind = (qid: string, newKind: "mc" | "tf" | "open") => {
  const q = ex.questions.find((x) => x.id === qid);
  if (!q) return;

  if (newKind === "open") {
    updateQuestion(qid, {
      kind: "open",
      options: null,
      correctIndex: null,
      answer: null,
      placeholder: "",
      maxLength: 500,
    });
  } else if (newKind === "tf") {
    updateQuestion(qid, {
      kind: "tf",
      options: null,
      correctIndex: null,
      answer: true,
    });
  } else {
    updateQuestion(qid, {
      kind: "mc",
      options: ["", ""],
      correctIndex: 0,
      answer: null,
      placeholder: null,
      maxLength: null,
    });
  }
};



  return (
    <div className="space-y-4">

      {/* ======= Título ======= */}
      <input
        className="w-full border rounded px-3 py-2"
        placeholder="Título del ejercicio (ej: Reading - Workplace email)"
        value={ex.title}
        onChange={(e) => update({ title: e.target.value })}
      />
{/* Instrucciones */}
<textarea
  rows={2}
  className="w-full border rounded px-3 py-2 mb-4"
  placeholder="Instrucciones del ejercicio"
  value={ex.instructions}
  onChange={(e) => updateFieldImmediate(ex.id, { instructions: e.target.value })}
/>


      {/* ======= Texto de lectura ======= */}
      <textarea
        rows={8}
        className="w-full border rounded px-3 py-2"
        placeholder="Texto / artículo / párrafo para leer..."
        value={ex.text}
        onChange={(e) => update({ text: e.target.value })}
        style={{ whiteSpace: "pre-wrap" }}
      />

      {/* ======= Lista de preguntas ======= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-slate-700">
            Preguntas de comprensión
          </div>
          <button
            type="button"
            onClick={addQuestion}
            className="px-3 py-1 rounded bg-sky-600 text-white text-sm"
          >
            + Añadir pregunta
          </button>
        </div>

        {ex.questions.length === 0 && (
          <div className="text-sm text-slate-500">No hay preguntas todavía.</div>
        )}

        {ex.questions.map((q, idx) => (
          <div
            key={q.id}
            className="border rounded p-3 bg-slate-50 space-y-3"
          >
            {/* Encabezado */}
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-slate-600">
                Pregunta #{idx + 1}
              </div>
              <button
                type="button"
                onClick={() => removeQuestion(q.id)}
                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded"
              >
                Eliminar
              </button>
            </div>

            {/* Prompt */}
            <textarea
              rows={2}
              className="w-full border rounded px-2 py-1"
              placeholder="Escribe la pregunta..."
              value={q.prompt}
              onChange={(e) =>
                updateQuestion(q.id, { prompt: e.target.value })
              }
            />

            {/* Selector de tipo */}
            <div className="flex gap-3 text-sm">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  checked={q.kind === "mc"}
                  onChange={() => toggleKind(q.id, "mc")}
                />
                Multiple Choice
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  checked={q.kind === "tf"}
                  onChange={() => toggleKind(q.id, "tf")}
                />
                Verdadero / Falso
              </label>
              <label className="flex items-center gap-1">
    <input
      type="radio"
      checked={q.kind === "open"}
      onChange={() => toggleKind(q.id, "open")}
    />
    Pregunta abierta
  </label>

            </div>

            {/* ================================
                RENDER SEGÚN TIPO DE PREGUNTA
            ==================================*/}

            {q.kind === "mc" && (
              <div className="space-y-2">
                {q.options!.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`mc-${q.id}`}
                      checked={q.correctIndex === oi}
                      onChange={() =>
                        updateQuestion(q.id, { correctIndex: oi })
                      }
                    />
                    <input
                      className="flex-1 border rounded px-2 py-1"
                      value={opt}
                      placeholder={`Opción ${oi + 1}`}
                      onChange={(e) => {
                        const newOptions = [...q.options!];
                        newOptions[oi] = e.target.value;
                        updateQuestion(q.id, { options: newOptions });
                      }}
                    />
                    <button
                      type="button"
                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded"
                      disabled={(q.options || []).length <= 2}
                      onClick={() => {
                        const newOptions = q.options!.filter(
                          (_, idx) => idx !== oi
                        );
                        updateQuestion(q.id, {
                          options: newOptions,
                          correctIndex: 0,
                        });
                      }}
                    >
                      ✖
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="px-3 py-1 bg-slate-200 rounded text-sm"
                  onClick={() =>
                    updateQuestion(q.id, {
                      options: [...q.options!, ""],
                    })
                  }
                >
                  + Opción
                </button>
              </div>
            )}

            {q.kind === "tf" && (
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={q.answer === true}
                    onChange={() => updateQuestion(q.id, { answer: true })}
                  />
                  Verdadero
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={q.answer === false}
                    onChange={() => updateQuestion(q.id, { answer: false })}
                  />
                  Falso
                </label>
              </div>
            )}
            {q.kind === "open" && (
  <div className="space-y-2">
    <input
      className="w-full border rounded px-2 py-1"
      placeholder="Placeholder de la respuesta…"
      value={q.placeholder || ""}
      onChange={(e) =>
        updateQuestion(q.id, { placeholder: e.target.value })
      }
    />

    <input
      type="number"
      min={20}
      max={2000}
      className="w-32 border rounded px-2 py-1"
      value={q.maxLength || 500}
      onChange={(e) =>
        updateQuestion(q.id, {
          maxLength: parseInt(e.target.value || "500"),
        })
      }
    />
  </div>
)}

          </div>
        ))}
      </div>
    </div>
  );
};



const renderListening = (ex: ListeningExercise) => {
  const update = (patch: Partial<ListeningExercise>) =>
    updateFieldImmediate(ex.id, patch);

  // ==========================
  // Ayudantes para preguntas
  // ==========================
  const addQuestion = () => {
    const newQ: ComprehensionQuestion = {
      id: makeId(),
      kind: "mc",
      prompt: "",
      options: ["", ""],
      correctIndex: 0,
    };
    update({ questions: [...ex.questions, newQ] });
  };

  const updateQuestion = (qid: string, patch: Partial<ComprehensionQuestion>) => {
    const next = ex.questions.map((q) =>
      q.id === qid ? { ...q, ...patch } : q
    );
    update({ questions: next });
  };

  const removeQuestion = (qid: string) => {
    update({ questions: ex.questions.filter((q) => q.id !== qid) });
  };

const toggleKind = (qid: string, newKind: "mc" | "tf" | "open") => {
  const q = ex.questions.find((x) => x.id === qid);
  if (!q) return;

  if (newKind === "open") {
    updateQuestion(qid, {
      kind: "open",
      options: undefined,
      correctIndex: undefined,
      answer: undefined,
      placeholder: "",
      maxLength: 500,
    });
  } else if (newKind === "tf") {
    updateQuestion(qid, {
      kind: "tf",
      options: undefined,
      correctIndex: undefined,
      answer: true,
    });
  } else {
    updateQuestion(qid, {
      kind: "mc",
      options: ["", ""],
      correctIndex: 0,
    });
  }
};


  return (
    <div className="space-y-4">
      {/* ======= Título ======= */}
      <input
        className="w-full border rounded px-3 py-2"
        placeholder="Título del ejercicio (ej: Listening - Customer support call)"
        value={ex.title}
        onChange={(e) => update({ title: e.target.value })}
      />

{/* Instrucciones */}
<textarea
  rows={2}
  className="w-full border rounded px-3 py-2 mb-4"
  placeholder="Instrucciones del ejercicio"
  value={ex.instructions}
  onChange={(e) => updateFieldImmediate(ex.id, { instructions: e.target.value })}
/>

      {/* ======= URL de audio ======= */}
      <div>
        <div className="text-sm font-medium text-slate-700 mb-1">
          Audio (URL o archivo subido)
        </div>
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Pega aquí la URL del audio (mp3, wav, etc.)"
          value={ex.audioUrl}
          onChange={(e) => update({ audioUrl: e.target.value })}
        />

        {ex.audioUrl && (
          <audio
            controls
            src={ex.audioUrl}
            className="mt-2 w-full max-w-md"
          />
        )}
      </div>

      {/* ======= TRANSCRIPT (opcional) ======= */}
      <div>
        <div className="text-sm text-slate-600">Transcript (opcional)</div>
        <textarea
          rows={4}
          className="w-full border rounded px-3 py-2"
          value={ex.transcript || ""}
          onChange={(e) => update({ transcript: e.target.value })}
          placeholder="Transcripción del audio, si quieres incluirla..."
          style={{ whiteSpace: "pre-wrap" }}
        />
      </div>

      {/* ======= Preguntas de comprensión ======= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-slate-700">
            Preguntas de comprensión
          </div>
          <button
            type="button"
            onClick={addQuestion}
            className="px-3 py-1 rounded bg-sky-600 text-white text-sm"
          >
            + Añadir pregunta
          </button>
        </div>

        {ex.questions.length === 0 && (
          <div className="text-sm text-slate-500">No hay preguntas todavía.</div>
        )}

        {ex.questions.map((q, idx) => (
          <div
            key={q.id}
            className="border rounded p-3 bg-slate-50 space-y-3"
          >
            {/* Encabezado */}
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-slate-600">
                Pregunta #{idx + 1}
              </div>
              <button
                type="button"
                onClick={() => removeQuestion(q.id)}
                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded"
              >
                Eliminar
              </button>
            </div>

            {/* Prompt */}
            <textarea
              rows={2}
              className="w-full border rounded px-2 py-1"
              placeholder="Escribe la pregunta..."
              value={q.prompt}
              onChange={(e) =>
                updateQuestion(q.id, { prompt: e.target.value })
              }
            />

            {/* Selector de tipo */}
            <div className="flex gap-3 text-sm">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  checked={q.kind === "mc"}
                  onChange={() => toggleKind(q.id, "mc")}
                />
                Multiple Choice
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  checked={q.kind === "tf"}
                  onChange={() => toggleKind(q.id, "tf")}
                />
                Verdadero / Falso
              </label>
              <label className="flex items-center gap-1">
    <input
      type="radio"
      checked={q.kind === "open"}
      onChange={() => toggleKind(q.id, "open")}
    />
    Pregunta abierta
  </label>
            </div>

            {/* ===== Multiple choice ===== */}
            {q.kind === "mc" && (
              <div className="space-y-2">
                {q.options!.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`mc-list-${q.id}`}
                      checked={q.correctIndex === oi}
                      onChange={() =>
                        updateQuestion(q.id, { correctIndex: oi })
                      }
                    />
                    <input
                      className="flex-1 border rounded px-2 py-1"
                      value={opt}
                      placeholder={`Opción ${oi + 1}`}
                      onChange={(e) => {
                        const newOptions = [...q.options!];
                        newOptions[oi] = e.target.value;
                        updateQuestion(q.id, { options: newOptions });
                      }}
                    />
                    <button
                      type="button"
                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded"
                      disabled={(q.options || []).length <= 2}
                      onClick={() => {
                        const newOptions = q.options!.filter(
                          (_, idx) => idx !== oi
                        );
                        updateQuestion(q.id, {
                          options: newOptions,
                          correctIndex: 0,
                        });
                      }}
                    >
                      ✖
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="px-3 py-1 bg-slate-200 rounded text-sm"
                  onClick={() =>
                    updateQuestion(q.id, {
                      options: [...q.options!, ""],
                    })
                  }
                >
                  + Opción
                </button>
              </div>
            )}

            {/* ===== True/False ===== */}
            {q.kind === "tf" && (
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={q.answer === true}
                    onChange={() => updateQuestion(q.id, { answer: true })}
                  />
                  Verdadero
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={q.answer === false}
                    onChange={() => updateQuestion(q.id, { answer: false })}
                  />
                  Falso
                </label>
              </div>
            )}
            {q.kind === "open" && (
  <div className="space-y-2">
    <input
      className="w-full border rounded px-2 py-1"
      placeholder="Placeholder de la respuesta…"
      value={q.placeholder || ""}
      onChange={(e) =>
        updateQuestion(q.id, { placeholder: e.target.value })
      }
    />

    <input
      type="number"
      min={20}
      max={2000}
      className="w-32 border rounded px-2 py-1"
      value={q.maxLength || 500}
      onChange={(e) =>
        updateQuestion(q.id, {
          maxLength: parseInt(e.target.value || "500"),
        })
      }
    />
  </div>
)}
          </div>
        ))}
      </div>
    </div>
  );
};

const renderSpeaking = (ex: SpeakingExercise) => {
  const update = (patch: Partial<SpeakingExercise>) =>
    updateFieldImmediate(ex.id, patch);

  const addBullet = () => {
    update({ bullets: [...ex.bullets, ""] });
  };

  const updateBullet = (idx: number, value: string) => {
    const next = [...ex.bullets];
    next[idx] = value;
    update({ bullets: next });
  };

  const removeBullet = (idx: number) => {
    update({ bullets: ex.bullets.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-4">
      {/* ======= Título ======= */}
      <input
        className="w-full border rounded px-3 py-2"
        placeholder="Título del ejercicio (ej: Speaking - Talk about your work day)"
        value={ex.title}
        onChange={(e) => update({ title: e.target.value })}
      />

{/* Instrucciones */}
<textarea
  rows={2}
  className="w-full border rounded px-3 py-2 mb-4"
  placeholder="Instrucciones del ejercicio"
  value={ex.instructions}
  onChange={(e) => updateFieldImmediate(ex.id, { instructions: e.target.value })}
/>


      {/* ======= Bullets ======= */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-slate-700">
          Bullet points
        </div>

        {ex.bullets.length === 0 && (
          <div className="text-sm text-slate-500">No hay bullet points.</div>
        )}

        {ex.bullets.map((b, i) => (
          <div
            key={i}
            className="flex items-start gap-2 border rounded p-2 bg-slate-50"
          >
            <span className="text-slate-400 mt-2 select-none">•</span>
            <textarea
              rows={2}
              className="flex-1 border rounded px-2 py-1"
              placeholder={`Bullet point ${i + 1}`}
              value={b}
              onChange={(e) => updateBullet(i, e.target.value)}
              style={{ whiteSpace: "pre-wrap" }}
            />
            <button
              type="button"
              className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs"
              onClick={() => removeBullet(i)}
            >
              ✖
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addBullet}
          className="px-3 py-1.5 rounded bg-slate-200 text-sm"
        >
          + Añadir bullet
        </button>
      </div>

      {/* ======= Notas adicionales (opcional) ======= */}
      <div>
        <div className="text-sm font-medium text-slate-700">Notas (opcional)</div>
        <textarea
          rows={3}
          className="w-full border rounded px-3 py-2"
          placeholder="Instrucciones adicionales para el alumno..."
          value={ex.notes || ""}
          onChange={(e) => update({ notes: e.target.value })}
          style={{ whiteSpace: "pre-wrap" }}
        />
      </div>
    </div>
  );
};

const renderReflection = (ex: ReflectionExercise) => {
  const update = (patch: Partial<ReflectionExercise>) =>
    updateFieldImmediate(ex.id, patch);

  return (
    <div className="space-y-4">

      {/* ======= Título ======= */}
      <input
        className="w-full border rounded px-3 py-2"
        placeholder="Título del ejercicio (ej: Reflection - Workplace feedback)"
        value={ex.title}
        onChange={(e) => update({ title: e.target.value })}
      />

      {/* ======= Prompt / Consigna ======= */}
      <div>
        <div className="text-sm font-medium text-slate-700 mb-1">
          Consigna
        </div>

        <textarea
          rows={4}
          className="w-full border rounded px-3 py-2"
          placeholder="Escribe aquí la consigna de reflexión que deberá pensar el alumno..."
          value={ex.prompt}
          onChange={(e) => update({ prompt: e.target.value })}
          style={{ whiteSpace: 'pre-wrap' }}
        />
      </div>

      {/* ======= Número de ideas ======= */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700">
          Número de ideas a completar:
        </label>

        <input
          type="number"
          min={1}
          max={10}
          className="w-20 border rounded px-2 py-1"
          value={ex.ideasCount}
          onChange={(e) => {
            const count = parseInt(e.target.value || "1", 10);
            update({ ideasCount: Math.max(1, count) });
          }}
        />
      </div>

      <div className="text-xs text-slate-500">
        El alumno deberá completar {ex.ideasCount} idea{ex.ideasCount === 1 ? "" : "s"}.
      </div>

    </div>
  );
};


const renderSentenceCorrection = (ex: SentenceCorrectionExercise) => {
  const update = (patch: Partial<SentenceCorrectionExercise>) =>
    updateFieldImmediate(ex.id, patch);

  const addAnswer = () => {
    update({ correctAnswers: [...ex.correctAnswers, ""] });
  };

  const updateAnswer = (idx: number, value: string) => {
    const next = [...ex.correctAnswers];
    next[idx] = value;
    update({ correctAnswers: next });
  };

  const removeAnswer = (idx: number) => {
    update({
      correctAnswers: ex.correctAnswers.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="space-y-4">

{/* Título */}
<input
  type="text"
  className="w-full border rounded px-3 py-2 mb-2"
  placeholder="Título del ejercicio"
  value={ex.title}
  onChange={(e) => updateFieldImmediate(ex.id, { title: e.target.value })}
/>

{/* Instrucciones */}
<textarea
  rows={2}
  className="w-full border rounded px-3 py-2 mb-4"
  placeholder="Instrucciones del ejercicio"
  value={ex.instructions}
  onChange={(e) => updateFieldImmediate(ex.id, { instructions: e.target.value })}
/>

      {/* ======= Frase incorrecta ======= */}
      <div>
        <div className="text-sm font-medium text-slate-700 mb-1">
          Frase incorrecta (lo que el alumno debe corregir)
        </div>

        <textarea
          rows={3}
          className="w-full border rounded px-3 py-2"
          placeholder='Ejemplo: "I have saw your job offer."'
          value={ex.incorrect}
          onChange={(e) => update({ incorrect: e.target.value })}
          style={{ whiteSpace: "pre-wrap" }}
        />
      </div>

      {/* ======= Lista de respuestas correctas ======= */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-slate-700">
          Respuestas correctas (una o más)
        </div>

        {ex.correctAnswers.length === 0 && (
          <div className="text-sm text-slate-500">
            No hay respuestas todavía.
          </div>
        )}

        {ex.correctAnswers.map((ans, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              className="flex-1 border rounded px-3 py-2"
              placeholder={`Corrección válida #${idx + 1}`}
              value={ans}
              onChange={(e) => updateAnswer(idx, e.target.value)}
            />

            <button
              type="button"
              className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs"
              onClick={() => removeAnswer(idx)}
            >
              ✖
            </button>
          </div>
        ))}

        <button
          type="button"
          className="px-3 py-1.5 rounded bg-slate-200 text-sm"
          onClick={addAnswer}
        >
          + Añadir respuesta
        </button>
      </div>

      <div className="text-xs text-slate-500">
        El alumno deberá escribir una frase que coincida con cualquiera de estas respuestas.
      </div>
    </div>
  );
};
const renderOpenQuestion = (ex: OpenQuestionExercise) => {
  const update = (patch: Partial<OpenQuestionExercise>) =>
    updateFieldImmediate(ex.id, patch);

  return (
    <div className="space-y-4">
      <input
        className="w-full border rounded px-3 py-2"
        placeholder="Título del ejercicio"
        value={ex.title}
        onChange={(e) => update({ title: e.target.value })}
      />
      <textarea
        rows={2}
        className="w-full border rounded px-3 py-2"
        placeholder="Instrucciones del ejercicio"
        value={ex.instructions}
        onChange={(e) => update({ instructions: e.target.value })}
      />
      <textarea
        rows={3}
        className="w-full border rounded px-3 py-2"
        placeholder="Pregunta abierta (ej: Describe your ideal workplace...)"
        value={ex.prompt}
        onChange={(e) => update({ prompt: e.target.value })}
        style={{ whiteSpace: "pre-wrap" }}
      />
      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-600">Máx. caracteres</label>
        <input
          type="number"
          min={50}
          max={2000}
          className="w-24 border rounded px-2 py-1"
          value={ex.maxLength}
          onChange={(e) =>
            update({ maxLength: parseInt(e.target.value || "500") })
          }
        />
      </div>
      <p className="text-xs text-slate-500">
        ✅ Esta pregunta siempre se considera correcta al enviar — el alumno solo necesita escribir algo.
      </p>
    </div>
  );
};

  // Limpieza de debounce al desmontar
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    };
  }, []);
// useEffect(() => {
//   if (!mountedRef.current) return; // evitar que se dispare en el montaje
//   if (typeof onChange === "function") {
//     const jsonCurrent = JSON.stringify(exercisesRef.current);
//     const jsonSnapshot = JSON.stringify(snapshot);
//     // solo si el contenido cambió realmente
//     if (jsonCurrent !== jsonSnapshot) {
//       onChange(structuredClone(exercisesRef.current));
//     }
//   }
//   // eslint-disable-next-line react-hooks/exhaustive-deps
// }, [snapshot]);

  // ===== UI =====
  return (
    <div className="space-y-5">
      {/* Barra de herramientas */}
      {/* ======== AÑADIR EJERCICIOS ======== */}
<div className="flex flex-wrap gap-2 items-center sticky top-0 bg-white/85 backdrop-blur py-2 z-10">
  <span className="text-sm text-slate-600 pr-2">Añadir:</span>

  {/* --- Core / Quiz --- */}
  <button type="button" onClick={() => addExercise("multiple_choice")} className="px-3 py-1.5 rounded bg-sky-600 text-white text-sm">+ Opción Múltiple</button>

  <button type="button" onClick={() => addExercise("true_false")} className="px-3 py-1.5 rounded bg-emerald-600 text-white text-sm">+ Verdadero/Falso</button>

  <button type="button" onClick={() => addExercise("fill_blank")} className="px-3 py-1.5 rounded bg-amber-500 text-white text-sm">+ Rellenar Espacios</button>

  <button type="button" onClick={() => addExercise("sentence_correction")} className="px-3 py-1.5 rounded bg-gray-700 text-white text-sm">+ Corrección de Frase</button>

  {/* --- Comprensión --- */}
  <button type="button" onClick={() => addExercise("reading")} className="px-3 py-1.5 rounded bg-purple-600 text-white text-sm">+ Reading</button>

  <button type="button" onClick={() => addExercise("listening")} className="px-3 py-1.5 rounded bg-orange-600 text-white text-sm">+ Listening</button>

  {/* --- Organización / Relación --- */}
  <button type="button" onClick={() => addExercise("matching")} className="px-3 py-1.5 rounded bg-rose-600 text-white text-sm">+ Emparejar</button>

  <button type="button" onClick={() => addExercise("reorder")} className="px-3 py-1.5 rounded bg-fuchsia-600 text-white text-sm">+ Reordenar</button>

  {/* --- Producción --- */}
  <button type="button" onClick={() => addExercise("speaking")} className="px-3 py-1.5 rounded bg-pink-600 text-white text-sm">+ Speaking</button>

  <button type="button" onClick={() => addExercise("reflection")} className="px-3 py-1.5 rounded bg-lime-600 text-white text-sm">+ Reflexión</button>

  <button
  type="button"
  onClick={() => addExercise("verb_table")}
  className="px-3 py-1.5 rounded bg-indigo-600 text-white"
>
  + Verb Table
</button>

<button
  type="button"
  onClick={() => addExercise("open_question")}
  className="px-3 py-1.5 rounded bg-teal-600 text-white text-sm"
>
  + Pregunta Abierta
</button>

</div>


      {/* Contenedor de pestañas */}
      <div className="border rounded-lg bg-white shadow-sm">
        {/* Encabezado de pestañas */}
        <div className="flex items-center gap-2 overflow-x-auto p-2 border-b">
          {snapshot.length === 0 ? (
            <div className="text-sm text-slate-500 px-2 py-1">
              Aún no hay ejercicios.
            </div>
          ) : (
            snapshot.map((ex, i) => {
              const active = i === activeIdx;
              const valid =
                validationsRef.current[ex.id] ?? validateExercise(ex);
              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className={`px-3 py-1 rounded-full border text-sm whitespace-nowrap transition ${
                    active
                      ? "bg-sky-600 text-white border-sky-600"
                      : "bg-white hover:bg-slate-50"
                  }`}
                  title={getTabTitle(ex, i)}
                >
                  <span className="mr-1 opacity-80">{typeLabel(ex.type)}</span>
                  <span className="font-medium">#{i + 1}</span>
                  <span
                    className={`ml-2 inline-block w-2 h-2 rounded-full align-middle ${
                      valid ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                    title={valid ? "Válido" : "Incompleto"}
                  />
                </button>
              );
            })
          )}

          {/* Acciones para el ejercicio activo */}
          {snapshot.length > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                className="px-2 py-1 rounded border text-xs hover:bg-slate-50"
                onClick={() => swapExercises(activeIdx, activeIdx - 1)}
                disabled={activeIdx <= 0}
              >
                ← Mover
              </button>
              <button
                type="button"
                className="px-2 py-1 rounded border text-xs hover:bg-slate-50"
                onClick={() => swapExercises(activeIdx, activeIdx + 1)}
                disabled={activeIdx >= snapshot.length - 1}
              >
                Mover →
              </button>
              <button
                type="button"
                className="px-2 py-1 rounded border text-xs hover:bg-slate-50"
                onClick={() => duplicateExercise(snapshot[activeIdx].id)}
              >
                Duplicar
              </button>
              <button
                type="button"
                className="px-2 py-1 rounded bg-red-600 text-white text-xs hover:bg-red-700"
                onClick={() => removeExercise(snapshot[activeIdx].id)}
              >
                Eliminar
              </button>
            </div>
          )}
        </div>

        {/* Contenido de la pestaña activa */}
        {snapshot.length > 0 && snapshot[activeIdx] && (
          <div className="p-4">
            <div className="mb-3">
              <div className="text-xs text-slate-500">
                {typeLabel(snapshot[activeIdx].type)} •{" "}
                {getTabTitle(snapshot[activeIdx], activeIdx)}
              </div>
            </div>
            {renderEditorByType(snapshot[activeIdx])}
          </div>
        )}
      </div>

      {/* Guardar / Revertir */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={!touched || !allValid}
          className={`px-4 py-2 rounded bg-sky-600 text-white ${
            !touched || !allValid
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-sky-700"
          }`}
        >
          Guardar ejercicios
        </button>

        <button
          type="button"
          onClick={handleRevert}
          disabled={!touched}
          className={`px-3 py-2 rounded border ${
            !touched ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50"
          }`}
        >
          Revertir
        </button>

        <div className="text-sm text-slate-600">{savedMessage}</div>
      </div>
    </div>
  );
}