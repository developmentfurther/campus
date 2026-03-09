"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import {
  doc, getDoc, getDocs, collection, setDoc, deleteDoc,
  onSnapshot, query, orderBy,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUserFromBatchesByUid } from "@/lib/userBatches";
import { toast } from "sonner";
import { getCourseProgressStats } from "@/lib/courseUtils"; // 👈 mover esta función a un archivo util

interface AlumnoContextType {
  misCursos: any[];
  loadingCursos: boolean;
  loadMisCursos: (uid: string) => Promise<void>;

  podcastEpisodes: any[];
  loadingPodcast: boolean;

  chatSessions: any[];
  loadingChatSessions: boolean;

  tutorialsSeen: Record<string, boolean>;
  markTutorialAsSeen: (id: string) => Promise<void>;

  hasSeenWelcomeVideo: boolean;
  markWelcomeVideoAsSeen: () => Promise<void>;
  hasSeenChatbotVideo: boolean;
  markChatbotVideoAsSeen: () => Promise<void>;
  hasSeenCoursePlayerVideo: boolean;
  markCoursePlayerVideoAsSeen: () => Promise<void>;
  hasSeenChatbotTutorial: boolean;
  markChatbotTutorialAsSeen: () => Promise<void>;
  hasSeenCoursePlayerTutorial: boolean;
  markCoursePlayerTutorialAsSeen: () => Promise<void>;

  saveCourseProgress: (uid: string, courseId: string, data: any) => Promise<void>;
  getCourseProgress: (uid: string, courseId: string) => Promise<any>;

  recentActivity: any[];
  loadingActivity: boolean;

  anuncios: any[];
  loadingAnuncios: boolean; 

  allDataLoaded: boolean;
}

const AlumnoContext = createContext<AlumnoContextType>({
  misCursos: [],
  loadingCursos: false,
  loadMisCursos: async () => {},
  podcastEpisodes: [],
  loadingPodcast: false,
  chatSessions: [],
  loadingChatSessions: false,
  tutorialsSeen: {},
  markTutorialAsSeen: async () => {},
  hasSeenWelcomeVideo: false,
  markWelcomeVideoAsSeen: async () => {},
  hasSeenChatbotVideo: false,
  markChatbotVideoAsSeen: async () => {},
  hasSeenCoursePlayerVideo: false,
  markCoursePlayerVideoAsSeen: async () => {},
  hasSeenChatbotTutorial: false,
  markChatbotTutorialAsSeen: async () => {},
  hasSeenCoursePlayerTutorial: false,
  markCoursePlayerTutorialAsSeen: async () => {},
  saveCourseProgress: async () => {},
  getCourseProgress: async () => ({}),
  recentActivity: [],
  loadingActivity: false,
  anuncios: [],
  loadingAnuncios: false,
  allDataLoaded: true, // 👈 true para que admin/profesor no queden bloqueados
});
export const AlumnoProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, userProfile, setUserProfile } = useAuth();

  const [misCursos, setMisCursos] = useState<any[]>([]);
  const [loadingCursos, setLoadingCursos] = useState(false);
  const [podcastEpisodes, setPodcastEpisodes] = useState<any[]>([]);
  const [loadingPodcast, setLoadingPodcast] = useState(false);
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [loadingChatSessions, setLoadingChatSessions] = useState(false);
  const [tutorialsSeen, setTutorialsSeen] = useState<Record<string, boolean>>({});
  const [hasSeenWelcomeVideo, setHasSeenWelcomeVideo] = useState(false);
  const [hasSeenChatbotVideo, setHasSeenChatbotVideo] = useState(false);
  const [hasSeenCoursePlayerVideo, setHasSeenCoursePlayerVideo] = useState(false);
  const [hasSeenChatbotTutorial, setHasSeenChatbotTutorial] = useState(false);
  const [hasSeenCoursePlayerTutorial, setHasSeenCoursePlayerTutorial] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [allDataLoaded, setAllDataLoaded] = useState(false);
  const [anuncios, setAnuncios] = useState<any[]>([]);
const [loadingAnuncios, setLoadingAnuncios] = useState(false);
  const chatUnsubscribeRef = useRef<(() => void) | null>(null);

  // Inicializar flags desde el perfil
  useEffect(() => {
    if (!userProfile) return;
    setTutorialsSeen(userProfile.tutorialsSeen || {});
    setHasSeenWelcomeVideo(userProfile.hasSeenWelcomeVideo === true);
    setHasSeenChatbotVideo(userProfile.hasSeenChatbotVideo === true);
    setHasSeenCoursePlayerVideo(userProfile.hasSeenCoursePlayerVideo === true);
    setHasSeenChatbotTutorial(userProfile.hasSeenChatbotTutorial === true);
    setHasSeenCoursePlayerTutorial(userProfile.hasSeenCoursePlayerTutorial === true);
  }, [userProfile?.uid]);

  // Cargar datos al montar
  useEffect(() => {
    if (!user) return;
    Promise.all([
      loadMisCursos(user.uid),
      loadPodcastEpisodes(),
      loadAnuncios(),
    ]).then(() => setAllDataLoaded(true));
    loadChatSessions(user.uid);

    return () => {
      chatUnsubscribeRef.current?.();
    };
  }, [user?.uid]);

  const loadMisCursos = async (uid: string) => {
    setLoadingCursos(true);
    try {
      const profile = await fetchUserFromBatchesByUid(uid);
      if (!profile) { setMisCursos([]); return; }

      const snap = await getDoc(doc(db, "alumnos", profile.batchId));
      if (!snap.exists()) { setMisCursos([]); return; }

      const data = snap.data();
      const userKey = Object.keys(data).find(k => k.startsWith("user_") && data[k]?.uid === uid);
      if (!userKey) return;

      const alumno = data[userKey];
      const cursosIds = alumno?.cursosAdquiridos || [];
      const progreso = alumno?.progreso || {};

      if (!cursosIds.length) { setMisCursos([]); return; }

      const snapCursos = await getDocs(collection(db, "cursos"));
      const allCursosMap = new Map(snapCursos.docs.map(d => [d.id, { id: d.id, ...d.data() }]));

      const cursosAlumno = cursosIds.reduce((acc: any[], id: string) => {
        const curso = allCursosMap.get(id);
        if (!curso) return acc;
        const prog = progreso?.[id]?.byLesson || {};
        const stats = getCourseProgressStats(prog, (curso as any).unidades || []);
        return [...acc, { ...curso, progreso: { byLesson: prog }, ...stats }];
      }, []);

      setMisCursos(cursosAlumno);
    } catch (err) {
      console.error("❌ Error cargando cursos:", err);
      setMisCursos([]);
    } finally {
      setLoadingCursos(false);
    }
  };

  const loadPodcastEpisodes = async () => {
    setLoadingPodcast(true);
    try {
      const res = await fetch("/api/spotify");
      const data = await res.json();
      setPodcastEpisodes(data);
    } catch {
      setPodcastEpisodes([]);
    } finally {
      setLoadingPodcast(false);
    }
  };

  const loadChatSessions = (uid: string) => {
    chatUnsubscribeRef.current?.();
    setLoadingChatSessions(true);
    const q = query(collection(db, "conversaciones", uid, "sessions"), orderBy("endedAt", "desc"));
    chatUnsubscribeRef.current = onSnapshot(q, (snap) => {
      const now = Date.now();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      const list: any[] = [];
      snap.docs.forEach(d => {
        const endedAt = d.data().endedAt?.toDate?.() ?? null;
        if (endedAt && now - endedAt.getTime() > sevenDays) {
          deleteDoc(doc(db, "conversaciones", uid, "sessions", d.id));
          return;
        }
        list.push({ id: d.id, ...d.data() });
      });
      setChatSessions(list);
      setLoadingChatSessions(false);
    });
  };

  const loadAnuncios = async () => {
  setLoadingAnuncios(true);
  try {
    const snap = await getDocs(collection(db, "anuncios"));
    setAnuncios(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter((a: any) => a.visible !== false));
  } catch { setAnuncios([]); } finally { setLoadingAnuncios(false); }
};

  // Helper genérico para marcar flags en Firestore
  const markFlag = async (field: string, setter: (v: boolean) => void) => {
    if (!user || !userProfile?.batchId || !userProfile?.userKey) return;
    try {
      const batchRef = doc(db, "alumnos", userProfile.batchId);
      const snap = await getDoc(batchRef);
      if (!snap.exists()) return;
      const userData = snap.data()[userProfile.userKey] || {};
      await setDoc(batchRef, {
        [userProfile.userKey]: { ...userData, [field]: true, [`${field}At`]: new Date().toISOString() }
      }, { merge: true });
      setter(true);
      setUserProfile({ ...userProfile, [field]: true });
    } catch (err) {
      toast.error("Error guardando progreso");
    }
  };

  const markTutorialAsSeen = async (tutorialId: string) => {
    if (!user || !userProfile?.batchId || !userProfile?.userKey) return;
    try {
      const batchRef = doc(db, "alumnos", userProfile.batchId);
      const snap = await getDoc(batchRef);
      if (!snap.exists()) return;
      const userData = snap.data()[userProfile.userKey] || {};
      const updated = { ...(userData.tutorialsSeen || {}), [tutorialId]: true };
      await setDoc(batchRef, {
        [userProfile.userKey]: { ...userData, tutorialsSeen: updated }
      }, { merge: true });
      setTutorialsSeen(prev => ({ ...prev, [tutorialId]: true }));
    } catch (err) {
      console.error("Error guardando tutorial:", err);
    }
  };

  const saveCourseProgress = async (uid: string, courseId: string, data: Record<string, any>) => {
    try {
      const profile = await fetchUserFromBatchesByUid(uid);
      if (!profile) return;
      const batchRef = doc(db, "alumnos", profile.batchId);
      const snap = await getDoc(batchRef);
      if (!snap.exists()) return;
      const batchData = snap.data();
      const userKey = Object.keys(batchData).find(k => k.startsWith("user_") && batchData[k]?.uid === uid);
      if (!userKey) return;
      const userData = batchData[userKey] || {};
      const prevProgreso = userData.progreso || {};
      const prevByLesson = prevProgreso[courseId]?.byLesson || {};
      await setDoc(batchRef, {
        [userKey]: { ...userData, progreso: { ...prevProgreso, [courseId]: { byLesson: { ...prevByLesson, ...data } } } }
      }, { merge: true });
    } catch (err) {
      toast.error("Error guardando progreso del curso");
    }
  };

  const getCourseProgress = async (uid: string, courseId: string) => {
    try {
      const profile = await fetchUserFromBatchesByUid(uid);
      if (!profile) return {};
      const snap = await getDoc(doc(db, "alumnos", profile.batchId));
      if (!snap.exists()) return {};
      const data = snap.data();
      const userKey = Object.keys(data).find(k => k.startsWith("user_") && data[k]?.uid === uid);
      return userKey ? data[userKey]?.progreso?.[courseId] || {} : {};
    } catch { return {}; }
  };

  return (
    <AlumnoContext.Provider value={{
      misCursos, loadingCursos, loadMisCursos,
      podcastEpisodes, loadingPodcast,
      chatSessions, loadingChatSessions,
      tutorialsSeen, markTutorialAsSeen,
      hasSeenWelcomeVideo, markWelcomeVideoAsSeen: () => markFlag("hasSeenWelcomeVideo", setHasSeenWelcomeVideo),
      hasSeenChatbotVideo, markChatbotVideoAsSeen: () => markFlag("hasSeenChatbotVideo", setHasSeenChatbotVideo),
      hasSeenCoursePlayerVideo, markCoursePlayerVideoAsSeen: () => markFlag("hasSeenCoursePlayerVideo", setHasSeenCoursePlayerVideo),
      hasSeenChatbotTutorial, markChatbotTutorialAsSeen: () => markFlag("hasSeenChatbotTutorial", setHasSeenChatbotTutorial),
      hasSeenCoursePlayerTutorial, markCoursePlayerTutorialAsSeen: () => markFlag("hasSeenCoursePlayerTutorial", setHasSeenCoursePlayerTutorial),
      saveCourseProgress, getCourseProgress,
      recentActivity, loadingActivity,
      anuncios, loadingAnuncios,
      allDataLoaded,
    }}>
      {children}
    </AlumnoContext.Provider>
  );
};

export const useAlumno = () => useContext(AlumnoContext);