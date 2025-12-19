"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // Buscamos el contenedor por ID
    const mainContainer = document.getElementById("dashboard-main-content");
    
    if (mainContainer) {
      // Forzamos el scroll a 0 inmediatamente.
      // Como el contenedor tendrá CSS smooth, el navegador se encarga de la animación.
      mainContainer.scrollTop = 0;
    }
  }, [pathname]);

  return null; // Este componente no pinta nada
}