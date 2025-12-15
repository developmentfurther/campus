"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { getIdiomsBank, IdiomItem } from "@/lib/games/idioms";
import LoaderGame from "@/components/ui/LoaderGame";
import GameBackground from "@/components/ui/GameBackground";
import {
  FiZap,
  FiHelpCircle,
  FiCheckCircle,
  FiXCircle,
  FiInfo,
} from "react-icons/fi";

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

const GAME_ID = "idioms";

export default function EmojiIdioms() {
  const { user, role, userProfile } = useAuth();
  const { t } = useI18n();

  const lang = userProfile?.learningLanguage?.toLowerCase() || "en";
  const BANK = getIdiomsBank(lang);

  const [item, setItem] = useState<IdiomItem | null>(null);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"playing" | "correct" | "wrong">(
    "playing"
  );
  const [hintLevel, setHintLevel] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [checkingAttempt, setCheckingAttempt] = useState(true);
  const [showLoader, setShowLoader] = useState(true);

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
  // CARGAR EJERCICIO
  // ======================================================
  const loadNewIdiom = () => {
    if (BANK.length === 0) return;

    const random = BANK[Math.floor(Math.random() * BANK.length)];
    setItem(random);
    setInput("");
    setStatus("playing");
    setHintLevel(0);
    setAttempts(0);
  };

  useEffect(() => {
    if (!checkingAttempt && !blocked) {
      loadNewIdiom();
    }
  }, [checkingAttempt, blocked, lang]);

  // ======================================================
  // VERIFICAR RESPUESTA
  // ======================================================
  const checkAnswer = () => {
    if (!item || !input.trim()) return;

    const userAnswer = normalize(input);
    const isCorrect = item.answers.some(
      (answer) => normalize(answer) === userAnswer
    );

    setAttempts(attempts + 1);

    if (isCorrect) {
      setStatus("correct");
    } else {
      setStatus("wrong");
      setTimeout(() => {
        setStatus("playing");
        if (hintLevel < 3) {
          setHintLevel(hintLevel + 1);
        }
      }, 2000);
    }
  };

  // ======================================================
  // SISTEMA DE PISTAS
  // ======================================================
  const getHints = () => {
    if (!item) return [];
    const hints: string[] = [];
    const firstAnswer = item.answers[0];
    const words = firstAnswer.split(" ");

    if (hintLevel >= 1) {
      hints.push(
        t("gaming.games.emojiIdioms.hints.wordCount", {
          count: words.length,
        })
      );
    }

    if (hintLevel >= 2) {
      const initials = words.map((w) => w[0].toUpperCase()).join(" ");
      hints.push(
        t("gaming.games.emojiIdioms.hints.startsWith", {
          letters: initials,
        })
      );
    }

    if (hintLevel >= 3) {
      hints.push(
        t("gaming.games.emojiIdioms.hints.firstWord", {
          word: words[0],
        })
      );
    }

    return hints;
  };

  // ======================================================
  // USAR PISTA MANUAL
  // ======================================================
  const useHint = () => {
    if (hintLevel < 3 && status === "playing") {
      setHintLevel(hintLevel + 1);
    }
  };

  // ======================================================
  // UI
  // ======================================================
  if (checkingAttempt || !item || showLoader) {
    return <LoaderGame />;
  }

  const hints = getHints();

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">
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
              {t("gaming.games.emojiIdioms.badge")}
            </span>
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-black text-[#0C212D] mb-3">
            {t("gaming.games.emojiIdioms.title")}
          </h1>

          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            {t("gaming.games.emojiIdioms.instructions")}
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-3xl shadow-2xl border-2 border-[#EE7203]/20 overflow-hidden"
        >
          {/* Emoji Display */}
          <div className="bg-gradient-to-br from-[#0C212D] to-[#112C3E] p-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="text-8xl mb-4"
            >
              {item.emojis}
            </motion.div>

            {item.hint && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-white/80 text-lg flex items-center justify-center gap-2"
              >
                <FiHelpCircle size={20} />
                {item.hint}
              </motion.p>
            )}
          </div>

          {/* Input Area */}
          <div className="p-8">
            <div className="space-y-4">
              {/* Hints Display */}
              {hints.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap gap-2 justify-center mb-4"
                >
                  {hints.map((hint, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-2 bg-gradient-to-r from-[#EE7203]/10 to-[#FF3816]/10 border border-[#EE7203]/30 px-4 py-2 rounded-full"
                    >
                      <FiInfo className="text-[#EE7203]" size={16} />
                      <span className="text-sm font-medium text-[#0C212D]">
                        {hint}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Input Field */}
              <div className="relative">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && checkAnswer()}
                  disabled={status !== "playing"}
                  placeholder={t(
                    "gaming.games.emojiIdioms.inputPlaceholder"
                  )}
                  className={`w-full text-center text-xl px-6 py-5 rounded-2xl border-2 transition-all outline-none font-medium
                    ${
                      status === "correct"
                        ? "border-green-500 bg-green-50"
                        : status === "wrong"
                        ? "border-[#FF3816] bg-red-50"
                        : "border-[#0C212D]/20 focus:border-[#EE7203] focus:ring-4 focus:ring-[#EE7203]/10"
                    }
                  `}
                  autoFocus
                />

                {/* Status Icons */}
                <AnimatePresence>
                  {status === "correct" && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                    >
                      <FiCheckCircle className="text-green-500" size={32} />
                    </motion.div>
                  )}

                  {status === "wrong" && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, x: [-10, 10, -10, 10, 0] }}
                      exit={{ scale: 0 }}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                    >
                      <FiXCircle className="text-[#FF3816]" size={32} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={useHint}
                  disabled={hintLevel >= 3 || status !== "playing"}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-[#0C212D]/10 text-[#0C212D] hover:bg-[#0C212D]/20 flex-1"
                >
                  {t("gaming.games.emojiIdioms.hint")} ({hintLevel}/3)
                </button>

                <button
                  onClick={checkAnswer}
                  disabled={!input.trim() || status !== "playing"}
                  className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white hover:shadow-xl hover:scale-105 flex-[2]"
                >
                  {t("gaming.games.emojiIdioms.check")}
                </button>
              </div>
            </div>
          </div>

          {/* Result Display */}
          <AnimatePresence>
            {status === "correct" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t-4 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 p-8"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="text-center"
                >
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-3xl font-bold text-green-700 mb-2">
                    {t("gaming.games.emojiIdioms.correct")}
                  </h3>
                  <p className="text-lg text-[#0C212D] mb-3">
                    <span className="font-semibold">
                      {t("gaming.games.emojiIdioms.answer")}:
                    </span>{" "}
                    {item.answers.join(", ")}
                  </p>
                  {item.explain && (
                    <p className="text-slate-600">{item.explain}</p>
                  )}
                  {attempts > 1 && (
                    <p className="text-sm text-slate-500 mt-3">
                      {t("gaming.games.emojiIdioms.completedIn", {
                        count: attempts,
                      })}
                    </p>
                  )}

                  {(role === "admin" || role === "profesor") && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      onClick={loadNewIdiom}
                      className="mt-6 px-8 py-3 bg-gradient-to-r from-[#0C212D] to-[#112C3E] text-white rounded-xl font-semibold hover:shadow-xl transition-all hover:scale-105"
                    >
                      {t("gaming.games.emojiIdioms.next")}
                    </motion.button>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Stats */}
        {attempts > 0 && status === "playing" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-6 text-sm text-slate-500"
          >
            {t("gaming.games.emojiIdioms.attempts")}: {attempts}
          </motion.div>
        )}
      </div>
    </div>
  );
}
