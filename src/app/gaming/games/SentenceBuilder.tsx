"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";


type GameStatus = "playing" | "won" | "lost";

interface DragItem {
  index: number;
  from: "pool" | "sentence";
}

export default function SentenceBuilder() {
    const GAME_KEY = "sentence_builder_last_play";

  const [original, setOriginal] = useState<string[]>([]);
  const [pool, setPool] = useState<string[]>([]);
  const [sentence, setSentence] = useState<string[]>([]);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [loading, setLoading] = useState(true);

  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const { user } = useAuth(); // 👈 tu sistema ya lo usa
  const [locked, setLocked] = useState(false);


  // -------------------------------------------
  // Fetch sentence
  // -------------------------------------------
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

useEffect(() => {
  if (!user) return; // esperamos al user

  // ADMIN → siempre desbloqueado
  if (user.role === "admin") {
    setLocked(false);
    fetchSentence();
    return;
  }

  // STUDENT (alumno) → check intento diario
  const lastPlay = localStorage.getItem(GAME_KEY);
  const today = new Date().toDateString();

  if (lastPlay === today) {
    setLocked(true);
  } else {
    setLocked(false);
    fetchSentence();
  }
}, [user]);



  // -------------------------------------------
  // CLICK actions
  // -------------------------------------------
  const selectWord = (word: string, i: number) => {
    if (status !== "playing") return;

    setSentence((prev) => [...prev, word]);
    setPool((prev) => prev.filter((_, idx) => idx !== i));
  };

  const removeWord = (i: number) => {
    if (status !== "playing") return;

    const word = sentence[i];
    setSentence((prev) => prev.filter((_, idx) => idx !== i));
    setPool((prev) => [...prev, word]);
  };

  // -------------------------------------------
  // DRAG START
  // -------------------------------------------
  const onDragStart = (index: number, from: "pool" | "sentence") => {
    if (status !== "playing") return;
    setDragItem({ index, from });
  };

  // -------------------------------------------
  // DROP on SENTENCE (add or reorder)
  // -------------------------------------------
  const onDropInSentence = (dropIndex: number | null) => {
    if (!dragItem || status !== "playing") return;

    if (dragItem.from === "pool") {
      const word = pool[dragItem.index];

      // remove from pool
      const newPool = [...pool];
      newPool.splice(dragItem.index, 1);

      // add to sentence at the dropIndex
      const newSentence = [...sentence];

      if (dropIndex === null) {
        newSentence.push(word);
      } else {
        newSentence.splice(dropIndex, 0, word);
      }

      setPool(newPool);
      setSentence(newSentence);
    }

    if (dragItem.from === "sentence") {
      const newSentence = [...sentence];

      const [moved] = newSentence.splice(dragItem.index, 1);

      if (dropIndex === null) {
        newSentence.push(moved);
      } else {
        newSentence.splice(dropIndex, 0, moved);
      }

      setSentence(newSentence);
    }

    setDragItem(null);
  };

  // -------------------------------------------
  // DROP on POOL → return word to pool
  // -------------------------------------------
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

  // -------------------------------------------
  // CHECK ANSWER
  // -------------------------------------------
  const check = () => {
    if (user?.role !== "admin") {
  const today = new Date().toDateString();
  localStorage.setItem(GAME_KEY, today);
}

    if (sentence.join(" ") === original.join(" ")) {
      setStatus("won");
    } else {
      setStatus("lost");
    }
  };

  // -------------------------------------------
  // LOADING
  // -------------------------------------------
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center py-32">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (locked) {
  return (
    <div className="max-w-xl mx-auto py-16 text-center space-y-4">
      <h1 className="text-3xl font-bold text-slate-800">Sentence Builder</h1>
      <p className="text-slate-500">Ya utilizaste tu intento diario.</p>
      <p className="text-slate-600 text-sm">
        Vuelve mañana para jugar otra vez ✨
      </p>
    </div>
  );
}


  // -------------------------------------------
  // UI
  // -------------------------------------------
  return (
    <div className="max-w-xl mx-auto py-10 text-center space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Sentence Builder</h1>
        <p className="text-slate-500 text-sm mt-1">
          Drag the words to build the correct sentence.
        </p>
      </div>

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
            onClick={() => removeWord(i)}
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDrop={() => onDropInSentence(i)}
           className="
  px-3 
  py-1
  rounded-xl
  bg-blue-600 
  text-white 
  shadow-sm 
  cursor-grab 
  active:scale-95
  text-sm
  font-medium
  flex
  items-center
  justify-center
  leading-none
"

          >
            {word}
          </div>
        ))}
      </div>

      {/* Word pool */}
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
            onClick={() => selectWord(word, i)}
            className="px-4 py-2 rounded-full bg-slate-200 text-slate-900 shadow cursor-grab active:scale-95"
          >
            {word}
          </div>
        ))}
      </div>

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
        <p className="text-emerald-600 font-semibold text-xl">
          🎉 Correct!
        </p>
      )}

      {status === "lost" && (
        <p className="text-red-500 font-semibold text-xl">
          ❌ Incorrect. Try again.
        </p>
      )}

     <button
  onClick={() => {
    if (user?.role !== "admin") return; // alumnos no pueden reiniciar
    fetchSentence();
  }}
  disabled={user?.role !== "admin"}
  className={`px-5 py-2 rounded-xl text-sm shadow transition
    ${user?.role !== "admin"
      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
      : "bg-slate-200 hover:bg-slate-300 text-slate-800"}
  `}
>
  New sentence
</button>

    </div>
  );
}
