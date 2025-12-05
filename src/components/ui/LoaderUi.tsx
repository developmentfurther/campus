"use client";
import { useState, useEffect } from "react";
import Image from 'next/image';

export default function LoaderUi() {
  // ⬇️ Controla que el fade-in se ejecute SOLO en el primer montaje
  const [firstMount, setFirstMount] = useState(true);

  useEffect(() => {
    setFirstMount(false);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-orange-50 to-gray-100 flex items-center justify-center z-50 overflow-hidden">
      
      {/* ===================== PARTICULAS DECORATIVAS ===================== */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-gradient-to-br from-orange-200 to-orange-300 opacity-20 blur-2xl animate-[float_6s_ease-in-out_infinite]" />
        <div className="absolute top-40 right-32 w-24 h-24 rounded-full bg-gradient-to-br from-red-200 to-red-300 opacity-20 blur-2xl animate-[float_7s_ease-in-out_infinite_1s]" />
        <div className="absolute bottom-32 left-40 w-40 h-40 rounded-full bg-gradient-to-br from-blue-200 to-blue-300 opacity-15 blur-2xl animate-[float_8s_ease-in-out_infinite_0.5s]" />
        <div className="absolute bottom-20 right-20 w-28 h-28 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 opacity-25 blur-2xl animate-[float_9s_ease-in-out_infinite_1.5s]" />
        
        {/* Iconos educativos flotantes */}
        <div className="absolute top-1/4 left-1/4 animate-[floatSlow_10s_ease-in-out_infinite] opacity-10">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#EE7203" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div className="absolute top-1/3 right-1/4 animate-[floatSlow_12s_ease-in-out_infinite_2s] opacity-10">
          <svg width="35" height="35" viewBox="0 0 24 24" fill="none" stroke="#FF3816" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
        </div>
        <div className="absolute bottom-1/3 left-1/3 animate-[floatSlow_11s_ease-in-out_infinite_1s] opacity-10">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#112C3E" strokeWidth="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
        </div>
        <div className="absolute bottom-1/4 right-1/3 animate-[floatSlow_13s_ease-in-out_infinite_3s] opacity-10">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#EE7203" strokeWidth="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        </div>
      </div>

      {/* ===================== LOGO + ANILLOS ===================== */}
      <div className="relative z-10">

        {/* Anillos decorativos */}
        <div className="absolute inset-0 -m-16 rounded-full border-2 border-orange-200 opacity-30 animate-[spin_20s_linear_infinite]" />
        <div className="absolute inset-0 -m-20 rounded-full border border-orange-100 opacity-20 animate-[spin_25s_linear_infinite_reverse]" />

        {/* CONTENEDOR DEL LOGO — fade-in solo primera vez */}
        <div
          className={
            firstMount
              ? "relative animate-[fadeIn_1.2s_ease-out_forwards]"
              : "relative opacity-100"
          }
        >
          {/* Glow respirando */}
          <div 
            className="absolute inset-0 -z-10 blur-3xl animate-[breatheGlow_2.5s_ease-in-out_infinite] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(238, 114, 3, 0.15) 0%, rgba(238, 114, 3, 0.08) 40%, transparent 70%)',
              transform: 'scale(1.5)'
            }}
          />

          {/* Logo con respiración */}
          <div className="animate-[breathe_2.5s_ease-in-out_infinite]">
            <Image
              src="/images/logo.png" 
              alt="Further Academy"
              width={192}
              height={192}
              className="drop-shadow-lg"
            />
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: scale(0.92);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes breatheGlow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1.5);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.6);
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
          33% { transform: translateY(-30px) translateX(20px) rotate(5deg); }
          66% { transform: translateY(-15px) translateX(-15px) rotate(-5deg); }
        }
      `}</style>
    </div>
  );
}
