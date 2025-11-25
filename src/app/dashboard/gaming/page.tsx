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
import { useI18n } from "@/contexts/I18nContext";

export default function GamingHub() {
  const router = useRouter();
  const { t } = useI18n();

  // META DE JUEGOS: todos en un solo lugar
  const META: Record<
    string,
    { title: string; description: string; icon: React.ReactElement }
  > = {
    hangman: {
    title: t("gaming.games.hangman.title"),
    description: t("gaming.games.hangman.description"),
    icon: <FiTarget className="text-[#EE7203] text-2xl" />,
  },
  wordScramble: {
    title: t("gaming.games.wordScramble.title"),
    description: t("gaming.games.wordScramble.description"),
    icon: <FiZap className="text-[#EE7203] text-2xl" />,
  },
  wordle: {
    title: t("gaming.games.wordle.title"),
    description: t("gaming.games.wordle.description"),
    icon: <FiAperture className="text-[#EE7203] text-2xl" />,
  },
  emojiIdioms: {
    title: t("gaming.games.emojiIdioms.title"),
    description: t("gaming.games.emojiIdioms.description"),
    icon: <FiBookOpen className="text-[#EE7203] text-2xl" />,
  },
  sentenceBuilder: {
    title: t("gaming.games.sentenceBuilder.title"),
    description: t("gaming.games.sentenceBuilder.description"),
    icon: <FiEdit className="text-[#EE7203] text-2xl" />,
  },
  errorFinder: {
    title: t("gaming.games.errorFinder.title"),
    description: t("gaming.games.errorFinder.description"),
    icon: <FiAlertTriangle className="text-[#FF3816] text-2xl" />,
  }
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
          {t("gaming.headerTitle")}
        </h1>
        <p className="text-slate-600 mt-1 text-sm">
          {t("gaming.headerSubtitle")}
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
              <div className="p-3 rounded-xl bg-[#FFF4E8] shadow-inner">

                {game.icon}
              </div>
              <h2 className="text-xl font-semibold">{game.title}</h2>
            </div>

            <p className="text-slate-600 text-sm mb-5 h-14">
              {game.description}
            </p>

            <button
              onClick={() => router.push(`/gaming/${game.slug}`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg 
  bg-[#EE7203] text-white font-medium hover:bg-[#FF3816] transition active:scale-95"

            >
              <FiPlay size={16} /> {t("gaming.play")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
