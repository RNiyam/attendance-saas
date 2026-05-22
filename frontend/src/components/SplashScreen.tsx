"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Hide splash screen after 2.5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0F0F1A] overflow-hidden"
        >
          {/* Animated Background Orbs */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#4F7FFF] blur-[120px] opacity-40"
          />
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
            className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] rounded-full bg-[#7C3AED] blur-[150px] opacity-30"
          />

          <div className="relative z-10 flex flex-col items-center">
            {/* Logo Mark */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1], // Custom spring-like ease
              }}
              className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-[#4F7FFF] to-[#7C3AED] shadow-2xl shadow-blue-500/40 mb-6"
            >
              {/* Glassmorphism reflection */}
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-tr from-white/0 to-white/30 opacity-50" />
              
              <motion.svg
                width="44"
                height="44"
                fill="none"
                viewBox="0 0 16 16"
                aria-hidden
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" fill="white" />
                <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.5" fill="white" opacity="0.65" />
                <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.5" fill="white" opacity="0.65" />
                <rect x="9" y="9" width="5.5" height="5.5" rx="1.5" fill="white" />
              </motion.svg>
            </motion.div>

            {/* Brand Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              <h1 className="text-4xl font-black tracking-[-0.03em] text-white">
                WorkforceOS
              </h1>
              <p className="mt-2 text-sm font-medium tracking-widest text-[#8B8B9E] uppercase">
                Enterprise Attendance
              </p>
            </motion.div>

            {/* Loading Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-12 h-1 w-32 overflow-hidden rounded-full bg-white/10"
            >
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "0%" }}
                transition={{
                  duration: 1.5,
                  ease: "easeInOut",
                  delay: 0.8,
                }}
                className="h-full w-full rounded-full bg-gradient-to-r from-[#4F7FFF] to-[#7C3AED]"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
