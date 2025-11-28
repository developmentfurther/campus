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
import Image from "next/image";

export default function GamingHub() {
  const router = useRouter();
  const { t } = useI18n();

  const META: Record<
    string,
    { title: string; description: string; icon: React.ReactElement }
  > = {
    hangman: {
      title: t("gaming.games.hangman.title"),
      description: t("gaming.games.hangman.description"),
      icon: <FiTarget className="text-white text-4xl" />,
    },
    wordScramble: {
      title: t("gaming.games.wordScramble.title"),
      description: t("gaming.games.wordScramble.description"),
      icon: <FiZap className="text-white text-4xl" />,
    },
    wordle: {
      title: t("gaming.games.wordle.title"),
      description: t("gaming.games.wordle.description"),
      icon: <FiAperture className="text-white text-4xl" />,
    },
    emojiIdioms: {
      title: t("gaming.games.emojiIdioms.title"),
      description: t("gaming.games.emojiIdioms.description"),
      icon: <FiBookOpen className="text-white text-4xl" />,
    },
    sentenceBuilder: {
      title: t("gaming.games.sentenceBuilder.title"),
      description: t("gaming.games.sentenceBuilder.description"),
      icon: <FiEdit className="text-white text-4xl" />,
    },
    errorFinder: {
      title: t("gaming.games.errorFinder.title"),
      description: t("gaming.games.errorFinder.description"),
      icon: <FiAlertTriangle className="text-white text-4xl" />,
    }
  };

  const GAMES = Object.keys(GAMES_MAP).map((slug) => ({
    slug,
    ...META[slug],
  }));

  return (
    <div className="min-h-[80vh] px-6 py-20 relative overflow-hidden">
      
      {/* Floating geometric shapes */}
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-gradient-to-br from-[#EE7203]/10 to-[#FF3816]/5 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-gradient-to-tl from-[#0C212D]/5 to-[#112C3E]/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      {/* HEADER - Asymmetric Layout */}
      <header className="mb-20 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12 lg:gap-20">
          <div className="relative group">
            <div className="absolute -inset-8 bg-gradient-to-r from-[#EE7203] via-[#FF3816] to-[#EE7203] rounded-full opacity-20 blur-2xl group-hover:opacity-30 transition-opacity duration-700"></div>
            <div className="absolute -inset-4 bg-[#0C212D]/5 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
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
                <span className="text-xs font-bold text-[#0C212D] uppercase tracking-wider">Learning Through Play</span>
              </div>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-black text-[#0C212D] mb-4 leading-tight">
              Game <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EE7203] to-[#FF3816]">Zone</span>
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
            const isWide = index === 0 || index === GAMES.length - 1;
            
            return (
              <div
                key={game.slug}
                className={`group relative rounded-3xl overflow-hidden transform hover:scale-[1.02] transition-all duration-500 ${
                  isWide ? 'md:col-span-2 lg:col-span-1' : ''
                }`}
                style={{
                  animation: 'fadeInUp 0.6s ease-out forwards',
                  animationDelay: `${index * 0.1}s`,
                  opacity: 0
                }}
              >
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0C212D] via-[#112C3E] to-[#0C212D] group-hover:scale-105 transition-transform duration-700"></div>
                
                {/* Animated border effect */}
                <div className="absolute inset-0 rounded-3xl border-2 border-transparent bg-gradient-to-r from-[#EE7203] via-[#FF3816] to-[#EE7203] bg-clip-border opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    mask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'exclude'
                  }}
                ></div>
                
                {/* Content */}
                <div className="relative z-10 p-8 h-full flex flex-col">
                  
                  {/* Icon - Floating effect */}
                  <div className="mb-6 transform group-hover:-translate-y-2 transition-transform duration-500">
                    <div className="inline-flex p-5 rounded-2xl bg-gradient-to-br from-[#EE7203] to-[#FF3816] shadow-2xl shadow-[#EE7203]/40 group-hover:shadow-[#FF3816]/60 transition-shadow duration-500 rotate-3 group-hover:rotate-0">
                      {game.icon}
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
                    
                    <FiPlay size={20} className="relative z-10 transform group-hover/btn:scale-110 group-hover/btn:rotate-90 transition-all duration-300" />
                    <span className="relative z-10 uppercase tracking-wide text-sm">{t("gaming.play")}</span>
                    
                    {/* Arrow animation */}
                    <span className="relative z-10 transform translate-x-0 group-hover/btn:translate-x-1 transition-transform duration-300">→</span>
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
      `}</style>
    </div>
  );
}