"use client";

import { useState, useEffect } from "react";

type GameStatus = "playing" | "won" | "lost";

export default function Hangman() {
  const [word, setWord] = useState<string>("");
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState<number>(0);
  const [status, setStatus] = useState<GameStatus>("playing");

  const [loadingWord, setLoadingWord] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // 👉 Función IA
  const fetchWord = async () => {
    try {
      setLoadingWord(true);
      setError("");
      setGuessedLetters([]);
      setWrongGuesses(0);
      setStatus("playing");

      const res = await fetch("/api/games/hangman");
      if (!res.ok) throw new Error("Request failed");

      const data: { word: string } = await res.json();

      if (!data.word) throw new Error("No word returned");

      setWord(data.word.toLowerCase());
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

  // estado del juego
  useEffect(() => {
    if (!word) return;

    const isWinner = word.split("").every((l) => guessedLetters.includes(l));
    const isLoser = wrongGuesses >= 7;

    if (isWinner) setStatus("won");
    else if (isLoser) setStatus("lost");
  }, [guessedLetters, wrongGuesses, word]);

  const handleGuess = (letter: string) => {
    if (status !== "playing" || guessedLetters.includes(letter)) return;

    if (word.includes(letter)) {
      setGuessedLetters((prev) => [...prev, letter]);
    } else {
      setWrongGuesses((prev) => prev + 1);
    }
  };

  // dibujo del muñeco
  const stages = [
    "",
    "🪢",
    "🪢\n😐",
    "🪢\n😐\n | ",
    "🪢\n😐\n/| ",
    "🪢\n😐\n/|\\",
    "🪢\n😵\n/|\\\n/ ",
    "🪢\n😵\n/|\\\n/ \\",
  ];

  const displayWord =
    word &&
    word
      .split("")
      .map((l) => (guessedLetters.includes(l) ? l : "_"))
      .join(" ");

  // === UI ===

  if (loadingWord) {
    return (
      <div className="py-20 text-center text-slate-700">
        <p className="text-xl">Cargando palabra...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 flex flex-col items-center space-y-5">
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
      <div className="whitespace-pre text-4xl leading-tight text-slate-800 font-mono">
        {stages[wrongGuesses]}
      </div>

      <h2 className="text-3xl font-bold">{displayWord}</h2>
      <p className="text-slate-500 text-sm">Errores: {wrongGuesses} / 7</p>

      {status === "won" && (
        <p className="text-emerald-600 font-semibold text-lg">
          🎉 ¡Ganaste! La palabra era "{word}".
        </p>
      )}

      {status === "lost" && (
        <p className="text-red-600 font-semibold text-lg">
          💀 Perdiste. La palabra era "{word}".
        </p>
      )}

      {status === "playing" ? (
        <div className="grid grid-cols-9 gap-2 max-w-xs">
          {"abcdefghijklmnopqrstuvwxyz".split("").map((letter) => {
            const isGuessed = guessedLetters.includes(letter);

            return (
              <button
                key={letter}
                onClick={() => handleGuess(letter)}
                disabled={isGuessed}
                className={`rounded-lg border px-2 py-1 text-sm font-medium transition ${
                  isGuessed
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      ) : (
        <button
          onClick={fetchWord}
          className="mt-4 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
        >
          Jugar de nuevo (IA)
        </button>
      )}
    </div>
  );
}
