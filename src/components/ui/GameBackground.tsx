// components/ui/GameBackground.tsx

export default function GameBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(#0C212D 1px, transparent 1px),
            linear-gradient(90deg, #0C212D 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Partículas hexagonales */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-pulse"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.3}s`,
            animationDuration: "3s",
            opacity: 0.1,
          }}
        >
          <svg width="40" height="46" viewBox="0 0 40 46">
            <polygon
              points="20,0 40,11.5 40,34.5 20,46 0,34.5 0,11.5"
              fill="none"
              stroke={i % 2 === 0 ? "#EE7203" : "#FF3816"}
              strokeWidth="2"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}
