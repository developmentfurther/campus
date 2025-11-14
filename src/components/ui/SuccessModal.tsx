"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FiCheckCircle } from "react-icons/fi";

export default function SuccessModal({
  open,
  message = "Guardado correctamente",
}: {
  open: boolean;
  message?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm flex items-center justify-center px-6"
        >
          <motion.div
            initial={{ y: 12, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 8, opacity: 0, scale: 0.97 }}
            transition={{
              duration: 0.22,
              ease: "easeOut",
            }}
            className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center"
          >
            <FiCheckCircle className="text-green-500 text-5xl mx-auto mb-3" />
            <h2 className="text-xl font-semibold text-gray-800">{message}</h2>
            <p className="text-gray-500 mt-1 text-sm">
              Tus cambios fueron guardados exitosamente.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
