"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, getDocs, collection, setDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { fetchProfesorByUid, ProfesorProfile } from "@/lib/profesorBatches";
import { getCourseProgressStats } from "@/lib/courseUtils";

interface AlumnoConProgreso {
  uid: string;
  email: string;
  nombre?: string;
  batchId: string;
  userKey: string;
  cursos: any[];
  chatSessions: any[];
  nivel: string;
}

interface ProfesorContextType {
  profesorProfile: ProfesorProfile | null;
  loadingPerfil: boolean;
  misAlumnos: AlumnoConProgreso[];
  loadingAlumnos: boolean;
  loadMisAlumnos: () => Promise<void>;
  saveCourseProgress: (courseId: string, data: any) => Promise<void>;
  allDataLoaded: boolean;
  allCursos: any[];
loadingAllCursos: boolean;
getCourseProgress: (courseId: string) => Promise<any>;
}

const ProfesorContext = createContext<ProfesorContextType>({
  profesorProfile: null,
  loadingPerfil: false,
  misAlumnos: [],
  loadingAlumnos: false,
  loadMisAlumnos: async () => {},
  saveCourseProgress: async () => {},
  allDataLoaded: false,
  allCursos: [],           
  loadingAllCursos: false, 
  getCourseProgress: async () => ({}),
});

export const ProfesorProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  const [profesorProfile, setProfesorProfile] = useState<ProfesorProfile | null>(null);
  const [loadingPerfil, setLoadingPerfil] = useState(false);
  const [misAlumnos, setMisAlumnos] = useState<AlumnoConProgreso[]>([]);
  const [loadingAlumnos, setLoadingAlumnos] = useState(false);
  const [allDataLoaded, setAllDataLoaded] = useState(false);
  const [allCursos, setAllCursos] = useState<any[]>([]);
  const [loadingAllCursos, setLoadingAllCursos] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadPerfil(user.uid);
  }, [user?.uid]);

  const loadPerfil = async (uid: string) => {
  setLoadingPerfil(true);
  try {
    const perfil = await fetchProfesorByUid(uid);
    setProfesorProfile(perfil);
    if (perfil) await loadMisAlumnosInternal(perfil.alumnos);
    await loadAllCursos(); // ← agregar esto
  } finally {
    setLoadingPerfil(false);
    setAllDataLoaded(true);
  }
};

const loadAllCursos = async () => {
  setLoadingAllCursos(true);
  try {
    const snapCursos = await getDocs(collection(db, "cursos"));
    const cursos = snapCursos.docs.map(d => ({ id: d.id, ...d.data() }));
    setAllCursos(cursos);
  } catch (err) {
    console.error("Error cargando cursos:", err);
    setAllCursos([]);
  } finally {
    setLoadingAllCursos(false);
  }
};
  const loadMisAlumnosInternal = async (alumnoUids: string[]) => {
    if (!alumnoUids.length) { setMisAlumnos([]); return; }
    setLoadingAlumnos(true);

    try {
      // Buscar los alumnos en la colección alumnos
      const alumnosSnap = await getDocs(collection(db, "alumnos"));
      const cursosSnap = await getDocs(collection(db, "cursos"));
      const allCursosMap = new Map(cursosSnap.docs.map(d => [d.id, { id: d.id, ...d.data() }]));

      const result: AlumnoConProgreso[] = [];

      for (const batchDoc of alumnosSnap.docs) {
        if (!batchDoc.id.startsWith("batch_")) continue;
        const data = batchDoc.data();

        for (const key in data) {
          if (!key.startsWith("user_")) continue;
          const alumno = data[key];
          if (!alumnoUids.includes(alumno.uid)) continue;

          // Cursos con progreso
          const cursosIds = alumno.cursosAdquiridos || [];
          const progreso = alumno.progreso || {};
          const cursos = cursosIds.map((id: string) => {
            const curso = allCursosMap.get(id);
            if (!curso) return null;
            const prog = progreso?.[id]?.byLesson || {};
            const stats = getCourseProgressStats(prog, (curso as any).unidades || []);
            return { ...curso, progreso: { byLesson: prog }, ...stats };
          }).filter(Boolean);

          // Chat sessions
          let chatSessions: any[] = [];
          try {
            const sessionsSnap = await getDoc(doc(db, "chatSessions", batchDoc.id));
            if (sessionsSnap.exists()) {
              chatSessions = sessionsSnap.data()?.[key] ?? [];
            }
          } catch {}

          result.push({
            uid: alumno.uid,
            email: alumno.email,
            nombre: alumno.nombre || alumno.displayName || alumno.email,
            batchId: batchDoc.id,
            userKey: key,
            cursos,
            chatSessions,
            nivel: alumno.learningLevel || "A1",
          });
        }
      }

      setMisAlumnos(result);
    } finally {
      setLoadingAlumnos(false);
    }
  };

  const loadMisAlumnos = useCallback(async () => {
    if (profesorProfile?.alumnos) {
      await loadMisAlumnosInternal(profesorProfile.alumnos);
    }
  }, [profesorProfile]);

  const saveCourseProgress = useCallback(async (courseId: string, data: Record<string, any>) => {
    console.log("🔥 PROFESOR saveCourseProgress llamado");
  console.log("profesorProfile completo:", profesorProfile);
  console.log("batchId:", profesorProfile?.batchId);
  console.log("userKey:", profesorProfile?.userKey);
    
    if (!profesorProfile?.batchId || !profesorProfile?.userKey) return;
    try {
      const batchRef = doc(db, "profesores", profesorProfile.batchId);
      const snap = await getDoc(batchRef);
      if (!snap.exists()) return;

      const userData = snap.data()[profesorProfile.userKey] || {};
      const prevByLesson = userData?.progreso?.[courseId]?.byLesson || {};

      await setDoc(batchRef, {
        [profesorProfile.userKey]: {
          ...userData,
          progreso: {
            ...(userData.progreso || {}),
            [courseId]: { byLesson: { ...prevByLesson, ...data } }
          }
        }
      }, { merge: true });
    } catch (err) {
      console.error("Error guardando progreso profesor:", err);
    }
  }, [profesorProfile]);

const getCourseProgress = useCallback(async (courseId: string) => {
  if (!profesorProfile?.batchId || !profesorProfile?.userKey) return {};
  try {
    const snap = await getDoc(doc(db, "profesores", profesorProfile.batchId));
    if (!snap.exists()) return {};
    const data = snap.data();
    return data[profesorProfile.userKey]?.progreso?.[courseId] || {};
  } catch {
    return {};
  }
}, [profesorProfile?.batchId, profesorProfile?.userKey]);

  return (
    <ProfesorContext.Provider value={{
      profesorProfile,
      loadingPerfil,
      misAlumnos,
      loadingAlumnos,
      loadMisAlumnos,
      saveCourseProgress,
      allDataLoaded,
      allCursos,
      loadingAllCursos,
      getCourseProgress
    }}>
      {children}
    </ProfesorContext.Provider>
  );
};

export const useProfesor = () => useContext(ProfesorContext);