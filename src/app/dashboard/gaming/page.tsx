"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  FiPlay,
  FiTarget,
  FiZap,
  FiBookOpen,
  FiEdit,
  FiAlertTriangle,
  FiAperture,
  FiHelpCircle,
  FiCheck,
} from "react-icons/fi";
import { GAMES_MAP } from "@/app/gaming/games";
import { useI18n } from "@/contexts/I18nContext";
import Image from "next/image";

export default function GamingHub() {
  const router = useRouter();
  const { t } = useI18n();
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);
  const [hoveredHelp, setHoveredHelp] = useState<string | null>(null);


  const META: Record<
  string,
  {
    title: string;
    description: string;
    icon: React.ReactElement;
    howToPlay: string[];
  }
> = {
  hangman: {
    title: t("gaming.games.hangman.title"),
    description: t("gaming.games.hangman.description"),
    icon: <FiTarget className="text-white text-4xl" />,
    howToPlay: [
        t("howToPlay.guessLetters"),
        t("howToPlay.wrongAddsPart"),
        t("howToPlay.completeBeforeDraw"),
        t("howToPlay.winRevealAll"),
    ],
  },

  wordScramble: {
    title: t("gaming.games.wordScramble.title"),
    description: t("gaming.games.wordScramble.description"),
    icon: <FiZap className="text-white text-4xl" />,
    howToPlay: [
      t("howToPlay.unscramble"),
      t("howToPlay.typeAnswer"),
      t("howToPlay.beatClock"),
      t("howToPlay.advanceLevels"),
    ],
  },

  wordle: {
    title: t("gaming.games.wordle.title"),
    description: t("gaming.games.wordle.description"),
    icon: <FiAperture className="text-white text-4xl" />,
    howToPlay: [
      t("howToPlay.guessFiveLetters"),
      t("howToPlay.greenCorrect"),
      t("howToPlay.yellowWrongSpot"),
      t("howToPlay.grayNotInWord"),
    ],
  },

  emojiIdioms: {
    title: t("gaming.games.emojiIdioms.title"),
    description: t("gaming.games.emojiIdioms.description"),
    icon: <FiBookOpen className="text-white text-4xl" />,
    howToPlay: [
      t("howToPlay.decodeEmojis"),
      t("howToPlay.thinkCultural"),
      t("howToPlay.typeAnswer"),
      t("howToPlay.learnIdioms"),
    ],
  },

  sentenceBuilder: {
    title: t("gaming.games.sentenceBuilder.title"),
    description: t("gaming.games.sentenceBuilder.description"),
    icon: <FiEdit className="text-white text-4xl" />,
    howToPlay: [
      t("howToPlay.arrangeOrder"),
      t("howToPlay.dragDrop"),
      t("howToPlay.followGrammar"),
      t("howToPlay.perfectSentences"),
    ],
  },

  errorFinder: {
    title: t("gaming.games.errorFinder.title"),
    description: t("gaming.games.errorFinder.description"),
    icon: <FiAlertTriangle className="text-white text-4xl" />,
    howToPlay: [
      t("howToPlay.readCarefully"),
      t("howToPlay.spotErrors"),
      t("howToPlay.clickIncorrect"),
      t("howToPlay.learnCorrections"),
    ],
  },
};


  const GAMES = Object.keys(GAMES_MAP).map((slug) => ({
    slug,
    ...META[slug],
  }));

  return (
    <div className="min-h-[80vh] px-6 py-20 relative overflow-hidden">
      {/* Floating geometric shapes */}
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-gradient-to-br from-[#EE7203]/10 to-[#FF3816]/5 blur-3xl animate-pulse"></div>
      <div
        className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-gradient-to-tl from-[#0C212D]/5 to-[#112C3E]/10 blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>

      {/* HEADER - Asymmetric Layout */}
      <header className="mb-20 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12 lg:gap-20">
          <div className="relative group">
            <div className="absolute -inset-8 bg-gradient-to-r from-[#EE7203] via-[#FF3816] to-[#EE7203] rounded-full opacity-20 blur-2xl group-hover:opacity-30 transition-opacity duration-700"></div>
            <div
              className="absolute -inset-4 bg-[#0C212D]/5 rounded-full animate-ping"
              style={{ animationDuration: "3s" }}
            ></div>
            <Image
              src="/images/probando.png"
              alt="Gaming Hub Logo"
              width={240}
              height={240}
              className="relative z-10 drop-shadow-2xl"
            />
          </div>

          <div className="flex-1 text-center lg:text-left lg:pt-8">
            <div className="inline-block mb-4">
              <div className="flex items-center gap-3 px-4 py-2 rounded-full border-2 border-[#EE7203] bg-white shadow-lg">
                <div className="w-2 h-2 rounded-full bg-[#FF3816] animate-pulse"></div>
                <span className="text-xs font-bold text-[#0C212D] uppercase tracking-wider">
                  {t("gaming.learningThroughPlay")}
                </span>
              </div>
            </div>

            <h1 className="text-5xl lg:text-6xl font-black text-[#0C212D] mb-4 leading-tight">
              {t("gaming.game")}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EE7203] to-[#FF3816]">
                {t("gaming.zone")}
              </span>
            </h1>

            <p className="text-[#112C3E] text-lg max-w-xl leading-relaxed">
              {t("gaming.headerSubtitle")}
            </p>

            {/* Decorative line */}
            <div className="mt-6 flex items-center gap-3">
              <div className="h-1 w-20 bg-gradient-to-r from-[#EE7203] to-[#FF3816] rounded-full"></div>
              <div className="h-1 w-12 bg-[#0C212D]/20 rounded-full"></div>
              <div className="h-1 w-6 bg-[#0C212D]/10 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      {/* GRID - Bento-style Layout */}
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
          {GAMES.map((game, index) => {
            
            const isHovered = hoveredGame === game.slug;

            return (
              <div
                key={game.slug}
                className={`group relative rounded-3xl overflow-hidden transform hover:scale-[1.02] transition-all duration-500 md:col-span-2 lg:col-span-1

                `}
                style={{
                  animation: "fadeInUp 0.6s ease-out forwards",
                  animationDelay: `${index * 0.1}s`,
                  opacity: 0,
                }}
                onMouseEnter={() => setHoveredGame(game.slug)}
                onMouseLeave={() => setHoveredGame(null)}
              >
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0C212D] via-[#112C3E] to-[#0C212D] group-hover:scale-105 transition-transform duration-700"></div>

                {/* Animated border effect */}
                <div
                  className="absolute inset-0 rounded-3xl border-2 border-transparent bg-gradient-to-r from-[#EE7203] via-[#FF3816] to-[#EE7203] bg-clip-border opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    mask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                    maskComposite: "exclude",
                  }}
                ></div>

                {/* Content */}
                <div className="relative z-10 p-8 h-full flex flex-col">
                  {/* Icon + How to Play Badge */}
                  <div className="mb-6 flex items-start justify-between">
                    <div className="transform group-hover:-translate-y-2 transition-transform duration-500">
                      <div className="inline-flex p-5 rounded-2xl bg-gradient-to-br from-[#EE7203] to-[#FF3816] shadow-2xl shadow-[#EE7203]/40 group-hover:shadow-[#FF3816]/60 transition-shadow duration-500 rotate-3 group-hover:rotate-0">
                        {game.icon}
                      </div>
                    </div>

                    {/* How to Play Toggle */}
                    <div className="relative">
  <div
  className="p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-help"
  onMouseEnter={() => setHoveredHelp(game.slug)}
  onMouseLeave={() => setHoveredHelp(null)}
>

    <FiHelpCircle
      size={20}
      className="text-white group-hover/tooltip:text-[#EE7203] transition-colors"
    />
  </div>

  {/* How to Play Tooltip */}
  <div
    className={`absolute top-12 right-0 w-72 z-[99999] rounded-2xl overflow-hidden
      bg-white shadow-2xl border-2 border-[#EE7203]
      transform transition-all duration-500 origin-top-right
      ${
        hoveredHelp === game.slug
          ? "opacity-100 scale-100 translate-y-0"
          : "opacity-0 scale-95 -translate-y-4 pointer-events-none"
      }`}
  >
                        {/* Tooltip Header */}
                        <div className="bg-gradient-to-r from-[#EE7203] to-[#FF3816] px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FiHelpCircle size={16} className="text-white" />
                            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                              {t("gaming.howToPlayTitle")}
                            </h3>
                          </div>
                        </div>

                        {/* Tooltip Body */}
                        <div className="p-4 space-y-2.5">
                          {game.howToPlay.map((step, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-3 group/step"
                              style={{
                                animation: isHovered
                                  ? `slideIn 0.3s ease-out forwards ${
                                      idx * 0.1
                                    }s`
                                  : "none",
                                opacity: isHovered ? 1 : 0,
                              }}
                            >
                              <div className="flex-shrink-0 mt-0.5">
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#EE7203] to-[#FF3816] flex items-center justify-center shadow-sm">
                                  <FiCheck
                                    size={12}
                                    className="text-white font-bold"
                                  />
                                </div>
                              </div>
                              <p className="text-sm text-[#0C212D] leading-snug flex-1">
                                {step}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Tooltip Arrow */}
                        <div className="absolute -top-2 right-4 w-4 h-4 bg-[#EE7203] rotate-45 border-t-2 border-l-2 border-[#EE7203]"></div>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-black mb-3 text-white group-hover:text-[#EE7203] transition-colors duration-300">
                    {game.title}
                  </h2>

                  {/* Description */}
                  <p className="text-sm leading-relaxed mb-8 flex-grow text-white/80">
                    {game.description}
                  </p>

                  {/* CTA Button - Morphing effect */}
                  <button
                    onClick={() => router.push(`/gaming/${game.slug}`)}
                    className="relative inline-flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-base overflow-hidden group/btn bg-white text-[#0C212D] hover:text-white transition-colors duration-300"
                  >
                    {/* Sliding background */}
                    <span className="absolute inset-0 bg-gradient-to-r from-[#EE7203] to-[#FF3816] transform -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-500 ease-out"></span>

                    <FiPlay
                      size={20}
                      className="relative z-10 transform group-hover/btn:scale-110 group-hover/btn:rotate-90 transition-all duration-300"
                    />
                    <span className="relative z-10 uppercase tracking-wide text-sm">
                      {t("gaming.play")}
                    </span>

                    {/* Arrow animation */}
                    <span className="relative z-10 transform translate-x-0 group-hover/btn:translate-x-1 transition-transform duration-300">
                      →
                    </span>
                  </button>
                </div>

                {/* Decorative corner element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#FF3816]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}