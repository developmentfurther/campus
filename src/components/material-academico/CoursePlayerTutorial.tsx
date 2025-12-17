// "use client";

// import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
// import { FiX, FiChevronRight, FiChevronLeft } from "react-icons/fi";

// interface TutorialStep {
//   target: string;
//   title: string;
//   description: string;
//   position?: "top" | "bottom" | "left" | "right";
// }

// interface CoursePlayerTutorialProps {
//   onComplete: () => void;
//   onSkip: () => void;
// }

// const tutorialSteps: TutorialStep[] = [
//   {
//     target: "[data-tutorial='back-home']",
//     title: "Back to Dashboard",
//     description: "Click here anytime to return to your main dashboard and see all your available courses.",
//     position: "bottom"
//   },
//   {
//     target: "[data-tutorial='sidebar-units']",
//     title: "Course Units",
//     description: "Here you'll find all the units of your course. Click on any unit to expand it and see its lessons. Completed lessons are marked with a green checkmark.",
//     position: "right"
//   },
//   {
//     target: "[data-tutorial='lesson-header']",
//     title: "Current Lesson",
//     description: "This shows the lesson you're currently viewing. You can see if it's completed or in progress.",
//     position: "bottom"
//   },
//   {
//     target: "[data-tutorial='video-player']",
//     title: "Video Content",
//     description: "Watch instructional videos here. The system tracks your progress automatically when you finish watching.",
//     position: "bottom"
//   },
//   {
//     target: "[data-tutorial='content-tabs']",
//     title: "Content Navigation",
//     description: "Switch between Theory, Vocabulary, and Exercises using these tabs. Each lesson may have different types of content.",
//     position: "top"
//   },
//   {
//     target: "[data-tutorial='theory-content']",
//     title: "Theory Section",
//     description: "Read and study the theoretical content of each lesson. This includes explanations, examples, and detailed information.",
//     position: "left"
//   },
//   {
//     target: "[data-tutorial='exercises-section']",
//     title: "Practice Exercises",
//     description: "Test your knowledge with interactive exercises. You'll receive immediate feedback on your answers.",
//     position: "left"
//   },
//   {
//     target: "[data-tutorial='progress-sidebar']",
//     title: "Progress Tracker",
//     description: "Monitor your course progress here. You can see completed lessons, total lessons, and your overall completion percentage.",
//     position: "left"
//   },
//   {
//     target: "[data-tutorial='bibliography-download']",
//     title: "Download Materials",
//     description: "Download a PDF with all the unit's bibliography, theory, vocabulary, and exercises for offline study.",
//     position: "left"
//   },
//   {
//     target: "[data-tutorial='next-lesson']",
//     title: "Continue Learning",
//     description: "When you finish a lesson, click here to move to the next one. Your progress will be saved automatically.",
//     position: "top"
//   }
// ];

// export default function CoursePlayerTutorial({ onComplete, onSkip }: CoursePlayerTutorialProps) {
//   const [currentStep, setCurrentStep] = useState(0);
//   const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
//   const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
//   const [isInitialized, setIsInitialized] = useState(false);
//   const tooltipRef = useRef<HTMLDivElement>(null);

//   const updateHighlight = useCallback(() => {
//   const step = tutorialSteps[currentStep];
//   const element = document.querySelector(step.target) as HTMLElement | null;

//   if (!element || !tooltipRef.current) return;

//   const rect = element.getBoundingClientRect();
//   const tooltipRect = tooltipRef.current.getBoundingClientRect();

//   // 🔥 Convertimos a coordenadas absolutas reales
//   const scrollX = window.scrollX;
//   const scrollY = window.scrollY;

//   const padding = 16;
//   let top = 0;
//   let left = 0;

//   switch (step.position) {
//     case "bottom":
//       top = rect.bottom + scrollY + padding;
//       left = rect.left + scrollX + rect.width / 2 - tooltipRect.width / 2;
//       break;

//     case "top":
//       top = rect.top + scrollY - tooltipRect.height - padding;
//       left = rect.left + scrollX + rect.width / 2 - tooltipRect.width / 2;
//       break;

//     case "left":
//       top = rect.top + scrollY + rect.height / 2 - tooltipRect.height / 2;
//       left = rect.left + scrollX - tooltipRect.width - padding;
//       break;

//     case "right":
//       top = rect.top + scrollY + rect.height / 2 - tooltipRect.height / 2;
//       left = rect.right + scrollX + padding;
//       break;

//     default:
//       top = rect.bottom + scrollY + padding;
//       left = rect.left + scrollX + rect.width / 2 - tooltipRect.width / 2;
//   }

//   // 🧱 Clamp al viewport
//   const minMargin = 12;
//   const maxLeft = scrollX + window.innerWidth - tooltipRect.width - minMargin;
//   const maxTop = scrollY + window.innerHeight - tooltipRect.height - minMargin;

//   left = Math.max(scrollX + minMargin, Math.min(left, maxLeft));
//   top = Math.max(scrollY + minMargin, Math.min(top, maxTop));

//   setHighlightRect(rect);
//   setTooltipPosition({ top, left });

//   if (!isInitialized) {
//     requestAnimationFrame(() => setIsInitialized(true));
//   }
// }, [currentStep, isInitialized]);


//   useLayoutEffect(() => {
//     updateHighlight();
//   }, [updateHighlight]);

//   useEffect(() => {
//     window.addEventListener("resize", updateHighlight);
//     window.addEventListener("scroll", updateHighlight, true); // 👈 CRÍTICO
//     return () => {
//     window.removeEventListener("resize", updateHighlight);
//     window.removeEventListener("scroll", updateHighlight, true);
//   };
//   }, [updateHighlight]);

//   const handleNext = () => {
//     if (currentStep < tutorialSteps.length - 1) {
//       setCurrentStep(currentStep + 1);
//     } else {
//       onComplete();
//     }
//   };

//   const handlePrev = () => {
//     if (currentStep > 0) {
//       setCurrentStep(currentStep - 1);
//     }
//   };

//   const step = tutorialSteps[currentStep];
//   const isFirstStep = currentStep === 0;
//   const isLastStep = currentStep === tutorialSteps.length - 1;

//   return (
//     <div 
//       className={`fixed inset-0 z-50 pointer-events-none transition-opacity duration-300 ${isInitialized ? 'opacity-100' : 'opacity-0'}`}
//     >
//       {/* Dark overlay with cutout */}
//       <svg className="absolute inset-0 w-full h-full pointer-events-auto">
//         <defs>
//           <mask id="spotlight-mask">
//             <rect x="0" y="0" width="100%" height="100%" fill="white" />
//             {highlightRect && (
//               <rect
//                 x={highlightRect.left - 8}
//                 y={highlightRect.top - 8}
//                 width={highlightRect.width + 16}
//                 height={highlightRect.height + 16}
//                 rx="12"
//                 fill="black"
//                 className="transition-all duration-300"
//               />
//             )}
//           </mask>
//         </defs>
//         <rect
//           x="0"
//           y="0"
//           width="100%"
//           height="100%"
//           fill="rgba(0, 0, 0, 0.75)"
//           mask="url(#spotlight-mask)"
//         />
//       </svg>

//       {/* Highlight border */}
//       {highlightRect && (
//         <div
//           className="absolute border-4 border-[#EE7203] rounded-xl pointer-events-none animate-pulse-border"
//           style={{
//             top: highlightRect.top - 8,
//             left: highlightRect.left - 8,
//             width: highlightRect.width + 16,
//             height: highlightRect.height + 16,
//             transition: isInitialized ? "all 0.3s ease-out" : "none"
//           }}
//         />
//       )}

//       {/* Tooltip */}
//       <div
//         ref={tooltipRef}
//         className="absolute pointer-events-auto"
//         style={{
//           top: tooltipPosition.top,
//           left: tooltipPosition.left,
//           transform: step.position === "top" 
//             ? "translate(-50%, -100%)" 
//             : step.position === "left"
//             ? "translate(-100%, -50%)"
//             : step.position === "right"
//             ? "translate(0, -50%)"
//             : "translate(-50%, 0)",
//           transition: isInitialized ? "all 0.3s ease-out" : "none",
//           maxWidth: "90vw",
//           width: "min(400px, 90vw)"
//         }}
//       >
//         <div className="bg-white rounded-2xl shadow-2xl p-6 relative">
//           {/* Close button */}
//           <button
//             onClick={onSkip}
//             className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
//           >
//             <FiX size={20} />
//           </button>

//           {/* Step indicator */}
//           <div className="flex items-center gap-2 mb-3">
//             <span className="px-3 py-1 bg-[#EE7203] text-white text-xs font-bold rounded-full">
//               Step {currentStep + 1}/{tutorialSteps.length}
//             </span>
//           </div>

//           {/* Title */}
//           <h3 className="text-xl font-bold text-gray-900 mb-2 pr-8">
//             {step.title}
//           </h3>

//           {/* Description */}
//           <p className="text-gray-600 text-sm leading-relaxed mb-6">
//             {step.description}
//           </p>

//           {/* Navigation */}
//           <div className="flex items-center justify-between">
//             <button
//               onClick={handlePrev}
//               disabled={isFirstStep}
//               className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
//             >
//               <FiChevronLeft size={18} />
//               <span className="text-sm font-medium">Previous</span>
//             </button>

//             <div className="flex gap-1.5">
//               {tutorialSteps.map((_, idx) => (
//                 <div
//                   key={idx}
//                   className={`w-2 h-2 rounded-full transition-colors ${
//                     idx === currentStep ? "bg-[#EE7203]" : "bg-gray-300"
//                   }`}
//                 />
//               ))}
//             </div>

//             <button
//               onClick={handleNext}
//               className="flex items-center gap-2 px-4 py-2 bg-[#EE7203] text-white rounded-lg hover:bg-[#FF3816] transition-colors"
//             >
//               <span className="text-sm font-medium">
//                 {isLastStep ? "Finish" : "Next"}
//               </span>
//               <FiChevronRight size={18} />
//             </button>
//           </div>
//         </div>

//         {/* Arrow pointer */}
//         <div
//           className="absolute w-4 h-4 bg-white transform rotate-45"
//           style={{
//             [step.position === "top" ? "bottom" : step.position === "bottom" ? "top" : step.position === "left" ? "right" : "left"]: "-8px",
//             [step.position === "top" || step.position === "bottom" ? "left" : "top"]: "50%",
//             [step.position === "top" || step.position === "bottom" ? "marginLeft" : "marginTop"]: "-8px"
//           }}
//         />
//       </div>

//       <style jsx global>{`
//         @keyframes pulse-border {
//           0%, 100% {
//             opacity: 1;
//           }
//           50% {
//             opacity: 0.6;
//           }
//         }

//         .animate-pulse-border {
//           animation: pulse-border 2s ease-in-out infinite;
//         }
//       `}</style>
//     </div>
//   );
// }