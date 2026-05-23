"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // The total animation takes about 2.5 seconds.
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Wait for the exit animation to finish before calling onComplete
      setTimeout(() => {
        onComplete();
      }, 800); // Wait 800ms for slide up to finish
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const word = "LEDGER";

  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0b0f] overflow-hidden"
        >
          {/* Subtle background glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[30rem] h-[30rem] bg-indigo-600/20 rounded-full blur-[100px]" />
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex items-center gap-4 relative z-10"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/50"
            >
              <ShieldCheck className="w-10 h-10 text-white" />
            </motion.div>

            <div className="flex space-x-1 overflow-hidden">
              {word.split("").map((char, index) => (
                <motion.span
                  key={index}
                  variants={letterVariants}
                  className="text-5xl md:text-7xl font-black text-white tracking-widest"
                >
                  {char}
                </motion.span>
              ))}
              <motion.span
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2, duration: 0.4 }}
                className="text-xl md:text-2xl text-indigo-400 font-bold tracking-widest uppercase self-end mb-2 ml-2"
              >
                AI
              </motion.span>
            </div>
          </motion.div>

          {/* Neo-brutalist loading bar */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-20 w-64 h-2 bg-slate-800 rounded-full overflow-hidden border border-black"
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              transition={{ duration: 1.5, ease: "circOut" }}
              className="w-full h-full bg-indigo-500"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
