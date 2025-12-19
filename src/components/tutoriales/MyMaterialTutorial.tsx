import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

// 🎯 Configuración de pasos del tutorial para MY MATERIAL
const TUTORIAL_STEPS = [
  {
    id: 'welcome-material',
    target: null,
    title: 'Your Study Materials! 📚',
    description: 'In this section you will find all the digital books, guides, and resources assigned to your level.',
    position: 'center',
    highlight: false,
  },
  {
    id: 'header-material',
    target: 'material-header',
    title: 'Your Personal Library',
    description: 'Here you will see a summary of your available resources. You can always tell what type of material you are viewing.',
    position: 'bottom',
    mobilePosition: 'bottom',
    highlight: true,
  },
  {
    id: 'stats-material',
    target: 'material-stats',
    title: 'Resource Counter 🔢',
    description: 'A quick overview of how many materials you currently have active and available to study.',
    position: 'bottom',
    mobilePosition: 'bottom',
    highlight: true,
  },
  {
    id: 'course-card',
    target: 'first-course-card',
    title: 'Course Card 📘',
    description: 'Each card represents a book or course. You can see the language, your grade, and the material title.',
    position: 'right',        // Desktop: Derecha
    mobilePosition: 'top', // Mobile: Abajo (para que entre en pantalla)
    highlight: true,
  },
  {
    id: 'course-info',
    target: 'first-course-info',
    title: 'Material Details ℹ️',
    description: 'Quickly check how many units this book has and which level of the European framework it corresponds to.',
    position: 'top',
    mobilePosition: 'top', // Mobile: Abajo es más seguro
    highlight: true,
  },
  {
    id: 'course-action',
    target: 'first-course-btn',
    title: 'Access the Content! 🚀',
    description: 'Click this button to open the interactive viewer and start studying your units.',
    position: 'top',
    mobilePosition: 'top',
    highlight: true,
  },
  {
    id: 'complete-material',
    target: null,
    title: 'Time to Study! 🌟',
    description: 'You now know how to access your materials. Select one and start your learning journey!',
    position: 'center',
    highlight: false,
  },
];

export default function MyMaterialTutorial() {
  const [isActive, setIsActive] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 📱 Estado para detectar si es móvil
  const [isMobile, setIsMobile] = useState(false);

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  // 📏 Detectar cambio de tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Chequear al inicio
    checkMobile();
    
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 📍 Determinar la posición actual (Desktop vs Mobile)
  const currentPosition = (isMobile && step.mobilePosition) ? step.mobilePosition : step.position;

  // 🎯 Actualización del highlight y posición del tooltip
  const updateHighlight = useCallback(() => {
    if (!step.target) {
      setHighlightRect(null);
      if (!isInitialized) {
        setTimeout(() => setIsInitialized(true), 10);
      }
      return;
    }

    const element = document.querySelector(`[data-tutorial="${step.target}"]`);
    
    if (element) {
      const rect = element.getBoundingClientRect();
      setHighlightRect(rect);
      
      const padding = 20;
      let top = 0;
      let left = 0;

      // Usamos currentPosition para el cálculo
      switch (currentPosition) {
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

      // Scroll suave al elemento
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center', // Importante para centrar horizontalmente en móvil
      });
    } else {
      // Si no encuentra el elemento, igual muestra el tooltip (se manejará en el render)
      setHighlightRect(null);
    }

    if (!isInitialized) {
      setTimeout(() => setIsInitialized(true), 10);
    }
  }, [step.target, currentPosition, isInitialized]);

  // Ejecutar actualización cuando cambia el step o la posición calculada
  useLayoutEffect(() => {
    updateHighlight();
  }, [updateHighlight]);

  // Listener para resize y scroll
  useEffect(() => {
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight, { capture: true });
    
    return () => {
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight, { capture: true });
    };
  }, [updateHighlight]);

  // 🔄 Navegación
  const handleNext = () => {
    if (isLastStep) {
      handleClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleClose = () => {
    setIsActive(false);
  };

  // 📍 Cálculo del transform del tooltip basado en currentPosition
  const getTooltipTransform = () => {
    if (currentPosition === 'center' || !highlightRect) {
      return 'translate(-50%, -50%)';
    }

    switch (currentPosition) {
      case 'top':
        return 'translate(-50%, -100%)';
      case 'left':
        return 'translate(-100%, -50%)';
      case 'right':
        return 'translate(0, -50%)';
      default:
        return 'translate(-50%, 0)';
    }
  };

  if (!isActive) return null;

  return (
    <div 
      className={`fixed inset-0 z-[10000] pointer-events-none transition-opacity duration-300 ${
        isInitialized ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* 🌑 Overlay con máscara SVG */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <mask id="tutorial-mask-material">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {highlightRect && step.highlight && (
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
          x="0" 
          y="0" 
          width="100%" 
          height="100%" 
          fill="rgba(0, 0, 0, 0.7)" 
          mask="url(#tutorial-mask-material)"
          onClick={handleClose}
        />
      </svg>

      {/* ✨ Borde brillante con animación */}
      {highlightRect && step.highlight && (
        <div
          className="absolute pointer-events-none rounded-2xl animate-pulse-border"
          style={{
            top: highlightRect.top - 8,
            left: highlightRect.left - 8,
            width: highlightRect.width + 16,
            height: highlightRect.height + 16,
            border: '4px solid #EE7203',
            transition: isInitialized ? 'all 300ms ease-out' : 'none',
          }}
        />
      )}

      {/* 💬 Tooltip */}
      <div
        className="absolute pointer-events-auto"
        style={{
          // Usamos currentPosition para decidir si centrar o usar coordenadas
          top: currentPosition === 'center' || !highlightRect ? '50%' : tooltipPosition.top,
          left: currentPosition === 'center' || !highlightRect ? '50%' : tooltipPosition.left,
          transform: getTooltipTransform(),
          transition: isInitialized ? 'all 300ms ease-out' : 'none',
          maxWidth: '500px',
          width: '90%',
          zIndex: 10002,
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          
          <div className="relative bg-gradient-to-br from-[#0C212D] via-[#112C3E] to-[#0C212D] p-6 pb-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#EE7203] opacity-20 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#EE7203] rounded-full animate-pulse"></div>
                <div className="w-1.5 h-1.5 bg-[#FF3816] rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-1 h-1 bg-[#EE7203] rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
              
              <button
                onClick={handleClose}
                className="text-white/60 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <h3 className="text-2xl font-black text-white mb-2">{step.title}</h3>
            <p className="text-sm text-gray-300 leading-relaxed">{step.description}</p>
          </div>

          <div className="p-6 bg-gray-50">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#0C212D]">
                  Step {currentStep + 1} of {TUTORIAL_STEPS.length}
                </span>
                <span className="text-xs font-bold text-[#EE7203]">
                  {Math.round(((currentStep + 1) / TUTORIAL_STEPS.length) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#EE7203] to-[#FF3816] transition-all duration-300 rounded-full"
                  style={{ width: `${((currentStep + 1) / TUTORIAL_STEPS.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrev}
                disabled={isFirstStep}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  isFirstStep
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white border-2 border-gray-200 text-[#0C212D] hover:border-[#EE7203] hover:bg-[#EE7203] hover:text-white'
                }`}
              >
                <ChevronLeft size={18} />
                Previous
              </button>

              <button
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#EE7203] to-[#FF3816] hover:from-[#FF3816] hover:to-[#EE7203] text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95"
              >
                {isLastStep ? (
                  <>
                    <Check size={18} />
                    Finish
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </div>

            <button
              onClick={handleClose}
              className="w-full mt-3 text-xs text-gray-500 hover:text-[#EE7203] font-semibold transition-colors"
            >
              Skip tutorial
            </button>
          </div>
        </div>

        {/* Flecha indicadora (Ajustada con currentPosition) */}
        {step.highlight && currentPosition !== 'center' && (
          <div
            className="absolute w-4 h-4 bg-white transform rotate-45"
            style={{
              ...(currentPosition === 'top' || currentPosition === 'bottom'
                ? {
                    [currentPosition === 'top' ? 'bottom' : 'top']: '-8px',
                    left: '50%',
                    marginLeft: '-8px',
                  }
                : {
                    [currentPosition === 'left' ? 'right' : 'left']: '-8px',
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