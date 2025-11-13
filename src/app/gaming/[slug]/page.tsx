"use client";
import { useParams, useRouter } from "next/navigation";
import { GAMES_MAP } from "../games";
import { FiArrowLeft } from "react-icons/fi";

export default function GameRunner() {
  const { slug } = useParams();
  const router = useRouter();
  const GameComponent = GAMES_MAP[slug as string];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-slate-900 px-6 py-10 relative">
      

      {GameComponent ? (
        <div className="w-full max-w-3xl">
          <GameComponent />
        </div>
      ) : (
        <div className="text-center border border-slate-200 rounded-2xl p-10 bg-white shadow-sm">
          <h1 className="text-2xl font-bold mb-2 capitalize">{slug?.toString().replace("-", " ")}</h1>
          <p className="text-slate-600">🎮 Este juego todavía no fue desarrollado.</p>
          <p className="text-sm text-slate-500 mt-1">Pronto vas a poder jugarlo.</p>
        </div>
      )}
    </div>
  );
}
