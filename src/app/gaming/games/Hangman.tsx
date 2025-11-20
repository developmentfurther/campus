"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import {
  userPlayedToday,
  updateUserGameAttempt,
} from "@/lib/games/attempts";

type GameStatus = "playing" | "won" | "lost";
const GAME_ID = "hangman";

/* ============================================================
   🪢 HANGMAN ANIMADO
============================================================ */
const HangmanDrawing = ({ wrongGuesses }: { wrongGuesses: number }) => {
  return (
    <div className="relative w-52 h-64 mx-auto">
      {/* Poste */}
      <motion.div
        className="absolute left-4 top-0 w-1 h-56 bg-slate-700"
        initial={{ height: 0 }}
        animate={{ height: "14rem" }}
      />

      {/* Barra superior */}
      <motion.div
        className="absolute left-4 top-0 w-28 h-1 bg-slate-700"
        initial={{ width: 0 }}
        animate={{ width: "7rem" }}
      />

      {/* Soga */}
      <motion.div
        className="absolute left-[7.5rem] top-0 w-1 h-10 bg-slate-500"
        initial={{ height: 0 }}
        animate={{ height: "2.5rem" }}
      />

      {/* Cabeza */}
      {wrongGuesses >= 1 && (
        <motion.div
          className="absolute left-[6.6rem] top-10 w-12 h-12 rounded-full bg-yellow-200 border-4 border-yellow-600"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        />
      )}

      {/* Cuerpo */}
      {wrongGuesses >= 2 && (
        <motion.div
          className="absolute left-[7.4rem] top-[4.7rem] w-1 h-16 bg-yellow-600"
          animate={{ scaleY: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      )}

      {/* Brazos */}
      {wrongGuesses >= 3 && (
        <>
          <motion.div
            className="absolute left-[7.4rem] top-[5rem] w-1 h-10 bg-yellow-600 origin-top"
            initial={{ rotate: -90 }}
            animate={{ rotate: -40 }}
          />
          <motion.div
            className="absolute left-[7.4rem] top-[5rem] w-1 h-10 bg-yellow-600 origin-top"
            initial={{ rotate: 90 }}
            animate={{ rotate: 40 }}
          />
        </>
      )}

      {/* Piernas */}
      {wrongGuesses >= 5 && (
        <>
          <motion.div
            className="absolute left-[7.4rem] top-[8.5rem] w-1 h-10 bg-yellow-600 origin-top"
            initial={{ rotate: -90 }}
            animate={{ rotate: -30 }}
          />
          <motion.div
            className="absolute left-[7.4rem] top-[8.5rem] w-1 h-10 bg-yellow-600 origin-top"
            initial={{ rotate: 90 }}
            animate={{ rotate: 30 }}
          />
        </>
      )}

      {/* Muerte */}
      {wrongGuesses >= 7 && (
        <motion.div
          className="absolute left-[6.7rem] top-10 text-4xl"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          💀
        </motion.div>
      )}
    </div>
  );
};

/* ============================================================
   🎮 COMPONENTE PRINCIPAL
============================================================ */
export default function Hangman() {
  const { user, role, userProfile, authReady, loading } = useAuth();
  const { t } = useI18n();

  /* ---------- HOOKS (orden correcto) ---------- */
  const [word, setWord] = useState<string>("");
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState<number>(0);
  const [status, setStatus] = useState<GameStatus>("playing");

  const [loadingWord, setLoadingWord] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [blocked, setBlocked] = useState(false);
  const [checkingAttempt, setCheckingAttempt] = useState(true);

  /* ============================================================
     ⏳ Esperar a que cargue el idioma
  ============================================================ */
  if (!authReady || loading || !userProfile?.language) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center py-32 text-slate-500">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full" />
        <p className="mt-4">{t("gaming.games.hangman.loadingLanguage")}</p>
      </div>
    );
  }

  /* ============================================================
     🔍 Verificar intento diario
  ============================================================ */
  useEffect(() => {
    const check = async () => {
      if (!user) {
        setCheckingAttempt(false);
        return;
      }
      if (role === "admin" || role === "profesor") {
        setBlocked(false);
        setCheckingAttempt(false);
        return;
      }

      const played = await userPlayedToday(user.uid, GAME_ID);
      if (played) setBlocked(true);

      setCheckingAttempt(false);
    };

    void check();
  }, [user, role]);

  /* ============================================================
     📡 Obtener palabra IA
  ============================================================ */
  const fetchWord = async () => {
    try {
      setLoadingWord(true);
      setError("");
      setGuessedLetters([]);
      setWrongGuesses(0);
      setStatus("playing");

      const lang = userProfile.language.toLowerCase();
      const res = await fetch(`/api/games/hangman?lang=${lang}`);
      const data = await res.json();

      setWord(data.word.toLowerCase());
    } catch {
      setError(t("gaming.games.hangman.errorFetching"));
    } finally {
      setLoadingWord(false);
    }
  };

  useEffect(() => {
    if (!checkingAttempt && !blocked && userProfile?.language) {
      fetchWord();
    }
  }, [checkingAttempt, blocked, userProfile?.language]);

  /* ============================================================
     🧠 Win / Lose
  ============================================================ */
  useEffect(() => {
    if (!word) return;

    const win = word.split("").every((l) => guessedLetters.includes(l));
    const lose = wrongGuesses >= 7;

    if (win) setStatus("won");
    else if (lose) setStatus("lost");
  }, [guessedLetters, wrongGuesses, word]);

  /* ============================================================
     🅰 Manejar intento del usuario
  ============================================================ */
  const handleGuess = (letter: string) => {
    if (status !== "playing") return;
    if (guessedLetters.includes(letter)) return;
    if (blocked) return;

    if (word.includes(letter)) {
      setGuessedLetters((prev) => [...prev, letter]);
    } else {
      setWrongGuesses((prev) => prev + 1);
    }
  };

  /* ============================================================
     📝 Guardar intento al terminar
  ============================================================ */
  useEffect(() => {
    if (!user || role !== "alumno") return;
    if (status === "playing") return;

    updateUserGameAttempt(user.uid, GAME_ID);
    setBlocked(true);
  }, [status]);

  /* ============================================================
     ESTADOS UI
  ============================================================ */
  if (checkingAttempt) {
    return (
      <div className="w-full h-full flex items-center justify-center py-32">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (blocked && role === "alumno") {
    return (
      <div className="py-20 text-center text-slate-600">
        <h2 className="text-2xl font-bold mb-3">
          {t("gaming.games.hangman.alreadyPlayedTitle")}
        </h2>
        <p className="text-slate-500">
          {t("gaming.games.hangman.alreadyPlayedText")}
        </p>
      </div>
    );
  }

  if (loadingWord) {
    return (
      <div className="w-full h-full flex items-center justify-center py-32">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 flex flex-col items-center space-y-5">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchWord}
          className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold"
        >
          {t("gaming.games.hangman.retry")}
        </button>
      </div>
    );
  }

  /* ============================================================
     UI PRINCIPAL
  ============================================================ */
  const displayWord = word
    .split("")
    .map((l) => (guessedLetters.includes(l) ? l : "_"))
    .join(" ");

  return (
    <div className="flex flex-col items-center justify-center space-y-8 p-8 bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200 max-w-xl mx-auto">
      <HangmanDrawing wrongGuesses={wrongGuesses} />

      <motion.h2
        className="text-4xl font-bold tracking-widest font-mono"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {displayWord}
      </motion.h2>

      <p className="text-slate-500 text-sm mt-1">
        {t("gaming.games.hangman.errorsCounter", { count: wrongGuesses })}
      </p>

      {status === "won" && (
        <motion.p className="text-emerald-500 font-semibold text-xl">
          {t("gaming.games.hangman.won", { word })}
        </motion.p>
      )}

      {status === "lost" && (
        <motion.p className="text-red-500 font-semibold text-xl">
          {t("gaming.games.hangman.lost", { word })}
        </motion.p>
      )}

      {status === "playing" ? (
        <div className="grid grid-cols-9 gap-2 max-w-lg">
          {"abcdefghijklmnopqrstuvwxyz".split("").map((letter) => (
            <button
              key={letter}
              onClick={() => handleGuess(letter)}
              disabled={guessedLetters.includes(letter)}
              className={
                "px-3 py-2 rounded-lg text-lg font-semibold transition-all shadow-sm " +
                (guessedLetters.includes(letter)
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105")
              }
            >
              {letter.toUpperCase()}
            </button>
          ))}
        </div>
      ) : (
        <button
          onClick={fetchWord}
          className="mt-4 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
        >
          {t("gaming.games.hangman.playAgain")}
        </button>
      )}
    </div>
  );
}
