export default function FancyBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none bg-gradient-to-br from-gray-50 via-orange-50 to-gray-100">
      
      {/* Círculos decorativos con más movimiento */}
      <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-gradient-to-br from-orange-200 to-orange-300 opacity-20 blur-2xl animate-[float_6s_ease-in-out_infinite]" />
      <div className="absolute top-40 right-32 w-24 h-24 rounded-full bg-gradient-to-br from-red-200 to-red-300 opacity-20 blur-2xl animate-[float_7s_ease-in-out_infinite_1s]" />
      <div className="absolute bottom-32 left-40 w-40 h-40 rounded-full bg-gradient-to-br from-blue-200 to-blue-300 opacity-15 blur-2xl animate-[float_8s_ease-in-out_infinite_0.5s]" />
      <div className="absolute bottom-20 right-20 w-28 h-28 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 opacity-25 blur-2xl animate-[float_9s_ease-in-out_infinite_1.5s]" />
      
      {/* Círculos adicionales para más vida */}
      <div className="absolute top-1/2 left-10 w-36 h-36 rounded-full bg-gradient-to-br from-orange-300 to-red-200 opacity-15 blur-3xl animate-[float_10s_ease-in-out_infinite_2s]" />
      <div className="absolute top-3/4 right-16 w-32 h-32 rounded-full bg-gradient-to-br from-red-300 to-orange-200 opacity-20 blur-2xl animate-[float_11s_ease-in-out_infinite_3s]" />

      {/* Iconos SVG flotantes - Birrete de graduación */}
      <div className="absolute top-1/4 left-1/4 animate-[floatRotate_10s_ease-in-out_infinite] opacity-40 drop-shadow-lg">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#EE7203" strokeWidth="2" className="animate-[pulse_3s_ease-in-out_infinite]">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      </div>

      {/* Bombilla de idea */}
      <div className="absolute top-1/3 right-1/4 animate-[floatRotate_12s_ease-in-out_infinite_2s] opacity-40 drop-shadow-lg">
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#FF3816" strokeWidth="2" className="animate-[pulse_3.5s_ease-in-out_infinite_0.5s]">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4M12 8h.01"/>
        </svg>
      </div>

      {/* Libro abierto */}
      <div className="absolute bottom-1/3 left-1/3 animate-[floatRotate_11s_ease-in-out_infinite_1s] opacity-40 drop-shadow-lg">
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#112C3E" strokeWidth="2" className="animate-[pulse_4s_ease-in-out_infinite_1s]">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
      </div>

      {/* Lápiz */}
      <div className="absolute bottom-1/4 right-1/3 animate-[floatRotate_13s_ease-in-out_infinite_3s] opacity-40 drop-shadow-lg">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#EE7203" strokeWidth="2" className="animate-[pulse_3.2s_ease-in-out_infinite_1.5s]">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      </div>

      {/* Iconos adicionales para más dinamismo */}
      {/* Estrella */}
      <div className="absolute top-1/2 right-1/5 animate-[floatRotate_14s_ease-in-out_infinite_2.5s] opacity-35 drop-shadow-lg">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF3816" strokeWidth="2" className="animate-[pulse_3.8s_ease-in-out_infinite_2s]">
          <polygon points="12,2 15,8.5 22,9.3 17,14 18.5,21 12,17.5 5.5,21 7,14 2,9.3 9,8.5"/>
        </svg>
      </div>

      {/* Átomo/Ciencia */}
      <div className="absolute bottom-1/2 left-1/5 animate-[floatRotate_15s_ease-in-out_infinite_1.5s] opacity-35 drop-shadow-lg">
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#112C3E" strokeWidth="2" className="animate-[pulse_4.2s_ease-in-out_infinite_2.5s]">
          <circle cx="12" cy="12" r="2"/>
          <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/>
          <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-60 12 12)"/>
        </svg>
      </div>

      {/* Diploma enrollado */}
      <div className="absolute top-2/3 left-1/6 animate-[floatRotate_16s_ease-in-out_infinite_4s] opacity-35 drop-shadow-lg">
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#EE7203" strokeWidth="2" className="animate-[pulse_3.6s_ease-in-out_infinite_3s]">
          <rect x="3" y="4" width="18" height="16" rx="2"/>
          <path d="M7 8h10M7 12h10M7 16h6"/>
        </svg>
      </div>

      {/* Calculadora */}
      <div className="absolute top-3/4 right-1/6 animate-[floatRotate_17s_ease-in-out_infinite_3.5s] opacity-35 drop-shadow-lg">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FF3816" strokeWidth="2" className="animate-[pulse_4.5s_ease-in-out_infinite_3.5s]">
          <rect x="4" y="2" width="16" height="20" rx="2"/>
          <rect x="7" y="6" width="10" height="4"/>
          <line x1="7" y1="14" x2="7" y2="14"/>
          <line x1="12" y1="14" x2="12" y2="14"/>
          <line x1="17" y1="14" x2="17" y2="14"/>
        </svg>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }
        
        @keyframes floatRotate {
          0%, 100% {
            transform: translateY(0) translateX(0) rotate(0deg);
          }
          25% {
            transform: translateY(-25px) translateX(15px) rotate(8deg);
          }
          50% {
            transform: translateY(-35px) translateX(-10px) rotate(-5deg);
          }
          75% {
            transform: translateY(-20px) translateX(-20px) rotate(10deg);
          }
        }
      `}</style>
    </div>
  );
}