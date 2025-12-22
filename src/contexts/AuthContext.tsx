"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from "react";
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
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";


import {
  fetchUserFromBatchesByUid,
  addUserToBatch,
} from "@/lib/userBatches";
import { toast } from "sonner";

/* ==========================================================
   🔹 Contexto de Autenticación Global

   -Define que datos y funciones van a estar disponibles en toda la app
   ========================================================== */

interface SpotifyImage {
  height: number;
  url: string;
  width: number;
}

interface SpotifyEpisode {
  id: string;
  name: string;
  description: string;
  release_date: string;
  duration_ms: number;
  images: SpotifyImage[];
  external_urls: {
    spotify: string;
  };
}

interface AuthContextType {
  user: User | null;
  role: "admin" | "profesor" | "alumno" | null;
  authReady: boolean;
  loading: boolean;
  dataReady: boolean;
  userProfile: any | null;

  alumnos: any[];
  alumnosRaw?: any[];
  misCursos: any[];
  allCursos?: any[];

  loadingCursos: boolean;
  loadingAllCursos?: boolean;

  reloadData?: () => Promise<void>;
  loadMisCursos?: (uid: string) => Promise<void>;
  loadAllCursos?: () => Promise<void>;

 // 🎬 Video del Dashboard (login)
  hasSeenWelcomeVideo: boolean;
  markWelcomeVideoAsSeen: () => Promise<void>;
  loadingVideoStatus: boolean;

  // 🤖 Video del Chatbot (nuevo)
  hasSeenChatbotVideo: boolean;
  markChatbotVideoAsSeen: () => Promise<void>;
  loadingChatbotVideoStatus: boolean;

  // 📚 Video del Course Player (NUEVO)
  hasSeenCoursePlayerVideo: boolean;
  markCoursePlayerVideoAsSeen: () => Promise<void>;
  loadingCoursePlayerVideoStatus: boolean;

  hasSeenChatbotTutorial: boolean;
  markChatbotTutorialAsSeen: () => Promise<void>;
  loadingChatbotTutorialStatus: boolean;

  // 📚 Tutorial del Course Player (NUEVO)
hasSeenCoursePlayerTutorial: boolean;
markCoursePlayerTutorialAsSeen: () => Promise<void>;
loadingCoursePlayerTutorialStatus: boolean;

podcastEpisodes: SpotifyEpisode[];
  loadingPodcast: boolean;
  loadPodcastEpisodes?: () => Promise<void>;
  saveCourseProgress?: (

    uid: string,
    courseId: string,
    data: any
  ) => Promise<void>;

  getCourseProgress?: (
    uid: string,
    courseId: string
  ) => Promise<any>;   // 👈 AGREGAR ESTO

  loggingOut: boolean;
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
  loggingOut: false,
logout: async () => {},
  hasSeenCoursePlayerTutorial: false,
  markCoursePlayerTutorialAsSeen: async () => {},
  loadingCoursePlayerTutorialStatus: false,
});

/* ==========================================================
   🔹 Proveedor del Contexto
   ========================================================== */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"admin" | "profesor" | "alumno" | null>(null);
  const [authReady, setAuthReady] = useState(false); // El usuario existe
  const [dataReady, setDataReady] = useState(false); // Los cursos/alumnos cargaron
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // 👈 1. Instanciamos el router aquí
  

  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [misCursos, setMisCursos] = useState<any[]>([]);
  const [allCursos, setAllCursos] = useState<any[]>([]);
  const [loadingCursos, setLoadingCursos] = useState(false);
  const [loadingAllCursos, setLoadingAllCursos] = useState(false);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [anuncios, setAnuncios] = useState<any[]>([]);
  const [loadingAnuncios, setLoadingAnuncios] = useState(true);
 
 // 🎬 Estados para video del dashboard
const [hasSeenWelcomeVideo, setHasSeenWelcomeVideo] = useState(false);
const [loadingVideoStatus, setLoadingVideoStatus] = useState(false); // 👈 CAMBIAR a false

// 🤖 Estados para video del chatbot
const [hasSeenChatbotVideo, setHasSeenChatbotVideo] = useState(false);
const [loadingChatbotVideoStatus, setLoadingChatbotVideoStatus] = useState(false); // 👈 CAMBIAR a false

// 📚 Estados para video del COURSE PLAYER
const [hasSeenCoursePlayerVideo, setHasSeenCoursePlayerVideo] = useState(false);
const [loadingCoursePlayerVideoStatus, setLoadingCoursePlayerVideoStatus] = useState(false); // 👈 CAMBIAR a false
const [hasSeenChatbotTutorial, setHasSeenChatbotTutorial] = useState(false);
const [loadingChatbotTutorialStatus, setLoadingChatbotTutorialStatus] = useState(false);
const [hasSeenCoursePlayerTutorial, setHasSeenCoursePlayerTutorial] = useState(false);
const [loadingCoursePlayerTutorialStatus, setLoadingCoursePlayerTutorialStatus] = useState(false);


  const [profesores, setProfesores] = useState<any[]>([]);
  const [loadingProfesores, setLoadingProfesores] = useState(false);

  const [podcastEpisodes, setPodcastEpisodes] = useState<SpotifyEpisode[]>([]);
const [loadingPodcast, setLoadingPodcast] = useState(false);

  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [loadingChatSessions, setLoadingChatSessions] = useState(false);
  const { setLang } = useI18n();
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [alumnosRaw, setAlumnosRaw] = useState<any[]>([]);

  const [loggingOut, setLoggingOut] = useState(false);




  // 🔥 NUEVA FUNCIÓN: Carga datos sin bloquear la UI
  const fetchInitialData = async (uid: string, userRole: string) => {
    console.log(`⚡ Iniciando carga de datos en background para: ${userRole}`);
    
    // Usamos Promise.allSettled para que si falla Spotify, no rompa la app
    const promises = [];

    // 1. Cargas comunes (ligeras)
    promises.push(loadChatSessions(uid));
    promises.push(loadAnuncios());
    promises.push(loadPodcastEpisodes());

    // 2. Cargas según Rol (AQUÍ ESTÁ EL AHORRO DE LECTURAS)
    if (userRole === "alumno") {
        // Alumno: Solo sus cursos. NO carga lista de alumnos.
        promises.push(loadMisCursos(uid));
    } 
    else if (userRole === "profesor") {
        promises.push(loadAllCursos());
        promises.push(loadProfesores());
    }
    else if (userRole === "admin") {
        // Admin: Carga todo
        promises.push(loadAllCursos());
        promises.push(loadProfesores());
        promises.push(loadAlumnos()); // ⚠️ Solo el admin gasta estas lecturas
    }

    await Promise.allSettled(promises);
    setDataReady(true); // Avisamos que los datos ya están
    console.log("✅ Datos cargados.");
  };
 /* ==========================================================
     🔹 Logout => Cierra sesion y REDIRECCIONA
     ========================================================== */

const logout = async () => {
  try {
    setLoggingOut(true);
    
    // 🔥 BORRAR COOKIE DE 2FA ANTES DE CERRAR SESIÓN
    Cookies.remove("admin_2fa_valid");
    
    await signOut(auth);
    
    // Limpieza de estado
    setUser(null);
    setRole(null);
    setMisCursos([]);
    setUserProfile(null);
    
    router.replace("/"); 
    
  } catch (err) {
    console.error("❌ Error al cerrar sesión:", err);
    toast.error("Error al cerrar sesión");
  } finally {
    setLoggingOut(false);
  }
};


/* ==========================================================
   🔹 Cargar alumnos (VERSIÓN CORREGIDA)
   ========================================================== */
// Modificar loadAlumnos para guardar ambos por separado
const loadAlumnos = async () => {
  try {
    const alumnosCampus = []; 
    const alumnosRawList = [];  // 👈 renombrado

    // 1) Leer alumnos reales del campus
    const alumnosRef = collection(db, "alumnos");
    const snap = await getDocs(alumnosRef);

    snap.forEach((batchDoc) => {
      const data = batchDoc.data();
      for (const key in data) {
        if (key.startsWith("user_")) {
          const u = data[key];

          const rawLanguage = u.learningLanguage || u.idioma || u.language || "";
          const rawLevel = u.learningLevel || u.nivel || "";

          if (u.role === "profesor" || u.role === "admin") continue;

          alumnosCampus.push({
            uid: u.uid,
            email: u.email,
            role: u.role,
            batchId: batchDoc.id,
            userKey: key,
            createdAt: u.createdAt ?? null,
            learningLanguage: rawLanguage.toString().toLowerCase().trim(),
            learningLevel: rawLevel.toString().toUpperCase().trim(),
            estadoAlumno: "Active",
            nombre: u.firstName && u.lastName 
              ? `${u.firstName} ${u.lastName}` 
              : u.nombre || u.email?.split("@")[0] || "Unknown",
          });
        }
      }
    });

    // 2) Leer alumnos importados (raw)
    const rawRef = collection(db, "alumnos_raw");
    const snapRaw = await getDocs(rawRef);

    snapRaw.forEach((batchDoc) => {
      const batchData = batchDoc.data();
      const batchId = batchDoc.id;

      for (const key in batchData) {
        if (key.startsWith("user_")) {
          const u = batchData[key];

          const rawLanguage = u.learningLanguage || u.idioma || u.language || "";
          const rawLevel = u.learningLevel || u.nivel || "";

          alumnosRawList.push({
            userKey: key,
            batchId,
            email: u.email,
            nombre: u.nombre || u.email?.split("@")[0] || "Unknown",
            learningLanguage: rawLanguage.toString().toLowerCase().trim(),
            learningLevel: rawLevel.toString().toUpperCase().trim(),
            estadoAlumno: u.estadoAlumno ?? "N/A",
            cursosAsignados: u.cursosAsignados || [], // 👈 CRÍTICO
            uid: null,
            createdAt: null,
          });
        }
      }
    });

    // 3) Guardar por separado
    const all = [...alumnosCampus, ...alumnosRawList];
    
    setAlumnos(all);           // 👈 Todos mezclados (para UI general)
    setAlumnosRaw(alumnosRawList); // 👈 Solo raw (para filtro de curso)
    
    console.log("✅ Alumnos cargados:", all.length);
    console.log("📦 Alumnos raw:", alumnosRawList.length);

  } catch (err) {
    console.error("❌ [AuthContext] Error cargando alumnos:", err);
  }
};

const loadPodcastEpisodes = async () => {
  setLoadingPodcast(true);
  try {
    const res = await fetch('/api/spotify');
    if (!res.ok) throw new Error('Failed to fetch podcast episodes');
    const data = await res.json();
    setPodcastEpisodes(data);
    console.log("🎙️ Episodios de podcast cargados:", data.length);
  } catch (error) {
    console.error("❌ Error cargando episodios del podcast:", error);
  } finally {
    setLoadingPodcast(false);
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
  games: formattedNames, // ← solo datos
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

// // 🎬 Marcar video del dashboard como visto (tu función existente)
//   const markWelcomeVideoAsSeen = async () => {
//     if (!user || !userProfile?.batchId || !userProfile?.userKey) {
//       console.error("❌ No se puede marcar video dashboard: faltan datos");
//       return;
//     }

//     try {
//       const batchRef = doc(db, "alumnos", userProfile.batchId);
//       const snap = await getDoc(batchRef);
      
//       if (!snap.exists()) throw new Error("Batch no existe");

//       const batchData = snap.data();
//       const userData = batchData[userProfile.userKey] || {};

//       await setDoc(
//         batchRef,
//         {
//           [userProfile.userKey]: {
//             ...userData,
//             hasSeenWelcomeVideo: true,
//             welcomeVideoSeenAt: new Date().toISOString(),
//           },
//         },
//         { merge: true }
//       );

//       setHasSeenWelcomeVideo(true);
//       setUserProfile({
//         ...userProfile,
//         hasSeenWelcomeVideo: true,
//         welcomeVideoSeenAt: new Date().toISOString(),
//       });

//       console.log("✅ Video dashboard marcado como visto");
//     } catch (err) {
//       console.error("❌ Error al marcar video dashboard:", err);
//       toast.error("Error al guardar el progreso del video");
//     }
//   };

//   // 🤖 Marcar video del CHATBOT como visto (NUEVA FUNCIÓN)
//   const markChatbotVideoAsSeen = async () => {
//     if (!user || !userProfile?.batchId || !userProfile?.userKey) {
//       console.error("❌ No se puede marcar video chatbot: faltan datos");
//       return;
//     }

//     try {
//       const batchRef = doc(db, "alumnos", userProfile.batchId);
//       const snap = await getDoc(batchRef);
      
//       if (!snap.exists()) throw new Error("Batch no existe");

//       const batchData = snap.data();
//       const userData = batchData[userProfile.userKey] || {};

//       await setDoc(
//         batchRef,
//         {
//           [userProfile.userKey]: {
//             ...userData,
//             hasSeenChatbotVideo: true, // 👈 Campo diferente
//             chatbotVideoSeenAt: new Date().toISOString(),
//           },
//         },
//         { merge: true }
//       );

//       setHasSeenChatbotVideo(true);
//       setUserProfile({
//         ...userProfile,
//         hasSeenChatbotVideo: true,
//         chatbotVideoSeenAt: new Date().toISOString(),
//       });

//       console.log("✅ Video chatbot marcado como visto");
//     } catch (err) {
//       console.error("❌ Error al marcar video chatbot:", err);
//       toast.error("Error al guardar el progreso del video");
//     }
//   };

//   // 📚 Marcar video del COURSE PLAYER como visto (NUEVA FUNCIÓN)
//   const markCoursePlayerVideoAsSeen = async () => {
//     if (!user || !userProfile?.batchId || !userProfile?.userKey) {
//       console.error("❌ No se puede marcar video course player: faltan datos");
//       return;
//     }

//     try {
//       const batchRef = doc(db, "alumnos", userProfile.batchId);
//       const snap = await getDoc(batchRef);
      
//       if (!snap.exists()) throw new Error("Batch no existe");

//       const batchData = snap.data();
//       const userData = batchData[userProfile.userKey] || {};

//       await setDoc(
//         batchRef,
//         {
//           [userProfile.userKey]: {
//             ...userData,
//             hasSeenCoursePlayerVideo: true, // 👈 Campo específico
//             coursePlayerVideoSeenAt: new Date().toISOString(),
//           },
//         },
//         { merge: true }
//       );

//       setHasSeenCoursePlayerVideo(true);
//       setUserProfile({
//         ...userProfile,
//         hasSeenCoursePlayerVideo: true,
//         coursePlayerVideoSeenAt: new Date().toISOString(),
//       });

//       console.log("✅ Video course player marcado como visto");
//     } catch (err) {
//       console.error("❌ Error al marcar video course player:", err);
//       toast.error("Error al guardar el progreso del video");
//     }
//   };

// // 🎓 Marcar tutorial del CHATBOT como visto (NUEVA FUNCIÓN)
// const markChatbotTutorialAsSeen = async () => {
//   if (!user || !userProfile?.batchId || !userProfile?.userKey) {
//     console.error("❌ No se puede marcar tutorial chatbot: faltan datos");
//     return;
//   }

//   try {
//     const batchRef = doc(db, "alumnos", userProfile.batchId);
//     const snap = await getDoc(batchRef);
    
//     if (!snap.exists()) throw new Error("Batch no existe");

//     const batchData = snap.data();
//     const userData = batchData[userProfile.userKey] || {};

//     await setDoc(
//       batchRef,
//       {
//         [userProfile.userKey]: {
//           ...userData,
//           hasSeenChatbotTutorial: true, // 👈 Campo específico
//           chatbotTutorialSeenAt: new Date().toISOString(),
//         },
//       },
//       { merge: true }
//     );

//     setHasSeenChatbotTutorial(true);
//     setUserProfile({
//       ...userProfile,
//       hasSeenChatbotTutorial: true,
//       chatbotTutorialSeenAt: new Date().toISOString(),
//     });

//     console.log("✅ Tutorial chatbot marcado como visto");
//   } catch (err) {
//     console.error("❌ Error al marcar tutorial chatbot:", err);
//     toast.error("Error al guardar el progreso del tutorial");
//   }
// };


// BORRAR ESTAS FUNCIONES LUEGO DE LAS DEMOS Y DESCOMENTAR LO DE ARRIBA
const markChatbotTutorialAsSeen = async () => {
  console.log("⚠️ Función deshabilitada - video siempre visible");
  // No hace nada
};
const markWelcomeVideoAsSeen = async () => {
  console.log("⚠️ Función deshabilitada - video siempre visible");
  // No hace nada
};

const markChatbotVideoAsSeen = async () => {
  console.log("⚠️ Función deshabilitada - video siempre visible");
  // No hace nada
};

const markCoursePlayerVideoAsSeen = async () => {
  console.log("⚠️ Función deshabilitada - video siempre visible");
  // No hace nada
};

// BORRAR ESTAS FUNCIONES LUEGO DE LAS DEMOS Y DESCOMENTAR LO DE ARRIBA
const markCoursePlayerTutorialAsSeen = async () => {
  console.log("⚠️ Función deshabilitada - tutorial siempre visible");
  // No hace nada
};
  /* ==========================================================
   🔹 Cargar cursos + progreso real del alumno
   ========================================================== */
const loadMisCursos = async (uid: string) => {
  setLoadingCursos(true);

  try {
    const profile = await fetchUserFromBatchesByUid(uid);
    if (!profile) {
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

    if (!Array.isArray(cursosIds) || cursosIds.length === 0) {
      setMisCursos([]);
      return;
    }

    // 🔥 OPTIMIZACIÓN: Traer TODOS los cursos de una vez
    const snapCursos = await getDocs(collection(db, "cursos"));
    const allCursosMap = new Map(
      snapCursos.docs.map((d) => [d.id, { id: d.id, ...d.data() }])
    );

    const cursosAlumno: any[] = [];

    // 🔥 Filtrar solo los cursos del alumno SIN lecturas adicionales
    for (const id of cursosIds) {
      const curso = allCursosMap.get(id);
      if (!curso) continue;

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


  const loadAnuncios = async () => {
  setLoadingAnuncios(true);
  try {
    const snap = await getDocs(collection(db, "anuncios"));

    // El admin debe recibir TODOS los anuncios, visibles y ocultos.
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    setAnuncios(list);
  } catch (err) {
    console.error("❌ Error cargando anuncios:", err);
  } finally {
    setLoadingAnuncios(false);
  }
};

const getCourseById = async (id: string) => {
  try {
    // 1) Buscar en allCursos primero
    if (allCursos.length > 0) {
      const found = allCursos.find((c) => c.id === id);
      if (found) return found;
    }

    // 2) Fallback: traerlo de Firestore
    const snap = await getDoc(doc(db, "cursos", id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };

  } catch (err) {
    console.error("❌ Error getCourseById:", err);
    return null;
  }
};

  /* ==========================================================
   🔹 Cargar profesores (para admin)
   ========================================================== */
const loadProfesores = async () => {
  setLoadingProfesores(true);
  try {
    const profesoresList = [];

    const alumnosRef = collection(db, "alumnos");
    const snap = await getDocs(alumnosRef);

    snap.forEach((batchDoc) => {
      const data = batchDoc.data();

      for (const key in data) {
        // Buscamos usuarios dentro del batch
        if (key.startsWith("user_")) {
          const u = data[key];

          // 🔥 Filtrar solo PROFESORES
          if (u.role === "profesor") {
            profesoresList.push({
              uid: u.uid,
              email: u.email,
              nombre: u.firstName || u.nombre || "",
              apellido: u.lastName || "",
              idiomasProfesor: u.idiomasProfesor || [],
              batchId: batchDoc.id,
              userKey: key,
              createdAt: u.createdAt ?? null,
            });
          }
        }
      }
    });

    setProfesores(profesoresList);
    console.log("👨‍🏫 Profesores cargados:", profesoresList.length);

  } catch (err) {
    console.error("❌ Error cargando profesores:", err);
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
      loadAnuncios?.()
    ]);
  } else if (role === "alumno") {
  await Promise.all([
    loadAlumnos?.(),
    loadMisCursos?.(user.uid),
  ]);
} else if (role === "profesor") {
  await Promise.all([
    loadAllCursos?.(),
    loadProfesores?.(),
  ]);
} else {
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

          // -----------------------------------------------------------
          // FASE 1: Identidad (Bloqueante, pero rápida)
          // -----------------------------------------------------------
          
          // 1. Buscar perfil en batches
          let profile = await fetchUserFromBatchesByUid(firebaseUser.uid);

          // 2. Si es nuevo, crearlo
          if (!profile) {
            console.log("⚠️ Usuario nuevo detectado, creando...");
            await addUserToBatch(firebaseUser, "alumno");
            profile = await fetchUserFromBatchesByUid(firebaseUser.uid);
          }

          // 3. Completar datos del perfil
          if (profile?.batchId) {
            const batchRef = doc(db, "alumnos", profile.batchId);
            const snap = await getDoc(batchRef);
            if (snap.exists()) {
               const data = snap.data()[profile.userKey] || {};
               profile = { ...profile, ...data };
            }
          }

          // 4. Determinar Rol e Idioma
          const resolvedRole = profile?.role || "alumno";
          setRole(resolvedRole);
          setUserProfile(profile);

          const lang = resolvedRole === "profesor" ? "en" : (profile.learningLanguage || "en");
          setLang(lang);

          // 🔓 LIBERAMOS LA UI AQUÍ: El usuario ya entra al dashboard
          setAuthReady(true);
          setLoading(false);

          // -----------------------------------------------------------
          // FASE 2: Datos Pesados (Segundo plano)
          // -----------------------------------------------------------
          // Ya no bloqueamos al usuario esperando loadAlumnos
          fetchInitialData(firebaseUser.uid, resolvedRole);

        } else {
          // Logout / Sin usuario
          setUser(null);
          setRole(null);
          setMisCursos([]);
          setUserProfile(null);
          setAuthReady(true);
          setLoading(false);
        }
      } catch (error) {
        console.error("❌ Error Auth:", error);
        setLoading(false);
        setAuthReady(true); // Dejar entrar para mostrar error
      }
    });

    return () => unsubscribe();
  }, []);

/* ==========================================================
   🔥 Paso 3 — Cargar actividad cuando TODO esté listo
========================================================== */
// ✅ Agregar flag para evitar re-ejecución
const activityLoadedRef = useRef(false);

useEffect(() => {
  if (!authReady || !user || !userProfile?.batchId) return;
  if (role !== "alumno" || loadingCursos) return;
  if (activityLoadedRef.current) return; // 👈 CRÍTICO

  activityLoadedRef.current = true;
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
    dataReady,

    // --- Datos académicos ---
    alumnos,
    alumnosRaw,
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
    loadAlumnos,   
    anuncios,
    loadingAnuncios,
    loadAnuncios,
     
    // 🎬 Video Dashboard
      hasSeenWelcomeVideo,
      markWelcomeVideoAsSeen,
      loadingVideoStatus,

      // 🤖 Video Chatbot (NUEVO)
      hasSeenChatbotVideo,
      markChatbotVideoAsSeen,
      loadingChatbotVideoStatus,

      // 📚 Video Course Player (NUEVO)
      hasSeenCoursePlayerVideo,
      markCoursePlayerVideoAsSeen,
      loadingCoursePlayerVideoStatus,

      hasSeenChatbotTutorial,
    markChatbotTutorialAsSeen,
    loadingChatbotTutorialStatus,

    // 📚 Tutorial Course Player (NUEVO)
    hasSeenCoursePlayerTutorial,
    markCoursePlayerTutorialAsSeen,
    loadingCoursePlayerTutorialStatus,

      podcastEpisodes,
    loadingPodcast,
    loadPodcastEpisodes,



    saveCourseProgress,
    getCourseProgress,

    logout,
    loggingOut,
    setUserProfile,
    getCourseById,
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
    anuncios,               // 👈 NECESARIO
    loadingAnuncios,        // 👈 NECESARIO
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
