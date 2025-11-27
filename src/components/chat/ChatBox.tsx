"use client";

import { useState, useRef, useEffect } from "react";
import { FiSend, FiStopCircle } from "react-icons/fi";
import clsx from "clsx";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

/* =============================================
   🔤 Markdown => HTML (negrita, cursiva)
============================================= */
function formatMarkdown(text: string) {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");
}

/* =============================================
   🧠 Mensaje inicial según idioma del perfil
============================================= */
const initialMessagesByLanguage: Record<string, string> = {
  english: `Hi! I'm your language tutor.
What topic would you like to talk about today?
(Travel, business, hobbies, food, job interviews...)`,

  spanish: `¡Hola! Soy tu tutor de idiomas.
¿Sobre qué tema te gustaría hablar hoy?
(Viajes, negocios, pasatiempos, comida, entrevistas de trabajo...)`,

  portuguese: `Olá! Eu sou o seu tutor de idiomas.
Sobre qual assunto você gostaria de conversar hoje?
(Viagens, negócios, hobbies, comida, entrevistas de emprego...)`,

  italian: `Ciao! Sono il tuo tutor linguistico.
Di quale argomento ti piacerebbe parlare oggi?
(Viaggi, lavoro, hobby, cibo, colloqui di lavoro...)`,

  french: `Bonjour ! Je suis ton tuteur linguistique.
De quel sujet aimerais-tu parler aujourd'hui ?
(Voyages, affaires, loisirs, nourriture, entretiens d'embauche...)`,
};

const languageKeyMap: Record<string, keyof typeof initialMessagesByLanguage> = {
  en: "english",
  es: "spanish",
  pt: "portuguese",
  it: "italian",
  fr: "french",
};

interface Message {
  role: "user" | "assistant";
  content: string;
  corrections?: any[];
}

export default function ChatBox() {
  const { userProfile, user } = useAuth();

  const rawLang = userProfile?.learningLanguage?.toLowerCase() || "en";
  const language = languageKeyMap[rawLang] ?? "english";
  const level = userProfile?.learningLevel;

  /* =============================================
     ⏳ Carga de perfil
  ============================================= */
  if (!userProfile) {
    return (
      <div className="p-6 text-gray-500 text-center">
        Loading chat configuration...
      </div>
    );
  }

  if (!language || !level) {
    return (
      <div className="p-6 text-gray-500 text-center">
        Please complete your profile to start the conversational chat.
      </div>
    );
  }

  /* =============================================
     💬 Mensajes del chat
  ============================================= */
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: initialMessagesByLanguage[language],
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  /* =============================================
     💾 Guardar session → SOLO summary
  ============================================= */
  const saveConversationToFirestore = async (summary: any) => {
    if (!user) return;

    const sessionId = Date.now().toString();

    await setDoc(
      doc(db, "conversaciones", user.uid, "sessions", sessionId),
      {
        userId: user.uid,
        language,
        level,
        summary,
        startedAt: serverTimestamp(),
        endedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  /* =============================================
     🔍 Analizar errores en paralelo
  ============================================= */
  const analyzeMessage = async (messageText: string) => {
    try {
      const res = await fetch("/api/chat/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          level,
          language,
        }),
      });

      const data = await res.json();
      return data.corrections || [];
    } catch (err) {
      console.error("🔥 Error analyzing message:", err);
      return [];
    }
  };

  /* =============================================
     🚀 Enviar mensaje → streaming + análisis
  ============================================= */
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { 
      role: "user", 
      content: input,
      corrections: [] 
    };
    const newMessages = [...messages, userMsg];

    setMessages(newMessages);
    const userMessageIndex = newMessages.length - 1;
    
    setInput("");
    setIsTyping(true);
    setIsAnalyzing(true);

    // 🔥 ANÁLISIS DE ERRORES EN PARALELO (no bloquea la conversación)
    analyzeMessage(input).then((corrections) => {
      setMessages((prev) => {
        const updated = [...prev];
        updated[userMessageIndex] = {
          ...updated[userMessageIndex],
          corrections,
        };
        return updated;
      });
      setIsAnalyzing(false);
    });

    // 🔥 STREAMING DE RESPUESTA (continúa sin esperar análisis)
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

      if (!res.body) throw new Error("No stream received");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let partial = "";
      let assistantAdded = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        partial += decoder.decode(value, { stream: true });

        if (!assistantAdded) {
          assistantAdded = true;
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
      console.error("🔥 Streaming error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "The tutor had a small connection issue but you can continue normally.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* =============================================
     🧾 Finalizar conversación → pedir summary
  ============================================= */
  const finishConversation = async () => {
    setIsTyping(true);

    const studentMessages = messages.filter((m) => m.role === "user");
    const totalUserText = studentMessages.map((m) => m.content).join(" ");

    if (studentMessages.length < 2 || totalUserText.trim().length < 20) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `
<div style="color:#b91c1c; background:#fee2e2; padding:12px; border-radius:8px; border:1px solid #fecaca;">
<strong>⚠️ Conversation too short</strong><br/>
You need to chat a little more before requesting a summary.<br/>
Try sending a few more messages!
</div>
          `,
        },
      ]);
      setIsTyping(false);
      return;
    }

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

      const summary = await res.json();

      if (summary.error === "conversation-too-short") {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `
<div style="color:#b91c1c; background:#fee2e2; padding:12px; border-radius:8px; border:1px solid #fecaca;">
<strong>⚠️ Conversation too short</strong><br/>
The system needs more content to generate useful feedback.<br/>
Try chatting a bit more before finishing.
</div>
            `,
          },
        ]);
        setIsTyping(false);
        return;
      }

      if (summary.incomplete) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `
<div style="color:#92400e; background:#fef3c7; padding:12px; border-radius:8px; border:1px solid #fde68a;">
<strong>⚠️ Partial Summary</strong><br/>
The model was overloaded and could not generate a full summary.<br/>
Please try again in a moment.
</div>
            `,
          },
        ]);
        setIsTyping(false);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `
<h3 class="font-bold text-gray-800">Final Feedback</h3>
<p>${summary.feedbackSummary ?? ""}</p>

<h4 class="mt-3 font-semibold">Strengths</h4>
<ul>
${(summary.strengths ?? []).map((s: string) => `<li>• ${s}</li>`).join("")}
</ul>

<h4 class="mt-3 font-semibold">Weak Points</h4>
<ul>
${(summary.weakPoints ?? []).map((w: string) => `<li>• ${w}</li>`).join("")}
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

<h4 class="mt-3 font-semibold">Improvement Plan</h4>
<p>${summary.improvementPlan ?? ""}</p>
          `,
        },
      ]);

      await saveConversationToFirestore(summary);
    } catch (err) {
      console.error("🔥 Error finishing conversation:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `
<div style="color:#b91c1c; background:#fee2e2; padding:12px; border-radius:8px; border:1px solid #fecaca;">
<strong>⚠️ Error</strong><br/>
Something went wrong while generating your summary.<br/>
Please try again.
</div>
          `,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  /* =============================================
     UI Final
  ============================================= */
  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-lg border flex flex-col h-[80vh] overflow-hidden">

      {/* HEADER */}
      <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Language Tutor</h2>
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

      {/* CHAT AREA */}
<div className="flex-1 overflow-y-auto">
  <div className="p-4 space-y-4 overflow-visible relative">
    {messages.map((msg, idx) => (
      <MessageBubble
        key={idx}
        role={msg.role}
        content={msg.role === "assistant" ? formatMarkdown(msg.content) : msg.content}
        corrections={msg.corrections}
      />
    ))}

    {isTyping && <TypingIndicator />}
    {isAnalyzing && (
      <div className="text-xs text-gray-400 italic">
        Analyzing your message...
      </div>
    )}
    <div ref={chatEndRef}></div>
  </div>
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