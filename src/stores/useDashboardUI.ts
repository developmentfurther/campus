"use client";
import { create } from "zustand";

interface DashboardUIState {
  section: string;
  setSection: (s: string) => void;
  sessionId: string | null;                        // ← podés borrarlo después
  setSessionId: (id: string | null) => void;       // ← podés borrarlo después
  sessionIndex: number | null;                     // ← NUEVO
  setSessionIndex: (index: number | null) => void; // ← NUEVO
  currentPodcastUrl: string | null;
  isPlayerVisible: boolean;
  playPodcast: (url: string) => void;
  closePlayer: () => void;
}

export const useDashboardUI = create<DashboardUIState>((set) => ({
  section: "home",
  setSection: (section) => set({ section }),
  sessionId: null,
  setSessionId: (id) => set({ sessionId: id }),
  sessionIndex: null,                                        // ← NUEVO
  setSessionIndex: (index) => set({ sessionIndex: index }), // ← NUEVO
  currentPodcastUrl: null,
  isPlayerVisible: false,
  playPodcast: (url) => set({ currentPodcastUrl: url, isPlayerVisible: true }),
  closePlayer: () => set({ currentPodcastUrl: null, isPlayerVisible: false }),
}));