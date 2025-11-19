"use client";

import { createContext, useContext, useState, useCallback } from "react";
import en from "@/locales/en.json";
import es from "@/locales/es.json";
import pt from "@/locales/pt.json";
import it from "@/locales/it.json";
import fr from "@/locales/fr.json";

const translations: any = { en, es, pt, it, fr };

const I18nContext = createContext<any>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [langState, setLangState] = useState("en");

  // Cambiar idioma sin recrear función
  const setLang = useCallback((l: string) => {
    setLangState(l);
  }, []);

  // Función de traducción mejorada
  const t = (key: string, vars: Record<string, string> = {}) => {
    const parts = key.split(".");
    let current = translations[langState];

    // Navegar niveles profundos
    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        return key; // fallback elegante
      }
    }

    // Si no es string → devolver tal cual
    if (typeof current !== "string") return current;

    // Reemplazo de variables {{variable}}
    let text = current;
    for (const k in vars) {
      text = text.replace(new RegExp(`{{${k}}}`, "g"), vars[k]);
    }

    return text;
  };

  return (
    <I18nContext.Provider value={{ lang: langState, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
