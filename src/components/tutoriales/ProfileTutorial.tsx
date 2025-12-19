import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

// 🎯 Configuración de pasos del tutorial para PERFIL
const TUTORIAL_STEPS = [
  {
    id: 'welcome-profile',
    target: null,
    title: 'Your Profile Settings 👤',
    description: 'Keep your personal information up to date to ensure your certificates are issued correctly.',
    position: 'center',
    highlight: false,
  },
  {
    id: 'personal-info',
    target: 'profile-personal-card',
    title: 'Personal Details 📝',
    description: 'Edit your First Name, Last Name, and ID Number (DNI). Please use your legal information.',
    position: 'right', // Se ajustará automáticamente si no hay espacio
    highlight: true,
  },
  {
    id: 'email-readonly',
    target: 'profile-email-container',
    title: 'Verified Email 🔒',
    description: 'Your email is linked to your corporate account and cannot be changed manually.',
    position: 'top',
    highlight: true,
  },
  {
    id: 'save-action',
    target: 'profile-save-btn',
    title: 'Save Changes 💾',
    description: 'Always remember to click here after making any modifications to your profile.',
    position: 'top',
    highlight: true,
  },
  {
    id: 'academic-info',
    target: 'profile-academic-card',
    title: 'Course Information 🎓',
    description: 'View your assigned Language and Level. Contact your teacher if you think this needs an update.',
    position: 'left', // Ideal para sidebars o columnas derechas
    highlight: true,
  },
  {
    id: 'complete-profile',
    target: null,
    title: 'Profile Ready! ✨',
    description: 'You can come back here anytime to update your details. Happy learning!',
    position: 'center',
    highlight: false,
  },
];

export default function ProfileTutorial() {
  const [isActive, setIsActive] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isInitialized, setIsInitialized] = useState(false);

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  // 🎯 Actualización del highlight y posición del tooltip
  const updateHighlight = React.useCallback(() => {
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

      // Scroll suave al elemento
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    } else {
      // Si no encuentra el elemento, igual muestra el tooltip centrado o limpia el rect
      setHighlightRect(null);
    }

    if (!isInitialized) {
      setTimeout(() => setIsInitialized(true), 10);
    }
  }, [step.target, step.position, isInitialized]);

  // Ejecutar actualización cuando cambia el step
  React.useLayoutEffect(() => {
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

  // 📍 Cálculo del transform del tooltip
  const getTooltipTransform = () => {
    if (step.position === 'center' || !highlightRect) {
      return 'translate(-50%, -50%)';
    }

    switch (step.position) {
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
          <mask id="tutorial-mask-profile">
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
          mask="url(#tutorial-mask-profile)"
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
          top: step.position === 'center' || !highlightRect ? '50%' : tooltipPosition.top,
          left: step.position === 'center' || !highlightRect ? '50%' : tooltipPosition.left,
          transform: getTooltipTransform(),
          transition: isInitialized ? 'all 300ms ease-out' : 'none',
          maxWidth: '380px',
          width: '85%',
          zIndex: 10002,
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          
          {/* Header con gradiente */}
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

          {/* Footer con controles */}
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

            {/* Botones de navegación */}
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

            {/* Skip button */}
            <button
              onClick={handleClose}
              className="w-full mt-2.5 text-[10px] text-gray-500 hover:text-[#EE7203] font-semibold transition-colors"
            >
              Skip tutorial
            </button>
          </div>
        </div>

        {/* Flecha indicadora */}
        {step.highlight && step.position !== 'center' && highlightRect && (
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