"use client";

import { useState } from "react";
import clsx from "clsx";

interface Correction {
  error: string;
  correction: string;
  explanation: string;
  position: number;
}

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  corrections?: Correction[];
}

export default function MessageBubble({
  role,
  content,
  corrections = [],
}: MessageBubbleProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const isUser = role === "user";

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

        // Error subrayado con tooltip
        parts.push(
          <span
            key={`error-${idx}`}
            className="relative inline-block group"
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <span className="underline decoration-wavy decoration-red-500 decoration-2 cursor-help">
              {error}
            </span>

            {hoveredIndex === idx && (
  <div
    className="
      absolute 
      top-1/2 
      left-0 
      -translate-x-full 
      -translate-y-1/2 
      z-[999999] 
      pointer-events-none
      opacity-0 
      group-hover:opacity-100 
      transition-all 
      duration-200 
      ease-out
    "
  >
    <div
      className="
        bg-gray-900 
        text-white 
        text-sm 
        rounded-lg 
        p-3 
        shadow-2xl 
        w-64 
        whitespace-normal 
        transform 
        -translate-x-2 
        group-hover:translate-x-0 
        transition-all 
        duration-200 
        ease-out
      "
    >
      <div className="font-semibold text-green-300 mb-1">
        ✓ {correction}
      </div>
      <div className="text-gray-300 text-xs">{explanation}</div>

      {/* Flecha */}
      <div
        className="
          absolute 
          top-1/2 
          right-0 
          -translate-y-1/2 
          translate-x-full 
          w-0 
          h-0 
          border-t-8 
          border-b-8 
          border-l-8 
          border-transparent 
          border-l-gray-900
        "
      ></div>
    </div>
  </div>
)}

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

      return <div className="whitespace-pre-wrap">{parts}</div>;
    }

    // Sin correcciones o mensaje del asistente
    return (
      <div
        className="whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  };

  return (
    <div
      className={clsx(
        "flex",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
  className={clsx(
    "max-w-[75%] px-4 py-3 rounded-2xl shadow-sm relative overflow-visible z-[9999]",
    isUser
      ? "bg-blue-600 text-white rounded-br-sm"
      : "bg-gray-100 text-gray-800 rounded-bl-sm"
  )}

      >
        {renderContentWithCorrections()}
      </div>
    </div>
  );
}