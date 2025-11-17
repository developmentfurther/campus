"use client";

import { useDashboardUI } from "@/stores/useDashboardUI";
import { useAuth } from "@/contexts/AuthContext";
import { FiClock, FiChevronRight } from "react-icons/fi";

export default function ChatHistoryList() {
  const { chatSessions, loadingChatSessions } = useAuth();
  const { setSection, setSessionId } = useDashboardUI();

  if (loadingChatSessions)
    return (
      <div className="p-6 text-gray-500 text-center">
        Loading your conversations…
      </div>
    );

  if (!chatSessions?.length)
    return (
      <div className="p-6 text-gray-500 text-center">
        You don't have any conversation summaries yet.
      </div>
    );

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Conversation History
      </h1>

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

              {/* TITLE */}
              <p className="font-semibold text-gray-900 text-lg">
                Conversation #{s.id}
              </p>

              {/* LABELS */}
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                  {s.language?.toUpperCase() ?? "LANG"}
                </span>
                <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full">
                  Level {s.level}
                </span>
              </div>

              {/* DATE */}
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
