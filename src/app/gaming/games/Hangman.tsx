"use client";
import { useState, useEffect } from "react";

const WORDS = ["further", "academy", "teacher", "student", "english", "language", "lesson"];

export default function Hangman() {
  const [word, setWord] = useState("");
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");

  // ✅ seleccionar palabra aleatoria al inicio
  useEffect(() => {
    const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    setWord(randomWord.toLowerCase());
  }, []);

  // ✅ determinar estado del juego
  useEffect(() => {
    if (!word) return;

    const isWinner = word.split("").every((letter) => guessedLetters.includes(letter));
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

  const handleRestart = () => {
    setGuessedLetters([]);
    setWrongGuesses(0);
    setStatus("playing");
    const newWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    setWord(newWord.toLowerCase());
  };

  // ✅ representación visual del ahorcado
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

  const displayWord = word
    ? word
        .split("")
        .map((l) => (guessedLetters.includes(l) ? l : "_"))
        .join(" ")
    : "";

  return (
    <div className="flex flex-col items-center justify-center space-y-8 text-center">
      <div className="whitespace-pre text-4xl leading-tight text-slate-800 font-mono">
        {stages[wrongGuesses]}
      </div>

      <h2 className="text-3xl font-bold tracking-wide">{displayWord}</h2>

      <p className="text-slate-500 text-sm">Errores: {wrongGuesses} / 7</p>

      {status === "won" && (
        <p className="text-emerald-600 font-semibold text-lg">🎉 ¡Ganaste! La palabra era "{word}".</p>
      )}
      {status === "lost" && (
        <p className="text-red-600 font-semibold text-lg">💀 Perdiste. La palabra era "{word}".</p>
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
          onClick={handleRestart}
          className="mt-4 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
        >
          Jugar de nuevo
        </button>
      )}
    </div>
  );
}
