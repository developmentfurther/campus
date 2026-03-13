import { collection, doc, getDocs, setDoc, updateDoc, getDoc, arrayUnion } from "firebase/firestore";
import { db } from "./firebase";
import { User } from "firebase/auth";

const MAX_USERS_PER_BATCH = 100;
const USER_KEY_PREFIX = "user_";

export interface ProfesorProfile {
  uid: string;
  email: string;
  nombre: string;
  apellido: string;
  role: "profesor";
  batchId: string;
  userKey: string;
  idExterno?: string;
  idiomasQueEnseña: string[];
  nivel: string;
  alumnos: string[];         // UIDs de alumnos asignados
  progreso: Record<string, any>;
  active: boolean;
  createdAt: string;
  activeLanguage: string;
}

export const addProfesorToBatch = async (data: {
  uid: string;
  email: string;
  nombre: string;
  apellido: string;
  idExterno?: string;
  idiomasQueEnseña?: string[];
  nivel?: string;
}) => {
  const profesoresRef = collection(db, "profesores");
  const batchesSnapshot = await getDocs(profesoresRef);

  const batches: { id: string; data: Record<string, any> }[] = [];
  batchesSnapshot.forEach((docSnap) => {
    if (docSnap.id.startsWith("batch_")) {
      batches.push({ id: docSnap.id, data: docSnap.data() });
    }
  });

  // Evitar duplicados
  for (const batch of batches) {
    for (const key in batch.data) {
      if (key.startsWith(USER_KEY_PREFIX) && batch.data[key]?.uid === data.uid) {
        console.warn(`Profesor ya existe en ${batch.id}/${key}`);
        return;
      }
    }
  }

  batches.sort((a, b) => {
    const numA = parseInt(a.id.replace("batch_", ""));
    const numB = parseInt(b.id.replace("batch_", ""));
    return numA - numB;
  });

  let targetBatchId: string | null = null;
  let nextSlot = 0;

  for (const batch of batches) {
    const userKeys = Object.keys(batch.data).filter((k) => k.startsWith(USER_KEY_PREFIX));
    if (userKeys.length < MAX_USERS_PER_BATCH) {
      const used = userKeys.map((k) => parseInt(k.replace(USER_KEY_PREFIX, "")));
      nextSlot = 0;
      while (used.includes(nextSlot)) nextSlot++;
      targetBatchId = batch.id;
      break;
    }
  }

  if (!targetBatchId) {
    const lastBatch = batches[batches.length - 1];
    const lastNum = lastBatch ? parseInt(lastBatch.id.replace("batch_", "")) : 0;
    const newNum = String(lastNum + 1).padStart(3, "0");
    targetBatchId = `batch_${newNum}`;
    await setDoc(doc(db, "profesores", targetBatchId), {});
  }

  const userKey = `${USER_KEY_PREFIX}${String(nextSlot).padStart(3, "0")}`;

  const newProfesor: ProfesorProfile = {
    uid: data.uid,
    email: data.email,
    nombre: data.nombre,
    apellido: data.apellido,
    role: "profesor",
    batchId: targetBatchId,
    userKey,
    idExterno: data.idExterno || "",
    idiomasQueEnseña: data.idiomasQueEnseña || ["en"],
    nivel: data.nivel || "A1",
    alumnos: [],
    progreso: {},
    active: true,
    createdAt: new Date().toISOString(),
    activeLanguage: "es",
  };

  const batchRef = doc(db, "profesores", targetBatchId);
  await setDoc(batchRef, { [userKey]: newProfesor }, { merge: true });

  return { batchId: targetBatchId, userKey, profesor: newProfesor };
};

export const fetchAllProfesores = async (): Promise<ProfesorProfile[]> => {
  const snap = await getDocs(collection(db, "profesores"));
  const all: ProfesorProfile[] = [];

  snap.forEach((batchDoc) => {
    if (!batchDoc.id.startsWith("batch_")) return;
    const data = batchDoc.data();
    for (const key in data) {
      if (key.startsWith(USER_KEY_PREFIX)) {
        all.push({ ...data[key], batchId: batchDoc.id, userKey: key });
      }
    }
  });

  return all;
};

export const fetchProfesorByUid = async (uid: string): Promise<ProfesorProfile | null> => {
  const snap = await getDocs(collection(db, "profesores"));

  for (const batchDoc of snap.docs) {
    if (!batchDoc.id.startsWith("batch_")) continue;
    const data = batchDoc.data();
    for (const key in data) {
      if (key.startsWith(USER_KEY_PREFIX) && data[key]?.uid === uid) {
        return { ...data[key], batchId: batchDoc.id, userKey: key };
      }
    }
  }
  return null;
};

export const updateProfesor = async (
  batchId: string,
  userKey: string,
  updates: Partial<ProfesorProfile>
) => {
  const batchRef = doc(db, "profesores", batchId);
  const snap = await getDoc(batchRef);
  if (!snap.exists()) return;

  const current = snap.data()[userKey] || {};
  await setDoc(batchRef, {
    [userKey]: { ...current, ...updates }
  }, { merge: true });
};

export const deleteProfesor = async (batchId: string, userKey: string) => {
  const batchRef = doc(db, "profesores", batchId);
  const snap = await getDoc(batchRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const updated = { ...data };
  delete updated[userKey];
  await setDoc(batchRef, updated);
};