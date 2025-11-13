"use client";

import { useEffect, useState, useMemo } from "react";
import { FiCheck, FiX } from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import { userPlayedToday, updateUserGameAttempt } from "@/lib/games/attempts";

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

type Item = {
  emojis: string;
  answers: string[];
  hint?: string;
  explain?: string;
};

const BANK: Item[] = [
  { emojis: "🌧️🐱🐶", answers: ["raining cats and dogs"], hint: "Lluvia muy fuerte", explain: "Lloviendo intensamente." },
  { emojis: "🪙🗣️", answers: ["a penny for your thoughts"], hint: "¿Qué estás pensando?", explain: "Pedir opinión o pensamiento." },
  { emojis: "🧊😄", answers: ["break the ice"], hint: "Romper la tensión", explain: "Empezar conversación." },
  { emojis: "🧂🥚", answers: ["take it with a grain of salt", "take it with a pinch of salt"], hint: "No literal", explain: "Ser escéptico." },
  { emojis: "🛶🌊", answers: ["in the same boat"], hint: "Misma situación", explain: "Compartir el mismo problema." },
  { emojis: "🧁🍰", answers: ["piece of cake"], hint: "Muy fácil", explain: "Algo sencillo." },
  { emojis: "🐘🛋️", answers: ["the elephant in the room"], hint: "Evidente pero ignorado", explain: "Problema que nadie discute." },
  { emojis: "⏰💰", answers: ["time is money"], hint: "Tiempo valioso", explain: "El tiempo es oro." },
  { emojis: "🧵🔙", answers: ["back to square one"], hint: "Empezar otra vez", explain: "Volver al inicio." },
  { emojis: "🤐🗝️", answers: ["keep it under your hat"], hint: "No lo cuentes", explain: "Guardar un secreto." },
  { emojis: "🌬️🔥", answers: ["add fuel to the fire"], hint: "Empeorar", explain: "Agravar la situación." },
  { emojis: "📚🧠", answers: ["hit the books"], hint: "Estudiar fuerte", explain: "Ponerse a estudiar." },
  { emojis: "🛏️🌙", answers: ["call it a night"], hint: "Terminar por hoy", explain: "Irse a descansar." },
  { emojis: "🐦🐦🤏", answers: ["kill two birds with one stone"], hint: "2 en 1", explain: "Resolver dos cosas a la vez." },
  { emojis: "🎭😐", answers: ["face the music"], hint: "Aceptar culpa", explain: "Enfrentar consecuencias." },
  { emojis: "💤💡", answers: ["wake-up call"], hint: "Momento clave", explain: "Realización importante." },
  { emojis: "🧱🛣️", answers: ["hit a wall"], hint: "Bloqueo", explain: "No poder avanzar." },
  { emojis: "🔁🗣️", answers: ["get the ball rolling"], hint: "Empezar", explain: "Iniciar actividad." },
  { emojis: "🩹💔", answers: ["break someone's heart"], hint: "Gran tristeza", explain: "Lastimar emocionalmente." },
  { emojis: "😮‍💨🫥", answers: ["lose your touch"], hint: "Perder habilidad", explain: "Ya no sos tan bueno." },
  { emojis: "🧠⚡", answers: ["think outside the box"], hint: "Creativo", explain: "Ideas nuevas." },
  { emojis: "👀🧵", answers: ["keep an eye on"], hint: "Vigilar", explain: "Prestar atención." },
  { emojis: "🦴🐶", answers: ["throw someone a bone"], hint: "Ayudar un poco", explain: "Dar concesión pequeña." },
  { emojis: "🧗‍♂️💼", answers: ["climb the corporate ladder"], hint: "Progresar", explain: "Ascender profesionalmente." },
  { emojis: "🫥🤝", answers: ["bend over backwards"], hint: "Gran esfuerzo", explain: "Sacrificio grande." },
];

const GAME_ID = "idioms";

export default function EmojiIdioms() {
  const { user, role } = useAuth();

  /* Seleccionamos un IDIOM aleatorio por día */
  const item = useMemo(() => BANK[Math.floor(Math.random() * BANK.length)], []);

  const [input, setInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);

  const [blocked, setBlocked] = useState(false);
  const [checkingAttempt, setCheckingAttempt] = useState(true);

  /* 1️⃣  Intento diario */
  useEffect(() => {
    const check = async () => {
      if (!user) return setCheckingAttempt(false);

      if (role === "admin" || role === "profesor") {
        return setCheckingAttempt(false);
      }

      const played = await userPlayedToday(user.uid, GAME_ID);
      if (played) setBlocked(true);

      setCheckingAttempt(false);
    };

    check();
  }, [user, role]);

  /* 2️⃣ Checkeo */
  const onCheck = () => {
    if (correct) return;  


    const ok = item.answers.some((a) => norm(a) === norm(input));

    setRevealed(true);

    if (!ok) setWrongCount((c) => c + 1);
  };

  /* 3️⃣ Guardar intento si acertó */
  useEffect(() => {
    const save = async () => {
      if (!revealed) return;
      if (!user) return;
      if (role !== "alumno") return;

      const ok = item.answers.some((a) => norm(a) === norm(input));
      if (!ok) return;

      await updateUserGameAttempt(user.uid, GAME_ID);
      setBlocked(true);
    };

    save();
  }, [revealed]);

  /* 4️⃣ Pistas progresivas */
  const hints: string[] = [];

  if (wrongCount >= 1) {
    hints.push(`📏 Palabras: ${item.answers[0].split(" ").length}`);
  }

  if (wrongCount >= 2) {
    hints.push(`🔤 Primera palabra: "${item.answers[0].split(" ")[0]}"`);
  }

  if (wrongCount >= 3) {
    const parts = item.answers[0].split(" ");
    hints.push(`🔡 Última palabra: "${parts[parts.length - 1]}"`);
  }

  if (wrongCount >= 4) {
    const target = item.answers[0].split(" ");
    const guessParts = input.split(" ");

    const reveal = target
      .map((w, i) =>
        guessParts[i] && norm(guessParts[i]) === norm(w) ? w : "___"
      )
      .join(" ");

    hints.push(`🧩 En posición: ${reveal}`);
  }

  /* UI */
  if (checkingAttempt) {
    return <div className="py-20 text-center">Verificando intento...</div>;
  }

  if (blocked && role === "alumno") {
    return (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold mb-3">Ya jugaste hoy 🎮</h2>
        <p className="text-slate-500">Volvé mañana.</p>
      </div>
    );
  }

  const correct = revealed && item.answers.some((a) => norm(a) === norm(input));

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="rounded-2xl border p-8 shadow-sm bg-white">
        <div className="text-5xl text-center mb-4">{item.emojis}</div>

        <p className="text-center text-sm text-slate-500 mb-4">
          Pista inicial: {item.hint}
        </p>

        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={correct}  

            placeholder="Escribe el idiom..."
            className="flex-1 border p-3 rounded-lg"
            onKeyDown={(e) => e.key === "Enter" && onCheck()}
          />

          <button
  onClick={onCheck}
  disabled={correct || !input.trim()}
  className={`px-4 py-2 rounded-lg text-white transition
    ${
      correct || !input.trim()
        ? "bg-slate-400 cursor-not-allowed"
        : "bg-blue-600 hover:bg-blue-700"
    }
  `}
>
  Comprobar
</button>

        </div>

        {/* Resultado */}
        {revealed && (
  <div
    className={`mt-6 p-4 rounded-lg border ${
      correct
        ? "bg-emerald-50 border-emerald-300"
        : "bg-rose-50 border-rose-300"
    }`}
  >
    {/* Mensaje principal */}
    {correct ? "✔ ¡Correcto!" : "❌ No es correcto"}

    {/* Solo mostrar respuesta si es correcto */}
    {correct && (
      <p className="mt-2 text-slate-700">
        Respuesta: {item.answers.join(", ")}
      </p>
    )}

    {/* Explicación SOLO si es correcto */}
    {correct && (
      <p className="mt-2 text-slate-500">
        {item.explain}
      </p>
    )}

    {/* Cuando es incorrecto, mostrar mensaje motivador */}
    {!correct && (
      <p className="mt-2 text-slate-500">
        Seguí intentando… usá las pistas para acercarte 👍
      </p>
    )}
  </div>
)}


        {/* Pistas */}
        {hints.length > 0 && (
          <div className="mt-6 space-y-2">
            <h4 className="font-semibold">Pistas</h4>
            {hints.map((h, i) => (
              <p key={i} className="bg-slate-100 p-2 rounded text-sm">
                {h}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
