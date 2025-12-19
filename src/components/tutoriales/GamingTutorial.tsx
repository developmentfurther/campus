import React, { useState, useEffect } from 'react';
import { FiX, FiChevronRight, FiChevronLeft, FiCheck, FiTarget } from 'react-icons/fi';

// 🎯 Configuración DETALLADA por juego
const TUTORIAL_STEPS = [
  {
    id: 'welcome-gaming',
    target: null,
    title: 'Welcome to Game Zone! 🎮',
    description: 'Learning English doesn’t have to be boring. Here you’ll test your skills while playing.',
    position: 'center',
    highlight: false,
    scrollBehavior: 'center',
  },
  {
    id: 'header-gaming',
    target: 'gaming-header',
    title: 'Your Game Dashboard',
    description: 'Explore our collection of educational games. Each one trains a different skill: vocabulary, grammar, or comprehension.',
    position: 'bottom',
    highlight: true,
    scrollBehavior: 'nearest',
  },
  // 🕹️ FIRST 3 GAMES (NO AGGRESSIVE SCROLL)
  {
    id: 'game-hangman',
    target: 'game-card-hangman',
    title: 'Hangman 🎯',
    description: 'The classic game. Guess the hidden word letter by letter before the drawing is completed. Perfect for building vocabulary!',
    position: 'top',
    highlight: true,
    scrollBehavior: 'nearest',
  },
  {
    id: 'game-emojiIdioms',
    target: 'game-card-emojiIdioms',
    title: 'Emoji Idioms 📚',
    description: 'Think in English! Decode common idioms using only emojis. Example: 🌧️🐈🐕 = "It\'s raining cats and dogs".',
    position: 'top',
    highlight: true,
    scrollBehavior: 'nearest',
  },
  {
    id: 'game-wordScramble',
    target: 'game-card-wordScramble',
    title: 'Word Scramble ⚡',
    description: 'We give you scrambled letters and you must type the correct word. A challenge of mental speed and spelling.',
    position: 'top',
    highlight: true,
    scrollBehavior: 'nearest',
  },
  // 🕹️ LAST 3 GAMES (SCROLL ENABLED)
  {
    id: 'game-wordle',
    target: 'game-card-wordle',
    title: 'Wordle Challenge 🧩',
    description: 'You have 6 attempts to guess the 5-letter word. Green: correct letter and position. Yellow: correct letter, wrong position.',
    position: 'top',
    highlight: true,
    scrollBehavior: 'center',
  },
  {
    id: 'game-sentenceBuilder',
    target: 'game-card-sentenceBuilder',
    title: 'Sentence Builder 📝',
    description: 'Drag and drop words to form grammatically correct sentences. Great for understanding language structure.',
    position: 'top',
    highlight: true,
    scrollBehavior: 'center',
  },
  {
    id: 'game-errorFinder',
    target: 'game-card-errorFinder',
    title: 'Error Finder ⚠️',
    description: 'Become the teacher. Read the text, find the hidden grammar mistakes, and click on them to fix them.',
    position: 'top',
    highlight: true,
    scrollBehavior: 'center',
  },
  {
    id: 'game-help-tip',
    target: 'game-card-hangman',
    title: 'Need Help? ❓',
    description: 'Hover over any card and look for the question mark (?) icon to see detailed rules without entering the game.',
    position: 'right',
    highlight: true,
    scrollBehavior: 'nearest',
  },
  {
    id: 'complete-gaming',
    target: null,
    title: 'Let’s Play! 🚀',
    description: 'You now know all your challenges. Pick one and start leveling up.',
    position: 'center',
    highlight: false,
    scrollBehavior: 'center',
  },
];


export default function GamingTutorial() {
  const [isActive, setIsActive] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState(null);
  const [highlightRect, setHighlightRect] = useState(null);

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  // 🎯 Lógica de rastreo
  useEffect(() => {
    if (!isActive || !step.target) {
      setHighlightedElement(null);
      setHighlightRect(null);
      return;
    }

    const element = document.querySelector(`[data-tutorial="${step.target}"]`);
    
    if (element) {
      setHighlightedElement(element);
      
      const updateRect = () => {
        window.requestAnimationFrame(() => {
          if (element) {
            const rect = element.getBoundingClientRect();
            setHighlightRect(rect);
          }
        });
      };

      // 1. Scroll Controlado
      // Usamos la propiedad scrollBehavior definida en el array TUTORIAL_STEPS
      element.scrollIntoView({
        behavior: 'smooth',
        block: step.scrollBehavior || 'center', // Usa 'nearest' para los primeros, 'center' para los últimos
      });

      // 2. Cálculo inicial
      updateRect();

      // 3. Listeners
      window.addEventListener('scroll', updateRect, { capture: true });
      window.addEventListener('resize', updateRect);

      return () => {
        window.removeEventListener('scroll', updateRect, { capture: true });
        window.removeEventListener('resize', updateRect);
      };
    } else {
        setHighlightedElement(null);
        setHighlightRect(null);
    }
  }, [isActive, step.target, currentStep, step.scrollBehavior]); // Agregué step.scrollBehavior a las dependencias

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
    setHighlightedElement(null);
    setHighlightRect(null);
  };

  // 📍 Posición del tooltip
  const getTooltipPosition = () => {
    if (!highlightRect || step.position === 'center') {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '500px',
        width: '90%',
      };
    }

    const tooltipWidth = 400;
    const spacing = 20;

    let style = {
      position: 'fixed',
      maxWidth: `${tooltipWidth}px`,
      width: '90%',
      zIndex: 10002,
    };

    switch (step.position) {
      case 'bottom':
        style.top = `${highlightRect.bottom + spacing}px`;
        style.left = `${highlightRect.left + highlightRect.width / 2}px`;
        style.transform = 'translateX(-50%)';
        break;
      case 'top':
        style.bottom = `${window.innerHeight - highlightRect.top + spacing}px`;
        style.left = `${highlightRect.left + highlightRect.width / 2}px`;
        style.transform = 'translateX(-50%)';
        break;
      case 'left':
        style.top = `${highlightRect.top + highlightRect.height / 2}px`;
        style.right = `${window.innerWidth - highlightRect.left + spacing}px`;
        style.transform = 'translateY(-50%)';
        break;
      case 'right':
        style.top = `${highlightRect.top + highlightRect.height / 2}px`;
        style.left = `${highlightRect.right + spacing}px`;
        style.transform = 'translateY(-50%)';
        break;
    }

    return style;
  };

  if (!isActive) return null;

  return (
    <>
      {/* 🌑 Overlay */}
      {step.highlight && highlightRect ? (
        <svg
          className="fixed inset-0 pointer-events-none z-[10000]"
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            <mask id="tutorial-mask-gaming">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={highlightRect.left - 8}
                y={highlightRect.top - 8}
                width={highlightRect.width + 16}
                height={highlightRect.height + 16}
                rx="24"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.7)"
            mask="url(#tutorial-mask-gaming)"
          />
        </svg>
      ) : (
        <div 
          className="fixed inset-0 bg-black/70 z-[10000] pointer-events-auto"
          onClick={handleClose}
        />
      )}

      {/* ✨ Borde brillante */}
      {highlightRect && step.highlight && (
        <div
          className="fixed z-[10001] pointer-events-none rounded-3xl"
          style={{
            top: `${highlightRect.top - 8}px`,
            left: `${highlightRect.left - 8}px`,
            width: `${highlightRect.width + 16}px`,
            height: `${highlightRect.height + 16}px`,
            boxShadow: '0 0 0 4px rgba(238, 114, 3, 0.8), 0 0 20px 8px rgba(238, 114, 3, 0.4)',
            transition: 'all 300ms ease-in-out',
          }}
        />
      )}

      {/* 💬 Tooltip */}
      <div
        className="z-[10002] animate-in fade-in slide-in-from-bottom-4 duration-300"
        style={getTooltipPosition()}
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
                <FiX size={20} />
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
                <FiChevronLeft size={18} />
                Previous
              </button>

              <button
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#EE7203] to-[#FF3816] hover:from-[#FF3816] hover:to-[#EE7203] text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95"
              >
                {isLastStep ? (
                  <>
                    <FiCheck size={18} />
                    Finish
                  </>
                ) : (
                  <>
                    Next
                    <FiChevronRight size={18} />
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
      </div>
    </>
  );
}