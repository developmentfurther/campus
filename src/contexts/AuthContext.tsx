"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  setDoc,
  updateDoc,
  arrayUnion,
  deleteDoc,
} from "firebase/firestore";
import { query, orderBy } from "firebase/firestore";
import { useI18n } from "@/contexts/I18nContext";


import {
  fetchUserFromBatchesByUid,
  addUserToBatch,
} from "@/lib/userBatches";
import { toast } from "sonner";

/* ==========================================================
   🔹 Contexto de Autenticación Global

   -Define que datos y funciones van a estar disponibles en toda la app
   ========================================================== */

interface AuthContextType {
  user: User | null;
  role: "admin" | "profesor" | "alumno" | null;
  authReady: boolean;
  loading: boolean;
  userProfile: any | null;

  alumnos: any[];
  misCursos: any[];
  allCursos?: any[];

  loadingCursos: boolean;
  loadingAllCursos?: boolean;

  reloadData?: () => Promise<void>;
  loadMisCursos?: (uid: string) => Promise<void>;
  loadAllCursos?: () => Promise<void>;

  saveCourseProgress?: (
    uid: string,
    courseId: string,
    data: any
  ) => Promise<void>;

  getCourseProgress?: (
    uid: string,
    courseId: string
  ) => Promise<any>;   // 👈 AGREGAR ESTO

  logout?: () => Promise<void>;
  firestore?: any;

  profesores?: any[];
  loadingProfesores?: boolean;
  loadProfesores?: () => Promise<void>;

  loadAlumnos?: () => Promise<void>;  
  setUserProfile?: (data: any) => void;

}


const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  authReady: false,
  loading: true,
  alumnos: [],
  misCursos: [],
  loadingCursos: false,
  userProfile: null,
});

/* ==========================================================
   🔹 Proveedor del Contexto
   ========================================================== */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"admin" | "profesor" | "alumno" | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);

  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [misCursos, setMisCursos] = useState<any[]>([]);
  const [allCursos, setAllCursos] = useState<any[]>([]);
  const [loadingCursos, setLoadingCursos] = useState(false);
  const [loadingAllCursos, setLoadingAllCursos] = useState(false);
  const [userProfile, setUserProfile] = useState<any | null>(null);

  const [profesores, setProfesores] = useState<any[]>([]);
  const [loadingProfesores, setLoadingProfesores] = useState(false);

  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [loadingChatSessions, setLoadingChatSessions] = useState(false);
  const { setLang } = useI18n();
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);



  /* ==========================================================
     🔹 Logout => Cierra sesion en firebase y limpia todo el estado local
     ========================================================== */
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setRole(null);
      setMisCursos([]);
      setUserProfile(null);
    } catch (err) {
      console.error("❌ Error al cerrar sesión:", err);
      toast.error("Error al cerrar sesión");
    }
  };

  /* ==========================================================
     🔹 Cargar alumnos (para admin o profesor) => Lee todos los documentos en la coleccion alumnos
     ========================================================== */
  const loadAlumnos = async () => {
    try {
      const alumnosRef = collection(db, "alumnos");
      const snap = await getDocs(alumnosRef);
      const allUsers: any[] = [];

      snap.forEach((batchDoc) => {
        const data = batchDoc.data();
        for (const key in data) {
          if (key.startsWith("user_")) {
            allUsers.push({
              uid: data[key].uid,
              email: data[key].email,
              role: data[key].role,
              batchId: batchDoc.id,
            });
          }
        }
      });
      setAlumnos(allUsers);
    } catch (err) {
      console.error("❌ [AuthContext] Error cargando alumnos:", err);
    }
  };


  async function loadRecentActivity(uid: string, profile: any, cursos: any[]) {
  setLoadingActivity(true);

  const final: any[] = [];

  /* ------------------------------
     1) ACTIVIDAD DE CURSOS
  ------------------------------ */
  for (const curso of cursos) {
    const progreso = curso?.progreso?.byLesson || {};

    Object.entries(progreso).forEach(([key, data]: any) => {
      if (!data?.completedAt) return;

      const [unitRaw, lessonRaw] = key.split("::");
      const unit = unitRaw.replace("unit", "");
      const lesson = lessonRaw.replace("lesson", "");

      final.push({
        type: "lesson",
        message: `Completaste la lección ${lesson} de la unidad ${unit} del curso "${curso.titulo}"`,
        date: new Date(data.completedAt),
      });
    });

    if (Object.keys(progreso).length === 0) {
      final.push({
        type: "start",
        message: `Iniciaste el curso "${curso.titulo}"`,
        date: new Date(curso.createdAt || Date.now()),
      });
    }
  }

  /* ------------------------------
     2) ACTIVIDAD DE JUEGOS
  ------------------------------ */
  try {
    const batchRef = doc(db, "alumnos", profile.batchId);
    const snap = await getDoc(batchRef);

    if (snap.exists()) {
      const data = snap.data();
      const userData = data[profile.userKey];

      if (userData?.gamingAttempts) {
        const attempts = Object.entries(userData.gamingAttempts);

        if (attempts.length > 0) {
          const formattedNames = attempts.map(([raw]) =>
            raw
              .replace(/_/g, " ")
              .split(" ")
              .map(p => p.charAt(0).toUpperCase() + p.slice(1))
              .join(" ")
          );

          const mostRecentDate = new Date(
            Math.max(
              ...attempts.map(([_, date]) => new Date(date).getTime())
            )
          );

          final.push({
            type: "gaming",
            message: `
              <span class="font-semibold text-blue-600">🎮 Gaming:</span>
              Jugaste a ${formattedNames.join(", ")}
            `,
            date: mostRecentDate,
          });
        }
      }
    }
  } catch (err) {
    console.error("Error leyendo gamingAttempts:", err);
  }

  /* ------------------------------
     3) ordenar
  ------------------------------ */
  final.sort((a, b) => b.date.getTime() - a.date.getTime());

  setRecentActivity(final);
  setLoadingActivity(false);
}

  /* ==========================================================
     🔹 Cargar cursos del alumno logueado
     ========================================================== */
  /* ==========================================================
   🔹 Cargar cursos + progreso real del alumno
   ========================================================== */
const loadMisCursos = async (uid: string) => {
  setLoadingCursos(true);

  try {
    const profile = await fetchUserFromBatchesByUid(uid);
    if (!profile) {
      console.warn("⚠️ No se encontró perfil en batches");
      setMisCursos([]);
      return;
    }

    const batchRef = doc(db, "alumnos", profile.batchId);
    const snap = await getDoc(batchRef);
    if (!snap.exists()) {
      setMisCursos([]);
      return;
    }

    const data = snap.data();
    const userKey = Object.keys(data).find(
      (k) => k.startsWith("user_") && data[k]?.uid === uid
    );
    if (!userKey) return;

    const alumno = data[userKey];
    const cursosIds = alumno?.cursosAdquiridos || [];
    const progreso = alumno?.progreso || {};

    // ⚠️ Importante: permitir gaming incluso si no tiene cursos
    if (!Array.isArray(cursosIds) || cursosIds.length === 0) {
      setMisCursos([]);  // alumno nuevo sin cursos
      return;
    }

    // Obtener todos los cursos
    const snapCursos = await getDocs(collection(db, "cursos"));
    const allCursos = snapCursos.docs.map((d) => ({ id: d.id, ...d.data() }));

    const cursosAlumno: any[] = [];

    for (const id of cursosIds) {
      const cursoSnap = await getDoc(doc(db, "cursos", id));
      if (!cursoSnap.exists()) continue;

      const curso = { id, ...cursoSnap.data() };
      const prog = progreso?.[id]?.byLesson || {};

      const { totalLessons, completedCount, progressPercent } =
        getCourseProgressStats(prog, curso.unidades || curso.lecciones || []);

      cursosAlumno.push({
        ...curso,
        progreso: { byLesson: prog },
        progressPercent,
        completedCount,
        totalLessons,
      });
    }

    // ✔️ Establecer SOLO una vez
    setMisCursos(cursosAlumno);

  } catch (err) {
    console.error("❌ Error cargando cursos del alumno:", err);
    toast.error("Error cargando tus cursos");
  } finally {
    setLoadingCursos(false);
  }
};



  /* ==========================================================
     🔹 Cargar todos los cursos (admin/profesor)
     ========================================================== */
  const loadAllCursos = async () => {
    setLoadingAllCursos(true);
    try {
      const snap = await getDocs(collection(db, "cursos"));
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAllCursos(all);
    } catch (err) {
      console.error("❌ Error cargando todos los cursos:", err);
      toast.error("Error cargando lista de cursos");
    } finally {
      setLoadingAllCursos(false);
    }
  };

  /* ==========================================================
   🔹 Cargar profesores (para admin)
   ========================================================== */
const loadProfesores = async () => {
  setLoadingProfesores(true);
  try {
    const profesoresRef = collection(db, "profesores");
    const snap = await getDocs(profesoresRef);
    const allProfes: any[] = [];

    snap.forEach((batchDoc) => {
      const data = batchDoc.data();

      for (const key in data) {
        // 🔥 Aceptar AMBOS formatos
        if (key.startsWith("profesor_") || key.startsWith("prof_")) {
          allProfes.push({
            id: key,
            batchId: batchDoc.id,
            ...data[key],
          });
        }
      }
    });

    setProfesores(allProfes);
    console.log("✅ Profesores cargados:", allProfes.length);

  } catch (err) {
    console.error("❌ [AuthContext] Error cargando profesores:", err);
    toast.error("Error cargando profesores");
  } finally {
    setLoadingProfesores(false);
  }
};


/* ==========================================================
     🔹 Cargar todas las sesiones de los chats
     ========================================================== */

const loadChatSessions = async (uid: string) => {
  setLoadingChatSessions(true);

  try {
    const ref = collection(db, "conversaciones", uid, "sessions");
    const q = query(ref, orderBy("endedAt", "desc"));
    const snap = await getDocs(q);

    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000; // 7 dias

    const list: any[] = [];

    for (const d of snap.docs) {
      const data = d.data();
      
      const endedAt = data.endedAt?.toDate?.() ?? null;

      if (endedAt) {
        const diff = now - endedAt.getTime();

        // 🔥 Si pasaron más de 2 minutos → borrar
        if (diff > sevenDays) {
          await deleteDoc(doc(db, "conversaciones", uid, "sessions", d.id));
          console.log("🗑️ Deleted session for test:", d.id);
          continue; // No la agregamos al array final
        }
      }

      // Sesión válida → agregar al listado
      list.push({ id: d.id, ...data });
    }

    setChatSessions(list);
  } catch (err) {
    console.error("❌ Error loading chat sessions:", err);
  } finally {
    setLoadingChatSessions(false);
  }
};



  /* ==========================================================
   🔹 Guardar progreso de curso (admin o alumno)
   ========================================================== */
const saveCourseProgress = async (
  uid: string,
  courseId: string,
  data: Record<string, any>
) => {
  try {
    const profile = await fetchUserFromBatchesByUid(uid);
    if (!profile) throw new Error("Usuario no encontrado en batches");

    const batchRef = doc(db, "alumnos", profile.batchId);
    const snap = await getDoc(batchRef);
    if (!snap.exists()) throw new Error("Batch no existe");

    const batchData = snap.data();
    const userKey = Object.keys(batchData).find(
      (k) => k.startsWith("user_") && batchData[k]?.uid === uid
    );
    if (!userKey) throw new Error("No se encontró el user_X correspondiente");

    const userData = batchData[userKey] || {};
    const prevProgreso =
      userData.progreso || userData.progress || {}; // compatibilidad
    const prevByLesson = prevProgreso[courseId]?.byLesson || {};

    // 🔹 Mergea datos a nivel byLesson
    const updatedProgreso = {
      ...prevProgreso,
      [courseId]: {
        ...(prevProgreso[courseId] || {}),
        byLesson: {
          ...prevByLesson,
          ...data, // 👈 data = { [lessonKey]: {...} }
        },
      },
    };

    // 🔹 Update anidado completo
    await setDoc(
      batchRef,
      {
        [userKey]: {
          ...userData,
          progreso: updatedProgreso,
        },
      },
      { merge: true }
    );

    console.log(
      `✅ Progreso guardado correctamente en ${profile.batchId}/${userKey}`,
      updatedProgreso
    );
  } catch (err: any) {
    console.error("🔥 Error guardando progreso:", err);
    toast.error("Error guardando progreso del curso");
  }
};



/* ==========================================================
   🔹 Leer progreso de curso (por UID)
   ========================================================== */
const getCourseProgress = async (uid: string, courseId: string) => {
  try {
    const profile = await fetchUserFromBatchesByUid(uid);
    if (!profile) throw new Error("Usuario no encontrado en batches");

    const batchRef = doc(db, "alumnos", profile.batchId);
    const snap = await getDoc(batchRef);
    if (!snap.exists()) throw new Error("Batch no existe");

    const data = snap.data();
    const userKey = Object.keys(data).find(
      (k) => k.startsWith("user_") && data[k]?.uid === uid
    );

    if (!userKey) throw new Error("No se encontró user_X");

    const progress = data[userKey]?.progreso?.[courseId] || {};
    console.log(`📊 Progreso cargado (${uid} / ${courseId}):`, progress);
    return progress;
  } catch (err) {
    console.error("❌ Error al leer progreso:", err);
    return {};
  }
};

  /* ==========================================================
     🔹 Reload global (alumnos + cursos)
     ========================================================== */
  const reloadData = async () => {
  if (!user) return;

  if (role === "admin") {
    await Promise.all([
      loadAlumnos?.(),
      loadAllCursos?.(),
      loadProfesores?.(),
    ]);
  } else if (role === "alumno") {
    await Promise.all([
      loadAlumnos?.(),
      loadMisCursos?.(user.uid),
    ]);
  } else {
    // fallback (profesor u otros)
    await loadAllCursos?.();
  }
};

  /* ==========================================================
     🔹 Listener de Auth
     ========================================================== */
     useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    setLoading(true);

    try {
      if (firebaseUser) {
        setUser(firebaseUser);

        // 🔥 PASO 1: Cargar sesiones de chat
        await loadChatSessions(firebaseUser.uid);

        // 🔥 PASO 2: Buscar perfil existente
        let profile = await fetchUserFromBatchesByUid(firebaseUser.uid);

        // 🔥 PASO 3: Si NO existe → CREAR PRIMERO
        if (!profile) {
          console.log("⚠️ Usuario nuevo detectado, creando en batch...");
          await addUserToBatch(firebaseUser, "alumno");
          
          // Volver a buscar después de crear
          profile = await fetchUserFromBatchesByUid(firebaseUser.uid);
          
          if (!profile) {
            console.error("❌ Error: No se pudo crear el usuario en batch");
            toast.error("Error al crear perfil de usuario");
            setLoading(false);
            return;
          }
        }

        // 🔥 PASO 4: Obtener datos completos del batch
        if (profile?.batchId && profile?.userKey) {
          const batchRef = doc(db, "alumnos", profile.batchId);
          const snap = await getDoc(batchRef);

          if (snap.exists()) {
            const data = snap.data()[profile.userKey] || {};
            profile = {
              ...profile,
              ...data,
            };
          }
        }

        // 🔥 PASO 5: Unificar campos de idioma
        const resolvedLanguage =
          profile?.learningLanguage || 
          profile?.language ||
          profile?.idioma ||
          "en";

        profile = {
          ...profile,
          learningLanguage: resolvedLanguage,
          language: resolvedLanguage,
          idioma: resolvedLanguage,
        };

        setUserProfile(profile);
        setLang(resolvedLanguage);

        console.log("🌍 Idioma final del usuario:", resolvedLanguage);

        // 🔥 PASO 6: Determinar rol
        const resolvedRole = profile?.role || "alumno";
        setRole(resolvedRole);

        // 🔥 PASO 7: Cargar alumnos (para todos los roles)
        await loadAlumnos();

        // 🔥 PASO 8: Cargar datos según rol
        if (resolvedRole === "alumno") {
          await loadMisCursos(firebaseUser.uid);
        } else {
          await Promise.all([
            loadAllCursos(),
            loadProfesores(),
          ]);
        }
      } else {
        // Usuario no logueado
        setUser(null);
        setRole(null);
        setMisCursos([]);
        setUserProfile(null);
        setLang("en");
      }
    } catch (error) {
      console.error("❌ Error en onAuthStateChanged:", error);
      toast.error("Error al cargar datos del usuario");
    } finally {
      setLoading(false);
      setAuthReady(true);
    }
  });

  return () => unsubscribe();
}, []);

/* ==========================================================
   🔥 Paso 3 — Cargar actividad cuando TODO esté listo
========================================================== */
useEffect(() => {
  console.log("DEBUG → dependencia cambió", {
    authReady,
    user: !!user,
    userProfile: !!userProfile,
    role,
    misCursos: misCursos.length,
    loadingCursos
  });

  if (!authReady) return;
  if (!user) return;
  if (!userProfile?.batchId || !userProfile?.userKey) return;
  if (role !== "alumno") return;
  if (loadingCursos) return;

  console.log("➡️ Ejecutando loadRecentActivity()");

  void loadRecentActivity(user.uid, userProfile, misCursos);

}, [authReady, user, userProfile, role, misCursos, loadingCursos]);




  /* ==========================================================
     🔹 Valor del contexto
     ========================================================== */
 
const value = useMemo(
  () => ({
    // --- Estado base ---
    user,
    role,
    userProfile,
    authReady,
    loading,

    // --- Datos académicos ---
    alumnos,
    misCursos,
    allCursos,
    profesores,

    // --- Loaders ---
    loadingCursos,
    loadingAllCursos,
    loadingProfesores,

    // --- Funciones principales ---
    reloadData,
    loadMisCursos,
    loadAllCursos,
    loadProfesores,
    loadAlumnos,          // 👈 Agregar porque reloadData lo necesita

    saveCourseProgress,
    getCourseProgress,

    logout,
    setUserProfile,
    chatSessions,
    loadingChatSessions,
    loadChatSessions,
    recentActivity,
loadingActivity,
reloadActivity: () => {
  if (!user || !userProfile) return;
  return loadRecentActivity(user.uid, userProfile, misCursos);
},



    // --- Firestore & storage (opcional) ---
    firestore: db,
  }),
  [
    user,
    role,
    userProfile,
    authReady,
    loading,
    alumnos,
    misCursos,
    allCursos,
    profesores,
    loadingCursos,
    loadingAllCursos,
    loadingProfesores,
    recentActivity,
    loadingActivity,
  ]
);


  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

/* ==========================================================
   🔹 Hook personalizado
   ========================================================== */
export const useAuth = () => useContext(AuthContext);
/* =========================================================
   🔹 getCourseProgressStats — calcula progreso real del curso
   ========================================================= */
/* =========================================================
   🔹 getCourseProgressStats — calcula progreso real del curso
   ========================================================= */
export function getCourseProgressStats(
  progress: Record<string, any> = {},
  units: any[] = []
) {
  /* =========================================================
     1️⃣ Calcular total de lecciones reales del curso
     ========================================================= */
  let totalLessons = units.reduce((acc, u) => {
    const list = u.lessons || u.lecciones || [];
    return acc + (Array.isArray(list) ? list.length : 0);
  }, 0);

  // 🧩 Fallback: si las unidades están vacías (como en loadMisCursos)
  if (!totalLessons && progress && typeof progress === "object") {
    const lessonBases = new Set<string>();
    Object.keys(progress).forEach((key) => {
      if (!key || typeof key !== "string" || key === "[object Object]") return;
      const parts = key.split("::");
      if (parts.length >= 2) {
        lessonBases.add(`${parts[0]}::${parts[1]}`);
      }
    });
    totalLessons = lessonBases.size;
  }

  /* =========================================================
     2️⃣ Crear mapa para evitar duplicados
     ========================================================= */
  const baseMap = new Map<string, boolean>();

  Object.entries(progress).forEach(([key, value]: [string, any]) => {
    // Evitar claves inválidas
    if (!key || key === "[object Object]" || typeof key !== "string") return;

    // Normalizar inconsistencias del cierre
    let normalizedKey = key
      .replace("closing-course", "closing")
      .replace("closing::", "closing-course::");

    // Dividir en partes (solo unidad + lección)
    const parts = normalizedKey.split("::");
    if (parts.length < 2) return;

    const baseKey = `${parts[0]}::${parts[1]}`;

    // Determinar si la lección se considera completada
    const isCompleted =
      value?.videoEnded === true ||
      value?.exSubmitted === true ||
      value?.completed === true;

    const prev = baseMap.get(baseKey) || false;
    baseMap.set(baseKey, prev || isCompleted);
  });

  /* =========================================================
     3️⃣ Contar lecciones completadas únicas
     ========================================================= */
  const completedCount = Array.from(baseMap.values()).filter(Boolean).length;

  /* =========================================================
     4️⃣ Calcular porcentaje (limitado a 100)
     ========================================================= */
  const progressPercent =
    totalLessons > 0
      ? Math.min(100, Math.round((completedCount / totalLessons) * 100))
      : 0;

  return { totalLessons, completedCount, progressPercent };
}

