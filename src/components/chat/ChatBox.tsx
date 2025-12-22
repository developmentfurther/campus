"use client";

import { useState, useRef, useEffect } from "react";
import { FiSend, FiStopCircle, FiZap, FiMic, FiSquare, FiLock } from "react-icons/fi";
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



const DAILY_MESSAGE_LIMIT = 6; // Límite de mensajes por día
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
  const { userProfile, user, hasSeenChatbotTutorial, markChatbotTutorialAsSeen, loadingChatbotTutorialStatus } = useAuth();
  const { t } = useI18n();
  const { messages, setMessages } = useChat();

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
 /* =============================================
     💬 Inicialización Inteligente (Contexto)
  ============================================= */
  // Si el contexto está vacío (primera vez), cargamos el saludo.
  // Si ya tiene mensajes (volviendo de otra página), NO hacemos nada.
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: initialMessagesByLanguage[language],
        },
      ]);
    }
  }, [language, messages.length, setMessages]);



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
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [videoFinished, setVideoFinished] = useState(false);

  // 🔥 ESTADOS PARA EL LÍMITE DIARIO
  const [messageCount, setMessageCount] = useState(0);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [limitReason, setLimitReason] = useState<"count" | "summary" | null>(null);


/* =============================================
     🔥 1. CONTROL DE USO DIARIO (Al Cargar)
  ============================================= */
  useEffect(() => {
    const checkDailyUsage = async () => {
      if (!user) return;

      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const usageRef = doc(db, "users", user.uid, "usage", "chat_daily");
      
      try {
        const snap = await getDoc(usageRef);
        
        if (snap.exists()) {
          const data = snap.data();
          
          // Si es un nuevo día, reseteamos
          if (data.date !== today) {
            await setDoc(usageRef, { date: today, count: 0, summaryTaken: false });
            setMessageCount(0);
            setIsLimitReached(false);
          } else {
            // Es el mismo día, cargamos estado
            setMessageCount(data.count || 0);
            
            if (data.summaryTaken) {
              setIsLimitReached(true);
              setLimitReason("summary");
            } else if ((data.count || 0) >= DAILY_MESSAGE_LIMIT) {
              setIsLimitReached(true);
              setLimitReason("count");
            }
          }
        } else {
          // Primera vez
          await setDoc(usageRef, { date: today, count: 0, summaryTaken: false });
        }
      } catch (err) {
        console.error("Error checking usage:", err);
      }
    };

    checkDailyUsage();
  }, [user]);

  /* =============================================
     🔥 2. INCREMENTAR USO (Al Enviar)
  ============================================= */
  /* =============================================
   🔥 2. INCREMENTAR USO (Modificado)
   Ahora devuelve true si se alcanzó el límite, pero NO bloquea la UI todavía.
============================================= */
const incrementUsage = async (): Promise<boolean> => {
  if (!user) return false;
  const usageRef = doc(db, "users", user.uid, "usage", "chat_daily");
  
  const newCount = messageCount + 1;
  setMessageCount(newCount);

  // Actualizamos la DB en segundo plano (no necesitamos esperar el await para seguir)
  setDoc(usageRef, { count: newCount }, { merge: true });

  // Retornamos true si YA llegamos al límite
  return newCount >= DAILY_MESSAGE_LIMIT;
};

  /* =============================================
     🔥 3. MARCAR RESUMEN PEDIDO (Al finalizar)
  ============================================= */
  const markSummaryAsTaken = async () => {
    if (!user) return;
    const usageRef = doc(db, "users", user.uid, "usage", "chat_daily");
    await setDoc(usageRef, { summaryTaken: true }, { merge: true });
    
    setIsLimitReached(true);
    setLimitReason("summary");
  };


useEffect(() => {
  if (
    videoFinished &&
    !loadingChatbotTutorialStatus &&
    userProfile &&
    !hasSeenChatbotTutorial
  ) {
    setShowTutorial(true);
  }
}, [
  videoFinished,
  userProfile,
  hasSeenChatbotTutorial,
  loadingChatbotTutorialStatus
]);


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
/* =============================================
   🚀 Enviar mensaje (Modificado)
============================================= */
const handleSend = async () => {
  if (!input.trim() || isLimitReached) return;

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
  
  // 🔥 PASO 1: Incrementamos y guardamos si debemos bloquear AL FINAL
  // Importante: Guardamos el resultado en una variable local "shouldLock"
  const shouldLock = await incrementUsage(); 

  // Análisis en paralelo... (tu código igual)
  analyzeMessage(input).then((corrections) => {
    setMessages((prev) => {
      const updated = [...prev];
      updated[userMessageIndex] = { ...updated[userMessageIndex], corrections };
      return updated;
    });
    setIsAnalyzing(false);
  });

  // Streaming... (tu código igual)
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages, level, language }),
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
    // ... manejo de errores ...
  } finally {
    setIsTyping(false);

    // 🔥 PASO 2: AHORA sí aplicamos el bloqueo, cuando el bot terminó de hablar
    if (shouldLock) {
        // Pequeño delay para que se sienta natural (el bot termina, espera 1s, y cierra)
        setTimeout(() => {
            // 1. Mandar mensaje de despedida
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "¡Has alcanzado tu límite diario! Has hecho un gran trabajo. Descansa y vuelve mañana. 👋"
            }]);
            
            // 2. Activar el Overlay y bloquear input
            setLimitReason("count");
            setIsLimitReached(true);
        }, 1000);
    }
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

<p><strong>See you tomorrow for more practice! 👋</strong></p>

          `,
        },
      ]);

      await saveConversationToFirestore(summary);
      await markSummaryAsTaken();
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

const closeTutorial = () => {
  setShowTutorial(false);
};


  /* =============================================
     UI Final - OPTIMIZADO PARA MOBILE
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
        <ChatboxTutorial
          onComplete={closeTutorial}
          onSkip={closeTutorial}
        />
      )}

      {/* WRAPPER PRINCIPAL */}
      <div className="w-full h-[calc(100dvh-80px)] sm:h-[85vh] sm:max-w-4xl sm:mx-auto flex flex-col px-1 py-1 sm:p-0">
        
        {/* MAIN CARD CONTAINER (Bordes, Sombra, Redondeado) */}
        {/* Todo el chat + input debe estar DENTRO de este div */}
        <div className="flex flex-col h-full rounded-xl sm:rounded-3xl overflow-hidden shadow-2xl border border-[#EE7203]/30 sm:border-2 sm:border-[#EE7203] relative bg-white">

          {/* 1. HEADER */}
          <div className="px-4 sm:px-8 py-3 sm:py-5 bg-gradient-to-r from-[#0C212D] to-[#112C3E] border-b border-[#EE7203]/30 flex-shrink-0">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="relative">
                  <Image
                    src="/images/avatar.png"
                    alt="Mr Further"
                    width={40}
                    height={40}
                    className="sm:w-[52px] sm:h-[52px] rounded-full border-2 border-[#EE7203] object-cover"
                  />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 bg-[#10b981] rounded-full border-2 border-[#0C212D]"></div>
                </div>

                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5 sm:gap-2">
                    Mr Further
                    <FiZap className="text-[#EE7203]" size={14} />
                  </h2>
                  <div className="text-[10px] text-white/60">
                    Daily Messages: {messageCount}/{DAILY_MESSAGE_LIMIT}
                  </div>
                  <div data-tutorial="language-level" className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                    <span className="px-1.5 sm:px-2 py-0.5 bg-[#EE7203] text-white text-[10px] sm:text-xs font-bold rounded uppercase">
                      {language}
                    </span>
                    <span className="text-white/50 text-xs hidden sm:inline">•</span>
                    <span className="text-white/70 text-[10px] sm:text-xs">Level {level}</span>
                  </div>
                </div>
              </div>

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

          {/* 2. CHAT AREA (Scrollable) */}
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

            {/* OVERLAY DE LÍMITE (Dentro del área relativa para cubrir el chat) */}
            {isLimitReached && (
              <div className="absolute bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t-2 border-[#EE7203] p-6 z-20 flex flex-col items-center text-center animate-in slide-in-from-bottom-10 fade-in duration-500 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                <div className="w-24 h-24 relative mb-4">
                  <Image
                    src="/images/goodbye.png"
                    alt="Sleepy Robot"
                    width={96}
                    height={96}
                    className="object-contain"
                  />
                  <div className="absolute -top-2 -right-2 bg-[#EE7203] text-white rounded-full p-1.5 shadow-md">
                    <FiLock size={16} />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-[#0C212D] mb-2">
                  {limitReason === 'count' ? "Daily limit reached!" : "Session completed!"}
                </h3>
                <p className="text-gray-600 max-w-sm text-sm mb-4 leading-relaxed">
                  {limitReason === 'count'
                    ? "You've been practicing hard today! Your brain needs rest to consolidate learning. Come back tomorrow for more."
                    : "You've finished your daily session with a summary. Review your feedback and come back tomorrow!"}
                </p>

                <div className="w-full bg-gray-100 rounded-full h-2 mb-2 max-w-xs overflow-hidden">
                  <div className="bg-[#EE7203] h-full w-full"></div>
                </div>
                <p className="text-xs text-gray-400 font-medium">Resets automatically tomorrow</p>
              </div>
            )}
          </div>

          {/* 3. INPUT AREA (Oculta/Bloqueada) */}
          {/* IMPORTANTE: Esto ahora está DENTRO del div "MAIN CARD CONTAINER" */}
          {!isLimitReached ? (
            <div
              ref={inputContainerRef}
              className="bg-white border-t border-gray-200 flex-shrink-0 safe-bottom"
            >
              {/* Recording indicator */}
              {isRecording && (
                <div className="px-3 sm:px-6 pt-2 sm:pt-3 pb-1 sm:pb-2 bg-red-50 border-b border-red-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600 font-medium">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                      <span>Recording...</span>
                    </div>
                    <span className="text-sm sm:text-base font-mono text-red-600">
                      {formatTime(recordingTime)}
                    </span>
                  </div>
                </div>
              )}

              {/* Input container */}
              <div className="p-3 sm:p-6">
                <div className="flex items-end gap-2 sm:gap-3">
                  <div className="flex-1 relative">
                    <textarea
                      data-tutorial="text-input"
                      className="w-full border-2 border-gray-200 rounded-xl p-2.5 sm:p-3 pr-8 sm:pr-10 resize-none focus:outline-none focus:border-[#EE7203] focus:ring-2 focus:ring-[#EE7203]/20 min-h-[48px] sm:min-h-[56px] max-h-[100px] sm:max-h-[120px] transition-colors text-sm sm:text-base"
                      placeholder={t("chat.inputPlaceholder")}
                      value={input}
                      onKeyDown={handleKey}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={isRecording || isProcessingAudio}
                      rows={1}
                    />

                    {input.length > 0 && (
                      <div className="absolute bottom-2 right-2 sm:right-3 text-[10px] sm:text-xs text-gray-400 pointer-events-none">
                        {input.length}
                      </div>
                    )}
                  </div>

                  <button
                    data-tutorial="voice-button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessingAudio}
                    className={clsx(
                      "flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl text-white transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-md",
                      isRecording
                        ? "bg-red-500 hover:bg-red-600 shadow-red-200"
                        : "bg-gradient-to-r from-[#0C212D] to-[#112C3E] hover:shadow-lg shadow-gray-300"
                    )}
                  >
                    {isRecording ? <FiSquare size={18} className="sm:w-5 sm:h-5" /> : <FiMic size={18} className="sm:w-5 sm:h-5" />}
                  </button>

                  <button
                    data-tutorial="send-button"
                    onClick={handleSend}
                    disabled={!input.trim() || isRecording || isProcessingAudio}
                    className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white hover:shadow-lg hover:shadow-[#EE7203]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 flex-shrink-0 shadow-md shadow-orange-200"
                  >
                    <FiSend size={18} className="sm:w-5 sm:h-5" />
                  </button>
                </div>

                {!isRecording && (
                  <div className="mt-2 sm:mt-3 flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-500 flex-wrap">
                    <div className="flex items-center gap-1">
                      <kbd className="px-1 sm:px-1.5 py-0.5 bg-gray-100 rounded text-[9px] sm:text-[10px] font-mono">Enter</kbd>
                      <span>send</span>
                    </div>
                    <span className="hidden sm:inline">•</span>
                    <div className="hidden sm:flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">Shift+Enter</kbd>
                      <span>new line</span>
                    </div>
                    <span className="hidden sm:inline">•</span>
                    <div className="flex items-center gap-1">
                      <FiMic size={10} className="sm:w-3 sm:h-3" />
                      <span>voice input</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // INPUT AREA REEMPLAZADA POR MENSAJE DE CIERRE
            <div className="bg-gray-50 p-4 text-center text-gray-400 text-sm border-t border-gray-200 safe-bottom">
              Chat session closed for today.
            </div>
          )}

        </div> {/* CIERRE DE MAIN CARD CONTAINER (Ahora sí al final) */}
      </div> {/* CIERRE DE WRAPPER PRINCIPAL */}

      <style jsx global>{`
        .safe-area-inset { padding-top: env(safe-area-inset-top); }
        .safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
        .overscroll-contain { overscroll-behavior: contain; }
      `}</style>
    </>
  );

}