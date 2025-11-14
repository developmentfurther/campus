import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const BATCH_ID = "batch_1";

/**
 * Agrega un profesor al batch usando el ID estándar:  prof_123456789
 */
export const addProfesorToBatch = async (profesorData: any) => {
  try {
    console.log("🚀 [addProfesorToBatch] Creando profesor...");

    const profesoresRef = doc(db, "profesores", BATCH_ID);

    // Crear ID único (mismo formato que en EditCourseForm)
    const profesorId = `prof_${Date.now()}`;

    // Asegurar que el documento exista
    const snap = await getDoc(profesoresRef);
    if (!snap.exists()) {
      await setDoc(profesoresRef, {});
    }

    // Datos mínimos del profesor
    const dataToSave = {
      ...profesorData,
      batchId: BATCH_ID,
      createdAt: new Date().toISOString(),
      uid: profesorId,
    };

    // Guardar profesor dentro del batch
    await updateDoc(profesoresRef, {
      [profesorId]: dataToSave,
    });

    console.log("✅ Profesor guardado correctamente:", profesorId);
    return { id: profesorId, ...dataToSave };
  } catch (err) {
    console.error("❌ [addProfesorToBatch] Error:", err);
    throw err;
  }
};
