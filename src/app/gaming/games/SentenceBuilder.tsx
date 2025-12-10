"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import {
  userPlayedToday,
  updateUserGameAttempt,
} from "@/lib/games/attempts";
import { motion } from "framer-motion";
import GameBlockedModal from "@/components/ui/GameBlockedModal";
import LoaderGame from "@/components/ui/LoaderGame";
import GameBackground from "@/components/ui/GameBackground";
import { FiZap, FiCheckCircle, FiXCircle, FiRefreshCw } from "react-icons/fi";

type GameStatus = "playing" | "won" | "lost";

interface DragItem {
  id: string;
  word: string;
}

const GAME_ID = "sentence_builder";

export default function SentenceBuilder() {
  const { t } = useI18n();
  const { user, role, userProfile } = useAuth();

  const lang = userProfile?.learningLanguage?.toLowerCase() || "en";

  const [original, setOriginal] = useState<string[]>([]);
  const [pool, setPool] = useState<DragItem[]>([]);
  const [sentence, setSentence] = useState<DragItem[]>([]);

  const [status, setStatus] = useState<GameStatus>("playing");
  const [loading, setLoading] = useState(true);

  // === control de intentos diario
  const [blocked, setBlocked] = useState(false);
  const [checkingAttempt, setCheckingAttempt] = useState(true);

  const [showLoader, setShowLoader] = useState(true);

  // Drag state
  const [draggedItem, setDraggedItem] = useState<{ item: DragItem; from: 'pool' | 'sentence' } | null>(null);

  // ======================================================
  // FETCH SENTENCE (IA + idioma)
  // ======================================================
  const fetchSentence = async () => {
    try {
      setLoading(true);
      setSentence([]);
      setStatus("playing");

      const res = await fetch(`/api/games/sentence-builder?lang=${lang}`);
      const data = await res.json();

      setOriginal(data.words);
      setPool(data.shuffled.map((word: string, i: number) => ({ id: `pool-${i}-${Date.now()}`, word })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // CONTROL DE INTENTOS — Firestore
  // ======================================================
  useEffect(() => {
    // const check = async () => {
    //   if (!user) {
    //     setCheckingAttempt(false);
    //     return;
    //   }

    //   // Admin & Profesor → sin límites
    //   if (role === "admin" || role === "profesor") {
    //     setBlocked(false);
    //     setCheckingAttempt(false);
    //     return;
    //   }

    //   const played = await userPlayedToday(user.uid, GAME_ID);
    //   if (played) setBlocked(true);

    //   setCheckingAttempt(false);
    // };

    // void check();
     setBlocked(false);
  setCheckingAttempt(false);
  }, [user, role]);


   useEffect(() => {
  // Tiempo mínimo de animación del loader
  const timer = setTimeout(() => {
    setShowLoader(false);
  }, 1800); // 1.8 segundos

  return () => clearTimeout(timer);
}, []);

  // ======================================================
  // Cargar ejercicio si NO está bloqueado
  // ======================================================
  useEffect(() => {
    if (!checkingAttempt && !blocked) {
      void fetchSentence();
    }
  }, [checkingAttempt, blocked]);

  // ======================================================
  // DRAG & DROP HANDLERS
  // ======================================================
  const handleDragStart = (item: DragItem, from: 'pool' | 'sentence') => {
    if (status !== "playing") return;
    setDraggedItem({ item, from });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropInSentence = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedItem || status !== "playing") return;

    if (draggedItem.from === 'pool') {
      // Mover del pool a la oración
      setPool(prev => prev.filter(p => p.id !== draggedItem.item.id));
      setSentence(prev => [...prev, draggedItem.item]);
    }

    setDraggedItem(null);
  };

  const handleDropInPool = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedItem || status !== "playing") return;

    if (draggedItem.from === 'sentence') {
      // Mover de la oración al pool
      setSentence(prev => prev.filter(s => s.id !== draggedItem.item.id));
      setPool(prev => [...prev, draggedItem.item]);
    }

    setDraggedItem(null);
  };

  // Click handlers como alternativa
  const moveToSentence = (item: DragItem) => {
    if (status !== "playing") return;
    setPool(prev => prev.filter(p => p.id !== item.id));
    setSentence(prev => [...prev, item]);
  };

  const moveToPool = (item: DragItem) => {
    if (status !== "playing") return;
    setSentence(prev => prev.filter(s => s.id !== item.id));
    setPool(prev => [...prev, item]);
  };

  // Reordenar dentro de la oración
  const handleDropInSentenceItem = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItem || status !== "playing") return;

    if (draggedItem.from === 'sentence') {
      // Reordenar dentro de la oración
      const newSentence = [...sentence];
      const draggedIndex = newSentence.findIndex(s => s.id === draggedItem.item.id);
      
      if (draggedIndex !== -1) {
        newSentence.splice(draggedIndex, 1);
        newSentence.splice(targetIndex, 0, draggedItem.item);
        setSentence(newSentence);
      }
    } else {
      // Mover del pool a una posición específica
      setPool(prev => prev.filter(p => p.id !== draggedItem.item.id));
      const newSentence = [...sentence];
      newSentence.splice(targetIndex, 0, draggedItem.item);
      setSentence(newSentence);
    }

    setDraggedItem(null);
  };

  // ======================================================
  // CHECK ANSWER
  // ======================================================
  const check = () => {
    if (status !== "playing") return;

    const isCorrect = sentence.map(s => s.word).join(" ").trim() === original.join(" ").trim();
    setStatus(isCorrect ? "won" : "lost");
  };

  // ======================================================
  // SAVE ATTEMPT
  // ======================================================
  useEffect(() => {
    // const update = async () => {
    //   if (!user) return;
    //   if (role !== "alumno") return;
    //   if (status === "playing") return;

    //   await updateUserGameAttempt(user.uid, GAME_ID);
    //   setBlocked(true);
    // };

    // void update();
  }, [status, user, role]);

  // ======================================================
  // UI STATES
  // ======================================================
 
 if (checkingAttempt || loading || showLoader) {
  return <LoaderGame />;
}

  // ======================================================
  // UI PRINCIPAL
  // ======================================================
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-4 py-12 overflow-hidden bg-white">
      
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#EE7203]/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-[#FF3816]/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-20 max-w-4xl mx-auto w-full"
      >

        {/* Header */}
        <div className="mb-10 text-center">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-[#EE7203] to-[#FF3816] px-6 py-2 rounded-full mb-6 shadow-lg"
          >
            <FiZap className="text-white" size={20} />
            <span className="text-white font-bold text-sm uppercase tracking-wider">
              Build Challenge
            </span>
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-black text-[#0C212D] mb-3">
            {t("gaming.games.sentenceBuilder.title")}
          </h1>

          <p className="text-[#0C212D]/70 text-base md:text-lg font-medium">
            {t("gaming.games.sentenceBuilder.instructions")}
          </p>
        </div>

        {/* Card principal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-10 border border-gray-200 shadow-2xl mb-8"
        >
          
          {/* Área de construcción de oración */}
          <div className="mb-8">
            <label className="block text-[#0C212D]/60 text-sm font-bold uppercase tracking-wider mb-3">
              📝 {t("gaming.games.sentenceBuilder.buildArea") || "Build your sentence here"}
            </label>
            <div 
              className="min-h-[120px] bg-gradient-to-r from-[#0C212D] to-[#112C3E] rounded-2xl p-6 border-2 border-[#EE7203]/30 shadow-xl"
              onDragOver={handleDragOver}
              onDrop={handleDropInSentence}
            >
              {sentence.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-white/40 text-lg font-medium">
                    {t("gaming.games.sentenceBuilder.dragHere") || "Drag words here..."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3 justify-center items-center">
                  {sentence.map((item, index) => (
                    <motion.div
                      key={item.id}
                      draggable={status === "playing"}
                      onDragStart={() => handleDragStart(item, 'sentence')}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDropInSentenceItem(e, index)}
                      onClick={() => moveToPool(item)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#EE7203] to-[#FF3816] text-white shadow-lg hover:shadow-xl font-bold text-base md:text-lg border-2 border-white/20 cursor-grab active:cursor-grabbing"
                      style={{ opacity: draggedItem?.item.id === item.id ? 0.5 : 1 }}
                    >
                      {item.word}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pool de palabras */}
          <div className="mb-8">
            <label className="block text-[#0C212D]/60 text-sm font-bold uppercase tracking-wider mb-3">
              💡 {t("gaming.games.sentenceBuilder.availableWords") || "Available words"}
            </label>
            <div 
              className="min-h-[100px] bg-gray-50 rounded-2xl p-6 border-2 border-gray-200 shadow-inner"
              onDragOver={handleDragOver}
              onDrop={handleDropInPool}
            >
              {pool.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400 text-lg font-medium">
                    {t("gaming.games.sentenceBuilder.allUsed") || "All words used!"}
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3 justify-center">
                  {pool.map((item) => (
                    <motion.div
                      key={item.id}
                      draggable={status === "playing"}
                      onDragStart={() => handleDragStart(item, 'pool')}
                      onClick={() => moveToSentence(item)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-5 py-3 rounded-full bg-white text-[#0C212D] shadow-md hover:shadow-lg font-bold text-base md:text-lg border-2 border-gray-200 hover:border-[#EE7203]/50 cursor-grab active:cursor-grabbing transition-colors"
                      style={{ opacity: draggedItem?.item.id === item.id ? 0.5 : 1 }}
                    >
                      {item.word}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Estado: Ganado */}
          {status === "won" && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-6 mb-6"
            >
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-green-500 px-8 py-4 rounded-2xl shadow-2xl">
                <FiCheckCircle size={32} className="text-white" />
                <span className="text-white text-xl font-black">{t("gaming.games.sentenceBuilder.correct") || "CORRECT!"}</span>
              </div>

              <p className="text-emerald-600 text-xl md:text-2xl font-bold">
                {t("gaming.games.sentenceBuilder.perfectMessage") || "Perfect! You built the sentence correctly!"} 🎉
              </p>
            </motion.div>
          )}

          {/* Estado: Perdido */}
          {status === "lost" && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-6 mb-6"
            >
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-red-500 to-red-600 px-8 py-4 rounded-2xl shadow-2xl">
                <FiXCircle size={32} className="text-white" />
                <span className="text-white text-xl font-black">{t("gaming.games.sentenceBuilder.incorrect") || "TRY AGAIN!"}</span>
              </div>

              <p className="text-red-600 text-xl md:text-2xl font-bold">
                {t("gaming.games.sentenceBuilder.tryAgainMessage") || "Not quite right. Give it another try!"} 💪
              </p>
            </motion.div>
          )}

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {status === "playing" && (
              <motion.button
                onClick={check}
                disabled={sentence.length === 0}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group px-8 py-4 bg-gradient-to-r from-[#EE7203] to-[#FF3816] rounded-2xl font-bold text-white shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                <FiCheckCircle size={20} />
                {t("gaming.games.sentenceBuilder.check")}
              </motion.button>
            )}

            {(role === "admin" || role === "profesor") && (
              <motion.button
                onClick={fetchSentence}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group px-8 py-4 bg-gradient-to-r from-[#0C212D] to-[#112C3E] rounded-2xl font-bold text-white shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2"
              >
                <FiRefreshCw className="group-hover:rotate-180 transition-transform duration-500" size={20} />
                {t("gaming.games.sentenceBuilder.newSentence")}
              </motion.button>
            )}
          </div>

        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center gap-4 md:gap-6"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-xl px-6 py-3 border border-gray-200 shadow-lg">
            <p className="text-[#0C212D]/60 text-xs font-bold uppercase tracking-wider mb-1">
              {t("gaming.games.sentenceBuilder.wordsInSentence") || "Words in sentence"}
            </p>
            <p className="text-[#EE7203] text-2xl font-black">
              {sentence.length}/{original.length}
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl px-6 py-3 border border-gray-200 shadow-lg">
            <p className="text-[#0C212D]/60 text-xs font-bold uppercase tracking-wider mb-1">
              {t("gaming.games.sentenceBuilder.available") || "Available"}
            </p>
            <p className="text-[#0C212D] text-2xl font-black">{pool.length}</p>
          </div>
        </motion.div>

        {/* Hint instructivo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-center"
        >
          <p className="text-[#0C212D]/50 text-sm font-medium">
            💡 <span className="font-bold">{t("gaming.games.sentenceBuilder.tip") || "Tip"}:</span> {t("gaming.games.sentenceBuilder.tipMessage") || "Drag words to reorder them, or click to move between areas"}
          </p>
        </motion.div>

      </motion.div>
    </div>
  );
}