"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  userPlayedToday,
  updateUserGameAttempt,
} from "@/lib/games/attempts";
import { useI18n } from "@/contexts/I18nContext";
import { motion, AnimatePresence } from "framer-motion";
import GameBlockedModal from "@/components/ui/GameBlockedModal";
import LoaderGame from "@/components/ui/LoaderGame";
import GameBackground from "@/components/ui/GameBackground";
import { FiRefreshCw, FiZap, FiTrendingUp, FiTarget } from "react-icons/fi";

type LetterState = "correct" | "present" | "absent" | "";

interface GuessResult {
  letter: string;
  state: LetterState;
}

const GAME_ID = "wordle";

const WordleTile = ({ letter, state, delay }: { letter: string; state: LetterState; delay: number }) => {
  const baseClasses = "w-full h-full flex items-center justify-center text-2xl md:text-3xl font-black rounded-xl transition-all duration-300 border-2";
  
  let stateClasses = "bg-white border-gray-300 text-[#0C212D]";
  
  if (state === "correct") {
    stateClasses = "bg-gradient-to-br from-emerald-500 to-green-500 border-emerald-400 text-white shadow-lg";
  } else if (state === "present") {
    stateClasses = "bg-gradient-to-br from-[#EE7203] to-[#FF3816] border-[#EE7203] text-white shadow-lg";
  } else if (state === "absent") {
    stateClasses = "bg-gray-400 border-gray-500 text-white";
  }

  return (
    <motion.div
      initial={{ rotateX: 0, scale: 1 }}
      animate={{ rotateX: state ? 360 : 0, scale: state ? [1, 1.1, 1] : 1 }}
      transition={{ duration: 0.6, delay }}
      className={`${baseClasses} ${stateClasses}`}
    >
      {letter.toUpperCase()}
    </motion.div>
  );
};

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
  const [showLoader, setShowLoader] = useState(true);

  const WORD_LENGTH = word.length;

  useEffect(() => {
    setBlocked(false);
    setCheckingAttempt(false);
  }, [user, role]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

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

  useEffect(() => {
    // const mark = async () => {
    //   if (!user) return;
    //   if (role !== "alumno") return;
    //   if (status === "playing") return;

    //   await updateUserGameAttempt(user.uid, GAME_ID);
    //   setBlocked(true);
    // };

    // void mark();
  }, [status, user, role]);

  if (checkingAttempt || loadingWord || showLoader) {
    return <LoaderGame />;
  }

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
        className="relative z-20 max-w-2xl mx-auto w-full"
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
              Wordle Challenge
            </span>
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-black text-[#0C212D] mb-3">
            {t("gaming.games.wordle.title")}
          </h1>

          <p className="text-[#0C212D]/70 text-base md:text-lg font-medium">
            Adivina la palabra en {MAX_TRIES} intentos
          </p>
        </div>

        {/* Card principal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-10 border border-gray-200 shadow-2xl mb-8"
        >
          
          {/* Hint */}
          <AnimatePresence>
            {hint && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 bg-gradient-to-r from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-blue-500/30"
              >
                <p className="text-blue-700 font-bold text-sm flex items-center justify-center gap-2">
                  <FiTarget size={16} />
                  {hint}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* GRID de intentos */}
          <div className="space-y-2 mb-6">
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
                      <div key={col} className="aspect-square">
                        <WordleTile
                          letter={cell?.letter || ""}
                          state={cell?.state ?? ""}
                          delay={delay}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Estado: Jugando */}
          {status === "playing" && (
            <>
              <div className="relative mb-4">
                <input
                  maxLength={WORD_LENGTH}
                  value={currentInput}
                  onChange={(e) =>
                    setCurrentInput(
                      e.target.value.replace(/[^a-zA-Záéíóúüñçàèìòùâêîôû]/gi, "")
                    )
                  }
                  onKeyPress={(e) => e.key === "Enter" && submitGuess()}
                  placeholder="Escribe tu palabra..."
                  className="w-full px-6 py-4 md:py-5 rounded-2xl text-lg md:text-xl font-bold text-[#0C212D] bg-white border-3 border-gray-300 focus:border-[#EE7203] focus:shadow-lg focus:shadow-[#EE7203]/30 transition-all outline-none text-center uppercase tracking-wider"
                />
              </div>

              <button
                onClick={submitGuess}
                className="w-full px-8 py-4 md:py-5 bg-gradient-to-r from-[#EE7203] to-[#FF3816] rounded-2xl font-black text-lg md:text-xl text-white shadow-xl hover:shadow-2xl hover:shadow-[#EE7203]/40 hover:scale-105 transition-all active:scale-95 mb-3"
              >
                {t("gaming.games.wordle.submit")}
              </button>

              <button
                onClick={fetchWord}
                disabled={loadingWord}
                className="w-full px-6 py-3 bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-[#EE7203] rounded-xl text-[#0C212D] font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              >
                <FiRefreshCw className="group-hover:rotate-180 transition-transform duration-500" size={18} />
                {t("gaming.games.wordle.new")}
              </button>
            </>
          )}

          {/* Estado: Ganado */}
          {status === "won" && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-6"
            >
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-green-500 px-8 py-4 rounded-2xl shadow-2xl">
                <span className="text-4xl">🎉</span>
                <span className="text-white text-xl font-black">¡CORRECTO!</span>
              </div>

              <p className="text-emerald-600 text-xl md:text-2xl font-bold">
                {t("gaming.games.wordle.won", { word: word.toUpperCase() })}
              </p>

              <button
                onClick={fetchWord}
                disabled={loadingWord}
                className="group px-8 py-4 bg-gradient-to-r from-[#EE7203] to-[#FF3816] rounded-2xl font-bold text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
              >
                <FiRefreshCw className="group-hover:rotate-180 transition-transform duration-500" size={20} />
                {t("gaming.games.wordle.new")}
              </button>
            </motion.div>
          )}

          {/* Estado: Perdido */}
          {status === "lost" && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-6"
            >
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-red-500 to-red-600 px-8 py-4 rounded-2xl shadow-2xl">
                <span className="text-4xl">😔</span>
                <span className="text-white text-xl font-black">¡GAME OVER!</span>
              </div>

              <p className="text-red-600 text-xl md:text-2xl font-bold">
                {t("gaming.games.wordle.lost", { word: word.toUpperCase() })}
              </p>

              <button
                onClick={fetchWord}
                disabled={loadingWord}
                className="group px-8 py-4 bg-gradient-to-r from-[#EE7203] to-[#FF3816] rounded-2xl font-bold text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
              >
                <FiRefreshCw className="group-hover:rotate-180 transition-transform duration-500" size={20} />
                {t("gaming.games.wordle.new")}
              </button>
            </motion.div>
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
              Intentos
            </p>
            <p className="text-[#0C212D] text-2xl font-black">{guesses.length}/{MAX_TRIES}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl px-6 py-3 border border-gray-200 shadow-lg">
            <p className="text-[#0C212D]/60 text-xs font-bold uppercase tracking-wider mb-1">
              Longitud
            </p>
            <p className="text-[#EE7203] text-2xl font-black">{WORD_LENGTH}</p>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}