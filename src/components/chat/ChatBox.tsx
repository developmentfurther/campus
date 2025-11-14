"use client";

import { useState, useRef, useEffect } from "react";
import { FiSend, FiStopCircle } from "react-icons/fi";
import clsx from "clsx";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";


export default function ChatBox() {
  const { userProfile, user } = useAuth();

  // Idioma y nivel desde el perfil del usuario
  const language = userProfile?.learningLanguage;
  const level = userProfile?.learningLevel;

  const saveConversationToFirestore = async (summary) => {
  if (!user) return;

  const sessionId = Date.now().toString();

  await setDoc(
    doc(db, "conversaciones", user.uid, "sessions", sessionId),
    {
      userId: user.uid,
      language,
      level,
      messages,
      summary,
      startedAt: messages[0]?.timestamp || serverTimestamp(),
      endedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

  // 🔥 Evitar crash si se renderiza antes de cargar el perfil
  if (!userProfile) {
    return (
      <div className="p-6 text-gray-500 text-center">
        Loading chat configuration...
      </div>
    );
  }

  // 🔥 Si el usuario NO completó el perfil aún
  if (!language || !level) {
    return (
      <div className="p-6 text-gray-500 text-center">
        Please complete your profile to start the conversational chat.
      </div>
    );
  }

  // 🔥 El resto del chat funciona igual
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi! I'm your language tutor.  
What topic would you like to talk about today?  
(Travel, business, hobbies, food, job interviews...)`,
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ENVIAR MENSAJE
  const handleSend = async () => {
  if (!input.trim()) return;

  const userMsg = { role: "user", content: input };
  const newMessages = [...messages, userMsg];

  setMessages(newMessages);
  setInput("");
  setIsTyping(true);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: newMessages,
        level,
        language,
      }),
    });

    if (!res.body) {
      throw new Error("No stream received");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    let partial = "";
    let assistantAlreadyAdded = false;

    // STREAM LOOP
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      partial += decoder.decode(value, { stream: true });

      if (!assistantAlreadyAdded) {
        assistantAlreadyAdded = true;
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      }

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: partial,
        };
        return updated;
      });
    }
  } catch (err) {
    console.error("🔥 Error en streaming:", err);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          "⚠️ There was a connection issue. Please try again in a moment.",
      },
    ]);
  } finally {
    setIsTyping(false);
  }
};


  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const finishConversation = async () => {
  setIsTyping(true);

  try {
    const res = await fetch("/api/chat/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        level,
        language,
      }),
    });

    if (!res.ok) {
      throw new Error("Summary endpoint returned an error");
    }

    // Ya no usamos res.text() — AHORA siempre es JSON
    const summary = await res.json();

    console.log("📘 SUMMARY OBJETO:", summary);

    // Mostrar feedback final en el chat
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `
<h3 class="font-bold text-gray-800">Final Feedback</h3>
<p>${summary.feedbackSummary ?? ""}</p>

<h4 class="mt-3 font-semibold">Strengths</h4>
<ul>
${(summary.strengths ?? [])
  .map((s: string) => `<li>• ${s}</li>`)
  .join("")}
</ul>

<h4 class="mt-3 font-semibold">Weak Points</h4>
<ul>
${(summary.weakPoints ?? [])
  .map((w: string) => `<li>• ${w}</li>`)
  .join("")}
</ul>

<h4 class="mt-3 font-semibold">Common Mistakes</h4>
<ul>
${(summary.commonMistakes ?? [])
  .map(
    (m: any) =>
      `<li><mark>${m.error}</mark> → <b>${m.correction}</b> (${m.explanation})</li>`
  )
  .join("")}
</ul>

<h4 class="mt-3 font-semibold">Suggested Exercises</h4>
<ul>
${(summary.suggestedExercises ?? [])
  .map((e: string) => `<li>• ${e}</li>`)
  .join("")}
</ul>

<h4 class="mt-3 font-semibold">Suggested Games</h4>
<ul>
${(summary.suggestedGames ?? [])
  .map((g: string) => `<li>• ${g}</li>`)
  .join("")}
</ul>
`,
      },
    ]);

    // Guardar sesión en Firestore
    await saveConversationToFirestore(summary);

  } catch (err) {
    console.error("🔥 Error finishing conversation:", err);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          "⚠️ There was a problem generating the summary. Please try again.",
      },
    ]);
  } finally {
    setIsTyping(false);
  }
};





  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-lg border flex flex-col h-[80vh]">
      {/* HEADER */}
      <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Language Tutor
          </h2>
          <p className="text-xs text-gray-500">
            {language.toUpperCase()} · Level {level}
          </p>
        </div>

        <button
          onClick={finishConversation}
          className="flex items-center gap-2 bg-red-100 text-red-600 px-3 py-2 rounded-lg hover:bg-red-200 transition"
        >
          <FiStopCircle size={16} />
          End conversation
        </button>
      </div>

      {/* CHAT */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} role={msg.role} content={msg.content} />
        ))}

        {isTyping && <TypingIndicator />}

        <div ref={chatEndRef}></div>
      </div>

      {/* INPUT */}
      <div className="p-4 border-t bg-gray-50 rounded-b-xl flex items-center gap-3">
        <textarea
          className="flex-1 border rounded-lg p-3 resize-none focus:ring-2 focus:ring-blue-500 min-h-[50px] max-h-[120px]"
          placeholder="Write your message..."
          value={input}
          onKeyDown={handleKey}
          onChange={(e) => setInput(e.target.value)}
        />

        <button
          onClick={handleSend}
          className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
        >
          <FiSend size={20} />
        </button>
      </div>
    </div>
  );
}
