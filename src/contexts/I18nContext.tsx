"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import en from "@/locales/en.json";
import es from "@/locales/es.json";
import pt from "@/locales/pt.json";
import it from "@/locales/it.json";
import fr from "@/locales/fr.json";

const translations: any = { en, es, pt, it, fr };

const I18nContext = createContext<any>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { userProfile } = useAuth();

  const [langState, setLangState] = useState(() => {
    // Leer caché inmediato para evitar flash
    if (typeof window !== "undefined") {
      return localStorage.getItem("activeLanguage") || "en";
    }
    return "en";
  });

  // Cuando llega userProfile desde Firestore, sincronizar
  useEffect(() => {
    if (userProfile?.activeLanguage) {
      setLangState(userProfile.activeLanguage);
      localStorage.setItem("activeLanguage", userProfile.activeLanguage);
    }
  }, [userProfile?.activeLanguage]);

  const setLang = useCallback((l: string) => {
    setLangState(l);
    localStorage.setItem("activeLanguage", l);
  }, []);

  const t = (key: string, vars: Record<string, string> = {}) => {
    const parts = key.split(".");
    let current = translations[langState];
    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        return key;
      }
    }
    if (typeof current !== "string") return current;
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