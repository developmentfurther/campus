"use client";
import { useRouter } from "next/navigation";
import { FiPlay, FiTarget, FiZap, FiBookOpen } from "react-icons/fi";
import { GAMES_MAP } from "@/app/gaming/games"; // 👈 importamos el registro real
import WordScramble from "@/app/gaming/games/WordScramble";

export default function GamingHub() {
  const router = useRouter();

  // 🔹 Generar la lista automáticamente desde GAMES_MAP
  const GAMES = Object.keys(GAMES_MAP).map((slug) => {
    // Podés definir metadatos para cada juego si querés personalizar títulos / descripciones / iconos
    const meta: Record<
      string,
      { title: string; description: string; icon: React.ReactElement
  }
    > = {
      hangman: {
        title: "Hangman",
        description: "Adiviná la palabra antes de que sea demasiado tarde.",
        icon: <FiBookOpen className="text-blue-600 text-xl" />,
      },
      emojiIdioms: {
        title: "Guess the Idiom with Emojis",
        description: "Adiviná la jerga con emojis.",
        icon: <FiBookOpen className="text-blue-600 text-xl" />,
      },
      wordScramble: {
        title: "Word Scramble",
        description: "Adiviná la palabra",
        icon: <FiBookOpen className="text-blue-600 text-xl" />,
      }
      
      // ⚙️ Si agregás más juegos en el futuro, podés definirlos acá
      // wordtap: { title: "Word Tap", description: "...", icon: <FiTarget /> },
    };

    return {
      slug,
      title: meta[slug]?.title || slug,
      description: meta[slug]?.description || "Juego en desarrollo.",
      icon: meta[slug]?.icon || <FiZap className="text-indigo-600 text-xl" />,
    };
  });

  return (
    <div className="min-h-[80vh] bg-white text-slate-900 px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold">Gaming Hub</h1>
        <p className="text-slate-600">
          Entrená habilidades con mini-juegos interactivos.
        </p>
      </header>

      {/* Grid de juegos */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((game) => (
          <div
            key={game.slug}
            className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition p-6 flex flex-col justify-between"
          >
            <div className="flex items-center gap-3 mb-3">
              {game.icon}
              <h2 className="text-lg font-semibold">{game.title}</h2>
            </div>
            <p className="text-slate-600 text-sm mb-4 flex-1">
              {game.description}
            </p>
            <button
              onClick={() => router.push(`/gaming/${game.slug}`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
            >
              <FiPlay size={16} /> Jugar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
