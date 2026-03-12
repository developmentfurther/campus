"use client";

import { useDashboardUI } from "@/stores/useDashboardUI";
import { useAuth } from "@/contexts/AuthContext";
import { useAlumno } from "@/contexts/AlumnoContext"; // ← CORREGIDO
import {
  FiArrowLeft, FiCheckCircle, FiAlertCircle,
  FiAlertTriangle, FiTarget, FiZap,
} from "react-icons/fi";

export default function ChatHistorySession() {
  const { userProfile } = useAuth();
  const { chatSessions } = useAlumno(); // ← CORREGIDO
  const { sessionIndex, setSection } = useDashboardUI(); // ← index en vez de id

  const t = {
    en: {
      sessionNotFound: "Session not found.",
      back: "Back to History",
      conversation: "Conversation",
      language: "Language",
      level: "Level",
      feedback: "Feedback Summary",
      assessment: "Overall Assessment",
      strengths: "Strengths",
      weakPoints: "Weak Points",
      commonMistakes: "Common Mistakes",
      exercises: "Suggested Exercises",
      games: "Suggested Games",
      messages: "messages",
    },
    es: {
      sessionNotFound: "Sesión no encontrada.",
      back: "Volver al historial",
      conversation: "Conversación",
      language: "Idioma",
      level: "Nivel",
      feedback: "Resumen de retroalimentación",
      assessment: "Evaluación general",
      strengths: "Fortalezas",
      weakPoints: "Puntos débiles",
      commonMistakes: "Errores comunes",
      exercises: "Ejercicios sugeridos",
      games: "Juegos sugeridos",
      messages: "mensajes",
    },
    pt: {
      sessionNotFound: "Sessão não encontrada.",
      back: "Voltar ao histórico",
      conversation: "Conversa",
      language: "Idioma",
      level: "Nível",
      feedback: "Resumo de feedback",
      assessment: "Avaliação geral",
      strengths: "Pontos fortes",
      weakPoints: "Pontos fracos",
      commonMistakes: "Erros comuns",
      exercises: "Exercícios sugeridos",
      games: "Jogos sugeridos",
      messages: "mensagens",
    },
    it: {
      sessionNotFound: "Sessione non trovata.",
      back: "Torna alla cronologia",
      conversation: "Conversazione",
      language: "Lingua",
      level: "Livello",
      feedback: "Riepilogo del feedback",
      assessment: "Valutazione generale",
      strengths: "Punti di forza",
      weakPoints: "Punti deboli",
      commonMistakes: "Errori comuni",
      exercises: "Esercizi suggeriti",
      games: "Giochi suggeriti",
      messages: "messaggi",
    },
    fr: {
      sessionNotFound: "Session introuvable.",
      back: "Retour à l'historique",
      conversation: "Conversation",
      language: "Langue",
      level: "Niveau",
      feedback: "Résumé du feedback",
      assessment: "Évaluation générale",
      strengths: "Points forts",
      weakPoints: "Points faibles",
      commonMistakes: "Erreurs courantes",
      exercises: "Exercices suggérés",
      games: "Jeux suggérés",
      messages: "messages",
    },
  };

  const rawLang = userProfile?.learningLanguage?.toLowerCase() || "en";
  const tr = t[rawLang] ?? t["en"];

  // ← Ahora usamos el índice del array, no el id
  const session = chatSessions[sessionIndex ?? 0];

  if (!session)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#0C212D] to-[#112C3E] rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <FiAlertCircle className="text-white" size={36} />
          </div>
          <p className="text-[#112C3E] font-semibold text-lg">{tr.sessionNotFound}</p>
        </div>
      </div>
    );

  // Los campos están directamente en session (no anidados en session.summary)
  const dateStr = session.date
    ? new Date(session.date).toLocaleString()
    : "—";

  const sessionNumber = chatSessions.length - (sessionIndex ?? 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6 md:p-10">
      <div className="w-full max-w-5xl mx-auto space-y-8">

        {/* Back Button */}
        <button
          onClick={() => setSection("chat-history")}
          className="group flex items-center gap-3 px-5 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-[#EE7203] hover:shadow-lg transition-all duration-300"
        >
          <FiArrowLeft className="text-[#112C3E] group-hover:text-[#EE7203] transform group-hover:-translate-x-1 transition-all duration-300" size={20} />
          <span className="text-sm font-bold text-[#0C212D] group-hover:text-[#EE7203] transition-colors">{tr.back}</span>
        </button>

        {/* HEADER */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0C212D] to-[#112C3E] rounded-3xl shadow-2xl p-8 text-white border-2 border-[#EE7203]/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#EE7203] opacity-10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#FF3816] opacity-10 rounded-full blur-3xl -ml-24 -mb-24"></div>

          <div className="relative z-10">
            <h1 className="text-3xl font-black mb-4">
              {tr.conversation} #{sessionNumber}
            </h1>
            <div className="flex flex-wrap gap-3 items-center">
              <span className="px-4 py-2 bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white font-bold rounded-xl text-sm uppercase tracking-wide shadow-lg">
                {tr.language}: {session.language?.toUpperCase()}
              </span>
              <span className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white font-bold rounded-xl text-sm border border-white/20">
                {tr.level}: {session.level}
              </span>
              {session.messagesCount && (
                <span className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white font-bold rounded-xl text-sm border border-white/20">
                  {session.messagesCount} {tr.messages}
                </span>
              )}
              <span className="text-white/60 text-sm font-medium">{dateStr}</span>
            </div>
          </div>
        </div>

        {/* SUMMARY TITLE */}
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-10 bg-gradient-to-b from-[#EE7203] to-[#FF3816] rounded-full"></div>
          <h2 className="text-3xl font-black text-[#0C212D]">{tr.feedback}</h2>
        </div>

        {/* SUMMARY SECTIONS */}
        <div className="space-y-6">

          {/* General Assessment */}
          <SummaryCard
            icon={<FiTarget size={24} />}
            title={tr.assessment}
            gradient="from-[#0C212D] to-[#112C3E]"
            bgColor="bg-gradient-to-br from-gray-50 to-white"
            borderColor="border-[#0C212D]/20"
          >
            <p className="text-[#112C3E] leading-relaxed font-medium">
              {session.feedbackSummary ?? ""}
            </p>
          </SummaryCard>

          {/* Strengths */}
          {!!session.strengths?.length && (
            <SummaryCard
              icon={<FiCheckCircle size={24} />}
              title={tr.strengths}
              gradient="from-[#10b981] to-[#059669]"
              bgColor="bg-gradient-to-br from-green-50 to-emerald-50"
              borderColor="border-green-200"
            >
              <ul className="space-y-2">
                {session.strengths.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-green-900">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">✓</span>
                    <span className="flex-1 font-medium">{s}</span>
                  </li>
                ))}
              </ul>
            </SummaryCard>
          )}

          {/* Weak Points */}
          {!!session.weakPoints?.length && (
            <SummaryCard
              icon={<FiAlertCircle size={24} />}
              title={tr.weakPoints}
              gradient="from-[#FF3816] to-[#EE7203]"
              bgColor="bg-gradient-to-br from-red-50 to-orange-50"
              borderColor="border-red-200"
            >
              <ul className="space-y-2">
                {session.weakPoints.map((w: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-red-900">
                    <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-[#FF3816] to-[#EE7203] rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">!</span>
                    <span className="flex-1 font-medium">{w}</span>
                  </li>
                ))}
              </ul>
            </SummaryCard>
          )}

          {/* Common Mistakes */}
          {!!session.commonMistakes?.length && (
            <SummaryCard
              icon={<FiAlertTriangle size={24} />}
              title={tr.commonMistakes}
              gradient="from-[#EE7203] to-[#FF3816]"
              bgColor="bg-gradient-to-br from-orange-50 to-red-50"
              borderColor="border-orange-200"
            >
              <ul className="space-y-3">
                {session.commonMistakes.map((m: any, i: number) => (
                  <li key={i} className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-orange-200">
                    <div className="flex items-start gap-3 mb-2">
                      <span className="px-3 py-1 bg-[#FF3816] text-white text-xs font-bold rounded-lg">{m.error}</span>
                      <span className="text-gray-500">→</span>
                      <span className="px-3 py-1 bg-[#10b981] text-white text-xs font-bold rounded-lg">{m.correction}</span>
                    </div>
                    <p className="text-sm text-[#112C3E]/80 ml-1">{m.explanation}</p>
                  </li>
                ))}
              </ul>
            </SummaryCard>
          )}

          {/* Exercises & Games */}
          <div className="grid md:grid-cols-2 gap-6">
            {!!session.suggestedExercises?.length && (
              <SummaryCard
                icon={<FiTarget size={20} />}
                title={tr.exercises}
                gradient="from-[#0C212D] to-[#112C3E]"
                bgColor="bg-gradient-to-br from-blue-50 to-indigo-50"
                borderColor="border-blue-200"
                compact
              >
                <ul className="space-y-2">
                  {session.suggestedExercises.map((e: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-blue-900 text-sm">
                      <span className="flex-shrink-0 text-[#EE7203] font-bold">•</span>
                      <span className="flex-1">{e}</span>
                    </li>
                  ))}
                </ul>
              </SummaryCard>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon, title, gradient, bgColor, borderColor, children, compact = false }: any) {
  return (
    <div className={`${bgColor} rounded-2xl border-2 ${borderColor} shadow-lg overflow-hidden`}>
      <div className={`bg-gradient-to-r ${gradient} p-4 flex items-center gap-3`}>
        <div className="text-white">{icon}</div>
        <h3 className={`font-black text-white ${compact ? "text-base" : "text-xl"}`}>{title}</h3>
      </div>
      <div className={`${compact ? "p-4" : "p-6"}`}>{children}</div>
    </div>
  );
}