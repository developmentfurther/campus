"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  doc, getDoc, getDocs, collection, setDoc,
  onSnapshot,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUserFromBatchesByUid } from "@/lib/userBatches";
import { toast } from "sonner";
import { getCourseProgressStats } from "@/lib/courseUtils";

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
  allDataLoaded: true,
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
  const [recentActivity] = useState<any[]>([]);
  const [allDataLoaded, setAllDataLoaded] = useState(false);
  const [anuncios, setAnuncios] = useState<any[]>([]);
  const [loadingAnuncios, setLoadingAnuncios] = useState(false);
  const chatUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!userProfile) return;
    setTutorialsSeen(userProfile.tutorialsSeen || {});
    setHasSeenWelcomeVideo(userProfile.hasSeenWelcomeVideo === true);
    setHasSeenChatbotVideo(userProfile.hasSeenChatbotVideo === true);
    setHasSeenCoursePlayerVideo(userProfile.hasSeenCoursePlayerVideo === true);
    setHasSeenChatbotTutorial(userProfile.hasSeenChatbotTutorial === true);
    setHasSeenCoursePlayerTutorial(userProfile.hasSeenCoursePlayerTutorial === true);
  }, [userProfile?.uid]);

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
      console.error("Error cargando cursos:", err);
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

  const loadChatSessions = async (uid: string) => {
    setLoadingChatSessions(true);
    try {
      const profile = await fetchUserFromBatchesByUid(uid);
      if (!profile?.batchId || !profile?.userKey) {
        setChatSessions([]);
        setLoadingChatSessions(false);
        return;
      }

      const batchRef = doc(db, "chatSessions", profile.batchId);
      chatUnsubscribeRef.current?.();

      chatUnsubscribeRef.current = onSnapshot(batchRef, (snap) => {
        if (!snap.exists()) {
          setChatSessions([]);
          setLoadingChatSessions(false);
          return;
        }
        const sessions: any[] = snap.data()?.[profile.userKey] ?? [];
        const sorted = [...sessions].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setChatSessions(sorted);
        setLoadingChatSessions(false);
      });
    } catch (err) {
      console.error("Error cargando chat sessions:", err);
      setChatSessions([]);
      setLoadingChatSessions(false);
    }
  };

  const loadAnuncios = async () => {
    setLoadingAnuncios(true);
    try {
      const snap = await getDocs(collection(db, "anuncios"));
      setAnuncios(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter((a: any) => a.visible !== false));
    } catch {
      setAnuncios([]);
    } finally {
      setLoadingAnuncios(false);
    }
  };

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
    } catch {
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

  const saveCourseProgress = useCallback(async (
    uid: string,
    courseId: string,
    data: Record<string, any>
  ) => {
    if (!uid || !courseId) return;

    const batchId = userProfile?.batchId;
    const userKey = userProfile?.userKey;

    if (!batchId || !userKey) return;

    try {
      const batchRef = doc(db, "alumnos", batchId);
      const snap = await getDoc(batchRef);
      if (!snap.exists()) return;

      const batchData = snap.data();
      const userData = batchData[userKey] || {};
      const prevByLesson = userData?.progreso?.[courseId]?.byLesson || {};

      await setDoc(batchRef, {
        [userKey]: {
          ...userData,
          progreso: {
            ...(userData.progreso || {}),
            [courseId]: {
              byLesson: { ...prevByLesson, ...data }
            }
          }
        }
      }, { merge: true });
    } catch (err) {
      console.error("Error guardando progreso:", err);
      toast.error("No se pudo guardar el progreso");
    }
  }, [userProfile?.batchId, userProfile?.userKey]);

  const getCourseProgress = useCallback(async (uid: string, courseId: string) => {
    try {
      const batchId = userProfile?.batchId;
      const userKey = userProfile?.userKey;
      if (!batchId || !userKey) return {};

      const snap = await getDoc(doc(db, "alumnos", batchId));
      if (!snap.exists()) return {};

      const data = snap.data();
      return data[userKey]?.progreso?.[courseId] || {};
    } catch {
      return {};
    }
  }, [userProfile?.batchId, userProfile?.userKey]);

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
      recentActivity, loadingActivity: false,
      anuncios, loadingAnuncios,
      allDataLoaded,
    }}>
      {children}
    </AlumnoContext.Provider>
  );
};

export const useAlumno = () => useContext(AlumnoContext);