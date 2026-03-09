"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import {
  doc, getDocs, collection, deleteDoc,
  onSnapshot, query, orderBy,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface AdminContextType {
  allCursos: any[];
  loadingAllCursos: boolean;
  loadAllCursos: () => Promise<void>;

  alumnos: any[];
  alumnosRaw: any[];
  loadingAlumnos: boolean;
  loadAlumnos: () => Promise<void>;

  profesores: any[];
  loadingProfesores: boolean;
  loadProfesores: () => Promise<void>;

  anuncios: any[];
  loadingAnuncios: boolean;
  loadAnuncios: () => Promise<void>;

  chatSessions: any[];
  loadingChatSessions: boolean;

  podcastEpisodes: any[];
  loadingPodcast: boolean;

  reloadData: () => Promise<void>;
  allDataLoaded: boolean;
}

const AdminContext = createContext<AdminContextType>({} as AdminContextType);

export const AdminProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  const [allCursos, setAllCursos] = useState<any[]>([]);
  const [loadingAllCursos, setLoadingAllCursos] = useState(false);
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [alumnosRaw, setAlumnosRaw] = useState<any[]>([]);
  const [loadingAlumnos, setLoadingAlumnos] = useState(false);
  const [profesores, setProfesores] = useState<any[]>([]);
  const [loadingProfesores, setLoadingProfesores] = useState(false);
  const [anuncios, setAnuncios] = useState<any[]>([]);
  const [loadingAnuncios, setLoadingAnuncios] = useState(false);
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [loadingChatSessions, setLoadingChatSessions] = useState(false);
  const [podcastEpisodes, setPodcastEpisodes] = useState<any[]>([]);
  const [loadingPodcast, setLoadingPodcast] = useState(false);
  const [allDataLoaded, setAllDataLoaded] = useState(false);

  const chatUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      loadAllCursos(),
      loadAlumnos(),
      loadProfesores(),
      loadAnuncios(),
      loadPodcastEpisodes(),
    ]).then(() => setAllDataLoaded(true));
    loadChatSessions(user.uid);

    return () => { chatUnsubscribeRef.current?.(); };
  }, [user?.uid]);

  const loadAllCursos = async () => {
    setLoadingAllCursos(true);
    try {
      const snap = await getDocs(collection(db, "cursos"));
      setAllCursos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch { setAllCursos([]); } finally { setLoadingAllCursos(false); }
  };

  const loadAlumnos = async () => {
    setLoadingAlumnos(true);
    try {
      const alumnosCampus: any[] = [];
      const alumnosRawList: any[] = [];

      const snap = await getDocs(collection(db, "alumnos"));
      snap.forEach(batchDoc => {
        const data = batchDoc.data();
        for (const key in data) {
          if (!key.startsWith("user_")) continue;
          const u = data[key];
          if (u.role === "profesor" || u.role === "admin") continue;
          alumnosCampus.push({
            uid: u.uid, email: u.email, role: u.role,
            batchId: batchDoc.id, userKey: key,
            createdAt: u.createdAt ?? null,
            learningLanguage: (u.learningLanguage || "").toLowerCase().trim(),
            learningLevel: (u.learningLevel || "").toUpperCase().trim(),
            estadoAlumno: "Active",
            nombre: u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.email?.split("@")[0] || "Unknown",
          });
        }
      });

      const snapRaw = await getDocs(collection(db, "alumnos_raw"));
      snapRaw.forEach(batchDoc => {
        const data = batchDoc.data();
        for (const key in data) {
          if (!key.startsWith("user_")) continue;
          const u = data[key];
          alumnosRawList.push({
            userKey: key, batchId: batchDoc.id, email: u.email,
            nombre: u.nombre || u.email?.split("@")[0] || "Unknown",
            learningLanguage: (u.learningLanguage || "").toLowerCase().trim(),
            learningLevel: (u.learningLevel || "").toUpperCase().trim(),
            estadoAlumno: u.estadoAlumno ?? "N/A",
            cursosAsignados: u.cursosAsignados || [],
            uid: null, createdAt: null,
          });
        }
      });

      setAlumnos([...alumnosCampus, ...alumnosRawList]);
      setAlumnosRaw(alumnosRawList);
    } catch (err) {
      console.error("❌ Error cargando alumnos:", err);
    } finally {
      setLoadingAlumnos(false);
    }
  };

  const loadProfesores = async () => {
    setLoadingProfesores(true);
    try {
      const list: any[] = [];
      const snap = await getDocs(collection(db, "alumnos"));
      snap.forEach(batchDoc => {
        const data = batchDoc.data();
        for (const key in data) {
          if (!key.startsWith("user_")) continue;
          const u = data[key];
          if (u.role === "profesor") {
            list.push({ uid: u.uid, email: u.email, nombre: u.firstName || u.nombre || "", apellido: u.lastName || "", batchId: batchDoc.id, userKey: key });
          }
        }
      });
      setProfesores(list);
    } catch { setProfesores([]); } finally { setLoadingProfesores(false); }
  };

  const loadAnuncios = async () => {
    setLoadingAnuncios(true);
    try {
      const snap = await getDocs(collection(db, "anuncios"));
      setAnuncios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch { setAnuncios([]); } finally { setLoadingAnuncios(false); }
  };

  const loadPodcastEpisodes = async () => {
    setLoadingPodcast(true);
    try {
      const res = await fetch("/api/spotify");
      setPodcastEpisodes(await res.json());
    } catch { setPodcastEpisodes([]); } finally { setLoadingPodcast(false); }
  };

  const loadChatSessions = (uid: string) => {
    chatUnsubscribeRef.current?.();
    setLoadingChatSessions(true);
    const q = query(collection(db, "conversaciones", uid, "sessions"), orderBy("endedAt", "desc"));
    chatUnsubscribeRef.current = onSnapshot(q, snap => {
      const now = Date.now();
      const list: any[] = [];
      snap.docs.forEach(d => {
        const endedAt = d.data().endedAt?.toDate?.() ?? null;
        if (endedAt && now - endedAt.getTime() > 7 * 24 * 60 * 60 * 1000) {
          deleteDoc(doc(db, "conversaciones", uid, "sessions", d.id));
          return;
        }
        list.push({ id: d.id, ...d.data() });
      });
      setChatSessions(list);
      setLoadingChatSessions(false);
    });
  };

  const reloadData = async () => {
    await Promise.all([loadAllCursos(), loadAlumnos(), loadProfesores(), loadAnuncios()]);
  };

  return (
    <AdminContext.Provider value={{
      allCursos, loadingAllCursos, loadAllCursos,
      alumnos, alumnosRaw, loadingAlumnos, loadAlumnos,
      profesores, loadingProfesores, loadProfesores,
      anuncios, loadingAnuncios, loadAnuncios,
      chatSessions, loadingChatSessions,
      podcastEpisodes, loadingPodcast,
      reloadData, allDataLoaded,
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);