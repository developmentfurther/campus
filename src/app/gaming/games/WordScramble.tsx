"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import {
  userPlayedToday,
  updateUserGameAttempt,
} from "@/lib/games/attempts";
import { motion } from "framer-motion";

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

  // === verificar intentos ===
  useEffect(() => {
    const check = async () => {
      if (!user) return;

      if (role === "admin" || role === "profesor") {
        setCheckingAttempt(false);
        return;
      }

      const played = await userPlayedToday(user.uid, GAME_ID);
      if (played) setBlocked(true);

      setCheckingAttempt(false);
    };

    void check();
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
    const save = async () => {
      if (!user) return;
      if (role !== "alumno") return;
      if (status !== "won") return;

      await updateUserGameAttempt(user.uid, GAME_ID);
      setBlocked(true);
    };

    void save();
  }, [status, user, role]);

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
            {t("gaming.games.wordScramble.alreadyPlayedTitle")} 
          </h2>
          <p className="text-slate-600 text-lg">
            {t("gaming.games.wordScramble.alreadyPlayedText")}
          </p>
        </motion.div>
      </div>
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
 

  return (
    <div className="flex flex-col items-center justify-center space-y-8 text-center px-4">
      <h1 className="text-3xl font-bold">
        {t("gaming.games.wordScramble.title")}
      </h1>

      <div className="text-4xl font-mono tracking-widest bg-slate-200 text-slate-800 px-6 py-3 rounded-xl">
        {scrambled.toUpperCase()}
      </div>

      {status === "won" ? (
        <p className="text-emerald-600 text-lg font-semibold">
          {t("gaming.games.wordScramble.won", { word })}
        </p>
      ) : (
        <>
          <input
            value={guess}
            onChange={(e) => {
              setGuess(e.target.value);
              setIsWrong(false);
            }}
            placeholder={t("gaming.games.wordScramble.inputPlaceholder")}
            className={`px-4 py-2 rounded-xl border text-black transition ${
              isWrong ? "border-red-500" : "border-slate-300"
            }`}
          />

          <button
            onClick={checkGuess}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            {t("gaming.games.wordScramble.verify")}
          </button>

          {isWrong && (
            <p className="text-red-600 font-medium text-sm">
              {t("gaming.games.wordScramble.incorrect")}
            </p>
          )}
        </>
      )}

      {hints.length > 0 && (
        <div className="w-full max-w-sm text-left space-y-2 mt-4">
          <h3 className="text-slate-700 font-semibold text-lg">
            {t("gaming.games.wordScramble.hintsTitle")}
          </h3>

          {hints.map((h, i) => (
            <p
              key={i}
              className="text-slate-600 bg-slate-100 rounded-lg px-3 py-2 text-sm"
            >
              {h}
            </p>
          ))}
        </div>
      )}

      <button
        onClick={fetchWord}
        className="mt-6 text-blue-600 underline underline-offset-4 hover:text-blue-800"
      >
        {t("gaming.games.wordScramble.newWord")}
      </button>
    </div>
  );
}
