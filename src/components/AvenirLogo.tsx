'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, memo } from 'react';
import OptimizedImage from './OptimizedImage';

interface AvenirLogoProps {
  locale?: string;
  showText?: boolean;
  className?: string;
  size?: number;
}

const AvenirLogo = memo(function AvenirLogo({ 
  locale = 'en', 
  showText = false, 
  className = '',
  size = 48
}: AvenirLogoProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch from framer-motion animations
  if (!mounted) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="relative">
          <OptimizedImage
            src="/assets/logos/logo.svg"
            alt="Avenir AI Solutions"
            width={size}
            height={size}
            className="object-contain"
            priority
            quality={90}
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
        <OptimizedImage
          src="/assets/logos/logo.svg"
          alt="Avenir AI Solutions"
          width={size}
          height={size}
          className="object-contain"
          priority
          quality={90}
        />
      </div>

      {/* Optional Text */}
      {showText && (
        <motion.div 
          className="flex flex-col"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <span className="text-lg font-bold text-white">
            AVENIR AI
          </span>
          <span className="text-xs text-white/60">
            {locale === 'fr' ? 'Solutions de Croissance' : 'Growth Solutions'}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
});

export default AvenirLogo;
