"use client";
import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";

export default function GamingLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Header tipo player */}
      <header className="w-full flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition text-sm"
        >
          <FiArrowLeft /> Volver al hub
        </button>
        <span className="font-semibold text-slate-800">Further Gaming 🎮</span>
        <div className="w-10" />
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
