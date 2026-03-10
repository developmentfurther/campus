import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useRef, useEffect } from "react";

const LANGUAGES: Record<string, { label: string; flag: string }> = {
  en: { label: "English", flag: "🇺🇸" },
  es: { label: "Español", flag: "🇪🇸" },
  pt: { label: "Português", flag: "🇧🇷" },
  fr: { label: "Français", flag: "🇫🇷" },
  it: { label: "Italiano", flag: "🇮🇹" },
};

export default function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  const { userProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const languages: string[] = userProfile?.learningLanguages?.length
    ? userProfile.learningLanguages
    : ["en"];

    useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  // Si solo tiene 1 idioma no mostramos el switcher
//   if (languages.length <= 1) return null;

  

  const current = LANGUAGES[lang] || LANGUAGES["en"];

  return (
    <div className="relative px-4 mb-3" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border-2 border-gray-100 hover:border-[#EE7203] transition-all group"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{current.flag}</span>
          <span className="text-sm font-bold text-[#0C212D]">{current.label}</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-scale-in z-50">
          {languages.map((code) => {
            const l = LANGUAGES[code];
            if (!l) return null;
            return (
              <button
                key={code}
                onClick={() => { setLang(code); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all hover:bg-orange-50 ${
                  lang === code ? "bg-gradient-to-r from-orange-50 to-red-50 text-[#EE7203]" : "text-[#0C212D]"
                }`}
              >
                <span className="text-lg">{l.flag}</span>
                <span>{l.label}</span>
                {lang === code && <span className="ml-auto w-2 h-2 bg-[#EE7203] rounded-full"></span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}