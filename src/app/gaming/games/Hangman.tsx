"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  userPlayedToday,
  updateUserGameAttempt,
} from "@/lib/games/attempts";

type GameStatus = "playing" | "won" | "lost";

const GAME_ID = "hangman"; // 👈 importantísimo que sea siempre el mismo string

export default function Hangman() {
  const { user, role } = useAuth();

  const [word, setWord] = useState<string>("");
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState<number>(0);
  const [status, setStatus] = useState<GameStatus>("playing");

  const [loadingWord, setLoadingWord] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // 👇 nuevo: control de intentos
  const [blocked, setBlocked] = useState(false);
  const [checkingAttempt, setCheckingAttempt] = useState(true);

  // 🔹 Al montar, si es alumno, revisar si ya jugó hoy
  useEffect(() => {
    const check = async () => {
      if (!user) {
        setCheckingAttempt(false);
        return;
      }

      // admin y profesor → pueden jugar siempre
      if (role === "admin" || role === "profesor") {
        setBlocked(false);
        setCheckingAttempt(false);
        return;
      }

      // alumno → mirar en Firestore
      const played = await userPlayedToday(user.uid, GAME_ID);
      if (played) setBlocked(true);
      setCheckingAttempt(false);
    };

    void check();
  }, [user, role]);

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

  // cargar palabra inicial (solo si no está bloqueado)
  useEffect(() => {
  if (!checkingAttempt && !blocked) {
    void fetchWord();
  }
}, [checkingAttempt, blocked]);


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
    if (blocked) return; // por las dudas

    if (word.includes(letter)) {
      setGuessedLetters((prev) => [...prev, letter]);
    } else {
      setWrongGuesses((prev) => prev + 1);
    }
  };

  // 🔹 Cuando termina la partida, si es alumno, marcamos el intento y bloqueamos
  useEffect(() => {
    const markAttempt = async () => {
      if (!user) return;
      if (role !== "alumno") return; // solo alumnos limitados
      if (status === "playing") return;

      await updateUserGameAttempt(user.uid, GAME_ID);
      setBlocked(true); // 👈 importante: bloqueamos también en el front
    };

    void markAttempt();
  }, [status, user, role]);

  // === UI ===

  if (checkingAttempt) {
    return (
      <div className="w-full h-full flex items-center justify-center py-32">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (blocked && role === "alumno") {
    return (
      <div className="py-20 text-center text-slate-600">
        <h2 className="text-2xl font-bold mb-3">Ya jugaste hoy a Hangman 🎮</h2>
        <p className="text-slate-500">
          Tenés 1 partida por día. Podés volver a jugar mañana.
        </p>
      </div>
    );
  }

  if (loadingWord) {
    return (
      <div className="w-full h-full flex items-center justify-center py-32">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full" />
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
