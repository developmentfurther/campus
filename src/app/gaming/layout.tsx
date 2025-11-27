"use client";

import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import { useI18n } from "@/contexts/I18nContext";
import Image from "next/image";

export default function GamingLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Header tipo player */}
      <header className="w-full flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
        
        {/* Botón volver */}
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition text-sm"
        >
          <FiArrowLeft />
          {t("gaming.backToHub")}
        </button>

        {/* Logo central */}
        <div className="flex items-center justify-center">
          <Image
            src="/images/probando.png" // <-- Cambiá por tu ruta real
            alt="Further Gaming Logo"
            width={130}
            height={40}
            className="object-contain"
          />
        </div>

        {/* Espaciador derecho */}
        <div className="w-10" />
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
