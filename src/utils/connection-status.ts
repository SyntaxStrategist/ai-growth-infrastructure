/**
 * Utility functions for form integration connection status
 */

export type ConnectionStatus = 'connected' | 'warning' | 'disconnected' | 'never';

export interface ConnectionInfo {
  status: ConnectionStatus;
  statusText: string;
  statusTextFr: string;
  lastConnection: string | null;
  timeAgo: string;
  timeAgoFr: string;
  color: string;
  icon: string;
}

/**
 * Calculate connection status based on last_connection timestamp
 */
export function getConnectionStatus(lastConnection: string | null): ConnectionStatus {
  if (!lastConnection) {
    return 'never';
  }

  const lastConnectionDate = new Date(lastConnection);
  const now = new Date();
  const daysSince = (now.getTime() - lastConnectionDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSince < 7) {
    return 'connected';
  } else if (daysSince < 30) {
    return 'warning';
  } else {
    return 'disconnected';
  }
}

/**
 * Format time ago string in a human-readable format
 */
export function formatTimeAgo(timestamp: string | null, locale: 'en' | 'fr' = 'en'): string {
  if (!timestamp) {
    return locale === 'fr' ? 'Jamais' : 'Never';
  }

  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) {
    return locale === 'fr' ? 'À l\'instant' : 'Just now';
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    if (locale === 'fr') {
      return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    if (locale === 'fr') {
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    if (locale === 'fr') {
      return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    }
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  const months = Math.floor(days / 30);
  if (locale === 'fr') {
    return `Il y a ${months} mois`;
  }
  return `${months} month${months > 1 ? 's' : ''} ago`;
}

/**
 * Get full connection information including status, text, and time
 */
export function getConnectionInfo(lastConnection: string | null): ConnectionInfo {
  const status = getConnectionStatus(lastConnection);
  const timeAgo = formatTimeAgo(lastConnection, 'en');
  const timeAgoFr = formatTimeAgo(lastConnection, 'fr');

  const info: Record<ConnectionStatus, { text: string; textFr: string; color: string; icon: string }> = {
    connected: {
      text: 'Connected',
      textFr: 'Connecté',
      color: 'text-green-400',
      icon: '✅',
    },
    warning: {
      text: 'Inactive',
      textFr: 'Inactif',
      color: 'text-yellow-400',
      icon: '⚠️',
    },
    disconnected: {
      text: 'Disconnected',
      textFr: 'Déconnecté',
      color: 'text-red-400',
      icon: '🔴',
    },
    never: {
      text: 'Not Connected',
      textFr: 'Non connecté',
      color: 'text-gray-400',
      icon: '○',
    },
  };

  return {
    status,
    statusText: info[status].text,
    statusTextFr: info[status].textFr,
    lastConnection,
    timeAgo,
    timeAgoFr,
    color: info[status].color,
    icon: info[status].icon,
  };
}

