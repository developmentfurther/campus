"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardUI } from "@/stores/useDashboardUI";
import MessageBubble from "../MessageBubble";

export default function ChatHistorySession() {
  const { user } = useAuth();
  const { sessionId, setSection } = useDashboardUI();

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !sessionId) return;

    async function load() {
      const ref = doc(db, "conversaciones", user.uid, "sessions", sessionId);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setSession(snap.data());
      }
      setLoading(false);
    }

    load();
  }, [user, sessionId]);

  if (loading)
    return <div className="p-6 text-gray-500">Loading session…</div>;

  if (!session)
    return <div className="p-6 text-gray-500">Session not found.</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => setSection("chat-history")}
        className="text-blue-600 underline text-sm"
      >
        ← Back
      </button>

      <h2 className="text-xl font-bold">Conversation #{sessionId}</h2>

      <div className="bg-white border rounded-xl shadow p-4 space-y-4">
        {session.messages.map((m: any, idx: number) => (
          <MessageBubble key={idx} role={m.role} content={m.content} />
        ))}
      </div>

      {/* FEEDBACK */}
      <div className="bg-white border rounded-xl shadow p-4">
        <h3 className="text-lg font-semibold mb-3">Feedback Summary</h3>

        <div
          dangerouslySetInnerHTML={{
            __html: `
              <p>${session.summary?.feedbackSummary ?? ""}</p>

              <h4 class="font-semibold mt-3">Strengths</h4>
              <ul>${(session.summary?.strengths ?? [])
                .map((s: string) => `<li>• ${s}</li>`)
                .join("")}</ul>

              <h4 class="font-semibold mt-3">Weak Points</h4>
              <ul>${(session.summary?.weakPoints ?? [])
                .map((s: string) => `<li>• ${s}</li>`)
                .join("")}</ul>

              <h4 class="font-semibold mt-3">Common Mistakes</h4>
              <ul>${(session.summary?.commonMistakes ?? [])
                .map(
                  (m: any) =>
                    `<li><mark>${m.error}</mark> → <b>${m.correction}</b> (${m.explanation})</li>`
                )
                .join("")}</ul>

              <h4 class="font-semibold mt-3">Suggested Exercises</h4>
              <ul>${(session.summary?.suggestedExercises ?? [])
                .map((e: string) => `<li>• ${e}</li>`)
                .join("")}</ul>

              <h4 class="font-semibold mt-3">Suggested Games</h4>
              <ul>${(session.summary?.suggestedGames ?? [])
                .map((g: string) => `<li>• ${g}</li>`)
                .join("")}</ul>
            `,
          }}
        />
      </div>
    </div>
  );
}
