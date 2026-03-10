import { collection, doc, getDocs, setDoc, updateDoc, getDoc, arrayUnion } from "firebase/firestore";
import { db } from "./firebase";
import { BatchUser, Role, UserProfile } from "@/types/auth";
import { User } from "firebase/auth";

const MAX_USERS_PER_BATCH = 100;
const USER_KEY_PREFIX = "user_";


/* =========================================================
   🔹 addUserToBatch — guarda usuario en batches de alumnos
   ========================================================= */
export const addUserToBatch = async (firebaseUser: User, role: Role = "alumno") => {
  console.log("🚀 [addUserToBatch] Iniciando...");
  console.log("📧 Email:", firebaseUser.email, "🆔 UID:", firebaseUser.uid, "🎭 Role:", role);

  if (!firebaseUser.email || !firebaseUser.uid) {
    console.error("❌ [addUserToBatch] Usuario inválido (sin email o UID)");
    return;
  }

  try {
    const alumnosRef = collection(db, "alumnos");
    const batchesSnapshot = await getDocs(alumnosRef);

    const batches: { id: string; data: Record<string, any> }[] = [];
    batchesSnapshot.forEach((docSnap) => {
      const id = docSnap.id;
      if (id.startsWith("batch_")) {
        batches.push({ id, data: docSnap.data() });
      } else {
        console.warn(`⚠️ Documento ignorado: ${id} (no es un batch válido)`);
      }
    });

    console.log(`📊 Cantidad de batches encontrados: ${batches.length}`);

    // 1️⃣ Evitar duplicados
    for (const batch of batches) {
      for (const key in batch.data) {
        const user = batch.data[key];
        if (key.startsWith(USER_KEY_PREFIX) && user?.uid === firebaseUser.uid) {
          console.log(`⚠️ Usuario ya existe en ${batch.id}/${key}, no se agrega.`);
          return;
        }
      }
    }

    // 2️⃣ Buscar batch con espacio libre (ordenado por número)
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

    // 3️⃣ Crear nuevo batch si no hay espacio
    if (!targetBatchId) {
      const lastBatch = batches[batches.length - 1];
      const lastNum = lastBatch ? parseInt(lastBatch.id.replace("batch_", "")) : 0;
      const newNum = String(lastNum + 1).padStart(3, "0");
      targetBatchId = `batch_${newNum}`;
      console.log(`🆕 Creando nuevo batch: ${targetBatchId}`);
      await setDoc(doc(db, "alumnos", targetBatchId), {});
    }

    // 4️⃣ Crear usuario con userKey con padding
    const userKey = `${USER_KEY_PREFIX}${String(nextSlot).padStart(3, "0")}`;
    const newUser: BatchUser = {
  uid: firebaseUser.uid,
  email: firebaseUser.email,
  role,
  batchId: targetBatchId,
  userKey: userKey,
  createdAt: new Date().toISOString(),
  cursosAdquiridos: [],
  progreso: {},
  active: true,
  learningLanguages: ["en"],
  activeLanguage: "en",
  learningLevel: "A1",
};

    console.log("🧩 Usuario a guardar:", newUser);

    const batchRef = doc(db, "alumnos", targetBatchId);
    await setDoc(batchRef, { [userKey]: newUser }, { merge: true });

    console.log(`✅ Usuario agregado correctamente en alumnos/${targetBatchId}/${userKey}`);
  } catch (err) {
    console.error("🔥 [addUserToBatch] Error:", err);
  }
};


/* =========================================================
   🔹 fetchUserFromBatchesByUid — busca usuario por UID
   ========================================================= */
export const fetchUserFromBatchesByUid = async (uid: string): Promise<UserProfile | null> => {
  console.log(`🔍 Buscando usuario con UID ${uid} en batches...`);
  const snap = await getDocs(collection(db, "alumnos"));

  for (const batchDoc of snap.docs) {
    if (!batchDoc.id.startsWith("batch_")) continue;
    const data = batchDoc.data();
    for (const key in data) {
      if (key.startsWith(USER_KEY_PREFIX) && data[key]?.uid === uid) {
        console.log(`✅ Usuario encontrado en alumnos/${batchDoc.id}/${key}`);
        return {
          uid: data[key].uid,
          email: data[key].email,
          role: data[key].role,
          batchId: batchDoc.id,
          userKey: key,
          active: data[key].active ?? true,
        };
      }
    }
  }

  console.warn("⚠️ Usuario no encontrado en ningún batch (UID).");
  return null;
};


/* =========================================================
   🔹 fetchUserFromBatches — busca usuario por EMAIL
   ========================================================= */
export const fetchUserFromBatches = async (email: string): Promise<UserProfile | null> => {
  console.log(`🔍 Buscando usuario con EMAIL ${email} en batches...`);
  const snap = await getDocs(collection(db, "alumnos"));

  for (const batchDoc of snap.docs) {
    if (!batchDoc.id.startsWith("batch_")) continue;
    const data = batchDoc.data();
    for (const key in data) {
      if (key.startsWith(USER_KEY_PREFIX) && data[key]?.email === email) {
        console.log(`✅ Usuario encontrado en alumnos/${batchDoc.id}/${key}`);
        return {
          uid: data[key].uid,
          email: data[key].email,
          role: data[key].role,
          batchId: batchDoc.id,
          userKey: key,
          active: data[key].active ?? true,
        };
      }
    }
  }

  console.warn("⚠️ Usuario no encontrado en ningún batch (EMAIL).");
  return null;
};


/* =========================================================
   🔹 fetchAllUsers — lista todos los usuarios de batches
   ========================================================= */
export const fetchAllUsers = async (): Promise<UserProfile[]> => {
  console.log("📦 [fetchAllUsers] Cargando todos los usuarios desde batches...");
  const snap = await getDocs(collection(db, "alumnos"));

  const allUsers: UserProfile[] = [];
  snap.forEach((batchDoc) => {
    if (!batchDoc.id.startsWith("batch_")) return;
    const data = batchDoc.data();
    for (const key in data) {
      if (key.startsWith(USER_KEY_PREFIX)) {
        const u = data[key];
        allUsers.push({
          uid: u.uid,
          email: u.email,
          role: u.role,
          batchId: u.batchId ?? batchDoc.id,
          active: u.active ?? true,
        });
      }
    }
  });

  console.log(`✅ [fetchAllUsers] Total usuarios: ${allUsers.length}`);
  return allUsers;
};


/* =========================================================
   🔹 updateUserRole — actualiza rol dentro de su batch
   ========================================================= */
export const updateUserRole = async (uid: string, newRole: Role) => {
  console.log(`🎭 [updateUserRole] Buscando UID ${uid} para rol ${newRole}`);
  const snap = await getDocs(collection(db, "alumnos"));

  for (const batchDoc of snap.docs) {
    if (!batchDoc.id.startsWith("batch_")) continue;
    const data = batchDoc.data();
    for (const key in data) {
      if (key.startsWith(USER_KEY_PREFIX) && data[key].uid === uid) {
        await updateDoc(doc(db, "alumnos", batchDoc.id), {
          [`${key}.role`]: newRole,
        });
        console.log(`✅ [updateUserRole] Rol actualizado para ${uid}`);
        return;
      }
    }
  }

  console.warn("⚠️ [updateUserRole] Usuario no encontrado en ningún batch.");
};


/* =========================================================
   🔹 enrollUserInCourse — asigna curso a usuario por email
   ========================================================= */
export const enrollUserInCourse = async (email: string, courseId: string) => {
  console.log(`🎓 Enrolando usuario ${email} en curso ${courseId}`);
  try {
    const userProfile = await fetchUserFromBatches(email);
    if (!userProfile) {
      console.warn(`⚠️ No se encontró el usuario ${email} en ningún batch`);
      return;
    }

    const batchRef = doc(db, "alumnos", userProfile.batchId);
    const snap = await getDoc(batchRef);
    if (!snap.exists()) {
      console.warn(`⚠️ El batch ${userProfile.batchId} no existe`);
      return;
    }

    const data = snap.data();
    const userKey = Object.keys(data).find(
      (key) => key.startsWith("user_") && data[key]?.email === email
    );

    if (!userKey) {
      console.warn(`⚠️ No se encontró la key para ${email}`);
      return;
    }

    await updateDoc(batchRef, {
      [`${userKey}.cursosAdquiridos`]: arrayUnion(courseId),
    });

    console.log(`✅ Curso ${courseId} asignado a ${email} (${userKey} en ${userProfile.batchId})`);
  } catch (err) {
    console.error("🔥 [enrollUserInCourse] Error:", err);
  }
};


/* =========================================================
   🔹 updateUserActive — activa o desactiva usuario
   ========================================================= */
export const updateUserActive = async (uid: string, state: boolean) => {
  console.log(`🟢 [updateUserActive] Cambiando estado de ${uid} a ${state}`);
  const snap = await getDocs(collection(db, "alumnos"));

  for (const batchDoc of snap.docs) {
    if (!batchDoc.id.startsWith("batch_")) continue;
    const data = batchDoc.data();
    for (const key in data) {
      if (key.startsWith(USER_KEY_PREFIX) && data[key].uid === uid) {
        await updateDoc(doc(db, "alumnos", batchDoc.id), {
          [`${key}.active`]: state,
        });
        console.log(`✅ [updateUserActive] Estado actualizado para ${uid}`);
        return;
      }
    }
  }

  console.warn("⚠️ [updateUserActive] Usuario no encontrado en ningún batch.");
};