"use client";

import { useRouter } from "next/navigation";
import {
  FiPlay,
  FiTarget,
  FiZap,
  FiBookOpen,
  FiEdit,
  FiAlertTriangle,
  FiAperture,
} from "react-icons/fi";
import { GAMES_MAP } from "@/app/gaming/games";

export default function GamingHub() {
  const router = useRouter();

  // META DE JUEGOS: todos en un solo lugar
  const META: Record<
    string,
    { title: string; description: string; icon: React.ReactElement }
  > = {
    hangman: {
      title: "Hangman",
      description: "Adiviná la palabra antes de que sea demasiado tarde.",
      icon: <FiTarget className="text-blue-600 text-2xl" />,
    },
    wordScramble: {
      title: "Word Scramble",
      description: "Ordená las letras y descubrí la palabra.",
      icon: <FiZap className="text-indigo-600 text-2xl" />,
    },
    wordle: {
      title: "Wordle",
      description: "Adiviná la palabra en 6 intentos.",
      icon: <FiAperture className="text-green-600 text-2xl" />,
    },
    emojiIdioms: {
      title: "Emoji Idioms",
      description: "Interpretá idioms usando solo emojis.",
      icon: <FiBookOpen className="text-yellow-600 text-2xl" />,
    },
    sentenceBuilder: {
      title: "Sentence Builder",
      description: "Arrastrá palabras para formar la oración correcta.",
      icon: <FiEdit className="text-orange-600 text-2xl" />,
    },
    errorFinder: {
      title: "Error Finder",
      description: "Encontrá y corregí el error gramatical.",
      icon: <FiAlertTriangle className="text-red-600 text-2xl" />,
    },
  };

  // Generar lista de juegos desde GAMES_MAP
  const GAMES = Object.keys(GAMES_MAP).map((slug) => ({
    slug,
    ...META[slug],
  }));

  return (
    <div className="min-h-[80vh] text-slate-900 px-6 py-10">

      {/* HEADER */}
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold  bg-clip-text">
          Further Gaming 🎮
        </h1>
        <p className="text-slate-600 mt-1 text-sm">
          Practicá inglés con juegos interactivos.
        </p>
      </header>

      {/* GRID DE JUEGOS */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((game) => (
          <div
            key={game.slug}
            className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-all p-6 flex flex-col justify-between hover:-translate-y-1 hover:scale-[1.02]"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-slate-100 shadow-inner">
                {game.icon}
              </div>
              <h2 className="text-xl font-semibold">{game.title}</h2>
            </div>

            <p className="text-slate-600 text-sm mb-5 h-14">
              {game.description}
            </p>

            <button
              onClick={() => router.push(`/gaming/${game.slug}`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition active:scale-95"
            >
              <FiPlay size={16} /> Jugar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
