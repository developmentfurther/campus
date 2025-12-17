"use client";

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { FiX, FiChevronRight, FiChevronLeft } from "react-icons/fi";

interface TutorialStep {
  target: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
}

interface ChatTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

const tutorialSteps: TutorialStep[] = [
  {
    target: "[data-tutorial='language-level']",
    title: "Your Learning Profile",
    description: "Here you can see your target language and current level. This helps Mr Further adapt the conversation to your needs.",
    position: "bottom"
  },
  {
    target: "[data-tutorial='chat-area']",
    title: "Conversation Area",
    description: "This is where your conversation with Mr Further happens. All messages, corrections, and pronunciation feedback will appear here.",
    position: "left" 
  },
  {
    target: "[data-tutorial='text-input']",
    title: "Text Input",
    description: "Type your messages here. You can write naturally and practice your target language. Press Enter to send, or Shift+Enter for a new line.",
    position: "top"
  },
  {
    target: "[data-tutorial='voice-button']",
    title: "Voice Input",
    description: "Click this button to record your voice. Mr Further will transcribe it, analyze your pronunciation, and give you feedback on how you sound!",
    position: "top"
  },
  {
    target: "[data-tutorial='send-button']",
    title: "Send Button",
    description: "Click here to send your message. Mr Further will respond and help you practice the language in a conversational way.",
    position: "top"
  },
  {
    target: "[data-tutorial='end-button']",
    title: "End Conversation",
    description: "When you're done practicing, click here to receive a detailed summary with your strengths, mistakes, and personalized improvement plan.",
    position: "bottom"
  },
  {
  target: "[data-tutorial='chat-history']",
  title: "Conversation History",
  description: "Here you can access your previous conversations, review feedback, and track your progress over time.",
  position: "right"
}
];

export default function ChatboxTutorial({ onComplete, onSkip }: ChatTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updateHighlight = useCallback(() => {
    const step = tutorialSteps[currentStep];
    const element = document.querySelector(step.target);
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
    
    if (element) {
      const rect = element.getBoundingClientRect();
      setHighlightRect(rect);
      
      const padding = mobile ? 12 : 20;
      let top = 0;
      let left = 0;

      if (mobile) {
        // --- LÓGICA OPTIMIZADA PARA MOBILE ---
        left = window.innerWidth / 2;

        // CASO ESPECIAL: STEP 2 (Chat Area) o elementos muy altos
        const isChatArea = step.target.includes('chat-area');
        
        if (isChatArea) {
          // Si es el chat area, fijamos el tooltip al fondo de la pantalla (safe area)
          // para que no se corte como en tu imagen
          top = window.innerHeight - 20; 
        } else {
          // Para otros elementos, decidimos si arriba o abajo según espacio
          if (step.position === "top" || rect.bottom > window.innerHeight - 200) {
            top = rect.top - padding;
          } else {
            top = rect.bottom + padding;
          }
        }
      } else {
        // --- LÓGICA DESKTOP (SIN CAMBIOS) ---
        switch (step.position) {
          case "bottom":
            top = rect.bottom + padding;
            left = rect.left + rect.width / 2;
            break;
          case "top":
            top = rect.top - padding;
            left = rect.left + rect.width / 2;
            break;
          case "left":
            top = rect.top + rect.height / 2;
            left = rect.left - padding;
            break;
          case "right":
            top = rect.top + rect.height / 2;
            left = rect.right + padding;
            break;
          default:
            top = rect.bottom + padding;
            left = rect.left + rect.width / 2;
        }
      }

      setTooltipPosition({ top, left });
      
      if (!isInitialized) {
        setTimeout(() => setIsInitialized(true), 10);
      }
    }
  }, [currentStep, isInitialized]);

  useLayoutEffect(() => {
    updateHighlight();
  }, [updateHighlight]);

  useEffect(() => {
    window.addEventListener("resize", updateHighlight);
    return () => window.removeEventListener("resize", updateHighlight);
  }, [updateHighlight]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = tutorialSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tutorialSteps.length - 1;

  const getTooltipTransform = () => {
    if (isMobile) {
      const isChatArea = step.target.includes('chat-area');
      // Si es el chat area o está muy abajo, lo anclamos desde su base para que suba
      if (isChatArea || step.position === "top" || (highlightRect && highlightRect.bottom > window.innerHeight - 200)) {
        return "translate(-50%, -100%)";
      }
      return "translate(-50%, 0)";
    }
    
    switch (step.position) {
      case "top": return "translate(-50%, -100%)";
      case "left": return "translate(-100%, -50%)";
      case "right": return "translate(0, -50%)";
      default: return "translate(-50%, 0)";
    }
  };

  return (
    <div className={`fixed inset-0 z-999999 pointer-events-none transition-opacity duration-300 ${isInitialized ? 'opacity-100' : 'opacity-0'}`}>
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {highlightRect && (
              <rect
                x={highlightRect.left - 8}
                y={highlightRect.top - 8}
                width={highlightRect.width + 16}
                height={highlightRect.height + 16}
                rx="12"
                fill="black"
                className="transition-all duration-300"
              />
            )}
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(0, 0, 0, 0.75)" mask="url(#spotlight-mask)" />
      </svg>

      {highlightRect && (
        <div
          className="absolute border-4 border-[#EE7203] rounded-xl pointer-events-none animate-pulse-border"
          style={{
            top: highlightRect.top - 8,
            left: highlightRect.left - 8,
            width: highlightRect.width + 16,
            height: highlightRect.height + 16,
            transition: isInitialized ? "all 0.3s ease-out" : "none"
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute pointer-events-auto"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          transform: getTooltipTransform(),
          transition: isInitialized ? "all 0.3s ease-out" : "none",
          maxWidth: "92vw",
          width: isMobile ? "calc(100vw - 32px)" : "400px",
          // Evitamos que se pegue a los bordes verticales en mobile
          zIndex: 60
        }}
      >
        <div className={`bg-white rounded-2xl shadow-2xl relative ${isMobile ? 'p-4' : 'p-6'}`}>
          <button onClick={onSkip} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
            <FiX size={isMobile ? 18 : 20} />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-[#EE7203] text-white text-[10px] sm:text-xs font-bold rounded-full">
              Step {currentStep + 1}/{tutorialSteps.length}
            </span>
          </div>

          <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900 mb-1`}>
            {step.title}
          </h3>

          <p className={`text-gray-600 ${isMobile ? 'text-sm' : 'text-sm'} leading-tight mb-4`}>
            {step.description}
          </p>

          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={isFirstStep}
              className="flex items-center gap-1 text-gray-600 disabled:opacity-30"
            >
              <FiChevronLeft size={18} />
              <span className="text-sm font-medium">Prev</span>
            </button>

            <div className="flex gap-1.5">
              {tutorialSteps.map((_, idx) => (
                <div key={idx} className={`w-1.5 h-1.5 rounded-full ${idx === currentStep ? "bg-[#EE7203]" : "bg-gray-300"}`} />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-2 bg-[#EE7203] text-white rounded-lg"
            >
              <span className="text-sm font-medium">{isLastStep ? "Finish" : "Next"}</span>
              <FiChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Arrow pointer - Se oculta en el Step 2 de Mobile para evitar solapamiento */}
        {(!isMobile || !step.target.includes('chat-area')) && (
          <div
    className="absolute w-4 h-4 bg-white transform rotate-45"
    style={{
      // Posicionamiento vertical (para top/bottom)
      ...( (step.position === "top" || step.position === "bottom" || isMobile) ? {
        [step.position === "top" || (isMobile && highlightRect && highlightRect.bottom > window.innerHeight - 200) ? "bottom" : "top"]: "-8px",
        left: "50%",
        marginLeft: "-8px"
      } : {
        // Posicionamiento horizontal (para left/right en Desktop)
        [step.position === "left" ? "right" : "left"]: "-8px",
        top: "50%",
        marginTop: "-8px"
      })
    }}
  />
        )}
      </div>

      <style jsx global>{`
        @keyframes pulse-border {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .animate-pulse-border {
          animation: pulse-border 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}