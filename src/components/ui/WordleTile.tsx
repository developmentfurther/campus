"use client";
import { motion } from "framer-motion";

type LetterState = "correct" | "present" | "absent" | "";

export default function WordleTile({
  letter,
  state,
  delay,
}: {
  letter: string;
  state: LetterState;
  delay: number;
}) {
  const bg =
    state === "correct"
      ? "bg-green-500 text-white"
      : state === "present"
      ? "bg-yellow-400 text-white"
      : state === "absent"
      ? "bg-gray-400 text-white"
      : "bg-white text-slate-900 border border-slate-300";

  return (
    <motion.div
      className={`w-14 h-14 rounded-lg flex items-center justify-center font-bold text-2xl ${bg} shadow-sm`}
      initial={{ rotateX: 180 }}  // 👈 EMPIEZA DADA VUELTA
      animate={{ rotateX: state ? 0 : 180 }} // 👈 SE DA VUELTA HACIA ADELANTE
      transition={{ duration: 0.45, delay }}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: delay + 0.2, duration: 0.3 }}
      >
        {letter?.toUpperCase()}
      </motion.div>
    </motion.div>
  );
}
