"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { motion, AnimatePresence } from "framer-motion";
import LoaderGame from "@/components/ui/LoaderGame";
import { FiRefreshCw, FiZap, FiInfo } from "react-icons/fi";

type LetterState = "correct" | "present" | "absent" | "";

interface GuessResult {
  letter: string;
  state: LetterState;
}

const GAME_ID = "wordle";

const WordleTile = ({ letter, state, delay }: { letter: string; state: LetterState; delay: number }) => {
  const baseClasses = "w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center text-xl sm:text-2xl md:text-3xl font-extrabold rounded-lg select-none transition-all duration-300";

  let stateClasses = "bg-white border-2 border-gray-200 text-[#0C212D]";

  if (state === "correct") {
    stateClasses = "bg-emerald-500 border-emerald-500 text-white shadow-md";
  } else if (state === "present") {
    stateClasses = "bg-amber-500 border-amber-500 text-white shadow-md";
  } else if (state === "absent") {
    stateClasses = "bg-gray-400 border-gray-400 text-white";
  } else if (letter) {
    stateClasses = "bg-white border-2 border-gray-400 text-[#0C212D] animate-pulse-short";
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
  const inputRef = useRef<HTMLInputElement>(null);

  const lang = userProfile?.activeLanguage?.toLowerCase() || "en";

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

  const WORD_LENGTH = word.length || 5;

  // ── Labels por idioma ──────────────────────────────────────
  const badgeLabel: Record<string, string> = {
    es: "Desafío Diario",
    en: "Daily Challenge",
    pt: "Desafio Diário",
    fr: "Défi du Jour",
    it: "Sfida Quotidiana",
  };

  const correctLabel: Record<string, string> = {
    es: "🎉 ¡Correcto!",
    en: "🎉 Correct!",
    pt: "🎉 Correto!",
    fr: "🎉 Correct !",
    it: "🎉 Corretto!",
  };

  const revealLabel: Record<string, string> = {
    es: `La palabra era: ${word.toUpperCase()}`,
    en: `The word was: ${word.toUpperCase()}`,
    pt: `A palavra era: ${word.toUpperCase()}`,
    fr: `Le mot était : ${word.toUpperCase()}`,
    it: `La parola era: ${word.toUpperCase()}`,
  };

  const enterLabel: Record<string, string> = {
    es: "Presiona ENTER para enviar",
    en: "Press ENTER to submit",
    pt: "Pressione ENTER para enviar",
    fr: "Appuie sur ENTRÉE pour valider",
    it: "Premi INVIO per inviare",
  };

  const typeLabel: Record<string, string> = {
    es: "Escribe para jugar...",
    en: "Type to play...",
    pt: "Digite para jogar...",
    fr: "Tape pour jouer...",
    it: "Scrivi per giocare...",
  };

  const lengthLabel: Record<string, string> = {
    es: "Letras",
    en: "Length",
    pt: "Letras",
    fr: "Lettres",
    it: "Lettere",
  };

  const triesLabel: Record<string, string> = {
    es: "Intentos",
    en: "Tries",
    pt: "Tentativas",
    fr: "Essais",
    it: "Tentativi",
  };
  // ──────────────────────────────────────────────────────────

  useEffect(() => {
    setBlocked(false);
    setCheckingAttempt(false);
  }, [user, role]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const focusInput = () => {
    if (status === "playing") {
      inputRef.current?.focus();
    }
  };

  const fetchWord = async () => {
    try {
      setLoadingWord(true);
      setGuesses([]);
      setCurrentInput("");
      setHint(null);
      setStatus("playing");

      const res = await fetch(`/api/games/wordle?lang=${lang}`);
      const data = await res.json();

      setWord(data.word.toLowerCase().trim());
      setTimeout(() => inputRef.current?.focus(), 100);
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
      if (result[i].state === "correct") continue;
      const letter = attempt[i];
      if (letterCount[letter] > 0) {
        result[i] = { letter, state: "present" };
        letterCount[letter] -= 1;
      } else {
        result[i] = { letter, state: "absent" };
      }
    }

    const updated = [...guesses, result];
    setGuesses(updated);
    setCurrentInput("");

    if (attempt === word) {
      setStatus("won");
    } else if (updated.length >= MAX_TRIES) {
      setStatus("lost");
    }

    if (updated.length === 3)
      setHint(t("gaming.games.wordle.hint1", { letter: word[0].toUpperCase() }));
    if (updated.length === 5)
      setHint(t("gaming.games.wordle.hint2"));
  };

  if (checkingAttempt || loadingWord || showLoader) {
    return <LoaderGame />;
  }

  return (
    <div
      className="min-h-[85vh] flex flex-col items-center py-8 px-4 relative overflow-hidden font-sans"
      onClick={focusInput}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center"
      >
        {/* HEADER */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full shadow-sm border border-gray-100 mb-3">
            <FiZap className="text-[#EE7203]" size={16} />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              {badgeLabel[lang] ?? badgeLabel["en"]}
            </span>
          </div>
          <h1 className="text-3xl font-black text-[#0C212D] tracking-tight">
            WORDLE
          </h1>
        </div>

        {/* TABLERO */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xl border border-gray-100 w-full max-w-[360px] sm:max-w-[420px]">

          {/* Pista */}
          <AnimatePresence>
            {hint && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                <FiInfo className="flex-shrink-0" />
                {hint}
              </motion.div>
            )}
          </AnimatePresence>

          {/* GRID */}
          <div className="grid gap-2 mb-6 justify-center">
            {Array.from({ length: MAX_TRIES }).map((_, rowIndex) => {
              const guess = guesses[rowIndex];
              const isCurrentRow = rowIndex === guesses.length;

              return (
                <div
                  key={rowIndex}
                  className="grid gap-2"
                  style={{ gridTemplateColumns: `repeat(${WORD_LENGTH}, 1fr)` }}
                >
                  {Array.from({ length: WORD_LENGTH }).map((_, colIndex) => {
                    let letter = "";
                    let state: LetterState = "";

                    if (guess) {
                      letter = guess[colIndex].letter;
                      state = guess[colIndex].state;
                    } else if (isCurrentRow && currentInput[colIndex]) {
                      letter = currentInput[colIndex];
                    }

                    const delay = guess && rowIndex === guesses.length - 1 ? colIndex * 0.1 : 0;

                    return (
                      <WordleTile key={colIndex} letter={letter} state={state} delay={delay} />
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* CONTROLES */}
          <div className="relative min-h-[60px] flex items-center justify-center">

            {status === "playing" && (
              <input
                ref={inputRef}
                autoFocus
                maxLength={WORD_LENGTH}
                value={currentInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Záéíóúüñç]/gi, "");
                  if (val.length <= WORD_LENGTH) setCurrentInput(val);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitGuess();
                }}
                className="opacity-0 absolute inset-0 w-full h-full cursor-default z-0"
                autoComplete="off"
                autoCorrect="off"
              />
            )}

            {status !== "playing" ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center w-full"
              >
                <p className={`text-lg font-bold mb-3 ${status === "won" ? "text-emerald-600" : "text-red-500"}`}>
                  {status === "won"
                    ? correctLabel[lang] ?? correctLabel["en"]
                    : revealLabel[lang] ?? revealLabel["en"]}
                </p>
                <button
                  onClick={fetchWord}
                  disabled={loadingWord}
                  className="w-full bg-[#0C212D] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#112C3E] transition-colors"
                >
                  <FiRefreshCw className={loadingWord ? "animate-spin" : ""} />
                  {t("gaming.games.wordle.new")}
                </button>
              </motion.div>
            ) : (
              <p className="text-gray-400 text-sm font-medium animate-pulse">
                {currentInput.length === WORD_LENGTH
                  ? enterLabel[lang] ?? enterLabel["en"]
                  : typeLabel[lang] ?? typeLabel["en"]}
              </p>
            )}
          </div>
        </div>

        {/* Stats Footer */}
        <div className="mt-6 flex gap-8 text-gray-400 text-sm font-medium">
          <span>
            {lengthLabel[lang] ?? lengthLabel["en"]}:{" "}
            <strong className="text-gray-600">{WORD_LENGTH}</strong>
          </span>
          <span>
            {triesLabel[lang] ?? triesLabel["en"]}:{" "}
            <strong className="text-gray-600">{guesses.length}/{MAX_TRIES}</strong>
          </span>
        </div>
      </motion.div>
    </div>
  );
}