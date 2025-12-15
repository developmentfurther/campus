"use client";

import { useState, useRef, useEffect } from "react";
import { FiSend, FiStopCircle, FiZap, FiMic, FiSquare } from "react-icons/fi";
import clsx from "clsx";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import Image from "next/image";
import { useI18n } from "@/contexts/I18nContext";
import ChatbotVideoModal from "@/components/ui/ChatbotVideoModal";

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
  pronunciation?: any;
  isAudio?: boolean;
}

export default function ChatBox() {
  const { userProfile, user, hasSeenWelcomeVideo, loadingVideoStatus } = useAuth();
  const { t } = useI18n();

  // 🔥 DEBUG: Ver estado del video
  useEffect(() => {
    console.log("🎬 ChatBox - Estado del video:", {
      user: !!user,
      userProfile: !!userProfile,
      hasSeenWelcomeVideo,
      loadingVideoStatus,
      batchId: userProfile?.batchId,
      userKey: userProfile?.userKey,
    });
  }, [user, userProfile, hasSeenWelcomeVideo, loadingVideoStatus]); 

  const rawLang = userProfile?.learningLanguage?.toLowerCase() || "en";
  const language = languageKeyMap[rawLang] ?? "english";
  const level = userProfile?.learningLevel;

  /* =============================================
     ⏳ Carga de perfil
  ============================================= */
  if (!userProfile) {
    return (
      <div className="p-6 text-gray-500 text-center">
        {t("chat.loadingProfile")}
      </div>
    );
  }

  if (!language || !level) {
    return (
      <div className="p-6 text-gray-500 text-center">
        {t("chat.incompleteProfile")}
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
  
  // 🎤 Estados para audio
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

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
          content: t("chat.errors.connection")
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  /* =============================================
     🎤 FUNCIONES DE AUDIO
  ============================================= */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        
        // Detener todas las pistas del stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Iniciar contador de tiempo
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessingAudio(true);
    
    try {
      // Crear FormData
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('level', level);
      formData.append('language', language);
      
      // Llamar al endpoint de transcripción y análisis
      const response = await fetch('/api/chat/voice', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Agregar mensaje del usuario con transcripción
      const userMsg: Message = {
        role: "user",
        content: data.transcription || "[Audio message]",
        corrections: data.corrections || [],
        pronunciation: data.pronunciation || null,
        isAudio: true
      };
      
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      
      // Obtener respuesta del asistente
      setIsTyping(true);
      
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          level,
          language
        })
      });
      
      if (chatResponse.body) {
        const reader = chatResponse.body.getReader();
        const decoder = new TextDecoder();
        let partial = "";
        let assistantAdded = false;
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          partial += decoder.decode(value, { stream: true });
          
          if (!assistantAdded) {
            assistantAdded = true;
            setMessages(prev => [...prev, { role: "assistant", content: "" }]);
          }
          
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: partial
            };
            return updated;
          });
        }
      }
      
    } catch (error) {
      console.error("Error processing audio:", error);
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't process your audio. Please try again."
        }
      ]);
    } finally {
      setIsProcessingAudio(false);
      setIsTyping(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
<strong>${t("chat.errors.shortConversationTitle")}</strong><br/>
${t("chat.errors.shortConversationBody")}
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
<strong>${t("chat.errors.shortTitle")}</strong><br/>
${t("chat.errors.shortBody2")}
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
<strong>${t("chat.errors.partialTitle")}</strong><br/>
${t("chat.errors.partialBody")}
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
     UI Final - OPTIMIZADO
  ============================================= */
  return (
    <>
      <ChatbotVideoModal
        videoUrl="https://player.vimeo.com/video/1146041754"
        autoShow={true}
        videoType="youtube"
      />
      
      <div className="w-full max-w-4xl mx-auto flex flex-col h-[85vh]">
        
        {/* Main container */}
        <div className="flex flex-col h-full rounded-3xl overflow-hidden shadow-2xl border-2 border-[#EE7203]">

          {/* HEADER */}
          <div className="px-8 py-5 bg-gradient-to-r from-[#0C212D] to-[#112C3E] border-b border-[#EE7203]/30">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative">
                  <Image
                    src="/images/avatar.png"
                    alt="Mr Further"
                    width={52}
                    height={52}
                    className="rounded-full border-2 border-[#EE7203] object-cover"
                  />
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#10b981] rounded-full border-2 border-[#0C212D]"></div>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Mr Further
                    <FiZap className="text-[#EE7203]" size={16} />
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="px-2 py-0.5 bg-[#EE7203] text-white text-xs font-bold rounded uppercase">
                      {language}
                    </span>
                    <span className="text-white/50 text-xs">•</span>
                    <span className="text-white/70 text-xs">Level {level}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={finishConversation}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white font-semibold text-sm hover:bg-[#FF3816] transition-colors duration-200"
              >
                <FiStopCircle size={16} />
                {t("chat.endConversation")}
              </button>
            </div>
          </div>

          {/* CHAT AREA */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-6 space-y-4">
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
                <div className="flex items-center gap-2 text-xs text-[#EE7203] font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#EE7203]"></div>
                  {t("chat.analyzing")}
                </div>
              )}

              {isProcessingAudio && (
                <div className="flex items-center gap-2 text-xs text-[#EE7203] font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#EE7203] animate-pulse"></div>
                  Processing audio...
                </div>
              )}
              
              <div ref={chatEndRef}></div>
            </div>
          </div>

          {/* INPUT AREA */}
          <div className="p-6 bg-white border-t border-gray-200">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  className="w-full border-2 border-gray-200 rounded-xl p-3 pr-10 resize-none focus:outline-none focus:border-[#EE7203] focus:ring-2 focus:ring-[#EE7203]/20 min-h-[56px] max-h-[120px] transition-colors"
                  placeholder={t("chat.inputPlaceholder")}
                  value={input}
                  onKeyDown={handleKey}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isRecording || isProcessingAudio}
                />
                
                {input.length > 0 && (
                  <div className="absolute bottom-2 right-3 text-xs text-gray-400">
                    {input.length}
                  </div>
                )}
              </div>

              {/* Botón de voz */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessingAudio}
                className={clsx(
                  "flex items-center justify-center w-14 h-14 rounded-xl text-white transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed",
                  isRecording 
                    ? "bg-red-500 hover:bg-red-600 animate-pulse" 
                    : "bg-gradient-to-r from-[#0C212D] to-[#112C3E] hover:shadow-lg"
                )}
              >
                {isRecording ? <FiSquare size={20} /> : <FiMic size={20} />}
              </button>

              {/* Botón de envío */}
              <button
                onClick={handleSend}
                disabled={!input.trim() || isRecording || isProcessingAudio}
                className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white hover:shadow-lg hover:shadow-[#EE7203]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <FiSend size={20} />
              </button>
            </div>

            {/* Recording indicator */}
            {isRecording && (
              <div className="mt-3 flex items-center gap-2 text-sm text-red-500 font-medium">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                Recording... {formatTime(recordingTime)}
              </div>
            )}

            {/* Tips */}
            {!isRecording && (
              <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px]">Enter</kbd>
                  <span>send</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px]">Shift+Enter</kbd>
                  <span>new line</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <FiMic size={12} />
                  <span>voice message</span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}