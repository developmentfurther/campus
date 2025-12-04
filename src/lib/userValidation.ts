import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export async function validateUserStatus(email: string) {
  const emailLower = email.toLowerCase().trim();

  const result = {
    exists: false,
    isActive: false,
    source: null,
    userData: null,
  };

  /* ========================================
     1️⃣ Buscar en alumnos (active: boolean)
     ======================================== */
  const alumnosSnap = await getDocs(collection(db, "alumnos"));

  for (const batch of alumnosSnap.docs) {
    const data = batch.data();

    for (const key in data) {
      if (!key.startsWith("user_")) continue;

      const u = data[key];
      if ((u.email || "").toLowerCase().trim() !== emailLower) continue;

      const isActive = u.active === true; // 👈 estado real del campus

      return {
        exists: true,
        isActive,
        source: "alumnos",
        userData: { ...u, batchId: batch.id, userKey: key },
      };
    }
  }

  /* ========================================
     2️⃣ Buscar en alumnos_raw (estadoAlumno)
     ======================================== */
  const rawSnap = await getDocs(collection(db, "alumnos_raw"));

  for (const batch of rawSnap.docs) {
    const data = batch.data();

    for (const key in data) {
      if (!key.startsWith("user_")) continue;

      const u = data[key];
      if ((u.email || "").toLowerCase().trim() !== emailLower) continue;

      const estado = (u.estadoAlumno || "").toLowerCase().trim();
      const isActive = estado === "activo"; 

      return {
        exists: true,
        isActive,
        source: "alumnos_raw",
        userData: { ...u, batchId: batch.id, userKey: key },
      };
    }
  }

  // No encontrado
  return result;
}
