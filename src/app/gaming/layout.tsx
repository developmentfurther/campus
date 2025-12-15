"use client";

import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import { useI18n } from "@/contexts/I18nContext";
import Image from "next/image";
import Link from "next/link";

export default function GamingLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      
     <header
  className="
    relative w-full px-6 py-4
    bg-white border-b border-slate-200
    flex items-center
  "
>
  {/* BOTÓN VOLVER INSTANTÁNEO */}
        <button
          onClick={() => router.replace("/dashboard")}
          className="
            flex items-center gap-2 
            text-[#0C212D] font-semibold
            hover:text-[#EE7203] 
            transition-colors 
            text-sm z-20
          "
        >
          <FiArrowLeft className="text-[#EE7203]" />
          {t("gaming.backToHub")}
        </button>


  {/* Título centrado */}
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    <h1 className="flex gap-2 items-center text-2xl font-black tracking-tight select-none">
      
      {/* Further (azul oscuro) */}
      <span style={{ color: '#0C212D' }}>
        Further
      </span>

      {/* Gaming (gradiente naranja) */}
      <span
        className="bg-clip-text text-transparent"
        style={{
          backgroundImage: 'linear-gradient(90deg, #EE7203, #FF3816)',
        }}
      >
        Gaming
      </span>

    </h1>
  </div>
</header>

      {/* CONTENIDO */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
