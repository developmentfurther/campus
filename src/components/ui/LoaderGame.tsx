import React, { useState, useEffect } from "react";
import { useI18n } from "@/contexts/I18nContext";

export default function LoaderGame({ duration = 1800 }) {
  const { t } = useI18n();
  const [progress, setProgress] = useState(0);
  const [glitchActive, setGlitchActive] = useState(false);

  // ⏳ Progreso controlado hasta 100%
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 2;
      });
    }, duration / 50); // Ajuste proporcional al tiempo total

    return () => clearInterval(interval);
  }, [duration]);

  // 🤖 Efecto glitch
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 100);
    }, 2000);

    return () => clearInterval(glitchInterval);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 overflow-hidden">
      {/* Grid de fondo estilo gaming */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(#0C212D 1px, transparent 1px),
            linear-gradient(90deg, #0C212D 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Partículas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: "3s",
              opacity: 0.1,
            }}
          >
            <svg width="40" height="46" viewBox="0 0 40 46">
              <polygon
                points="20,0 40,11.5 40,34.5 20,46 0,34.5 0,11.5"
                fill="none"
                stroke={i % 2 === 0 ? "#EE7203" : "#FF3816"}
                strokeWidth="2"
              />
            </svg>
          </div>
        ))}
      </div>

      <div className="relative z-10">
        <div
          className={`transition-all duration-100 ${
            glitchActive ? "translate-x-1" : ""
          }`}
        >
          {/* Título */}
          <div className="text-center mb-8">
            <div
              className="text-5xl font-black tracking-wider mb-2 relative inline-block"
              style={{
                color: "#0C212D",
                textShadow: `2px 2px 0 #EE7203, 4px 4px 0 #FF3816`,
              }}
            >
              {t("gaming.loadingInicial")}
              <div className="absolute -left-12 top-1/2 w-8 h-1 bg-gradient-to-r from-transparent to-orange-500" />
              <div className="absolute -right-12 top-1/2 w-8 h-1 bg-gradient-to-l from-transparent to-red-500" />
            </div>
          </div>

          {/* Hexágono principal */}
          <div className="relative w-64 h-72 mx-auto">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 230">
              {/* Fondo */}
              <polygon
                points="100,10 180,57.5 180,172.5 100,220 20,172.5 20,57.5"
                fill="white"
                stroke="#E5E7EB"
                strokeWidth="3"
              />

              {/* Progreso */}
              <polygon
                points="100,10 180,57.5 180,172.5 100,220 20,172.5 20,57.5"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="6"
                strokeDasharray="690"
                strokeDashoffset={690 - (690 * progress) / 100}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.3s ease-out" }}
              />

              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#EE7203" />
                  <stop offset="100%" stopColor="#FF3816" />
                </linearGradient>
              </defs>
            </svg>

            {/* Texto centro */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl font-black mb-2" style={{ color: "#0C212D", WebkitTextStroke: "2px #EE7203" }}>
                  {progress}
                </div>
                <div className="text-xl font-bold tracking-widest" style={{ color: "#FF3816" }}>
                  %
                </div>
              </div>
            </div>
          </div>

          {/* Texto terminal */}
          <div className="mt-6 text-center font-mono">
            <div className="text-sm font-bold tracking-wider" style={{ color: "#0C212D" }}>
              &gt; {t("gaming.loading")}
            </div>
            <div className="text-xs mt-1 opacity-60" style={{ color: "#EE7203" }}>
              {t("gaming.standby")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
