"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import {
  userPlayedToday,
  updateUserGameAttempt,
} from "@/lib/games/attempts";

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

  // ======================================================
  // FETCH EJERCICIO
  // ======================================================
  const fetchSentence = async () => {
    try {
      setLoading(true);
      setErrorWordSelected(null);
      setCorrectionInput("");
      setStatus("selecting");

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

    if (word === data?.wrongWord) {
      setStatus("correcting");
    } else {
      setStatus("lost");
    }
  };

  // ======================================================
  // VERIFICAR CORRECCIÓN
  // ======================================================
  const checkCorrection = () => {
    if (!data) return;

    const correct =
      correctionInput.toLowerCase().trim() ===
      data.correctWord.toLowerCase().trim();

    setStatus(correct ? "won" : "lost");
  };

  // ======================================================
  // GUARDAR INTENTO
  // ======================================================
  useEffect(() => {
    const mark = async () => {
      if (!user) return;
      if (role !== "alumno") return;
      if (status === "selecting" || status === "correcting") return;

      await updateUserGameAttempt(user.uid, GAME_ID);
      setBlocked(true);
    };

    void mark();
  }, [status, user, role]);

  // ======================================================
  // UI
  // ======================================================

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
            {t("gaming.games.errorFinder.alreadyPlayed")}
          </h2>
          <p className="text-slate-600 text-lg">
            {t("gaming.games.errorFinder.comeBack")} 
          </p>
        </motion.div>
      </div>
    );
  }

  if (loading || !data) {
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

  const words = data.sentence.split(" ");

  return (
    <div className="max-w-xl mx-auto py-10 text-center space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">
        {t("gaming.games.errorFinder.title")}
      </h1>

      <p className="text-slate-500 text-sm mt-1">
        {t("gaming.games.errorFinder.instruction")}
      </p>

      {/* Sentence */}
      <div className="p-6 rounded-3xl bg-white shadow-lg border border-slate-100">
        <div className="flex flex-wrap justify-center gap-2 text-lg font-medium">
          {words.map((word, i) => {
            const isSelected = word === errorWordSelected;
            const isWrongChoice =
              word === errorWordSelected &&
              word !== data.wrongWord &&
              status === "lost";

            return (
              <motion.button
                key={i}
                onClick={() => handleWordClick(word)}
                className={`px-3 py-1 rounded-xl font-semibold transition
                  ${
                    isSelected
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-800"
                  }
                `}
                whileTap={{ scale: 0.9 }}
                animate={isWrongChoice ? { x: [-4, 4, -4, 4, 0] } : {}}
              >
                {word.replace(".", "")}
                {word.endsWith(".") ? "." : ""}
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {status === "correcting" && data && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Caso REMOVE */}
            {data.correctWord === "remove" ? (
              <>
                <p className="text-slate-700">
                  {t("gaming.games.errorFinder.removeInstruction")}
                </p>

                <button
                  onClick={() => setStatus("won")}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                >
                  {t("gaming.games.errorFinder.removeButton")}
                </button>
              </>
            ) : (
              <>
                <p className="text-slate-700">
                  {t("gaming.games.errorFinder.writeCorrect")}
                </p>

                <input
                  value={correctionInput}
                  onChange={(e) => setCorrectionInput(e.target.value)}
                  className="block mx-auto border rounded-xl px-4 py-2 text-center"
                  placeholder={t("gaming.games.errorFinder.inputPlaceholder") || ""}
                />

                <button
                  onClick={checkCorrection}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                >
                  {t("gaming.games.errorFinder.verify")}
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* RESULTADO */}
      {status === "won" && (
        <motion.div
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          className="text-emerald-600 font-semibold text-xl"
        >
          {t("gaming.games.errorFinder.correctTitle")} <br />

          {data.correctWord === "remove" ? (
            <>
              {t("gaming.games.errorFinder.correctRemove")} <b>{data.wrongWord}</b>.
            </>
          ) : (
            <>
              {t("gaming.games.errorFinder.correctReplace")}{" "}
              <b>{data.correctWord}</b>.
            </>
          )}
        </motion.div>
      )}

      {status === "lost" && (
        <motion.div
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          className="text-red-500 font-semibold text-xl"
        >
          {t("gaming.games.errorFinder.wrongTitle")} <br />

          {data.correctWord === "remove" ? (
            <>
              {t("gaming.games.errorFinder.wrongRemove")} <b>{data.wrongWord}</b>.
            </>
          ) : (
            <>
              {t("gaming.games.errorFinder.wrongReplace")}{" "}
              <b>{data.correctWord}</b>.
            </>
          )}
        </motion.div>
      )}

      {/* BOTÓN ADMIN */}
      {(role === "admin" || role === "profesor") && (
        <button
          onClick={fetchSentence}
          className="mt-6 px-6 py-3 rounded-xl bg-slate-200 text-slate-800 hover:bg-slate-300"
        >
          {t("gaming.games.errorFinder.newExercise")}
        </button>
      )}
    </div>
  );
}
