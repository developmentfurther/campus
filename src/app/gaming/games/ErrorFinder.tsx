"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import LoaderGame from "@/components/ui/LoaderGame";
import GameBackground from "@/components/ui/GameBackground";
import { FiZap, FiTarget, FiEdit3, FiCheckCircle, FiXCircle } from "react-icons/fi";

type GameStatus = "selecting" | "correcting" | "won" | "lost";

interface ErrorData {
  sentence: string;
  wrongWord: string;
  correctWord: string;
}

const GAME_ID = "error_finder";

export default function ErrorFinder() {
  const { userProfile, user, role } = useAuth();
  const { t } = useI18n();

  const lang = userProfile?.learningLanguage?.toLowerCase() || "en";

  const [data, setData] = useState<ErrorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<GameStatus>("selecting");
  const [blocked, setBlocked] = useState(false);
  const [checkingAttempt, setCheckingAttempt] = useState(true);
  const [errorWordSelected, setErrorWordSelected] = useState<string | null>(null);
  const [correctionInput, setCorrectionInput] = useState("");
  const [showLoader, setShowLoader] = useState(true);
  const [attempts, setAttempts] = useState(0);

  // ======================================================
  // FETCH EJERCICIO
  // ======================================================
  const fetchSentence = async () => {
    try {
      setLoading(true);
      setErrorWordSelected(null);
      setCorrectionInput("");
      setStatus("selecting");
      setAttempts(0);

      const res = await fetch(`/api/games/error-finder?lang=${lang}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // CHECK INTENTOS
  // ======================================================
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

  // ======================================================
  // AUTO-CARGAR EJERCICIO
  // ======================================================
  useEffect(() => {
    if (!checkingAttempt && !blocked) {
      void fetchSentence();
    }
  }, [checkingAttempt, blocked]);

  // ======================================================
  // SELECCIÓN DE PALABRA
  // ======================================================
  const handleWordClick = (word: string) => {
    if (status !== "selecting" || blocked) return;

    setErrorWordSelected(word);
    setAttempts(attempts + 1);

    if (word === data?.wrongWord) {
      setStatus("correcting");
    } else {
      // No perdemos inmediatamente, permitimos reintentar
      setTimeout(() => setErrorWordSelected(null), 800);
    }
  };

  // ======================================================
  // VERIFICAR CORRECCIÓN
  // ======================================================
  const checkCorrection = () => {
    if (!data) return;

    const userInput = correctionInput.toLowerCase().trim();
    const correctAnswer = data.correctWord.toLowerCase().trim();

    if (userInput === correctAnswer) {
      setStatus("won");
    } else {
      setAttempts(attempts + 1);
      // Shake animation en el input
      const input = document.getElementById("correction-input");
      if (input) {
        input.classList.add("shake");
        setTimeout(() => input.classList.remove("shake"), 500);
      }
    }
  };

  // ======================================================
  // UI
  // ======================================================
  if (checkingAttempt || !data || showLoader) {
    return <LoaderGame />;
  }

  const words = data.sentence.split(" ");

  return (
    <div className="min-h-screen relative overflow-hidden ">
      
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          {/* Badge */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-[#EE7203] to-[#FF3816] px-6 py-2 rounded-full mb-6 shadow-lg"
          >
            <FiZap className="text-white" size={20} />
            <span className="text-white font-bold text-sm uppercase tracking-wider">
              Error Finder
            </span>
          </motion.div>
          
        
          
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-[#EE7203] via-[#FF3816] to-[#EE7203] bg-clip-text text-transparent">
            {t("gaming.games.errorFinder.title")}
          </h1>
          
          <p className="text-slate-800 text-lg max-w-2xl mx-auto">
            {t("gaming.games.errorFinder.instruction")}
          </p>

          {/* Progress indicator */}
          {status === "selecting" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-sm text-slate-400"
            >
              {attempts > 0 && `Intentos: ${attempts}`}
            </motion.div>
          )}
        </motion.div>

        {/* Main Game Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-[#EE7203]/20 overflow-hidden"
        >
          {/* Status Bar */}
          <div className="bg-gradient-to-r from-[#0C212D] to-[#112C3E] px-8 py-4 border-b border-[#EE7203]/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  status === "selecting" ? "bg-[#EE7203] animate-pulse" :
                  status === "correcting" ? "bg-[#FF3816] animate-pulse" :
                  status === "won" ? "bg-green-500" :
                  "bg-[#FF3816]"
                }`} />
                <span className="text-sm font-medium text-white flex items-center gap-2">
                  {status === "selecting" && (
                    <>
                      <FiTarget size={16} />
                      Encuentra el error
                    </>
                  )}
                  {status === "correcting" && (
                    <>
                      <FiEdit3 size={16} />
                      Escribe la corrección
                    </>
                  )}
                  {status === "won" && (
                    <>
                      <FiCheckCircle size={16} />
                      ¡Correcto!
                    </>
                  )}
                  {status === "lost" && (
                    <>
                      <FiXCircle size={16} />
                      Inténtalo de nuevo
                    </>
                  )}
                </span>
              </div>
              
              <div className="text-xs text-[#EE7203] font-mono font-bold">
                {lang.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Sentence Display */}
          <div className="p-10 bg-gradient-to-br from-slate-50 to-white">
            <div className="flex flex-wrap justify-center gap-3 text-2xl">
              {words.map((word, i) => {
                const cleanWord = word.replace(/[.,!?;:]$/, "");
                const punctuation = word.match(/[.,!?;:]$/)?.[0] || "";
                const isSelected = cleanWord === errorWordSelected;
                const isWrong = isSelected && cleanWord !== data.wrongWord;
                const isCorrect = status === "won" && cleanWord === data.wrongWord;
                const isCorrecting = status === "correcting" && cleanWord === data.wrongWord;

                return (
                  <motion.button
                    key={i}
                    onClick={() => handleWordClick(cleanWord)}
                    disabled={status !== "selecting"}
                    className={`
                      relative px-5 py-3 rounded-2xl font-semibold transition-all duration-300
                      ${status === "selecting" ? "cursor-pointer hover:scale-110 hover:shadow-lg" : "cursor-default"}
                      ${isSelected && !isWrong ? "bg-gradient-to-br from-[#EE7203] to-[#FF3816] text-white shadow-lg scale-105" :
                        isWrong ? "bg-gradient-to-br from-[#FF3816] to-red-600 text-white" :
                        isCorrect ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg" :
                        isCorrecting ? "bg-gradient-to-br from-[#EE7203] to-[#FF3816] text-white shadow-lg" :
                        "bg-[#0C212D]/10 text-[#0C212D] hover:bg-[#0C212D]/20"
                      }
                    `}
                    whileTap={status === "selecting" ? { scale: 0.95 } : {}}
                    animate={isWrong ? {
                      x: [0, -10, 10, -10, 10, 0],
                      transition: { duration: 0.5 }
                    } : {}}
                  >
                    {cleanWord}
                    {punctuation && <span className="ml-0.5">{punctuation}</span>}
                    
                    {/* Check/X marks */}
                    {isCorrect && (
                      <motion.span
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="absolute -top-2 -right-2 bg-green-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-lg"
                      >
                        ✓
                      </motion.span>
                    )}
                    {isWrong && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 bg-[#FF3816] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-lg"
                      >
                        ✗
                      </motion.span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Correction Phase */}
          <AnimatePresence>
            {status === "correcting" && data && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-[#EE7203]/20 bg-gradient-to-br from-[#0C212D]/5 to-[#EE7203]/5 p-8"
              >
                {data.correctWord === "remove" ? (
                  <div className="text-center space-y-6">
                    <div className="text-[#0C212D] text-lg">
                      <span className="block text-2xl mb-3">🗑️</span>
                      {t("gaming.games.errorFinder.removeInstruction")}
                    </div>

                    <motion.button
                      onClick={() => setStatus("won")}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all"
                    >
                      {t("gaming.games.errorFinder.removeButton")}
                    </motion.button>
                  </div>
                ) : (
                  <div className="max-w-md mx-auto space-y-6">
                    <div className="text-center">
                      <div className="text-4xl mb-4">✏️</div>
                      <p className="text-[#0C212D] text-lg font-medium">
                        {t("gaming.games.errorFinder.writeCorrect")}
                      </p>
                    </div>

                    <div className="relative">
                      <input
                        id="correction-input"
                        value={correctionInput}
                        onChange={(e) => setCorrectionInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && checkCorrection()}
                        className="w-full border-2 border-[#EE7203]/30 rounded-2xl px-6 py-4 text-center text-xl font-medium focus:border-[#EE7203] focus:ring-4 focus:ring-[#EE7203]/20 transition-all outline-none bg-white"
                        placeholder={t("gaming.games.errorFinder.inputPlaceholder") || "Escribe aquí..."}
                        autoFocus
                      />
                    </div>

                    <motion.button
                      onClick={checkCorrection}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full px-8 py-4 bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all"
                    >
                      {t("gaming.games.errorFinder.verify")}
                    </motion.button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result Display */}
          {(status === "won" || status === "lost") && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border-t-4 p-8 text-center ${
                status === "won" ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-500" :
                "bg-gradient-to-br from-[#FF3816]/10 to-[#EE7203]/10 border-[#FF3816]"
              }`}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="text-6xl mb-4"
              >
                {status === "won" ? "🎉" : "💡"}
              </motion.div>

              <h3 className={`text-3xl font-bold mb-3 ${
                status === "won" ? "text-green-700" : "text-[#FF3816]"
              }`}>
                {status === "won" ? t("gaming.games.errorFinder.correctTitle") : t("gaming.games.errorFinder.wrongTitle")}
              </h3>

              <p className="text-lg text-[#0C212D] mb-2">
                {data.correctWord === "remove" ? (
                  <>
                    {status === "won" ? 
                      t("gaming.games.errorFinder.correctRemove") : 
                      t("gaming.games.errorFinder.wrongRemove")
                    }{" "}
                    <span className="font-bold text-[#FF3816]">{data.wrongWord}</span>
                  </>
                ) : (
                  <>
                    {status === "won" ? 
                      t("gaming.games.errorFinder.correctReplace") : 
                      t("gaming.games.errorFinder.wrongReplace")
                    }{" "}
                    <span className="font-bold text-[#EE7203]">{data.correctWord}</span>
                  </>
                )}
              </p>

              {attempts > 1 && (
                <p className="text-sm text-slate-600 mt-2">
                  Lo lograste en {attempts} {attempts === 1 ? "intento" : "intentos"}
                </p>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Admin Controls */}
        {(role === "admin" || role === "profesor") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-8"
          >
            <button
              onClick={fetchSentence}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#0C212D] to-[#112C3E] text-white font-semibold hover:shadow-xl transition-all hover:scale-105 border border-[#EE7203]/30"
            >
              {t("gaming.games.errorFinder.newExercise")}
            </button>
          </motion.div>
        )}
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        
        .shake {
          animation: shake 0.5s;
        }
      `}</style>
    </div>
  );
}