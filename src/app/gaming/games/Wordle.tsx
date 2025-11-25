"use client";

import { useState, useEffect } from "react";
import WordleTile from "@/components/ui/WordleTile";
import { useAuth } from "@/contexts/AuthContext";
import {
  userPlayedToday,
  updateUserGameAttempt,
} from "@/lib/games/attempts";
import { useI18n } from "@/contexts/I18nContext";
import { motion } from "framer-motion";

type LetterState = "correct" | "present" | "absent" | "";

interface GuessResult {
  letter: string;
  state: LetterState;
}

const GAME_ID = "wordle";

export default function Wordle() {
  const { t } = useI18n();
  const { user, role, userProfile } = useAuth();

  const MAX_TRIES = 6;

  const [word, setWord] = useState("");
  const [guesses, setGuesses] = useState<GuessResult[][]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [hint, setHint] = useState<string | null>(null);

  const [blocked, setBlocked] = useState(false);
  const [checkingAttempt, setCheckingAttempt] = useState(true);
  const [loadingWord, setLoadingWord] = useState(true);

  const WORD_LENGTH = word.length;

  /* ============================================================
     🔍 Verificar intento diario
  ============================================================ */
  useEffect(() => {
    const check = async () => {
      if (!user) return setCheckingAttempt(false);

      if (role === "admin" || role === "profesor") {
        setBlocked(false);
        return setCheckingAttempt(false);
      }

      const played = await userPlayedToday(user.uid, GAME_ID);
      if (played) setBlocked(true);

      setCheckingAttempt(false);
    };

    void check();
  }, [user, role]);

  /* ============================================================
     📡 Obtener palabra del backend
  ============================================================ */
  const fetchWord = async () => {
    try {
      setLoadingWord(true);
      setGuesses([]);
      setCurrentInput("");
      setHint(null);
      setStatus("playing");

      const res = await fetch(
        `/api/games/wordle?lang=${userProfile.learningLanguage}`
      );
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

  /* ============================================================
     🧠 Submit del intento
  ============================================================ */
  const submitGuess = () => {
    if (currentInput.length !== WORD_LENGTH) return;

    const attempt = currentInput.toLowerCase();
    const result: GuessResult[] = [];

    const letterCount: Record<string, number> = {};
    for (const char of word) {
      letterCount[char] = (letterCount[char] || 0) + 1;
    }

    for (let i = 0; i < WORD_LENGTH; i++) {
      const letter = attempt[i];
      if (letter === word[i]) {
        result[i] = { letter, state: "correct" };
        letterCount[letter] -= 1;
      } else {
        result[i] = { letter, state: "" };
      }
    }

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

    if (attempt === word) {
      setStatus("won");
      return;
    } else if (updated.length >= MAX_TRIES) {
      setStatus("lost");
      return;
    }

    if (updated.length === 3)
      setHint(t("gaming.games.wordle.hint1", { letter: word[0].toUpperCase() }));

    if (updated.length === 5)
      setHint(t("gaming.games.wordle.hint2"));
  };

  /* ============================================================
     📝 Guardar intento cuando termina
  ============================================================ */
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

  /* ============================================================
     UI — ESTADOS
  ============================================================ */
  if (checkingAttempt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-8 border-purple-200" />
            <div className="absolute inset-0 rounded-full border-8 border-t-purple-600 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

   // Bloqueado (ya jugó hoy)
  if (blocked && role === "alumno") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md"
        >
          <div className="text-7xl mb-6">⏰</div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            {t("gaming.games.wordle.alreadyPlayedTitle")}
          </h2>
          <p className="text-slate-600 text-lg">
            {t("gaming.games.wordle.alreadyPlayedText")}
          </p>
        </motion.div>
      </div>
    );
  }

  if (loadingWord || WORD_LENGTH === 0) {
    return (
       <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-8 border-purple-200" />
            <div className="absolute inset-0 rounded-full border-8 border-t-purple-600 animate-spin" />
          </div>
        </div>
      </div>
    );
  }


  /* ============================================================
     UI — PRINCIPAL
  ============================================================ */
  return (
    <div className="max-w-md mx-auto py-10 text-center space-y-6">
      <h1 className="text-3xl font-bold">
        {t("gaming.games.wordle.title")}
      </h1>

      {hint && (
        <p className="text-sm text-blue-600 font-medium">{hint}</p>
      )}

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

      {/* INPUT */}
      {status === "playing" && (
        <>
          <input
            maxLength={WORD_LENGTH}
            value={currentInput}
            onChange={(e) =>
              setCurrentInput(
                e.target.value.replace(/[^a-zA-Záéíóúüñçàèìòùâêîôû]/gi, "")
              )
            }
            className="border p-2 rounded-lg text-center tracking-widest uppercase mt-4"
          />

          <button
            onClick={submitGuess}
            className="block mx-auto px-6 py-3 bg-blue-600 text-white rounded-lg mt-4"
          >
            {t("gaming.games.wordle.submit")}
          </button>
        </>
      )}

      {/* RESULTADOS */}
      {status === "won" && (
        <p className="text-emerald-600 font-semibold text-xl">
          {t("gaming.games.wordle.won", { word })}
        </p>
      )}

      {status === "lost" && (
        <p className="text-red-600 font-semibold text-xl">
          {t("gaming.games.wordle.lost", { word })}
        </p>
      )}

      {/* ADMIN/PROFESOR: nueva palabra */}
      {(role === "admin" || role === "profesor") && (
        <button
          onClick={fetchWord}
          className="mt-6 px-6 py-3 rounded-xl bg-slate-200 text-slate-800 hover:bg-slate-300"
        >
          {t("gaming.games.wordle.new")}
        </button>
      )}
    </div>
  );
}
