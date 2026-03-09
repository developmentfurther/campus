"use client";

import { useState, useRef, useEffect } from "react";
import { FiSend, FiStopCircle, FiZap, FiMic, FiSquare, FiLock, FiCompass } from "react-icons/fi";
import clsx from "clsx";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import Image from "next/image";
import { useI18n } from "@/contexts/I18nContext";
import ChatbotVideoModal from "@/components/ui/ChatbotVideoModal";
import ChatboxTutorial from "./ChatboxTutorial";
import { useChat } from "@/contexts/ChatContext";
import TopicSelector, { TOPICS, Topic } from "./TopicSelector"; // 👈 NUEVO

const DAILY_MESSAGE_LIMIT = 6;

function formatMarkdown(text: string) {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");
}

// ✅ El mensaje inicial ahora depende del topic seleccionado
const getInitialMessage = (language: string, topic: Topic | null): string => {
  if (!topic) return ""; // No hay mensaje hasta que se elija tema

  const isEs = ["es", "spanish"].includes(language?.toLowerCase());
  const topicName = isEs ? topic.labelEs : topic.label;

  const map: Record<string, Record<string, string>> = {
    english: {
      travel: "Hi! Let's talk about travel! Have you been anywhere exciting lately, or do you have a dream destination in mind? ✈️",
      work: "Hi! Let's talk about work and careers. Are you currently working or looking for new opportunities? 💼",
      food: "Hi! Let's talk about food — one of my favorite topics! What's your absolute favorite dish? 🍽️",
      sports: "Hi! Let's talk sports! Do you play any sports yourself, or are you more of a fan? ⚽",
      tech: "Hi! Let's dive into tech. What apps or gadgets can you not live without? 💻",
      culture: "Hi! Let's explore culture and arts. Seen any good movies or listened to great music lately? 🎭",
      daily: "Hi! Let's chat about everyday life. What does your typical day look like? ☀️",
      business: "Hi! Let's talk business. Do you work for a company or have you thought about starting your own? 📈",
    },
    spanish: {
      travel: "¡Hola! Hoy vamos a hablar de viajes. ¿Fuiste a algún lugar interesante últimamente o tenés un destino soñado? ✈️",
      work: "¡Hola! Hoy vamos a hablar de trabajo y carrera. ¿Estás trabajando actualmente o buscando nuevas oportunidades? 💼",
      food: "¡Hola! Vamos a hablar de comida, uno de mis temas favoritos. ¿Cuál es tu plato favorito de todos los tiempos? 🍽️",
      sports: "¡Hola! Vamos a hablar de deportes. ¿Practicás algún deporte o sos más de ver los partidos? ⚽",
      tech: "¡Hola! Vamos a hablar de tecnología. ¿Qué apps o gadgets no podrías dejar de usar? 💻",
      culture: "¡Hola! Vamos a hablar de cultura y arte. ¿Viste alguna buena peli o escuchaste música que te haya copado últimamente? 🎭",
      daily: "¡Hola! Vamos a charlar sobre la vida cotidiana. ¿Cómo es tu día típico? ☀️",
      business: "¡Hola! Vamos a hablar de negocios. ¿Trabajás en una empresa o alguna vez pensaste en tener tu propio emprendimiento? 📈",
    },
  };

  const langKey = ["es", "spanish"].includes(language?.toLowerCase()) ? "spanish" : "english";
  return map[langKey]?.[topic.id] ?? `Hi! Let's talk about ${topicName}!`;
};

const languageKeyMap: Record<string, string> = {
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
  pronunciation?: any;
  isAudio?: boolean;
}

export default function ChatBox() {
  const { userProfile, user, hasSeenChatbotTutorial, loadingChatbotTutorialStatus } = useAuth();
  const { t } = useI18n();
  const { messages, setMessages } = useChat();

  const rawLang = userProfile?.learningLanguage?.toLowerCase() || "en";
  const language = languageKeyMap[rawLang] ?? "english";
  const level = userProfile?.learningLevel;

  // 🎯 NUEVO: estado del topic
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [showTopicSelector, setShowTopicSelector] = useState(false);

  if (!userProfile) {
    return <div className="p-6 text-gray-500 text-center">{t("chat.loadingProfile")}</div>;
  }
  if (!language || !level) {
    return <div className="p-6 text-gray-500 text-center">{t("chat.incompleteProfile")}</div>;
  }

  // Estado del chat
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  const [showTutorial, setShowTutorial] = useState(false);
  const [videoFinished, setVideoFinished] = useState(false);

  const [messageCount, setMessageCount] = useState(0);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [limitReason, setLimitReason] = useState<"count" | "summary" | null>(null);

  /* =============================================
     🎯 SELECCIÓN DE TOPIC
  ============================================= */
  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
    setShowTopicSelector(false);

    // Si es un cambio de tema (ya había mensajes), agregar mensaje de transición
    if (messages.length > 1) {
      const isEs = ["es", "spanish"].includes(rawLang);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: isEs
            ? `¡Genial! Cambiamos de tema. Ahora vamos a hablar de <strong>${topic.labelEs}</strong> ${topic.emoji}`
            : `Great! Let's switch topics. Now we'll talk about <strong>${topic.label}</strong> ${topic.emoji}`,
        },
      ]);
    } else {
      // Primera vez: setear mensaje inicial del topic
      setMessages([
        {
          role: "assistant",
          content: getInitialMessage(rawLang, topic),
        },
      ]);
    }
  };

  /* =============================================
     🔥 VERIFICAR USO AL CARGAR
  ============================================= */
  useEffect(() => {
    const checkDailyUsage = async () => {
      if (!user) return;
      const today = new Date().toISOString().split("T")[0];
      const usageRef = doc(db, "users", user.uid, "usage", "chat_daily");
      try {
        const snap = await getDoc(usageRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.date !== today) {
            await setDoc(usageRef, { date: today, count: 0, summaryTaken: false });
            setMessageCount(0);
            setIsLimitReached(false);
          } else {
            setMessageCount(data.count || 0);
            if (data.summaryTaken) { setIsLimitReached(true); setLimitReason("summary"); }
            else if ((data.count || 0) >= DAILY_MESSAGE_LIMIT) { setIsLimitReached(true); setLimitReason("count"); }
          }
        } else {
          await setDoc(usageRef, { date: today, count: 0, summaryTaken: false });
        }
      } catch (err) { console.error("Error checking usage:", err); }
    };
    checkDailyUsage();
  }, [user]);

  const incrementUsage = (): boolean => {
    const newCount = messageCount + 1;
    setMessageCount(newCount);
    return newCount >= DAILY_MESSAGE_LIMIT;
  };

  const persistUsage = async (finalCount: number, summaryTaken: boolean) => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const usageRef = doc(db, "users", user.uid, "usage", "chat_daily");
    await setDoc(usageRef, { date: today, count: finalCount, summaryTaken }, { merge: true });
  };

  const markSummaryAsTaken = async () => {
    if (!user) return;
    setIsLimitReached(true);
    setLimitReason("summary");
    await persistUsage(messageCount, true);
  };

  useEffect(() => {
    if (videoFinished && !loadingChatbotTutorialStatus && userProfile && !hasSeenChatbotTutorial) {
      setShowTutorial(true);
    }
  }, [videoFinished, userProfile, hasSeenChatbotTutorial, loadingChatbotTutorialStatus]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    return () => { if (recordingTimerRef.current) clearInterval(recordingTimerRef.current); };
  }, []);

  /* =============================================
     💾 Guardar sesión
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
        topic: selectedTopic?.id ?? null,    // 👈 guardar el topic también
        summary,
        startedAt: serverTimestamp(),
        endedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  /* =============================================
     🔍 Analizar errores
  ============================================= */
  const analyzeMessage = async (messageText: string) => {
    try {
      const res = await fetch("/api/chat/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText, level, language }),
      });
      const data = await res.json();
      return data.corrections || [];
    } catch (err) { return []; }
  };

  /* =============================================
     🚀 ENVIAR MENSAJE — pasa el topic al API
  ============================================= */
  const handleSend = async () => {
    if (!input.trim() || isLimitReached) return;

    const userMsg: Message = { role: "user", content: input, corrections: [] };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    const userMessageIndex = newMessages.length - 1;

    setInput("");
    setIsTyping(true);
    setIsAnalyzing(true);

    const shouldLock = incrementUsage();

    analyzeMessage(input).then((corrections) => {
      setMessages((prev) => {
        const updated = [...prev];
        updated[userMessageIndex] = { ...updated[userMessageIndex], corrections };
        return updated;
      });
      setIsAnalyzing(false);
    });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          level,
          language,
          topicPrompt: selectedTopic?.systemPrompt ?? null, // 👈 NUEVO: pasar topic al API
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
          updated[updated.length - 1] = { role: "assistant", content: partial };
          return updated;
        });
      }
    } catch (err) {
      console.error("🔥 Streaming error:", err);
    } finally {
      setIsTyping(false);
      if (shouldLock) {
        setTimeout(() => {
          setMessages((prev) => [...prev, {
            role: "assistant",
            content: "¡Has alcanzado tu límite diario! Has hecho un gran trabajo. Descansa y vuelve mañana. 👋",
          }]);
          setLimitReason("count");
          setIsLimitReached(true);
          persistUsage(messageCount + 1, false);
        }, 1000);
      }
    }
  };

  /* =============================================
     🎤 AUDIO
  ============================================= */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await processAudio(audioBlob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime((p) => p + 1), 1000);
    } catch (e) { console.error(e); alert("Could not access microphone."); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessingAudio(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("level", level);
      formData.append("language", language);
      const response = await fetch("/api/chat/voice", { method: "POST", body: formData });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      const userMsg: Message = {
        role: "user",
        content: data.transcription || "[Audio message]",
        corrections: data.corrections || [],
        pronunciation: data.pronunciation || null,
        isAudio: true,
      };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setIsTyping(true);
      const chatResponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, level, language, topicPrompt: selectedTopic?.systemPrompt ?? null }),
      });
      if (chatResponse.body) {
        const reader = chatResponse.body.getReader();
        const decoder = new TextDecoder();
        let partial = ""; let assistantAdded = false;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          partial += decoder.decode(value, { stream: true });
          if (!assistantAdded) { assistantAdded = true; setMessages((p) => [...p, { role: "assistant", content: "" }]); }
          setMessages((p) => { const u = [...p]; u[u.length - 1] = { role: "assistant", content: partial }; return u; });
        }
      }
    } catch (e) {
      console.error(e);
      setMessages((p) => [...p, { role: "assistant", content: "Sorry, I couldn't process your audio. Please try again." }]);
    } finally { setIsProcessingAudio(false); setIsTyping(false); }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  /* =============================================
     🧾 FINALIZAR CONVERSACIÓN
  ============================================= */
  const finishConversation = async () => {
    setIsTyping(true);
    const studentMessages = messages.filter((m) => m.role === "user");
    const totalUserText = studentMessages.map((m) => m.content).join(" ");
    if (studentMessages.length < 2 || totalUserText.trim().length < 20) {
      setMessages((p) => [...p, { role: "assistant", content: `<div style="color:#b91c1c;background:#fee2e2;padding:12px;border-radius:8px;border:1px solid #fecaca"><strong>${t("chat.errors.shortConversationTitle")}</strong><br/>${t("chat.errors.shortConversationBody")}</div>` }]);
      setIsTyping(false); return;
    }
    try {
      const res = await fetch("/api/chat/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, level, language }),
      });
      const summary = await res.json();
      if (summary.error === "conversation-too-short") {
        setMessages((p) => [...p, { role: "assistant", content: `<div style="color:#b91c1c;background:#fee2e2;padding:12px;border-radius:8px;border:1px solid #fecaca"><strong>${t("chat.errors.shortTitle")}</strong><br/>${t("chat.errors.shortBody2")}</div>` }]);
        setIsTyping(false); return;
      }
      if (summary.incomplete) {
        setMessages((p) => [...p, { role: "assistant", content: `<div style="color:#92400e;background:#fef3c7;padding:12px;border-radius:8px;border:1px solid #fde68a"><strong>${t("chat.errors.partialTitle")}</strong><br/>${t("chat.errors.partialBody")}</div>` }]);
        setIsTyping(false); return;
      }
      setMessages((p) => [...p, { role: "assistant", content: `<h3 class="font-bold text-gray-800">Final Feedback</h3><p>${summary.feedbackSummary ?? ""}</p><p><strong>See you tomorrow for more practice! 👋</strong></p>` }]);
      await saveConversationToFirestore(summary);
      await markSummaryAsTaken();
    } catch (err) {
      console.error(err);
      setMessages((p) => [...p, { role: "assistant", content: `<div style="color:#b91c1c;background:#fee2e2;padding:12px;border-radius:8px;border:1px solid #fecaca"><strong>⚠️ Error</strong><br/>Something went wrong. Please try again.</div>` }]);
    } finally { setIsTyping(false); }
  };

  const isEs = ["es", "spanish"].includes(rawLang);

  /* =============================================
     UI
  ============================================= */
  return (
    <>
      <ChatbotVideoModal
        videoUrl="https://player.vimeo.com/video/1146041754"
        autoShow={true}
        videoType="youtube"
        onClose={() => setVideoFinished(true)}
      />
      {showTutorial && (
        <ChatboxTutorial onComplete={() => setShowTutorial(false)} onSkip={() => setShowTutorial(false)} />
      )}

      <div className="w-full h-[calc(100dvh-80px)] sm:h-[85vh] sm:max-w-4xl sm:mx-auto flex flex-col px-1 py-1 sm:p-0">
        <div className="flex flex-col h-full rounded-xl sm:rounded-3xl overflow-hidden shadow-2xl border border-[#EE7203]/30 sm:border-2 sm:border-[#EE7203] relative bg-white">

          {/* HEADER */}
          <div className="px-4 sm:px-8 py-3 sm:py-5 bg-gradient-to-r from-[#0C212D] to-[#112C3E] border-b border-[#EE7203]/30 flex-shrink-0">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="relative">
                  <Image src="/images/avatar.png" alt="Mr Further" width={40} height={40} className="sm:w-[52px] sm:h-[52px] rounded-full border-2 border-[#EE7203] object-cover" />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 bg-[#10b981] rounded-full border-2 border-[#0C212D]"></div>
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5 sm:gap-2">
                    Mr Further <FiZap className="text-[#EE7203]" size={14} />
                  </h2>
                  <div className="text-[10px] text-white/60">Daily: {messageCount}/{DAILY_MESSAGE_LIMIT}</div>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="px-1.5 py-0.5 bg-[#EE7203] text-white text-[10px] font-bold rounded uppercase">{language}</span>
                    <span className="text-white/50 text-xs hidden sm:inline">•</span>
                    <span className="text-white/70 text-[10px]">Level {level}</span>
                    {/* 🎯 TOPIC BADGE */}
                    {selectedTopic && (
                      <>
                        <span className="text-white/50 text-xs hidden sm:inline">•</span>
                        <span className="text-white/70 text-[10px] flex items-center gap-1">
                          {selectedTopic.emoji} {isEs ? selectedTopic.labelEs : selectedTopic.label}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* 🎯 BOTÓN CAMBIAR TEMA */}
                <button
                  onClick={() => setShowTopicSelector(true)}
                  disabled={isLimitReached}
                  title={isEs ? "Cambiar temática" : "Change topic"}
                  className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiCompass size={14} />
                  <span className="hidden sm:inline">{selectedTopic ? (isEs ? "Cambiar tema" : "Change topic") : (isEs ? "Elegir tema" : "Choose topic")}</span>
                </button>

                <button
                  data-tutorial="end-button"
                  onClick={finishConversation}
                  disabled={isLimitReached}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-white/10 text-white font-semibold text-xs sm:text-sm hover:bg-[#FF3816] transition-colors duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiStopCircle size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{t("chat.endConversation")}</span>
                  <span className="sm:hidden">End</span>
                </button>
              </div>
            </div>
          </div>

          {/* CHAT AREA */}
          <div data-tutorial="chat-area" className="flex-1 overflow-y-auto bg-gray-50 overscroll-contain min-h-0 relative">
            <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 pb-4 min-h-full">
              {messages.map((msg, idx) => (
                <MessageBubble
                  key={idx}
                  role={msg.role}
                  content={msg.role === "assistant" ? formatMarkdown(msg.content) : msg.content}
                  corrections={msg.corrections}
                  pronunciation={msg.pronunciation}
                />
              ))}
              {isTyping && <TypingIndicator />}
              {isAnalyzing && (
                <div className="flex items-center gap-2 text-xs text-[#EE7203] font-medium px-2 sm:px-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#EE7203] animate-pulse"></div>
                  {t("chat.analyzing")}
                </div>
              )}
              {isProcessingAudio && (
                <div className="flex items-center gap-2 text-xs text-[#EE7203] font-medium px-2 sm:px-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#EE7203] animate-pulse"></div>
                  Processing audio...
                </div>
              )}
              <div ref={chatEndRef}></div>
            </div>

            {/* 🎯 SELECTOR INICIAL (cuando no hay tema elegido aún) */}
            {!selectedTopic && !isLimitReached && (
              <TopicSelector
                language={rawLang}
                onSelect={handleTopicSelect}
                currentTopic={null}
                mode="initial"
              />
            )}

            {/* 🎯 SELECTOR DE CAMBIO (modal overlay) */}
            {showTopicSelector && selectedTopic && (
              <TopicSelector
                language={rawLang}
                onSelect={handleTopicSelect}
                currentTopic={selectedTopic}
                mode="change"
                onClose={() => setShowTopicSelector(false)}
              />
            )}

            {/* OVERLAY LÍMITE */}
            {isLimitReached && (
              <div className="absolute bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t-2 border-[#EE7203] p-6 z-20 flex flex-col items-center text-center animate-in slide-in-from-bottom-10 fade-in duration-500">
                <div className="w-24 h-24 relative mb-4">
                  <Image src="/images/goodbye.png" alt="Sleepy Robot" width={96} height={96} className="object-contain" />
                  <div className="absolute -top-2 -right-2 bg-[#EE7203] text-white rounded-full p-1.5 shadow-md"><FiLock size={16} /></div>
                </div>
                <h3 className="text-xl font-bold text-[#0C212D] mb-2">
                  {limitReason === "count" ? "Daily limit reached!" : "Session completed!"}
                </h3>
                <p className="text-gray-600 max-w-sm text-sm mb-4 leading-relaxed">
                  {limitReason === "count"
                    ? "You've been practicing hard today! Come back tomorrow for more."
                    : "You've finished your daily session. Review your feedback and come back tomorrow!"}
                </p>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2 max-w-xs"><div className="bg-[#EE7203] h-full w-full rounded-full"></div></div>
                <p className="text-xs text-gray-400 font-medium">Resets automatically tomorrow</p>
              </div>
            )}
          </div>

          {/* INPUT AREA */}
          {!isLimitReached ? (
            <div ref={inputContainerRef} className="bg-white border-t border-gray-200 flex-shrink-0 safe-bottom">
              {isRecording && (
                <div className="px-3 sm:px-6 pt-2 pb-1 bg-red-50 border-b border-red-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-red-600 font-medium">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                      <span>Recording...</span>
                    </div>
                    <span className="text-sm font-mono text-red-600">{formatTime(recordingTime)}</span>
                  </div>
                </div>
              )}
              <div className="p-3 sm:p-6">
                <div className="flex items-end gap-2 sm:gap-3">
                  <div className="flex-1 relative">
                    <textarea
                      data-tutorial="text-input"
                      className="w-full border-2 border-gray-200 rounded-xl p-2.5 sm:p-3 pr-8 resize-none focus:outline-none focus:border-[#EE7203] focus:ring-2 focus:ring-[#EE7203]/20 min-h-[48px] sm:min-h-[56px] max-h-[100px] transition-colors text-sm sm:text-base"
                      placeholder={selectedTopic ? t("chat.inputPlaceholder") : (isEs ? "Primero elegí una temática ↑" : "Choose a topic first ↑")}
                      value={input}
                      onKeyDown={handleKey}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={isRecording || isProcessingAudio || !selectedTopic}
                      rows={1}
                    />
                    {input.length > 0 && (
                      <div className="absolute bottom-2 right-2 text-[10px] text-gray-400 pointer-events-none">{input.length}</div>
                    )}
                  </div>
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessingAudio || !selectedTopic}
                    className={clsx(
                      "flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-md",
                      isRecording ? "bg-red-500 hover:bg-red-600" : "bg-gradient-to-r from-[#0C212D] to-[#112C3E]"
                    )}
                  >
                    {isRecording ? <FiSquare size={18} /> : <FiMic size={18} />}
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isRecording || isProcessingAudio || !selectedTopic}
                    className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 flex-shrink-0 shadow-md shadow-orange-200"
                  >
                    <FiSend size={18} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 text-center text-gray-400 text-sm border-t border-gray-200 safe-bottom">
              Chat session closed for today.
            </div>
          )}

        </div>
      </div>

      <style jsx global>{`
        .safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
        .overscroll-contain { overscroll-behavior: contain; }
      `}</style>
    </>
  );
}