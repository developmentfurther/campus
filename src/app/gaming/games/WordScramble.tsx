"use client";

import { useState, useEffect } from "react";

type GameStatus = "playing" | "won";

function shuffle(word: string): string {
  return word
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

export default function WordScramble() {
  const [word, setWord] = useState<string>("");
  const [scrambled, setScrambled] = useState<string>("");
  const [guess, setGuess] = useState<string>("");

  const [status, setStatus] = useState<GameStatus>("playing");
  const [isWrong, setIsWrong] = useState<boolean>(false);

  const [loadingWord, setLoadingWord] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // 👉 pedir palabra IA
  const fetchWord = async () => {
    try {
      setLoadingWord(true);
      setError("");
      setGuess("");
      setIsWrong(false);
      setStatus("playing");

      const res = await fetch("/api/games/scramble");
      if (!res.ok) throw new Error("Request failed");

      const data: { word: string } = await res.json();
      if (!data.word) throw new Error("Invalid word");

      const w = data.word.toLowerCase();
      setWord(w);
      setScrambled(shuffle(w));
    } catch (err) {
      console.error(err);
      setError("No se pudo obtener una palabra. Intenta nuevamente.");
    } finally {
      setLoadingWord(false);
    }
  };

  // cargar palabra inicial
  useEffect(() => {
    void fetchWord();
  }, []);

  const checkGuess = () => {
    const cleaned = guess.toLowerCase().trim();

    if (cleaned === word) {
      setStatus("won");
      setIsWrong(false); // limpiar error
    } else {
      setIsWrong(true); // marcar error
    }
  };

  if (loadingWord) {
    return (
      <div className="py-20 text-center text-slate-700">
        <p className="text-xl">Cargando palabra...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 flex flex-col items-center gap-4 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchWord}
          className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-8 text-center">
      <h1 className="text-3xl font-bold">Word Scramble</h1>

      <div className="text-4xl font-mono tracking-widest bg-slate-200 text-slate-800 px-6 py-3 rounded-xl">
        {scrambled.toUpperCase()}
      </div>

      {status === "won" ? (
        <p className="text-emerald-600 text-lg font-semibold">
          🎉 ¡Correcto! La palabra era:{" "}
          <span className="font-bold">{word}</span>
        </p>
      ) : (
        <>
          <input
            value={guess}
            onChange={(e) => {
              setGuess(e.target.value);
              setIsWrong(false); // resetear error al escribir
            }}
            placeholder="Escribe la palabra correcta..."
            className={`px-4 py-2 rounded-xl border text-black transition ${
              isWrong ? "border-red-500" : "border-slate-300"
            }`}
          />

          <button
            onClick={checkGuess}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            Verificar
          </button>

          {isWrong && (
            <p className="text-red-600 font-medium text-sm">
              ❌ Incorrecto. Intenta de nuevo.
            </p>
          )}
        </>
      )}

      <button
        onClick={fetchWord}
        className="mt-6 text-blue-600 underline underline-offset-4 hover:text-blue-800"
      >
        Nueva palabra (IA)
      </button>
    </div>
  );
}
