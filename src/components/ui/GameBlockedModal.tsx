"use client";

import { motion } from "framer-motion";

interface GameBlockedModalProps {
  title: string;
  message: string;
  emoji?: string;
  nextAvailableLabel: string;
  hoursLabel: string;
  minutesLabel: string;
}

export default function GameBlockedModal({
  title,
  message,
  emoji = "⏰",
  nextAvailableLabel,
  hoursLabel,
  minutesLabel
}: GameBlockedModalProps) {
  const time = getTimeUntilMidnight();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center max-w-md w-full overflow-hidden"
      >
        {/* Emoji */}
        <motion.div
          initial={{ rotate: -10, scale: 0.8 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="text-8xl mb-6"
        >
          {emoji}
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl md:text-4xl font-bold mb-4 text-[#EE7203]"
        >
          {title}
        </motion.h2>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-lg mb-6 text-[#112C3E]"
        >
          {message}
        </motion.p>

        {/* Next available */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100"
        >
          <p className="text-sm mb-2 text-[#0C212D]">
            {nextAvailableLabel}
          </p>

          <div className="flex justify-center items-center gap-4">
            <TimeBlock value={time.hours} label={hoursLabel} />
            <span className="text-2xl font-bold text-[#EE7203]">:</span>
            <TimeBlock value={time.minutes} label={minutesLabel} />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white rounded-xl shadow-md px-4 py-3 min-w-[70px] border border-indigo-100">
        <span className="text-3xl font-bold text-[#EE7203]">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-xs mt-2 uppercase tracking-wide text-[#0C212D]">
        {label}
      </span>
    </div>
  );
}

function getTimeUntilMidnight() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);

  const diff = midnight.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes };
}
