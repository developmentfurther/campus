"use client";
import { create } from "zustand";

type Section =
  | "home"
  | "miscursos"
  | "cursos"
  | "usuarios"
  | "perfil"
  | "infoimportante"
  | "chatbot"
  | "chat-history"
  | "chat-session"
  | "events"
  | "podcasts"; // 👈 1. Nueva Sección Agregada

interface State {
  // Navegación
  section: Section;
  setSection: (s: Section) => void;

  // Chat
  sessionId: string | null;
  setSessionId: (id: string | null) => void;

  // 👇 2. Nuevo Estado para el Reproductor Global
  currentPodcastUrl: string | null; // URL del embed de Spotify
  isPlayerVisible: boolean;
  playPodcast: (url: string) => void;
  closePlayer: () => void;
}

export const useDashboardUI = create<State>((set) => ({
  section: "home",
  setSection: (section) => set({ section }),

  sessionId: null,
  setSessionId: (id) => set({ sessionId: id }),

  // 👇 Lógica del Reproductor
  currentPodcastUrl: null,
  isPlayerVisible: false,
  playPodcast: (url) => set({ currentPodcastUrl: url, isPlayerVisible: true }),
  closePlayer: () => set({ currentPodcastUrl: null, isPlayerVisible: false }),
}));