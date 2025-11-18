"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
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
  const { user, role } = useAuth();

  const [data, setData] = useState<ErrorData | null>(null);

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<GameStatus>("selecting");

  // Control de intentos
  const [blocked, setBlocked] = useState(false);
  const [checkingAttempt, setCheckingAttempt] = useState(true);

  // UI
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

      const res = await fetch("/api/games/error-finder");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // CHECK INTENTOS — FIRESTORE
  // ======================================================
  useEffect(() => {
    const check = async () => {
      if (!user) {
        setCheckingAttempt(false);
        return;
      }

      // Admin/profesor → sin límite
      if (role === "admin" || role === "profesor") {
        setBlocked(false);
        setCheckingAttempt(false);
        return;
      }

      // Alumno → revisar Firestore
      const played = await userPlayedToday(user.uid, GAME_ID);
      if (played) setBlocked(true);

      setCheckingAttempt(false);
    };

    void check();
  }, [user, role]);

  // ======================================================
  // CARGAR EJERCICIO SI SE PUEDE JUGAR
  // ======================================================
  useEffect(() => {
    if (!checkingAttempt && !blocked) {
      void fetchSentence();
    }
  }, [checkingAttempt, blocked]);

  // ======================================================
  // CLICK DE PALABRA — SELECCIÓN
  // ======================================================
  const handleWordClick = (word: string) => {
    if (status !== "selecting" || blocked) return;

    setErrorWordSelected(word);

    if (word === data?.wrongWord) {
      setStatus("correcting");
    } else {
      // palabra incorrecta elegida → pierde
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
  // GUARDAR INTENTO CUANDO TERMINA
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
  // UI — ESTADOS
  // ======================================================

  if (checkingAttempt) {
    return (
      <div className="py-20 text-center text-slate-600">
        Verificando intentos de hoy...
      </div>
    );
  }

  if (blocked && role === "alumno") {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <h1 className="text-3xl font-bold text-slate-800">Error Finder</h1>
        <p className="text-slate-500">Ya jugaste hoy este ejercicio.</p>
        <p className="text-slate-600 text-sm">
          Volvé mañana para seguir practicando ✨
        </p>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="py-24 text-center text-slate-700">
        <div className="animate-spin h-10 w-10 mx-auto border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <p className="mt-3">Generando ejercicio...</p>
      </div>
    );
  }

  // ======================================================
  // UI PRINCIPAL
  // ======================================================
  const words = data.sentence.split(" ");

  return (
    <div className="max-w-xl mx-auto py-10 text-center space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">Error Finder</h1>
      <p className="text-slate-500 text-sm mt-1">
        Tocá la palabra incorrecta y luego corrígela.
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
                animate={
                  isWrongChoice
                    ? { x: [-4, 4, -4, 4, 0] }
                    : {}
                }
              >
                {word.replace(".", "")}
                {word.endsWith(".") ? "." : ""}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Correction input */}
      <AnimatePresence>
        {status === "correcting" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <p className="text-slate-700">¿Cómo se escribe correctamente?</p>
            <input
              value={correctionInput}
              onChange={(e) => setCorrectionInput(e.target.value)}
              className="block mx-auto border rounded-xl px-4 py-2 text-center"
              placeholder="Escribe la corrección"
            />

            <button
              onClick={checkCorrection}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
            >
              Verificar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      {status === "won" && (
        <motion.p
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          className="text-emerald-600 font-semibold text-xl"
        >
          🎉 ¡Correcto! La palabra correcta era "{data.correctWord}".
        </motion.p>
      )}

      {status === "lost" && (
        <motion.p
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          className="text-red-500 font-semibold text-xl"
        >
          ❌ Incorrecto. La corrección correcta era "{data.correctWord}".
        </motion.p>
      )}

      {(role === "admin" || role === "profesor") && (
        <button
          onClick={fetchSentence}
          className="mt-6 px-6 py-3 rounded-xl bg-slate-200 text-slate-800 hover:bg-slate-300"
        >
          Nuevo ejercicio
        </button>
      )}
    </div>
  );
}
