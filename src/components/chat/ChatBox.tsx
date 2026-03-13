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
import TopicSelector, { TOPICS, Topic } from "./TopicSelector";
import { useAlumno } from "@/contexts/AlumnoContext";
import { motion, AnimatePresence } from "framer-motion";

const DAILY_MESSAGE_LIMIT = 20;

function formatMarkdown(text: string) {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");
}

const getInitialMessage = (language: string, topic: Topic | null): string => {
  if (!topic) return "";
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
  portuguese: {
    travel: "Oi! Vamos falar sobre viagens! Você foi a algum lugar interessante ultimamente ou tem um destino dos sonhos? ✈️",
    work: "Oi! Vamos falar sobre trabalho e carreira. Você está trabalhando atualmente ou buscando novas oportunidades? 💼",
    food: "Oi! Vamos falar sobre comida — um dos meus temas favoritos! Qual é o seu prato favorito de todos os tempos? 🍽️",
    sports: "Oi! Vamos falar de esportes! Você pratica algum esporte ou prefere assistir? ⚽",
    tech: "Oi! Vamos mergulhar no mundo da tecnologia. Quais apps ou gadgets você não consegue viver sem? 💻",
    culture: "Oi! Vamos explorar cultura e artes. Assistiu algum bom filme ou ouviu uma música incrível ultimamente? 🎭",
    daily: "Oi! Vamos bater um papo sobre o dia a dia. Como é o seu dia típico? ☀️",
    business: "Oi! Vamos falar de negócios. Você trabalha em uma empresa ou já pensou em ter o seu próprio negócio? 📈",
  },
  italian: {
    travel: "Ciao! Parliamo di viaggi! Sei stato in qualche posto interessante di recente o hai una destinazione dei sogni? ✈️",
    work: "Ciao! Parliamo di lavoro e carriera. Stai lavorando attualmente o cerchi nuove opportunità? 💼",
    food: "Ciao! Parliamo di cibo — uno dei miei argomenti preferiti! Qual è il tuo piatto preferito in assoluto? 🍽️",
    sports: "Ciao! Parliamo di sport! Pratichi qualche sport o sei più un tifoso? ⚽",
    tech: "Ciao! Immergiamoci nel mondo della tecnologia. Quali app o gadget non potresti mai fare a meno? 💻",
    culture: "Ciao! Esploriamo cultura e arte. Hai visto qualche bel film o ascoltato buona musica ultimamente? 🎭",
    daily: "Ciao! Chiacchieriamo della vita quotidiana. Com'è la tua giornata tipica? ☀️",
    business: "Ciao! Parliamo di business. Lavori per un'azienda o hai mai pensato di avviare la tua? 📈",
  },
  french: {
    travel: "Bonjour ! Parlons voyage ! Êtes-vous allé quelque part d'intéressant récemment ou avez-vous une destination de rêve ? ✈️",
    work: "Bonjour ! Parlons travail et carrière. Travaillez-vous actuellement ou cherchez-vous de nouvelles opportunités ? 💼",
    food: "Bonjour ! Parlons cuisine — l'un de mes sujets préférés ! Quel est votre plat préféré de tous les temps ? 🍽️",
    sports: "Bonjour ! Parlons sport ! Vous pratiquez un sport ou vous êtes plutôt supporter ? ⚽",
    tech: "Bonjour ! Plongeons dans la tech. Quelles applis ou quels gadgets ne pourriez-vous pas quitter ? 💻",
    culture: "Bonjour ! Explorons culture et arts. Vous avez vu un bon film ou écouté de la bonne musique dernièrement ? 🎭",
    daily: "Bonjour ! Parlons de la vie quotidienne. À quoi ressemble votre journée type ? ☀️",
    business: "Bonjour ! Parlons business. Vous travaillez pour une entreprise ou avez-vous pensé à créer la vôtre ? 📈",
  },
};
   const langKey = language?.toLowerCase();
  return map[langKey]?.[topic.id] ?? map["english"]?.[topic.id] ?? `Hi! Let's talk about ${topic.label}!`;
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
  const { userProfile, user } = useAuth();
  const { hasSeenChatbotTutorial, loadingChatbotTutorialStatus } = useAlumno();
  const { t, lang } = useI18n();
  const { messages, setMessages } = useChat();

  // ✅ TODOS los hooks primero
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [showTopicSelector, setShowTopicSelector] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [videoFinished, setVideoFinished] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [limitReason, setLimitReason] = useState<"count" | "summary" | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  // ✅ Variables derivadas
  const rawLang = lang || "en";
  const language = languageKeyMap[rawLang] ?? "english";
  const level = userProfile?.learningLevel || "A1";
  const isEs = ["es", "spanish"].includes(rawLang);

  // ✅ TODOS los useEffect antes de cualquier return
  useEffect(() => {
    // REEMPLAZAR checkDailyUsage
const checkDailyUsage = async () => {
  if (!user || !userProfile?.batchId || !userProfile?.userKey) return;
  const today = new Date().toISOString().split("T")[0];
  
  try {
    const batchRef = doc(db, "alumnos", userProfile.batchId);
    const snap = await getDoc(batchRef);
    if (!snap.exists()) return;

    const chatDaily = snap.data()?.[userProfile.userKey]?.chatDaily;

    if (!chatDaily || chatDaily.date !== today) {
      
      setMessages([]);
      await setDoc(batchRef, {
        [userProfile.userKey]: {
          ...snap.data()[userProfile.userKey],
          chatDaily: { date: today, count: 0, summaryTaken: false }
        }
      }, { merge: true });
      setMessageCount(0);
      setIsLimitReached(false);
    } else {
      setMessageCount(chatDaily.count || 0);
      if (chatDaily.summaryTaken) {
        setIsLimitReached(true);
        setLimitReason("summary");
        // ✅ Cargar última sesión guardada para mostrarla
        await loadLastSession();
      } else if ((chatDaily.count || 0) >= DAILY_MESSAGE_LIMIT) {
        setIsLimitReached(true);
        setLimitReason("count");
        await loadLastSession();
      }
    }
  } catch (err) {
    console.error("Error checking usage:", err);
  }
};

const loadLastSession = async () => {
  if (!userProfile?.batchId || !userProfile?.userKey) return;

  // ✅ Si ya hay mensajes en sessionStorage, no sobreescribir
  

  // Solo llega acá si sessionStorage está vacío (ej: abrió en otro browser/dispositivo)
  try {
    const snap = await getDoc(doc(db, "chatSessions", userProfile.batchId));
    if (!snap.exists()) return;
    const sessions: any[] = snap.data()?.[userProfile.userKey] ?? [];
    if (!sessions.length) return;
    const last = sessions[0];

    setMessages([
      {
        role: "assistant",
        content: `<h3 class="font-bold text-gray-800">${{ english: "Session Summary", spanish: "Resumen de Sesión", portuguese: "Resumo da Sessão", italian: "Riepilogo della Sessione", french: "Résumé de Session" }[language] ?? "Session Summary"}</h3><p>${last.feedbackSummary ?? ""}</p><p><strong>${{ english: "See you tomorrow for more practice! 👋", spanish: "¡Hasta mañana para seguir practicando! 👋", portuguese: "Até amanhã para mais prática! 👋", italian: "A domani per altra pratica! 👋", french: "À demain pour plus de pratique ! 👋" }[language] ?? "See you tomorrow for more practice! 👋"}</strong></p>`,
      },
    ]);
  } catch (err) {
    console.error("Error loading last session:", err);
  }
};
    checkDailyUsage();
  }, [user, userProfile?.batchId, userProfile?.userKey]);;

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

  // ✅ Early returns DESPUÉS de todos los hooks
  if (!userProfile) {
    return <div className="p-6 text-gray-500 text-center">{t("chat.loadingProfile")}</div>;
  }

  /* =============================================
     🎯 SELECCIÓN DE TOPIC
  ============================================= */
  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
    setShowTopicSelector(false);
    if (messages.length > 1) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
         
content: ({ 
  english: `Great! Let's switch topics. Now we'll talk about <strong>${topic.label}</strong> ${topic.emoji}`,
  spanish: `¡Genial! Cambiamos de tema. Ahora vamos a hablar de <strong>${topic.labelEs}</strong> ${topic.emoji}`,
  portuguese: `Ótimo! Mudamos de tema. Agora vamos falar sobre <strong>${topic.label}</strong> ${topic.emoji}`,
  italian: `Ottimo! Cambiamo argomento. Ora parleremo di <strong>${topic.label}</strong> ${topic.emoji}`,
  french: `Super ! On change de sujet. Maintenant on va parler de <strong>${topic.label}</strong> ${topic.emoji}`,
}[language] ?? `Great! Let's switch topics. Now we'll talk about <strong>${topic.label}</strong> ${topic.emoji}`)
        },
      ]);
    } else {
      setMessages([{ role: "assistant", content: getInitialMessage(rawLang, topic) }]);
    }
  };

  const incrementUsage = (): boolean => {
    const newCount = messageCount + 1;
    setMessageCount(newCount);
    return newCount >= DAILY_MESSAGE_LIMIT;
  };

  // REEMPLAZAR persistUsage
const persistUsage = async (finalCount: number, summaryTaken: boolean) => {
  if (!user || !userProfile?.batchId || !userProfile?.userKey) return;
  const today = new Date().toISOString().split("T")[0];

  const batchRef = doc(db, "alumnos", userProfile.batchId);
  const snap = await getDoc(batchRef);
  if (!snap.exists()) return;

  await setDoc(batchRef, {
    [userProfile.userKey]: {
      ...snap.data()[userProfile.userKey],
      chatDaily: { date: today, count: finalCount, summaryTaken }
    }
  }, { merge: true });
};

  const markSummaryAsTaken = async () => {
  if (!user) return;
  setIsLimitReached(true);
  setLimitReason("summary");
  await persistUsage(messageCount, true);
};

  // Reemplazar la función existente por esta:
const saveConversationToFirestore = async (summary: any) => {
  if (!user || !userProfile?.batchId || !userProfile?.userKey) return;

  

  const sessionData = {
    date: new Date().toISOString(),
    language,
    level,
    topic: selectedTopic?.id ?? null,
    messagesCount: messages.filter((m) => m.role === "user").length,
    feedbackSummary: summary.feedbackSummary ?? "",
    strengths: summary.strengths ?? [],
    weakPoints: summary.weakPoints ?? [],
    commonMistakes: summary.commonMistakes ?? [],
    improvementPlan: summary.improvementPlan ?? "",
    suggestedExercises: summary.suggestedExercises ?? [],
  };

  const batchRef = doc(db, "chatSessions", userProfile.batchId);
  const snap = await getDoc(batchRef);

  const existing: any[] = snap.exists()
    ? snap.data()?.[userProfile.userKey] ?? []
    : [];

  // Mantener solo las últimas 3, agregar la nueva al principio
  const updated = [sessionData, ...existing].slice(0, 3);

  await setDoc(
    batchRef,
    { [userProfile.userKey]: updated },
    { merge: true }
  );
};

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
        body: JSON.stringify({ messages: newMessages, level, language, topicPrompt: selectedTopic?.systemPrompt ?? null }),
      });
      if (!res.body) throw new Error("No stream received");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let partial = ""; let assistantAdded = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        partial += decoder.decode(value, { stream: true });
        if (!assistantAdded) { assistantAdded = true; setMessages((prev) => [...prev, { role: "assistant", content: "" }]); }
        setMessages((prev) => { const updated = [...prev]; updated[updated.length - 1] = { role: "assistant", content: partial }; return updated; });
      }
    } catch (err) {
      console.error("🔥 Streaming error:", err);
    } finally {
    setIsTyping(false);
    if (shouldLock) {
      // ✅ Cuando se acaba el límite por count, disparar el summary automáticamente
      setTimeout(async () => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: ({ english: "⏳ Generating your session summary...", spanish: "⏳ Generando tu resumen de sesión...", portuguese: "⏳ Gerando seu resumo de sessão...", italian: "⏳ Generazione del riepilogo della sessione...", french: "⏳ Génération de votre résumé de session..." }[language] ?? "⏳ Generating your session summary...")
          },
        ]);
 
        try {
          const res = await fetch("/api/chat/summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages, level, language }),
          });
          const summary = await res.json();
 
          console.log("📋 Summary automático (limit reached):", summary);
 
          // Guardar siempre, incompleto o no
          await saveConversationToFirestore(summary);
          await markSummaryAsTaken();
 
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: summary.incomplete
  ? ({ english: "You've reached your daily limit! Great work. Rest and come back tomorrow. 👋", spanish: "¡Has alcanzado tu límite diario! Has hecho un gran trabajo. Descansa y vuelve mañana. 👋", portuguese: "Você atingiu seu limite diário! Ótimo trabalho. Descanse e volte amanhã. 👋", italian: "Hai raggiunto il limite giornaliero! Ottimo lavoro. Riposati e torna domani. 👋", french: "Vous avez atteint votre limite quotidienne ! Bon travail. Reposez-vous et revenez demain. 👋" }[language] ?? "You've reached your daily limit! Great work. Rest and come back tomorrow. 👋")
  : `<h3 class="font-bold text-gray-800">${{ english: "Daily limit reached!", spanish: "¡Límite diario alcanzado!", portuguese: "Limite diário atingido!", italian: "Limite giornaliero raggiunto!", french: "Limite quotidienne atteinte !" }[language] ?? "Daily limit reached!"}</h3><p>${summary.feedbackSummary ?? ""}</p><p><strong>${{ english: "See you tomorrow for more practice! 👋", spanish: "¡Hasta mañana para seguir practicando! 👋", portuguese: "Até amanhã para mais prática! 👋", italian: "A domani per altra pratica! 👋", french: "À demain pour plus de pratique ! 👋" }[language] ?? "See you tomorrow for more practice! 👋"}</strong></p>`
            },
          ]);
        } catch (err) {
          console.error("🔥 Error guardando summary automático:", err);
          // Si falla el summary, igual bloquear y persistir usage
          await persistUsage(messageCount + 1, false);
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: ({ english: "You've reached your daily limit! Great work. Rest and come back tomorrow. 👋", spanish: "¡Has alcanzado tu límite diario! Has hecho un gran trabajo. Descansa y vuelve mañana. 👋", portuguese: "Você atingiu seu limite diário! Ótimo trabalho. Descanse e volte amanhã. 👋", italian: "Hai raggiunto il limite giornaliero! Ottimo lavoro. Riposati e torna domani. 👋", french: "Vous avez atteint votre limite quotidienne ! Bon travail. Reposez-vous et revenez demain. 👋" }[language] ?? "You've reached your daily limit! Great work. Rest and come back tomorrow. 👋")
            },
          ]);
        } finally {
          setLimitReason("count");
          setIsLimitReached(true);
        }
      }, 1000);
    }
  }
  };

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
    } catch (e) { console.error(e); alert({ english: "Could not access microphone.", spanish: "No se pudo acceder al micrófono.", portuguese: "Não foi possível acessar o microfone.", italian: "Impossibile accedere al microfono.", french: "Impossible d'accéder au microphone." }[language] ?? "Could not access microphone.") }
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
      const userMsg: Message = { role: "user", content: data.transcription || "[Audio message]", corrections: data.corrections || [], pronunciation: data.pronunciation || null, isAudio: true };
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
      setMessages((p) => [...p, { role: "assistant", content: ({ english: "Sorry, I couldn't process your audio. Please try again.", spanish: "Lo siento, no pude procesar tu audio. Por favor intentá de nuevo.", portuguese: "Desculpe, não consegui processar seu áudio. Por favor tente novamente.", italian: "Scusa, non sono riuscito a elaborare il tuo audio. Per favore riprova.", french: "Désolé, je n'ai pas pu traiter votre audio. Veuillez réessayer." }[language] ?? "Sorry, I couldn't process your audio. Please try again.") }]);
    } finally { setIsProcessingAudio(false); setIsTyping(false); }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

 const finishConversation = async () => {
  setIsTyping(true);
 
  const studentMessages = messages.filter((m) => m.role === "user");
  const totalUserText = studentMessages.map((m) => m.content).join(" ");
 
  if (studentMessages.length < 2 || totalUserText.trim().length < 20) {
    setMessages((p) => [
      ...p,
      {
        role: "assistant",
        content: `<div style="color:#b91c1c;background:#fee2e2;padding:12px;border-radius:8px;border:1px solid #fecaca"><strong>${t("chat.errors.shortConversationTitle")}</strong><br/>${t("chat.errors.shortConversationBody")}</div>`,
      },
    ]);
    setIsTyping(false);
    return;
  }
 
  try {
    const res = await fetch("/api/chat/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, level, language }),
    });
 
    const summary = await res.json();
 
    // ⚠️ Log para debuggear qué está llegando del summary
    console.log("📋 Summary recibido:", summary);
 
    if (summary.error === "conversation-too-short") {
      setMessages((p) => [
        ...p,
        {
          role: "assistant",
          content: `<div style="color:#b91c1c;background:#fee2e2;padding:12px;border-radius:8px;border:1px solid #fecaca"><strong>${t("chat.errors.shortTitle")}</strong><br/>${t("chat.errors.shortBody2")}</div>`,
        },
      ]);
      setIsTyping(false);
      return;
    }
 
    // ✅ SIEMPRE guardar, incluso si el summary está incompleto
    // Un summary parcial es mejor que nada
    await saveConversationToFirestore(summary);
    await markSummaryAsTaken();
 
    if (summary.incomplete) {
      // Guardamos igual pero mostramos aviso suave (sin return prematuro)
      setMessages((p) => [
        ...p,
        {
          role: "assistant",
          content: `<div style="color:#92400e;background:#fef3c7;padding:12px;border-radius:8px;border:1px solid #fde68a"><strong>${t("chat.errors.partialTitle")}</strong><br/>${t("chat.errors.partialBody")}</div>`,
        },
      ]);
    } else {
      setMessages((p) => [
        ...p,
        {
          role: "assistant",
          content: `<h3 class="font-bold text-gray-800">${{ english: "Final Feedback", spanish: "Feedback Final", portuguese: "Feedback Final", italian: "Feedback Finale", french: "Feedback Final" }[language] ?? "Final Feedback"}</h3><p>${summary.feedbackSummary ?? ""}</p><p><strong>${{ english: "See you tomorrow for more practice! 👋", spanish: "¡Hasta mañana para seguir practicando! 👋", portuguese: "Até amanhã para mais prática! 👋", italian: "A domani per altra pratica! 👋", french: "À demain pour plus de pratique ! 👋" }[language] ?? "See you tomorrow for more practice! 👋"}</strong></p>`,
        },
      ]);
    }
  } catch (err) {
    console.error("🔥 Error en finishConversation:", err);
    setMessages((p) => [
      ...p,
      {
        role: "assistant",
       content: `<div style="color:#b91c1c;background:#fee2e2;padding:12px;border-radius:8px;border:1px solid #fecaca"><strong>⚠️ Error</strong><br/>${{ english: "Something went wrong. Please try again.", spanish: "Algo salió mal. Por favor intentá de nuevo.", portuguese: "Algo deu errado. Por favor tente novamente.", italian: "Qualcosa è andato storto. Per favore riprova.", french: "Quelque chose s'est mal passé. Veuillez réessayer." }[language] ?? "Something went wrong. Please try again."}</div>`
      },
    ]);
  } finally {
    setIsTyping(false);
  }
}

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
  <div
  className="flex flex-col h-full rounded-xl sm:rounded-3xl overflow-hidden shadow-2xl border border-[#EE7203]/30 sm:border-2 sm:border-[#EE7203] relative bg-white"
  style={{
    animation: "fadeInUp 0.6s ease-out forwards",
    opacity: 0,
  }}
>
          {/* HEADER */}
          <div 
  className="px-4 sm:px-8 py-3 sm:py-5 bg-gradient-to-r from-[#0C212D] to-[#112C3E] border-b border-[#EE7203]/30 flex-shrink-0"
>
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
                  <div className="text-[10px] text-white/60">{{ english: "Daily", spanish: "Diario", portuguese: "Diário", italian: "Giornaliero", french: "Quotidien" }[language] ?? "Daily"}: {messageCount}/{DAILY_MESSAGE_LIMIT}</div>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="px-1.5 py-0.5 bg-[#EE7203] text-white text-[10px] font-bold rounded uppercase">{language}</span>
                    <span className="text-white/50 text-xs hidden sm:inline">•</span>
                   <span className="text-white/70 text-[10px]">
  {{ english: "Level", spanish: "Nivel", portuguese: "Nível", italian: "Livello", french: "Niveau" }[language] ?? "Level"} {level}
</span>
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
                <button
                  onClick={() => setShowTopicSelector(true)}
                  disabled={isLimitReached}
                  title={isEs ? "Cambiar temática" : "Change topic"}
                  className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiCompass size={14} />
                  <span className="hidden sm:inline">
  {selectedTopic 
    ? ({ english: "Change topic", spanish: "Cambiar tema", portuguese: "Mudar tema", italian: "Cambia argomento", french: "Changer de sujet" }[language] ?? "Change topic")
    : ({ english: "Choose topic", spanish: "Elegir tema", portuguese: "Escolher tema", italian: "Scegli argomento", french: "Choisir un sujet" }[language] ?? "Choose topic")
  }
</span>
                </button>
                <button
                  data-tutorial="end-button"
                  onClick={finishConversation}
                  disabled={isLimitReached}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-white/10 text-white font-semibold text-xs sm:text-sm hover:bg-[#FF3816] transition-colors duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiStopCircle size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{t("chat.endConversation")}</span>
                  <span className="sm:hidden">{{ english: "End", spanish: "Fin", portuguese: "Fim", italian: "Fine", french: "Fin" }[language] ?? "End"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* CHAT AREA */}
         <div
  data-tutorial="chat-area"
  className="flex-1 overflow-y-auto bg-gray-50 overscroll-contain min-h-0 relative"
>
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
                  {{ english: "Processing audio...", spanish: "Procesando audio...", portuguese: "Processando áudio...", italian: "Elaborazione audio...", french: "Traitement audio..." }[language] ?? "Processing audio..."}
                </div>
              )}
              <div ref={chatEndRef}></div>
            </div>

            {!selectedTopic && !isLimitReached && (
              <TopicSelector language={rawLang} onSelect={handleTopicSelect} currentTopic={null} mode="initial" />
            )}
            {showTopicSelector && selectedTopic && (
              <TopicSelector language={rawLang} onSelect={handleTopicSelect} currentTopic={selectedTopic} mode="change" onClose={() => setShowTopicSelector(false)} />
            )}

            
          </div>

          {/* INPUT AREA */}
          {!isLimitReached ? (
            <div
  ref={inputContainerRef}
  className="bg-white border-t border-gray-200 flex-shrink-0 safe-bottom"
>
              {isRecording && (
                <div className="px-3 sm:px-6 pt-2 pb-1 bg-red-50 border-b border-red-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-red-600 font-medium">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                      <span>{{ english: "Recording...", spanish: "Grabando...", portuguese: "Gravando...", italian: "Registrazione...", french: "Enregistrement..." }[language] ?? "Recording..."}</span>
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
                      placeholder={selectedTopic 
  ? t("chat.inputPlaceholder") 
  : ({ english: "Choose a topic first ↑", spanish: "Primero elegí una temática ↑", portuguese: "Escolha um tema primeiro ↑", italian: "Scegli prima un argomento ↑", french: "Choisissez d'abord un sujet ↑" }[language] ?? "Choose a topic first ↑")
}
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
            <div className="flex flex-col items-center gap-3 pt-4 pb-6 px-4 border-t-2 border-[#EE7203]/30 bg-white/95 backdrop-blur-md safe-bottom">
              <div className="flex items-center gap-2 text-[#EE7203] font-semibold text-sm">
                <FiLock size={16} />
                <span>
                  {{ english: "Come back tomorrow for more practice!", spanish: "¡Volvé mañana para seguir practicando!", portuguese: "Volte amanhã para continuar praticando!", italian: "Torna domani per continuare a praticare!", french: "Revenez demain pour continuer à pratiquer !" }[language] ?? "Come back tomorrow for more practice!"}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                {{ english: "Resets automatically tomorrow", spanish: "Se reinicia automáticamente mañana", portuguese: "Reinicia automaticamente amanhã", italian: "Si ripristina automaticamente domani", french: "Réinitialisation automatique demain" }[language] ?? "Resets automatically tomorrow"}
              </p>
            </div>
          )}
        
          </div> 
  </div>   

      <style jsx global>{`
  .safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
  .overscroll-contain { overscroll-behavior: contain; }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`}</style>
    </>
  );
}