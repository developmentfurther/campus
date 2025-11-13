"use client";
import { useMemo, useState } from "react";
import { FiCheck, FiX, FiRotateCw, FiArrowRight } from "react-icons/fi";

// Normaliza strings: minúsculas, sin tildes, trim
function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

type Item = {
  emojis: string;
  answers: string[];     // variantes aceptadas
  hint?: string;         // breve pista
  explain?: string;      // explicación corta
};

const BANK: Item[] = [
  {
    emojis: "🌧️🐱🐶",
    answers: ["raining cats and dogs"],
    hint: "Lluvia muy fuerte",
    explain: "Expresa que está lloviendo a cántaros.",
  },
  {
    emojis: "🪙🗣️",
    answers: ["a penny for your thoughts"],
    hint: "¿Qué estás pensando?",
    explain: "Se usa para pedir la opinión o lo que alguien está pensando.",
  },
  {
    emojis: "🧊😄",
    answers: ["break the ice"],
    hint: "Romper la tensión inicial",
    explain: "Iniciar una conversación o actividad para relajar el ambiente.",
  },
  {
    emojis: "🧂🥚",
    answers: ["take it with a grain of salt", "take it with a pinch of salt"],
    hint: "No lo tomes tan literal",
    explain: "No creer algo completamente; mantener escepticismo.",
  },
  {
    emojis: "🛶🌊",
    answers: ["in the same boat"],
    hint: "Misma situación",
    explain: "Compartir el mismo problema o circunstancia.",
  },
  {
    emojis: "🧁🍰",
    answers: ["piece of cake"],
    hint: "Muy fácil",
    explain: "Algo muy sencillo de hacer.",
  },
  {
    emojis: "🐘🛋️",
    answers: ["the elephant in the room"],
    hint: "Tema evidente, nadie lo menciona",
    explain: "Un problema obvio del que nadie quiere hablar.",
  },
  {
    emojis: "⏰💰",
    answers: ["time is money"],
    hint: "Valora tu tiempo",
    explain: "El tiempo es valioso como el dinero.",
  },
  {
    emojis: "🧵🔙",
    answers: ["back to square one"],
    hint: "A empezar de nuevo",
    explain: "Volver al inicio tras un intento fallido.",
  },
  {
    emojis: "🤐🗝️",
    answers: ["keep it under your hat", "keep it a secret"],
    hint: "No lo cuentes",
    explain: "Guardar un secreto.",
  },
];

export default function EmojiIdioms() {
  // baraja fija por sesión
  const deck = useMemo(() => [...BANK].sort(() => Math.random() - 0.5), []);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [corrects, setCorrects] = useState(0);

  const current = deck[idx];
  const total = deck.length;

  const check = () => {
    if (revealed) return;
    const ok = current.answers.some(a => norm(a) === norm(input));
    setRevealed(true);
    if (ok) setCorrects(c => c + 1);
  };

  const next = () => {
    if (idx < total - 1) {
      setIdx(i => i + 1);
      setInput("");
      setRevealed(false);
    }
  };

  const reset = () => {
    // recarga simple de estado (re-barajar)
    const shuffled = [...BANK].sort(() => Math.random() - 0.5);
    (deck as Item[]).splice(0, deck.length, ...shuffled);
    setIdx(0);
    setInput("");
    setRevealed(false);
    setCorrects(0);
  };

  const isCorrect =
    revealed && current.answers.some(a => norm(a) === norm(input));

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header / progreso */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-slate-500">
          Ítem <span className="font-semibold text-slate-700">{idx + 1}</span> / {total}
        </div>
        <div className="text-sm text-slate-500">
          Correctas: <span className="font-semibold text-emerald-600">{corrects}</span>
        </div>
      </div>

      {/* Card principal */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-5xl text-center select-none mb-4">{current.emojis}</div>

        {current.hint && (
          <p className="text-center text-sm text-slate-500 mb-6">Pista: {current.hint}</p>
        )}

        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Escribe el idiom en inglés…"
            className="flex-1 rounded-lg border border-slate-300 bg-white p-3 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
            onKeyDown={(e) => (e.key === "Enter" ? check() : null)}
            disabled={revealed}
          />
          <button
            onClick={check}
            disabled={!input.trim() || revealed}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition
              ${revealed ? "bg-slate-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            Comprobar
          </button>
        </div>

        {/* Resultado */}
        {revealed && (
          <div
            className={`mt-6 rounded-lg border p-4 text-sm flex items-start gap-2
              ${isCorrect
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"}`}
          >
            {isCorrect ? <FiCheck className="mt-0.5" /> : <FiX className="mt-0.5" />}
            <div>
              {isCorrect ? (
                <p className="font-medium">¡Correcto!</p>
              ) : (
                <>
                  <p className="font-medium">Respuesta correcta:</p>
                  <ul className="list-disc pl-5">
                    {current.answers.map((a) => (
                      <li key={a} className="italic">{a}</li>
                    ))}
                  </ul>
                </>
              )}
              {current.explain && <p className="mt-2 opacity-80">{current.explain}</p>}
            </div>
          </div>
        )}

        {/* Controles abajo */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
          >
            <FiRotateCw /> Reiniciar
          </button>

          <button
            onClick={next}
            disabled={idx >= total - 1 || !revealed}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition
              ${idx >= total - 1 || !revealed ? "bg-slate-300 cursor-not-allowed" : "bg-slate-900 hover:bg-black"}`}
          >
            Siguiente <FiArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
}
