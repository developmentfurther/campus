import Exercises from "../exercises/Exercises";
import VocabularyEditor from "../VocabularyEditor";
import ReactMarkdown from "react-markdown";


function defaultExerciseForType(type: string) {
  switch (type) {
    case "multiple_choice":
      return { question: "", options: ["", ""], correctIndex: 0 };

    case "true_false":
      return { statement: "", answer: true };

    case "fill_blank":
      return { title: "", sentence: "", answers: [], hintWords: "" };

    case "text":
      return { prompt: "", maxLength: 500 };

    case "reorder":
      return { title: "", items: [], correctOrder: [] };

    case "matching":
      return { title: "", pairs: [{ left: "", right: "" }] };

    // === comprehensión ===
    case "reading":
      return {
        title: "",
        text: "",
        questions: [
          { id: crypto.randomUUID(), kind: "mc", prompt: "", options: ["", ""], correctIndex: 0 }
        ],
      };

    case "listening":
      return {
        title: "",
        audioUrl: "",
        questions: [
          { id: crypto.randomUUID(), kind: "tf", prompt: "", answer: true }
        ],
      };

    case "speaking":
      return { title: "", bullets: [""] };

    case "reflection":
      return { title: "", prompt: "", ideasCount: 3 };

    case "sentence_correction":
      return { incorrect: "", correctAnswers: [""] };

    case "verb_table":
      return {
        title: "",
        rows: [{ subject: "I", positive: "", negative: "" }],
        blanks: [],
        correct: {},
      };

    default:
      return {};
  }
}


export default function BlockEditor({ block, onChange, onDelete }) {
  switch (block.type) {

    case "title":
      return (
        <div>
          <label>Título</label>
          <input
            type="text"
            className="border rounded w-full px-2 py-1"
            value={block.value}
            onChange={(e) => onChange({ ...block, value: e.target.value })}
          />
          <button onClick={onDelete} className="text-red-600 mt-2">Eliminar</button>
        </div>
      );

case "description": {
  const insert = (syntax: string) => {
    const newVal = block.value + syntax;
    onChange({ ...block, value: newVal });
  };

  return (
    <div className="space-y-3">

      <label className="font-medium text-sm">Descripción (Markdown soportado)</label>

      {/* Toolbar Markdown */}
      <div className="flex flex-wrap gap-2 text-sm">
        
        <button
          type="button"
          onClick={() => insert("**texto en negrita** ")}
          className="px-2 py-1 border rounded bg-slate-100 hover:bg-slate-200"
        >
          <b>B</b>
        </button>

        <button
          type="button"
          onClick={() => insert("*texto en cursiva* ")}
          className="px-2 py-1 border rounded bg-slate-100 hover:bg-slate-200 italic"
        >
          I
        </button>

        <button
          type="button"
          onClick={() => insert("\n- ítem de lista")}
          className="px-2 py-1 border rounded bg-slate-100 hover:bg-slate-200"
        >
          • Lista
        </button>

        <button
          type="button"
          onClick={() => insert("[texto del link](https://url.com)")}
          className="px-2 py-1 border rounded bg-slate-100 hover:bg-slate-200"
        >
          🔗 Link
        </button>
      </div>

      {/* Entrada Markdown */}
      <textarea
        rows={5}
        className="w-full border rounded px-3 py-2 font-mono"
        placeholder="Escribe la descripción en Markdown..."
        value={block.value}
        onChange={(e) => onChange({ ...block, value: e.target.value })}
        style={{ whiteSpace: "pre-wrap" }}
      />

      {/* Preview */}
      <div className="border rounded p-3 bg-slate-50">
        <p className="text-sm font-medium text-slate-700 mb-2">Vista previa:</p>
        <ReactMarkdown>{block.value || "*Escribe para ver la vista previa...*"}</ReactMarkdown>
      </div>

      {/* Botón eliminar */}
      <button
        type="button"
        onClick={onDelete}
        className="text-red-600 text-sm underline"
      >
        Eliminar bloque
      </button>
    </div>
  );
}



    case "theory": {
  const insert = (syntax: string) => {
    const newVal = block.value + syntax;
    onChange({ ...block, value: newVal });
  };

  return (
    <div className="space-y-3">

      {/* Toolbar Markdown */}
      <div className="flex flex-wrap gap-2 text-sm">
        <button
          type="button"
          onClick={() => insert("**texto en negrita** ")}
          className="px-2 py-1 border rounded bg-slate-100 hover:bg-slate-200"
        >
          <b>B</b>
        </button>

        <button
          type="button"
          onClick={() => insert("*texto en cursiva* ")}
          className="px-2 py-1 border rounded bg-slate-100 hover:bg-slate-200 italic"
        >
          I
        </button>

        <button
          type="button"
          onClick={() => insert("\n- ítem de lista")}
          className="px-2 py-1 border rounded bg-slate-100 hover:bg-slate-200"
        >
          • Lista
        </button>

        <button
          type="button"
          onClick={() => insert("\n1. paso uno\n2. paso dos")}
          className="px-2 py-1 border rounded bg-slate-100 hover:bg-slate-200"
        >
          1. Lista num.
        </button>

        <button
          type="button"
          onClick={() => insert("\n## Subtítulo\n")}
          className="px-2 py-1 border rounded bg-slate-100 hover:bg-slate-200"
        >
          H2
        </button>

        <button
          type="button"
          onClick={() => insert("[texto del link](https://url.com)")}
          className="px-2 py-1 border rounded bg-slate-100 hover:bg-slate-200"
        >
          🔗 Link
        </button>
      </div>

      {/* Area Markdown */}
      <textarea
        rows={8}
        className="w-full border rounded px-3 py-2 font-mono"
        placeholder="Escribe teoría en formato Markdown..."
        value={block.value}
        onChange={(e) => onChange({ ...block, value: e.target.value })}
        style={{ whiteSpace: "pre-wrap" }}
      />


 {/* === PREVIEW Markdown === */}
      <div className="border rounded p-3 bg-slate-50">
        <p className="font-medium text-sm text-slate-700 mb-2">Vista previa:</p>
        <ReactMarkdown>{block.value || "*Escribe teoría para ver la vista previa...*"}</ReactMarkdown>
      </div>
      {/* Botón eliminar */}
      <button
        type="button"
        onClick={onDelete}
        className="text-red-600 text-sm underline"
      >
        Eliminar bloque
      </button>

    </div>
  );
}


    case "video":
      return (
        <div>
          <label>Video URL</label>
          <input
            className="border rounded w-full px-2 py-1"
            value={block.url}
            onChange={(e) => onChange({ ...block, url: e.target.value })}
          />
          <button onClick={onDelete} className="text-red-600 mt-2">Eliminar</button>
        </div>
      );

    case "pdf":
      return (
        <div>
          <label>PDF URL</label>
          <input
            className="border rounded w-full px-2 py-1"
            value={block.url}
            onChange={(e) => onChange({ ...block, url: e.target.value })}
          />
          <button onClick={onDelete} className="text-red-600 mt-2">Eliminar</button>
        </div>
      );

    case "vocabulary":
  return (
    <div className="space-y-3">

      {/* Editor de vocabulario */}
      <VocabularyEditor
        value={block}
        onChange={onChange}
      />

      {/* Botón eliminar bloque */}
      <button
        type="button"
        onClick={onDelete}
        className="text-red-600 text-sm underline"
      >
        Eliminar bloque
      </button>

    </div>
  );


case "exercise": {
  // Si todavía no existe el array de ejercicios, mostrar selector de tipo
  if (!block.exercises) {
    return (
      <div className="space-y-3">

        <p className="font-medium text-sm text-slate-700">
          Selecciona un tipo de ejercicio:
        </p>

        <div className="flex flex-wrap gap-2">
          {[
            "multiple_choice",
            "true_false",
            "fill_blank",
            "text",
            "reorder",
            "matching",
            "reading",
            "listening",
            "speaking",
            "reflection",
            "sentence_correction",
            "verb_table",
          ].map((type) => (
            <button
              key={type}
              onClick={() =>
                onChange({
                  ...block,
                  exercises: [
                    {
                      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                      type,
                      ...defaultExerciseForType(type),
                    },
                  ],
                })
              }
              className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 rounded text-sm capitalize"
            >
              {type.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="text-red-600 text-sm underline mt-2"
        >
          Eliminar bloque
        </button>
      </div>
    );
  }

  // Render del editor con múltiples ejercicios
  return (
    <div className="space-y-3">

      <Exercises
        initial={block.exercises}
        onChange={(arr) => onChange({ ...block, exercises: arr })}
      />

      <button
        type="button"
        onClick={onDelete}
        className="text-red-600 text-sm underline"
      >
        Eliminar bloque
      </button>

    </div>
  );
}


    default:
      return <div>Tipo no soportado.</div>;
  }
}
