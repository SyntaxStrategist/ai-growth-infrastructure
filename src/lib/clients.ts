import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Generate a unique client API key
 * Format: client_<32_random_hex_chars>
 */
export function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(16);
  const hexString = randomBytes.toString('hex');
  return `client_${hexString}`;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(key: string): boolean {
  return /^client_[a-f0-9]{32}$/.test(key);
}

/**
 * Generate a secure random client ID
 */
export function generateClientId(): string {
  return crypto.randomUUID();
}

