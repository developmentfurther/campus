"use client";
import { create } from "zustand";

type Section =
  | "home"
  | "miscursos"
  | "cursos"
  | "usuarios"
  | "perfil"
  | "chatbot"
  | "chat-history"
  | "chat-session";

interface State {
  section: Section;
  setSection: (s: Section) => void;

  sessionId: string | null;
  setSessionId: (id: string | null) => void;
}

export const useDashboardUI = create<State>((set) => ({
  section: "home",

  setSection: (section) => set({ section }),

  // 👇 nuevo para visor de sesiones
  sessionId: null,
  setSessionId: (id) => set({ sessionId: id }),
}));
