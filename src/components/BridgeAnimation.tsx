"use client";

import { motion } from "framer-motion";

interface BridgeAnimationProps {
  locale?: string;
}

export default function BridgeAnimation({ locale = 'en' }: BridgeAnimationProps) {
  const isFrench = locale === 'fr';
  
  const caption = isFrench 
    ? "Du chaos des données à la croissance intelligente."
    : "From data chaos to intelligent growth.";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className="w-full max-w-6xl mx-auto py-16 px-4"
    >
      <div className="relative">
        {/* Main Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          
          {/* LEFT SIDE: Chaos */}
          <motion.div
            className="flex flex-col items-center justify-center space-y-6 relative"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="text-center mb-4">
              <p className="text-white/40 text-sm uppercase tracking-wider mb-2">
                {isFrench ? 'Avant' : 'Before'}
              </p>
              <div className="h-px w-16 mx-auto bg-gradient-to-r from-transparent via-red-500/30 to-transparent"></div>
            </div>

            {/* Chaotic Icons */}
            <div className="relative w-48 h-48">
              {/* Paper icon - floating randomly */}
              <motion.div
                className="absolute text-4xl"
                animate={{
                  x: [0, -20, 10, -15, 0],
                  y: [0, -15, 10, -5, 0],
                  rotate: [0, -15, 10, -8, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{ top: '10%', left: '10%' }}
              >
                🧾
              </motion.div>

              {/* Hourglass - spinning */}
              <motion.div
                className="absolute text-4xl"
                animate={{
                  x: [0, 15, -10, 20, 0],
                  y: [0, 10, -15, 5, 0],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{ top: '50%', right: '10%' }}
              >
                ⏳
              </motion.div>

              {/* Chat bubble - bouncing */}
              <motion.div
                className="absolute text-4xl"
                animate={{
                  x: [0, -10, 15, -5, 0],
                  y: [0, 20, -10, 15, 0],
                  scale: [1, 0.9, 1.1, 0.95, 1],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{ bottom: '10%', left: '30%' }}
              >
                💬
              </motion.div>

              {/* Chaotic lines */}
              <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 200 200">
                <motion.path
                  d="M 20,40 Q 60,20 100,50 T 180,80"
                  stroke="#ef4444"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="5,5"
                  animate={{
                    strokeDashoffset: [0, -20],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                <motion.path
                  d="M 30,120 Q 80,100 120,130 T 170,150"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="5,5"
                  animate={{
                    strokeDashoffset: [0, 20],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              </svg>
            </div>

            <p className="text-white/50 text-sm text-center max-w-[200px]">
              {isFrench ? 'Processus manuel chaotique' : 'Chaotic manual process'}
            </p>
          </motion.div>

          {/* CENTER: AI Pulse Bridge */}
          <motion.div
            className="flex flex-col items-center justify-center relative"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {/* Glowing AI Core */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              {/* Outer pulse rings */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl"
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.5, 0.2, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/30 to-purple-500/30 blur-lg"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 0.3, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
              />

              {/* Core AI Icon */}
              <motion.div
                className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/50"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(59, 130, 246, 0.5)',
                    '0 0 40px rgba(147, 51, 234, 0.7)',
                    '0 0 20px rgba(59, 130, 246, 0.5)',
                  ],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </motion.div>
            </div>

            {/* Flowing particles left to right */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"
                  initial={{ x: '-100%', y: '50%', opacity: 0 }}
                  animate={{
                    x: ['0%', '200%'],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    delay: i * 0.6,
                    ease: "easeInOut",
                  }}
                  style={{ top: `${20 + i * 12}%` }}
                />
              ))}
            </div>

            <p className="text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text font-bold text-sm mt-6 text-center uppercase tracking-wider">
              {isFrench ? 'Intelligence IA' : 'AI Intelligence'}
            </p>
          </motion.div>

          {/* RIGHT SIDE: Organized Growth */}
          <motion.div
            className="flex flex-col items-center justify-center space-y-6 relative"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="text-center mb-4">
              <p className="text-white/40 text-sm uppercase tracking-wider mb-2">
                {isFrench ? 'Après' : 'After'}
              </p>
              <div className="h-px w-16 mx-auto bg-gradient-to-r from-transparent via-green-500/30 to-transparent"></div>
            </div>

            {/* Organized Icons */}
            <div className="relative w-48 h-48">
              {/* Database icon - stable */}
              <motion.div
                className="absolute text-4xl"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{ top: '15%', left: '15%' }}
              >
                <div className="relative">
                  <div className="absolute inset-0 blur-lg bg-blue-400/40 rounded-full"></div>
                  <span className="relative">💾</span>
                </div>
              </motion.div>

              {/* Light bulb - glowing */}
              <motion.div
                className="absolute text-4xl"
                animate={{
                  filter: [
                    'drop-shadow(0 0 10px rgba(250, 204, 21, 0.5))',
                    'drop-shadow(0 0 20px rgba(250, 204, 21, 0.8))',
                    'drop-shadow(0 0 10px rgba(250, 204, 21, 0.5))',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{ top: '50%', right: '15%' }}
              >
                💡
              </motion.div>

              {/* Chart icon - rising */}
              <motion.div
                className="absolute text-4xl"
                animate={{
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{ bottom: '15%', left: '25%' }}
              >
                <div className="relative">
                  <div className="absolute inset-0 blur-lg bg-green-400/40 rounded-full"></div>
                  <span className="relative">📈</span>
                </div>
              </motion.div>

              {/* Smooth flowing lines */}
              <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 200 200">
                <motion.path
                  d="M 20,60 Q 60,50 100,60 T 180,70"
                  stroke="url(#gradient1)"
                  strokeWidth="3"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                    ease: "easeInOut",
                  }}
                />
                <motion.path
                  d="M 30,100 Q 70,95 110,100 T 170,105"
                  stroke="url(#gradient2)"
                  strokeWidth="3"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                    delay: 0.3,
                    ease: "easeInOut",
                  }}
                />
                <defs>
                  <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
                  </linearGradient>
                  <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <p className="text-white/50 text-sm text-center max-w-[200px]">
              {isFrench ? 'Croissance intelligente automatisée' : 'Intelligent automated growth'}
            </p>
          </motion.div>
        </div>

        {/* Horizontal Bridge Line */}
        <div className="hidden md:block absolute top-1/2 left-0 right-0 -translate-y-1/2 pointer-events-none">
          <div className="relative h-px">
            {/* Background line */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-blue-500/40 to-green-500/20"></div>
            
            {/* Animated flowing gradient */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-500/60 to-purple-500/60"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ width: '30%' }}
            />
          </div>
        </div>

        {/* Mobile: Vertical Bridge Line */}
        <div className="md:hidden absolute left-1/2 top-0 bottom-0 -translate-x-1/2 pointer-events-none w-px">
          <div className="relative h-full">
            {/* Background line */}
            <div className="absolute inset-0 bg-gradient-to-b from-red-500/20 via-blue-500/40 to-green-500/20"></div>
            
            {/* Animated flowing gradient */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-blue-500/60 to-purple-500/60"
              animate={{
                y: ['-100%', '100%'],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ height: '30%' }}
            />
          </div>
        </div>
      </div>

      {/* Caption */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 1 }}
        className="text-center text-white/60 text-sm md:text-base italic mt-12"
      >
        {caption}
      </motion.p>
    </motion.div>
  );
}

