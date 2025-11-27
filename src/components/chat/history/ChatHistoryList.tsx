"use client";

import { useDashboardUI } from "@/stores/useDashboardUI";
import { useAuth } from "@/contexts/AuthContext";
import { FiClock, FiChevronRight } from "react-icons/fi";

export default function ChatHistoryList() {
  const { chatSessions, loadingChatSessions, userProfile } = useAuth();
  const { setSection, setSessionId } = useDashboardUI();

  const tHistory = {
  en: {
    loading: "Loading your conversations…",
    empty: "You don't have any conversation summaries yet.",
    title: "Conversation History",
    conversation: "Conversation",
    level: "Level",
    unknownDate: "Unknown date"
  },
  es: {
    loading: "Cargando tus conversaciones…",
    empty: "Aún no tienes resúmenes de conversación.",
    title: "Historial de conversaciones",
    conversation: "Conversación",
    level: "Nivel",
    unknownDate: "Fecha desconocida"
  },
  pt: {
    loading: "Carregando suas conversas…",
    empty: "Você ainda não tem resumos de conversa.",
    title: "Histórico de conversas",
    conversation: "Conversa",
    level: "Nível",
    unknownDate: "Data desconhecida"
  },
  it: {
    loading: "Caricamento delle tue conversazioni…",
    empty: "Non hai ancora alcun riepilogo di conversazione.",
    title: "Cronologia conversazioni",
    conversation: "Conversazione",
    level: "Livello",
    unknownDate: "Data sconosciuta"
  },
  fr: {
    loading: "Chargement de vos conversations…",
    empty: "Vous n’avez pas encore de résumés de conversation.",
    title: "Historique des conversations",
    conversation: "Conversation",
    level: "Niveau",
    unknownDate: "Date inconnue"
  }
};
  // 🔸 TRADUCCIONES AUTOMÁTICAS
  const warningMessages = {
    en: "Your conversation summaries are stored for 7 days and then deleted automatically.",
    es: "Tus resúmenes de conversación se guardan durante 7 días y luego se eliminan automáticamente.",
    pt: "Seus resumos de conversas são armazenados por 7 dias e depois excluídos automaticamente.",
    it: "I tuoi riepiloghi delle conversazioni vengono salvati per 7 giorni e poi eliminati automaticamente.",
    fr: "Vos résumés de conversation sont conservés pendant 7 jours puis supprimés automatiquement.",
  };

  const rawLang = (userProfile?.learningLanguage || "en").toLowerCase();
  const message = warningMessages[rawLang] ?? warningMessages["en"];
  const tr = tHistory[rawLang] ?? tHistory["en"];

  if (loadingChatSessions)
    return (
      <div className="p-6 text-gray-500 text-center">
        {tr.loading}
      </div>
    );

  if (!chatSessions?.length)
    return (
      <div className="p-6 text-gray-500 text-center">
        {tr.empty}
      </div>
    );

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        {tr.title}
      </h1>

      {/* ⚠️ AVISO (autotradu­cible) */}
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-lg text-sm mb-6 flex gap-2 items-start">
        <span className="text-xl">⚠️</span>
        <p>{message}</p>
      </div>

      <div className="space-y-4">
        {chatSessions.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setSessionId(s.id);
              setSection("chat-session");
            }}
            className="w-full bg-white border rounded-2xl shadow-sm p-5 
                       flex justify-between items-center hover:shadow-md 
                       transition-all hover:border-gray-300"
          >
            <div className="flex flex-col gap-1 text-left">

              <p className="font-semibold text-gray-900 text-lg">
                {tr.conversation} #{s.id}
              </p>

              <div className="flex flex-wrap gap-2 text-sm">
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                  {s.language?.toUpperCase() ?? "LANG"}
                </span>
                <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full">
                  {tr.level} {s.level}
                </span>
              </div>

              <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                <FiClock />
                {s.endedAt?.toDate?.().toLocaleString() ?? "Unknown date"}
              </p>
            </div>

            <FiChevronRight className="text-gray-400 text-xl" />
          </button>
        ))}
      </div>
    </div>
  );
}
