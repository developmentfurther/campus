import { useState, useEffect } from "react";

// Hook personalizado para AutoGuardado
export default function useAutoSave(key: string, data: any, delay: number = 2000) {
  const [isSaved, setIsSaved] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    // 1. Indicamos que hay cambios sin guardar en cuanto cambia la data
    setIsSaved(false);

    // 2. Configuramos el temporizador (Debounce)
    const handler = setTimeout(() => {
      // Guardar en LocalStorage
      try {
        localStorage.setItem(key, JSON.stringify(data));
        setIsSaved(true);
        setLastSaved(new Date());
        console.log("💾 Auto-guardado en local...");
      } catch (error) {
        console.error("Error al auto-guardar", error);
      }
    }, delay);

    // 3. Limpieza: Si el usuario escribe antes del delay, reiniciamos el reloj
    return () => {
      clearTimeout(handler);
    };
  }, [data, key, delay]);

  return { isSaved, lastSaved };
}