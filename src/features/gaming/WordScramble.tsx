"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import {
  userPlayedToday,
  updateUserGameAttempt,
} from "@/lib/games/attempts";
import { motion, AnimatePresence } from "framer-motion";
import GameBlockedModal from "@/components/ui/GameBlockedModal";
import LoaderGame from "@/components/ui/LoaderGame";
import GameBackground from "@/components/ui/GameBackground";
import { FiRefreshCw, FiCheck, FiX, FiHelpCircle, FiZap } from "react-icons/fi";

type GameStatus = "playing" | "won";

function shuffle(word: string): string {
  return word
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

const GAME_ID = "scramble";

export default function WordScramble() {
  const { t } = useI18n();
  const { user, role, userProfile } = useAuth();

  const [word, setWord] = useState("");
  const [scrambled, setScrambled] = useState("");
  const [guess, setGuess] = useState("");

  const [status, setStatus] = useState<GameStatus>("playing");
  const [isWrong, setIsWrong] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);

  const [loadingWord, setLoadingWord] = useState(true);
  const [error, setError] = useState("");

  const [blocked, setBlocked] = useState(false);
  const [checkingAttempt, setCheckingAttempt] = useState(true);
  const [showLoader, setShowLoader] = useState(true);

  // === verificar intentos ===
  useEffect(() => {
    // const check = async () => {
    //   if (!user) return;

    //   if (role === "admin" || role === "profesor") {
    //     setCheckingAttempt(false);
    //     return;
    //   }

    //   const played = await userPlayedToday(user.uid, GAME_ID);
    //   if (played) setBlocked(true);

    //   setCheckingAttempt(false);
    // };

    // void check();

    setBlocked(false);
    setCheckingAttempt(false);
  }, [user, role]);

  // === cargar palabra ===
  useEffect(() => {
    if (!checkingAttempt && !blocked) {
      fetchWord();
    }
  }, [checkingAttempt, blocked]);

  const fetchWord = async () => {
    try {
      setLoadingWord(true);
      setError("");
      setGuess("");
      setIsWrong(false);
      setStatus("playing");
      setWrongCount(0);

      const lang = userProfile?.learningLanguage || "en";
      const res = await fetch(`/api/games/scramble?lang=${lang}`);
      const data = await res.json();

      const w = data.word.toLowerCase();
      setWord(w);
      setScrambled(shuffle(w));
    } catch (e) {
      console.error(e);
      setError(t("gaming.games.wordScramble.errorLoading"));
    } finally {
      setLoadingWord(false);
    }
  };

  const checkGuess = () => {
    const cleaned = guess.toLowerCase().trim();

    if (cleaned === word) {
      setStatus("won");
      setIsWrong(false);
    } else {
      setIsWrong(true);
      setWrongCount((c) => c + 1);
    }
  };

  // === guardar intento ===
  useEffect(() => {
    // const save = async () => {
    //   if (!user) return;
    //   if (role !== "alumno") return;
    //   if (status !== "won") return;

    //   await updateUserGameAttempt(user.uid, GAME_ID);
    //   setBlocked(true);
    // };

    // void save();
  }, [status, user, role]);

  useEffect(() => {
    // Tiempo mínimo de animación del loader
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 1800); // 1.8 segundos

    return () => clearTimeout(timer);
  }, []);

  // === hints/IU ===

  const hints: string[] = [];

  if (wrongCount >= 1)
    hints.push(
      t("gaming.games.wordScramble.hints.length", { count: word.length })
    );

  if (wrongCount >= 2)
    hints.push(
      t("gaming.games.wordScramble.hints.firstLetter", {
        letter: word[0].toUpperCase(),
      })
    );

  if (wrongCount >= 3)
    hints.push(
      t("gaming.games.wordScramble.hints.lastLetter", {
        letter: word[word.length - 1].toUpperCase(),
      })
    );

  if (wrongCount >= 4) {
    const pattern = word
      .split("")
      .map((ch, i) => (guess[i] && guess[i] === ch ? ch : "_"))
      .join(" ");

    hints.push(
      t("gaming.games.wordScramble.hints.correctPositions", { pattern })
    );
  }

  // === UI ===

  if (checkingAttempt || loadingWord || showLoader) {
    return <LoaderGame />;
  }

 return (
  <div className="relative flex flex-col items-center justify-center min-h-screen space-y-8 text-center px-4 py-12 overflow-hidden">
    
    {/* Background full-screen */}
    <div className="absolute inset-0 -z-10">
      <GameBackground />
    </div>

    {/* Elementos decorativos extra */}
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
            {t("gaming.games.wordScramble.badge")}
          </span>
        </motion.div>

        <h1 className="text-4xl md:text-5xl font-black text-[#0C212D] mb-3">
          {t("gaming.games.wordScramble.title")}
        </h1>

        <p className="text-[#0C212D]/70 text-base md:text-lg font-medium">
          {t("gaming.games.wordScramble.subtitle")}
        </p>
      </div>

      {/* Card principal */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-10 border border-white/20 shadow-2xl mb-8"
      >
        <div className="bg-gradient-to-r from-[#0C212D] to-[#112C3E] rounded-2xl p-6 md:p-8 border-2 border-[#EE7203]/30 shadow-xl mb-8">
          <div className="flex justify-center items-center gap-2 md:gap-3 flex-wrap">
            {scrambled.split("").map((letter, idx) => (
              <motion.div
                key={idx}
                initial={{ y: -20, opacity: 0, rotate: -10 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="w-14 h-16 md:w-16 md:h-20 bg-gradient-to-br from-white to-gray-100 rounded-xl flex items-center justify-center text-2xl md:text-3xl font-black text-[#0C212D] shadow-lg border-2 border-white/50 hover:scale-110 transition-transform"
              >
                {letter.toUpperCase()}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Estado: Ganado */}
        {status === "won" ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-6"
          >
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-green-500 px-8 py-4 rounded-2xl shadow-2xl">
              <FiCheck size={28} className="text-white" />
              <span className="text-white text-xl font-black">{t("gaming.games.wordScramble.correct")}!</span>
            </div>

            <p className="text-emerald-400 text-xl md:text-2xl font-bold">
              {t("gaming.games.wordScramble.won", { word: word.toUpperCase() })}
            </p>

            <button
              onClick={fetchWord}
              disabled={loadingWord}
              className="group px-8 py-4 bg-gradient-to-r from-[#EE7203] to-[#FF3816] rounded-2xl font-bold text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
            >
              <FiRefreshCw className="group-hover:rotate-180 transition-transform duration-500" size={20} />
              {t("gaming.games.wordScramble.newWord")}
            </button>
          </motion.div>
        ) : (
          <>
            {/* Input */}
            <div className="relative mb-6">
              <input
                value={guess}
                onChange={(e) => {
                  setGuess(e.target.value);
                  setIsWrong(false);
                }}
                onKeyPress={(e) => e.key === "Enter" && checkGuess()}
                placeholder={t("gaming.games.wordScramble.inputPlaceholder")}
                className={`w-full px-6 py-4 md:py-5 rounded-2xl text-lg md:text-xl font-bold text-[#0C212D] bg-white border-3 transition-all outline-none ${
                  isWrong
                    ? "border-red-500 shadow-lg shadow-red-500/30"
                    : "border-white/30 focus:border-[#EE7203] focus:shadow-lg focus:shadow-[#EE7203]/30"
                }`}
              />

              {/* Mensaje de error */}
              <AnimatePresence>
                {isWrong && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute -bottom-10 left-0 right-0 flex items-center justify-center gap-2 text-red-500 font-semibold text-sm"
                  >
                    <FiX size={18} />
                    <span>{t("gaming.games.wordScramble.incorrect")}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Botón verificar */}
            <button
              onClick={checkGuess}
              className="w-full px-8 py-4 md:py-5 bg-gradient-to-r from-[#EE7203] to-[#FF3816] rounded-2xl font-black text-lg md:text-xl text-white shadow-xl hover:shadow-2xl hover:shadow-[#EE7203]/40 hover:scale-105 transition-all active:scale-95 mb-4"
            >
              {t("gaming.games.wordScramble.verify")}
            </button>

            {/* Nueva palabra */}
            <button
              onClick={fetchWord}
              disabled={loadingWord}
              className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl text-[#0C212D] font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              <FiRefreshCw className="group-hover:rotate-180 transition-transform duration-500" size={18} />
              {t("gaming.games.wordScramble.newWord")}
            </button>
          </>
        )}
      </motion.div>

      {/* Pistas */}
      {hints.length > 0 && status !== "won" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl p-6 border border-amber-500/30 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
              <FiHelpCircle className="text-white" size={20} />
            </div>
            <h3 className="text-[#0C212D] font-black text-lg">
              {t("gaming.games.wordScramble.hintsTitle")}
            </h3>
          </div>

          <div className="space-y-2">
            {hints.map((h, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20"
              >
                <p className="text-[#0C212D]/80 font-medium flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 rounded-full bg-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-600">
                    {i + 1}
                  </span>
                  {h}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 flex justify-center gap-4 md:gap-6"
      >
        <div className="bg-white/5 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/10">
          <p className="text-[#0C212D]/60 text-xs font-bold uppercase tracking-wider mb-1">
            {t("gaming.games.wordScramble.stats.attempts")}
          </p>
          <p className="text-[#0C212D] text-2xl font-black">{wrongCount}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/10">
          <p className="text-[#0C212D]/60 text-xs font-bold uppercase tracking-wider mb-1">
            {t("gaming.games.wordScramble.stats.hints")}
          </p>
          <p className="text-amber-500 text-2xl font-black">{hints.length}</p>
        </div>
      </motion.div>

    </motion.div>
  </div>
);

}