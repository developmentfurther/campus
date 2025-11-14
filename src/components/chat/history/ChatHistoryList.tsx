"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardUI } from "@/stores/useDashboardUI";
import { FiClock, FiChevronRight } from "react-icons/fi";

export default function ChatHistoryList() {
  const { user } = useAuth();
  const { setSection, setSessionId } = useDashboardUI();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function load() {
      const ref = collection(db, "conversaciones", user.uid, "sessions");
      const snap = await getDocs(ref);

      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      // Ordenar por fecha desc
      list.sort((a, b) => (b.startedAt?.seconds ?? 0) - (a.startedAt?.seconds ?? 0));

      setSessions(list);
      setLoading(false);
    }

    load();
  }, [user]);

  if (loading)
    return <div className="p-6 text-gray-500">Loading sessions…</div>;

  if (sessions.length === 0)
    return <div className="p-6 text-gray-500">No conversations yet.</div>;

  return (
    <div className="p-6 w-full max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Your Conversation History</h2>

      <div className="space-y-3">
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setSessionId(s.id);
              setSection("chat-session");
            }}
            className="w-full bg-white border rounded-xl shadow-sm p-4 flex justify-between items-center hover:bg-gray-50 transition"
          >
            <div>
              <p className="font-medium text-gray-800">
                Session #{s.id}
              </p>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <FiClock />
                {new Date(s.startedAt?.seconds * 1000).toLocaleString()}
              </p>
            </div>

            <FiChevronRight className="text-gray-400" />
          </button>
        ))}
      </div>
    </div>
  );
}
