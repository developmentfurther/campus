"use client";

import { useDashboardUI } from "@/stores/useDashboardUI";
import { useAuth } from "@/contexts/AuthContext";
import MessageBubble from "./MessageBubble";
import { FiArrowLeft } from "react-icons/fi";

export default function ChatHistorySession() {
  const { chatSessions, userProfile } = useAuth();
  const { sessionId, setSection } = useDashboardUI();

  // 🌍 Auto-translation dictionary
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
    },
  };

  const rawLang = userProfile?.learningLanguage?.toLowerCase() || "en";
  const tr = t[rawLang] ?? t["en"];

  // Load the selected session
  const session = chatSessions.find((s) => s.id === sessionId);
  if (!session)
    return <div className="p-6 text-gray-500">{tr.sessionNotFound}</div>;

  const summary = session.summary || {};

  return (
    <div className="p-6 w-full max-w-4xl mx-auto space-y-8">

      {/* Back Button */}
      <button
        onClick={() => setSection("chat-history")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
      >
        <FiArrowLeft size={18} />
        <span className="text-sm font-medium">{tr.back}</span>
      </button>

      {/* HEADER */}
      <div className="bg-white rounded-2xl shadow border p-6 space-y-3">
        <h1 className="text-2xl font-bold text-gray-900">
          {tr.conversation} #{sessionId}
        </h1>

        <div className="flex flex-wrap gap-2 items-center text-sm">
          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
            {tr.language}: {session.language?.toUpperCase()}
          </span>
          <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full">
            {tr.level}: {session.level}
          </span>
          <span className="text-gray-500">
            {session.endedAt?.toDate?.().toLocaleString()}
          </span>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="bg-white rounded-2xl shadow border p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">
          {tr.feedback}
        </h2>

        <div className="space-y-6">

          {/* General Summary */}
          <div className="bg-gray-50 rounded-xl p-4 border">
            <h3 className="font-semibold text-gray-800 mb-2">{tr.assessment}</h3>
            <p className="text-gray-700 leading-relaxed">
              {summary.feedbackSummary ?? ""}
            </p>
          </div>

          {/* Strengths */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h3 className="font-semibold text-green-800 mb-2">{tr.strengths}</h3>
            <ul className="text-green-900 space-y-1 ml-4">
              {(summary.strengths ?? []).map((s: string, i: number) => (
                <li key={i}>• {s}</li>
              ))}
            </ul>
          </div>

          {/* Weak Points */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <h3 className="font-semibold text-red-800 mb-2">{tr.weakPoints}</h3>
            <ul className="text-red-900 space-y-1 ml-4">
              {(summary.weakPoints ?? []).map((w: string, i: number) => (
                <li key={i}>• {w}</li>
              ))}
            </ul>
          </div>

          {/* Common Mistakes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">{tr.commonMistakes}</h3>
            <ul className="text-yellow-900 space-y-2 ml-4">
              {(summary.commonMistakes ?? []).map((m: any, i: number) => (
                <li key={i}>
                  <mark className="bg-yellow-200 px-1 rounded">{m.error}</mark>{" "}
                  → <b>{m.correction}</b>
                  <span className="text-gray-700">({m.explanation})</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Exercises */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-800 mb-2">{tr.exercises}</h3>
            <ul className="text-blue-900 space-y-1 ml-4">
              {(summary.suggestedExercises ?? []).map((e: string, i: number) => (
                <li key={i}>• {e}</li>
              ))}
            </ul>
          </div>

          {/* Games */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <h3 className="font-semibold text-indigo-800 mb-2">{tr.games}</h3>
            <ul className="text-indigo-900 space-y-1 ml-4">
              {(summary.suggestedGames ?? []).map((g: string, i: number) => (
                <li key={i}>• {g}</li>
              ))}
            </ul>
          </div>

        </div>
      </div>

    </div>
  );
}
