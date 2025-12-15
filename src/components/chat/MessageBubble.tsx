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
  const errorRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const isUser = role === "user";

  // Calcular posición del tooltip
  const updateTooltipPosition = (index: number) => {
    const element = errorRefs.current[index];
    if (element) {
      const rect = element.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left,
        y: rect.top + rect.height / 2
      });
    }
  };

  // Actualizar posición en scroll
  useEffect(() => {
    if (hoveredIndex !== null) {
      const handleScroll = () => updateTooltipPosition(hoveredIndex);
      window.addEventListener('scroll', handleScroll, true);
      return () => window.removeEventListener('scroll', handleScroll, true);
    }
  }, [hoveredIndex]);

  // Procesar contenido del asistente: negritas, cursivas, y keywords
  const processAssistantContent = (text: string) => {
    // Primero procesar markdown básico
    let processed = text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[#0C212D]">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-[#112C3E]">$1</em>');

    // Detectar y resaltar keywords comunes en aprendizaje de idiomas
    const keywords = [
      'remember', 'recuerda', 'important', 'importante', 'note', 'nota',
      'tip', 'consejo', 'practice', 'practica', 'attention', 'atención',
      'correct', 'correcto', 'incorrect', 'incorrecto', 'error',
      'good', 'bien', 'excellent', 'excelente', 'great', 'genial',
      'try', 'intenta', 'avoid', 'evita', 'use', 'usa', 'utiliza'
    ];

    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
      processed = processed.replace(
        regex,
        '<span class="px-2 py-0.5 bg-[#EE7203]/10 text-[#EE7203] rounded font-semibold">$1</span>'
      );
    });

    return processed;
  };

  // Renderizar contenido con correcciones inline
  const renderContentWithCorrections = () => {
    if (isUser && corrections.length > 0) {
      let parts: JSX.Element[] = [];
      let lastIndex = 0;

      // Ordenar correcciones por posición
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

        // Error subrayado con tooltip mejorado
        parts.push(
          <span
            key={`error-${idx}`}
            className="relative inline-block group"
            ref={(el) => (errorRefs.current[idx] = el)}
            onMouseEnter={() => {
              setHoveredIndex(idx);
              updateTooltipPosition(idx);
            }}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <span className="relative inline-block px-1 bg-[#FF3816]/10 rounded cursor-help">
              <span className="relative z-10">{error}</span>
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF3816] rounded-full"></span>
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF3816] rounded-full animate-pulse"></span>
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

      return <div className="whitespace-pre-wrap leading-relaxed">{parts}</div>;
    }

    // Mensaje del asistente con procesamiento
    if (!isUser) {
      return (
        <div
          className="whitespace-pre-wrap leading-relaxed"
          dangerouslySetInnerHTML={{ __html: processAssistantContent(content) }}
        />
      );
    }

    // Mensaje del usuario sin correcciones
    return (
      <div className="whitespace-pre-wrap leading-relaxed">
        {content}
      </div>
    );
  };

  // Tooltip renderizado con portal
  const renderTooltip = () => {
    if (hoveredIndex === null || !corrections[hoveredIndex]) return null;

    const correction = corrections[hoveredIndex];

    const tooltip = (
      <div
        className="fixed z-[999999] pointer-events-none transition-all duration-200"
        style={{
          left: `${tooltipPosition.x}px`,
          top: `${tooltipPosition.y}px`,
          transform: 'translate(calc(-100% - 16px), -50%)',
          opacity: tooltipPosition.x === 0 ? 0 : 1
        }}
      >
        <div
          className="
            bg-gradient-to-br from-[#0C212D] to-[#112C3E]
            text-white 
            rounded-xl 
            p-4 
            shadow-2xl 
            w-72 
            whitespace-normal 
            border-2
            border-[#EE7203]/30
          "
        >
          {/* Header del tooltip */}
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
            <div className="w-2 h-2 rounded-full bg-[#FF3816] animate-pulse"></div>
            <span className="text-[#FF3816]/80 text-xs uppercase tracking-wider font-bold">
              Error Found
            </span>
          </div>

          {/* Corrección */}
          <div className="mb-3">
            <div className="text-[#10b981] font-bold mb-1 flex items-center gap-2">
              <span className="text-lg">✓</span>
              <span>{correction.correction}</span>
            </div>
          </div>

          {/* Explicación */}
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <p className="text-white/90 text-xs leading-relaxed">
              {correction.explanation}
            </p>
          </div>

          {/* Flecha mejorada */}
          <div
            className="
              absolute 
              top-1/2 
              right-0 
              -translate-y-1/2 
              translate-x-full 
              w-0 
              h-0 
              border-t-[10px] 
              border-b-[10px] 
              border-l-[10px] 
              border-transparent 
              border-l-[#0C212D]
            "
          ></div>
        </div>
      </div>
    );

    return typeof window !== 'undefined' ? createPortal(tooltip, document.body) : null;
  };

  // Renderizar score de pronunciación
  const renderPronunciationScore = () => {
    if (!pronunciation) return null;

    const getScoreColor = (score: number) => {
      if (score >= 8) return "text-green-500";
      if (score >= 6) return "text-yellow-500";
      return "text-red-500";
    };

    const getScoreLabel = (score: number) => {
      if (score >= 8) return "Excellent";
      if (score >= 6) return "Good";
      return "Needs practice";
    };

    return (
      <div className="mt-3 pt-3 border-t border-white/20">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg"></span>
          <span className="text-xs font-bold uppercase opacity-90">Pronunciation</span>
        </div>
        
        <div className="bg-white/10 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs">Score:</span>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${getScoreColor(pronunciation.score)}`}>
                {pronunciation.score}/10
              </span>
              <span className="text-xs opacity-70">({getScoreLabel(pronunciation.score)})</span>
            </div>
          </div>
          
          {pronunciation.feedback && (
            <p className="text-xs leading-relaxed opacity-90">
              {pronunciation.feedback}
            </p>
          )}

          {pronunciation.commonIssues && pronunciation.commonIssues.length > 0 && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <span className="text-xs font-semibold opacity-90">Focus on:</span>
              <ul className="mt-1 space-y-1">
                {pronunciation.commonIssues.map((issue, idx) => (
                  <li key={idx} className="text-xs opacity-80 flex items-start gap-1">
                    <span>•</span>
                    <span>{issue}</span>
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
          "flex",
          isUser ? "justify-end" : "justify-start"
        )}
      >
        <div
          className={clsx(
            "max-w-[75%] px-5 py-4 rounded-2xl shadow-lg relative transition-all duration-200",
            isUser
              ? "bg-gradient-to-br from-[#EE7203] to-[#FF3816] text-white rounded-br-md"
              : "bg-white text-gray-800 rounded-bl-md border-2 border-gray-100"
          )}
        >
          {renderContentWithCorrections()}
          {renderPronunciationScore()}
        </div>
      </div>

      {renderTooltip()}
    </>
  );
}