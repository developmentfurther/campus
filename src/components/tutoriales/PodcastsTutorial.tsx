import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

// 🎯 Configuración de pasos (Igual que antes)
const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    target: null,
    title: 'Welcome to Further Cast! 🎧',
    description: 'Discover our podcast designed to boost your English listening skills and professional vocabulary.',
    position: 'center',
    highlight: false,
  },
  {
    id: 'header',
    target: 'podcasts-header',
    title: 'Further Records Podcast',
    description: 'Learn at your own pace with episodes created specifically for English learners in professional contexts.',
    position: 'bottom',
    highlight: true,
  },
  {
    id: 'podcast-card',
    target: 'podcast-main-card',
    title: 'Episode Library 📚',
    description: 'Browse all available podcast episodes. Each episode is designed to improve your listening comprehension and vocabulary.',
    position: 'left',
    highlight: true,
  },
  {
    id: 'episode-item',
    target: 'episode-item-0',
    title: 'Episode Details 🎙️',
    description: 'Each episode shows the title, description, release date, and duration. Click the play button to listen in the integrated player.',
    position: 'top',
    highlight: true,
  },
  {
    id: 'platforms',
    target: 'podcast-platforms',
    title: 'Listen Anywhere 🌐',
    description: 'You can also find Further Records on Apple Podcasts, Amazon Music, and YouTube. Choose your favorite platform!',
    position: 'top',
    highlight: true,
  },
  {
    id: 'benefits',
    target: 'podcast-benefits',
    title: 'Learning Benefits ⚡',
    description: 'Our podcast helps you develop real vocabulary, improve pronunciation, and practice listening with bite-sized episodes.',
    position: 'top',
    highlight: true,
  },
  {
    id: 'complete',
    target: null,
    title: 'Ready to Listen! 🎉',
    description: 'Start exploring episodes and improve your English with Further Records. Happy listening!',
    position: 'center',
    highlight: false,
  },
];

export default function PodcastsTutorial() {
  const [isActive, setIsActive] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 🆕 Nuevo estado para ocultar todo mientras scrollea
  const [isMoving, setIsMoving] = useState(false); 
  const scrollTimeoutRef = useRef(null);

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  // 🎯 Función pura solo para calcular coordenadas (sin scroll)
  const calculatePositions = useCallback(() => {
    if (!step.target) {
      setHighlightRect(null);
      return;
    }

    const element = document.querySelector(`[data-tutorial="${step.target}"]`);
    
    if (element) {
      const rect = element.getBoundingClientRect();
      setHighlightRect(rect);
      
      const padding = 20;
      let top = 0;
      let left = 0;

      switch (step.position) {
        case 'bottom':
          top = rect.bottom + padding;
          left = rect.left + rect.width / 2;
          break;
        case 'top':
          top = rect.top - padding;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - padding;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + padding;
          break;
        default:
          top = rect.bottom + padding;
          left = rect.left + rect.width / 2;
      }
      setTooltipPosition({ top, left });
    } else {
      setHighlightRect(null);
    }
  }, [step.target, step.position]);

  // 🎯 Efecto principal: Maneja el scroll y la visibilidad cuando cambia el STEP
  useEffect(() => {
    if (!step.target) {
      // Si no hay target (pasos centrales), mostramos inmediatamente
      setIsMoving(false);
      calculatePositions();
      if (!isInitialized) setIsInitialized(true);
      return;
    }

    const element = document.querySelector(`[data-tutorial="${step.target}"]`);
    if (element) {
      // 1. Ocultamos el tutorial antes de movernos
      setIsMoving(true);

      // 2. Iniciamos el scroll suave
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      // 3. Detectamos cuándo termina el scroll
      // La lógica es: si no hay eventos de scroll por 100ms, asumimos que terminó
      const handleScrollStop = () => {
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        
        scrollTimeoutRef.current = setTimeout(() => {
          // El scroll terminó
          calculatePositions(); // Recalculamos posición final
          setIsMoving(false); // Mostramos el tutorial
          if (!isInitialized) setIsInitialized(true);
          
          window.removeEventListener('scroll', handleScrollStop);
        }, 100); // 100ms de silencio = fin del scroll
      };

      // Escuchamos el scroll para saber cuándo termina
      window.addEventListener('scroll', handleScrollStop);
      
      // Fallback de seguridad: si el elemento ya estaba en pantalla y no hubo scroll
      scrollTimeoutRef.current = setTimeout(() => {
         calculatePositions();
         setIsMoving(false);
         if (!isInitialized) setIsInitialized(true);
         window.removeEventListener('scroll', handleScrollStop);
      }, 500); // Si en 500ms no pasó nada, forzamos mostrarlo

    } else {
      // Si no encuentra elemento, mostramos igual (centrado o fallback)
      setIsMoving(false);
    }

    return () => {
      window.removeEventListener('scroll', calculatePositions); // Limpieza
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [currentStep, step.target, calculatePositions, isInitialized]);


  // Listener para resize (solo recalcula si ya estamos quietos)
  useEffect(() => {
    const handleResize = () => {
      if (!isMoving) calculatePositions();
    };
    
    // Para scroll manual del usuario (no automático), queremos que el highlight siga al elemento
    // pero sin la lógica de ocultar/mostrar del cambio de paso.
    const handleManualScroll = () => {
        if (!isMoving) calculatePositions();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleManualScroll, { capture: true });
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleManualScroll, { capture: true });
    };
  }, [calculatePositions, isMoving]);

  // 🔄 Navegación
  const handleNext = () => {
    if (isLastStep) handleClose();
    else setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => {
    if (!isFirstStep) setCurrentStep(prev => prev - 1);
  };

  const handleClose = () => setIsActive(false);

  // 📍 Transform
  const getTooltipTransform = () => {
    if (step.position === 'center' || !highlightRect) return 'translate(-50%, -50%)';
    switch (step.position) {
      case 'top': return 'translate(-50%, -100%)';
      case 'left': return 'translate(-100%, -50%)';
      case 'right': return 'translate(0, -50%)';
      default: return 'translate(-50%, 0)';
    }
  };

  if (!isActive) return null;

  return (
    <div 
      className={`fixed inset-0 z-[10000] pointer-events-none transition-opacity duration-300 ${
        // 🌟 CLAVE: Si se está inicializando O se está moviendo, opacidad 0
        isInitialized && !isMoving ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* 🌑 Overlay con máscara SVG */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <mask id="tutorial-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {highlightRect && step.highlight && !isMoving && (
              <rect
                x={highlightRect.left - 8}
                y={highlightRect.top - 8}
                width={highlightRect.width + 16}
                height={highlightRect.height + 16}
                rx="16"
                fill="black"
                className="transition-all duration-300"
              />
            )}
          </mask>
        </defs>
        <rect 
          x="0" y="0" width="100%" height="100%" 
          fill="rgba(0, 0, 0, 0.7)" 
          mask="url(#tutorial-mask)"
        />
      </svg>

      {/* ✨ Borde brillante */}
      {highlightRect && step.highlight && !isMoving && (
        <div
          className="absolute pointer-events-none rounded-2xl animate-pulse-border"
          style={{
            top: highlightRect.top - 8,
            left: highlightRect.left - 8,
            width: highlightRect.width + 16,
            height: highlightRect.height + 16,
            border: '4px solid #EE7203',
            transition: 'all 300ms ease-out',
          }}
        />
      )}

      {/* 💬 Tooltip */}
      <div
        className="absolute pointer-events-auto"
        style={{
          top: step.position === 'center' || !highlightRect ? '50%' : tooltipPosition.top,
          left: step.position === 'center' || !highlightRect ? '50%' : tooltipPosition.left,
          transform: getTooltipTransform(),
          transition: 'all 300ms ease-out',
          maxWidth: '380px',
          width: '85%',
          zIndex: 10002,
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-[#0C212D] via-[#112C3E] to-[#0C212D] p-5 pb-6">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#EE7203] opacity-20 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#EE7203] rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-[#FF3816] rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-0.5 h-0.5 bg-[#EE7203] rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
              
              <button
                onClick={handleClose}
                className="text-white/60 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <h3 className="text-xl font-black text-white mb-1.5">{step.title}</h3>
            <p className="text-xs text-gray-300 leading-relaxed">{step.description}</p>
          </div>

          {/* Footer */}
          <div className="p-5 bg-gray-50">
            {/* Progress bar */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-[#0C212D]">
                  Step {currentStep + 1} of {TUTORIAL_STEPS.length}
                </span>
                <span className="text-[10px] font-bold text-[#EE7203]">
                  {Math.round(((currentStep + 1) / TUTORIAL_STEPS.length) * 100)}%
                </span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#EE7203] to-[#FF3816] transition-all duration-300 rounded-full"
                  style={{ width: `${((currentStep + 1) / TUTORIAL_STEPS.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={isFirstStep}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs transition-all ${
                  isFirstStep
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white border-2 border-gray-200 text-[#0C212D] hover:border-[#EE7203] hover:bg-[#EE7203] hover:text-white'
                }`}
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <button
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#EE7203] to-[#FF3816] hover:from-[#FF3816] hover:to-[#EE7203] text-white rounded-lg font-bold text-xs transition-all shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95"
              >
                {isLastStep ? (
                  <>
                    <Check size={16} />
                    Finish
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>

            <button
              onClick={handleClose}
              className="w-full mt-2.5 text-[10px] text-gray-500 hover:text-[#EE7203] font-semibold transition-colors"
            >
              Skip tutorial
            </button>
          </div>
        </div>

        {/* Flecha indicadora */}
        {step.highlight && step.position !== 'center' && highlightRect && !isMoving && (
          <div
            className="absolute w-4 h-4 bg-white transform rotate-45"
            style={{
              ...(step.position === 'top' || step.position === 'bottom'
                ? {
                    [step.position === 'top' ? 'bottom' : 'top']: '-8px',
                    left: '50%',
                    marginLeft: '-8px',
                  }
                : {
                    [step.position === 'left' ? 'right' : 'left']: '-8px',
                    top: '50%',
                    marginTop: '-8px',
                  }),
            }}
          />
        )}
      </div>

      <style jsx>{`
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