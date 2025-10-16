'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface AvenirLogoProps {
  locale?: string;
  showText?: boolean;
  className?: string;
}

export default function AvenirLogo({ locale = 'en', showText = false, className = '' }: AvenirLogoProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log('[AvenirLogo] Loading logo from: /assets/logos/logo.svg');
    console.log('[AvenirLogo] Locale:', locale);
    console.log('[AvenirLogo] Show text:', showText);
  }, [locale, showText]);

  // Prevent hydration mismatch from framer-motion animations
  if (!mounted) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="relative">
          <Image
            src="/assets/logos/logo.svg"
            alt="Avenir AI Solutions"
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
            priority
          />
        </div>
        {showText && (
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white">
              AVENIR AI
            </span>
            <span className="text-xs text-white/60">
              {locale === 'fr' ? 'Solutions de Croissance' : 'Growth Solutions'}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`flex items-center gap-3 ${className}`}
    >
      {/* Actual Avenir Logo Image */}
      <div className="relative">
        <Image
          src="/assets/logos/logo.svg"
          alt="Avenir AI Solutions"
          width={48}
          height={48}
          className="h-12 w-12 object-contain"
          priority
        />
      </div>

      {/* Optional Text */}
      {showText && (
        <div className="flex flex-col">
          <span className="text-lg font-bold text-white">
            AVENIR AI
          </span>
          <span className="text-xs text-white/60">
            {locale === 'fr' ? 'Solutions de Croissance' : 'Growth Solutions'}
          </span>
        </div>
      )}
    </motion.div>
  );
}
