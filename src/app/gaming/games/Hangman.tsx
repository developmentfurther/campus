"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import {
  userPlayedToday,
  updateUserGameAttempt,
} from "@/lib/games/attempts";
import GameBlockedModal from "@/components/ui/GameBlockedModal";

type GameStatus = "playing" | "won" | "lost";
const GAME_ID = "hangman";

/* ============================================================
   🪢 HANGMAN ANIMADO
============================================================ */
const HangmanDrawing = ({ wrongGuesses }: { wrongGuesses: number }) => {
  return (
    <div className="relative w-64 h-72 mx-auto">
      {/* Base circular decorativa */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-3 bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300 rounded-full shadow-lg" />
      
      {/* Poste principal */}
      <motion.div
        className="absolute left-8 bottom-3 w-3 h-64 bg-gradient-to-b from-amber-800 to-amber-900 rounded-t-lg shadow-xl"
        initial={{ height: 0 }}
        animate={{ height: "16rem" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />

      {/* Barra superior */}
      <motion.div
        className="absolute left-8 top-8 w-36 h-3 bg-gradient-to-r from-amber-800 to-amber-900 rounded-r-lg shadow-xl"
        initial={{ width: 0 }}
        animate={{ width: "9rem" }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
      />

      {/* Soga */}
      <motion.div
        className="absolute left-[8.75rem] top-[2.75rem] w-2 h-12 bg-gradient-to-b from-gray-600 to-gray-700 rounded-full shadow-lg"
        initial={{ height: 0 }}
        animate={{ height: "3rem" }}
        transition={{ duration: 0.4, delay: 0.6 }}
      />

      {/* Cabeza */}
      {wrongGuesses >= 1 && (
        <motion.div
          className="absolute left-[7.5rem] top-[5.5rem] w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 border-4 border-amber-600 shadow-2xl"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          {/* Ojos */}
          <div className="absolute top-5 left-3 w-2 h-2 bg-slate-800 rounded-full" />
          <div className="absolute top-5 right-3 w-2 h-2 bg-slate-800 rounded-full" />
          {/* Boca */}
          {wrongGuesses < 7 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-6 h-2 border-b-2 border-slate-800 rounded-b-full" />
          )}
        </motion.div>
      )}

      {/* Cuerpo */}
      {wrongGuesses >= 2 && (
        <motion.div
          className="absolute left-[8.6rem] top-[9rem] w-3 h-20 bg-gradient-to-b from-amber-600 to-amber-700 rounded-full shadow-lg"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ type: "spring", stiffness: 150 }}
        />
      )}

      {/* Brazo izquierdo */}
      {wrongGuesses >= 3 && (
        <motion.div
          className="absolute left-[8.6rem] top-[10rem] w-3 h-12 bg-gradient-to-b from-amber-600 to-amber-700 rounded-full shadow-lg origin-top"
          initial={{ rotate: 0, x: 0 }}
          animate={{ rotate: -45, x: -8 }}
          transition={{ type: "spring", stiffness: 120 }}
        />
      )}

      {/* Brazo derecho */}
      {wrongGuesses >= 4 && (
        <motion.div
          className="absolute left-[8.6rem] top-[10rem] w-3 h-12 bg-gradient-to-b from-amber-600 to-amber-700 rounded-full shadow-lg origin-top"
          initial={{ rotate: 0, x: 0 }}
          animate={{ rotate: 45, x: 8 }}
          transition={{ type: "spring", stiffness: 120 }}
        />
      )}

      {/* Pierna izquierda */}
      {wrongGuesses >= 5 && (
        <motion.div
          className="absolute left-[8.6rem] top-[13.5rem] w-3 h-14 bg-gradient-to-b from-amber-600 to-amber-700 rounded-full shadow-lg origin-top"
          initial={{ rotate: 0, x: 0 }}
          animate={{ rotate: -35, x: -6 }}
          transition={{ type: "spring", stiffness: 120 }}
        />
      )}

      {/* Pierna derecha */}
      {wrongGuesses >= 6 && (
        <motion.div
          className="absolute left-[8.6rem] top-[13.5rem] w-3 h-14 bg-gradient-to-b from-amber-600 to-amber-700 rounded-full shadow-lg origin-top"
          initial={{ rotate: 0, x: 0 }}
          animate={{ rotate: 35, x: 6 }}
          transition={{ type: "spring", stiffness: 120 }}
        />
      )}

      {/* Muerte - efecto dramático */}
      {wrongGuesses >= 7 && (
        <motion.div
          className="absolute left-[7.2rem] top-[5rem]"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1.5, rotate: 0 }}
          transition={{ type: "spring", stiffness: 150 }}
        >
          <span className="text-6xl drop-shadow-2xl">💀</span>
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

  /* ---------- ESTADOS ---------- */
  const [word, setWord] = useState<string>("");
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState<number>(0);
  const [status, setStatus] = useState<GameStatus>("playing");

  const [loadingWord, setLoadingWord] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [blocked, setBlocked] = useState(false);
  const [checkingAttempt, setCheckingAttempt] = useState(true);

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

      try {
        const played = await userPlayedToday(user.uid, GAME_ID);
        setBlocked(played);
      } catch (err) {
        console.error("❌ Error checking attempt:", err);
      } finally {
        setCheckingAttempt(false);
      }
    };

    if (authReady && !loading && userProfile) {
      void check();
    }
  }, [user, role, authReady, loading, userProfile]);

  /* ============================================================
     📡 Obtener palabra IA
  ============================================================ */
  const fetchWord = async () => {
    if (!userProfile?.language) return;

    try {
      setLoadingWord(true);
      setError("");
      setGuessedLetters([]);
      setWrongGuesses(0);
      setStatus("playing");

      const lang = userProfile.language.toLowerCase();
      const res = await fetch(`/api/games/hangman?lang=${lang}`);
      const data = await res.json();

      if (data.word) {
        setWord(data.word.toLowerCase());
      } else {
        throw new Error("No word received");
      }
    } catch (err) {
      console.error("❌ Error fetching word:", err);
      setError(t("gaming.games.hangman.errorFetching") || "Error al cargar palabra");
    } finally {
      setLoadingWord(false);
    }
  };

  useEffect(() => {
    if (!checkingAttempt && !blocked && userProfile?.language) {
      void fetchWord();
    }
  }, [checkingAttempt, blocked, userProfile?.language]);

  /* ============================================================
     🧠 Win / Lose Detection
  ============================================================ */
  useEffect(() => {
    if (!word || status !== "playing") return;

    const win = word.split("").every((l) => guessedLetters.includes(l));
    const lose = wrongGuesses >= 7;

    if (win) {
      setStatus("won");
    } else if (lose) {
      setStatus("lost");
    }
  }, [guessedLetters, wrongGuesses, word, status]);

  /* ============================================================
     📝 Guardar intento al terminar (CRÍTICO)
  ============================================================ */
  useEffect(() => {
    // Solo guardar si es alumno y el juego terminó
    if (!user || role !== "alumno") return;
    if (status === "playing") return;
    if (blocked) return; // Ya fue guardado

    console.log("🎮 Juego terminado, guardando intento...", {
      uid: user.uid,
      game: GAME_ID,
      status,
    });

    // Guardar inmediatamente cuando termina el juego
    const saveAttempt = async () => {
      try {
        await updateUserGameAttempt(user.uid, GAME_ID);
        console.log("✅ Intento guardado exitosamente");
        
        // Esperar 2 segundos antes de bloquear para mostrar el resultado
        setTimeout(() => {
          setBlocked(true);
        }, 1000);
      } catch (err) {
        console.error("❌ Error guardando intento:", err);
      }
    };

    void saveAttempt();
  }, [status, user, role, blocked]);

  /* ============================================================
     🅰 Manejar intento del usuario
  ============================================================ */
  const handleGuess = (letter: string) => {
    if (status !== "playing") return;
    if (guessedLetters.includes(letter)) return;
    if (blocked) return;

    const newGuessed = [...guessedLetters, letter];
    setGuessedLetters(newGuessed);

    if (!word.includes(letter)) {
      setWrongGuesses((prev) => prev + 1);
    }
  };

  /* ============================================================
     RENDERS CONDICIONALES
  ============================================================ */
  // Loading inicial
  if (!authReady || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-8 border-purple-200" />
            <div className="absolute inset-0 rounded-full border-8 border-t-purple-600 animate-spin" />
          </div>
          <p className="text-slate-600 text-lg font-semibold">Cargando...</p>
        </div>
      </div>
    );
  }

  // Sin perfil o idioma
  if (!userProfile?.language) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-8 border-purple-200" />
            <div className="absolute inset-0 rounded-full border-8 border-t-purple-600 animate-spin" />
          </div>
          <p className="text-slate-600 text-lg font-semibold">
            {t("gaming.games.hangman.loadingLanguage") || "Cargando idioma..."}
          </p>
        </div>
      </div>
    );
  }

  // Verificando intento
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
      <GameBlockedModal
      emoji="⏳"
      title={t("gaming.games.idioms.blockedTitle")}
      message={t("gaming.games.idioms.blockedMessage")}
      nextAvailableLabel={t("gaming.games.shared.nextAvailable")}
      hoursLabel={t("gaming.games.shared.hours")}
      minutesLabel={t("gaming.games.shared.minutes")}
    />
    );
  }

  // Cargando palabra
  if (loadingWord) {
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

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md"
        >
          <div className="text-7xl mb-6">❌</div>
          <p className="text-red-600 text-xl mb-6">{error}</p>
          <motion.button
            onClick={fetchWord}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg shadow-xl"
          >
            {t("gaming.games.hangman.retry") || "Reintentar"}
          </motion.button>
        </motion.div>
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
