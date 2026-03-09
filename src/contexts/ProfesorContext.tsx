"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { getDocs, collection, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

interface ProfesorContextType {
  allCursos: any[];
  loadingAllCursos: boolean;
  profesores: any[];
  loadingProfesores: boolean;
  chatSessions: any[];
  loadingChatSessions: boolean;
  allDataLoaded: boolean;
}

const ProfesorContext = createContext<ProfesorContextType>({} as ProfesorContextType);

export const ProfesorProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  const [allCursos, setAllCursos] = useState<any[]>([]);
  const [loadingAllCursos, setLoadingAllCursos] = useState(false);
  const [profesores, setProfesores] = useState<any[]>([]);
  const [loadingProfesores, setLoadingProfesores] = useState(false);
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [loadingChatSessions, setLoadingChatSessions] = useState(false);
  const [allDataLoaded, setAllDataLoaded] = useState(false);

  const chatUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      loadAllCursos(),
      loadProfesores(),
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

  const loadProfesores = async () => {
    setLoadingProfesores(true);
    try {
      const list: any[] = [];
      const snap = await getDocs(collection(db, "alumnos"));
      snap.forEach(batchDoc => {
        const data = batchDoc.data();
        for (const key in data) {
          if (key.startsWith("user_") && data[key]?.role === "profesor") {
            const u = data[key];
            list.push({ uid: u.uid, email: u.email, nombre: u.firstName || u.nombre || "", batchId: batchDoc.id, userKey: key });
          }
        }
      });
      setProfesores(list);
    } catch { setProfesores([]); } finally { setLoadingProfesores(false); }
  };

  const loadChatSessions = (uid: string) => {
    chatUnsubscribeRef.current?.();
    setLoadingChatSessions(true);
    const q = query(collection(db, "conversaciones", uid, "sessions"), orderBy("endedAt", "desc"));
    chatUnsubscribeRef.current = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setChatSessions(list);
      setLoadingChatSessions(false);
    });
  };

  return (
    <ProfesorContext.Provider value={{
      allCursos, loadingAllCursos,
      profesores, loadingProfesores,
      chatSessions, loadingChatSessions,
      allDataLoaded,
    }}>
      {children}
    </ProfesorContext.Provider>
  );
};

export const useProfesor = () => useContext(ProfesorContext);