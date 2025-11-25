"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { userPlayedToday, updateUserGameAttempt } from "@/lib/games/attempts";
import { getIdiomsBank, IdiomItem } from "@/lib/games/idioms";
import { motion } from "framer-motion";

// Normaliza textos
function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

type Item = IdiomItem;

const GAME_ID = "idioms";

export default function EmojiIdioms() {
  const { user, role, userProfile } = useAuth();
  const { t } = useI18n();

  const lang = userProfile?.learningLanguage?.toLowerCase() || "en";
  const BANK = getIdiomsBank(lang);

  const [item, setItem] = useState<Item | null>(null);
  const [input, setInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);

  const [blocked, setBlocked] = useState(false);
  const [checkingAttempt, setCheckingAttempt] = useState(true);

  // ===========================================
  // Verificación de intento diario
  // ===========================================
  useEffect(() => {
    const check = async () => {
      if (!user) return setCheckingAttempt(false);

      if (role === "admin" || role === "profesor") {
        setCheckingAttempt(false);
        return;
      }

      const played = await userPlayedToday(user.uid, GAME_ID);
      if (played) setBlocked(true);

      setCheckingAttempt(false);
    };

    check();
  }, [user, role]);

  // ===========================================
  // Cargar idiom al cambiar idioma o estado
  // ===========================================
  useEffect(() => {
    if (!checkingAttempt && !blocked) {
      const random = BANK[Math.floor(Math.random() * BANK.length)];
      setItem(random);
      setInput("");
      setRevealed(false);
      setWrongCount(0);
    }
  }, [checkingAttempt, blocked, lang]);

  // ===========================================
  // Handler principal
  // ===========================================
  const correct =
    revealed && item && item.answers.some((a) => norm(a) === norm(input));

  const onCheck = () => {
    if (!item) return;
    if (correct) return;

    const ok = item.answers.some((a) => norm(a) === norm(input));
    setRevealed(true);

    if (!ok) setWrongCount((c) => c + 1);
  };

  // ===========================================
  // Guardar intento si acierta
  // ===========================================
  useEffect(() => {
    const save = async () => {
      if (!revealed || !item) return;
      if (!user) return;
      if (role !== "alumno") return;

      const ok = item.answers.some((a) => norm(a) === norm(input));
      if (!ok) return;

      await updateUserGameAttempt(user.uid, GAME_ID);
      setBlocked(true);
    };

    save();
  }, [revealed, item, user, role]);

  // ===========================================
  // Pistas progresivas
  // ===========================================
  const hints: string[] = [];

  if (item) {
    if (wrongCount >= 1)
      hints.push(
        t("gaming.games.emojiIdioms.hintWords", {
          count: item.answers[0].split(" ").length,
        })
      );

    if (wrongCount >= 2)
      hints.push(
        t("gaming.games.emojiIdioms.hintFirst", {
          first: item.answers[0].split(" ")[0],
        })
      );

    if (wrongCount >= 3) {
      const parts = item.answers[0].split(" ");
      hints.push(
        t("gaming.games.emojiIdioms.hintLast", {
          last: parts[parts.length - 1],
        })
      );
    }

    if (wrongCount >= 4) {
      const target = item.answers[0].split(" ");
      const guessParts = input.split(" ");

      const reveal = target
        .map((w, i) =>
          guessParts[i] && norm(guessParts[i]) === norm(w) ? w : "___"
        )
        .join(" ");

      hints.push(
        t("gaming.games.emojiIdioms.hintReveal", {
          reveal,
        })
      );
    }
  }

  // ===========================================
  // UI – Estados iniciales
  // ===========================================
 

   // Verificando intento
  if (checkingAttempt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-8 border-purple-200" />
            <div className="absolute inset-0 rounded-full border-8 border-t-purple-600 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  // Bloqueado (ya jugó hoy)
  if (blocked && role === "alumno") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md"
        >
          <div className="text-7xl mb-6">⏰</div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            {t("gaming.games.emojiIdioms.alreadyPlayedTitle")}
          </h2>
          <p className="text-slate-600 text-lg">
            {t("gaming.games.emojiIdioms.alreadyPlayedText")}
          </p>
        </motion.div>
      </div>
    );
  }

  // Cargando palabra
  if (!item) {
    return (
       <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-8 border-purple-200" />
            <div className="absolute inset-0 rounded-full border-8 border-t-purple-600 animate-spin" />
          </div>
        </div>
      </div>
    );
  } 


  // ===========================================
  // UI – Juego principal
  // ===========================================
  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="rounded-2xl border p-8 shadow-sm bg-white">
        <div className="text-5xl text-center mb-4">{item.emojis}</div>

        <p className="text-center text-sm text-slate-500 mb-4">
          {t("gaming.games.emojiIdioms.initialHint")}: {item.hint}
        </p>

        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={correct}
            placeholder={t("gaming.games.emojiIdioms.inputPlaceholder")}
            className="flex-1 border p-3 rounded-lg"
            onKeyDown={(e) => e.key === "Enter" && onCheck()}
          />

          <button
            onClick={onCheck}
            disabled={correct || !input.trim()}
            className={`px-4 py-2 rounded-lg text-white transition ${
              correct || !input.trim()
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {t("gaming.games.emojiIdioms.check")}
          </button>
        </div>

        {revealed && (
          <div
            className={`mt-6 p-4 rounded-lg border ${
              correct
                ? "bg-emerald-50 border-emerald-300"
                : "bg-rose-50 border-rose-300"
            }`}
          >
            {correct
              ? t("gaming.games.emojiIdioms.correct")
              : t("gaming.games.emojiIdioms.incorrect")}

            {correct && (
              <>
                <p className="mt-2 text-slate-700">
                  {t("gaming.games.emojiIdioms.answer")}:{" "}
                  {item.answers.join(", ")}
                </p>
                <p className="mt-2 text-slate-500">{item.explain}</p>
              </>
            )}

            {!correct && (
              <p className="mt-2 text-slate-500">
                {t("gaming.games.emojiIdioms.tryAgain")}
              </p>
            )}
          </div>
        )}

        {hints.length > 0 && (
          <div className="mt-6 space-y-2">
            <h4 className="font-semibold">
              {t("gaming.games.emojiIdioms.hints")}
            </h4>
            {hints.map((h, i) => (
              <p key={i} className="bg-slate-100 p-2 rounded text-sm">
                {h}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
