"use client";

import { useState, useEffect } from "react";
import WordleTile from "@/components/ui/WordleTile";
import { useAuth } from "@/contexts/AuthContext";


type LetterState = "correct" | "present" | "absent" | "";

interface GuessResult {
  letter: string;
  state: LetterState;
}

export default function Wordle() {
  const GAME_KEY = "wordle_last_play";
  


  const MAX_TRIES = 6;

  const [word, setWord] = useState("");
  const [guesses, setGuesses] = useState<GuessResult[][]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [hint, setHint] = useState<string | null>(null);
  const [loadingWord, setLoadingWord] = useState(false);
  const { user, role } = useAuth();
  const [locked, setLocked] = useState(false);


  const WORD_LENGTH = word.length;

  // ======================================================
  // API: obtener palabra
  // ======================================================
  const fetchWord = async () => {
  try {
    setLoadingWord(true);

    const res = await fetch("/api/games/wordle");
    const data = await res.json();

    const w = data.word.toLowerCase().trim();
    setWord(w);

    setHint(null);
    setGuesses([]);
    setCurrentInput("");
    setStatus("playing");
  } catch (err) {
    console.error(err);
  } finally {
    setLoadingWord(false);
  }
};


  useEffect(() => {
  if (!user) return;

  // ADMIN → siempre puede jugar
  if (user.role === "admin") {
    setLocked(false);
    fetchWord();
    return;
  }

  // ALUMNO → 1 intento por día
  const lastPlay = localStorage.getItem(GAME_KEY);
  const today = new Date().toDateString();

  if (lastPlay === today) {
    setLocked(true);
  } else {
    setLocked(false);
    fetchWord();
  }
}, [user]);


  // ======================================================
  // Validar intento
  // ======================================================
  const submitGuess = () => {
  if (currentInput.length !== WORD_LENGTH) return;

  const attempt = currentInput.toLowerCase();
  const result: GuessResult[] = [];

  // ======================================================
  // Registrar el intento del alumno (solo si NO es admin)
  // ======================================================
  if (user?.role !== "admin") {
    const today = new Date().toDateString();
    localStorage.setItem(GAME_KEY, today);
  }

  // ======================================================
  // LÓGICA WORDLE (igual a la tuya)
  // ======================================================

  // Conteo de letras de la palabra objetivo
  const letterCount: Record<string, number> = {};
  for (const char of word) {
    letterCount[char] = (letterCount[char] || 0) + 1;
  }

  // Paso 1: marcar CORRECT
  for (let i = 0; i < WORD_LENGTH; i++) {
    const letter = attempt[i];

    if (letter === word[i]) {
      result[i] = { letter, state: "correct" };
      letterCount[letter] -= 1;
    } else {
      result[i] = { letter, state: "" };
    }
  }

  // Paso 2: marcar PRESENT / ABSENT
  for (let i = 0; i < WORD_LENGTH; i++) {
    const letter = attempt[i];

    if (result[i].state === "correct") continue;

    if (letterCount[letter] > 0) {
      result[i].state = "present";
      letterCount[letter] -= 1;
    } else {
      result[i].state = "absent";
    }
  }

  // Guardar intento
  const updated = [...guesses, result];
  setGuesses(updated);
  setCurrentInput("");

  // Win / lose
  if (attempt === word) {
    setStatus("won");
    return;
  }
  if (updated.length >= MAX_TRIES) {
    setStatus("lost");
    return;
  }

  // Hints
  if (updated.length === 3)
    setHint("Pista: La palabra empieza con " + word[0].toUpperCase());
  if (updated.length === 5)
    setHint("Pista final: Es un tipo de sustantivo común");
};


  // Si todavía no cargó palabra, evitar errores
  if (!WORD_LENGTH) {
    return (
      <div className="w-full h-full flex items-center justify-center py-32">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

 


  if (locked) {
  return (
    <div className="max-w-md mx-auto py-16 text-center space-y-4">
      <h1 className="text-3xl font-bold text-slate-800">Wordle (Further Edition)</h1>
      <p className="text-slate-500">Ya utilizaste tu intento diario.</p>
      <p className="text-slate-600 text-sm">
        Vuelve mañana para jugar nuevamente ✨
      </p>
    </div>
  );
}

  // ======================================================
  // UI
  // ======================================================
  return (
    <div className="max-w-md mx-auto py-10 text-center space-y-6">
      <h1 className="text-3xl font-bold">Wordle (Further Edition)</h1>

      {hint && <p className="text-sm text-blue-600 font-medium">{hint}</p>}

      {/* GRID */}
      <div className="grid grid-rows-6 gap-2 mt-6">
        {Array.from({ length: MAX_TRIES }).map((_, row) => {
          const guessRow = guesses[row] ?? [];

          return (
            <div
              key={row}
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${WORD_LENGTH}, 1fr)`,
              }}
            >
              {Array.from({ length: WORD_LENGTH }).map((_, col) => {
                const cell = guessRow[col];
                const letter = cell?.letter || "";

                const delay =
                  row === guesses.length - 1 ? col * 0.15 : 0;

                return (
                  <WordleTile
                    key={col}
                    letter={letter}
                    state={cell?.state ?? ""}
                    delay={delay}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      {status === "playing" && (
        <>
          <input
            maxLength={WORD_LENGTH}
            value={currentInput}
            onChange={(e) =>
              setCurrentInput(
                e.target.value.replace(/[^a-zA-Z]/g, "")
              )
            }
            className="border p-2 rounded-lg text-center tracking-widest uppercase mt-4"
          />

          <button
            onClick={submitGuess}
            className="block mx-auto px-6 py-3 bg-blue-600 text-white rounded-lg mt-4"
          >
            Enviar
          </button>
        </>
      )}

      {status === "won" && (
        <p className="text-emerald-600 font-semibold text-xl">
          🎉 ¡Correcto! La palabra era "{word}".
        </p>
      )}

      {status === "lost" && (
        <p className="text-red-600 font-semibold text-xl">
          💀 Perdiste. La palabra era "{word}".
        </p>
      )}

      <button
  onClick={() => {
  if (user?.role !== "admin") return;
  fetchWord();
}}
disabled={user?.role !== "admin" || loadingWord}

  className={`
    mt-6 px-6 py-3 rounded-xl font-semibold shadow-md transition
    flex items-center justify-center gap-2 mx-auto
    ${
      loadingWord
        ? "bg-slate-300 text-slate-500 cursor-not-allowed"
        : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
    }
  `}
>
  {loadingWord ? (
    <>
      <svg
        className="animate-spin h-5 w-5 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        ></path>
      </svg>
      Cargando...
    </>
  ) : (
    "Nueva palabra"
  )}
</button>

    </div>
  );
}
