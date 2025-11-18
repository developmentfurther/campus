"use client";

import { useState, useEffect } from "react";
import WordleTile from "@/components/ui/WordleTile";
import { useAuth } from "@/contexts/AuthContext";
import {
  userPlayedToday,
  updateUserGameAttempt,
} from "@/lib/games/attempts";

type LetterState = "correct" | "present" | "absent" | "";

interface GuessResult {
  letter: string;
  state: LetterState;
}

const GAME_ID = "wordle";

export default function Wordle() {
  const { user, role } = useAuth();

  const MAX_TRIES = 6;

  const [word, setWord] = useState("");
  const [guesses, setGuesses] = useState<GuessResult[][]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [hint, setHint] = useState<string | null>(null);

  // === estados para control de intentos (idéntico a Hangman) ===
  const [blocked, setBlocked] = useState(false);
  const [checkingAttempt, setCheckingAttempt] = useState(true);
  const [loadingWord, setLoadingWord] = useState(true);

  const WORD_LENGTH = word.length;

  // ======================================================
  // VERIFICAR INTENTO DIARIO (FireStore)
  // ======================================================
  useEffect(() => {
    const check = async () => {
      if (!user) {
        setCheckingAttempt(false);
        return;
      }

      // Admin y profesor → siempre pueden jugar
      if (role === "admin" || role === "profesor") {
        setBlocked(false);
        setCheckingAttempt(false);
        return;
      }

      // Alumno → verificar Firestore
      const played = await userPlayedToday(user.uid, GAME_ID);
      if (played) setBlocked(true);

      setCheckingAttempt(false);
    };

    void check();
  }, [user, role]);

  // ======================================================
  // FETCH PALABRA SOLO SI PUEDE JUGAR
  // ======================================================
  const fetchWord = async () => {
    try {
      setLoadingWord(true);
      setGuesses([]);
      setCurrentInput("");
      setHint(null);
      setStatus("playing");

      const res = await fetch("/api/games/wordle");
      const data = await res.json();

      setWord(data.word.toLowerCase().trim());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWord(false);
    }
  };

  useEffect(() => {
    if (!checkingAttempt && !blocked) {
      void fetchWord();
    }
  }, [checkingAttempt, blocked]);

  // ======================================================
  // SUBMIT DEL INTENTO
  // ======================================================
  const submitGuess = () => {
    if (currentInput.length !== WORD_LENGTH) return;

    const attempt = currentInput.toLowerCase();
    const result: GuessResult[] = [];

    // Conteo de letras
    const letterCount: Record<string, number> = {};
    for (const char of word) {
      letterCount[char] = (letterCount[char] || 0) + 1;
    }

    // Paso 1: correct
    for (let i = 0; i < WORD_LENGTH; i++) {
      const letter = attempt[i];
      if (letter === word[i]) {
        result[i] = { letter, state: "correct" };
        letterCount[letter] -= 1;
      } else {
        result[i] = { letter, state: "" };
      }
    }

    // Paso 2: present / absent
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

    const updated = [...guesses, result];
    setGuesses(updated);
    setCurrentInput("");

    // Ganar o perder
    if (attempt === word) {
      setStatus("won");
      return;
    } else if (updated.length >= MAX_TRIES) {
      setStatus("lost");
      return;
    }

    // Hints
    if (updated.length === 3)
      setHint("Pista: empieza con " + word[0].toUpperCase());
    if (updated.length === 5)
      setHint("Pista final: es un sustantivo común");
  };

  // ======================================================
  // AL TERMINAR → GUARDAR INTENTO (FireStore)
  // ======================================================
  useEffect(() => {
    const mark = async () => {
      if (!user) return;
      if (role !== "alumno") return; 
      if (status === "playing") return;

      await updateUserGameAttempt(user.uid, GAME_ID);
      setBlocked(true);
    };

    void mark();
  }, [status, user, role]);

  // ======================================================
  // UI ESTADOS (igual Hangman)
  // ======================================================
  if (checkingAttempt) {
    return (
      <div className="py-20 text-center text-slate-600">
        Verificando intentos de hoy...
      </div>
    );
  }

  if (blocked && role === "alumno") {
    return (
      <div className="py-20 text-center text-slate-600">
        <h2 className="text-2xl font-bold mb-3">Ya jugaste hoy Wordle 🎮</h2>
        <p className="text-slate-500">
          Tenés 1 partida por día. Volvé mañana ✨
        </p>
      </div>
    );
  }

  if (loadingWord || WORD_LENGTH === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center py-32">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // ======================================================
  // UI PRINCIPAL
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
                const delay = row === guesses.length - 1 ? col * 0.15 : 0;

                return (
                  <WordleTile
                    key={col}
                    letter={cell?.letter || ""}
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
              setCurrentInput(e.target.value.replace(/[^a-zA-Z]/g, ""))
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

      {(role === "admin" || role === "profesor") && (
        <button
          onClick={fetchWord}
          className="mt-6 px-6 py-3 rounded-xl bg-slate-200 text-slate-800 hover:bg-slate-300"
        >
          Nueva palabra
        </button>
      )}
    </div>
  );
}
