"use client";

import { useDashboardUI } from "@/stores/useDashboardUI";
import { useAuth } from "@/contexts/AuthContext";
import MessageBubble from "./MessageBubble";
import { FiArrowLeft } from "react-icons/fi";

export default function ChatHistorySession() {
  const { chatSessions } = useAuth();
  const { sessionId, setSection } = useDashboardUI();

  // Buscar sesión cargada en memoria
  const session = chatSessions.find((s) => s.id === sessionId);
  if (!session)
    return <div className="p-6 text-gray-500">Session not found.</div>;

  const summary = session.summary || {};

  return (
    <div className="p-6 w-full max-w-4xl mx-auto space-y-8">

      {/* Back Button */}
      <button
        onClick={() => setSection("chat-history")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
      >
        <FiArrowLeft size={18} />
        <span className="text-sm font-medium">Back to History</span>
      </button>

      {/* HEADER */}
      <div className="bg-white rounded-2xl shadow border p-6 space-y-3">
        <h1 className="text-2xl font-bold text-gray-900">
          Conversation #{sessionId}
        </h1>

        <div className="flex flex-wrap gap-2 items-center text-sm">
          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
            Language: {session.language?.toUpperCase()}
          </span>
          <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full">
            Level: {session.level}
          </span>
          <span className="text-gray-500">
            {session.endedAt?.toDate?.().toLocaleString()}
          </span>
        </div>
      </div>

      {/* SUMMARY → Beautiful Card */}
      <div className="bg-white rounded-2xl shadow border p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Feedback Summary
        </h2>

        <div className="space-y-6">

          {/* General Summary */}
          <div className="bg-gray-50 rounded-xl p-4 border">
            <h3 className="font-semibold text-gray-800 mb-2">Overall Assessment</h3>
            <p className="text-gray-700 leading-relaxed">
              {summary.feedbackSummary ?? ""}
            </p>
          </div>

          {/* STRENGTHS */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h3 className="font-semibold text-green-800 mb-2">Strengths</h3>
            <ul className="text-green-900 space-y-1 ml-4">
              {(summary.strengths ?? []).map((s: string, i: number) => (
                <li key={i}>• {s}</li>
              ))}
            </ul>
          </div>

          {/* WEAK POINTS */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <h3 className="font-semibold text-red-800 mb-2">Weak Points</h3>
            <ul className="text-red-900 space-y-1 ml-4">
              {(summary.weakPoints ?? []).map((w: string, i: number) => (
                <li key={i}>• {w}</li>
              ))}
            </ul>
          </div>

          {/* COMMON MISTAKES */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Common Mistakes</h3>
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

          {/* EXERCISES */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Suggested Exercises</h3>
            <ul className="text-blue-900 space-y-1 ml-4">
              {(summary.suggestedExercises ?? []).map((e: string, i: number) => (
                <li key={i}>• {e}</li>
              ))}
            </ul>
          </div>

          {/* GAMES */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <h3 className="font-semibold text-indigo-800 mb-2">Suggested Games</h3>
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
