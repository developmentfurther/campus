"use client";

import { useDashboardUI } from "@/stores/useDashboardUI";
import { useAuth } from "@/contexts/AuthContext";
import { FiClock, FiChevronRight, FiMessageSquare, FiAlertTriangle } from "react-icons/fi";

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
    unknownDate: "Unknown date",
    emptyMessage: "Start a conversation to see your summaries here."
  },
  es: {
    loading: "Cargando tus conversaciones…",
    empty: "Aún no tienes resúmenes de conversación.",
    title: "Historial de conversaciones",
    conversation: "Conversación",
    level: "Nivel",
    unknownDate: "Fecha desconocida",
    emptyMessage: "Empezá una conversación para ver tus resúmenes acá."
  },
  pt: {
    loading: "Carregando suas conversas…",
    empty: "Você ainda não tem resumos de conversa.",
    title: "Histórico de conversas",
    conversation: "Conversa",
    level: "Nível",
    unknownDate: "Data desconhecida",
    emptyMessage: "Inicie uma conversa para ver seus resumos aqui."
  },
  it: {
    loading: "Caricamento delle tue conversazioni…",
    empty: "Non hai ancora alcun riepilogo di conversazione.",
    title: "Cronologia conversazioni",
    conversation: "Conversazione",
    level: "Livello",
    unknownDate: "Data sconosciuta",
    emptyMessage: "Avvia una conversazione per vedere i tuoi riassunti qui."
  },
  fr: {
    loading: "Chargement de vos conversations…",
    empty: "Vous n'avez pas encore de résumés de conversation.",
    title: "Historique des conversations",
    conversation: "Conversation",
    level: "Niveau",
    unknownDate: "Date inconnue",
    emptyMessage: "Démarrez une conversation pour voir vos résumés ici."
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#EE7203] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#112C3E] font-medium">{tr.loading}</p>
        </div>
      </div>
    );

  if (!chatSessions?.length)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="bg-gradient-to-br from-[#0C212D] to-[#112C3E] w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <FiMessageSquare className="text-white" size={40} />
          </div>
          <h3 className="text-2xl font-black text-[#0C212D] mb-3">{tr.empty}</h3>
          <p className="text-[#112C3E]/60 text-sm">{tr.emptyMessage} </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-10 bg-gradient-to-b from-[#EE7203] to-[#FF3816] rounded-full"></div>
            <h1 className="text-4xl font-black text-[#0C212D]">
              {tr.title}
            </h1>
          </div>

          {/* ⚠️ AVISO (autotradu­cible) */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#FF3816]/10 to-[#EE7203]/5 border-2 border-[#FF3816]/30 rounded-2xl p-5 shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF3816]/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
            <div className="relative flex gap-4 items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#FF3816] to-[#EE7203] rounded-xl flex items-center justify-center shadow-lg">
                <FiAlertTriangle className="text-white" size={20} />
              </div>
              <div className="flex-1">
                <p className="text-[#0C212D] font-medium leading-relaxed">{message}</p>
              </div>
            </div>
          </div>
        </div>

        {/* LISTA DE CONVERSACIONES */}
        <div className="grid gap-5">
          {chatSessions.map((s, index) => (
            <button
              key={s.id}
              onClick={() => {
                setSessionId(s.id);
                setSection("chat-session");
              }}
              className="group relative bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-[#EE7203]/30"
              style={{
                animation: 'fadeInUp 0.5s ease-out forwards',
                animationDelay: `${index * 0.1}s`,
                opacity: 0
              }}
            >
              {/* Gradient hover effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#EE7203]/5 to-[#FF3816]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Decorative line */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#EE7203] to-[#FF3816] transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top"></div>

              <div className="relative p-6 flex justify-between items-center">
                
                {/* Left content */}
                <div className="flex items-center gap-5 flex-1">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-[#0C212D] to-[#112C3E] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FiMessageSquare className="text-white" size={24} />
                  </div>

                  {/* Info */}
                  <div className="flex flex-col gap-2 text-left flex-1 min-w-0">
                    <p className="font-black text-[#0C212D] text-xl group-hover:text-[#EE7203] transition-colors duration-300">
                      {tr.conversation} #{s.id}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1.5 bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white text-xs font-bold rounded-lg uppercase tracking-wide shadow-sm">
                        {s.language?.toUpperCase() ?? "LANG"}
                      </span>
                      <span className="px-3 py-1.5 bg-gradient-to-r from-[#0C212D] to-[#112C3E] text-white text-xs font-bold rounded-lg shadow-sm">
                        {tr.level} {s.level}
                      </span>
                    </div>

                    <p className="text-sm text-[#112C3E]/60 flex items-center gap-2 mt-1 font-medium">
                      <FiClock className="flex-shrink-0" size={16} />
                      <span className="truncate">{s.endedAt?.toDate?.().toLocaleString() ?? tr.unknownDate}</span>
                    </p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0 ml-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-gradient-to-br group-hover:from-[#EE7203] group-hover:to-[#FF3816] flex items-center justify-center transition-all duration-300">
                    <FiChevronRight className="text-gray-400 group-hover:text-white transform group-hover:translate-x-1 transition-all duration-300" size={20} />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}