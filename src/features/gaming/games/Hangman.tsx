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
import LoaderGame from "@/components/ui/LoaderGame";
import GameBackground from "@/components/ui/GameBackground";
import { FiRefreshCw, FiZap, FiAlertCircle } from "react-icons/fi";

type GameStatus = "playing" | "won" | "lost";
const GAME_ID = "hangman";

/* ============================================================
   🪢 HANGMAN ANIMADO
============================================================ */
const HangmanDrawing = ({ wrongGuesses }: { wrongGuesses: number }) => {
  return (
    <div className="relative w-64 h-72 mx-auto">
      {/* Base circular decorativa */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-3 bg-gradient-to-r from-[#0C212D]/30 via-[#112C3E]/40 to-[#0C212D]/30 rounded-full shadow-lg" />
      
      {/* Poste principal */}
      <motion.div
        className="absolute left-8 bottom-3 w-3 h-64 bg-gradient-to-b from-[#112C3E] to-[#0C212D] rounded-t-lg shadow-xl"
        initial={{ height: 0 }}
        animate={{ height: "16rem" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />

      {/* Barra superior */}
      <motion.div
        className="absolute left-8 top-8 w-36 h-3 bg-gradient-to-r from-[#112C3E] to-[#0C212D] rounded-r-lg shadow-xl"
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
          className="absolute left-[7.5rem] top-[5.5rem] w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 border-4 border-[#EE7203] shadow-2xl"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          {/* Ojos */}
          <div className="absolute top-5 left-3 w-2 h-2 bg-[#0C212D] rounded-full" />
          <div className="absolute top-5 right-3 w-2 h-2 bg-[#0C212D] rounded-full" />
          {/* Boca */}
          {wrongGuesses < 7 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-6 h-2 border-b-2 border-[#0C212D] rounded-b-full" />
          )}
        </motion.div>
      )}

      {/* Cuerpo */}
      {wrongGuesses >= 2 && (
        <motion.div
          className="absolute left-[8.6rem] top-[9rem] w-3 h-20 bg-gradient-to-b from-[#EE7203] to-[#FF3816] rounded-full shadow-lg"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ type: "spring", stiffness: 150 }}
        />
      )}

      {/* Brazo izquierdo */}
      {wrongGuesses >= 3 && (
        <motion.div
          className="absolute left-[8.6rem] top-[10rem] w-3 h-12 bg-gradient-to-b from-[#EE7203] to-[#FF3816] rounded-full shadow-lg origin-top"
          initial={{ rotate: 0, x: 0 }}
          animate={{ rotate: -45, x: -8 }}
          transition={{ type: "spring", stiffness: 120 }}
        />
      )}

      {/* Brazo derecho */}
      {wrongGuesses >= 4 && (
        <motion.div
          className="absolute left-[8.6rem] top-[10rem] w-3 h-12 bg-gradient-to-b from-[#EE7203] to-[#FF3816] rounded-full shadow-lg origin-top"
          initial={{ rotate: 0, x: 0 }}
          animate={{ rotate: 45, x: 8 }}
          transition={{ type: "spring", stiffness: 120 }}
        />
      )}

      {/* Pierna izquierda */}
      {wrongGuesses >= 5 && (
        <motion.div
          className="absolute left-[8.6rem] top-[13.5rem] w-3 h-14 bg-gradient-to-b from-[#EE7203] to-[#FF3816] rounded-full shadow-lg origin-top"
          initial={{ rotate: 0, x: 0 }}
          animate={{ rotate: -35, x: -6 }}
          transition={{ type: "spring", stiffness: 120 }}
        />
      )}

      {/* Pierna derecha */}
      {wrongGuesses >= 6 && (
        <motion.div
          className="absolute left-[8.6rem] top-[13.5rem] w-3 h-14 bg-gradient-to-b from-[#EE7203] to-[#FF3816] rounded-full shadow-lg origin-top"
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

  const [showLoader, setShowLoader] = useState(true);

  /* ============================================================
     🔍 Verificar intento diario
  ============================================================ */
  useEffect(() => {
    setBlocked(false);
    setCheckingAttempt(false);
  }, [user, role, authReady, loading, userProfile]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

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
     📝 Guardar intento al terminar
  ============================================================ */
  useEffect(() => {
    // Lógica comentada original
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
  if (checkingAttempt || !userProfile?.language || showLoader) {
    return <LoaderGame />;
  }

  // Error
  if (error) {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-screen px-4 py-12 overflow-hidden bg-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#EE7203]/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#FF3816]/10 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-12 text-center max-w-md border border-gray-200"
        >
          <div className="text-7xl mb-6">❌</div>
          <p className="text-red-600 text-xl mb-6 font-bold">{error}</p>
          <motion.button
            onClick={fetchWord}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white font-bold text-lg shadow-xl"
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
    <div className="relative flex flex-col items-center justify-center min-h-screen space-y-8 text-center px-4 py-12 overflow-hidden bg-white">
      
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#EE7203]/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-[#FF3816]/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-20 max-w-3xl mx-auto w-full"
      >

        {/* Header */}
        <div className="mb-10">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-[#EE7203] to-[#FF3816] px-6 py-2 rounded-full mb-6 shadow-lg"
          >
            <FiZap className="text-white" size={20} />
            <span className="text-white font-bold text-sm uppercase tracking-wider">
              {t("gaming.games.hangman.badge") || "Hangman Challenge"}
            </span>
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-black text-[#0C212D] mb-3">
            {t("gaming.games.hangman.title") || "Ahorcado"}
          </h1>

          <p className="text-[#0C212D]/70 text-base md:text-lg font-medium">
            {t("gaming.games.hangman.description") || "Adivina la palabra antes de que sea demasiado tarde"}
          </p>
        </div>

        {/* Card principal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-10 border border-gray-200 shadow-2xl mb-8"
        >
          
          {/* Dibujo del ahorcado */}
          <div className="mb-8">
            <HangmanDrawing wrongGuesses={wrongGuesses} />
          </div>

          {/* Palabra a adivinar */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="bg-gradient-to-r from-[#0C212D] to-[#112C3E] rounded-2xl p-6 md:p-8 border-2 border-[#EE7203]/30 shadow-xl">
              <h2 className="text-3xl md:text-4xl font-black tracking-widest font-mono text-white">
                {displayWord}
              </h2>
            </div>
          </motion.div>

          {/* Contador de errores */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <FiAlertCircle className="text-[#FF3816]" size={20} />
            <p className="text-[#0C212D]/70 text-sm font-bold">
              {t("gaming.games.hangman.errorsCounter", { count: wrongGuesses })}
            </p>
          </div>

          {/* Estado: Ganado */}
          {status === "won" && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-6 mb-6"
            >
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-green-500 px-8 py-4 rounded-2xl shadow-2xl">
                <span className="text-4xl">🎉</span>
                <span className="text-white text-xl font-black">¡GANASTE!</span>
              </div>

              <p className="text-emerald-600 text-xl md:text-2xl font-bold">
                {t("gaming.games.hangman.won", { word: word.toUpperCase() })}
              </p>
            </motion.div>
          )}

          {/* Estado: Perdido */}
          {status === "lost" && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-6 mb-6"
            >
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-red-500 to-red-600 px-8 py-4 rounded-2xl shadow-2xl">
                <span className="text-4xl">💀</span>
                <span className="text-white text-xl font-black">¡PERDISTE!</span>
              </div>

              <p className="text-red-600 text-xl md:text-2xl font-bold">
                {t("gaming.games.hangman.lost", { word: word.toUpperCase() })}
              </p>
            </motion.div>
          )}

          {/* Teclado de letras */}
          {status === "playing" ? (
            <div className="grid grid-cols-7 md:grid-cols-9 gap-2 mb-4">
              {"abcdefghijklmnopqrstuvwxyz".split("").map((letter) => {
                const isGuessed = guessedLetters.includes(letter);
                const isCorrect = isGuessed && word.includes(letter);
                const isWrong = isGuessed && !word.includes(letter);

                return (
                  <motion.button
                    key={letter}
                    onClick={() => handleGuess(letter)}
                    disabled={isGuessed}
                    whileHover={!isGuessed ? { scale: 1.1 } : {}}
                    whileTap={!isGuessed ? { scale: 0.95 } : {}}
                    className={`
                      px-2 py-3 md:px-3 md:py-4 rounded-xl text-base md:text-lg font-black transition-all shadow-md uppercase
                      ${isCorrect ? "bg-gradient-to-br from-emerald-500 to-green-500 text-white border-2 border-emerald-400" : ""}
                      ${isWrong ? "bg-gray-400 text-gray-200 border-2 border-gray-500 cursor-not-allowed" : ""}
                      ${!isGuessed ? "bg-gradient-to-br from-[#EE7203] to-[#FF3816] text-white hover:shadow-lg hover:shadow-[#EE7203]/30 border-2 border-[#EE7203]" : ""}
                    `}
                  >
                    {letter}
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <button
              onClick={fetchWord}
              disabled={loadingWord}
              className="w-full group px-8 py-4 bg-gradient-to-r from-[#EE7203] to-[#FF3816] rounded-2xl font-bold text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FiRefreshCw className="group-hover:rotate-180 transition-transform duration-500" size={20} />
              {t("gaming.games.hangman.playAgain") || "Jugar de nuevo"}
            </button>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center gap-4 md:gap-6"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-xl px-6 py-3 border border-gray-200 shadow-lg">
            <p className="text-[#0C212D]/60 text-xs font-bold uppercase tracking-wider mb-1">
              {t("gaming.games.hangman.errorsCounter", { count: wrongGuesses })}
            </p>
            <p className="text-[#FF3816] text-2xl font-black">{wrongGuesses}/7</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl px-6 py-3 border border-gray-200 shadow-lg">
            <p className="text-[#0C212D]/60 text-xs font-bold uppercase tracking-wider mb-1">
              {t("gaming.games.hangman.stats.attempts") || "Intentadas"}
            </p>
            <p className="text-[#0C212D] text-2xl font-black">{guessedLetters.length}</p>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}