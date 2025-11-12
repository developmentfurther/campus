import { collection, doc, getDocs, setDoc, updateDoc, getDoc, arrayUnion } from "firebase/firestore";
import { db } from "./firebase";
import { BatchUser, Role, UserProfile } from "@/types/auth";
import { User } from "firebase/auth";

const MAX_USERS_PER_BATCH = 200;
const MAX_BATCHES = 10;
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
  // ✅ Solo considerar documentos que sigan el patrón "batch_X"
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

    // 2️⃣ Buscar batch con espacio libre
    batches.sort((a, b) => parseInt(a.id.replace("batch_", "")) - parseInt(b.id.replace("batch_", "")));
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
      const newBatchIndex = batches.length + 1;
      targetBatchId = `batch_${newBatchIndex}`;
      console.log(`🆕 Creando nuevo batch: ${targetBatchId}`);
      await setDoc(doc(db, "alumnos", targetBatchId), {});
    }

    // 4️⃣ Crear usuario
    const userKey = `${USER_KEY_PREFIX}${nextSlot}`;
    const newUser: BatchUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      role,
      batchId: targetBatchId,
      createdAt: new Date().toISOString(),
      cursosAdquiridos: [],
      progreso: {}, 
      active: true,
    };

    console.log("🧩 Usuario a guardar:", newUser);

    // 5️⃣ Guardar correctamente en Firestore (sin campo basura)
    const batchRef = doc(db, "alumnos", targetBatchId);
    await setDoc(batchRef, { [userKey]: newUser }, { merge: true });

    console.log(`✅ Usuario agregado correctamente en alumnos/${targetBatchId}/${userKey}`);
  } catch (err) {
    console.error("🔥 [addUserToBatch] Error:", err);
  }
};


/* =========================================================
   🔹 fetchUserFromBatchesByUid — busca usuario por UID (login)
   ========================================================= */
export const fetchUserFromBatchesByUid = async (
  uid: string
): Promise<UserProfile | null> => {
  console.log(`🔍 Buscando usuario con UID ${uid} en batches...`);
  for (let i = 1; i <= MAX_BATCHES; i++) {
    const ref = doc(db, "alumnos", `batch_${i}`);
    const snap = await getDoc(ref);
    if (!snap.exists()) continue;

    const data = snap.data();
    for (const key in data) {
      const user = data[key];
      if (key.startsWith(USER_KEY_PREFIX) && user?.uid === uid) {
        console.log(`✅ Usuario encontrado en alumnos/batch_${i}/${key}`);
        return {
          uid: user.uid,
          email: user.email,
          role: user.role,
          batchId: `batch_${i}`,
          userKey: key,
          active: user.active ?? true,
        };
      }
    }
  }

  console.warn("⚠️ Usuario no encontrado en ningún batch (UID).");
  return null;
};




/* =========================================================
   🔹 fetchUserFromBatches — busca usuario por EMAIL (enrolamiento)
   ========================================================= */
export const fetchUserFromBatches = async (
  email: string
): Promise<UserProfile | null> => {
  console.log(`🔍 Buscando usuario con EMAIL ${email} en batches...`);
  for (let i = 1; i <= MAX_BATCHES; i++) {
    const ref = doc(db, "alumnos", `batch_${i}`);
    const snap = await getDoc(ref);
    if (!snap.exists()) continue;

    const data = snap.data();
    for (const key in data) {
      const user = data[key];
      if (key.startsWith(USER_KEY_PREFIX) && user?.email === email) {
        console.log(`✅ Usuario encontrado en alumnos/batch_${i}/${key}`);
        return {
          uid: user.uid,
          email: user.email,
          role: user.role,
          batchId: `batch_${i}`,
          userKey: key, 
          active: user.active ?? true,
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
  const alumnosRef = collection(db, "alumnos");
  const snap = await getDocs(alumnosRef);

  const allUsers: UserProfile[] = [];
  snap.forEach((batchDoc) => {
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
  const alumnosRef = collection(db, "alumnos");
  const snap = await getDocs(alumnosRef);

  for (const batchDoc of snap.docs) {
    const data = batchDoc.data();
    for (const key in data) {
      if (key.startsWith(USER_KEY_PREFIX) && data[key].uid === uid) {
        const userPath = `${key}.role`;
        await updateDoc(doc(db, "alumnos", batchDoc.id), {
          [userPath]: newRole,
        });
        console.log(`✅ [updateUserRole] Rol actualizado para ${uid}`);
        return;
      }
    }
  }

  console.warn("⚠️ [updateUserRole] Usuario no encontrado en ningún batch.");
};

export const enrollUserInCourse = async (email: string, courseId: string) => {
  console.log(`🎓 Enrolando usuario ${email} en curso ${courseId}`);
  try {
    // Buscar al usuario por email
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
    // Encontrar la key (user_0, user_1, etc.) que corresponde a este email
    const userKey = Object.keys(data).find(
      (key) => key.startsWith("user_") && data[key]?.email === email
    );

    if (!userKey) {
      console.warn(`⚠️ No se encontró la key para ${email}`);
      return;
    }

    // Agregar el curso al array cursosAdquiridos (lo crea si no existe)
    const path = `${userKey}.cursosAdquiridos`;
    await updateDoc(batchRef, {
      [path]: arrayUnion(courseId),
    });

    console.log(`✅ Curso ${courseId} asignado a ${email} (${userKey} en ${userProfile.batchId})`);
  } catch (err) {
    console.error("🔥 [enrollUserInCourse] Error:", err);
  }
};

// Función para activar o desactivar alumnos desde admin
export const updateUserActive = async (uid: string, state: boolean) => {
  console.log(`🟢 [updateUserActive] Cambiando estado de ${uid} a ${state}`);
  const alumnosRef = collection(db, "alumnos");
  const snap = await getDocs(alumnosRef);

  for (const batchDoc of snap.docs) {
    const data = batchDoc.data();
    for (const key in data) {
      if (key.startsWith(USER_KEY_PREFIX) && data[key].uid === uid) {
        const userPath = `${key}.active`;
        await updateDoc(doc(db, "alumnos", batchDoc.id), {
          [userPath]: state,
        });
        console.log(`✅ [updateUserActive] Estado actualizado para ${uid}`);
        return;
      }
    }
  }

  console.warn("⚠️ [updateUserActive] Usuario no encontrado en ningún batch.");
};
