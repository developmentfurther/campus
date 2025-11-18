"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

type GameStatus = "selecting" | "correcting" | "won" | "lost";

interface ErrorData {
  sentence: string;
  wrongWord: string;
  correctWord: string;
}

const GAME_KEY = "error_finder_last_play";

export default function ErrorFinder() {
  const { user, role } = useAuth();

  const [data, setData] = useState<ErrorData | null>(null);
  const [loading, setLoading] = useState(true);

  const [locked, setLocked] = useState(false);
  const [errorWordSelected, setErrorWordSelected] = useState<string | null>(null);
  const [correctionInput, setCorrectionInput] = useState("");
  const [status, setStatus] = useState<GameStatus>("selecting");

  // ======================================================
  // Obtener frase desde IA
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
  // Intento diario (igual que Hangman)
  // ======================================================
  useEffect(() => {
    if (!user) return;

    if (role === "admin" || role === "profesor") {
      setLocked(false);
      fetchSentence();
      return;
    }

    const last = localStorage.getItem(GAME_KEY);
    const today = new Date().toDateString();

    if (last === today) {
      setLocked(true);
    } else {
      setLocked(false);
      fetchSentence();
    }
  }, [user, role]);

  // ======================================================
  // Lógica de selección y verificación
  // ======================================================
  const handleWordClick = (word: string) => {
    if (status !== "selecting" || locked) return;

    setErrorWordSelected(word);

    // Si seleccionó la palabra incorrecta → pedir corrección
    if (word === data?.wrongWord) {
      setStatus("correcting");
    } else {
      // Marca intento del día si es alumno
      if (role === "alumno") {
        localStorage.setItem(GAME_KEY, new Date().toDateString());
        setLocked(true);
      }
      setStatus("lost");
    }
  };

  const checkCorrection = () => {
    if (!data) return;

    // Guardar intento
    if (role === "alumno") {
      localStorage.setItem(GAME_KEY, new Date().toDateString());
      setLocked(true);
    }

    if (correctionInput.toLowerCase().trim() === data.correctWord.toLowerCase()) {
      setStatus("won");
    } else {
      setStatus("lost");
    }
  };

  // ======================================================
  // PANTALLA BLOQUEADA
  // ======================================================
  if (locked && role === "alumno") {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <h1 className="text-3xl font-bold text-slate-800">Error Finder</h1>
        <p className="text-slate-500">Ya jugaste hoy este ejercicio.</p>
        <p className="text-slate-600 text-sm">Vuelve mañana para seguir practicando ✨</p>
      </div>
    );
  }

  // ======================================================
  // LOADING
  // ======================================================
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
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Error Finder</h1>
        <p className="text-slate-500 text-sm mt-1">
          Tocá la palabra incorrecta y luego corrígela.
        </p>
      </div>

      {/* Sentence display (Duolingo-style) */}
      <div className="p-6 rounded-3xl bg-white shadow-lg border border-slate-100">
        <div className="flex flex-wrap justify-center gap-2 text-lg font-medium">
          {words.map((word, i) => {
            const isSelected = word === errorWordSelected;
            const isWrong = word === data.wrongWord && status === "lost";

            return (
              <motion.button
                key={i}
                onClick={() => handleWordClick(word)}
                className={`px-3 py-1 rounded-xl transition font-semibold
                  ${isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800"}
                `}
                whileTap={{ scale: 0.9 }}
                animate={
                  isWrong
                    ? { x: [-4, 4, -4, 4, 0] } // shake
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

      {/* Step 2: Correction input */}
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

      {/* FEEDBACK FINAL */}
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

      {/* NEW SENTENCE (solo admin/profesor) */}
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
