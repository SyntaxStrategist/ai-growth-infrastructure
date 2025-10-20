"use client";

import { motion } from "framer-motion";
import { useLocale } from 'next-intl';

interface FallbackUIProps {
  type?: 'loading' | 'error' | 'empty' | 'offline';
  title?: string;
  message?: string;
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function FallbackUI({ 
  type = 'loading', 
  title, 
  message, 
  icon, 
  action,
  className = '' 
}: FallbackUIProps) {
  const locale = useLocale();
  const isFrench = locale === 'fr';

  const getDefaultContent = () => {
    switch (type) {
      case 'loading':
        return {
          icon: '⏳',
          title: isFrench ? 'Chargement...' : 'Loading...',
          message: isFrench 
            ? 'Nous récupérons vos données, veuillez patienter...' 
            : 'We\'re fetching your data, please wait...'
        };
      case 'error':
        return {
          icon: '⚠️',
          title: isFrench ? 'Erreur de chargement' : 'Loading Error',
          message: isFrench 
            ? 'Impossible de charger les données. Veuillez réessayer.' 
            : 'Unable to load data. Please try again.'
        };
      case 'empty':
        return {
          icon: '📭',
          title: isFrench ? 'Aucune donnée' : 'No Data',
          message: isFrench 
            ? 'Aucune donnée disponible pour le moment.' 
            : 'No data available at the moment.'
        };
      case 'offline':
        return {
          icon: '🔌',
          title: isFrench ? 'Hors ligne' : 'Offline',
          message: isFrench 
            ? 'Connexion temporairement indisponible. Nous réessayerons automatiquement.' 
            : 'Connection temporarily unavailable. We\'ll retry automatically.'
        };
      default:
        return {
          icon: '❓',
          title: isFrench ? 'État inconnu' : 'Unknown State',
          message: isFrench 
            ? 'Une erreur inattendue s\'est produite.' 
            : 'An unexpected error occurred.'
        };
    }
  };

  const content = getDefaultContent();
  const displayIcon = icon || content.icon;
  const displayTitle = title || content.title;
  const displayMessage = message || content.message;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`fallback-container ${className}`}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="fallback-icon"
      >
        {displayIcon}
      </motion.div>
      
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="fallback-title"
      >
        {displayTitle}
      </motion.h3>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="fallback-message"
      >
        {displayMessage}
      </motion.p>

      {action && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          onClick={action.onClick}
          className="btn-primary mt-4"
        >
          {action.label}
        </motion.button>
      )}

      {type === 'loading' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="mt-4 flex space-x-1"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-blue-400 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

// Specialized fallback components for common use cases
export function LoadingFallback({ message, className }: { message?: string; className?: string }) {
  return <FallbackUI type="loading" message={message} className={className} />;
}

export function ErrorFallback({ 
  message, 
  onRetry, 
  className 
}: { 
  message?: string; 
  onRetry?: () => void; 
  className?: string; 
}) {
  const locale = useLocale();
  const isFrench = locale === 'fr';
  
  return (
    <FallbackUI 
      type="error" 
      message={message}
      action={onRetry ? {
        label: isFrench ? 'Réessayer' : 'Retry',
        onClick: onRetry
      } : undefined}
      className={className} 
    />
  );
}

export function EmptyFallback({ message, className }: { message?: string; className?: string }) {
  return <FallbackUI type="empty" message={message} className={className} />;
}

export function OfflineFallback({ className }: { className?: string }) {
  return <FallbackUI type="offline" className={className} />;
}
