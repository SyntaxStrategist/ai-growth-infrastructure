import Link from 'next/link';
import { motion } from 'framer-motion';

interface AvenirLogoProps {
  locale?: string;
  showText?: boolean;
  className?: string;
}

export default function AvenirLogo({ locale = 'en', showText = true, className = '' }: AvenirLogoProps) {
  return (
    <Link href={`/${locale}`}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`flex items-center gap-3 cursor-pointer group ${className}`}
      >
        {/* Logo Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
          <div className="relative h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        </div>

        {/* Logo Text */}
        {showText && (
          <div className="flex flex-col">
            <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-purple-300 transition-all">
              AVENIR AI
            </span>
            <span className="text-xs text-white/60">
              {locale === 'fr' ? 'Solutions de Croissance' : 'Growth Solutions'}
            </span>
          </div>
        )}
      </motion.div>
    </Link>
  );
}
