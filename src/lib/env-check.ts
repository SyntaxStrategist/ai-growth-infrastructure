/**
 * Environment Variable Checker
 * 
 * Safely verifies that all required environment variables are defined at startup.
 * Uses centralized logger to report missing variables without crashing the application.
 */

import { logInfo, logWarn, logError } from './logger';

// Define required environment variables with their descriptions
interface RequiredEnvVar {
  key: string;
  description: string;
  isCritical: boolean; // Critical vars will log as ERROR, others as WARN
}

// List of required environment variables
const REQUIRED_ENV_VARS: RequiredEnvVar[] = [
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    description: 'Supabase project URL for client-side access',
    isCritical: true
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    description: 'Supabase anonymous key for client-side access',
    isCritical: true
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    description: 'Supabase service role key for server-side operations',
    isCritical: true
  },
  {
    key: 'SECONDARY_DB_URL',
    description: 'Neon database URL for failover functionality',
    isCritical: true
  },
  {
    key: 'OPENAI_API_KEY',
    description: 'OpenAI API key for AI enrichment and processing',
    isCritical: false // Optional but recommended
  }
];

// Optional environment variables (logged as info if present)
const OPTIONAL_ENV_VARS: RequiredEnvVar[] = [
  {
    key: 'NEXT_PUBLIC_APP_URL',
    description: 'Application base URL for webhooks and redirects',
    isCritical: false
  },
  {
    key: 'GMAIL_CLIENT_ID',
    description: 'Gmail OAuth client ID for email integration',
    isCritical: false
  },
  {
    key: 'GMAIL_CLIENT_SECRET',
    description: 'Gmail OAuth client secret for email integration',
    isCritical: false
  },
  {
    key: 'GOOGLE_SHEETS_CREDENTIALS',
    description: 'Google Sheets API credentials for data export',
    isCritical: false
  }
];

/**
 * Check if an environment variable is defined and not empty
 */
function isEnvVarDefined(key: string): boolean {
  const value = process.env[key];
  return value !== undefined && value !== null && value.trim() !== '';
}

/**
 * Get a masked version of an environment variable for logging
 * Shows first 4 and last 4 characters for security
 */
function getMaskedValue(key: string): string {
  const value = process.env[key];
  if (!value) return 'undefined';
  
  if (value.length <= 8) {
    return '*'.repeat(value.length);
  }
  
  const start = value.substring(0, 4);
  const end = value.substring(value.length - 4);
  const middle = '*'.repeat(value.length - 8);
  
  return `${start}${middle}${end}`;
}

/**
 * Check a single environment variable and log appropriate messages
 */
function checkSingleEnvVar(envVar: RequiredEnvVar): boolean {
  const isDefined = isEnvVarDefined(envVar.key);
  const maskedValue = getMaskedValue(envVar.key);
  
  if (isDefined) {
    logInfo(`✅ ${envVar.key}: ${maskedValue}`, { description: envVar.description });
    return true;
  } else {
    const message = `❌ ${envVar.key}: Missing`;
    const logData = { 
      description: envVar.description,
      impact: envVar.isCritical ? 'CRITICAL - Application may not function properly' : 'OPTIONAL - Feature may be limited'
    };
    
    if (envVar.isCritical) {
      logError(message, logData);
    } else {
      logWarn(message, logData);
    }
    
    return false;
  }
}

/**
 * Check all required environment variables
 * @returns Object with check results and summary
 */
export function checkEnv(): {
  allPresent: boolean;
  criticalMissing: string[];
  optionalMissing: string[];
  totalChecked: number;
  totalPresent: number;
} {
  logInfo('🔍 Starting environment variable check...');
  
  const criticalMissing: string[] = [];
  const optionalMissing: string[] = [];
  let totalPresent = 0;
  
  // Check required environment variables
  logInfo('📋 Checking required environment variables:');
  
  for (const envVar of REQUIRED_ENV_VARS) {
    const isPresent = checkSingleEnvVar(envVar);
    
    if (isPresent) {
      totalPresent++;
    } else {
      if (envVar.isCritical) {
        criticalMissing.push(envVar.key);
      } else {
        optionalMissing.push(envVar.key);
      }
    }
  }
  
  // Check optional environment variables
  if (OPTIONAL_ENV_VARS.length > 0) {
    logInfo('📋 Checking optional environment variables:');
    
    for (const envVar of OPTIONAL_ENV_VARS) {
      const isPresent = checkSingleEnvVar(envVar);
      if (isPresent) {
        totalPresent++;
      } else {
        optionalMissing.push(envVar.key);
      }
    }
  }
  
  // Summary
  const totalChecked = REQUIRED_ENV_VARS.length + OPTIONAL_ENV_VARS.length;
  const allPresent = criticalMissing.length === 0;
  
  logInfo('📊 Environment check summary:', {
    totalChecked,
    totalPresent,
    criticalMissing: criticalMissing.length,
    optionalMissing: optionalMissing.length,
    allRequiredPresent: allPresent
  });
  
  if (allPresent) {
    logInfo('✅ All required environment variables present');
  } else {
    if (criticalMissing.length > 0) {
      logError('❌ Critical environment variables missing:', {
        missing: criticalMissing,
        impact: 'Application functionality may be severely limited'
      });
    }
    
    if (optionalMissing.length > 0) {
      logWarn('⚠️ Optional environment variables missing:', {
        missing: optionalMissing,
        impact: 'Some features may be unavailable'
      });
    }
  }
  
  return {
    allPresent,
    criticalMissing,
    optionalMissing,
    totalChecked,
    totalPresent
  };
}

/**
 * Quick check function for specific environment variables
 * @param keys - Array of environment variable keys to check
 * @returns Object with check results
 */
export function checkSpecificEnvVars(keys: string[]): {
  present: string[];
  missing: string[];
} {
  const present: string[] = [];
  const missing: string[] = [];
  
  for (const key of keys) {
    if (isEnvVarDefined(key)) {
      present.push(key);
      logInfo(`✅ ${key}: Present`);
    } else {
      missing.push(key);
      logWarn(`❌ ${key}: Missing`);
    }
  }
  
  return { present, missing };
}

/**
 * Get environment variable status for debugging
 * @param key - Environment variable key
 * @returns Status object with masked value and presence info
 */
export function getEnvVarStatus(key: string): {
  present: boolean;
  maskedValue: string;
  length: number;
} {
  const present = isEnvVarDefined(key);
  const maskedValue = getMaskedValue(key);
  const length = process.env[key]?.length || 0;
  
  return {
    present,
    maskedValue,
    length
  };
}

// Export default function for convenience
export default checkEnv;
