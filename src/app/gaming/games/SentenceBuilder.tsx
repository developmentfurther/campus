"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  userPlayedToday,
  updateUserGameAttempt,
} from "@/lib/games/attempts";

type GameStatus = "playing" | "won" | "lost";

interface DragItem {
  index: number;
  from: "pool" | "sentence";
}

const GAME_ID = "sentence_builder";

export default function SentenceBuilder() {
  const { user, role } = useAuth();

  const [original, setOriginal] = useState<string[]>([]);
  const [pool, setPool] = useState<string[]>([]);
  const [sentence, setSentence] = useState<string[]>([]);

  const [status, setStatus] = useState<GameStatus>("playing");
  const [loading, setLoading] = useState(true);

  // === control de intentos diario (idéntico a Hangman)
  const [blocked, setBlocked] = useState(false);
  const [checkingAttempt, setCheckingAttempt] = useState(true);

  const [dragItem, setDragItem] = useState<DragItem | null>(null);

  // ======================================================
  // FETCH EJERCICIO (solo si puede jugar)
  // ======================================================
  const fetchSentence = async () => {
    try {
      setLoading(true);
      setSentence([]);
      setStatus("playing");

      const res = await fetch("/api/games/sentence-builder");
      const data = await res.json();

      setOriginal(data.words);
      setPool(data.shuffled);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // CONTROL DE INTENTOS — Firestore
  // ======================================================
  useEffect(() => {
    const check = async () => {
      if (!user) {
        setCheckingAttempt(false);
        return;
      }

      // Admin & Profesor → sin límites
      if (role === "admin" || role === "profesor") {
        setBlocked(false);
        setCheckingAttempt(false);
        return;
      }

      // Alumno → verificar Firestore
      const played = await userPlayedToday(user.uid, GAME_ID);
      if (played) setBlocked(true);

      setCheckingAttempt(false);
    };

    void check();
  }, [user, role]);

  // ======================================================
  // SI NO ESTÁ BLOQUEADO → cargar ejercicio
  // ======================================================
  useEffect(() => {
    if (!checkingAttempt && !blocked) {
      void fetchSentence();
    }
  }, [checkingAttempt, blocked]);

  // ======================================================
  // DRAG & DROP
  // ======================================================
  const onDragStart = (index: number, from: "pool" | "sentence") => {
    if (status !== "playing") return;
    setDragItem({ index, from });
  };

  const onDropInSentence = (dropIndex: number | null) => {
    if (!dragItem || status !== "playing") return;

    if (dragItem.from === "pool") {
      const word = pool[dragItem.index];

      const newPool = [...pool];
      newPool.splice(dragItem.index, 1);

      const newSentence = [...sentence];

      if (dropIndex === null) newSentence.push(word);
      else newSentence.splice(dropIndex, 0, word);

      setPool(newPool);
      setSentence(newSentence);
    } else {
      const newSentence = [...sentence];
      const [moved] = newSentence.splice(dragItem.index, 1);

      if (dropIndex === null) newSentence.push(moved);
      else newSentence.splice(dropIndex, 0, moved);

      setSentence(newSentence);
    }

    setDragItem(null);
  };

  const onDropInPool = () => {
    if (!dragItem || status !== "playing") return;

    if (dragItem.from === "sentence") {
      const newSentence = [...sentence];
      const [moved] = newSentence.splice(dragItem.index, 1);

      setSentence(newSentence);
      setPool((prev) => [...prev, moved]);
    }

    setDragItem(null);
  };

  // ======================================================
  // CHECK ANSWER
  // ======================================================
  const check = () => {
    if (status !== "playing") return;

    const isCorrect =
      sentence.join(" ").trim() === original.join(" ").trim();

    setStatus(isCorrect ? "won" : "lost");
  };

  // ======================================================
  // MARCAR INTENTO AL TERMINAR
  // ======================================================
  useEffect(() => {
    const update = async () => {
      if (!user) return;
      if (role !== "alumno") return; // solo alumnos limitados
      if (status === "playing") return; // aún no terminó

      await updateUserGameAttempt(user.uid, GAME_ID);
      setBlocked(true);
    };

    void update();
  }, [status, user, role]);

  // ======================================================
  // UI STATES
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
      <div className="py-20 text-center text-slate-600 max-w-xl mx-auto">
        <h2 className="text-2xl font-bold mb-3">
          Ya jugaste hoy Sentence Builder 🎮
        </h2>
        <p className="text-slate-500">
          Tenés 1 intento por día. Volvé mañana ✨
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center py-32">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // ======================================================
  // UI PRINCIPAL
  // ======================================================
  return (
    <div className="max-w-xl mx-auto py-10 text-center space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">Sentence Builder</h1>
      <p className="text-slate-500 text-sm">
        Drag the words to build the correct sentence.
      </p>

      {/* Sentence area */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => onDropInSentence(null)}
        className="min-h-[90px] p-4 rounded-2xl border border-slate-200 bg-slate-50 shadow-inner flex flex-wrap gap-2 justify-center"
      >
        {sentence.map((word, i) => (
          <div
            key={i}
            draggable={status === "playing"}
            onDragStart={() => onDragStart(i, "sentence")}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDropInSentence(i)}
            className="px-3 py-1 rounded-xl bg-blue-600 text-white shadow-sm cursor-grab active:scale-95 text-sm font-medium"
          >
            {word}
          </div>
        ))}
      </div>

      {/* Pool */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDropInPool}
        className="p-4 rounded-2xl border border-slate-200 bg-white shadow flex flex-wrap gap-2 justify-center"
      >
        {pool.map((word, i) => (
          <div
            key={i}
            draggable={status === "playing"}
            onDragStart={() => onDragStart(i, "pool")}
            className="px-4 py-2 rounded-full bg-slate-200 text-slate-900 shadow cursor-grab active:scale-95 text-sm font-medium"
          >
            {word}
          </div>
        ))}
      </div>

      {/* Buttons */}
      {status === "playing" && (
        <button
          onClick={check}
          disabled={sentence.length === 0}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition"
        >
          Check
        </button>
      )}

      {status === "won" && (
        <p className="text-emerald-600 font-semibold text-xl">🎉 Correct!</p>
      )}

      {status === "lost" && (
        <p className="text-red-500 font-semibold text-xl">
          ❌ Incorrect. Try again.
        </p>
      )}

      {(role === "admin" || role === "profesor") && (
        <button
          onClick={fetchSentence}
          className="px-5 py-2 rounded-xl shadow bg-slate-200 hover:bg-slate-300 text-slate-800"
        >
          New sentence
        </button>
      )}
    </div>
  );
}
