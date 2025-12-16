"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

interface Correction {
  error: string;
  correction: string;
  explanation: string;
  position: number;
}

interface Pronunciation {
  score: number;
  feedback: string;
  commonIssues?: string[];
}

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  corrections?: Correction[];
  pronunciation?: Pronunciation;
}

export default function MessageBubble({
  role,
  content,
  corrections = [],
  pronunciation,
}: MessageBubbleProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const errorRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const isUser = role === "user";

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calcular posición del tooltip
  const updateTooltipPosition = (index: number) => {
    const element = errorRefs.current[index];
    if (element) {
      const rect = element.getBoundingClientRect();
      
      if (isMobile) {
        // En mobile, centrar el tooltip
        setTooltipPosition({
          x: window.innerWidth / 2,
          y: rect.bottom + 10
        });
      } else {
        setTooltipPosition({
          x: rect.left,
          y: rect.top + rect.height / 2
        });
      }
    }
  };

  // Actualizar posición en scroll
  useEffect(() => {
    if (hoveredIndex !== null) {
      const handleScroll = () => updateTooltipPosition(hoveredIndex);
      window.addEventListener('scroll', handleScroll, true);
      return () => window.removeEventListener('scroll', handleScroll, true);
    }
  }, [hoveredIndex, isMobile]);

  // Procesar contenido del asistente
  const processAssistantContent = (text: string) => {
    let processed = text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[#0C212D]">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-[#112C3E]">$1</em>');

    const keywords = [
      'remember', 'recuerda', 'recordá', 'important', 'importante', 'note', 'nota',
      'tip', 'consejo', 'practice', 'practica', 'practicá', 'attention', 'atención',
      'correct', 'correcto', 'incorrect', 'incorrecto', 'error',
      'good', 'bien', 'excellent', 'excelente', 'great', 'genial', 'bárbaro',
      'try', 'intenta', 'intentá', 'avoid', 'evita', 'evitá', 'use', 'usa', 'usá', 'utiliza', 'utilizá'
    ];

    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
      processed = processed.replace(
        regex,
        '<span class="px-1.5 py-0.5 bg-[#EE7203]/10 text-[#EE7203] rounded text-sm font-semibold">$1</span>'
      );
    });

    return processed;
  };

  // Renderizar contenido con correcciones inline
  const renderContentWithCorrections = () => {
    if (isUser && corrections.length > 0) {
      let parts: JSX.Element[] = [];
      let lastIndex = 0;

      const sortedCorrections = [...corrections].sort(
        (a, b) => a.position - b.position
      );

      sortedCorrections.forEach((corr, idx) => {
        const { error, correction, explanation, position } = corr;

        // Texto antes del error
        if (position > lastIndex) {
          parts.push(
            <span key={`text-${idx}`}>
              {content.substring(lastIndex, position)}
            </span>
          );
        }

        // Error subrayado - MEJORADO PARA MOBILE
        parts.push(
          <span
            key={`error-${idx}`}
            className="relative inline-block group"
            ref={(el) => (errorRefs.current[idx] = el)}
            onClick={() => {
              if (isMobile) {
                setHoveredIndex(hoveredIndex === idx ? null : idx);
                updateTooltipPosition(idx);
              }
            }}
            onMouseEnter={() => {
              if (!isMobile) {
                setHoveredIndex(idx);
                updateTooltipPosition(idx);
              }
            }}
            onMouseLeave={() => {
              if (!isMobile) {
                setHoveredIndex(null);
              }
            }}
          >
            <span className="relative inline-block px-1 py-0.5 bg-yellow-100 border-b-2 border-yellow-500 rounded-sm cursor-pointer transition-all hover:bg-yellow-200 active:bg-yellow-300">
              <span className="relative z-10 text-gray-900 font-medium">{error}</span>
            </span>
          </span>
        );

        lastIndex = position + error.length;
      });

      // Texto restante
      if (lastIndex < content.length) {
        parts.push(
          <span key="text-end">{content.substring(lastIndex)}</span>
        );
      }

      return <div className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base">{parts}</div>;
    }

    // Mensaje del asistente con procesamiento
    if (!isUser) {
      return (
        <div
          className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base"
          dangerouslySetInnerHTML={{ __html: processAssistantContent(content) }}
        />
      );
    }

    // Mensaje del usuario sin correcciones
    return (
      <div className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
        {content}
      </div>
    );
  };

  // Tooltip mejorado para mobile
  const renderTooltip = () => {
    if (hoveredIndex === null || !corrections[hoveredIndex]) return null;

    const correction = corrections[hoveredIndex];

    const tooltip = (
      <div
        className={clsx(
          "fixed z-[999999] transition-all duration-200",
          isMobile ? "inset-x-4" : "pointer-events-none"
        )}
        style={isMobile ? {
          top: `${tooltipPosition.y}px`,
          opacity: tooltipPosition.y === 0 ? 0 : 1
        } : {
          left: `${tooltipPosition.x}px`,
          top: `${tooltipPosition.y}px`,
          transform: 'translate(calc(-100% - 20px), -50%)',
          opacity: tooltipPosition.x === 0 ? 0 : 1
        }}
        onClick={(e) => {
          if (isMobile) {
            e.stopPropagation();
            setHoveredIndex(null);
          }
        }}
      >
        <div className={clsx(
          "bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-2xl border-2 border-yellow-500/30",
          isMobile ? "w-full" : "w-80"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b-2 border-gray-100">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-yellow-100">
                <span className="text-lg sm:text-xl">💡</span>
              </div>
              <span className="text-yellow-600 text-[10px] sm:text-xs uppercase tracking-wider font-bold">
                Correction
              </span>
            </div>
            {isMobile && (
              <button 
                onClick={() => setHoveredIndex(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            )}
          </div>

          {/* Error original */}
          <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
            <div className="text-[10px] sm:text-xs text-red-600 font-semibold mb-1">Your text:</div>
            <div className="text-sm sm:text-base text-red-800 font-medium">{correction.error}</div>
          </div>

          {/* Corrección sugerida */}
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
            <div className="text-[10px] sm:text-xs text-green-600 font-semibold mb-1">Suggested:</div>
            <div className="text-base sm:text-lg text-green-800 font-bold">{correction.correction}</div>
          </div>

          {/* Explicación */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 sm:p-4 border border-blue-200">
            <div className="flex items-start gap-2">
              <span className="text-blue-500 text-base sm:text-xl mt-0.5 flex-shrink-0">ℹ️</span>
              <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                {correction.explanation}
              </p>
            </div>
          </div>

          {/* Flecha del tooltip - SOLO DESKTOP */}
          {!isMobile && (
            <div
              className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-full w-0 h-0 border-t-[12px] border-b-[12px] border-l-[12px] border-transparent border-l-white"
              style={{ filter: 'drop-shadow(2px 0 2px rgba(0,0,0,0.1))' }}
            ></div>
          )}
        </div>
      </div>
    );

    return typeof window !== 'undefined' ? createPortal(tooltip, document.body) : null;
  };

  // Score de pronunciación mejorado para mobile
  const renderPronunciationScore = () => {
    if (!pronunciation) return null;

    const getScoreColor = (score: number) => {
      if (score >= 8) return "from-green-500 to-emerald-600";
      if (score >= 6) return "from-yellow-500 to-orange-500";
      return "from-red-500 to-rose-600";
    };

    const getScoreEmoji = (score: number) => {
      if (score >= 8) return "🎯";
      if (score >= 6) return "👍";
      return "💪";
    };

    const getScoreLabel = (score: number) => {
      if (score >= 8) return "Excellent";
      if (score >= 6) return "Good";
      return "Keep practicing";
    };

    return (
      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t-2 border-white/20">
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <span className="text-xl sm:text-2xl">{getScoreEmoji(pronunciation.score)}</span>
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white/90">Pronunciation</span>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3 border border-white/20">
          {/* Score principal */}
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-white/80">Score:</span>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${getScoreColor(pronunciation.score)} shadow-lg`}>
                <span className="text-xl sm:text-2xl font-bold text-white">{pronunciation.score}</span>
              </div>
              <div className="text-right">
                <div className="text-[10px] sm:text-xs text-white/60">out of 10</div>
                <div className="text-xs sm:text-sm font-semibold text-white">{getScoreLabel(pronunciation.score)}</div>
              </div>
            </div>
          </div>
          
          {/* Feedback */}
          {pronunciation.feedback && (
            <div className="bg-white/5 rounded-lg p-2 sm:p-3 border border-white/10">
              <p className="text-xs sm:text-sm leading-relaxed text-white/90">
                {pronunciation.feedback}
              </p>
            </div>
          )}

          {/* Issues comunes */}
          {pronunciation.commonIssues && pronunciation.commonIssues.length > 0 && (
            <div className="bg-white/5 rounded-lg p-2 sm:p-3 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs sm:text-sm font-semibold text-white/90">Focus areas:</span>
              </div>
              <ul className="space-y-1 sm:space-y-1.5">
                {pronunciation.commonIssues.map((issue, idx) => (
                  <li key={idx} className="text-xs sm:text-sm text-white/80 flex items-start gap-2">
                    <span className="text-yellow-400 mt-0.5 flex-shrink-0">▸</span>
                    <span className="break-words">{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        className={clsx(
          "flex px-2 sm:px-0",
          isUser ? "justify-end" : "justify-start"
        )}
      >
        <div
          className={clsx(
            "max-w-[85%] sm:max-w-[75%] px-3 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg relative transition-all duration-200",
            isUser
              ? "bg-gradient-to-br from-[#EE7203] to-[#FF3816] text-white rounded-br-md"
              : "bg-white text-gray-800 rounded-bl-md border-2 border-gray-100"
          )}
        >
          {renderContentWithCorrections()}
          {renderPronunciationScore()}
          
          {/* Indicador de correcciones disponibles */}
          {isUser && corrections.length > 0 && (
            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/20">
              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-white/80">
                <span className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-yellow-400 text-yellow-900 font-bold text-[9px] sm:text-[10px]">
                  {corrections.length}
                </span>
                <span className="leading-tight">
                  {isMobile 
                    ? "Tap highlighted words for corrections"
                    : corrections.length === 1 
                      ? "Hover over the highlighted text to see the correction" 
                      : `${corrections.length} corrections - hover to see details`}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {renderTooltip()}
      
      {/* Overlay para cerrar tooltip en mobile */}
      {isMobile && hoveredIndex !== null && createPortal(
        <div 
          className="fixed inset-0 bg-black/20 z-[999998]"
          onClick={() => setHoveredIndex(null)}
        />,
        document.body
      )}
    </>
  );
}